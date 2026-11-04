"""Gemeinsame Controller-Logik aller Belege mit Positionen (Angebot, AB, Rechnung, Gutschrift, Eingangsrechnung).

BelegMixin wird neben Document geerbt:  class PHAngebot(BelegMixin, Document)
  kontakt_uebernehmen()   Kundenname und Rechnungsadresse aus PH Kontakt (ph_crm), nur wenn leer
  steuerfall_setzen()     USt-Fall aus Land/UID (+ OSS-Schalter), Hinweistext, Positions-Sätze anpassen
  positionen_berechnen()  Cent-Summen, USt-Aufteilung (PH Beleg Steuer), Kleinbetrag
  produkt_uebernehmen()   Bezeichnung/Marke/Preis aus PH Produkt (ph_sortiment), wenn Zeile leer
  positionen_kopieren()   Positionen von Quellbeleg übernehmen (mit ab_position-Verweis)
"""

import frappe
from frappe import _
from frappe.utils import cint, flt, strip_html

from ph_faktura import einstellungen
from ph_faktura.rechenwerk import steuer as S

KOPF_FELDER = ("kunde_name", "firma", "strasse", "plz", "ort", "land", "uid_empfaenger", "sprache", "waehrung", "projekt", "kontakt")
POSITIONS_FELDER = ("art", "alternativ", "produkt", "ausfuehrung", "bezeichnung", "marke", "ausfuehrung_text", "beschreibung", "menge", "einheit",
                    "einzel_netto_cent", "rabatt_promille", "ust_satz_promille", "lieferzeit_text", "raum", "lieferant", "einkauf_cent")


# PH Produkt (ph_sortiment) → Belegposition: Feldnamen und Umrechnung (geprüft 04.11.2026)
PRODUKT_FELDER = ["titel", "marke", "aktueller_preis_cent", "preisart", "ust_klasse", "lieferzeit_text_de", "einkaufspreis_cent"]
UST_KLASSE_SATZ = {"normal": 2000, "ermaessigt": 1000}  # Int ×100 wie ph_shop.ust.UST_SAETZE_PROMILLE["AT"]


def produkt_ust_satz_promille(ust_klasse):
    """PH Produkt.ust_klasse (normal|ermaessigt) → Steuersatz Int ×100 (AT); das Zielland regelt steuerfall_setzen."""
    try:
        from ph_shop.ust import UST_SAETZE_PROMILLE

        return cint(UST_SAETZE_PROMILLE["AT"].get((ust_klasse or "normal").lower(), 2000))
    except ImportError:
        return UST_KLASSE_SATZ.get((ust_klasse or "normal").lower(), 2000)


def brutto_zu_netto_cent(brutto_cent, satz_promille):
    """Shop-/Listenpreise sind Brutto; Belegpositionen führen einzel_netto_cent (kaufmännisch gerundet)."""
    from decimal import ROUND_HALF_UP, Decimal

    return int((Decimal(int(brutto_cent)) * 10000 / (10000 + int(satz_promille or 0))).quantize(Decimal(1), rounding=ROUND_HALF_UP))


