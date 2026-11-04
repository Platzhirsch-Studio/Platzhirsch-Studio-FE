"""Script Report: Produkte ohne freigegebenes Bild (Veröffentlichung gesperrt) – je Marke mit Bildfreigabe-Status."""

import frappe
from frappe import _


def execute(filters=None):
    filters = frappe._dict(filters or {})
    bedingungen = {"bild_freigegeben": 0, "status": ("!=", "Ausgelaufen")}
    if filters.get("marke"):
        bedingungen["marke"] = filters.marke
    if filters.get("status"):
        bedingungen["status"] = filters.status
    rows = frappe.get_all("PH Produkt", filters=bedingungen, fields=["name", "titel", "marke", "kategorie", "status", "bilder_anzahl", "bilder_offen", "stand", "import_quelle"], order_by="marke asc, name asc")
    marken = {m.name: m for m in frappe.get_all("PH Marke", fields=["name", "bildfreigabe_status", "haendlerstatus", "bestell_email"])}
    data = []
    for r in rows:
        m = marken.get(r.marke) or frappe._dict()
        data.append({**r, "bildfreigabe_status": m.get("bildfreigabe_status"), "haendlerstatus": m.get("haendlerstatus"), "grund": _("keine Bilder") if not r.bilder_anzahl else _("Bilder ohne Freigabe")})
    columns = [
        {"fieldname": "name", "label": _("Produkt"), "fieldtype": "Link", "options": "PH Produkt", "width": 220},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 220},
        {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Link", "options": "PH Marke", "width": 130},
        {"fieldname": "kategorie", "label": _("Kategorie"), "fieldtype": "Link", "options": "PH Kategorie", "width": 120},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 90},
        {"fieldname": "grund", "label": _("Grund"), "fieldtype": "Data", "width": 140},
        {"fieldname": "bilder_anzahl", "label": _("Bilder"), "fieldtype": "Int", "width": 70},
        {"fieldname": "bilder_offen", "label": _("davon offen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "bildfreigabe_status", "label": _("Bildfreigabe Marke"), "fieldtype": "Data", "width": 140},
        {"fieldname": "haendlerstatus", "label": _("Händlerstatus"), "fieldtype": "Data", "width": 120},
        {"fieldname": "import_quelle", "label": _("Quelle"), "fieldtype": "Data", "width": 110},
    ]
    je_marke = {}
    for d in data:
        je_marke[d["marke"]] = je_marke.get(d["marke"], 0) + 1
    chart = {"data": {"labels": list(je_marke), "datasets": [{"name": _("ohne Freigabe"), "values": list(je_marke.values())}]}, "type": "bar", "colors": ["#b45309"]}
    summary = [
        {"value": len(data), "label": _("Produkte ohne freigegebenes Bild"), "datatype": "Int", "indicator": "Orange" if data else "Green"},
        {"value": sum(1 for d in data if not d["bilder_anzahl"]), "label": _("ganz ohne Bild"), "datatype": "Int"},
        {"value": len({d["marke"] for d in data if d["bildfreigabe_status"] != "schriftlich erteilt"}), "label": _("Marken ohne schriftliche Bildfreigabe"), "datatype": "Int", "indicator": "Red"},
    ]
    return columns, data, None, chart, summary
