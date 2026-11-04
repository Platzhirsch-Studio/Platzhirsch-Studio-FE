"""PH Produkt – Artikel des Sortiments.

Regeln (PLAN.md WP3, Website-Quellen in Kommentaren):
  - Slug = path_field der Website, unverändert und eindeutig (src/lib/api/fetchAllProdukte.js).
  - Aktiv (veröffentlicht) nur mit: Marke aktiv, Kategorie, mindestens ein freigegebenes Bild.
  - Preis mit Stand: jüngster freigegebener Eintrag mit ab ≤ heute; Höchstalter 3/6 Monate
    (src/lib/katalog/schema.js PREIS_ARTEN) → preisstand_alt, Website blendet alte Preise aus.
  - Lieferzeit nur anzeigen, wenn freigegeben (src/lib/shop/lieferzeit.js, FAGG § 4 Abs 1 Z 7).
  - Claim-Guard: keine Händlerwörter in Produkttexten (schema.js DEALER_WORDS).
"""

import re

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import getdate, now_datetime, nowdate, strip_html

from ph_sortiment.logik.preise import ab_preis_cent, gueltig_bis, gueltiger_preis, veraltet
from ph_sortiment.logik.slug import ist_slug, produkt_slug, slug as mk_slug

DEALER_WORDS = re.compile(r"\b(händler\w*|vertragshändler\w*|dealer\w*|revendeur\w*|rivenditor\w*|autorisiert\w*|authori[sz]ed|offiziell\w* (?:händler|partner))\b", re.I)
PRICE_WORDS = re.compile(r"(€|\$|\b(?:eur|euro|chf|uvp|preis\w*|price\w*|prix|prezz[oi])\b)", re.I)
TEXTFELDER = [f"{p}_{loc}" for p in ("kurz", "beschreibung") for loc in ("de", "en", "fr", "it")]
VEROEFFENTLICHT = "Aktiv"


