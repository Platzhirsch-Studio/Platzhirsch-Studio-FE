"""Script Report: Monatsstunden je Mitarbeiter – Soll (Arbeitszeitmodell, ohne Feiertage), Ist (Buchungen),
Gutschrift (bezahlte Abwesenheiten; Zeitausgleich ohne Gutschrift), Saldo Monat und kumuliert (Vortrag aus
PH Zeitabschluss), Überstunden, Abwesenheitstage (Krankenstand nur Leitung/GF), offene Buchungen. Selbstservice sieht
über die User Permission nur den eigenen Datensatz."""

import frappe
from frappe import _
from frappe.utils import getdate, nowdate

from ph_personal.logik import minuten_text


def execute(filters=None):
    filters = frappe._dict(filters or {})
    heute = getdate(nowdate())
    jahr = int(filters.get("jahr") or heute.year)
    monat = int(filters.get("monat") or heute.month)
    from ph_personal.ph_personal.doctype.ph_zeiterfassung.ph_zeiterfassung import monatsuebersicht

    bedingungen = {"status": ("!=", "Ausgetreten")} if not filters.get("mit_ausgetretenen") else {}
    if filters.get("mitarbeiter"):
        bedingungen["name"] = filters["mitarbeiter"]
    mitarbeiter = frappe.get_list("PH Mitarbeiter", filters=bedingungen, fields=["name", "titel", "rolle_intern"], order_by="nachname asc")

    from ph_personal.ph_personal.doctype.ph_abwesenheit.ph_abwesenheit import darf_art_sehen

    voll = darf_art_sehen()  # Krankenstandstage nur für Leitung/GF (Art. 9 DSGVO)
    data = []
    for ma in mitarbeiter:
        m = monatsuebersicht(ma.name, jahr, monat)
        data.append(
            {
                "mitarbeiter": ma.name,
                "name_text": ma.titel,
                "rolle": ma.rolle_intern,
                "wochenstunden": m["wochenstunden"],
                "arbeitstage": m["arbeitstage"],
                "soll_h": round(m["soll_min"] / 60, 2),
                "ist_h": round(m["ist_min"] / 60, 2),
                "gutschrift_h": round(m["gutschrift_min"] / 60, 2),
                "saldo_h": round(m["saldo_min"] / 60, 2),
                "saldo_text": minuten_text(m["saldo_min"]),
                "urlaub": m["urlaub_tage"],
                "krank": m["krank_tage"] if voll else None,
                "sonstige": m["sonstige_tage"] + (0 if voll else m["krank_tage"]),
                "za_h": round(m["za_verbrauch_min"] / 60, 2),
                "saldo_kumuliert_text": m["saldo_kumuliert_text"],
                "ueberstunden_h": round(m["ueberstunden_min"] / 60, 2),
                "gesperrt": 1 if m["gesperrt"] else 0,
                "offen": m["offen"],
                "buchungen": len(m["tage"]),
            }
        )

    columns = [
        {"fieldname": "mitarbeiter", "label": _("Mitarbeiter"), "fieldtype": "Link", "options": "PH Mitarbeiter", "width": 110},
        {"fieldname": "name_text", "label": _("Name"), "fieldtype": "Data", "width": 180},
        {"fieldname": "rolle", "label": _("Rolle"), "fieldtype": "Data", "width": 110},
        {"fieldname": "wochenstunden", "label": _("h/Woche"), "fieldtype": "Float", "width": 80},
        {"fieldname": "arbeitstage", "label": _("Werktage"), "fieldtype": "Float", "width": 90},
        {"fieldname": "soll_h", "label": _("Soll (h)"), "fieldtype": "Float", "width": 90},
        {"fieldname": "ist_h", "label": _("Ist (h)"), "fieldtype": "Float", "width": 90},
        {"fieldname": "gutschrift_h", "label": _("Gutschrift Abw. (h)"), "fieldtype": "Float", "width": 140},
        {"fieldname": "saldo_h", "label": _("Saldo (h)"), "fieldtype": "Float", "width": 90},
        {"fieldname": "saldo_text", "label": _("Saldo"), "fieldtype": "Data", "width": 80},
        {"fieldname": "urlaub", "label": _("Urlaub (Tage)"), "fieldtype": "Float", "width": 110},
        {"fieldname": "krank", "label": _("Krank (Tage)"), "fieldtype": "Float", "width": 100},
        {"fieldname": "sonstige", "label": _("Sonstige (Tage)"), "fieldtype": "Float", "width": 120},
        {"fieldname": "buchungen", "label": _("Buchungen"), "fieldtype": "Int", "width": 90},
        {"fieldname": "offen", "label": _("Offen"), "fieldtype": "Int", "width": 70},
        {"fieldname": "saldo_kumuliert_text", "label": _("Saldo kumuliert"), "fieldtype": "Data", "width": 120},
        {"fieldname": "za_h", "label": _("Zeitausgleich (h)"), "fieldtype": "Float", "width": 110},
        {"fieldname": "ueberstunden_h", "label": _("Überstunden > 40 h (h)"), "fieldtype": "Float", "width": 130},
        {"fieldname": "gesperrt", "label": _("Abgeschlossen"), "fieldtype": "Check", "width": 100},
    ]
    chart = {
        "data": {
            "labels": [d["name_text"] for d in data],
            "datasets": [{"name": _("Soll (h)"), "values": [d["soll_h"] for d in data]}, {"name": _("Ist + Gutschrift (h)"), "values": [round(d["ist_h"] + d["gutschrift_h"], 2) for d in data]}],
        },
        "type": "bar",
        "colors": ["#8a7a66", "#30373e"],
    }
    summary = [
        {"value": round(sum(d["soll_h"] for d in data), 1), "label": _("Soll (h)"), "datatype": "Float"},
        {"value": round(sum(d["ist_h"] for d in data), 1), "label": _("Ist (h)"), "datatype": "Float"},
        {"value": round(sum(d["saldo_h"] for d in data), 1), "label": _("Saldo (h)"), "datatype": "Float", "indicator": "Green" if sum(d["saldo_h"] for d in data) >= 0 else "Red"},
        {"value": sum(d["offen"] for d in data), "label": _("Offene Buchungen"), "datatype": "Int", "indicator": "Orange" if any(d["offen"] for d in data) else "Green"},
    ]
    message = _("Soll nach Arbeitszeitmodell der Person (gültig am jeweiligen Tag), ohne gesetzliche Feiertage und bezahlt freie Betriebsruhe, begrenzt auf Ein-/Austritt. Zeitausgleich erzeugt keine Gutschrift. Stundensaldo ohne Zuschläge.")
    return columns, data, message, chart, summary
