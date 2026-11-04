import frappe
from frappe import _


def get_data():
    items = ["PH Beratungsgespraech"]
    if frappe.db.exists("DocType", "PH Projekt") and frappe.get_meta("PH Projekt").has_field("termin"):
        items.append("PH Projekt")
    return {
        "fieldname": "termin",
        "non_standard_fieldnames": {"PH Aufgabe": "referenz_name"},
        "transactions": [{"label": _("Folge"), "items": items}, {"label": _("Aufgaben"), "items": ["PH Aufgabe"]}],
    }
