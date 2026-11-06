"""PH Onboarding Vorlage – Checklisten-Vorlage; nur eine Standardvorlage je Art."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHOnboardingVorlage(Document):
    def validate(self):
        if not self.aufgaben:
            frappe.throw(_("Bitte mindestens eine Aufgabe eintragen."))
        if self.standard:
            andere = frappe.get_all("PH Onboarding Vorlage", filters={"art": self.art, "standard": 1, "name": ("!=", self.name or "")}, pluck="name")
            for n in andere:
                frappe.db.set_value("PH Onboarding Vorlage", n, "standard", 0)
