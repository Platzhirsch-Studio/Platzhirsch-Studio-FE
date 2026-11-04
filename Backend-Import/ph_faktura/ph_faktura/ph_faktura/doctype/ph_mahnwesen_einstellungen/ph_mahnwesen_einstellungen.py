import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint


class PHMahnwesenEinstellungen(Document):
    def validate(self):
        if not cint(self.stufe1_tage) < cint(self.stufe2_tage) < cint(self.stufe3_tage):
            frappe.throw(_("Mahnstufen müssen aufsteigende Tage haben (z. B. 7 / 14 / 21)."))
        if cint(self.zinsen_ab_stufe) not in (1, 2, 3):
            self.zinsen_ab_stufe = 2

    def on_update(self):
        from ph_faktura.einstellungen import cache_leeren

        cache_leeren()


@frappe.whitelist()
def mahnlauf_starten(nur_vorschlag=0):
    """Button „Mahnlauf starten“ in den Einstellungen (Leitung/Buchhaltung)."""
    if not set(frappe.get_roles()) & {"PH Faktura Leitung", "PH Faktura Leitung", "System Manager", "PH Geschäftsführung"}:
        frappe.throw(_("Keine Berechtigung für den Mahnlauf."))
    from ph_faktura.ph_faktura.tasks import mahnlauf

    return mahnlauf(nur_vorschlag=cint(nur_vorschlag))
