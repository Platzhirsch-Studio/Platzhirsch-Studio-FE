"""Ersatzteile unter Mindestbestand mit offener Bestellmenge und Nachbestellvorschlag (Konzept §12 Priorität 2)."""

import frappe
from frappe import _
from frappe.utils import cint


def execute(filters=None):
    filters = frappe._dict(filters or {})
    bedingungen = {"bestand_fuehren": 1, "status": ("!=", "Inaktiv")}
    if filters.get("lieferant"):
        bedingungen["lieferant"] = filters.lieferant
    if filters.get("marke"):
        bedingungen["marke"] = filters.marke
    teile = frappe.get_all("PH Ersatzteil", filters=bedingungen, fields=["name", "bezeichnung", "hersteller_nr", "marke", "lieferant", "bestand", "reserviert", "verfuegbar", "mindestbestand", "lagerort", "lagerplatz", "ek_cent", "lieferzeit_tage"])
    offen = {}
    if teile:
        for p in frappe.get_all("PH Ersatzteilbestellung Position", filters={"parenttype": "PH Ersatzteilbestellung", "ersatzteil": ("in", [t.name for t in teile])}, fields=["parent", "ersatzteil", "menge", "menge_erhalten"]):
            status = frappe.db.get_value("PH Ersatzteilbestellung", p.parent, "status")
            if status in ("Entwurf", "Gesendet", "Bestaetigt", "Teilgeliefert"):
                offen[p.ersatzteil] = offen.get(p.ersatzteil, 0) + max(0, cint(p.menge) - cint(p.menge_erhalten))
    data = []
    for t in teile:
        verfuegbar = cint(t.verfuegbar) if t.verfuegbar is not None else cint(t.bestand) - cint(t.reserviert)
        unterwegs = offen.get(t.name, 0)
        if not filters.get("alle") and verfuegbar + unterwegs >= cint(t.mindestbestand):
            continue
        vorschlag = max(0, cint(t.mindestbestand) * 2 - verfuegbar - unterwegs) if cint(t.mindestbestand) else 0
        data.append({**t, "verfuegbar": verfuegbar, "unterwegs": unterwegs, "vorschlag": vorschlag, "wert_cent": vorschlag * cint(t.ek_cent)})
    columns = [
        {"fieldname": "name", "label": _("Ersatzteil"), "fieldtype": "Link", "options": "PH Ersatzteil", "width": 120},
        {"fieldname": "bezeichnung", "label": _("Bezeichnung"), "fieldtype": "Data", "width": 200},
        {"fieldname": "hersteller_nr", "label": _("Hersteller-Nr."), "fieldtype": "Data", "width": 120},
        {"fieldname": "lieferant", "label": _("Lieferant"), "fieldtype": "Link", "options": "PH Lieferant", "width": 140},
        {"fieldname": "verfuegbar", "label": _("Verfügbar"), "fieldtype": "Int", "width": 90},
        {"fieldname": "mindestbestand", "label": _("Mindestbestand"), "fieldtype": "Int", "width": 110},
        {"fieldname": "unterwegs", "label": _("Bestellt offen"), "fieldtype": "Int", "width": 110},
        {"fieldname": "vorschlag", "label": _("Vorschlag"), "fieldtype": "Int", "width": 90},
        {"fieldname": "lieferzeit_tage", "label": _("Lieferzeit (Tage)"), "fieldtype": "Int", "width": 110},
        {"fieldname": "lagerplatz", "label": _("Lagerplatz"), "fieldtype": "Data", "width": 100},
    ]
    return columns, data
