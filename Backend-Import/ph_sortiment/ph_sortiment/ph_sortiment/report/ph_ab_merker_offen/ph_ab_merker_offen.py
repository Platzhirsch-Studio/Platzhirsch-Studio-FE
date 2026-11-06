"""Script Report: Positionen offener Herstellerbestellungen nach AB-Merker (offen/abweichung/bestaetigt/geklaert)."""

import frappe
from frappe import _

OFFEN = ("Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert")


def execute(filters=None):
    filters = frappe._dict(filters or {})
    f = {"status": ("in", OFFEN)}
    if filters.get("lieferant"):
        f["lieferant"] = filters.lieferant
    kopf = {b.name: b for b in frappe.get_all("PH Herstellerbestellung", filters=f, fields=["name", "lieferant", "kommission", "status", "ab_nummer", "gesendet_am", "ab_vollstaendig"])}
    if not kopf:
        return spalten(), []
    pf = {"parenttype": "PH Herstellerbestellung", "parent": ("in", list(kopf)), "status": ("!=", "Storniert")}
    merker = filters.get("merker") or ""
    if merker:
        pf["ab_merker"] = merker
    elif not filters.get("alle"):
        pf["ab_merker"] = ("in", ["offen", "abweichung"])
    data = []
    for z in frappe.get_all("PH Herstellerbestellung Position", filters=pf, fields=["parent", "idx", "bezeichnung", "ausfuehrung_text", "menge", "wunschtermin", "bestaetigter_termin", "abweichung", "ab_merker", "ab_merker_am", "kommission"], order_by="parent asc, idx asc"):
        b = kopf[z.parent]
        data.append({"bestellung": z.parent, "lieferant": b.lieferant, "status": b.status, "ab_nummer": b.ab_nummer, "gesendet_am": b.gesendet_am, **z, "kommission": z.kommission or b.kommission})
    return spalten(), data, None, None, [{"value": sum(1 for d in data if d["ab_merker"] == "offen"), "label": _("ohne AB"), "datatype": "Int", "indicator": "Orange"}, {"value": sum(1 for d in data if d["ab_merker"] == "abweichung"), "label": _("Abweichung offen"), "datatype": "Int", "indicator": "Red"}]


def spalten():
    return [
        {"fieldname": "bestellung", "label": _("Bestellung"), "fieldtype": "Link", "options": "PH Herstellerbestellung", "width": 140},
        {"fieldname": "lieferant", "label": _("Lieferant"), "fieldtype": "Link", "options": "PH Lieferant", "width": 150},
        {"fieldname": "kommission", "label": _("Kommission"), "fieldtype": "Data", "width": 130},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "gesendet_am", "label": _("Gesendet"), "fieldtype": "Datetime", "width": 130},
        {"fieldname": "idx", "label": _("Pos."), "fieldtype": "Int", "width": 50},
        {"fieldname": "bezeichnung", "label": _("Bezeichnung"), "fieldtype": "Data", "width": 200},
        {"fieldname": "ausfuehrung_text", "label": _("Ausführung"), "fieldtype": "Data", "width": 150},
        {"fieldname": "menge", "label": _("Menge"), "fieldtype": "Int", "width": 60},
        {"fieldname": "wunschtermin", "label": _("Wunsch"), "fieldtype": "Date", "width": 95},
        {"fieldname": "bestaetigter_termin", "label": _("Bestätigt"), "fieldtype": "Date", "width": 95},
        {"fieldname": "abweichung", "label": _("Abweichung"), "fieldtype": "Data", "width": 90},
        {"fieldname": "ab_merker", "label": _("AB-Merker"), "fieldtype": "Data", "width": 90},
        {"fieldname": "ab_merker_am", "label": _("Merker am"), "fieldtype": "Date", "width": 95},
    ]
