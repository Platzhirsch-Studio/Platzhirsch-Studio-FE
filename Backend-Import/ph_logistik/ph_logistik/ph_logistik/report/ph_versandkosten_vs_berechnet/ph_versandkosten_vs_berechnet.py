"""Script Report: Versandkosten (PH Sendung preis_brutto_cent) vs. dem Kunden berechnet (PH Bestellung versand_cent) – je Sendung, Carrier oder Monat."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate


def execute(filters=None):
    f = frappe._dict(filters or {})
    von = getdate(f.get("von") or add_months(nowdate(), -3))
    bis = getdate(f.get("bis") or nowdate())
    filt = {"gebucht_am": ("between", [von, bis]), "status": ("not in", ["Storniert", "Angelegt"]), "richtung": "Ausgang"}
    if f.get("carrier"):
        filt["carrier"] = ("like", f"%{f.carrier}%")
    rows = frappe.get_all("PH Sendung", filt, ["name", "gebucht_am", "carrier", "service_name", "lieferschein", "bestellung", "preis_netto_cent", "preis_brutto_cent", "berechnet_cent", "versicherung", "empf_land", "status"], order_by="gebucht_am desc")
    nach = f.get("nach") or "Sendung"
    data = []
    if nach == "Sendung":
        for r in rows:
            data.append({**r, "differenz_cent": (r.berechnet_cent or 0) - (r.preis_brutto_cent or 0)})
        columns = [
            {"fieldname": "name", "label": _("Sendung"), "fieldtype": "Link", "options": "PH Sendung", "width": 150},
            {"fieldname": "gebucht_am", "label": _("Gebucht"), "fieldtype": "Datetime", "width": 140},
            {"fieldname": "carrier", "label": _("Carrier"), "fieldtype": "Data", "width": 110},
            {"fieldname": "service_name", "label": _("Dienst"), "fieldtype": "Data", "width": 160},
            {"fieldname": "empf_land", "label": _("Land"), "fieldtype": "Data", "width": 60},
            {"fieldname": "bestellung", "label": _("Bestellung"), "fieldtype": "Link", "options": "PH Bestellung", "width": 150},
            {"fieldname": "preis_brutto_cent", "label": _("Kosten brutto (Cent)"), "fieldtype": "Int", "width": 130},
            {"fieldname": "berechnet_cent", "label": _("Berechnet (Cent)"), "fieldtype": "Int", "width": 120},
            {"fieldname": "differenz_cent", "label": _("Differenz (Cent)"), "fieldtype": "Int", "width": 120},
            {"fieldname": "versicherung", "label": _("Versichert"), "fieldtype": "Check", "width": 80},
            {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        ]
    else:
        agg = {}
        for r in rows:
            key = (r.carrier or _("unbekannt")) if nach == "Carrier" else (r.gebucht_am.strftime("%Y-%m") if r.gebucht_am else "?")
            a = agg.setdefault(key, {"gruppe": key, "anzahl": 0, "kosten_cent": 0, "berechnet_cent": 0, "versichert": 0})
            a["anzahl"] += 1
            a["kosten_cent"] += r.preis_brutto_cent or 0
            a["berechnet_cent"] += r.berechnet_cent or 0
            a["versichert"] += 1 if r.versicherung else 0
        for a in sorted(agg.values(), key=lambda x: x["gruppe"]):
            a["differenz_cent"] = a["berechnet_cent"] - a["kosten_cent"]
            a["schnitt_cent"] = round(a["kosten_cent"] / a["anzahl"]) if a["anzahl"] else 0
            data.append(a)
        columns = [
            {"fieldname": "gruppe", "label": _("Carrier") if nach == "Carrier" else _("Monat"), "fieldtype": "Data", "width": 160},
            {"fieldname": "anzahl", "label": _("Sendungen"), "fieldtype": "Int", "width": 100},
            {"fieldname": "kosten_cent", "label": _("Kosten (Cent)"), "fieldtype": "Int", "width": 120},
            {"fieldname": "schnitt_cent", "label": _("Ø je Sendung (Cent)"), "fieldtype": "Int", "width": 130},
            {"fieldname": "berechnet_cent", "label": _("Berechnet (Cent)"), "fieldtype": "Int", "width": 120},
            {"fieldname": "differenz_cent", "label": _("Differenz (Cent)"), "fieldtype": "Int", "width": 120},
            {"fieldname": "versichert", "label": _("Versichert"), "fieldtype": "Int", "width": 90},
        ]
    kosten = sum(r.preis_brutto_cent or 0 for r in rows)
    berechnet = sum(r.berechnet_cent or 0 for r in rows)
    chart = None
    if nach != "Sendung" and data:
        chart = {"data": {"labels": [d["gruppe"] for d in data], "datasets": [{"name": _("Kosten"), "values": [d["kosten_cent"] / 100 for d in data]}, {"name": _("Berechnet"), "values": [d["berechnet_cent"] / 100 for d in data]}]}, "type": "bar", "colors": ["#30373e", "#15803d"]}
    summary = [
        {"value": len(rows), "label": _("Sendungen"), "datatype": "Int"},
        {"value": kosten / 100, "label": _("Kosten €"), "datatype": "Currency", "currency": "EUR"},
        {"value": berechnet / 100, "label": _("Berechnet €"), "datatype": "Currency", "currency": "EUR"},
        {"value": (berechnet - kosten) / 100, "label": _("Differenz €"), "datatype": "Currency", "currency": "EUR", "indicator": "Green" if berechnet >= kosten else "Red"},
    ]
    return columns, data, None, chart, summary
