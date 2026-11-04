"""Script Report PH Zeiten je Projekt: erfasste Minuten je Projekt (und wahlweise je Mitarbeiter/Tätigkeit),
abrechenbar/offen/abgerechnet; Beträge nur für Leitung (permlevel 1)."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate

LEITUNG = {"PH Projekte Leitung", "PH Geschäftsführung", "System Manager"}


def execute(filters=None):
    filters = frappe._dict(filters or {})
    leitung = bool(LEITUNG & set(frappe.get_roles()))
    von = getdate(filters.get("von") or add_months(nowdate(), -3))
    bis = getdate(filters.get("bis") or nowdate())
    gruppe = filters.get("nach") or "Projekt"
    bed = {"datum": ("between", [von, bis])}
    if filters.get("projekt"):
        bed["projekt"] = filters.projekt
    if filters.get("user"):
        bed["user"] = filters.user
    felder = ["projekt", "user", "taetigkeit", "dauer_min", "abrechenbar", "status"] + (["betrag_cent"] if leitung else [])
    rows = frappe.get_all("PH Projektzeit", filters=bed, fields=felder)

    agg = {}
    for r in rows:
        if gruppe == "Mitarbeiter":
            key = (r.projekt, r.user)
        elif gruppe == "Tätigkeit":
            key = (r.projekt, r.taetigkeit)
        else:
            key = (r.projekt, "")
        a = agg.setdefault(key, {"projekt": key[0], "gruppe": key[1], "minuten": 0, "abrechenbar_min": 0, "offen_min": 0, "abgerechnet_min": 0, "betrag_offen": 0.0, "betrag_abgerechnet": 0.0})
        m = int(r.dauer_min or 0)
        a["minuten"] += m
        if r.abrechenbar:
            a["abrechenbar_min"] += m
        if r.status == "Offen":
            a["offen_min"] += m
            if leitung:
                a["betrag_offen"] += (r.betrag_cent or 0) / 100
        elif r.status == "Abgerechnet":
            a["abgerechnet_min"] += m
            if leitung:
                a["betrag_abgerechnet"] += (r.betrag_cent or 0) / 100

    data = []
    for a in sorted(agg.values(), key=lambda x: (-x["minuten"], x["projekt"])):
        a["titel"] = frappe.db.get_value("PH Projekt", a["projekt"], "titel")
        a["stunden"] = round(a["minuten"] / 60, 2)
        a["quote"] = round(100 * a["abrechenbar_min"] / a["minuten"], 0) if a["minuten"] else 0
        data.append(a)

    columns = [
        {"fieldname": "projekt", "label": _("Projekt"), "fieldtype": "Link", "options": "PH Projekt", "width": 140},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 180},
    ]
    if gruppe != "Projekt":
        columns.append({"fieldname": "gruppe", "label": _(gruppe), "fieldtype": "Data", "width": 150})
    columns += [
        {"fieldname": "stunden", "label": _("Stunden"), "fieldtype": "Float", "width": 90},
        {"fieldname": "minuten", "label": _("Minuten"), "fieldtype": "Int", "width": 90},
        {"fieldname": "abrechenbar_min", "label": _("Abrechenbar (min)"), "fieldtype": "Int", "width": 130},
        {"fieldname": "offen_min", "label": _("Offen (min)"), "fieldtype": "Int", "width": 100},
        {"fieldname": "abgerechnet_min", "label": _("Abgerechnet (min)"), "fieldtype": "Int", "width": 130},
        {"fieldname": "quote", "label": _("Abrechenbar %"), "fieldtype": "Percent", "width": 110},
    ]
    if leitung:
        columns += [
            {"fieldname": "betrag_offen", "label": _("Offen €"), "fieldtype": "Currency", "options": "EUR", "width": 110},
            {"fieldname": "betrag_abgerechnet", "label": _("Abgerechnet €"), "fieldtype": "Currency", "options": "EUR", "width": 120},
        ]
    chart = {"data": {"labels": [d["projekt"] for d in data[:12]], "datasets": [{"name": _("Stunden"), "values": [d["stunden"] for d in data[:12]]}]}, "type": "bar", "colors": ["#8a7a66"]}
    summary = [
        {"value": round(sum(d["minuten"] for d in data) / 60, 1), "label": _("Stunden gesamt"), "datatype": "Float"},
        {"value": round(sum(d["offen_min"] for d in data) / 60, 1), "label": _("Nicht abgerechnet (h)"), "datatype": "Float", "indicator": "Orange"},
    ]
    if leitung:
        summary.append({"value": sum(d["betrag_offen"] for d in data), "label": _("Offen €"), "datatype": "Currency", "currency": "EUR"})
    return columns, data, None, chart, summary
