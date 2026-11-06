"""Script Report: offene Pipeline je Status / Zuständig / Monat des erwarteten Abschlusses – Anzahl,
Auftragswert und gewichteter Wert (Wert × Abschlusswahrscheinlichkeit). Beträge in Cent → Currency-Spalten in Euro."""

import frappe
from frappe import _

from ph_crm.utils.pipeline import OFFEN


def execute(filters=None):
    filters = frappe._dict(filters or {})
    gruppe = filters.get("gruppe") or "status"
    feld = {"status": "status", "zustaendig": "zugewiesen_an", "monat": "erwarteter_abschluss", "quelle": "quelle", "kampagne": "utm_campaign"}[gruppe]
    f = {"status": ("in", list(OFFEN))}
    if filters.get("zugewiesen_an"):
        f["zugewiesen_an"] = filters.zugewiesen_an
    if not frappe.has_permission("PH Anfrage", "report") or ("PH CRM Leitung" not in frappe.get_roles() and "PH Geschäftsführung" not in frappe.get_roles() and "System Manager" not in frappe.get_roles()):
        f["zugewiesen_an"] = frappe.session.user  # Mitarbeiter sehen nur eigene Zeilen
    zeilen = frappe.get_all("PH Anfrage", filters=f, fields=["name", "status", "zugewiesen_an", "erwarteter_abschluss", "quelle", "utm_campaign", "wert_cent", "gewichtet_cent"])
    je = {}
    for z in zeilen:
        schluessel = z.get(feld)
        if gruppe == "monat":
            schluessel = str(schluessel)[:7] if schluessel else _("ohne Datum")
        e = je.setdefault(schluessel or _("(leer)"), {"anzahl": 0, "wert": 0, "gewichtet": 0, "ohne_wert": 0})
        e["anzahl"] += 1
        e["wert"] += int(z.wert_cent or 0)
        e["gewichtet"] += int(z.gewichtet_cent or 0)
        e["ohne_wert"] += 0 if z.wert_cent else 1
    reihenfolge = list(OFFEN) if gruppe == "status" else sorted(je)
    data = [{"gruppe": _(k), "anzahl": je[k]["anzahl"], "wert": je[k]["wert"] / 100, "gewichtet": je[k]["gewichtet"] / 100, "ohne_wert": je[k]["ohne_wert"]} for k in reihenfolge if k in je]
    chart = {"data": {"labels": [d["gruppe"] for d in data], "datasets": [{"name": _("Wert"), "values": [d["wert"] for d in data]}, {"name": _("Gewichtet"), "values": [d["gewichtet"] for d in data]}]}, "type": "bar", "colors": ["#8a7a66", "#15803d"]}
    summary = [
        {"value": sum(d["anzahl"] for d in data), "label": _("Offene Anfragen"), "datatype": "Int"},
        {"value": sum(d["wert"] for d in data), "label": _("Pipeline-Wert"), "datatype": "Currency"},
        {"value": sum(d["gewichtet"] for d in data), "label": _("Gewichtet (Prognose)"), "datatype": "Currency", "indicator": "Green"},
        {"value": sum(d["ohne_wert"] for d in data), "label": _("ohne Wert erfasst"), "datatype": "Int", "indicator": "Orange"},
    ]
    return spalten(), data, None, chart, summary


def spalten():
    return [
        {"fieldname": "gruppe", "label": _("Gruppe"), "fieldtype": "Data", "width": 200},
        {"fieldname": "anzahl", "label": _("Anzahl"), "fieldtype": "Int", "width": 90},
        {"fieldname": "wert", "label": _("Wert (€)"), "fieldtype": "Currency", "width": 140},
        {"fieldname": "gewichtet", "label": _("Gewichtet (€)"), "fieldtype": "Currency", "width": 140},
        {"fieldname": "ohne_wert", "label": _("ohne Wert"), "fieldtype": "Int", "width": 90},
    ]
