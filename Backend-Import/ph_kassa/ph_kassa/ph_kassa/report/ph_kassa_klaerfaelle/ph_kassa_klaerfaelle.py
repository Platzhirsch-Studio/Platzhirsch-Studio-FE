"""PH Kassa Klaerfaelle – alles, was nach dem Buchen noch Handarbeit braucht (Konzept 10-kassa §9.2):
Belege mit fehlgeschlagener Nebenbuchung (PH Zahlung, Gutschein, Faktura, Kassenbuch, Kartenrückerstattung) und
bezahlte Terminalzahlungen ohne Beleg (UX-Kritik 20 Z3)."""

import frappe
from frappe import _


def execute(filters=None):
    filters = frappe._dict(filters or {})
    data = []
    bf = {"docstatus": 1, "nebenbuchung_status": "Fehler"}
    if filters.get("kasse"):
        bf["kasse"] = filters.kasse
    for b in frappe.get_all("PH Kassenbeleg", filters=bf, fields=["name", "kasse", "datum_uhrzeit", "gesamt_cent", "bediener", "nebenbuchung_hinweis"], order_by="datum_uhrzeit desc", limit=500):
        data.append({"art": _("Nebenbuchung"), "bezug_doctype": "PH Kassenbeleg", "bezug": b.name, "kasse": b.kasse, "zeitpunkt": b.datum_uhrzeit, "betrag_cent": b.gesamt_cent, "bediener": b.bediener, "hinweis": b.nebenbuchung_hinweis})
    if frappe.db.exists("DocType", "PH Terminal Vorgang"):
        tf = {"status": "Bezahlt", "beleg": ("is", "not set")}
        if filters.get("kasse"):
            tf["kasse"] = filters.kasse
        for t in frappe.get_all("PH Terminal Vorgang", filters=tf, fields=["name", "kasse", "gestartet_am", "betrag_cent", "bediener", "payment_intent"], order_by="gestartet_am desc", limit=500):
            data.append({"art": _("Kartenzahlung ohne Beleg"), "bezug_doctype": "PH Terminal Vorgang", "bezug": t.name, "kasse": t.kasse, "zeitpunkt": t.gestartet_am, "betrag_cent": t.betrag_cent, "bediener": t.bediener, "hinweis": _("PaymentIntent {0}: Beleg nachbuchen oder erstatten").format(t.payment_intent)})
    columns = [
        {"fieldname": "art", "label": _("Klärfall"), "fieldtype": "Data", "width": 190},
        {"fieldname": "bezug_doctype", "label": _("Typ"), "fieldtype": "Data", "hidden": 1},
        {"fieldname": "bezug", "label": _("Beleg/Vorgang"), "fieldtype": "Dynamic Link", "options": "bezug_doctype", "width": 170},
        {"fieldname": "kasse", "label": _("Kasse"), "fieldtype": "Link", "options": "PH Kasse", "width": 110},
        {"fieldname": "zeitpunkt", "label": _("Zeitpunkt"), "fieldtype": "Datetime", "width": 150},
        {"fieldname": "betrag_cent", "label": _("Betrag (Cent)"), "fieldtype": "Int", "width": 110},
        {"fieldname": "bediener", "label": _("Bediener"), "fieldtype": "Link", "options": "User", "width": 160},
        {"fieldname": "hinweis", "label": _("Hinweis"), "fieldtype": "Small Text", "width": 380},
    ]
    return columns, data, None, None, [{"value": len(data), "label": _("Offene Klärfälle"), "datatype": "Int", "indicator": "Red" if data else "Green"}]
