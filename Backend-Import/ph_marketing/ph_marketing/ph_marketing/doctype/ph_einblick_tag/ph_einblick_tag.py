import frappe
from frappe.model.document import Document


class PHEinblickTag(Document):
    def validate(self):
        self.titel = f"Einblicke {frappe.utils.formatdate(self.datum, 'dd.MM.yyyy')}"
