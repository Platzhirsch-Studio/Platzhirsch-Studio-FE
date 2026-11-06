"""PH Dokument Regel – welche Dokumente am Packtisch beigelegt werden (packtisch_regeln.dokumente)."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHDokumentRegel(Document):
    def validate(self):
        if self.wert_ab_cent and self.wert_bis_cent and int(self.wert_ab_cent) > int(self.wert_bis_cent):
            frappe.throw(_("Warenwert ab ist größer als bis."))
        if int(self.anzahl or 0) < 1:
            self.anzahl = 1
        for f in ("laender", "laender_ausser"):
            self.set(f, ", ".join(x.strip().upper() for x in str(self.get(f) or "").replace(";", ",").split(",") if x.strip()) or None)
        if self.print_format and not frappe.db.exists("Print Format", self.print_format):
            frappe.throw(_("Druckformat {0} gibt es nicht.").format(self.print_format))
