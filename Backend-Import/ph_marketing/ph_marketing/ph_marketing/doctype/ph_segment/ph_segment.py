"""PH Segment – Regeln prüfen, Vorschau zählen, Empfänger liefern (Logik: utils/segment.py, Daten: segmente.py)."""

import re

import frappe
from frappe import _
from frappe.model.document import Document

from ph_marketing.utils import segment as seg

ID_RE = re.compile(r"^[a-z0-9][a-z0-9\-]{2,60}$")


class PHSegment(Document):
    def validate(self):
        self.segment_id = (self.segment_id or "").strip().lower()
        if not ID_RE.match(self.segment_id):
            frappe.throw(_("Kennung nur Kleinbuchstaben, Ziffern und Bindestrich."))
        for r in self.regeln:
            fehler = seg.regel_pruefen_syntax(r.kriterium, r.operator, r.wert, r.wert_bis)
            if fehler:
                frappe.throw(_("Regel {0}: {1}").format(r.idx, fehler))

    @frappe.whitelist()
    def vorschau(self, speichern=1):
        """Zähler + Ausschlussgründe + erste 20 Empfänger (E-Mail maskiert)."""
        self.check_permission("read")
        from ph_marketing.ph_marketing import segmente

        return segmente.vorschau(self, speichern=frappe.utils.cint(speichern))
