"""Script Report PH Bestellungen ohne Rechnung: bezahlte Bestellungen, zu denen noch keine PH Rechnung (ph_faktura,
Custom Field `rechnung` auf PH Bestellung) existiert. Ohne ph_faktura gelten alle bezahlten als „ohne Rechnung“."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate

BEZAHLT = ("bezahlt", "versandbereit", "versendet", "abholbereit", "abgeholt", "abgeschlossen", "teilerstattet")


def execute(filters=None):
    filters = frappe._dict(filters or {})
    von = getdate(filters.get("von") or add_months(nowdate(), -1))
    bis = getdate(filters.get("bis") or nowdate())
    hat_rechnung = frappe.get_meta("PH Bestellung").has_field("rechnung")
    felder = ["name", "bezahlt_am", "kunde_name", "gesamt_cent", "status", "lieferart", "modus", "rechnungswunsch", "rechnung_uid"]
    if hat_rechnung:
        felder.append("rechnung")
    rows = frappe.get_all("PH Bestellung", {"status": ("in", BEZAHLT), "bezahlt_am": ("between", [von, f"{bis} 23:59:59"])}, felder, order_by="bezahlt_am")
    data = []
    for r in rows:
        if hat_rechnung and r.get("rechnung"):
            continue
        tage = (getdate(nowdate()) - getdate(r.bezahlt_am)).days
        data.append({"bestellung": r.name, "bezahlt_am": r.bezahlt_am, "kunde": r.kunde_name, "betrag": cint(r.gesamt_cent) / 100, "status": r.status, "lieferart": r.lieferart, "modus": r.modus, "rechnungswunsch": _("ja") if r.rechnungswunsch or r.rechnung_uid else _("nein"), "tage": tage})
    cols = [
        {"fieldname": "bestellung", "label": _("Bestellung"), "fieldtype": "Link", "options": "PH Bestellung", "width": 180},
        {"fieldname": "bezahlt_am", "label": _("Bezahlt am"), "fieldtype": "Datetime", "width": 150},
        {"fieldname": "tage", "label": _("Tage offen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "kunde", "label": _("Kunde"), "fieldtype": "Data", "width": 180},
        {"fieldname": "betrag", "label": _("Betrag €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 110},
        {"fieldname": "lieferart", "label": _("Lieferart"), "fieldtype": "Data", "width": 90},
        {"fieldname": "rechnungswunsch", "label": _("Rechnung gewünscht"), "fieldtype": "Data", "width": 130},
        {"fieldname": "modus", "label": _("Modus"), "fieldtype": "Data", "width": 70},
    ]
    summary = [
        {"value": len(data), "label": _("Ohne Rechnung"), "datatype": "Int", "indicator": "Orange" if data else "Green"},
        {"value": sum(d["betrag"] for d in data), "label": _("Summe €"), "datatype": "Currency"},
        {"value": sum(1 for d in data if d["tage"] > 14), "label": _("älter als 14 Tage"), "datatype": "Int", "indicator": "Red"},
    ]
    hinweis = None if hat_rechnung else _("ph_faktura ist nicht installiert – Verknüpfung „rechnung“ fehlt; alle bezahlten Bestellungen werden gezeigt.")
    return cols, data, hinweis, None, summary
