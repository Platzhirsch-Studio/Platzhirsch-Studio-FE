"""PH Kostenart – Katalog der Projektnachkalkulation (Standard: nachkalkulation.KOSTENARTEN_STANDARD, install.py)."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHKostenart(Document):
    def validate(self):
        self.kostenart = (self.kostenart or "").strip()
        if "/" in self.kostenart:
            frappe.throw(_("Kostenart ohne „/“ (Teil der Adresse) – Langtext in „Bezeichnung“."))
        self.bezeichnung = (self.bezeichnung or "").strip() or self.kostenart

    def on_trash(self):
        if frappe.db.exists("PH Projekt Budget", {"kostenart": self.name}) or (
            frappe.db.exists("DocType", "PH Eingangsrechnung Zuordnung") and frappe.db.exists("PH Eingangsrechnung Zuordnung", {"kostenart": self.name})
        ):
            frappe.throw(_("Kostenart wird verwendet – bitte deaktivieren statt löschen."))
