import frappe
from frappe import _
from frappe.model.document import Document

BEISPIEL = {
    "anrede": "Guten Tag Frau Muster", "produkt": "Ihr Sofa", "berater_name": "Harald Menghin", "berater_telefon": "+43 5574 46255",
    "pflege_module": [{"titel": "Stoffbezüge", "text": "Regelmäßig absaugen."}], "portal_url": "https://platzhirsch.studio/de/portal",
    "bewerten_url": "https://platzhirsch.studio/de/bewerten", "event_titel": "Adventsabend im Showroom", "event_datum": "Donnerstag, 26. November 2026",
    "event_uhrzeit": "", "event_programm": "", "event_url": "https://platzhirsch.studio/de/adventsabend", "event_ort": "Lochau", "gemerkte_stuecke": [],
    "abmelde_url": "https://platzhirsch.studio/de/newsletter/abmelden", "bestaetigen_url": "https://platzhirsch.studio/de/newsletter/bestaetigen",
    "absagen_url": "", "einwilligung_datum": "01.11.2026", "fusszeile_html": "", "zweck_text": "unseren Newsletter", "gueltig_stunden": 48, "code": "EMP-ABC234",
    "teilen_url": "https://platzhirsch.studio/de/empfehlen?code=EMP-ABC234", "gutschein_wert": "", "bedingungen_url": "", "gutschein_code": "PH-TEST", "personen": 2,
    "warteliste": False, "website_url": "https://platzhirsch.studio", "impressum_zeile": "", "bloecke": [], "betreff": "", "preheader": "", "inhalt_zeile": "", "slug": "", "neuheiten": "",
}


class PHMailVorlage(Document):
    def validate(self):
        try:
            frappe.render_template(self.betreff or "", BEISPIEL)
            frappe.render_template(self.html or "", BEISPIEL)
        except Exception as e:  # noqa: BLE001
            frappe.throw(_("Vorlage lässt sich nicht rendern: {0}").format(str(e)[:200]))
        if self.fusszeile in ("A", "B", "je Empfänger") and "abmelde_url" not in (self.html or "") and "fusszeile_html" not in (self.html or ""):
            frappe.throw(_("Werbliche Fußzeile ohne Abmeldelink ({{ abmelde_url }} oder {{ fusszeile_html }})."))
        if "<img" in (self.html or "").lower() and "pixel" in (self.html or "").lower():
            frappe.throw(_("Kein Tracking-Pixel in Mails."))

    @frappe.whitelist()
    def vorschau(self):
        self.check_permission("read")
        return {"betreff": frappe.render_template(self.betreff, BEISPIEL), "html": frappe.render_template(self.html, BEISPIEL)}
