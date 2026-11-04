"""Kennzahlen für Number Cards vom Typ „Custom“ (hooks: whitelisted, Rückgabe {value, fieldtype})."""

import frappe
from frappe.utils import add_days, now_datetime, nowdate


@frappe.whitelist()
def ueberfaellige_aufgaben():
    return {"value": frappe.db.count("PH Aufgabe", {"status": ("in", ["Offen", "In Arbeit"]), "faellig": ("<", nowdate())}), "fieldtype": "Int", "route_options": {"status": ["in", ["Offen", "In Arbeit"]], "faellig": ["<", nowdate()]}, "route": ["app", "ph-aufgabe"]}


@frappe.whitelist()
def termine_heute():
    heute = nowdate()
    return {"value": frappe.db.count("PH Termin", {"status": ("in", ["Unbestaetigt", "Bestaetigt"]), "start": ("between", [f"{heute} 00:00:00", f"{heute} 23:59:59"])}), "fieldtype": "Int", "route": ["app", "ph-termin"], "route_options": {"start": ["Timespan", "today"]}}


@frappe.whitelist()
def no_show_quote_90_tage():
    von = add_days(now_datetime(), -90)
    gesamt = frappe.db.count("PH Termin", {"status": ("in", ["Erledigt", "Nicht erschienen"]), "start": (">=", von)})
    ns = frappe.db.count("PH Termin", {"status": "Nicht erschienen", "start": (">=", von)})
    return {"value": round(100 * ns / gesamt, 1) if gesamt else 0, "fieldtype": "Percent"}


@frappe.whitelist()
def reaktionszeit_median_h():
    zeilen = frappe.get_all("PH Anfrage", filters={"erstreaktion_am": ("is", "set"), "eingang": (">=", add_days(now_datetime(), -30))}, fields=["eingang", "erstreaktion_am"])
    werte = sorted((z.erstreaktion_am - z.eingang).total_seconds() / 3600 for z in zeilen if z.erstreaktion_am and z.eingang)
    if not werte:
        return {"value": 0, "fieldtype": "Float"}
    mitte = len(werte) // 2
    median = werte[mitte] if len(werte) % 2 else (werte[mitte - 1] + werte[mitte]) / 2
    return {"value": round(median, 1), "fieldtype": "Float"}
