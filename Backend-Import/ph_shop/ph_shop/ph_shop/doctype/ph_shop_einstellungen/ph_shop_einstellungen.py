"""PH Shop Einstellungen – fachliche Schalter (keine Geheimnisse)."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint


class PHShopEinstellungen(Document):
    def validate(self):
        if cint(self.abholung_frist_tage) < 1 or cint(self.reservierung_frist_tage) < 1:
            frappe.throw(_("Fristen mindestens 1 Tag."))
        if cint(self.gutschein_min_cent) < 100:
            frappe.throw(_("Mindestwert mindestens 1 €."))
        if self.shop_modus == "live" and not self.agb_text:
            frappe.msgprint(_("Shop-Modus live ohne AGB-Text: Bestellbestätigungen gehen ohne AGB-Anhang hinaus."), indicator="orange")

    def on_update(self):
        frappe.clear_cache(doctype="PH Shop Einstellungen")