class PHProdukt(Document):
    def autoname(self):
        if not self.slug:
            marke_slug = frappe.db.get_value("PH Marke", self.marke, "slug") or mk_slug(self.marke)
            self.slug = produkt_slug(marke_slug, self.name_herstellerbezeichnung)
        self.slug = mk_slug(self.slug)
        self.name = self.slug

    def before_insert(self):
        if not self.status:
            self.status = "Entwurf"

    def validate(self):
        self.name_herstellerbezeichnung = (self.name_herstellerbezeichnung or "").strip()
        self.slug = mk_slug(self.slug or self.name)
        if not ist_slug(self.slug):
            frappe.throw(_("Slug muss Slug-Form haben (a–z, 0–9, Bindestrich)."))
        self.url_slug = self.slug
        self.titel = f"{self.marke} {self.name_herstellerbezeichnung}"[:140]
        if self.welt is None or self.welt == "":
            self.welt = frappe.db.get_value("PH Marke", self.marke, "welt") or ""
        self.pruefe_texte()
        self.bilder_auswerten()
        self.preise_auswerten()
        self.lieferzeit_pruefen()
        self.ausfuehrungen_zaehlen()
        if self.status == VEROEFFENTLICHT:
            self.pruefe_veroeffentlichung()
        self.zeitstempel()

    def pruefe_texte(self):
        from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

        if not einstellungen()["claim_guard_aktiv"]:
            return
        for feld in TEXTFELDER:
            wert = strip_html(self.get(feld) or "")
            m = DEALER_WORDS.search(wert)
            if m:
                frappe.throw(_("Claim-Guard: „{0}“ in {1}. Händlerwörter gehören nicht in Produktdaten (Website setzt den Händlersatz selbst).").format(m.group(0), self.meta.get_label(feld)))
            if feld.startswith("kurz") and PRICE_WORDS.search(wert):
                frappe.throw(_("Kein Preis im Kurztext ({0}) – Preise nur in der Preistabelle mit Stand.").format(self.meta.get_label(feld)))

    def bilder_auswerten(self):
        bilder = sorted(self.bilder, key=lambda b: (b.reihenfolge or 0, b.idx))
        freigegeben = [b for b in bilder if b.freigabe == "erteilt"]
        for b in bilder:
            if b.freigabe == "erteilt" and not b.freigabe_datum:
                b.freigabe_datum = nowdate()
            if b.freigabe == "erteilt" and not (b.quelle_url or b.freigabe_beleg):
                frappe.throw(_("Bild {0}: Freigabe „erteilt“ braucht Quelle oder Beleg.").format(b.idx))
        self.bilder_anzahl = len(bilder)
        self.bilder_offen = len([b for b in bilder if b.freigabe != "erteilt"])
        self.bild_freigegeben = 1 if freigegeben else 0
        haupt = next((b for b in freigegeben if b.typ == "freisteller"), freigegeben[0] if freigegeben else (bilder[0] if bilder else None))
        self.bild_hauptbild = haupt.bild if haupt else None

    def preise_auswerten(self):
        from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import max_monate

        mm = max_monate()
        gesehen = set()
        for z in self.preise:
            if (z.brutto_cent or 0) <= 0:
                frappe.throw(_("Preis Zeile {0}: Brutto-Cent muss größer 0 sein.").format(z.idx))
            if z.ab and z.stand and getdate(z.ab) < getdate(z.stand) and z.quelle != "Inhaber-Preisliste":
                # Stand ist das Prüfdatum; ein Preis kann nicht vor seiner Prüfung gelten.
                z.ab = z.stand
            if z.freigegeben and not (z.quelle_url or z.beleg or z.quelle in ("Inhaber-Preisliste", "Eigen")):
                frappe.throw(_("Preis Zeile {0}: Freigabe braucht Quelle (URL oder Beleg) – nie schätzen.").format(z.idx))
            if z.freigegeben and not z.freigegeben_am:
                z.freigegeben_am = nowdate()
                z.freigegeben_von = frappe.session.user
            z.gueltig_bis = gueltig_bis(z.stand, z.preisart, mm)
            schluessel = (z.ab, z.preisart, z.ausfuehrung or "", z.variante_name or "")
            if schluessel in gesehen:
                frappe.throw(_("Preis Zeile {0}: doppelter Eintrag (gleiches Datum, Art und Ausführung).").format(z.idx))
            gesehen.add(schluessel)
        heute = nowdate()
        aktuell = gueltiger_preis(self.preise, heute, None, mm)
        self.aktueller_preis_cent = ab_preis_cent(self.preise, heute, mm)
        self.aktueller_preis_stand = aktuell.stand if aktuell else None
        # Veraltet: es gibt freigegebene Preise, aber keiner ist mehr anzeigbar.
        freigegeben = [z for z in self.preise if z.freigegeben]
        self.preisstand_alt = 1 if freigegeben and self.aktueller_preis_cent is None and all(veraltet(z.stand, z.preisart, heute, mm) for z in freigegeben) else 0
        if freigegeben and self.preisart == "Auf Anfrage":
            self.preisart = "UVP" if all(z.preisart in ("UVP", "Herstellerpreis") for z in freigegeben) else "Verkaufspreis"
        if self.verkauf_online and not self.aktueller_preis_cent:
            frappe.msgprint(_("Online-Verkauf ohne gültigen Verkaufspreis – der Shop zeigt den Artikel nicht an."), indicator="orange", alert=True)

    def lieferzeit_pruefen(self):
        if self.lieferzeit_wochen_von and self.lieferzeit_wochen_bis and self.lieferzeit_wochen_bis < self.lieferzeit_wochen_von:
            frappe.throw(_("Lieferzeit „bis“ liegt vor „von“."))
        if self.lieferzeit_freigegeben and not (self.lieferzeit_freigabe_datum and self.lieferzeit_freigabe_durch):
            frappe.throw(_("Lieferzeit-Freigabe braucht Datum und Person (src/lib/shop/lieferzeit.js, FAGG § 4 Abs 1 Z 7)."))

    def ausfuehrungen_zaehlen(self):
        keys = [g.gruppe_key for g in self.ausfuehrungen]
        if len(keys) != len(set(keys)):
            frappe.throw(_("Ausführungsgruppen: Schlüssel doppelt."))
        for g in self.ausfuehrungen:
            g.gruppe_key = mk_slug(g.gruppe_key or g.gruppe_de)
        self.ausfuehrungen_anzahl = 0 if self.is_new() else frappe.db.count("PH Produkt Ausfuehrung", {"produkt": self.name, "status": "Aktiv"})

    def pruefe_veroeffentlichung(self):
        """Bedingungen für Status Aktiv (Workflow-Übergang „Veröffentlichen“ und direkte Setzung)."""
        fehler = []
        if not self.kategorie:
            fehler.append(_("Kategorie fehlt"))
        if frappe.db.get_value("PH Marke", self.marke, "status") != "Aktiv":
            fehler.append(_("Marke ist nicht aktiv"))
        if not self.bild_freigegeben:
            fehler.append(_("kein freigegebenes Bild"))
        if not (self.kurz_de or self.beschreibung_de):
            fehler.append(_("kein deutscher Text"))
        if fehler:
            frappe.throw(_("Veröffentlichen nicht möglich: {0}.").format(", ".join(fehler)))

    def zeitstempel(self):
        alt = self.get_doc_before_save()
        alt_status = alt.status if alt else None
        if self.status != alt_status:
            if self.status == "Geprueft":
                self.geprueft_von, self.geprueft_am = frappe.session.user, now_datetime()
            if self.status == VEROEFFENTLICHT:
                self.veroeffentlicht_am = now_datetime()

    def on_update(self):
        try:
            from ph_sortiment.ph_sortiment.ereignisse import website_aktualisieren

            website_aktualisieren("products")
            alt = self.get_doc_before_save()
            if alt and (alt.status != self.status or alt.marke != self.marke or alt.kategorie != self.kategorie):
                for dt, feld, wert in (("PH Marke", "marke", self.marke), ("PH Kategorie", "kategorie", self.kategorie)):
                    n = frappe.db.count("PH Produkt", {feld: wert, "status": "Aktiv", "website_sichtbar": 1})
                    werte = {"produkte_anzahl": n}
                    if dt == "PH Marke":
                        werte["es_gibt_produkte"] = 1 if n else 0
                    frappe.db.set_value(dt, wert, werte, update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Produkt: Nebenwirkungen fehlgeschlagen")

    def on_trash(self):
        for a in frappe.get_all("PH Produkt Ausfuehrung", {"produkt": self.name}):
            frappe.delete_doc("PH Produkt Ausfuehrung", a.name, force=True, ignore_permissions=True)

    # ── Buttons (ph_produkt.js) ───────────────────────────────────────────

    @frappe.whitelist()
    def preis_hinzufuegen(self, brutto_cent, stand, preisart="Verkaufspreis", quelle="Herstellershop", quelle_url=None, ab=None, ausfuehrung=None, variante_name=None, freigegeben=1):
        """Button „Preis mit Stand hinzufügen“."""
        self.check_permission("write")
        self.append("preise", {
            "ab": ab or stand,
            "stand": stand,
            "brutto_cent": int(brutto_cent),
            "preisart": preisart,
            "quelle": quelle,
            "quelle_url": quelle_url,
            "ausfuehrung": ausfuehrung or None,
            "variante_name": variante_name,
            "waehrung": self.waehrung or "EUR",
            "freigegeben": int(freigegeben),
        })
        self.save()
        return {"aktueller_preis_cent": self.aktueller_preis_cent, "preisstand_alt": self.preisstand_alt}

    @frappe.whitelist()
    def ausfuehrung_anlegen(self, gruppe_key, option_id, name_de, name_en=None, name_fr=None, name_it=None, code=None, farbe_hex=None, standard=0, aufpreis_cent=0, preis_cent=None):
        """Button „Ausführung anlegen“: Option zu einer Gruppe dieses Produkts."""
        self.check_permission("write")
        if gruppe_key not in [g.gruppe_key for g in self.ausfuehrungen]:
            frappe.throw(_("Gruppe {0} ist in diesem Produkt nicht angelegt.").format(gruppe_key))
        doc = frappe.get_doc({
            "doctype": "PH Produkt Ausfuehrung", "produkt": self.name, "gruppe_key": gruppe_key, "option_id": option_id,
            "name_de": name_de, "name_en": name_en or name_de, "name_fr": name_fr or name_de, "name_it": name_it or name_de,
            "code": code, "farbe_hex": farbe_hex, "standard": int(standard or 0), "aufpreis_cent": int(aufpreis_cent or 0), "preis_cent": int(preis_cent) if preis_cent else None,
        }).insert()
        self.db_set("ausfuehrungen_anzahl", frappe.db.count("PH Produkt Ausfuehrung", {"produkt": self.name, "status": "Aktiv"}))
        return doc.name

    @frappe.whitelist()
    def website_cache_erneuern(self):
        """Button „Website-Cache erneuern“ (Tag products)."""
        self.check_permission("read")
        from ph_sortiment.ph_sortiment.ereignisse import website_aktualisieren

        return website_aktualisieren("products", sofort=True)

    @frappe.whitelist()
    def website_url(self, sprache="de"):
        """Vorschau-Link: Katalogwelt (/<welt>/produkte/<slug>) oder klassischer Pfad /produkte/<kategorie>/<slug>."""
        from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

        basis = einstellungen()["website_basis_url"].rstrip("/")
        welt_pfad = {"Bad-Wellness": "bad-wellness", "Kueche": "kuechengeraete", "Accessoires": "accessoires"}.get(self.welt)
        if welt_pfad and self.import_quelle == "katalog":
            return f"{basis}/{sprache}/{welt_pfad}/produkte/{self.slug}"
        return f"{basis}/{sprache}/produkte/{self.kategorie}/{self.slug}"

    @frappe.whitelist()
    def duplizieren(self, neuer_name):
        """Button „Duplizieren“: Kopie als Entwurf mit neuem Slug (Bilder bleiben, Freigaben zurückgesetzt)."""
        self.check_permission("create")
        kopie = frappe.copy_doc(self)
        kopie.name_herstellerbezeichnung = neuer_name
        kopie.slug = None
        kopie.status = "Entwurf"
        kopie.sync_quelle = None
        kopie.import_quelle = "manuell"
        kopie.veroeffentlicht_am = kopie.geprueft_am = kopie.geprueft_von = None
        for b in kopie.bilder:
            b.freigabe = "offen" if b.freigabe != "erteilt" else b.freigabe
        kopie.insert()
        return kopie.name

    @frappe.whitelist()
    def ausstellungsstueck_anlegen(self):
        """Button „Als Ausstellungsstück anlegen“: Kopie typ Ausstellungsstueck; Lagerbestand kommt mit ph_logistik."""
        self.check_permission("create")
        name = self.duplizieren(f"{self.name_herstellerbezeichnung} (Ausstellungsstück)")
        frappe.db.set_value("PH Produkt", name, {"typ": "Ausstellungsstueck", "lagerartikel": 1, "verkauf_online": 0})
        if frappe.db.exists("DocType", "PH Lagerbestand"):
            frappe.msgprint(_("Lagerbestand bitte in PH Lagerbestand (ph_logistik) anlegen."), alert=True)
        return name


def aktive_produkte_anzahl():
    return frappe.db.count("PH Produkt", {"status": "Aktiv"})
