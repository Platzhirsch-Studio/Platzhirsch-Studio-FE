"""PH Schicht – Schichtvorlage."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_personal.utils.dienstplan import uhrzeit_min


class PHSchicht(Document):
    def validate(self):
        self.kurzname = (self.kurzname or "").strip().upper()
        b, e = uhrzeit_min(self.beginn), uhrzeit_min(self.ende)
        if b is None or e is None or e <= b:
            frappe.throw(_("„Ende“ muss nach „Beginn“ liegen (keine Schicht über Mitternacht)."))
        self.pause_min = max(0, int(self.pause_min or 0))
        self.netto_min = max(0, e - b - self.pause_min)
        from ph_personal.utils.arbeitszeit import pause_pflicht_min

        if self.pause_min < pause_pflicht_min(e - b):
            frappe.msgprint(_("Hinweis: Schicht über 6 Stunden braucht mindestens 30 Minuten Ruhepause (AZG § 11)."), indicator="orange")
