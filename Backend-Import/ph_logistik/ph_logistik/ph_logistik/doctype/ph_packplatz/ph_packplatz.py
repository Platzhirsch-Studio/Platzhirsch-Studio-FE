"""PH Packplatz – Profil je Packtisch-Gerät (Drucker je Dokumentart, Töne, Mengenbestätigung, Gewicht, Schnellversand)."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHPackplatz(Document):
    def validate(self):
        self.geraet = (self.geraet or "").strip()
        if not self.bezeichnung:
            self.bezeichnung = self.geraet
        if int(self.gewicht_toleranz_promille or 0) < 0 or int(self.gewicht_toleranz_min_g or 0) < 0:
            frappe.throw(_("Toleranzen dürfen nicht negativ sein."))
        if self.standard:
            for n in frappe.get_all("PH Packplatz", {"standard": 1, "name": ("!=", self.name or "")}, pluck="name"):
                frappe.db.set_value("PH Packplatz", n, "standard", 0, update_modified=False)


STANDARD = {"ton_erfolg": 1, "ton_fehler": 1, "mengen_bestaetigen": 1, "hand_bestaetigung_erlaubt": 1, "gewicht_pflicht": 1, "gewicht_toleranz_promille": 250, "gewicht_toleranz_min_g": 300, "schnellversand": 0, "etikett_empfehlung": 1}


def profil(geraet=None):
    """Packplatz-Profil als dict: Gerätename → aktiver Packplatz, sonst Standard-Packplatz, sonst Standardwerte."""
    name = None
    if geraet and frappe.db.exists("PH Packplatz", {"name": geraet, "aktiv": 1}):
        name = geraet
    if not name:
        name = frappe.db.get_value("PH Packplatz", {"standard": 1, "aktiv": 1}, "name")
    if not name:
        return dict(STANDARD, name=None, geraet=geraet)
    d = frappe.get_doc("PH Packplatz", name).as_dict()
    return {**STANDARD, **{k: v for k, v in d.items() if v is not None}}
