"""PH Kalender Zuordnung – Frappe-Benutzer ↔ Outlook-Kalender."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_microsoft.logik.zuordnung import normalisiere


class PHKalenderZuordnung(Document):
    def validate(self):
        if self.user in ("Administrator", "Guest"):
            frappe.throw(_("Für diesen Benutzer ist kein Kalender-Abgleich möglich."))
        self.outlook_adresse = normalisiere(self.outlook_adresse or frappe.db.get_value("User", self.user, "email"))
        if not self.outlook_adresse:
            frappe.throw(_("Outlook-Adresse fehlt oder ist ungültig."))
        if not self.is_new() and self.has_value_changed("outlook_adresse"):
            self.delta_link = None
        if not self.aktiv:
            self.status = "Pausiert"
        elif self.status == "Pausiert":
            self.status = "Aktiv"

    @frappe.whitelist()
    def jetzt_abgleichen(self):
        self.check_permission("write")
        frappe.enqueue("ph_microsoft.ph_microsoft.kalender.delta_abgleichen", queue="long", zuordnung_name=self.name, job_id=f"ph_ms_kal_{self.name}", deduplicate=True)
        return {"ok": True}

    @frappe.whitelist()
    def delta_zuruecksetzen(self):
        self.check_permission("write")
        self.db_set("delta_link", None)
        return {"ok": True}
