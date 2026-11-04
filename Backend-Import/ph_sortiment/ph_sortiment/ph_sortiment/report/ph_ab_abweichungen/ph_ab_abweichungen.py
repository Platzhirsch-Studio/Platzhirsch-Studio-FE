"""Script Report: AB-Abweichungen (Prüfprotokoll-Zeilen) je Lieferant/Bestellung mit Bewertung – wie SHD/kiwi."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -6))
    bis = getdate(filters.get("bis") or nowdate())
    hb_filter = {"datum": ("between", [von, bis]), "abweichungen_anzahl": (">", 0)}
    if filters.get("lieferant"):
        hb_filter["lieferant"] = filters.lieferant
    bestellungen = {b.name: b for b in frappe.get_all("PH Herstellerbestellung", filters=hb_filter, fields=["name", "lieferant", "kommission", "status", "ab_nummer", "ab_datum"])}
    if not bestellungen:
        return spalten(), [], None, None, []
    z_filter = {"parent": ("in", list(bestellungen)), "parenttype": "PH Herstellerbestellung"}
    if filters.get("bewertung"):
        z_filter["bewertung"] = filters.bewertung
    if filters.get("feld"):
        z_filter["feld"] = filters.feld
    zeilen = frappe.get_all("PH AB Abgleich", filters=z_filter, fields=["parent", "position", "bezeichnung", "feld", "bestellt", "bestaetigt", "abweichung_text", "bewertung", "kommentar", "geprueft_von"], order_by="parent desc, position asc")
    data = []
    for z in zeilen:
        b = bestellungen[z.parent]
        data.append({"bestellung": z.parent, "lieferant": b.lieferant, "kommission": b.kommission, "status": b.status, "ab_nummer": b.ab_nummer, **{k: z[k] for k in ("position", "bezeichnung", "feld", "bestellt", "bestaetigt", "abweichung_text", "bewertung", "kommentar", "geprueft_von")}})

    je_feld = {}
    for d in data:
        je_feld[d["feld"]] = je_feld.get(d["feld"], 0) + 1
    chart = {"data": {"labels": list(je_feld), "datasets": [{"name": _("Abweichungen"), "values": list(je_feld.values())}]}, "type": "donut", "colors": ["#b91c1c", "#b45309", "#1d4ed8", "#8a7a66"]}
    summary = [
        {"value": len(data), "label": _("Abweichungen"), "datatype": "Int"},
        {"value": sum(1 for d in data if d["bewertung"] in ("offen", "pruefen")), "label": _("offen"), "datatype": "Int", "indicator": "Orange"},
        {"value": sum(1 for d in data if d["bewertung"] == "abgelehnt"), "label": _("abgelehnt"), "datatype": "Int", "indicator": "Red"},
        {"value": len({d["lieferant"] for d in data}), "label": _("Lieferanten"), "datatype": "Int"},
    ]
    return spalten(), data, None, chart, summary


def spalten():
    return [
        {"fieldname": "bestellung", "label": _("Bestellung"), "fieldtype": "Link", "options": "PH Herstellerbestellung", "width": 140},
        {"fieldname": "lieferant", "label": _("Lieferant"), "fieldtype": "Link", "options": "PH Lieferant", "width": 150},
        {"fieldname": "kommission", "label": _("Kommission"), "fieldtype": "Data", "width": 130},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "ab_nummer", "label": _("AB-Nr."), "fieldtype": "Data", "width": 100},
        {"fieldname": "position", "label": _("Pos."), "fieldtype": "Int", "width": 50},
        {"fieldname": "bezeichnung", "label": _("Bezeichnung"), "fieldtype": "Data", "width": 200},
        {"fieldname": "feld", "label": _("Feld"), "fieldtype": "Data", "width": 80},
        {"fieldname": "bestellt", "label": _("Bestellt"), "fieldtype": "Data", "width": 110},
        {"fieldname": "bestaetigt", "label": _("Bestätigt"), "fieldtype": "Data", "width": 110},
        {"fieldname": "abweichung_text", "label": _("Abweichung"), "fieldtype": "Data", "width": 140},
        {"fieldname": "bewertung", "label": _("Bewertung"), "fieldtype": "Data", "width": 90},
        {"fieldname": "kommentar", "label": _("Kommentar"), "fieldtype": "Data", "width": 200},
        {"fieldname": "geprueft_von", "label": _("Geprüft von"), "fieldtype": "Link", "options": "User", "width": 140},
    ]
