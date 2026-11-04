import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint


class PHZahlungsbedingung(Document):
    def validate(self):
        a, t = cint(self.anzahlung_prozent), cint(self.teilzahlung_prozent)
        if a < 0 or t < 0 or a + t > 100:
            frappe.throw(_("Anzahlung + Teilzahlung dürfen 100 % nicht übersteigen."))
        self.rest_prozent = 100 - a - t
        if cint(self.zieltage) < 0:
            frappe.throw(_("Zahlungsziel darf nicht negativ sein."))
        if self.standard:
            frappe.db.sql("update `tabPH Zahlungsbedingung` set standard = 0 where name != %s", self.name)
