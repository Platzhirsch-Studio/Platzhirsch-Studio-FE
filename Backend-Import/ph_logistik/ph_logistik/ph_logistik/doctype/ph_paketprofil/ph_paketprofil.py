"""PH Paketprofil – Karton-Außenmaße und Gewicht je Pakettyp (Quelle paketprofile.js)."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHPaketprofil(Document):
    def validate(self):
        self.key = (self.key or "").strip().lower().replace(" ", "-")
        masse = sorted([int(self.laenge_cm or 0), int(self.breite_cm or 0), int(self.hoehe_cm or 0)], reverse=True)
        if min(masse) <= 0 or int(self.gewicht_g or 0) <= 0:
            frappe.throw(_("Maße und Gewicht müssen größer 0 sein."))
        self.laenge_cm, self.breite_cm, self.hoehe_cm = masse
        if self.glas:
            self.zerbrechlich = 1
        if self.standard:
            for n in frappe.get_all("PH Paketprofil", {"familie": self.familie, "standard": 1, "name": ("!=", self.name or "")}, pluck="name"):
                frappe.db.set_value("PH Paketprofil", n, "standard", 0, update_modified=False)
        if self.geprueft and self.quelle and "Schätzung" in self.quelle:
            self.quelle = _("Gemessen")

    def as_profil(self):
        return {k: self.get(k) for k in ("key", "bezeichnung", "familie", "laenge_cm", "breite_cm", "hoehe_cm", "gewicht_g", "tara_g", "max_artikel_gewicht_g", "max_stueck", "zerbrechlich", "glas", "kerze", "geprueft", "versand_gesperrt", "gefahrgut_pruefen", "sdb_geprueft")}


def profile_map(nur_aktiv=True):
    filt = {"aktiv": 1} if nur_aktiv else {}
    rows = frappe.get_all("PH Paketprofil", filt, ["name as key", "bezeichnung", "familie", "laenge_cm", "breite_cm", "hoehe_cm", "gewicht_g", "tara_g", "max_artikel_gewicht_g", "max_stueck", "zerbrechlich", "glas", "kerze", "geprueft", "versand_gesperrt", "gefahrgut_pruefen", "sdb_geprueft", "standard"])
    return {r["key"]: r for r in rows}


def vorschlag_fuer(produkt_info):
    """Paketprofil-Vorschlag aus Produkt (Custom Field) oder Kategorie → Familie → Standardprofil."""
    from ph_logistik.ph_logistik.paketprofile import KATEGORIE_FAMILIE

    if produkt_info.get("paketprofil"):
        return produkt_info["paketprofil"]
    fam = KATEGORIE_FAMILIE.get(str(produkt_info.get("kategorie") or "").lower())
    if not fam:
        return None
    return frappe.db.get_value("PH Paketprofil", {"familie": fam, "standard": 1, "aktiv": 1}, "name") or frappe.db.get_value("PH Paketprofil", {"familie": fam, "aktiv": 1}, "name", order_by="gewicht_g asc")
