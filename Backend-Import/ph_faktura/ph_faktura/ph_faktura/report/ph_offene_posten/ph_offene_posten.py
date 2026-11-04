"""PH Offene Posten – Debitoren-OP-Liste mit Altersstruktur (0–30, 31–60, 61–90, > 90 Tage)."""

import frappe
from frappe import _
from frappe.utils import cint, getdate, nowdate

KLASSEN = ((0, "nicht fällig"), (30, "1–30 Tage"), (60, "31–60 Tage"), (90, "61–90 Tage"), (10**6, "> 90 Tage"))


def klasse(tage):
    if tage <= 0:
        return KLASSEN[0][1]
    for grenze, label in KLASSEN[1:]:
        if tage <= grenze:
            return label
    return KLASSEN[-1][1]


def execute(filters=None):
    f = frappe._dict(filters or {})
    stichtag = getdate(f.get("stichtag") or nowdate())
    flt = {"docstatus": 1, "offen_cent": (">", 0), "status": ("not in", ("Storniert", "Uneinbringlich")), "datum": ("<=", stichtag)}
    if f.get("kontakt"):
        flt["kontakt"] = f.kontakt
    rows = frappe.get_all("PH Rechnung", filters=flt, fields=["name", "art", "kontakt", "kunde_name", "datum", "faellig", "zahlbar_cent", "bezahlt_cent", "offen_cent", "mahnstufe", "letzte_mahnung", "auftrag"], order_by="faellig asc")
    data, je_klasse = [], {k[1]: 0 for k in KLASSEN}
    for r in rows:
        tage = (stichtag - getdate(r.faellig)).days if r.faellig else 0
        if f.get("nur_ueberfaellig") and tage <= 0:
            continue
        k = klasse(tage)
        je_klasse[k] += cint(r.offen_cent)
        data.append({"rechnung": r.name, "art": r.art, "kontakt": r.kontakt, "kunde_name": r.kunde_name, "datum": r.datum, "faellig": r.faellig, "zahlbar": cint(r.zahlbar_cent) / 100, "bezahlt": cint(r.bezahlt_cent) / 100,
                     "offen": cint(r.offen_cent) / 100, "tage": max(tage, 0), "klasse": k, "mahnstufe": r.mahnstufe, "letzte_mahnung": r.letzte_mahnung, "auftrag": r.auftrag})
    columns = [
        {"fieldname": "rechnung", "label": _("Rechnung"), "fieldtype": "Link", "options": "PH Rechnung", "width": 140},
        {"fieldname": "art", "label": _("Art"), "fieldtype": "Data", "width": 120},
        {"fieldname": "kunde_name", "label": _("Kunde"), "fieldtype": "Data", "width": 180},
        {"fieldname": "kontakt", "label": _("Kontakt"), "fieldtype": "Link", "options": "PH Kontakt", "width": 110},
        {"fieldname": "datum", "label": _("Datum"), "fieldtype": "Date", "width": 95},
        {"fieldname": "faellig", "label": _("Fällig"), "fieldtype": "Date", "width": 95},
        {"fieldname": "zahlbar", "label": _("Zahlbar €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "bezahlt", "label": _("Bezahlt €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "offen", "label": _("Offen €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "tage", "label": _("Tage überfällig"), "fieldtype": "Int", "width": 110},
        {"fieldname": "klasse", "label": _("Alter"), "fieldtype": "Data", "width": 100},
        {"fieldname": "mahnstufe", "label": _("Mahnstufe"), "fieldtype": "Int", "width": 90},
        {"fieldname": "letzte_mahnung", "label": _("Letzte Mahnung"), "fieldtype": "Date", "width": 110},
        {"fieldname": "auftrag", "label": _("Auftrag"), "fieldtype": "Link", "options": "PH Auftragsbestaetigung", "width": 130},
    ]
    chart = {"data": {"labels": [k[1] for k in KLASSEN], "datasets": [{"name": _("Offen €"), "values": [round(je_klasse[k[1]] / 100, 2) for k in KLASSEN]}]}, "type": "bar", "colors": ["#b45309"]}
    gesamt = sum(d["offen"] for d in data)
    ueber = sum(d["offen"] for d in data if d["tage"] > 0)
    summary = [
        {"value": gesamt, "label": _("Offen gesamt"), "datatype": "Currency"},
        {"value": ueber, "label": _("davon überfällig"), "datatype": "Currency", "indicator": "Red" if ueber else "Green"},
        {"value": len(data), "label": _("Belege"), "datatype": "Int"},
    ]
    return columns, data, None, chart, summary
