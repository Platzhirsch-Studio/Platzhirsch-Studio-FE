"""Kennzahlen für Number Cards vom Typ „Custom“ (fixtures/number_card.json → method) und Dashboards."""

import frappe
from frappe.utils import add_days, add_to_date, cint, now_datetime, nowdate


@frappe.whitelist()
def unbestaetigte_48h():
    grenze = add_to_date(now_datetime(), hours=-48)
    return {"value": frappe.db.count("PH Newsletter Abo", {"status": "Angemeldet unbestaetigt", "angemeldet_am": ("<", grenze)}), "fieldtype": "Int", "route_options": {"status": "Angemeldet unbestaetigt"}, "route": ["ph-newsletter-abo"]}


@frappe.whitelist()
def event_anmeldungen_offen():
    """Personen (nicht Zeilen) für kommende Events."""
    events = frappe.get_all("PH Event", filters={"status": ("in", ("Offen", "Ausgebucht")), "datum": (">=", nowdate())}, pluck="name")
    personen = 0
    if events:
        for r in frappe.get_all("PH Event Anmeldung", filters={"parent": ("in", events), "status": ("in", ("angemeldet", "bestaetigt"))}, fields=["personen"]):
            personen += cint(r.personen) or 1
    return {"value": personen, "fieldtype": "Int", "route": ["ph-event"]}


@frappe.whitelist()
def doi_quote_30_tage():
    von = add_days(nowdate(), -30)
    gesamt = frappe.db.count("PH Newsletter Abo", {"angemeldet_am": (">=", von)})
    aktiv = frappe.db.count("PH Newsletter Abo", {"angemeldet_am": (">=", von), "doi_bestaetigt_am": ("is", "set")})
    return {"value": round(100 * aktiv / gesamt, 1) if gesamt else 0, "fieldtype": "Percent", "route": ["ph-newsletter-abo"]}


def monatsreihe(doctype, datumsfeld, filters, von, bis):
    """{YYYY-MM: Anzahl} für Reports."""
    out = {}
    for r in frappe.get_all(doctype, filters={**filters, datumsfeld: ("between", [von, bis])}, fields=[datumsfeld]):
        d = r.get(datumsfeld)
        if d:
            k = str(d)[:7]
            out[k] = out.get(k, 0) + 1
    return out
