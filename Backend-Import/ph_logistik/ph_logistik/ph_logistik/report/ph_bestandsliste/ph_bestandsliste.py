"""Script Report: Bestand je Lagerort/Platz (Menge, reserviert, verfügbar), optional Einkaufswert (nur Leitung, permlevel 1)."""

import frappe
from frappe import _


def execute(filters=None):
    f = frappe._dict(filters or {})
    filt = {"status": ("in", ["Verfuegbar", "Reserviert"])}
    if f.get("lagerort"):
        filt["lagerort"] = f.lagerort
    if int(f.get("nur_ausstellung") or 0):
        filt["ausstellungsstueck"] = 1
    leitung = bool({"PH Logistik Leitung", "PH Geschäftsführung", "System Manager"} & set(frappe.get_roles()))
    mit_wert = bool(int(f.get("mit_wert") or 0)) and leitung
    felder = ["name", "lagerort", "platz", "produkt", "produkt_name", "marke", "ausfuehrung", "seriennummer", "menge", "reserviert", "verfuegbar", "ausstellungsstueck", "zustand", "eingang_am", "inventur_am", "vk_cent_ausstellung"]
    if mit_wert:
        felder.append("ek_cent")
    rows = frappe.get_all("PH Lagerbestand", filt, felder, order_by="lagerort, platz, produkt_name")
    data = []
    for r in rows:
        d = dict(r)
        if mit_wert:
            d["wert_cent"] = (r.ek_cent or 0) * (r.menge or 0)
        data.append(d)
    columns = [
        {"fieldname": "lagerort", "label": _("Lagerort"), "fieldtype": "Link", "options": "PH Lagerort", "width": 140},
        {"fieldname": "platz", "label": _("Platz"), "fieldtype": "Data", "width": 90},
        {"fieldname": "name", "label": _("Bestand"), "fieldtype": "Link", "options": "PH Lagerbestand", "width": 120},
        {"fieldname": "produkt_name", "label": _("Artikel"), "fieldtype": "Data", "width": 240},
        {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Data", "width": 110},
        {"fieldname": "seriennummer", "label": _("Seriennummer"), "fieldtype": "Data", "width": 120},
        {"fieldname": "menge", "label": _("Menge"), "fieldtype": "Int", "width": 70},
        {"fieldname": "reserviert", "label": _("Reserviert"), "fieldtype": "Int", "width": 90},
        {"fieldname": "verfuegbar", "label": _("Verfügbar"), "fieldtype": "Int", "width": 90},
        {"fieldname": "ausstellungsstueck", "label": _("Ausstellung"), "fieldtype": "Check", "width": 90},
        {"fieldname": "zustand", "label": _("Zustand"), "fieldtype": "Data", "width": 90},
        {"fieldname": "eingang_am", "label": _("Eingang"), "fieldtype": "Date", "width": 100},
        {"fieldname": "inventur_am", "label": _("Inventur"), "fieldtype": "Date", "width": 100},
    ]
    if mit_wert:
        columns += [{"fieldname": "ek_cent", "label": _("EK (Cent)"), "fieldtype": "Int", "width": 100}, {"fieldname": "wert_cent", "label": _("Wert (Cent)"), "fieldtype": "Int", "width": 110}]
    je_ort = {}
    for d in data:
        je_ort[d["lagerort"]] = je_ort.get(d["lagerort"], 0) + (d["menge"] or 0)
    chart = {"data": {"labels": list(je_ort.keys()), "datasets": [{"name": _("Stück"), "values": list(je_ort.values())}]}, "type": "bar", "colors": ["#8a7a66"]} if je_ort else None
    summary = [{"value": len(data), "label": _("Positionen"), "datatype": "Int"}, {"value": sum(d["menge"] or 0 for d in data), "label": _("Stück"), "datatype": "Int"}, {"value": sum(1 for d in data if d["ausstellungsstueck"]), "label": _("Ausstellungsstücke"), "datatype": "Int"}]
    if mit_wert:
        summary.append({"value": sum(d["wert_cent"] for d in data) / 100, "label": _("Lagerwert EK €"), "datatype": "Currency", "currency": "EUR"})
    return columns, data, None, chart, summary
