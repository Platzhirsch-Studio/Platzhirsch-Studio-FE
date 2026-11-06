"""PH Postfach – angebundenes Exchange-Postfach."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_microsoft.logik.zuordnung import normalisiere


class PHPostfach(Document):
    def before_insert(self):
        self.adresse = normalisiere(self.adresse) or self.adresse

    def validate(self):
        a = normalisiere(self.adresse)
        if not a:
            frappe.throw(_("Ungültige Postfach-Adresse."))
        if not self.is_new() and a != self.name:
            frappe.throw(_("Die Adresse kann nicht geändert werden – neues Postfach anlegen."))
        self.adresse = a
        if self.art == "Benutzer" and not self.besitzer:
            self.besitzer = frappe.db.get_value("User", {"email": a}) or None
        gesehen = set()
        for z in self.benutzer or []:
            if z.user in gesehen:
                frappe.throw(_("Benutzer {0} ist doppelt eingetragen.").format(z.user))
            gesehen.add(z.user)
        if not self.aktiv:
            self.status = "Pausiert"
        elif self.status == "Pausiert":
            self.status = "Aktiv"

    @frappe.whitelist()
    def jetzt_abholen(self):
        self.check_permission("write")
        frappe.enqueue("ph_microsoft.ph_microsoft.mail.abholen", queue="long", postfach_name=self.name, job_id=f"ph_ms_mail_{self.name}", deduplicate=True)
        return {"ok": True}

    @frappe.whitelist()
    def delta_zuruecksetzen(self):
        """Nächste Abholung beginnt neu (letzte sync_tage_vergangenheit Tage); gespeicherte Mails werden nicht doppelt angelegt."""
        self.check_permission("write")
        self.db_set("delta_json", None)
        return {"ok": True}
