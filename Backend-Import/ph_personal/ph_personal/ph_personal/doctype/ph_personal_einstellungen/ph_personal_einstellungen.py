import frappe
from frappe import _
from frappe.model.document import Document


class PHPersonalEinstellungen(Document):
    def validate(self):
        if (self.loeschfrist_monate or 0) < 6:
            frappe.throw(_("Die Löschfrist muss mindestens 6 Monate betragen (GlBG § 15: Frist ab Zugang der Ablehnung)."))
        if (self.standard_wochenstunden or 0) <= 0 or self.standard_wochenstunden > 60:
            frappe.throw(_("Normalarbeitszeit muss zwischen 1 und 60 Stunden liegen."))
        if (self.urlaubsanspruch_tage or 0) < 0:
            self.urlaubsanspruch_tage = 25
        if self.urlaubsjahr == "Kalenderjahr" and not (self.urlaubsjahr_grundlage or "").strip():
            frappe.throw(_("Kalenderjahr als Urlaubsjahr nur mit Grundlage (Kollektivvertrag/Betriebsvereinbarung, § 2 Abs 4 UrlG)."))
        if (self.aufbewahrung_zeiten_jahre or 0) and self.aufbewahrung_zeiten_jahre < 3:
            frappe.throw(_("Zeitaufzeichnungen mindestens 3 Jahre aufbewahren (Verjährung Entgeltansprüche § 1486 ABGB)."))
        if self.urlaubsjahr != self.get_db_value("urlaubsjahr") and frappe.db.exists("DocType", "PH Urlaubsanspruch") and frappe.db.count("PH Urlaubsanspruch"):
            frappe.msgprint(_("Das Urlaubsjahr wurde geändert – bestehende Urlaubsansprüche bleiben; neue Urlaubsjahre folgen der neuen Regel (Umstellung mit Steuerberatung abstimmen)."), indicator="orange")
        for z in self.mindestbesetzung or []:
            if z.von and z.bis and str(z.bis) <= str(z.von):
                frappe.throw(_("Mindestbesetzung Zeile {0}: „Bis“ muss nach „Von“ liegen.").format(z.idx))

    def on_update(self):
        frappe.cache().delete_value("ph_personal:einstellungen")
        frappe.cache().delete_keys("ph_personal:frei:")


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
            "urlaubsjahr": doc.get("urlaubsjahr") or "Arbeitsjahr",
            "landesfeiertag_frei": int(doc.get("landesfeiertag_frei") if doc.get("landesfeiertag_frei") is not None else 1),
            "betriebsruhe_behandlung": doc.get("betriebsruhe_behandlung") or "Bezahlt frei",
            "genehmiger_fuer_leitung": doc.get("genehmiger_fuer_leitung"),
            "krank_bestaetigung_ab_tag": int(doc.get("krank_bestaetigung_ab_tag") or 3),
            "benutzer_bei_austritt_deaktivieren": int(doc.get("benutzer_bei_austritt_deaktivieren") if doc.get("benutzer_bei_austritt_deaktivieren") is not None else 1),
            "aufbewahrung_zeiten_jahre": int(doc.get("aufbewahrung_zeiten_jahre") or 7),
            "notfallkontakt_loeschen_tage": int(doc.get("notfallkontakt_loeschen_tage") or 30),
            "offene_bewerbung_warnung_tage": int(doc.get("offene_bewerbung_warnung_tage") or 90),
        }
        frappe.cache().set_value("ph_personal:einstellungen", data)
    return data
