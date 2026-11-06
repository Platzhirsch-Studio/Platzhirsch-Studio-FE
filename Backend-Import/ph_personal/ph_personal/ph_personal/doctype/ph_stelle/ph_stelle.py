"""PH Stelle – Stellenausschreibung (Website-Quelle für /karriere).

Regeln:
  - Slug wie src/lib/slugify.js generateSlug (Website verschmilzt über den Slug).
  - § 9 Abs 2 GlBG: Aktiv nur mit vollständigem Entgelt (Betrag, Zeitraum, KV, Überzahlung).
  - Veröffentlichung: veroeffentlicht (posted) + gueltig_bis (+60 Tage, src/lib/karriere/stellen.js).
  - Nach Änderungen an sichtbaren Feldern Website-Cache (Tag „career“) erneuern.
"""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, getdate, nowdate

from ph_personal.logik import SPRACHEN, entgelt_text, entgelt_vollstaendig, euro, slug as mache_slug

SPRACH_TITEL = {"de": "titel", "en": "titel_en", "fr": "titel_fr", "it": "titel_it"}
WEBSITE_FELDER = (
    "titel", "titel_en", "titel_fr", "titel_it", "status", "kategorie", "beschaeftigungsart", "positionen_anzahl", "start",
    "standort", "erfahrung_jahre", "stellenbeschreibung", "job_description_en", "description_de_lemploi", "jobs_description_it",
    "arbeitszeit_de", "arbeitszeit_en", "arbeitszeit_fr", "arbeitszeit_it", "kv_mindest_brutto_cent", "entgelt_zeitraum",
    "kollektivvertrag", "ueberzahlung", "ueberzahlung_text", "veroeffentlicht", "gueltig_bis", "bewerbung_email", "seo_title",
)
OEFFENTLICH = ("Aktiv",)


