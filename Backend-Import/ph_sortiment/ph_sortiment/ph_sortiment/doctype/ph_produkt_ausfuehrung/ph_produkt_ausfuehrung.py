"""PH Produkt Ausfuehrung – eine Option (Farbe/Größe/Ausführung) eines Produkts. Name = produkt::gruppe::option."""

import re

import frappe
from frappe import _
from frappe.model.document import Document

from ph_sortiment.logik.slug import ist_slug, slug as mk_slug

HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


class PHProduktAusfuehrung(Document):
    def autoname(self):
        self.gruppe_key = mk_slug(self.gruppe_key)
        self.option_id = mk_slug(self.option_id)
        self.name = f"{self.produkt}::{self.gruppe_key}::{self.option_id}"

    def validate(self):
        self.gruppe_key = mk_slug(self.gruppe_key)
        self.option_id = mk_slug(self.option_id)
        if not (ist_slug(self.gruppe_key) and ist_slug(self.option_id)):
            frappe.throw(_("Gruppe und Option brauchen Slug-Form."))
        if self.farbe_hex:
            self.farbe_hex = self.farbe_hex.strip().upper()
            if not HEX_RE.match(self.farbe_hex):
                frappe.throw(_("Farbe muss #RRGGBB sein."))
        for loc in ("en", "fr", "it"):
            if not self.get(f"name_{loc}"):
                self.set(f"name_{loc}", self.name_de)
        produkt_titel = frappe.db.get_value("PH Produkt", self.produkt, "titel") or self.produkt
        self.titel = f"{produkt_titel} – {self.name_de}"[:140]
        if self.standard:
            # Höchstens eine Standardoption je Gruppe (schema.js validateAusfuehrungen).
            andere = frappe.get_all("PH Produkt Ausfuehrung", filters={"produkt": self.produkt, "gruppe_key": self.gruppe_key, "standard": 1, "name": ("!=", self.name or "")}, pluck="name")
            for n in andere:
                frappe.db.set_value("PH Produkt Ausfuehrung", n, "standard", 0, update_modified=False)
        if (self.aufpreis_cent or 0) < 0 or (self.preis_cent or 0) < 0:
            frappe.throw(_("Preise dürfen nicht negativ sein."))

    def on_update(self):
        try:
            n = frappe.db.count("PH Produkt Ausfuehrung", {"produkt": self.produkt, "status": "Aktiv"})
            frappe.db.set_value("PH Produkt", self.produkt, "ausfuehrungen_anzahl", n, update_modified=False)
            from ph_sortiment.ph_sortiment.ereignisse import website_aktualisieren

            website_aktualisieren("products")
        except Exception:  # noqa: BLE001
            frappe.log_error(title="PH Produkt Ausfuehrung: Nebenwirkung fehlgeschlagen")
