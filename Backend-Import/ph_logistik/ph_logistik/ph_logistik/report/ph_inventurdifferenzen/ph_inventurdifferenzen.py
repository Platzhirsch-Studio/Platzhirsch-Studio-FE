"""Script Report: Inventurdifferenzen je Inventur/Position mit Grund (abgeschlossene und laufende Inventuren im Zeitraum)."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate


def execute(filters=None):
    f = frappe._dict(filters or {})
    von = getdate(f.get("von") or add_months(nowdate(), -3))
    bis = getdate(f.get("bis") or nowdate())
    filt = {"datum": ("between", [von, bis]), "status": ("in", ["Laufend", "Abgeschlossen"])}
    if f.get("lagerort"):
        filt["lagerort"] = f.lagerort
    inventuren = frappe.get_all("PH Inventur", filt, ["name", "lagerort", "datum", "status", "anzahl_positionen", "differenz_positionen", "differenz_summe"], order_by="datum desc")
    data = []
    for inv in inventuren:
        pos = frappe.get_all("PH Inventur Position", {"parent": inv.name, "gezaehlt": 1, "differenz": ("!=", 0)}, ["lagerbestand", "produkt", "produkt_name", "platz", "seriennummer", "soll", "ist", "differenz", "grund", "bemerkung"], order_by="idx")
        for p in pos:
            data.append({"inventur": inv.name, "lagerort": inv.lagerort, "datum": inv.datum, "status": inv.status, **p})
    columns = [
        {"fieldname": "inventur", "label": _("Inventur"), "fieldtype": "Link", "options": "PH Inventur", "width": 140},
        {"fieldname": "datum", "label": _("Stichtag"), "fieldtype": "Date", "width": 100},
        {"fieldname": "lagerort", "label": _("Lagerort"), "fieldtype": "Link", "options": "PH Lagerort", "width": 130},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "lagerbestand", "label": _("Bestand"), "fieldtype": "Link", "options": "PH Lagerbestand", "width": 120},
        {"fieldname": "produkt_name", "label": _("Artikel"), "fieldtype": "Data", "width": 220},
        {"fieldname": "platz", "label": _("Platz"), "fieldtype": "Data", "width": 80},
        {"fieldname": "seriennummer", "label": _("SN"), "fieldtype": "Data", "width": 110},
        {"fieldname": "soll", "label": _("Soll"), "fieldtype": "Int", "width": 60},
        {"fieldname": "ist", "label": _("Ist"), "fieldtype": "Int", "width": 60},
        {"fieldname": "differenz", "label": _("Differenz"), "fieldtype": "Int", "width": 80},
        {"fieldname": "grund", "label": _("Grund"), "fieldtype": "Data", "width": 160},
        {"fieldname": "bemerkung", "label": _("Bemerkung"), "fieldtype": "Data", "width": 200},
    ]
    gruende = {}
    for d in data:
        gruende[d["grund"] or _("ohne")] = gruende.get(d["grund"] or _("ohne"), 0) + abs(d["differenz"] or 0)
    chart = {"data": {"labels": list(gruende.keys()), "datasets": [{"name": _("Stück"), "values": list(gruende.values())}]}, "type": "bar", "colors": ["#b91c1c"]} if gruende else None
    summary = [{"value": len(inventuren), "label": _("Inventuren"), "datatype": "Int"}, {"value": len(data), "label": _("Positionen mit Differenz"), "datatype": "Int", "indicator": "Red" if data else "Green"}, {"value": sum(d["differenz"] or 0 for d in data), "label": _("Netto-Differenz (Stück)"), "datatype": "Int"}]
    return columns, data, None, chart, summary
