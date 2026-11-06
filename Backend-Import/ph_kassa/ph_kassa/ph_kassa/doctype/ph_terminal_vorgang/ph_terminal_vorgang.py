"""PH Terminal Vorgang – ein Datensatz je PaymentIntent (ph_kassa.terminal_vorgang)"""

import frappe
from frappe import _
from frappe.model.document import Document


class PHTerminalVorgang(Document):
    def validate(self):
        self.titel = f"{self.kasse or ''} {self.status} {int(self.betrag_cent or 0) / 100:.2f} €"[:140]
