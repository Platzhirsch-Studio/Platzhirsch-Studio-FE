"""PH Auftragsbestaetigung – Auftrag/Kaufvertrag mit Zahlungsplan, Anzahlungs- und Abrechnungsstand.

Anzahlungsfluss (PLAN.md WP6, Vorbild marahrw7):
  AB mit Zahlungsplan → anzahlungsrechnung_erstellen() (automatisch bei Anlage, wenn Einstellung aktiv)
  → OP gegen Auftrag (anzahlung_soll/ist) → Zahlung → USt fällig (Rechnung) → Teil-/Schlussrechnung
  (rechnung_erstellen) mit Anzahlungsverrechnung je USt-Satz.
"""

from decimal import Decimal

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, cint, flt, getdate, now_datetime, nowdate

from ph_faktura import einstellungen, journal, versand
from ph_faktura.beleg import BelegMixin
from ph_faktura.rechenwerk import anzahlung as A
from ph_faktura.rechenwerk import steuer as S

AKTIV = ("Offen", "In Bestellung", "Teilgeliefert", "Geliefert")


class PHAuftragsbestaetigung(BelegMixin, Document):
    def onload(self):
        self.set_onload("kontakt_email", self.kontakt_email())
        self.set_onload("doctypes", {dt: bool(frappe.db.exists("DocType", dt)) for dt in ("PH Herstellerbestellung", "PH Lieferschein", "PH Anzahlung")})

    def before_insert(self):
        self.status = self.status or "Offen"

    def validate(self):
        e = einstellungen.faktura()
        self.kontakt_uebernehmen()
        self.produkt_uebernehmen()
        self.positionen_pruefen()
        if self.status == "Storniert" and not self.flags.ph_system:
            frappe.throw(_("Stornierte Aufträge können nicht geändert werden."))
        self.steuerfall_setzen()
        self.positionen_berechnen()
        if not self.zahlungsbedingung and e.get("standard_zahlungsbedingung"):
            self.zahlungsbedingung = e["standard_zahlungsbedingung"]
        self.zahlungsplan_pruefen()
        self.fagg_frist_ende = add_days(self.datum, 14) if self.vertragsort in ("Beim Kunden", "Fernabsatz") else None
        if not self.schluss:
            self.schluss = e.get("ab_schluss")
        self.titel = f"{self.kunde_name or self.kontakt}: {self.kurz()}"[:140]
        self.stand_aktualisieren(speichern=False)

    def zahlungsplan_pruefen(self):
        if not self.zahlungsplan and self.zahlungsbedingung:
            from ph_faktura.ph_faktura.doctype.ph_angebot.ph_angebot import plan_aus_bedingung

            for z in plan_aus_bedingung(frappe.get_cached_doc("PH Zahlungsbedingung", self.zahlungsbedingung)):
                self.append("zahlungsplan", z)
        A.zahlungsplan_betraege(self.brutto_cent, self.zahlungsplan)
        summe = sum(cint(z.betrag_cent) for z in self.zahlungsplan)
        if self.zahlungsplan and summe != cint(self.brutto_cent):
            frappe.throw(_("Zahlungsplan ({0} Cent) entspricht nicht dem Bruttobetrag ({1} Cent).").format(summe, self.brutto_cent))
        anz = [z for z in self.zahlungsplan if z.art == "Anzahlung"]
        self.anzahlung_prozent = sum(cint(z.prozent) for z in anz)
        for z in self.zahlungsplan:
            if z.faellig_bei == "Datum" and not z.faellig:
                frappe.throw(_("Zahlungsplan: Fälligkeitsdatum fehlt."))

    def after_insert(self):
        if einstellungen.faktura().get("anzahlung_automatisch") and any(z.art == "Anzahlung" and cint(z.betrag_cent) > 0 for z in self.zahlungsplan):
            try:
                self.anzahlungsrechnung_erstellen()
            except Exception:  # noqa: BLE001 – darf das Anlegen nie verhindern
                frappe.log_error(title=f"PH AB {self.name}: automatische Anzahlungsrechnung")

    # ── Stand ────────────────────────────────────────────────────────────────
    def stand_aktualisieren(self, speichern=False):
        self.auftragswert_cent = cint(self.brutto_cent)
        self.anzahlung_soll_cent = sum(cint(z.betrag_cent) for z in self.zahlungsplan if z.art == "Anzahlung")
        rechnungen = []
        if not self.is_new():
            rechnungen = frappe.get_all("PH Rechnung", filters={"auftrag": self.name, "docstatus": 1, "status": ("!=", "Storniert")}, fields=["name", "art", "brutto_cent", "zahlbar_cent", "bezahlt_cent", "offen_cent", "status"])
        je_rechnung = {r.name: r for r in rechnungen}
        self.anzahlung_ist_cent = sum(cint(r.bezahlt_cent) for r in rechnungen if r.art == "Anzahlungsrechnung")
        self.abgerechnet_cent = sum(cint(r.brutto_cent) for r in rechnungen if r.art != "Anzahlungsrechnung")
        self.bezahlt_cent = sum(cint(r.bezahlt_cent) for r in rechnungen)
        self.offen_cent = max(cint(self.auftragswert_cent) - cint(self.bezahlt_cent), 0) if self.status != "Storniert" else 0
        geliefert = Decimal(0)
        for p in self.positionen:
            if p.art in ("Text", "Zwischensumme") or p.alternativ or flt(p.menge) <= 0:
                continue
            anteil = min(flt(p.lieferschein_menge) / flt(p.menge), 1.0)
            geliefert += Decimal(cint(p.brutto_cent)) * Decimal(str(anteil))
        self.geliefert_cent = int(geliefert)
        for z in self.zahlungsplan:
            r = je_rechnung.get(z.rechnung) if z.rechnung else None
            if r:
                z.bezahlt_cent = cint(r.bezahlt_cent)
                z.status = "Bezahlt" if r.status == "Bezahlt" else "In Rechnung"
            elif z.rechnung and not frappe.db.exists("PH Rechnung", z.rechnung):
                z.rechnung = None
                z.status = "Offen"
        if speichern and not self.is_new():
            self.db_set({f: self.get(f) for f in ("auftragswert_cent", "anzahlung_soll_cent", "anzahlung_ist_cent", "abgerechnet_cent", "bezahlt_cent", "offen_cent", "geliefert_cent")}, update_modified=False)
            for z in self.zahlungsplan:
                frappe.db.set_value("PH Zahlungsplan", z.name, {"bezahlt_cent": z.bezahlt_cent, "status": z.status, "rechnung": z.rechnung}, update_modified=False)
            if any(r.art == "Schlussrechnung" for r in rechnungen) and self.status in AKTIV:
                self.status_setzen("Abgerechnet")

    def status_setzen(self, status, **werte):
        self.db_set({"status": status, "workflow_state": f"PH {status}", **werte}, update_modified=True)

    # ── Rechnungen ───────────────────────────────────────────────────────────
    def _rechnung_basis(self, art):
        re = frappe.new_doc("PH Rechnung")
        re.kopf_kopieren(self)
        re.update(
            {
                "art": art,
                "auftrag": self.name,
                "angebot": self.angebot,
                "bestellung": self.bestellung,
                "datum": nowdate(),
                "zahlungsziel_tage": frappe.db.get_value("PH Zahlungsbedingung", self.zahlungsbedingung, "zieltage") if self.zahlungsbedingung else einstellungen.faktura()["zahlungsziel_tage"],
                "einleitung": None,
                "quelle": "backoffice",
            }
        )
        return re

    @frappe.whitelist()
    def anzahlungsrechnung_erstellen(self, zeile=None):
        """Button „Anzahlungsrechnung erstellen“: je offener Anzahlungs-Zeile des Zahlungsplans eine
        Rechnung (Art Anzahlungsrechnung) mit einer Position je USt-Satz, Entwurf → Buchhaltung stellt."""
        self.check_permission("write")
        return self.anzahlungsrechnungen_anlegen(zeile)

    def anzahlungsrechnungen_anlegen(self, zeile=None, ignore_permissions=False):
        """Ohne Button-Rechteprüfung – Aufruf aus der Kassa-Anbindung (ph_faktura.ph_faktura.kassa)."""
        if self.status == "Storniert":
            frappe.throw(_("Auftrag ist storniert."))
        zeilen = [z for z in self.zahlungsplan if z.art == "Anzahlung" and not z.rechnung and cint(z.betrag_cent) > 0 and (not zeile or z.name == zeile)]
        if not zeilen:
            frappe.throw(_("Keine offene Anzahlungszeile im Zahlungsplan."))
        namen = []
        for z in zeilen:
            re = self._rechnung_basis("Anzahlungsrechnung")
            re.anzahlungsplan_zeile = z.name
            re.anzahlung_prozent = cint(z.prozent)
            re.leistungsdatum = None
            re.leistungszeitraum_von = self.datum
            re.leistungszeitraum_bis = self.liefertermin_bestaetigt or self.liefertermin_geplant or add_days(self.datum, 90)
            re.faellig = add_days(nowdate(), 7)
            aufteilung = [{"ust_satz_promille": a.ust_satz_promille, "netto_cent": a.netto_cent, "ust_cent": a.ust_cent, "brutto_cent": a.brutto_cent} for a in self.ust_aufteilung]
            for t in A.anzahlung_aufteilen(aufteilung, betrag_brutto_cent=cint(z.betrag_cent)):
                prozent = f"{z.prozent} % " if z.prozent else ""
                re.append("positionen", {
                    "art": "Leistung",
                    "bezeichnung": _("Anzahlung {0}gemäß Auftragsbestätigung {1}").format(prozent, self.name),
                    "ausfuehrung_text": _("Anteil Leistungen zu {0}").format(S.satz_prozent_text(t["ust_satz_promille"])),
                    "menge": 1,
                    "einheit": "Pausch",
                    "einzel_netto_cent": t["netto_cent"],
                    "ust_satz_promille": t["ust_satz_promille"],
                })
            re.flags.ph_anzahlung = True
            re.insert(ignore_permissions=ignore_permissions)
            frappe.db.set_value("PH Zahlungsplan", z.name, {"rechnung": re.name, "status": "In Rechnung"}, update_modified=False)
            namen.append(re.name)
            journal.schreibe("Anzahlung", re, re.brutto_cent, f"Anzahlungsrechnung zu {self.name} ({z.prozent} %)")
        self.add_comment("Info", _("Anzahlungsrechnung(en) {0} erzeugt").format(", ".join(namen)))
        return namen[0] if len(namen) == 1 else namen

    @frappe.whitelist()
    def rechnung_erstellen(self, art="Schlussrechnung", mengen=None):
        """Button „Teil-/Schlussrechnung erstellen“. mengen: {positions_zeile: menge} für Teilrechnung
        (Standard: gelieferte, noch nicht abgerechnete Menge). Anzahlungen werden verrechnet."""
        self.check_permission("write")
        if art not in ("Teilrechnung", "Schlussrechnung", "Rechnung"):
            frappe.throw(_("Unbekannte Rechnungsart."))
        if self.status == "Storniert":
            frappe.throw(_("Auftrag ist storniert."))
        if isinstance(mengen, str):
            mengen = frappe.parse_json(mengen)
        re = self._rechnung_basis(art)
        if art == "Teilrechnung":
            if mengen:
                re.positionen_kopieren(self, mengen={k: flt(v) for k, v in mengen.items() if flt(v) > 0})
            else:
                re.positionen_kopieren(self, nur_mit_menge=lambda q: max(flt(q.lieferschein_menge) - flt(q.rechnung_menge), 0) if q.art not in ("Text", "Zwischensumme") else None)
            re.teillieferung_hinweis = _("Teillieferung zu {0}").format(self.name)
        else:
            re.positionen_kopieren(self, nur_mit_menge=lambda q: max(flt(q.menge) - flt(q.rechnung_menge), 0) if q.art not in ("Text", "Zwischensumme") else flt(q.menge))
        if not [p for p in re.positionen if p.art not in ("Text", "Zwischensumme")]:
            frappe.throw(_("Keine offenen Mengen für diese Rechnung (alles bereits abgerechnet oder nichts geliefert)."))
        re.leistungsdatum = self.liefertermin_bestaetigt or nowdate()
        re.schluss = einstellungen.faktura().get("rechnung_schluss")
        re.insert()
        re.anzahlungen_verrechnen(speichern=True)
        self.add_comment("Info", _("{0} {1} erzeugt").format(_(art), re.name))
        return re.name

    @frappe.whitelist()
    def rechnung_vorschau(self, art="Schlussrechnung", mengen=None):
        """Trockenlauf Teil-/Schlussrechnung (Konzept 10-faktura §12 Nr. 1): Entwurf in einem Savepoint bauen,
        Summen/Anzahlungsabzug lesen, alles zurückrollen – es entsteht kein Beleg und kein Zähler."""
        self.check_permission("read")
        frappe.db.savepoint("ph_rechnung_vorschau")
        try:
            re = frappe.get_doc("PH Rechnung", self.rechnung_erstellen(art=art, mengen=mengen))
            return {
                "art": art, "netto_cent": re.netto_cent, "ust_cent": re.ust_cent, "brutto_cent": re.brutto_cent,
                "anzahlung_brutto_cent": re.anzahlung_brutto_cent, "zahlbar_cent": re.zahlbar_cent,
                "positionen": [{"bezeichnung": p.bezeichnung, "menge": p.menge, "netto_cent": p.netto_cent, "ust_satz_promille": p.ust_satz_promille} for p in re.positionen],
                "ust_aufteilung": [{"ust_satz_promille": a.ust_satz_promille, "netto_cent": a.netto_cent, "ust_cent": a.ust_cent} for a in re.ust_aufteilung],
                "anzahlungen": [{"anzahlungsrechnung": a.anzahlungsrechnung, "brutto_cent": a.brutto_cent, "ust_cent": a.ust_cent} for a in re.anzahlungen_verrechnet],
            }
        finally:
            frappe.db.rollback(save_point="ph_rechnung_vorschau")

    def offene_anzahlungen(self, ausser=None):
        """Noch nicht verrechnete Anzahlungsbeträge je Anzahlungsrechnung und USt-Satz (für PH Rechnung)."""
        ar = frappe.get_all("PH Rechnung", filters={"auftrag": self.name, "art": "Anzahlungsrechnung", "docstatus": 1, "status": ("!=", "Storniert")}, fields=["name", "datum"])
        liste = []
        for a in ar:
            auf = frappe.get_all("PH Beleg Steuer", filters={"parent": a.name, "parenttype": "PH Rechnung", "parentfield": "ust_aufteilung"}, fields=["ust_satz_promille", "netto_cent", "ust_cent", "brutto_cent"])
            liste.append({"name": a.name, "datum": a.datum, "aufteilung": auf})
        verrechnete_in = frappe.get_all("PH Rechnung", filters={"auftrag": self.name, "art": ("in", ("Teilrechnung", "Schlussrechnung", "Rechnung")), "docstatus": 1, "status": ("!=", "Storniert"), "name": ("!=", ausser or "")}, pluck="name")
        bereits = frappe.get_all("PH Rechnung Anzahlung", filters={"parent": ("in", verrechnete_in), "parenttype": "PH Rechnung"}, fields=["anzahlungsrechnung", "ust_satz_promille", "netto_cent", "ust_cent", "brutto_cent"]) if verrechnete_in else []
        return A.offene_anzahlungen(liste, bereits)

    # ── Weitere Buttons ──────────────────────────────────────────────────────
    @frappe.whitelist()
    def herstellerbestellungen_erzeugen(self):
        """Button: je Lieferant eine PH Herstellerbestellung (ph_sortiment) aus den Positionen."""
        self.check_permission("write")
        if not frappe.db.exists("DocType", "PH Herstellerbestellung"):
            frappe.throw(_("DocType PH Herstellerbestellung (ph_sortiment) ist noch nicht installiert."))
        je_lieferant = {}
        for p in self.positionen:
            if p.art != "Produkt" or p.alternativ or p.herstellerbestellung_position:
                continue
            je_lieferant.setdefault(p.lieferant or "", []).append(p)
        if not je_lieferant:
            frappe.throw(_("Keine offenen Produktpositionen (ohne Herstellerbestellung)."))
        namen = []
        for lieferant, pos in je_lieferant.items():
            # Feldnamen laut ph_sortiment PH Herstellerbestellung (geprüft 04.11.): bezug_doctype/bezug_name (Dynamic Link),
            # kommission, wunschtermin; Positionen: produkt, ausfuehrung, bezeichnung, ausfuehrung_text, menge (Int), vk_cent, ek_cent, kommission
            kommission = " / ".join(x for x in (self.kunde_name, self.projekt) if x)[:140]
            hb = frappe.get_doc({
                "doctype": "PH Herstellerbestellung", "lieferant": lieferant or None,
                "bezug_doctype": "PH Auftragsbestaetigung", "bezug_name": self.name, "kommission": kommission,
                "wunschtermin": self.liefertermin_geplant, "quelle": "ph_faktura",
                "positionen": [{"produkt": p.produkt, "ausfuehrung": p.ausfuehrung, "bezeichnung": p.bezeichnung, "ausfuehrung_text": p.ausfuehrung_text,
                                "menge": cint(round(flt(p.menge))) or 1, "vk_cent": cint(p.einzel_netto_cent), "ek_cent": cint(p.get("einkauf_cent")), "kommission": kommission} for p in pos],
            })
            hb.flags.ignore_mandatory = True
            hb.insert()
            for p in pos:
                frappe.db.set_value("PH Beleg Position", p.name, "herstellerbestellung_position", hb.name, update_modified=False)
            namen.append(hb.name)
        if self.status == "Offen":
            self.status_setzen("In Bestellung")
        return namen

    @frappe.whitelist()
    def lieferung_melden(self, mengen=None, vollstaendig=0):
        """Liefermengen fortschreiben (bis ph_logistik Lieferscheine schreibt): mengen {zeile: menge} oder vollständig."""
        self.check_permission("write")
        if isinstance(mengen, str):
            mengen = frappe.parse_json(mengen)
        for p in self.positionen:
            if p.art in ("Text", "Zwischensumme") or p.alternativ:
                continue
            if cint(vollstaendig):
                p.lieferschein_menge = p.menge
            elif mengen and p.name in mengen:
                p.lieferschein_menge = min(flt(p.lieferschein_menge) + flt(mengen[p.name]), flt(p.menge))
            frappe.db.set_value("PH Beleg Position", p.name, "lieferschein_menge", p.lieferschein_menge, update_modified=False)
        alle = all(flt(p.lieferschein_menge) >= flt(p.menge) for p in self.positionen if p.art not in ("Text", "Zwischensumme") and not p.alternativ)
        self.stand_aktualisieren(speichern=True)
        if self.status in ("Offen", "In Bestellung", "Teilgeliefert"):
            self.status_setzen("Geliefert" if alle else "Teilgeliefert")
        return self.status

    @frappe.whitelist()
    def stornieren(self, grund):
        """Button „Stornieren“ (Leitung): nur ohne gestellte Leistungsrechnungen; FAGG-Frist wird vermerkt."""
        self.check_permission("cancel")
        if not grund:
            frappe.throw(_("Stornogrund fehlt."))
        offen = frappe.get_all("PH Rechnung", filters={"auftrag": self.name, "docstatus": 1, "status": ("!=", "Storniert")}, fields=["name", "art", "bezahlt_cent"])
        if any(r.art != "Anzahlungsrechnung" for r in offen):
            frappe.throw(_("Es gibt gestellte Rechnungen zu diesem Auftrag – zuerst per Gutschrift stornieren."))
        hinweis = ""
        if self.fagg_frist_ende and getdate(nowdate()) <= getdate(self.fagg_frist_ende):
            hinweis = _(" (innerhalb der FAGG-Rücktrittsfrist bis {0})").format(frappe.utils.formatdate(self.fagg_frist_ende))
        if any(cint(r.bezahlt_cent) for r in offen):
            hinweis += _(" – Anzahlung(en) bezahlt: Rückzahlung per Gutschrift erforderlich")
        for z in self.zahlungsplan:
            if z.status == "Offen":
                frappe.db.set_value("PH Zahlungsplan", z.name, "status", "Verrechnet", update_modified=False)
        self.flags.ph_system = True
        self.status_setzen("Storniert", storno_grund=(grund + hinweis)[:500], storniert_am=now_datetime(), storniert_von=frappe.session.user, offen_cent=0)
        for e in frappe.get_all("PH Rechnung", filters={"auftrag": self.name, "docstatus": 0}, pluck="name"):
            frappe.delete_doc("PH Rechnung", e, ignore_permissions=True)
        journal.schreibe("Storniert", self, self.brutto_cent, grund)
        return True

    @frappe.whitelist()
    def senden(self, empfaenger, betreff=None, nachricht=None):
        self.check_permission("write")
        return versand.senden(self, empfaenger, betreff, nachricht, feld_gesendet=None)
