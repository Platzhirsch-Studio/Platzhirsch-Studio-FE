"""Bestehende Karten/Anträge: geburtstag_tag_monat aus geburtstag ableiten (Geburtstags-Aufgabe liest Tag/Monat)."""

import frappe
from frappe.utils import getdate


def execute():
    for dt in ("PH Kundenkarte", "PH Kundenkarte Antrag"):
        if not frappe.db.has_column(dt, "geburtstag_tag_monat"):
            continue
        for z in frappe.get_all(dt, filters={"geburtstag": ("is", "set"), "geburtstag_tag_monat": ("is", "not set")}, fields=["name", "geburtstag"]):
            frappe.db.set_value(dt, z.name, "geburtstag_tag_monat", getdate(z.geburtstag).strftime("%m-%d"), update_modified=False)
