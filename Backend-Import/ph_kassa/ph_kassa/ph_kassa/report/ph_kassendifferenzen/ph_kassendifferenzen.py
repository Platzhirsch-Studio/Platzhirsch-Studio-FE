"""PH Kassendifferenzen – Tagesabschlüsse mit Soll/Ist/Differenz, Grund, Zähler, Freigabe."""

import frappe
from frappe import _

from ph_kassa.auswertung import zeitraum_filter


def execute(filters=None):
    filters, von, bis = zeitraum_filter(filters)
    f = {"datum": ("between", [von, bis]), "status": ("in", ("Abgeschlossen", "Korrigiert", "Gezaehlt"))}
    if filters.get("kasse"):
        f["kasse"] = filters["kasse"]
    data = frappe.get_all("PH Kassenabschluss", filters=f, fields=["name", "kasse", "datum", "status", "bargeld_soll_cent", "bargeld_ist_cent", "differenz_cent", "differenz_grund", "von_user", "freigegeben_von", "belege_anzahl", "stornos_anzahl"], order_by="datum desc")
    columns = [
        {"fieldname": "datum", "label": _("Tag"), "fieldtype": "Date", "width": 100},
        {"fieldname": "kasse", "label": _("Kasse"), "fieldtype": "Link", "options": "PH Kasse", "width": 110},
        {"fieldname": "name", "label": _("Abschluss"), "fieldtype": "Link", "options": "PH Kassenabschluss", "width": 150},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 110},
        {"fieldname": "bargeld_soll_cent", "label": _("Soll (Cent)"), "fieldtype": "Int", "width": 110},
        {"fieldname": "bargeld_ist_cent", "label": _("Ist (Cent)"), "fieldtype": "Int", "width": 110},
        {"fieldname": "differenz_cent", "label": _("Differenz (Cent)"), "fieldtype": "Int", "width": 130},
        {"fieldname": "differenz_grund", "label": _("Grund"), "fieldtype": "Data", "width": 220},
        {"fieldname": "belege_anzahl", "label": _("Belege"), "fieldtype": "Int", "width": 80},
        {"fieldname": "stornos_anzahl", "label": _("Stornos"), "fieldtype": "Int", "width": 80},
        {"fieldname": "von_user", "label": _("Gezählt von"), "fieldtype": "Link", "options": "User", "width": 140},
        {"fieldname": "freigegeben_von", "label": _("Freigabe"), "fieldtype": "Link", "options": "User", "width": 140},
    ]
    mit_diff = [d for d in data if d.differenz_cent]
    chart = {"data": {"labels": [str(d.datum) for d in reversed(data)], "datasets": [{"name": _("Differenz €"), "values": [(d.differenz_cent or 0) / 100 for d in reversed(data)]}]}, "type": "bar", "colors": ["#b45309"]}
    summary = [
        {"value": len(data), "label": _("Abschlüsse"), "datatype": "Int"},
        {"value": len(mit_diff), "label": _("mit Differenz"), "datatype": "Int", "indicator": "Orange" if mit_diff else "Green"},
        {"value": sum(d.differenz_cent or 0 for d in data) / 100, "label": _("Summe Differenz €"), "datatype": "Currency", "currency": "EUR"},
    ]
    return columns, data, None, chart, summary
