"""Number-Card-Methoden (fixtures/number_card.json, type Custom) – Rückgabe {"value": n, "fieldtype": "Int"}."""

import frappe
from frappe.utils import add_days, now_datetime


@frappe.whitelist()
def einloesungen_30_tage():
    n = frappe.db.count("PH Kundenkarte Einloesung", {"status": "Eingeloest", "eingeloest_am": (">=", add_days(now_datetime(), -30))})
    return {"value": n, "fieldtype": "Int", "route_options": {"status": "Eingeloest"}, "route": ["ph-kundenkarte-einloesung"]}
