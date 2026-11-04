import frappe
from frappe import _
from frappe.model.document import Document


class PHPersonalEinstellungen(Document):
    def validate(self):
        if (self.loeschfrist_monate or 0) < 6:
            frappe.throw(_("Die Löschfrist muss mindestens 6 Monate betragen (GlBG § 15: Klagefrist nach Absage)."))
        if (self.standard_wochenstunden or 0) <= 0 or self.standard_wochenstunden > 60:
            frappe.throw(_("Normalarbeitszeit muss zwischen 1 und 60 Stunden liegen."))
        if (self.urlaubsanspruch_tage or 0) < 0:
            self.urlaubsanspruch_tage = 25

    def on_update(self):
        frappe.cache().delete_value("ph_personal:einstellungen")


def einstellungen():
    """Gecachte Einstellungen als dict."""
    data = frappe.cache().get_value("ph_personal:einstellungen")
    if not data:
        doc = frappe.get_cached_doc("PH Personal Einstellungen")
        data = {
            "loeschfrist_monate": int(doc.loeschfrist_monate or 7),
            "bewerbung_email": doc.bewerbung_email or "info@platzhirsch.studio",
            "standard_ansprechpartner": doc.standard_ansprechpartner,
            "standort": doc.standort or "Lochau am Bodensee",
            "standard_wochenstunden": float(doc.standard_wochenstunden or 38.5),
            "urlaubsanspruch_tage": int(doc.urlaubsanspruch_tage or 25),
            "pause_ab_minuten": int(doc.pause_ab_minuten or 360),
            "pause_minuten": int(doc.pause_minuten or 30),
            "absage_text": doc.absage_text or "",
            "zusage_text": doc.zusage_text or "",
            "website_revalidate_aktiv": int(doc.website_revalidate_aktiv or 0),
        }
        frappe.cache().set_value("ph_personal:einstellungen", data)
    return data
