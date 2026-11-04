"""Script Report PH Offene Mängel: Abnahme-Positionen (Mangel/Nacharbeit, nicht erledigt) und Montage-Mängel (nicht behoben)."""

import frappe
from frappe import _
from frappe.utils import getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    heute = getdate(nowdate())
    data = []

    abn_filter = {"zustand": ("in", ("Mangel", "Nacharbeit")), "erledigt": 0, "parenttype": "PH Abnahme"}
    for p in frappe.get_all("PH Abnahme Position", filters=abn_filter, fields=["name", "parent", "bezeichnung", "zustand", "beschreibung", "frist", "servicefall_ref"]):
        a = frappe.db.get_value("PH Abnahme", p.parent, ["projekt", "datum"], as_dict=True)
        if not a or (filters.get("projekt") and a.projekt != filters.projekt):
            continue
        data.append({"quelle": "Abnahme", "beleg": p.parent, "projekt": a.projekt, "bezeichnung": p.bezeichnung, "zustand": p.zustand, "beschreibung": p.beschreibung, "frist": p.frist, "festgestellt": a.datum, "servicefall": p.servicefall_ref, "ueberfaellig": bool(p.frist and getdate(p.frist) < heute)})

    for m in frappe.get_all("PH Montage Mangel", filters={"status": ("!=", "behoben"), "parenttype": "PH Montageauftrag"}, fields=["name", "parent", "beschreibung", "frist", "status", "servicefall_ref"]):
        mo = frappe.db.get_value("PH Montageauftrag", m.parent, ["projekt", "start"], as_dict=True)
        if not mo or (filters.get("projekt") and mo.projekt != filters.projekt):
            continue
        data.append({"quelle": "Montage", "beleg": m.parent, "projekt": mo.projekt, "bezeichnung": m.beschreibung, "zustand": m.status, "beschreibung": "", "frist": m.frist, "festgestellt": getdate(mo.start) if mo.start else None, "servicefall": m.servicefall_ref, "ueberfaellig": bool(m.frist and getdate(m.frist) < heute)})

    if filters.get("nur_ueberfaellig"):
        data = [d for d in data if d["ueberfaellig"]]
    for d in data:
        d["kunde_name"] = frappe.db.get_value("PH Projekt", d["projekt"], "kunde_name")
    data.sort(key=lambda d: (not d["ueberfaellig"], str(d["frist"] or "9999")))

    columns = [
        {"fieldname": "projekt", "label": _("Projekt"), "fieldtype": "Link", "options": "PH Projekt", "width": 140},
        {"fieldname": "kunde_name", "label": _("Kunde"), "fieldtype": "Data", "width": 140},
        {"fieldname": "quelle", "label": _("Quelle"), "fieldtype": "Data", "width": 80},
        {"fieldname": "beleg", "label": _("Beleg"), "fieldtype": "Dynamic Link", "options": "quelle_doctype", "width": 140},
        {"fieldname": "bezeichnung", "label": _("Mangel"), "fieldtype": "Data", "width": 220},
        {"fieldname": "zustand", "label": _("Zustand"), "fieldtype": "Data", "width": 90},
        {"fieldname": "beschreibung", "label": _("Beschreibung"), "fieldtype": "Data", "width": 220},
        {"fieldname": "festgestellt", "label": _("Festgestellt"), "fieldtype": "Date", "width": 100},
        {"fieldname": "frist", "label": _("Frist"), "fieldtype": "Date", "width": 100},
        {"fieldname": "ueberfaellig", "label": _("Überfällig"), "fieldtype": "Check", "width": 80},
        {"fieldname": "servicefall", "label": _("Servicefall"), "fieldtype": "Data", "width": 120},
    ]
    for d in data:
        d["quelle_doctype"] = "PH Abnahme" if d["quelle"] == "Abnahme" else "PH Montageauftrag"
    summary = [
        {"value": len(data), "label": _("Offene Mängel"), "datatype": "Int", "indicator": "Orange"},
        {"value": sum(1 for d in data if d["ueberfaellig"]), "label": _("Überfällig"), "datatype": "Int", "indicator": "Red"},
    ]
    return columns, data, None, None, summary