class BelegMixin:
    nur_leistungen_fuer_rc = True

    # ── Kunde und Adresse ────────────────────────────────────────────────────
    def kontakt_uebernehmen(self):
        if not self.get("kontakt") or not frappe.db.exists("DocType", "PH Kontakt"):
            return
        try:
            k = frappe.db.get_value("PH Kontakt", self.kontakt, ["anrede", "vorname", "nachname", "firma", "strasse", "plz", "ort", "land", "uid", "sprache", "email"], as_dict=True)
        except Exception:  # noqa: BLE001 – Feldnamen des Kontakts liefert ph_crm; fehlende Felder dürfen nicht stören
            k = frappe.db.get_value("PH Kontakt", self.kontakt, ["name"], as_dict=True)
        if not k:
            return
        if not self.get("kunde_name"):
            name = " ".join(x for x in (k.get("vorname"), k.get("nachname")) if x) or k.get("firma") or self.kontakt
            self.kunde_name = name[:140]
        for quelle, ziel in (("firma", "firma"), ("strasse", "strasse"), ("plz", "plz"), ("ort", "ort"), ("uid", "uid_empfaenger")):
            if not self.get(ziel) and k.get(quelle):
                self.set(ziel, k.get(quelle))
        if k.get("land") and (not self.get("land") or self.get("land") == "AT") and S.land_code(k.get("land")) != "AT":
            self.land = S.land_code(k.get("land"))
        if k.get("sprache") and not self.get("sprache"):
            self.sprache = k.get("sprache")[:2]

    def kontakt_email(self):
        if self.get("kontakt") and frappe.db.exists("DocType", "PH Kontakt"):
            try:
                return frappe.db.get_value("PH Kontakt", self.kontakt, "email")
            except Exception:  # noqa: BLE001
                return None
        return None

    # ── Steuer ───────────────────────────────────────────────────────────────
    def steuerfall_setzen(self):
        e = einstellungen.faktura()
        self.land = S.land_code(self.get("land") or "AT")
        nur_leistungen = all((p.art in ("Leistung", "Planungsleistung")) for p in self.positionen if p.art not in ("Text", "Zwischensumme", "Rabatt")) if self.positionen else False
        fall, oss_land = S.ust_fall_bestimmen(self.land, self.get("uid_empfaenger"), nur_leistungen=nur_leistungen, oss_aktiv=bool(e.get("oss_aktiv")))
        self.ust_fall = fall
        if self.meta.has_field("oss_land"):
            self.oss_land = oss_land
        self.ust_hinweistext = S.hinweistext(fall, einstellungen.ust_texte(), oss_land)
        if fall == S.FALL_AT and self.get("art") == "Anzahlungsrechnung" and self.meta.has_field("art"):
            self.ust_hinweistext = e.get("ust_text_anzahlung") or ""
        for p in self.positionen:
            satz = cint(p.ust_satz_promille)
            if fall == S.FALL_AT:
                if satz not in S.SAETZE_AT:
                    p.ust_satz_promille = S.SATZ_NORMAL
            elif fall == S.FALL_OSS:
                basis = satz if satz in S.SAETZE_AT else S.SATZ_NORMAL
                p.ust_satz_promille = S.satz_fuer_fall(fall, basis, oss_land)
            else:
                p.ust_satz_promille = 0

    # ── Positionen ───────────────────────────────────────────────────────────
    def produkt_uebernehmen(self):
        if not frappe.db.exists("DocType", "PH Produkt"):
            return
        for p in self.positionen:
            if not p.produkt or (p.bezeichnung and p.einzel_netto_cent):
                continue
            # Feldnamen laut ph_sortiment PH Produkt (geprüft 04.11.): titel, marke, aktueller_preis_cent (Brutto,
            # nur bei preisart Verkaufspreis/UVP), ust_klasse (normal|ermaessigt), lieferzeit_text_de, einkaufspreis_cent
            prod = frappe.db.get_value("PH Produkt", p.produkt, PRODUKT_FELDER, as_dict=True)
            if not prod:
                continue
            satz = produkt_ust_satz_promille(prod.get("ust_klasse"))
            p.bezeichnung = p.bezeichnung or prod.get("titel") or p.produkt
            p.marke = p.marke or prod.get("marke")
            if not p.ust_satz_promille:
                p.ust_satz_promille = satz
            if not p.einzel_netto_cent and prod.get("aktueller_preis_cent") and prod.get("preisart") in ("Verkaufspreis", "UVP"):
                p.einzel_netto_cent = brutto_zu_netto_cent(cint(prod.get("aktueller_preis_cent")), cint(p.ust_satz_promille) or satz)
            if not p.get("einkauf_cent") and prod.get("einkaufspreis_cent"):
                p.einkauf_cent = cint(prod.get("einkaufspreis_cent"))
            p.lieferzeit_text = p.lieferzeit_text or prod.get("lieferzeit_text_de")

    def positionen_pruefen(self):
        for p in self.positionen:
            if p.art in ("Text", "Zwischensumme"):
                p.menge = 0
                p.einzel_netto_cent = 0
                continue
            if not p.bezeichnung and not p.produkt:
                frappe.throw(_("Position {0}: Bezeichnung oder Produkt fehlt.").format(p.idx))
            if flt(p.menge) <= 0:
                frappe.throw(_("Position {0}: Menge muss größer 0 sein.").format(p.idx))
            if cint(p.ust_satz_promille) < 0 or cint(p.ust_satz_promille) > 3000:
                frappe.throw(_("Position {0}: USt-Satz unplausibel.").format(p.idx))
            if p.art == "Rabatt" and cint(p.einzel_netto_cent) > 0:
                p.einzel_netto_cent = -cint(p.einzel_netto_cent)
            if cint(p.rabatt_promille) < 0 or cint(p.rabatt_promille) > 1000:
                frappe.throw(_("Position {0}: Rabatt zwischen 0 und 1000 ‰.").format(p.idx))

    def positionen_berechnen(self):
        s = S.summen(self.positionen)
        self.netto_cent = s["netto_cent"]
        self.rabatt_gesamt_cent = s["rabatt_gesamt_cent"]
        self.ust_cent = s["ust_cent"]
        self.brutto_cent = s["brutto_cent"]
        if self.meta.has_field("alternativ_cent"):
            self.alternativ_cent = s["alternativ_cent"]
        self.set("ust_aufteilung", [])
        for a in s["aufteilung"]:
            self.append("ust_aufteilung", {"bezeichnung": a["bezeichnung"], "ust_satz_promille": a["ust_satz_promille"], "netto_cent": a["netto_cent"], "ust_cent": a["ust_cent"], "brutto_cent": a["brutto_cent"]})
        if self.meta.has_field("kleinbetragsrechnung"):
            self.kleinbetragsrechnung = 1 if S.ist_kleinbetrag(self.brutto_cent, einstellungen.faktura()["kleinbetragsgrenze_cent"]) else 0
        return s

    def positionen_kopieren(self, quelle, nur_mit_menge=None, mengen=None, ohne_alternativ=True):
        """Positionen eines Quellbelegs übernehmen. mengen: {quellzeilen_name: menge} für Teilmengen.
        nur_mit_menge: Callable(zeile) → menge oder None (überspringen)."""
        self.set("positionen", [])
        for q in quelle.positionen:
            if ohne_alternativ and q.get("alternativ"):
                continue
            menge = flt(q.menge)
            if mengen is not None:
                if q.name not in mengen:
                    continue
                menge = flt(mengen[q.name])
            elif nur_mit_menge:
                menge = nur_mit_menge(q)
                if menge is None or (menge <= 0 and q.art not in ("Text", "Zwischensumme")):
                    continue
            zeile = {f: q.get(f) for f in POSITIONS_FELDER}
            zeile["menge"] = menge
            zeile["alternativ"] = 0
            zeile["ab_position"] = q.name if quelle.doctype == "PH Auftragsbestaetigung" else q.get("ab_position")
            self.append("positionen", zeile)

    def kopf_kopieren(self, quelle):
        for f in KOPF_FELDER:
            if self.meta.has_field(f) and quelle.meta.has_field(f) and quelle.get(f) is not None:
                self.set(f, quelle.get(f))

    def kurz(self, laenge=60):
        erste = next((p for p in self.positionen if p.bezeichnung), None)
        if not erste:
            return ""
        txt = strip_html(erste.bezeichnung)
        mehr = len([p for p in self.positionen if p.art not in ("Text", "Zwischensumme")]) - 1
        return (txt + (f" (+{mehr})" if mehr > 0 else ""))[:laenge]

    def zahlungsbedingung_text(self):
        if self.get("zahlungsbedingung"):
            return frappe.db.get_value("PH Zahlungsbedingung", self.zahlungsbedingung, "text") or ""
        return ""
