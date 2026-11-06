"""Script Report: Kommissionsware je Projekt/Auftrag – was liegt wo (Lagerort/Platz), was ist gesperrt, was wird noch erwartet."""

import frappe
from frappe import _
from frappe.utils import date_diff, nowdate

from ph_logistik.ph_logistik.lager import _erwartet


def execute(filters=None):
    f = frappe._dict(filters or {})
    filt = {"kommission": f.kommission if f.get("kommission") else ("is", "set"), "status": ("not in", ["Ausgeschieden", "Verkauft"])}
    if f.get("lagerort"):
        filt["lagerort"] = f.lagerort
    if f.get("nur_gesperrt"):
        filt["gesperrt"] = 1
    rows = frappe.get_all("PH Lagerbestand", filt, ["name", "kommission", "produkt_name", "marke", "lagerort", "platz", "menge", "gesperrt", "sperrgrund", "zustand", "eingang_am"], order_by="kommission, lagerort, platz")
    data = [{**r, "art": _("im Lager"), "liegt_tage": date_diff(nowdate(), r.eingang_am) if r.eingang_am else None} for r in rows]
    if f.get("kommission") and not f.get("nur_gesperrt"):
        for e in _erwartet(f.kommission):
            offen = int(e.menge or 0) - int(e.menge_erhalten or 0)
            if offen > 0:
                data.append({"name": e.parent, "kommission": f.kommission, "produkt_name": e.bezeichnung, "menge": offen, "art": _("erwartet"), "termin": e.bestaetigter_termin})
    columns = [
        {"fieldname": "kommission", "label": _("Kommission"), "fieldtype": "Data", "width": 130},
        {"fieldname": "art", "label": _("Stand"), "fieldtype": "Data", "width": 90},
        {"fieldname": "name", "label": _("Bestand/Bestellung"), "fieldtype": "Data", "width": 140},
        {"fieldname": "produkt_name", "label": _("Artikel"), "fieldtype": "Data", "width": 240},
        {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Data", "width": 110},
        {"fieldname": "lagerort", "label": _("Lagerort"), "fieldtype": "Link", "options": "PH Lagerort", "width": 120},
        {"fieldname": "platz", "label": _("Platz"), "fieldtype": "Data", "width": 90},
        {"fieldname": "menge", "label": _("Menge"), "fieldtype": "Int", "width": 70},
        {"fieldname": "gesperrt", "label": _("Gesperrt"), "fieldtype": "Check", "width": 70},
        {"fieldname": "sperrgrund", "label": _("Sperrgrund"), "fieldtype": "Data", "width": 160},
        {"fieldname": "liegt_tage", "label": _("Liegt seit (Tage)"), "fieldtype": "Int", "width": 110},
        {"fieldname": "termin", "label": _("Termin (AB)"), "fieldtype": "Date", "width": 100},
    ]
    summary = [
        {"value": sum(d["menge"] or 0 for d in data if d["art"] == _("im Lager")), "label": _("Stück im Lager"), "datatype": "Int"},
        {"value": sum(d["menge"] or 0 for d in data if d.get("gesperrt")), "label": _("gesperrt"), "datatype": "Int", "indicator": "Red"},
        {"value": sum(d["menge"] or 0 for d in data if d["art"] == _("erwartet")), "label": _("noch erwartet"), "datatype": "Int", "indicator": "Orange"},
    ]
    return columns, data, None, None, summary
