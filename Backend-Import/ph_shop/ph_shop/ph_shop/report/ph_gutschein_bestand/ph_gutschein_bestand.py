"""Script Report PH Gutschein Bestand: ausgegeben, eingelöst, Restwert (= Verbindlichkeit) je Ausgabemonat zum Stichtag."""

import frappe
from frappe import _
from frappe.utils import cint, getdate, nowdate

OFFEN = ("Aktiv", "Teilweise eingeloest")


def execute(filters=None):
    filters = frappe._dict(filters or {})
    stichtag = getdate(filters.get("stichtag") or nowdate())
    bed = {"ausgegeben_am": ("<=", f"{stichtag} 23:59:59")}
    if not cint(filters.get("mit_test")):
        bed["test"] = 0
    gs = frappe.get_all("PH Gutschein", bed, ["name", "ausgegeben_am", "status", "wert_cent", "rest_cent", "kanal_ausgabe", "gueltig_bis"])
    einl = {}
    if gs:
        for e in frappe.get_all("PH Gutschein Einloesung", {"parent": ("in", [g.name for g in gs]), "datum": ("<=", f"{stichtag} 23:59:59")}, ["parent", "betrag_cent"]):
            einl[e.parent] = einl.get(e.parent, 0) + cint(e.betrag_cent)
    agg = {}
    for g in gs:
        key = getdate(g.ausgegeben_am).strftime("%Y-%m")
        a = agg.setdefault(key, {"monat": key, "anzahl": 0, "ausgegeben": 0, "eingeloest": 0, "rest": 0, "offen": 0, "gesperrt": 0, "online": 0, "showroom": 0})
        a["anzahl"] += 1
        a["ausgegeben"] += cint(g.wert_cent)
        a["eingeloest"] += einl.get(g.name, 0)
        rest_stichtag = cint(g.wert_cent) - einl.get(g.name, 0)
        if g.status in OFFEN:
            a["rest"] += rest_stichtag
            a["offen"] += 1
        elif g.status in ("Gesperrt", "Erstattet", "Abgelaufen"):
            a["gesperrt"] += 1
        if g.kanal_ausgabe == "Online":
            a["online"] += 1
        else:
            a["showroom"] += 1
    data = [{**a, "ausgegeben": a["ausgegeben"] / 100, "eingeloest": a["eingeloest"] / 100, "rest": a["rest"] / 100} for a in sorted(agg.values(), key=lambda x: x["monat"])]
    cols = [
        {"fieldname": "monat", "label": _("Ausgabemonat"), "fieldtype": "Data", "width": 110},
        {"fieldname": "anzahl", "label": _("Ausgestellt"), "fieldtype": "Int", "width": 90},
        {"fieldname": "online", "label": _("Online"), "fieldtype": "Int", "width": 70},
        {"fieldname": "showroom", "label": _("Showroom/Ersatz"), "fieldtype": "Int", "width": 120},
        {"fieldname": "offen", "label": _("Offen (Stück)"), "fieldtype": "Int", "width": 100},
        {"fieldname": "gesperrt", "label": _("Gesperrt/Erstattet"), "fieldtype": "Int", "width": 120},
        {"fieldname": "ausgegeben", "label": _("Ausgegeben €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "eingeloest", "label": _("Eingelöst €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "rest", "label": _("Restwert € (Verbindlichkeit)"), "fieldtype": "Currency", "width": 170},
    ]
    chart = {"data": {"labels": [d["monat"] for d in data], "datasets": [{"name": _("Ausgegeben"), "values": [d["ausgegeben"] for d in data]}, {"name": _("Restwert"), "values": [d["rest"] for d in data]}]}, "type": "bar", "colors": ["#8a7a66", "#b45309"]}
    summary = [
        {"value": sum(d["rest"] for d in data), "label": _("Restwert gesamt €"), "datatype": "Currency", "indicator": "Orange"},
        {"value": sum(d["eingeloest"] for d in data), "label": _("Eingelöst €"), "datatype": "Currency", "indicator": "Green"},
        {"value": sum(d["offen"] for d in data), "label": _("Offene Gutscheine"), "datatype": "Int"},
    ]
    hinweis = _("Mehrzweckgutscheine: Umsatz entsteht bei Einlösung, Restwert ist eine Verbindlichkeit. Bis Migrationsschritt M6 führt die Website das Register der online verkauften Gutscheine; hier erscheinen nur in Frappe ausgestellte.")
    return cols, data, hinweis, chart, summary
