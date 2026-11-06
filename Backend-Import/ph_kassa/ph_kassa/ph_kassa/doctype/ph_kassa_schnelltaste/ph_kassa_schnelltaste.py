"""PH Kassa Schnelltaste – Tastenbelegung der Kassa"""

import frappe
from frappe import _
from frappe.model.document import Document


class PHKassaSchnelltaste(Document):
    def validate(self):
        if self.aktion == "Produkt" and not self.produkt:
            frappe.throw(_("Schnelltaste „Produkt“ braucht ein Produkt."))
        if int(self.betrag_cent or 0) < 0:
            frappe.throw(_("Betrag darf nicht negativ sein."))
        if self.aktion == "Gutschein Verkauf":
            self.steuersatz = "Null 0"  # Mehrzweck-Standard; Einzweck setzt die Kassa beim Buchen
