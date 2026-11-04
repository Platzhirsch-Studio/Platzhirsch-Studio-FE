"""Gemeinsame Datenbeschaffung der WP10b-Reports: signierte Kassenbelege eines Zeitraums als flache dicts.

Alle Reports arbeiten auf derselben Struktur wie logik/abschluss.soll_aus_belegen, damit Tagesabschluss,
Number Cards und Reports dieselben Zahlen liefern. Fremde Felder werden gegen das Meta geprüft (WP10a parallel).
"""

from __future__ import annotations

import frappe
from frappe.utils import add_days, getdate

BELEG_FELDER = ["name", "kasse", "belegart", "trainings", "gesamt_cent", "bediener", "datum_uhrzeit", "kontakt", "auftrag", "rechnung", "storno_von"]


def _felder(doctype, wunsch):
    meta = frappe.get_meta(doctype)
    return [f for f in wunsch if f == "name" or meta.has_field(f)]


def belege_zeitraum(von, bis, kasse=None, mit_training=False, bediener=None) -> list[dict]:
    """Belege (docstatus 1) von..bis inklusive, mit Zahlarten und Positionen."""
    if not frappe.db.exists("DocType", "PH Kassenbeleg"):
        return []
    von, bis = getdate(von), getdate(bis)
    filters = {"docstatus": 1, "datum_uhrzeit": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"])}
    if kasse:
        filters["kasse"] = kasse
    if bediener:
        filters["bediener"] = bediener
    meta = frappe.get_meta("PH Kassenbeleg")
    if not mit_training and meta.has_field("trainings"):
        filters["trainings"] = 0
    belege = frappe.get_all("PH Kassenbeleg", filters=filters, fields=_felder("PH Kassenbeleg", BELEG_FELDER), order_by="datum_uhrzeit asc")
    if not belege:
        return []
    namen = [b.name for b in belege]
    z_map, p_map = {}, {}
    if frappe.db.exists("DocType", "PH Kassenbeleg Zahlung"):
        for z in frappe.get_all("PH Kassenbeleg Zahlung", filters={"parent": ("in", namen)}, fields=_felder("PH Kassenbeleg Zahlung", ["parent", "zahlart", "betrag_cent", "gutschein", "terminal_payment_intent"])):
            z_map.setdefault(z.parent, []).append(z)
    if frappe.db.exists("DocType", "PH Kassenbeleg Position"):
        for p in frappe.get_all("PH Kassenbeleg Position", filters={"parent": ("in", namen)}, fields=_felder("PH Kassenbeleg Position", ["parent", "art", "bezeichnung", "produkt", "menge", "steuersatz", "netto_cent", "ust_cent", "brutto_cent", "bezug"])):
            p_map.setdefault(p.parent, []).append(p)
    return [{**b, "datum": getdate(b.get("datum_uhrzeit")), "zahlarten": z_map.get(b.name, []), "positionen": p_map.get(b.name, [])} for b in belege]


def tage(von, bis):
    d, bis = getdate(von), getdate(bis)
    while d <= bis:
        yield d
        d = add_days(d, 1)


def zeitraum_filter(filters):
    from frappe.utils import add_months, nowdate

    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -1))
    bis = getdate(filters.get("bis") or nowdate())
    return filters, von, bis
