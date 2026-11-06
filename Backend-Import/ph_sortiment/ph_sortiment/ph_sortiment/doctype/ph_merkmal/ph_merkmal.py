"""PH Merkmal – Farbe/Material/Oberfläche/Duftfamilie für Filter und Ausführungen."""

import re

import frappe
from frappe import _
from frappe.model.document import Document

from ph_sortiment.logik.slug import slug as mk_slug

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


class PHMerkmal(Document):
    def validate(self):
        self.merkmal = (self.merkmal or "").strip()
        self.key = mk_slug(self.key or self.merkmal)
        if self.farbe_hex:
            self.farbe_hex = self.farbe_hex.strip().upper()
            if not HEX_RE.match(self.farbe_hex):
                frappe.throw(_("Farbe muss #RRGGBB sein."))
        if not self.label_de:
            self.label_de = self.merkmal
        for loc in ("en", "fr", "it"):
            if not self.get(f"label_{loc}"):
                self.set(f"label_{loc}", self.label_de)

    def on_update(self):
        # Filterlisten und colorKeys/materialKeys der Karten hängen an Status/website_sichtbar → Katalog-Cache leeren
        try:
            from ph_sortiment.ph_sortiment.ereignisse import website_aktualisieren

            website_aktualisieren("products")
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Merkmal: Website-Aktualisierung fehlgeschlagen")
