"""PH Zahllauf Vorschlag – freigegebene Eingangsrechnungen, fällig bis Stichtag oder mit nutzbarem Skonto."""

import frappe
from frappe import _
from frappe.utils import cint

from ph_faktura.ph_faktura.doctype.ph_eingangsrechnung.ph_eingangsrechnung import zahllauf_vorschlag


def execute(filters=None):
    f = frappe._dict(filters or {})
    rows = zahllauf_vorschlag(f.get("stichtag"))
    data = [{"eingangsrechnung": r.name, "lieferant_name": r.lieferant_name, "rechnungsnummer": r.rechnungsnummer_lieferant, "datum": r.datum, "faellig": r.faellig, "skonto_bis": r.skonto_bis, "skonto": cint(r.skonto_cent) / 100, "brutto": cint(r.brutto_cent) / 100,
             "empfohlen": r["empfohlen_cent"] / 100, "grund": r["grund"], "iban": r.iban_lieferant, "bic": r.bic_lieferant, "zahlungsreferenz": r.zahlungsreferenz, "projekt": r.projekt} for r in rows]
    columns = [
        {"fieldname": "eingangsrechnung", "label": _("Eingangsrechnung"), "fieldtype": "Link", "options": "PH Eingangsrechnung", "width": 140},
        {"fieldname": "lieferant_name", "label": _("Lieferant"), "fieldtype": "Data", "width": 170},
        {"fieldname": "rechnungsnummer", "label": _("Rechnungsnr."), "fieldtype": "Data", "width": 120},
        {"fieldname": "datum", "label": _("Datum"), "fieldtype": "Date", "width": 95},
        {"fieldname": "faellig", "label": _("Fällig"), "fieldtype": "Date", "width": 95},
        {"fieldname": "skonto_bis", "label": _("Skonto bis"), "fieldtype": "Date", "width": 95},
        {"fieldname": "skonto", "label": _("Skonto €"), "fieldtype": "Currency", "width": 100},
        {"fieldname": "brutto", "label": _("Brutto €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "empfohlen", "label": _("Zahlbetrag €"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "grund", "label": _("Grund"), "fieldtype": "Data", "width": 140},
        {"fieldname": "iban", "label": _("IBAN"), "fieldtype": "Data", "width": 200},
        {"fieldname": "bic", "label": _("BIC"), "fieldtype": "Data", "width": 100},
        {"fieldname": "zahlungsreferenz", "label": _("Verwendungszweck"), "fieldtype": "Data", "width": 160},
        {"fieldname": "projekt", "label": _("Projekt"), "fieldtype": "Link", "options": "PH Projekt", "width": 120},
    ]
    summary = [{"value": sum(d["empfohlen"] for d in data), "label": _("Zahllauf gesamt"), "datatype": "Currency"}, {"value": sum(d["skonto"] for d in data if d["grund"].startswith("Skonto")), "label": _("Skonto nutzbar"), "datatype": "Currency", "indicator": "Green"}, {"value": len(data), "label": _("Rechnungen"), "datatype": "Int"}]
    return columns, data, None, None, summary
