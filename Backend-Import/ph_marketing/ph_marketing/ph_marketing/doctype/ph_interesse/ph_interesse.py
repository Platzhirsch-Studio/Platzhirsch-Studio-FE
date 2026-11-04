import frappe
from frappe import _
from frappe.model.document import Document


class PHInteresse(Document):
    def validate(self):
        self.interesse = (self.interesse or "").strip()
        if not self.interesse:
            frappe.throw(_("Interesse fehlt."))
