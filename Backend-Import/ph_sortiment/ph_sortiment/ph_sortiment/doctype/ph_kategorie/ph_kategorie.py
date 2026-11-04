"""PH Kategorie – Kategorie/Subkategorie der Website (key = category_key/Slug)."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_sortiment.logik.slug import ist_slug, slug as mk_slug


class PHKategorie(Document):
    def validate(self):
        self.key = mk_slug(self.key or self.label_de)
        if not ist_slug(self.key):
            frappe.throw(_("Schlüssel muss Slug-Form haben (a–z, 0–9, Bindestrich)."))
        if self.uebergeordnet == self.name:
            frappe.throw(_("Eine Kategorie kann nicht sich selbst übergeordnet sein."))
        if self.uebergeordnet and frappe.db.get_value("PH Kategorie", self.uebergeordnet, "uebergeordnet"):
            frappe.throw(_("Nur eine Ebene Subkategorien (Website: Produkte Kategorie → Sub Kategorie)."))
        self.bereiche = ",".join(sorted({b.strip() for b in (self.bereiche or "").split(",") if b.strip()}))
        for loc in ("en", "fr", "it"):
            if not self.get(f"label_{loc}"):
                self.set(f"label_{loc}", self.label_de)
        if not self.is_new():
            self.produkte_anzahl = frappe.db.count("PH Produkt", {"kategorie": self.name, "status": "Aktiv", "website_sichtbar": 1})

    def on_update(self):
        try:
            from ph_sortiment.ph_sortiment.ereignisse import website_aktualisieren

            website_aktualisieren("kategorien")
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Kategorie: Website-Aktualisierung fehlgeschlagen")
