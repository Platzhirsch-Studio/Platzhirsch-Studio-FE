"""PH Packhinweis Regel – Packhinweis vor dem Verpacken, wenn alle gesetzten Bedingungen passen (packtisch_regeln.packhinweise)."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHPackhinweisRegel(Document):
    def validate(self):
        if self.wert_ab_cent and self.wert_bis_cent and int(self.wert_ab_cent) > int(self.wert_bis_cent):
            frappe.throw(_("Warenwert ab ist größer als bis."))
        self.laender = ", ".join(x.strip().upper() for x in str(self.laender or "").replace(";", ",").split(",") if x.strip()) or None
