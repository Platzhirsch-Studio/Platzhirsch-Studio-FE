"""Script Report: Anfragen je Kampagne/Quelle/Medium (UTM aus dem Website-Herkunftsblock) – Anfragen,
Termine, Gewonnen, Quote, Wert gewonnen, Pipeline gewichtet. Grundlage für Kampagnen-ROI in ph_marketing."""

import frappe
from frappe import _
from frappe.utils import add_months, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von, bis = filters.get("von") or add_months(nowdate(), -3), filters.get("bis") or nowdate()
    gruppe = {"kampagne": "utm_campaign", "quelle": "utm_source", "medium": "utm_medium", "kanal": "kanal"}.get(filters.get("gruppe") or "kampagne", "utm_campaign")
    zeilen = frappe.get_all("PH Anfrage", filters={"eingang": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"]), "status": ("!=", "Spam")}, fields=["name", gruppe, "status", "wert_cent", "gewichtet_cent", "folgedokument_doctype"])
    je = {}
    for z in zeilen:
        k = z.get(gruppe) or _("(ohne)")
        e = je.setdefault(k, {"anfragen": 0, "termine": 0, "gewonnen": 0, "wert_gewonnen": 0, "gewichtet": 0})
        e["anfragen"] += 1
        e["termine"] += 1 if z.status in ("Termin vereinbart", "Angebot", "Gewonnen") or z.folgedokument_doctype == "PH Termin" else 0
        if z.status == "Gewonnen":
            e["gewonnen"] += 1
            e["wert_gewonnen"] += int(z.wert_cent or 0)
        elif z.status in ("Neu", "Qualifiziert", "Termin vereinbart", "Angebot"):
            e["gewichtet"] += int(z.gewichtet_cent or 0)
    data = sorted(({"gruppe": k, "anfragen": v["anfragen"], "termine": v["termine"], "gewonnen": v["gewonnen"], "quote": round(100 * v["gewonnen"] / v["anfragen"], 1) if v["anfragen"] else 0, "wert_gewonnen": v["wert_gewonnen"] / 100, "gewichtet": v["gewichtet"] / 100} for k, v in je.items()), key=lambda d: -d["anfragen"])
    return spalten(), data, _("UTM-Werte stammen aus dem Herkunftsblock der Website (nur mit Werbe-Einwilligung) bzw. werden händisch gepflegt."), None, [{"value": len(zeilen), "label": _("Anfragen"), "datatype": "Int"}]


def spalten():
    return [
        {"fieldname": "gruppe", "label": _("Kampagne / Quelle"), "fieldtype": "Data", "width": 220},
        {"fieldname": "anfragen", "label": _("Anfragen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "termine", "label": _("Mit Termin"), "fieldtype": "Int", "width": 90},
        {"fieldname": "gewonnen", "label": _("Gewonnen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "quote", "label": _("Quote %"), "fieldtype": "Float", "width": 90},
        {"fieldname": "wert_gewonnen", "label": _("Wert gewonnen (€)"), "fieldtype": "Currency", "width": 150},
        {"fieldname": "gewichtet", "label": _("Pipeline gewichtet (€)"), "fieldtype": "Currency", "width": 150},
    ]
