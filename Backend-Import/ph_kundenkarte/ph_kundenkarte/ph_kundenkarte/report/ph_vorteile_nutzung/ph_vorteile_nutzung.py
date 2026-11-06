"""Vorteile Nutzung: je Vorteil Anzahl Einlösungen (und Stornos) im Zeitraum, Karten mit Anspruch, Nutzungsquote.
Kosten nur als Anzahl – bewusst kein Euro-Wert (Stufe 1 ohne Geldwert)."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_stufe.ph_kundenkarte_stufe import stufen_liste, stufen_vorteile
from ph_kundenkarte.utils import vorteile as vt


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    einloesungen = frappe.get_all("PH Kundenkarte Einloesung", filters={"eingeloest_am": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"])}, fields=["vorteil", "status", "ort", "kundenkarte"])
    vorteile = frappe.get_all("PH Kundenkarte Vorteil", fields=["name", "titel", "art", "einloesbar_pro_jahr", "aktiv"], order_by="reihenfolge asc")
    stufen = stufen_liste()
    zuordnung = stufen_vorteile()
    karten_je_stufe = {}
    for k in frappe.get_all("PH Kundenkarte", filters={"status": "Aktiv"}, fields=["stufe"]):
        karten_je_stufe[k.stufe] = karten_je_stufe.get(k.stufe, 0) + 1
    anspruch = {}
    for stufe, anzahl in karten_je_stufe.items():
        for z in vt.vorteile_fuer_stufe(zuordnung, stufen, stufe):
            anspruch[z["vorteil"]] = anspruch.get(z["vorteil"], 0) + anzahl
    data = []
    for v in vorteile:
        if filters.get("art") and v.art != filters.get("art"):
            continue
        eigene = [e for e in einloesungen if e.vorteil == v.name]
        aktiv = [e for e in eigene if e.status == "Eingeloest"]
        karten = {e.kundenkarte for e in aktiv}
        orte = {}
        for e in aktiv:
            orte[e.ort or "–"] = orte.get(e.ort or "–", 0) + 1
        berechtigt = anspruch.get(v.name, 0)
        data.append(
            {
                "vorteil": v.name,
                "titel": v.titel,
                "art": v.art,
                "aktiv": _("ja") if v.aktiv else _("nein"),
                "limit": v.einloesbar_pro_jahr or 0,
                "einloesungen": len(aktiv),
                "stornos": len(eigene) - len(aktiv),
                "karten": len(karten),
                "berechtigt": berechtigt,
                "quote": round(100 * len(karten) / berechtigt, 1) if berechtigt else 0,
                "orte": ", ".join(f"{o}: {n}" for o, n in sorted(orte.items(), key=lambda x: -x[1])),
            }
        )
    columns = [
        {"fieldname": "vorteil", "label": _("Vorteil"), "fieldtype": "Link", "options": "PH Kundenkarte Vorteil", "width": 140},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 220},
        {"fieldname": "art", "label": _("Art"), "fieldtype": "Data", "width": 90},
        {"fieldname": "aktiv", "label": _("Aktiv"), "fieldtype": "Data", "width": 60},
        {"fieldname": "limit", "label": _("Limit/Jahr"), "fieldtype": "Int", "width": 85},
        {"fieldname": "einloesungen", "label": _("Einlösungen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "stornos", "label": _("Stornos"), "fieldtype": "Int", "width": 75},
        {"fieldname": "karten", "label": _("Karten (genutzt)"), "fieldtype": "Int", "width": 120},
        {"fieldname": "berechtigt", "label": _("Karten (berechtigt)"), "fieldtype": "Int", "width": 130},
        {"fieldname": "quote", "label": _("Nutzungsquote %"), "fieldtype": "Percent", "width": 120},
        {"fieldname": "orte", "label": _("Orte"), "fieldtype": "Data", "width": 220},
    ]
    chart = {"data": {"labels": [d["titel"] for d in data], "datasets": [{"name": _("Einlösungen"), "values": [d["einloesungen"] for d in data]}]}, "type": "bar", "colors": ["#15803d"]}
    summary = [
        {"value": sum(d["einloesungen"] for d in data), "label": _("Einlösungen"), "datatype": "Int", "indicator": "Green"},
        {"value": sum(d["stornos"] for d in data), "label": _("Stornos"), "datatype": "Int", "indicator": "Red"},
    ]
    return columns, data, _("Kosten werden bewusst nur als Anzahl ausgewiesen – die Kundenkarte Stufe 1 hat keinen Geldwert."), chart, summary
