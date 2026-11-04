"""Number Cards (type Custom): Geldbeträge in Euro statt Cent-Zählern. Jede Methode gibt {"value", "fieldtype"} zurück."""

import frappe
from frappe.utils import add_days, cint, getdate, nowdate

OFFEN = ("Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt")


def _euro(cent):
    return {"value": round(cint(cent) / 100, 2), "fieldtype": "Currency", "route_options": {}}


def _summe(doctype, feld, filters):
    r = frappe.get_all(doctype, filters=filters, fields=[f"sum({feld}) as s"])
    return r[0].s if r else 0


@frappe.whitelist()
def offene_angebote():
    v = _summe("PH Angebot", "brutto_cent", {"status": ("in", ("Entwurf", "Gesendet"))})
    return {**_euro(v), "route": ["List", "PH Angebot", {"status": ["in", ["Entwurf", "Gesendet"]]}]}


@frappe.whitelist()
def auftragsbestand():
    v = _summe("PH Auftragsbestaetigung", "offen_cent", {"status": ("in", ("Offen", "In Bestellung", "Teilgeliefert", "Geliefert"))})
    return {**_euro(v), "route": ["List", "PH Auftragsbestaetigung", {"status": ["in", ["Offen", "In Bestellung", "Teilgeliefert", "Geliefert"]]}]}


@frappe.whitelist()
def op_gesamt():
    v = _summe("PH Rechnung", "offen_cent", {"docstatus": 1, "status": ("in", OFFEN)})
    return {**_euro(v), "route": ["query-report", "PH Offene Posten"]}


@frappe.whitelist()
def op_ueberfaellig():
    v = _summe("PH Rechnung", "offen_cent", {"docstatus": 1, "status": ("in", OFFEN), "faellig": ("<", nowdate())})
    return {**_euro(v), "route": ["List", "PH Rechnung", {"status": ["in", ["Ueberfaellig", "Gemahnt"]]}]}


@frappe.whitelist()
def anzahlungen_offen():
    v = _summe("PH Rechnung", "offen_cent", {"docstatus": 1, "art": "Anzahlungsrechnung", "status": ("in", OFFEN)})
    return {**_euro(v), "route": ["query-report", "PH Anzahlungsstand"]}


@frappe.whitelist()
def umsatz_monat():
    heute = getdate(nowdate())
    v = _summe("PH Rechnung", "zahlbar_cent", {"docstatus": 1, "status": ("!=", "Storniert"), "art": ("!=", "Anzahlungsrechnung"), "datum": (">=", heute.replace(day=1))})
    g = _summe("PH Gutschrift", "brutto_cent", {"docstatus": 1, "datum": (">=", heute.replace(day=1))})
    return _euro(cint(v) - cint(g))


@frappe.whitelist()
def eingangsrechnungen_offen():
    v = _summe("PH Eingangsrechnung", "zahlbetrag_cent", {"status": "Freigegeben"})
    return {**_euro(v), "route": ["List", "PH Eingangsrechnung", {"status": "Freigegeben"}]}


@frappe.whitelist()
def nicht_exportiert():
    n = frappe.db.count("PH Rechnung", {"docstatus": 1, "export_status": "offen"}) + frappe.db.count("PH Gutschrift", {"docstatus": 1, "export_status": "offen"}) + frappe.db.count("PH Eingangsrechnung", {"status": ("in", ("Freigegeben", "Bezahlt")), "export_status": "offen"})
    return {"value": n, "fieldtype": "Int", "route": ["List", "PH Export Lauf"]}


@frappe.whitelist()
def faellig_7_tage():
    v = _summe("PH Rechnung", "offen_cent", {"docstatus": 1, "status": ("in", OFFEN), "faellig": ("between", [nowdate(), add_days(nowdate(), 7)])})
    return _euro(v)
