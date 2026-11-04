"""Kennzahlen für Number Cards vom Typ „Custom“ (fixtures/number_card.json → method) und Workspace.
Rückgabe: {"value", "fieldtype", "route", "route_options"}."""

import frappe
from frappe.utils import add_days, cint, getdate, nowdate

from ph_service.ph_service.doctype.ph_service_einstellungen.ph_service_einstellungen import einstellungen
from ph_service.ph_service.doctype.ph_servicefall.ph_servicefall import OFFEN


def _karte(value, route=None, route_options=None, fieldtype="Int"):
    return {"value": value, "fieldtype": fieldtype, "route": route or ["List", "PH Servicefall"], "route_options": route_options or {}}


@frappe.whitelist()
def fristen_laufen_ab(filters=None, **kwargs):
    """Offene Fälle, deren Gewährleistung in den nächsten N Tagen (Einstellung) endet oder bereits abgelaufen ist."""
    tage = int(einstellungen()["fristwarnung_tage"])
    bis = add_days(nowdate(), tage)
    n = frappe.db.count("PH Servicefall", {"status": ("in", OFFEN), "gewaehrleistung_bis": ("<=", bis)})
    return _karte(n, route_options={"status": ["in", list(OFFEN)], "gewaehrleistung_bis": ["<=", str(bis)]})


@frappe.whitelist()
def ueberfaellige_reaktion(filters=None, **kwargs):
    n = frappe.db.count("PH Servicefall", {"status": "Gemeldet", "erstreaktion_am": ("is", "not set"), "frist_reaktion": ("<", nowdate())})
    return _karte(n, route_options={"status": "Gemeldet", "frist_reaktion": ["<", nowdate()]})


@frappe.whitelist()
def einsaetze_diese_woche(filters=None, **kwargs):
    heute = getdate(nowdate())
    start = add_days(heute, -heute.weekday())
    ende = add_days(start, 6)
    n = frappe.db.count("PH Serviceeinsatz", {"datum": ("between", [start, ende]), "status": ("not in", ["Abgebrochen"])})
    return _karte(n, route=["List", "PH Serviceeinsatz"], route_options={"datum": ["between", [str(start), str(ende)]]})


@frappe.whitelist()
def regress_offen_cent(filters=None, **kwargs):
    rows = frappe.get_all("PH Lieferantenregress", filters={"status": ("in", ["Offen", "Gemeldet", "Anerkannt"])}, fields=["betrag_gefordert_cent", "betrag_anerkannt_cent", "status"])
    summe = sum(cint(r.betrag_anerkannt_cent) if r.status == "Anerkannt" else cint(r.betrag_gefordert_cent) for r in rows)
    return {"value": summe / 100, "fieldtype": "Currency", "route": ["List", "PH Lieferantenregress"], "route_options": {"status": ["in", ["Offen", "Gemeldet", "Anerkannt"]]}}


@frappe.whitelist()
def ersatzteile_unter_mindestbestand(filters=None, **kwargs):
    rows = frappe.get_all("PH Ersatzteil", filters={"bestand_fuehren": 1, "status": ("!=", "Inaktiv"), "mindestbestand": (">", 0)}, fields=["name", "verfuegbar", "mindestbestand"])
    n = sum(1 for r in rows if cint(r.verfuegbar) < cint(r.mindestbestand))
    return _karte(n, route=["List", "PH Ersatzteil"], route_options={"bestand_fuehren": 1})


@frappe.whitelist()
def durchlaufzeit_quartal(filters=None, **kwargs):
    rows = frappe.get_all("PH Servicefall", filters={"erledigt_am": (">=", add_days(nowdate(), -90)), "dauer_tage": ("is", "set")}, fields=["dauer_tage"])
    wert = round(sum(cint(r.dauer_tage) for r in rows) / len(rows), 1) if rows else 0
    return {"value": wert, "fieldtype": "Float", "route": ["List", "PH Servicefall"], "route_options": {"status": ["in", ["Erledigt", "Geschlossen"]]}}


@frappe.whitelist()
def wartungen_ueberfaellig(filters=None, **kwargs):
    n = frappe.db.count("PH Pflege Abo", {"status": "Aktiv", "ueberfaellig": 1})
    return _karte(n, route=["List", "PH Pflege Abo"], route_options={"ueberfaellig": 1})
