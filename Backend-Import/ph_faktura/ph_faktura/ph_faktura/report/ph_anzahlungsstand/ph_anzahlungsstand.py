"""PH Anzahlungsstand – Aufträge mit Anzahlung Soll/Ist/offen, Abrechnung und Zahlungsstand (OP gegen Auftrag, marahrw7)."""

import frappe
from frappe import _
from frappe.utils import cint


def execute(filters=None):
    f = frappe._dict(filters or {})
    flt = {"status": ("!=", "Storniert")}
    if f.get("status"):
        flt["status"] = f.status
    rows = frappe.get_all("PH Auftragsbestaetigung", filters=flt, fields=["name", "kunde_name", "kontakt", "status", "datum", "liefertermin_geplant", "liefertermin_bestaetigt", "auftragswert_cent", "anzahlung_soll_cent", "anzahlung_ist_cent", "abgerechnet_cent", "bezahlt_cent", "offen_cent", "geliefert_cent"], order_by="datum desc")
    data = []
    for r in rows:
        offen_anz = cint(r.anzahlung_soll_cent) - cint(r.anzahlung_ist_cent)
        if f.get("nur_offen") and offen_anz <= 0:
            continue
        anz_re = frappe.get_all("PH Rechnung", filters={"auftrag": r.name, "art": "Anzahlungsrechnung", "docstatus": 1, "status": ("!=", "Storniert")}, pluck="name")
        data.append({"auftrag": r.name, "kunde_name": r.kunde_name, "status": r.status, "datum": r.datum, "liefertermin": r.liefertermin_bestaetigt or r.liefertermin_geplant,
                     "auftragswert": cint(r.auftragswert_cent) / 100, "anzahlung_soll": cint(r.anzahlung_soll_cent) / 100, "anzahlung_ist": cint(r.anzahlung_ist_cent) / 100, "anzahlung_offen": offen_anz / 100,
                     "quote": round(100 * cint(r.anzahlung_ist_cent) / cint(r.anzahlung_soll_cent), 1) if cint(r.anzahlung_soll_cent) else 0,
                     "geliefert": cint(r.geliefert_cent) / 100, "abgerechnet": cint(r.abgerechnet_cent) / 100, "bezahlt": cint(r.bezahlt_cent) / 100, "offen": cint(r.offen_cent) / 100, "anzahlungsrechnungen": ", ".join(anz_re)})
    columns = [
        {"fieldname": "auftrag", "label": _("Auftrag"), "fieldtype": "Link", "options": "PH Auftragsbestaetigung", "width": 140},
        {"fieldname": "kunde_name", "label": _("Kunde"), "fieldtype": "Data", "width": 170},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 100},
        {"fieldname": "datum", "label": _("Datum"), "fieldtype": "Date", "width": 95},
        {"fieldname": "liefertermin", "label": _("Liefertermin"), "fieldtype": "Date", "width": 100},
        {"fieldname": "auftragswert", "label": _("Auftragswert €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "anzahlung_soll", "label": _("Anzahlung Soll €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "anzahlung_ist", "label": _("Anzahlung Ist €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "anzahlung_offen", "label": _("Anzahlung offen €"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "quote", "label": _("Ist/Soll %"), "fieldtype": "Percent", "width": 90},
        {"fieldname": "geliefert", "label": _("Geliefert €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "abgerechnet", "label": _("Abgerechnet €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "bezahlt", "label": _("Bezahlt €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "offen", "label": _("Offen gesamt €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "anzahlungsrechnungen", "label": _("Anzahlungsrechnungen"), "fieldtype": "Data", "width": 200},
    ]
    top = sorted(data, key=lambda d: -d["anzahlung_soll"])[:10]
    chart = {"data": {"labels": [d["auftrag"] for d in top], "datasets": [{"name": _("Soll"), "values": [d["anzahlung_soll"] for d in top]}, {"name": _("Ist"), "values": [d["anzahlung_ist"] for d in top]}]}, "type": "bar", "colors": ["#8a7a66", "#15803d"]}
    summary = [
        {"value": sum(d["anzahlung_soll"] for d in data), "label": _("Anzahlung Soll"), "datatype": "Currency"},
        {"value": sum(d["anzahlung_ist"] for d in data), "label": _("Anzahlung Ist"), "datatype": "Currency", "indicator": "Green"},
        {"value": sum(d["anzahlung_offen"] for d in data), "label": _("Anzahlung offen"), "datatype": "Currency", "indicator": "Orange"},
        {"value": sum(d["offen"] for d in data), "label": _("Auftragsbestand offen"), "datatype": "Currency"},
    ]
    return columns, data, None, chart, summary
