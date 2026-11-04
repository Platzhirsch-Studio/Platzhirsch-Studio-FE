"""PH Lagerort – Showroom, Lager, Fahrzeug, Extern, Kunde."""

import frappe
from frappe import _
from frappe.model.document import Document


class PHLagerort(Document):
    def validate(self):
        self.bezeichnung = (self.bezeichnung or "").strip()
        if self.standard:
            andere = frappe.get_all("PH Lagerort", {"standard": 1, "name": ("!=", self.name or "")}, pluck="name")
            for n in andere:
                frappe.db.set_value("PH Lagerort", n, "standard", 0, update_modified=False)
        plaetze = [p.platz for p in self.plaetze]
        if len(plaetze) != len(set(plaetze)):
            frappe.throw(_("Lagerplätze müssen eindeutig sein."))

    def on_trash(self):
        if frappe.db.exists("PH Lagerbestand", {"lagerort": self.name, "menge": (">", 0)}):
            frappe.throw(_("Lagerort hat Bestand und kann nicht gelöscht werden – bitte deaktivieren."))

    @frappe.whitelist()
    def bestand(self):
        self.check_permission("read")
        return frappe.get_all(
            "PH Lagerbestand",
            {"lagerort": self.name, "status": ("!=", "Ausgeschieden")},
            ["name", "produkt", "produkt_name", "platz", "menge", "reserviert", "verfuegbar", "seriennummer", "ausstellungsstueck", "status"],
            order_by="platz, produkt_name",
        )


def standard_lagerort():
    from ph_logistik.ph_logistik.helfer import einstellungen

    return einstellungen().get("standard_lagerort") or frappe.db.get_value("PH Lagerort", {"standard": 1}, "name") or frappe.db.get_value("PH Lagerort", {"art": "Lager", "aktiv": 1}, "name")
