"""Script Report PH Rueckerstattungen: alle Gegenbuchungen (PH Zahlung, art Erstattung) im Zeitraum mit Grund,
Ursprung, Bezug, Stripe-Refund und Auslöser."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -1))
    bis = getdate(filters.get("bis") or nowdate())
    bed = {"docstatus": 1, "art": "Erstattung", "zeitpunkt": ("between", [von, f"{bis} 23:59:59"])}
    if cint(filters.get("nur_live", 1)):
        bed["livemode"] = 1
    rows = frappe.get_all("PH Zahlung", bed, ["name", "zeitpunkt", "kanal", "betrag_cent", "ursprung", "bezug_doctype", "bezug", "stripe_refund", "notiz", "owner", "quelle"], order_by="zeitpunkt desc")
    data = []
    for r in rows:
        data.append({"zahlung": r.name, "zeitpunkt": r.zeitpunkt, "kanal": r.kanal, "betrag": cint(r.betrag_cent) / 100, "ursprung": r.ursprung, "bezug_doctype": r.bezug_doctype, "bezug": r.bezug, "stripe_refund": r.stripe_refund, "grund": r.notiz, "ausgeloest": _("Stripe/Website") if r.quelle in ("stripe", "website") else r.owner})
    cols = [
        {"fieldname": "zahlung", "label": _("Gegenbuchung"), "fieldtype": "Link", "options": "PH Zahlung", "width": 160},
        {"fieldname": "zeitpunkt", "label": _("Zeitpunkt"), "fieldtype": "Datetime", "width": 150},
        {"fieldname": "betrag", "label": _("Betrag €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "kanal", "label": _("Kanal"), "fieldtype": "Data", "width": 120},
        {"fieldname": "ursprung", "label": _("Ursprungszahlung"), "fieldtype": "Link", "options": "PH Zahlung", "width": 160},
        {"fieldname": "bezug_doctype", "label": _("Bezug (Typ)"), "fieldtype": "Data", "width": 150},
        {"fieldname": "bezug", "label": _("Bezug"), "fieldtype": "Dynamic Link", "options": "bezug_doctype", "width": 160},
        {"fieldname": "stripe_refund", "label": _("Stripe Refund"), "fieldtype": "Data", "width": 180},
        {"fieldname": "grund", "label": _("Grund"), "fieldtype": "Data", "width": 220},
        {"fieldname": "ausgeloest", "label": _("Ausgelöst von"), "fieldtype": "Data", "width": 160},
    ]
    je_monat = {}
    for d in data:
        k = getdate(d["zeitpunkt"]).strftime("%Y-%m")
        je_monat[k] = je_monat.get(k, 0) + d["betrag"]
    labels = sorted(je_monat)
    chart = {"data": {"labels": labels, "datasets": [{"name": _("Erstattet €"), "values": [je_monat[k] for k in labels]}]}, "type": "bar", "colors": ["#b91c1c"]}
    summary = [
        {"value": sum(d["betrag"] for d in data), "label": _("Erstattet €"), "datatype": "Currency", "indicator": "Red"},
        {"value": len(data), "label": _("Erstattungen"), "datatype": "Int"},
        {"value": sum(1 for d in data if d["stripe_refund"]), "label": _("davon Stripe"), "datatype": "Int"},
    ]
    return cols, data, None, chart, summary
