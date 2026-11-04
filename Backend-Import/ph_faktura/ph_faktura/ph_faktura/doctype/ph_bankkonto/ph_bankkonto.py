import re

import frappe
from frappe import _
from frappe.model.document import Document

IBAN_RE = re.compile(r"^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$")


class PHBankkonto(Document):
    def validate(self):
        self.iban = (self.iban or "").replace(" ", "").upper()
        if not IBAN_RE.match(self.iban):
            frappe.throw(_("IBAN hat kein gültiges Format."))
        self.bic = (self.bic or "").replace(" ", "").upper() or None
        if self.standard:
            frappe.db.sql("update `tabPH Bankkonto` set standard = 0 where name != %s", self.name)

    def on_update(self):
        from ph_faktura.einstellungen import cache_leeren

        cache_leeren()
