import re

import frappe
from frappe import _
from frappe.model.document import Document

IBAN_RE = re.compile(r"^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$")
UID_AT_RE = re.compile(r"^ATU\d{8}$")


class PHFirma(Document):
    def validate(self):
        self.iban = (self.iban or "").replace(" ", "").upper() or None
        if self.iban and not IBAN_RE.match(self.iban):
            frappe.throw(_("IBAN hat kein gültiges Format."))
        self.uid = (self.uid or "").replace(" ", "").upper() or None
        if self.uid and self.land == "Österreich" and not UID_AT_RE.match(self.uid):
            frappe.throw(_("Österreichische UID hat das Format ATU + 8 Ziffern."))
        if self.standard:
            # Genau eine Standardfirma.
            frappe.db.sql("update `tabPH Firma` set standard = 0 where name != %s", self.name)

    def on_update(self):
        frappe.cache().delete_value("ph_core:standard_firma")


def standard_firma():
    """Name der Standardfirma (gecacht). Wirft, wenn keine gesetzt ist."""
    name = frappe.cache().get_value("ph_core:standard_firma")
    if not name:
        name = frappe.db.get_value("PH Firma", {"standard": 1}, "name")
        if not name:
            frappe.throw(_("Keine Standardfirma in PH Firma gesetzt."))
        frappe.cache().set_value("ph_core:standard_firma", name)
    return name
