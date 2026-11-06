"""SLA-Erfüllung: Reaktions- und Lösungsfristen je Monat und Priorität (Quote eingehalten, Ø Werktage bis Erstreaktion).
Vorbild Odoo Helpdesk „SLA-Erfolg“ (Marktresearch/digital/backoffice/30-marktfunktionen.md, service)."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate

from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import feiertage
from ph_service.utils import sla


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -6))
    bis = getdate(filters.get("bis") or nowdate())
    bedingungen = {"gemeldet_am": ("between", [von, bis])}
    if filters.get("prioritaet"):
        bedingungen["prioritaet"] = filters.prioritaet
    if filters.get("verantwortlich"):
        bedingungen["verantwortlich"] = filters.verantwortlich
    rows = frappe.get_all("PH Servicefall", filters=bedingungen, fields=["name", "gemeldet_am", "prioritaet", "frist_reaktion", "frist_loesung", "erstreaktion_am", "erledigt_am", "status"])
    ft = feiertage()
    heute = getdate(nowdate())
    gruppen = {}
    for r in rows:
        schluessel = (getdate(r.gemeldet_am).strftime("%Y-%m"), r.prioritaet or "Normal")
        g = gruppen.setdefault(schluessel, {"faelle": 0, "reaktion_ok": 0, "reaktion_bewertet": 0, "loesung_ok": 0, "loesung_bewertet": 0, "werktage_reaktion": [], "offen_verletzt": 0})
        g["faelle"] += 1
        st = sla.status(heute, r.frist_reaktion, r.frist_loesung, getdate(r.erstreaktion_am) if r.erstreaktion_am else None, getdate(r.erledigt_am) if r.erledigt_am else None, feiertage=ft)
        if r.erstreaktion_am or st["reaktion_verletzt"]:
            g["reaktion_bewertet"] += 1
            g["reaktion_ok"] += 0 if st["reaktion_verletzt"] else 1
        if r.erstreaktion_am:
            g["werktage_reaktion"].append(sla.werktage_zwischen(getdate(r.gemeldet_am), getdate(r.erstreaktion_am), ft) or 0)
        if r.erledigt_am or st["loesung_verletzt"]:
            g["loesung_bewertet"] += 1
            g["loesung_ok"] += 0 if st["loesung_verletzt"] else 1
        if not r.erledigt_am and st["status"] == sla.STATUS_VERLETZT:
            g["offen_verletzt"] += 1
    data = []
    for (monat, prio), g in sorted(gruppen.items()):
        data.append(
            {
                "monat": monat,
                "prioritaet": prio,
                "faelle": g["faelle"],
                "reaktion_quote": round(100 * g["reaktion_ok"] / g["reaktion_bewertet"], 1) if g["reaktion_bewertet"] else None,
                "reaktion_werktage": round(sum(g["werktage_reaktion"]) / len(g["werktage_reaktion"]), 1) if g["werktage_reaktion"] else None,
                "loesung_quote": round(100 * g["loesung_ok"] / g["loesung_bewertet"], 1) if g["loesung_bewertet"] else None,
                "offen_verletzt": g["offen_verletzt"],
            }
        )
    columns = [
        {"fieldname": "monat", "label": _("Monat"), "fieldtype": "Data", "width": 90},
        {"fieldname": "prioritaet", "label": _("Priorität"), "fieldtype": "Data", "width": 100},
        {"fieldname": "faelle", "label": _("Fälle"), "fieldtype": "Int", "width": 70},
        {"fieldname": "reaktion_quote", "label": _("Reaktion in Frist %"), "fieldtype": "Float", "width": 140},
        {"fieldname": "reaktion_werktage", "label": _("Ø Werktage bis Reaktion"), "fieldtype": "Float", "width": 160},
        {"fieldname": "loesung_quote", "label": _("Lösung in Frist %"), "fieldtype": "Float", "width": 130},
        {"fieldname": "offen_verletzt", "label": _("Offen & verletzt"), "fieldtype": "Int", "width": 120},
    ]
    gesamt = sum(g["faelle"] for g in gruppen.values())
    bewertet = sum(g["loesung_bewertet"] for g in gruppen.values())
    ok = sum(g["loesung_ok"] for g in gruppen.values())
    summary = [
        {"label": _("Fälle"), "value": gesamt, "indicator": "blue"},
        {"label": _("Lösung in Frist"), "value": f"{round(100 * ok / bewertet)} %" if bewertet else "–", "indicator": "green" if bewertet and ok / bewertet >= 0.9 else "orange"},
        {"label": _("Offen & verletzt"), "value": sum(g["offen_verletzt"] for g in gruppen.values()), "indicator": "red"},
    ]
    return columns, data, None, None, summary
