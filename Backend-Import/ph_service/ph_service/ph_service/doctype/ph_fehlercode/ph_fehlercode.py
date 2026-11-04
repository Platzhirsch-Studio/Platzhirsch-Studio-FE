import re

import frappe
from frappe import _
from frappe.model.document import Document

CODE_RE = re.compile(r"^[A-Z]{2,4}-\d{2,3}$")


class PHFehlercode(Document):
    def validate(self):
        self.code = (self.code or "").strip().upper()
        if not CODE_RE.match(self.code):
            frappe.throw(_("Code im Format BEREICH-NN, z. B. OBF-01."))
        if self.bereich and not self.code.startswith(self.bereich + "-"):
            frappe.throw(_("Code muss mit dem Bereichskürzel {0}- beginnen.").format(self.bereich))
        self.bezeichnung = (self.bezeichnung or "").strip()
        bereich_name = frappe.db.get_value("PH Fehlerbereich", self.bereich, "bezeichnung") or self.bereich
        self.titel = f"{bereich_name} / {self.bezeichnung} ({self.code})"[:140]
        if not self.is_new():
            self.anzahl_faelle = frappe.db.count("PH Servicefall", {"fehlercode": self.name})

    def on_update(self):
        try:
            frappe.db.set_value("PH Fehlerbereich", self.bereich, "anzahl_codes", frappe.db.count("PH Fehlercode", {"bereich": self.bereich, "aktiv": 1}), update_modified=False)
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Fehlercode: Zähler Bereich")


@frappe.whitelist()
def katalog(nur_aktive=1):
    """Bereiche mit Codes (für Dialoge, Portal und Website-Formular)."""
    bereiche = frappe.get_all("PH Fehlerbereich", filters={"aktiv": 1} if int(nur_aktive) else {}, fields=["name", "bezeichnung", "beschreibung", "sortierung"], order_by="sortierung asc")
    codes = frappe.get_all("PH Fehlercode", filters={"aktiv": 1} if int(nur_aktive) else {}, fields=["name", "bereich", "bezeichnung", "gruppe", "lieferantenrelevant", "kundentext"], order_by="code asc")
    je_bereich = {}
    for c in codes:
        je_bereich.setdefault(c.bereich, []).append({"code": c.name, "bezeichnung": c.bezeichnung, "gruppe": c.gruppe, "lieferantenrelevant": c.lieferantenrelevant, "kundentext": c.kundentext})
    return [{"code": b.name, "bezeichnung": b.bezeichnung, "beschreibung": b.beschreibung, "fehlercodes": je_bereich.get(b.name, [])} for b in bereiche]
