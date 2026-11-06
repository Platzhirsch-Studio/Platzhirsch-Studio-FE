"""Script Report: Live-Nachbestellvorschlag je Meldebestand-Regel (Bestand − Reservierungen − Kommission − Sperrbestand + offene Herstellerbestellungen)."""

import frappe
from frappe import _

from ph_logistik.ph_logistik.nachbestellung import alle_berechnen


def execute(filters=None):
    f = frappe._dict(filters or {})
    data = alle_berechnen(f)
    columns = [
        {"fieldname": "regel", "label": _("Regel"), "fieldtype": "Link", "options": "PH Meldebestand", "width": 110},
        {"fieldname": "produkt", "label": _("Produkt"), "fieldtype": "Link", "options": "PH Produkt", "width": 120},
        {"fieldname": "produkt_name", "label": _("Artikel"), "fieldtype": "Data", "width": 220},
        {"fieldname": "marke", "label": _("Marke"), "fieldtype": "Link", "options": "PH Marke", "width": 110},
        {"fieldname": "lagerort", "label": _("Lagerort"), "fieldtype": "Link", "options": "PH Lagerort", "width": 120},
        {"fieldname": "lieferant", "label": _("Lieferant"), "fieldtype": "Link", "options": "PH Lieferant", "width": 130},
        {"fieldname": "bestand", "label": _("Bestand"), "fieldtype": "Int", "width": 75},
        {"fieldname": "reserviert", "label": _("Reserviert"), "fieldtype": "Int", "width": 80},
        {"fieldname": "kommission", "label": _("Kommission"), "fieldtype": "Int", "width": 85},
        {"fieldname": "gesperrt", "label": _("Gesperrt"), "fieldtype": "Int", "width": 75},
        {"fieldname": "offen_bestellt", "label": _("Offen bestellt"), "fieldtype": "Int", "width": 95},
        {"fieldname": "verfuegbar", "label": _("Verfügbar"), "fieldtype": "Int", "width": 80},
        {"fieldname": "meldebestand", "label": _("Meldebestand"), "fieldtype": "Int", "width": 95},
        {"fieldname": "zielbestand", "label": _("Zielbestand"), "fieldtype": "Int", "width": 85},
        {"fieldname": "vorschlag_menge", "label": _("Vorschlag"), "fieldtype": "Int", "width": 80},
        {"fieldname": "wiederbeschaffung_tage", "label": _("WBZ Tage"), "fieldtype": "Int", "width": 75},
        {"fieldname": "empfehlung_meldebestand", "label": _("Empfehlung MB"), "fieldtype": "Int", "width": 100},
        {"fieldname": "vorschlag", "label": _("Vorschlag (Beleg)"), "fieldtype": "Link", "options": "PH Bestellvorschlag", "width": 130},
    ]
    unter = [d for d in data if d.get("unter_meldebestand")]
    summary = [
        {"value": len(data), "label": _("Regeln"), "datatype": "Int"},
        {"value": len(unter), "label": _("Unter Meldebestand"), "datatype": "Int", "indicator": "Orange" if unter else "Green"},
        {"value": sum(d.get("vorschlag_menge") or 0 for d in unter), "label": _("Vorschlag Stück"), "datatype": "Int"},
    ]
    msg = _("Verfügbar = Bestand − Reservierungen − Kommission − Sperrbestand + offene Herstellerbestellungen. Vorschlag bei verfügbar ≤ Meldebestand.")
    return columns, data, msg, None, summary
