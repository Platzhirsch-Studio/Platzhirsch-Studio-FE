import frappe
from frappe import _
from frappe.model.document import Document


class PHFehlerbereich(Document):
    def validate(self):
        self.code = (self.code or "").strip().upper()
        if not self.code.isalpha() or not 2 <= len(self.code) <= 4:
            frappe.throw(_("Kürzel: 2–4 Buchstaben, z. B. OBF."))
        self.bezeichnung = (self.bezeichnung or "").strip()
        if not self.is_new():
            self.anzahl_codes = frappe.db.count("PH Fehlercode", {"bereich": self.name, "aktiv": 1})

    def after_insert(self):
        sonstiges_anlegen(self.name, self.bezeichnung)


def sonstiges_anlegen(bereich, bezeichnung=None):
    """Fallback-Code <BER>-99 „Sonstiges“ je Bereich – ohne Fehlercode ist „Prüfung abschließen“ unmöglich
    (Kritik 20-ux-service P11, Konzept §12 Priorität 1). Idempotent."""
    code = f"{bereich}-99"
    if frappe.db.exists("PH Fehlercode", code):
        return code
    frappe.get_doc(
        {
            "doctype": "PH Fehlercode",
            "code": code,
            "bereich": bereich,
            "bezeichnung": _("Sonstiges ({0})").format(bezeichnung or bereich),
            "gruppe": "Sonstiges",
            "lieferantenrelevant": 0,
            "sortierung": 999,
            "aktiv": 1,
            "pruefhinweis": _("Fehler passt zu keinem Code – im Prüfergebnis beschreiben und der Leitung einen neuen Code vorschlagen."),
        }
    ).insert(ignore_permissions=True)
    return code
