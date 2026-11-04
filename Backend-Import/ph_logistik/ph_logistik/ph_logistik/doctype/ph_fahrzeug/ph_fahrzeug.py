"""PH Fahrzeug – legt automatisch einen Lagerort (Art Fahrzeug) an, damit geladene Ware verortet ist."""

import frappe
from frappe.model.document import Document


class PHFahrzeug(Document):
    def validate(self):
        self.kennzeichen = (self.kennzeichen or "").strip().upper().replace("  ", " ")

    def after_insert(self):
        try:
            bez = f"Fahrzeug {self.kennzeichen}"
            if not frappe.db.exists("PH Lagerort", bez):
                frappe.get_doc({"doctype": "PH Lagerort", "bezeichnung": bez, "art": "Fahrzeug", "fahrzeug": self.name, "aktiv": 1}).insert(ignore_permissions=True)
            self.db_set("lagerort", bez)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Fahrzeug: Lagerort anlegen")

    def on_update(self):
        if self.lagerort and frappe.db.exists("PH Lagerort", self.lagerort):
            frappe.db.set_value("PH Lagerort", self.lagerort, "aktiv", int(bool(self.aktiv)), update_modified=False)
