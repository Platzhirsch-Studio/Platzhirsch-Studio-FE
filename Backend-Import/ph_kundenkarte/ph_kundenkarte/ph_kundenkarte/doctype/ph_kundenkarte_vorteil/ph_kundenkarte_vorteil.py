"""PH Kundenkarte Vorteil – Katalog der Leistungsvorteile (ohne Geldwert)."""

import frappe
from frappe import _
from frappe.model.document import Document

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_stufe.ph_kundenkarte_stufe import texte_pruefen


class PHKundenkarteVorteil(Document):
    def validate(self):
        self.titel = (self.titel or "").strip()[:140]
        if not self.titel:
            frappe.throw(_("Titel fehlt."))
        if int(self.einloesbar_pro_jahr or 0) < 0:
            self.einloesbar_pro_jahr = 0
        texte_pruefen(self.titel, self.beschreibung_kunde)

    def on_update(self):
        frappe.cache().delete_value("ph_kundenkarte:stufen")
