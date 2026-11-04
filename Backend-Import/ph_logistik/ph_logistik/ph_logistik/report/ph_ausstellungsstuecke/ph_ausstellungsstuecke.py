"""Script Report: Ausstellungsstücke mit Alter (Tage seit Eingang), Standort, VK-Preis, Reservierung."""

import frappe
from frappe import _
from frappe.utils import date_diff, nowdate


def execute(filters=None):
    f = frappe._dict(filters or {})
    filt = {"ausstellungsstueck": 1, "status": ("in", ["Verfuegbar", "Reserviert"])}
    if f.get("lagerort"):
        filt["lagerort"] = f.lagerort
    rows = frappe.get_all("PH Lagerbestand", filt, ["name", "produkt", "produkt_name", "marke", "lagerort", "platz", "seriennummer", "zustand", "eingang_am", "vk_cent_ausstellung", "status", "reserviert_fuer_doctype", "reserviert_fuer"], order_by="eingang_am asc")
    mind = int(f.get("mindestalter_tage") or 0)
    data = []
    for r in rows:
        alter = date_diff(nowdate(), r.eingang_am) if r.eingang_am else None
        if mind and (alter is None or alter < mind):
            continue
        data.append({**r, "alter_tage": alter, "alter_klasse": _("> 1 Jahr") if (alter or 0) > 365 else _("> 6 Monate") if (alter or 0) > 180 else _("neu")})
    columns = [
        {"fieldname": "name", "label": _("Bestand"), "fieldtype": "Link", "options": "PH Lagerbestand", "width": 120},
        {"fieldname": "produkt_name", "label": _("Artikel"), "fieldtype": "Data", "width": 240},
        {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Data", "width": 110},
        {"fieldname": "lagerort", "label": _("Standort"), "fieldtype": "Link", "options": "PH Lagerort", "width": 130},
        {"fieldname": "platz", "label": _("Platz"), "fieldtype": "Data", "width": 90},
        {"fieldname": "seriennummer", "label": _("Seriennummer"), "fieldtype": "Data", "width": 120},
        {"fieldname": "zustand", "label": _("Zustand"), "fieldtype": "Data", "width": 90},
        {"fieldname": "eingang_am", "label": _("Eingang"), "fieldtype": "Date", "width": 100},
        {"fieldname": "alter_tage", "label": _("Alter (Tage)"), "fieldtype": "Int", "width": 90},
        {"fieldname": "alter_klasse", "label": _("Klasse"), "fieldtype": "Data", "width": 90},
        {"fieldname": "vk_cent_ausstellung", "label": _("VK Ausstellung (Cent)"), "fieldtype": "Int", "width": 140},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 90},
        {"fieldname": "reserviert_fuer", "label": _("Reserviert für"), "fieldtype": "Dynamic Link", "options": "reserviert_fuer_doctype", "width": 150},
    ]
    klassen = {}
    for d in data:
        klassen[d["alter_klasse"]] = klassen.get(d["alter_klasse"], 0) + 1
    chart = {"data": {"labels": list(klassen.keys()), "datasets": [{"name": _("Stücke"), "values": list(klassen.values())}]}, "type": "donut", "colors": ["#15803d", "#b45309", "#b91c1c"]} if klassen else None
    summary = [{"value": len(data), "label": _("Ausstellungsstücke"), "datatype": "Int"}, {"value": sum(d["vk_cent_ausstellung"] or 0 for d in data) / 100, "label": _("VK gesamt €"), "datatype": "Currency", "currency": "EUR"}, {"value": sum(1 for d in data if (d["alter_tage"] or 0) > 365), "label": _("> 1 Jahr"), "datatype": "Int", "indicator": "Orange"}]
    return columns, data, None, chart, summary
