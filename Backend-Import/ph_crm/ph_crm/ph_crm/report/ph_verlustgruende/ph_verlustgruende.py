"""Script Report: verlorene Anfragen je Grund / Mitbewerber im Zeitraum (verloren_am), mit Wert und Anteil."""

import frappe
from frappe import _
from frappe.utils import add_months, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von, bis = filters.get("von") or add_months(nowdate(), -12), filters.get("bis") or nowdate()
    gruppe = "mitbewerber" if filters.get("gruppe") == "mitbewerber" else "verloren_grund"
    zeilen = frappe.get_all("PH Anfrage", filters={"status": "Verloren", "verloren_am": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"])}, fields=["verloren_grund", "mitbewerber", "wert_cent", "art"])
    gesamt = len(zeilen) or 1
    je = {}
    for z in zeilen:
        k = z.get(gruppe) or _("(ohne Angabe)")
        e = je.setdefault(k, {"anzahl": 0, "wert": 0})
        e["anzahl"] += 1
        e["wert"] += int(z.wert_cent or 0)
    data = sorted(({"gruppe": _(k), "anzahl": v["anzahl"], "anteil": round(100 * v["anzahl"] / gesamt, 1), "wert": v["wert"] / 100} for k, v in je.items()), key=lambda d: -d["anzahl"])
    chart = {"data": {"labels": [d["gruppe"] for d in data], "datasets": [{"name": _("Anzahl"), "values": [d["anzahl"] for d in data]}]}, "type": "pie"}
    summary = [{"value": len(zeilen), "label": _("Verloren"), "datatype": "Int"}, {"value": sum(d["wert"] for d in data), "label": _("Verlorener Wert"), "datatype": "Currency", "indicator": "Red"}]
    return spalten(), data, None, chart, summary


def spalten():
    return [
        {"fieldname": "gruppe", "label": _("Grund / Mitbewerber"), "fieldtype": "Data", "width": 220},
        {"fieldname": "anzahl", "label": _("Anzahl"), "fieldtype": "Int", "width": 90},
        {"fieldname": "anteil", "label": _("Anteil %"), "fieldtype": "Float", "width": 90},
        {"fieldname": "wert", "label": _("Wert (€)"), "fieldtype": "Currency", "width": 140},
    ]
