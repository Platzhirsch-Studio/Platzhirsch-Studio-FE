"""Servicekosten: intern / extern / Kulanz, an Kunden verrechnet, Regress erhalten, Nettokosten – gruppiert nach Monat, Marke, Art oder Fehlerbereich."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate

GRUPPEN = {"Monat": "monat", "Marke": "marke", "Art": "art", "Fehlerbereich": "fehlerbereich", "Entscheidung": "entscheidung"}


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    gruppe = GRUPPEN.get(filters.get("nach") or "Monat", "monat")
    faelle = frappe.get_all(
        "PH Servicefall",
        filters={"gemeldet_am": ("between", [von, bis])},
        fields=["name", "gemeldet_am", "marke", "art", "fehlerbereich", "entscheidung", "kosten_intern_cent", "kosten_extern_cent", "kosten_kulanz_cent", "kosten_gesamt_cent", "kosten_kunde_cent", "regress_erhalten_cent", "regress_gefordert_cent", "netto_kosten_cent"],
    )
    agg = {}
    for f in faelle:
        key = getdate(f.gemeldet_am).strftime("%Y-%m") if gruppe == "monat" else (f.get(gruppe) or _("ohne"))
        a = agg.setdefault(key, {"gruppe": key, "faelle": 0, "intern": 0, "extern": 0, "kulanz": 0, "gesamt": 0, "kunde": 0, "regress_gef": 0, "regress": 0, "netto": 0})
        a["faelle"] += 1
        a["intern"] += cint(f.kosten_intern_cent)
        a["extern"] += cint(f.kosten_extern_cent)
        a["kulanz"] += cint(f.kosten_kulanz_cent)
        a["gesamt"] += cint(f.kosten_gesamt_cent)
        a["kunde"] += cint(f.kosten_kunde_cent)
        a["regress_gef"] += cint(f.regress_gefordert_cent)
        a["regress"] += cint(f.regress_erhalten_cent)
        a["netto"] += cint(f.netto_kosten_cent)
    data = []
    for key in sorted(agg.keys()) if gruppe == "monat" else sorted(agg.keys(), key=lambda k: -agg[k]["gesamt"]):
        a = agg[key]
        data.append({**{k: (v / 100 if k not in ("gruppe", "faelle") else v) for k, v in a.items()}, "je_fall": round(a["netto"] / 100 / a["faelle"], 2) if a["faelle"] else 0})
    columns = [
        {"fieldname": "gruppe", "label": _(filters.get("nach") or "Monat"), "fieldtype": "Data", "width": 150},
        {"fieldname": "faelle", "label": _("Fälle"), "fieldtype": "Int", "width": 70},
        {"fieldname": "intern", "label": _("Intern €"), "fieldtype": "Currency", "width": 100},
        {"fieldname": "extern", "label": _("Extern €"), "fieldtype": "Currency", "width": 100},
        {"fieldname": "kulanz", "label": _("Kulanz/Minderung €"), "fieldtype": "Currency", "width": 140},
        {"fieldname": "gesamt", "label": _("Gesamt €"), "fieldtype": "Currency", "width": 100},
        {"fieldname": "kunde", "label": _("An Kunden €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "regress_gef", "label": _("Regress gefordert €"), "fieldtype": "Currency", "width": 140},
        {"fieldname": "regress", "label": _("Regress erhalten €"), "fieldtype": "Currency", "width": 140},
        {"fieldname": "netto", "label": _("Netto €"), "fieldtype": "Currency", "width": 100},
        {"fieldname": "je_fall", "label": _("Netto je Fall €"), "fieldtype": "Currency", "width": 120},
    ]
    chart = {
        "data": {"labels": [d["gruppe"] for d in data], "datasets": [{"name": _("Intern"), "values": [d["intern"] for d in data]}, {"name": _("Extern"), "values": [d["extern"] for d in data]}, {"name": _("Kulanz"), "values": [d["kulanz"] for d in data]}, {"name": _("Regress erhalten"), "values": [d["regress"] for d in data]}]},
        "type": "bar",
        "barOptions": {"stacked": 1},
        "colors": ["#30373e", "#8a7a66", "#b45309", "#15803d"],
    }
    summary = [
        {"value": sum(d["gesamt"] for d in data), "label": _("Gesamtkosten €"), "datatype": "Currency"},
        {"value": sum(d["regress"] for d in data), "label": _("Regress erhalten €"), "datatype": "Currency", "indicator": "Green"},
        {"value": sum(d["netto"] for d in data), "label": _("Nettokosten €"), "datatype": "Currency", "indicator": "Red"},
    ]
    return columns, data, None, chart, summary
