"""Stufenwechsel aus PH Kundenkarte Ereignis (Art Stufenwechsel): wer, wann, von → nach, automatisch oder manuell."""

import frappe
from frappe import _
from frappe.utils import add_months, getdate, nowdate

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_stufe.ph_kundenkarte_stufe import stufen_liste
from ph_kundenkarte.utils import stufen as st


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -12))
    bis = getdate(filters.get("bis") or nowdate())
    bedingungen = {"art": "Stufenwechsel", "zeitpunkt": ("between", [f"{von} 00:00:00", f"{bis} 23:59:59"])}
    if filters.get("kundenkarte"):
        bedingungen["kundenkarte"] = filters.get("kundenkarte")
    ereignisse = frappe.get_all("PH Kundenkarte Ereignis", filters=bedingungen, fields=["name", "kundenkarte", "zeitpunkt", "alt", "neu", "automatisch", "von", "jahresumsatz_cent", "hinweis"], order_by="zeitpunkt desc")
    stufen = stufen_liste()
    data = []
    auf = ab = 0
    for e in ereignisse:
        r_alt = st.reihenfolge_von(stufen, e.alt)
        r_neu = st.reihenfolge_von(stufen, e.neu)
        richtung = _("Aufstufung") if (r_alt is None or (r_neu is not None and r_neu > r_alt)) else _("Herabstufung")
        if richtung == _("Aufstufung"):
            auf += 1
        else:
            ab += 1
        kunde = frappe.db.get_value("PH Kundenkarte", e.kundenkarte, "kunde_name")
        data.append({"zeitpunkt": e.zeitpunkt, "karte": e.kundenkarte, "kunde_name": kunde, "alt": e.alt, "neu": e.neu, "richtung": richtung, "art": _("automatisch") if e.automatisch else _("manuell"), "von": e.von, "jahresumsatz": (e.jahresumsatz_cent or 0) / 100 if e.jahresumsatz_cent is not None else None, "hinweis": e.hinweis})
    columns = [
        {"fieldname": "zeitpunkt", "label": _("Zeitpunkt"), "fieldtype": "Datetime", "width": 150},
        {"fieldname": "karte", "label": _("Karte"), "fieldtype": "Link", "options": "PH Kundenkarte", "width": 110},
        {"fieldname": "kunde_name", "label": _("Kunde"), "fieldtype": "Data", "width": 170},
        {"fieldname": "alt", "label": _("Von"), "fieldtype": "Data", "width": 130},
        {"fieldname": "neu", "label": _("Nach"), "fieldtype": "Data", "width": 130},
        {"fieldname": "richtung", "label": _("Richtung"), "fieldtype": "Data", "width": 100},
        {"fieldname": "art", "label": _("Auslöser"), "fieldtype": "Data", "width": 90},
        {"fieldname": "von", "label": _("Benutzer"), "fieldtype": "Link", "options": "User", "width": 140},
        {"fieldname": "jahresumsatz", "label": _("Umsatz Zeitraum €"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "hinweis", "label": _("Hinweis"), "fieldtype": "Data", "width": 220},
    ]
    summary = [
        {"value": auf, "label": _("Aufstufungen"), "datatype": "Int", "indicator": "Green"},
        {"value": ab, "label": _("Herabstufungen"), "datatype": "Int", "indicator": "Orange"},
    ]
    return columns, data, None, None, summary
