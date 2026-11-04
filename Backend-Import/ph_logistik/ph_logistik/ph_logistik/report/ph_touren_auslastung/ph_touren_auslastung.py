"""Script Report: Touren je Woche – Anzahl, Stopps, erledigt, km, Ø Stopps je Tour (optional je Fahrzeug)."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate


def execute(filters=None):
    f = frappe._dict(filters or {})
    von = getdate(f.get("von") or add_months(nowdate(), -3))
    bis = getdate(f.get("bis") or nowdate())
    filt = {"datum": ("between", [von, bis]), "status": ("!=", "Abgebrochen")}
    if f.get("fahrzeug"):
        filt["fahrzeug"] = f.fahrzeug
    rows = frappe.get_all("PH Tour", filt, ["name", "datum", "fahrzeug", "fahrer", "status", "anzahl_stopps", "anzahl_erledigt", "km_start", "km_ende"], order_by="datum")
    agg = {}
    for r in rows:
        jahr, kw, _wd = r.datum.isocalendar()
        key = f"{jahr}-KW{kw:02d}"
        a = agg.setdefault(key, {"woche": key, "touren": 0, "stopps": 0, "erledigt": 0, "km": 0, "abgeschlossen": 0})
        a["touren"] += 1
        a["stopps"] += r.anzahl_stopps or 0
        a["erledigt"] += r.anzahl_erledigt or 0
        a["abgeschlossen"] += 1 if r.status == "Abgeschlossen" else 0
        if r.km_start and r.km_ende and r.km_ende > r.km_start:
            a["km"] += r.km_ende - r.km_start
    data = []
    for a in sorted(agg.values(), key=lambda x: x["woche"]):
        a["stopps_je_tour"] = round(a["stopps"] / a["touren"], 1) if a["touren"] else 0
        a["quote_erledigt"] = round(100 * a["erledigt"] / a["stopps"], 1) if a["stopps"] else 0
        data.append(a)
    columns = [
        {"fieldname": "woche", "label": _("Woche"), "fieldtype": "Data", "width": 110},
        {"fieldname": "touren", "label": _("Touren"), "fieldtype": "Int", "width": 80},
        {"fieldname": "abgeschlossen", "label": _("Abgeschlossen"), "fieldtype": "Int", "width": 110},
        {"fieldname": "stopps", "label": _("Stopps"), "fieldtype": "Int", "width": 80},
        {"fieldname": "erledigt", "label": _("Erledigt"), "fieldtype": "Int", "width": 80},
        {"fieldname": "quote_erledigt", "label": _("Quote %"), "fieldtype": "Percent", "width": 90},
        {"fieldname": "stopps_je_tour", "label": _("Ø Stopps je Tour"), "fieldtype": "Float", "width": 120},
        {"fieldname": "km", "label": _("km"), "fieldtype": "Int", "width": 80},
    ]
    chart = {"data": {"labels": [d["woche"] for d in data], "datasets": [{"name": _("Touren"), "values": [d["touren"] for d in data]}, {"name": _("Stopps"), "values": [d["stopps"] for d in data]}]}, "type": "bar", "colors": ["#15803d", "#30373e"]} if data else None
    summary = [{"value": len(rows), "label": _("Touren"), "datatype": "Int"}, {"value": sum(d["stopps"] for d in data), "label": _("Stopps"), "datatype": "Int"}, {"value": sum(d["km"] for d in data), "label": _("km"), "datatype": "Int"}]
    return columns, data, None, chart, summary
