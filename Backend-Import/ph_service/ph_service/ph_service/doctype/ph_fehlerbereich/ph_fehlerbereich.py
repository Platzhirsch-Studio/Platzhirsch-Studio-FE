import frappe
from frappe import _
from frappe.model.document import Document


class PHFehlerbereich(Document):
    def validate(self):
        self.code = (self.code or "").strip().upper()
        if not self.code.isalpha() or not 2 <= len(self.code) <= 4:
            frappe.throw(_("Kürzel: 2–4 Buchstaben, z. B. OBF."))
        self.bezeichnung = (self.bezeichnung or "").strip()
        if not self.is_new():
            self.anzahl_codes = frappe.db.count("PH Fehlercode", {"bereich": self.name, "aktiv": 1})