class PHStelle(Document):
    def autoname(self):
        self.slug = mache_slug(self.slug or self.titel)
        if not self.slug:
            frappe.throw(_("Aus dem Titel lässt sich kein Slug bilden."))
        self.name = self.slug

    def validate(self):
        self.titel = (self.titel or "").strip()
        if not self.titel:
            frappe.throw(_("Titel fehlt."))
        if not self.slug:
            self.slug = mache_slug(self.titel)
        if (self.positionen_anzahl or 0) < 1:
            self.positionen_anzahl = 1
        self.start = (self.start or "").strip() or "ab sofort"
        self.kollektivvertrag = (self.kollektivvertrag or "").strip()
        self.ueberzahlung_text = (self.ueberzahlung_text or "").strip()
        if (self.kv_mindest_brutto_cent or 0) < 0:
            frappe.throw(_("Das Mindestentgelt kann nicht negativ sein."))
        self._entgelt_berechnen()
        self._veroeffentlichung_pruefen()
        self._website_url()
        if self.status == "Aktiv" and self.hinweise():
            frappe.msgprint("<br>".join(self.hinweise()), title=_("Hinweis GlBG"), indicator="orange")

    def hinweise(self):
        """Warnungen ohne Sperre (Fachkritik P13): geschlechtsneutraler Titel nach § 9 Abs 1 GlBG."""
        from ph_personal.utils.datenschutz import titel_geschlechtsneutral

        out = []
        if self.titel and not titel_geschlechtsneutral(self.titel):
            out.append(_("Titel „{0}“ ist nicht erkennbar geschlechtsneutral (z. B. „:in“, „(m/w/d)“) – § 9 Abs 1 GlBG.").format(self.titel))
        return out

    def _entgelt_berechnen(self):
        self.entgelt_vollstaendig = int(
            entgelt_vollstaendig(self.kv_mindest_brutto_cent, self.entgelt_zeitraum, self.kollektivvertrag, self.ueberzahlung, self.ueberzahlung_text)
        )
        self.kv_mindest_brutto_anzeige = euro(self.kv_mindest_brutto_cent, "de") if self.kv_mindest_brutto_cent else ""
        self.entgelt_text = entgelt_text(
            self.kv_mindest_brutto_cent, self.entgelt_zeitraum, self.kollektivvertrag, self.ueberzahlung, self.ueberzahlung_text, "de"
        )

    def _veroeffentlichung_pruefen(self):
        if self.status == "Aktiv":
            fehlt = self.fehlende_angaben()
            if fehlt:
                frappe.throw(_("Die Stelle kann nicht aktiv sein. Es fehlt: {0}").format(", ".join(fehlt)))
            if not self.veroeffentlicht:
                self.veroeffentlicht = nowdate()
        if self.veroeffentlicht and not self.gueltig_bis:
            self.gueltig_bis = add_days(self.veroeffentlicht, 60)
        if self.veroeffentlicht and self.gueltig_bis and getdate(self.gueltig_bis) < getdate(self.veroeffentlicht):
            frappe.throw(_("„Gültig bis“ liegt vor „Veröffentlicht ab“."))
        if self.status == "Besetzt" and not self.besetzt_am:
            self.besetzt_am = nowdate()

    def _website_url(self):
        try:
            from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen

            basis = (einstellungen().get("website_url") or "https://platzhirsch.studio").rstrip("/")
        except Exception:  # noqa: BLE001 – Einstellungen fehlen nur in Tests ohne ph_core-Daten
            basis = "https://platzhirsch.studio"
        self.website_url = f"{basis}/de/karriere/{self.slug}"

    def fehlende_angaben(self):
        """Liste fehlender Angaben für die Veröffentlichung (Website: glbg.js fehlendeAngaben)."""
        fehlt = []
        if not self.entgelt_vollstaendig:
            from ph_personal.utils.glbg import entgelt_fehlt

            teile = entgelt_fehlt(self.kv_mindest_brutto_cent, self.entgelt_zeitraum, self.kollektivvertrag, self.ueberzahlung, self.ueberzahlung_text)
            fehlt.append(_("Entgeltangabe nach § 9 Abs 2 GlBG: {0}").format(", ".join(_(t) for t in teile) or _("unvollständig")))
        if not (self.stellenbeschreibung or "").strip():
            fehlt.append(_("Stellenbeschreibung (Deutsch)"))
        if not self.aufgaben_de:
            fehlt.append(_("mindestens eine Aufgabe (Deutsch)"))
        if not self.anforderungen_de:
            fehlt.append(_("mindestens eine Anforderung (Deutsch)"))
        if not self.beschaeftigungsart:
            fehlt.append(_("Beschäftigungsausmaß"))
        return fehlt

    def on_update(self):
        alt = self.get_doc_before_save()
        sichtbar = (self.status in OEFFENTLICH) or (alt and alt.status in OEFFENTLICH)
        if not sichtbar:
            return
        if alt is None or any(self.get(f) != alt.get(f) for f in WEBSITE_FELDER) or self._kindtabellen_geaendert(alt):
            self._website_erneuern()

    def _kindtabellen_geaendert(self, alt):
        for sprache in SPRACHEN:
            for feld in (f"aufgaben_{sprache}", f"anforderungen_{sprache}", f"leistungen_{sprache}"):
                texte_neu = [_zeilentext(r) for r in (self.get(feld) or [])]
                texte_alt = [_zeilentext(r) for r in (alt.get(feld) or [])]
                if texte_neu != texte_alt:
                    return True
        return False

    def on_trash(self):
        if frappe.db.count("PH Bewerbung", {"stelle": self.name}):
            frappe.throw(_("Zu dieser Stelle gibt es Bewerbungen – bitte archivieren statt löschen."))
        if self.status in OEFFENTLICH:
            self._website_erneuern()

    def _website_erneuern(self):
        try:
            from ph_personal.ph_personal.website import revalidate_career

            revalidate_career(grund=f"PH Stelle {self.name}")
        except Exception:  # noqa: BLE001 – darf das Speichern nie verhindern
            frappe.log_error(title="PH Stelle: Website-Revalidate fehlgeschlagen")

    # ── Buttons (ph_stelle.js) ──────────────────────────────────────────────

    @frappe.whitelist()
    def website_cache_erneuern(self):
        """Button „Website-Cache erneuern“ (Tag career)."""
        self.check_permission("write")
        from ph_personal.ph_personal.website import revalidate_career

        return revalidate_career(grund=f"manuell {self.name}", sofort=True)

    @frappe.whitelist()
    def duplizieren(self):
        """Button „Duplizieren“: Kopie als Entwurf mit Zusatz „(Kopie)“ – Entgelt bleibt, Veröffentlichung leer."""
        self.check_permission("create")
        kopie = frappe.copy_doc(self)
        kopie.titel = f"{self.titel} (Kopie)"
        kopie.slug = ""
        kopie.status = "Entwurf"
        kopie.workflow_state = "PH Entwurf"
        kopie.veroeffentlicht = None
        kopie.gueltig_bis = None
        kopie.besetzt_am = None
        kopie.besetzt_durch = None
        kopie.quelle = "Duplikat"
        kopie.sync_quelle = None
        kopie.insert()
        return kopie.name

    @frappe.whitelist()
    def als_besetzt(self, bewerbung=None):
        """Button „Als besetzt schließen“: Status Besetzt, Bewerbung verknüpfen, Website erneuern."""
        self.check_permission("write")
        if bewerbung and frappe.db.get_value("PH Bewerbung", bewerbung, "stelle") != self.name:
            frappe.throw(_("Die Bewerbung gehört zu einer anderen Stelle."))
        self.status = "Besetzt"
        self.workflow_state = "PH Besetzt"
        self.besetzt_am = nowdate()
        self.besetzt_durch = bewerbung
        self.save()
        self.add_comment("Info", _("Als besetzt geschlossen"))
        return self.status

    @frappe.whitelist()
    def pruefen(self):
        """Button „Veröffentlichung prüfen“: fehlende Angaben als Liste."""
        self.check_permission("read")
        return self.fehlende_angaben()

    @frappe.whitelist()
    def glbg_hinweise(self):
        """Ampel gelb: Warnungen ohne Sperre (Titel geschlechtsneutral, § 9 Abs 1 GlBG)."""
        self.check_permission("read")
        return self.hinweise()


def _zeilentext(zeile):
    return zeile.get("responsibility") or zeile.get("anforderungen") or zeile.get("benefit") or ""


def aktive_anzahl():
    return frappe.db.count("PH Stelle", {"status": "Aktiv", "entgelt_vollstaendig": 1})
