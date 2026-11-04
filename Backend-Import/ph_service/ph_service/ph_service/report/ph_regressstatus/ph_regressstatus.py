"""Regressstatus: offene und erhaltene Beträge je Regress/Lieferant mit Fristen nach § 933b ABGB."""

import frappe
from frappe import _
from frappe.utils import cint, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    bedingungen = {}
    if filters.get("status"):
        bedingungen["status"] = filters.status
    else:
        bedingungen["status"] = ("in", ["Offen", "Gemeldet", "Anerkannt"]) if not filters.get("alle") else ("!=", "")
    if filters.get("lieferant"):
        bedingungen["lieferant"] = filters.lieferant
    rows = frappe.get_all("PH Lieferantenregress", filters=bedingungen, fields=["name", "servicefall", "lieferant", "marke", "status", "betrag_gefordert_cent", "betrag_anerkannt_cent", "betrag_erhalten_cent", "gemeldet_am", "frist_bis", "lieferant_referenz", "form"], order_by="frist_bis asc, modified desc")
    heute = getdate(nowdate())
    data = []
    for r in rows:
        gefordert = cint(r.betrag_gefordert_cent)
        erhalten = cint(r.betrag_erhalten_cent)
        offen = 0 if r.status in ("Abgelehnt", "Verrechnet") else (cint(r.betrag_anerkannt_cent) if r.status == "Anerkannt" else gefordert) - erhalten
        data.append(
            {
                "regress": r.name,
                "servicefall": r.servicefall,
                "lieferant": r.lieferant,
                "marke": r.marke,
                "status": r.status,
                "form": r.form,
                "referenz": r.lieferant_referenz,
                "gefordert": gefordert / 100,
                "anerkannt": cint(r.betrag_anerkannt_cent) / 100,
                "erhalten": erhalten / 100,
                "offen": max(0, offen) / 100,
                "gemeldet_am": r.gemeldet_am,
                "frist_bis": r.frist_bis,
                "tage_frist": (getdate(r.frist_bis) - heute).days if r.frist_bis else None,
            }
        )
    columns = [
        {"fieldname": "regress", "label": _("Regress"), "fieldtype": "Link", "options": "PH Lieferantenregress", "width": 150},
        {"fieldname": "servicefall", "label": _("Servicefall"), "fieldtype": "Link", "options": "PH Servicefall", "width": 150},
        {"fieldname": "lieferant", "label": _("Lieferant"), "fieldtype": "Link", "options": "PH Lieferant", "width": 160},
        {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Link", "options": "PH Marke", "width": 120},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "form", "label": _("Form"), "fieldtype": "Data", "width": 130},
        {"fieldname": "referenz", "label": _("Ref. Lieferant"), "fieldtype": "Data", "width": 120},
        {"fieldname": "gefordert", "label": _("Gefordert €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "anerkannt", "label": _("Anerkannt €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "erhalten", "label": _("Erhalten €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "offen", "label": _("Offen €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "gemeldet_am", "label": _("Gemeldet"), "fieldtype": "Date", "width": 100},
        {"fieldname": "frist_bis", "label": _("Frist § 933b"), "fieldtype": "Date", "width": 110},
        {"fieldname": "tage_frist", "label": _("Tage bis Frist"), "fieldtype": "Int", "width": 100},
    ]
    je_status = {}
    for d in data:
        je_status[d["status"]] = je_status.get(d["status"], 0) + d["gefordert"]
    chart = {"data": {"labels": list(je_status.keys()), "datasets": [{"name": _("Gefordert €"), "values": list(je_status.values())}]}, "type": "bar", "colors": ["#15803d"]}
    summary = [
        {"value": sum(d["gefordert"] for d in data), "label": _("Gefordert €"), "datatype": "Currency"},
        {"value": sum(d["offen"] for d in data), "label": _("Offen €"), "datatype": "Currency", "indicator": "Orange"},
        {"value": sum(d["erhalten"] for d in data), "label": _("Erhalten €"), "datatype": "Currency", "indicator": "Green"},
        {"value": sum(1 for d in data if d["tage_frist"] is not None and d["tage_frist"] < 0 and d["status"] == "Offen"), "label": _("Frist versäumt (offen)"), "datatype": "Int", "indicator": "Red"},
    ]
    return columns, data, None, chart, summary
