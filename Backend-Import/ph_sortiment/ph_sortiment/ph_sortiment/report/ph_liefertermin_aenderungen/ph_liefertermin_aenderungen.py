"""Script Report: Liefertermin-Änderungen der Herstellerbestellungen (PH Herstellerbestellung Terminaenderung) –
für Einkauf und Projektleitung: was hat sich verschoben, ist Projekt/Kunde informiert?"""

import frappe
from frappe import _
from frappe.utils import add_days, getdate, nowdate

from ph_sortiment.logik.bestellung import verschiebung_tage


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_days(nowdate(), -30))
    bis = getdate(filters.get("bis") or nowdate())
    t_filter = {"parenttype": "PH Herstellerbestellung", "geaendert_am": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"])}
    if filters.get("nur_offen"):
        t_filter["kunde_informiert"] = 0
    zeilen = frappe.get_all("PH Herstellerbestellung Terminaenderung", filters=t_filter, fields=["parent", "geaendert_am", "position", "bezug_zeile", "termin_alt", "termin_neu", "quelle", "grund", "projekt_informiert", "kunde_informiert"], order_by="geaendert_am desc")
    kopf = {}
    if zeilen:
        hb_filter = {"name": ("in", list({z.parent for z in zeilen}))}
        if filters.get("lieferant"):
            hb_filter["lieferant"] = filters.lieferant
        kopf = {b.name: b for b in frappe.get_all("PH Herstellerbestellung", filters=hb_filter, fields=["name", "lieferant", "kommission", "bezug_doctype", "bezug_name", "status"])}
    data = []
    for z in zeilen:
        b = kopf.get(z.parent)
        if not b:
            continue
        data.append({"bestellung": z.parent, "lieferant": b.lieferant, "kommission": b.kommission, "bezug": f"{b.bezug_doctype or ''} {b.bezug_name or ''}".strip(), "geaendert_am": z.geaendert_am, "position": z.position, "termin_alt": z.termin_alt, "termin_neu": z.termin_neu, "tage": verschiebung_tage(z), "quelle": z.quelle, "grund": z.grund, "projekt_informiert": z.projekt_informiert, "kunde_informiert": z.kunde_informiert})
    summary = [
        {"value": len(data), "label": _("Änderungen"), "datatype": "Int"},
        {"value": sum(1 for d in data if (d["tage"] or 0) > 0), "label": _("später"), "datatype": "Int", "indicator": "Orange"},
        {"value": sum(1 for d in data if not d["kunde_informiert"]), "label": _("Kunde nicht informiert"), "datatype": "Int", "indicator": "Red"},
    ]
    return spalten(), data, None, None, summary


def spalten():
    return [
        {"fieldname": "bestellung", "label": _("Bestellung"), "fieldtype": "Link", "options": "PH Herstellerbestellung", "width": 140},
        {"fieldname": "lieferant", "label": _("Lieferant"), "fieldtype": "Link", "options": "PH Lieferant", "width": 150},
        {"fieldname": "kommission", "label": _("Kommission"), "fieldtype": "Data", "width": 130},
        {"fieldname": "bezug", "label": _("Bezug"), "fieldtype": "Data", "width": 160},
        {"fieldname": "geaendert_am", "label": _("Geändert"), "fieldtype": "Datetime", "width": 140},
        {"fieldname": "position", "label": _("Pos."), "fieldtype": "Int", "width": 50},
        {"fieldname": "termin_alt", "label": _("Alt"), "fieldtype": "Date", "width": 95},
        {"fieldname": "termin_neu", "label": _("Neu"), "fieldtype": "Date", "width": 95},
        {"fieldname": "tage", "label": _("Tage"), "fieldtype": "Int", "width": 60},
        {"fieldname": "quelle", "label": _("Quelle"), "fieldtype": "Data", "width": 80},
        {"fieldname": "grund", "label": _("Grund"), "fieldtype": "Data", "width": 200},
        {"fieldname": "projekt_informiert", "label": _("Projekt"), "fieldtype": "Check", "width": 70},
        {"fieldname": "kunde_informiert", "label": _("Kunde"), "fieldtype": "Check", "width": 70},
    ]
