import frappe
from frappe import _


def get_data():
    items = []
    for dt in ("PH Projekt", "PH Angebot"):
        if frappe.db.exists("DocType", dt) and frappe.get_meta(dt).has_field("beratungsgespraech"):
            items.append(dt)
    transactions = [{"label": _("Aufgaben"), "items": ["PH Aufgabe"]}]
    if items:
        transactions.insert(0, {"label": _("Folge"), "items": items})
    return {"fieldname": "beratungsgespraech", "non_standard_fieldnames": {"PH Aufgabe": "referenz_name"}, "transactions": transactions}
