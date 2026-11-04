import frappe
from frappe import _


def get_data():
    folge = ["PH Termin"]
    for dt in ("PH Projekt", "PH Angebot"):
        if frappe.db.exists("DocType", dt) and frappe.get_meta(dt).has_field("anfrage"):
            folge.append(dt)
    return {
        "fieldname": "anfrage",
        "non_standard_fieldnames": {"PH Aufgabe": "referenz_name", "ToDo": "reference_name"},
        "transactions": [{"label": _("Folge"), "items": folge}, {"label": _("Aufgaben"), "items": ["PH Aufgabe", "ToDo"]}],
    }
