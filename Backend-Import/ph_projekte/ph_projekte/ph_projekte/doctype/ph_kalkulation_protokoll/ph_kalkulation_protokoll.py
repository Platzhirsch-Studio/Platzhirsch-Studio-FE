"""PH Kalkulation Protokoll – unveränderliches Änderungsprotokoll (angelegt nur über nachkalkulation.protokoll)."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHKalkulationProtokoll(Document):
    def validate(self):
        if not self.is_new():
            frappe.throw(_("Protokolleinträge sind unveränderlich."))

    def on_trash(self):
        if "System Manager" not in frappe.get_roles():
            frappe.throw(_("Protokolleinträge werden nicht gelöscht."))
