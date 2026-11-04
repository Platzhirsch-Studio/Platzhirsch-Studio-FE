import frappe
from frappe import _
from frappe.model.document import Document

from ph_marketing.ph_marketing.einstellungen import cache_leeren


class PHMarketingEinstellungen(Document):
    def validate(self):
        if (self.doi_gueltig_stunden or 0) < 1:
            self.doi_gueltig_stunden = 48
        if (self.unbestaetigt_loeschen_tage or 0) < 3:
            frappe.throw(_("Unbestätigte Abos frühestens nach 3 Tagen löschen (DOI-Link muss ablaufen können)."))
        if (self.unbestaetigt_loeschen_tage or 0) > 90:
            frappe.throw(_("Unbestätigte Abos spätestens nach 90 Tagen löschen (Datensparsamkeit)."))
        if self.versandweg == "Resend" and not frappe.conf.get("ph_resend_api_key"):
            frappe.msgprint(_("Hinweis: ph_resend_api_key fehlt in site_config.json – Versand über Resend schlägt fehl."), indicator="orange")
        if self.automatik_aktiv and not self.kanzlei_fusszeilen_freigegeben:
            frappe.msgprint(_("Automatik aktiv, aber Fußzeilen nicht freigegeben: werbliche Reisen werden übersprungen (nur Service-Mails V)."), indicator="orange")
        if self.auftrags_doctype and not frappe.db.exists("DocType", self.auftrags_doctype):
            frappe.msgprint(_("Auftrags-Doctype {0} ist (noch) nicht installiert – Reisen laufen nur über Einwilligungen und Events.").format(self.auftrags_doctype), indicator="orange")

    def on_update(self):
        cache_leeren()
