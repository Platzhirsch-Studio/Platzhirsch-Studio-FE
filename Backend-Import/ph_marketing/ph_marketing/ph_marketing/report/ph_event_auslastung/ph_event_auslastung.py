"""Script Report: Event-Auslastung – Plätze, Anmeldungen, Personen, Warteliste, Erschienen/No-Show, Quelle der Anmeldungen."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or add_months(nowdate(), 6))
    events = frappe.get_all("PH Event", filters={"datum": ("between", [von, bis])}, fields=["name", "titel", "datum", "status", "kapazitaet", "art"], order_by="datum desc")
    data = []
    for ev in events:
        rows = frappe.get_all("PH Event Anmeldung", filters={"parent": ev.name, "parenttype": "PH Event"}, fields=["status", "personen", "quelle"])
        personen = sum(cint(r.personen) or 1 for r in rows if r.status in ("angemeldet", "bestaetigt", "erschienen"))
        erschienen = sum(cint(r.personen) or 1 for r in rows if r.status == "erschienen")
        noshow = sum(cint(r.personen) or 1 for r in rows if r.status == "nicht erschienen")
        warte = sum(cint(r.personen) or 1 for r in rows if r.status == "warteliste")
        abgesagt = sum(1 for r in rows if r.status == "abgesagt")
        quellen = {}
        for r in rows:
            quellen[r.quelle or "?"] = quellen.get(r.quelle or "?", 0) + 1
        data.append({
            "event": ev.name, "titel": ev.titel, "datum": ev.datum, "status": ev.status, "art": ev.art, "kapazitaet": ev.kapazitaet,
            "anmeldungen": sum(1 for r in rows if r.status != "abgesagt"), "personen": personen,
            "auslastung": round(100 * personen / cint(ev.kapazitaet), 1) if ev.kapazitaet else None,
            "warteliste": warte, "abgesagt": abgesagt, "erschienen": erschienen, "noshow": noshow,
            "noshow_quote": round(100 * noshow / (erschienen + noshow), 1) if (erschienen + noshow) else None,
            "quellen": ", ".join(f"{k} {v}" for k, v in sorted(quellen.items(), key=lambda x: -x[1])),
        })
    columns = [
        {"fieldname": "event", "label": _("Event"), "fieldtype": "Link", "options": "PH Event", "width": 150},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 200},
        {"fieldname": "datum", "label": _("Datum"), "fieldtype": "Date", "width": 100},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "kapazitaet", "label": _("Plätze"), "fieldtype": "Int", "width": 70},
        {"fieldname": "anmeldungen", "label": _("Anmeldungen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "personen", "label": _("Personen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "auslastung", "label": _("Auslastung %"), "fieldtype": "Percent", "width": 110},
        {"fieldname": "warteliste", "label": _("Warteliste"), "fieldtype": "Int", "width": 90},
        {"fieldname": "abgesagt", "label": _("Abgesagt"), "fieldtype": "Int", "width": 90},
        {"fieldname": "erschienen", "label": _("Erschienen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "noshow", "label": _("Nicht erschienen"), "fieldtype": "Int", "width": 120},
        {"fieldname": "noshow_quote", "label": _("No-Show %"), "fieldtype": "Percent", "width": 90},
        {"fieldname": "quellen", "label": _("Quellen"), "fieldtype": "Data", "width": 200},
    ]
    chart = {"data": {"labels": [d["titel"][:24] for d in data], "datasets": [{"name": _("Personen"), "values": [d["personen"] for d in data]}, {"name": _("Plätze"), "values": [cint(d["kapazitaet"]) for d in data]}]}, "type": "bar", "colors": ["#15803d", "#d9d4cc"]}
    summary = [
        {"value": len(data), "label": _("Events"), "datatype": "Int"},
        {"value": sum(d["personen"] for d in data), "label": _("Personen angemeldet"), "datatype": "Int", "indicator": "Green"},
        {"value": sum(d["warteliste"] for d in data), "label": _("Warteliste"), "datatype": "Int"},
    ]
    return columns, data, None, chart, summary
