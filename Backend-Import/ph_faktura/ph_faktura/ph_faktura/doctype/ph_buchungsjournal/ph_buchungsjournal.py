"""PH Buchungsjournal – nur lesen; Einträge schreibt ph_faktura.journal.schreibe()."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHBuchungsjournal(Document):
    def validate(self):
        if not self.is_new():
            frappe.throw(_("Journaleinträge sind unveränderlich."))

    def on_trash(self):
        if frappe.session.user != "Administrator":
            frappe.throw(_("Journaleinträge werden nicht gelöscht."))
