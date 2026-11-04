"""Script Report PH Stripe Abgleich: Payouts (PH Stripe Auszahlung) gegen gebuchte Stripe-Zahlungen (PH Zahlung).

Abschnitte: (1) Auszahlungen im Zeitraum mit Differenz, (2) Stripe-Zahlungen ohne Auszahlung,
(3) Balance Transactions bei Stripe ohne PH Zahlung (nur ohne Simulation, API), (4) Gebühren je Monat.
Alles in Euro aus Cent-Feldern; Live und Test getrennt gekennzeichnet."""

import time

import frappe
from frappe import _
from frappe.utils import add_months, cint, get_datetime, getdate, nowdate

from ph_shop import stripe_client


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -1))
    bis = getdate(filters.get("bis") or nowdate())
    data = []

    payouts = frappe.get_all("PH Stripe Auszahlung", {"datum_erwartet": ("between", [von, bis])}, ["name", "status", "betrag_cent", "brutto_cent", "gebuehren_cent", "differenz_cent", "datum_erwartet", "livemode", "abgeglichen_am"], order_by="datum_erwartet")
    for p in payouts:
        data.append({"abschnitt": _("Auszahlung"), "datum": p.datum_erwartet, "referenz": p.name, "doctype": "PH Stripe Auszahlung", "status": p.status, "betrag": cint(p.betrag_cent) / 100, "gebuehr": cint(p.gebuehren_cent) / 100, "differenz": cint(p.differenz_cent) / 100 if p.abgeglichen_am else None, "livemode": _("live") if p.livemode else _("test"), "hinweis": "" if p.abgeglichen_am else _("noch nicht abgeglichen")})

    offen = frappe.get_all("PH Zahlung", {"docstatus": 1, "kanal": ("like", "Stripe%"), "stripe_auszahlung": ("in", ("", None)), "zeitpunkt": ("between", [von, f"{bis} 23:59:59"])}, ["name", "art", "zeitpunkt", "betrag_cent", "stripe_gebuehr_cent", "livemode", "stripe_payment_intent", "status"], order_by="zeitpunkt")
    for z in offen:
        data.append({"abschnitt": _("Zahlung ohne Auszahlung"), "datum": getdate(z.zeitpunkt), "referenz": z.name, "doctype": "PH Zahlung", "status": z.status, "betrag": (cint(z.betrag_cent) if z.art != "Erstattung" else -cint(z.betrag_cent)) / 100, "gebuehr": cint(z.stripe_gebuehr_cent) / 100, "differenz": None, "livemode": _("live") if z.livemode else _("test"), "hinweis": _("Payout steht aus oder Ereignis payout.paid fehlt")})

    fehlend_stripe = 0
    if not stripe_client.simulation():
        try:
            von_ts = int(time.mktime(get_datetime(von).timetuple()))
            bis_ts = int(time.mktime(get_datetime(f"{bis} 23:59:59").timetuple()))
            for tx in stripe_client.balance_transactions(von_ts, bis_ts):
                if tx.get("type") not in ("charge", "payment", "refund"):
                    continue
                src = tx.get("source") or {}
                pi = src.get("payment_intent") if isinstance(src, dict) else None
                vorhanden = frappe.db.exists("PH Zahlung", {"stripe_payment_intent": pi}) if pi else frappe.db.exists("PH Zahlung", {"stripe_refund": src.get("id") if isinstance(src, dict) else None})
                if not vorhanden:
                    fehlend_stripe += 1
                    data.append({"abschnitt": _("In Stripe, nicht in Frappe"), "datum": getdate(get_datetime(tx.get("created") and time.strftime("%Y-%m-%d", time.localtime(tx["created"])))), "referenz": tx.get("id"), "doctype": None, "status": tx.get("type"), "betrag": cint(tx.get("amount")) / 100, "gebuehr": cint(tx.get("fee")) / 100, "differenz": None, "livemode": _("live"), "hinweis": pi or ""})
        except Exception:  # noqa: BLE001 – Report darf nie am Netz scheitern
            frappe.log_error(title="PH Stripe Abgleich: Stripe-API")
            data.append({"abschnitt": _("Hinweis"), "referenz": "-", "status": "-", "hinweis": _("Stripe-API nicht erreichbar – nur Frappe-Daten gezeigt.")})

    geb = {}
    for z in frappe.get_all("PH Zahlung", {"docstatus": 1, "kanal": ("like", "Stripe%"), "zeitpunkt": ("between", [von, f"{bis} 23:59:59"]), "art": "Eingang"}, ["zeitpunkt", "stripe_gebuehr_cent", "betrag_cent"]):
        k = getdate(z.zeitpunkt).strftime("%Y-%m")
        g = geb.setdefault(k, {"umsatz": 0, "gebuehr": 0})
        g["umsatz"] += cint(z.betrag_cent)
        g["gebuehr"] += cint(z.stripe_gebuehr_cent)
    for k in sorted(geb):
        data.append({"abschnitt": _("Gebühren je Monat"), "datum": None, "referenz": k, "doctype": None, "status": "", "betrag": geb[k]["umsatz"] / 100, "gebuehr": geb[k]["gebuehr"] / 100, "differenz": None, "livemode": "", "hinweis": f"{(100 * geb[k]['gebuehr'] / geb[k]['umsatz']):.2f} %" if geb[k]["umsatz"] else ""})

    cols = [
        {"fieldname": "abschnitt", "label": _("Abschnitt"), "fieldtype": "Data", "width": 190},
        {"fieldname": "datum", "label": _("Datum"), "fieldtype": "Date", "width": 100},
        {"fieldname": "referenz", "label": _("Referenz"), "fieldtype": "Dynamic Link", "options": "doctype", "width": 200},
        {"fieldname": "doctype", "label": _("Typ"), "fieldtype": "Data", "width": 140, "hidden": 1},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 110},
        {"fieldname": "betrag", "label": _("Betrag €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "gebuehr", "label": _("Gebühr €"), "fieldtype": "Currency", "width": 100},
        {"fieldname": "differenz", "label": _("Differenz €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "livemode", "label": _("Modus"), "fieldtype": "Data", "width": 70},
        {"fieldname": "hinweis", "label": _("Hinweis"), "fieldtype": "Data", "width": 300},
    ]
    abw = [p for p in payouts if p.abgeglichen_am and cint(p.differenz_cent)]
    summary = [
        {"value": len(payouts), "label": _("Auszahlungen"), "datatype": "Int"},
        {"value": len(abw), "label": _("mit Differenz"), "datatype": "Int", "indicator": "Red" if abw else "Green"},
        {"value": len(offen), "label": _("Zahlungen ohne Auszahlung"), "datatype": "Int", "indicator": "Orange" if offen else "Green"},
        {"value": fehlend_stripe, "label": _("In Stripe, nicht in Frappe"), "datatype": "Int", "indicator": "Red" if fehlend_stripe else "Green"},
    ]
    hinweis = _("Simulation aktiv: Abschnitt „In Stripe, nicht in Frappe“ entfällt (keine API-Aufrufe).") if stripe_client.simulation() else None
    labels = sorted(geb)
    chart = {"data": {"labels": labels, "datasets": [{"name": _("Stripe-Umsatz €"), "values": [geb[k]["umsatz"] / 100 for k in labels]}, {"name": _("Gebühren €"), "values": [geb[k]["gebuehr"] / 100 for k in labels]}]}, "type": "bar", "colors": ["#1d4ed8", "#b45309"]}
    return cols, data, hinweis, chart, summary
