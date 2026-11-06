"""PH Graph Abo – Microsoft-Graph-Subscription. Angelegt/erneuert nur durch ph_microsoft.ph_microsoft.abos."""

import frappe
from frappe.model.document import Document


class PHGraphAbo(Document):
    def validate(self):
        if not self.titel:
            self.titel = f"{self.art or ''}: {self.ressource or ''}"[:140]

    @frappe.whitelist()
    def erneuern(self):
        self.check_permission("write")
        from ph_microsoft.ph_microsoft.abos import erneuern

        return {"ok": erneuern(self.name)}

    @frappe.whitelist()
    def in_microsoft_loeschen(self):
        self.check_permission("write")
        from ph_microsoft.ph_microsoft.abos import loeschen

        return {"ok": loeschen(self.name)}
