"""Script Report PH Projektstatus: alle laufenden Projekte mit Phase, Terminen, offenen Rückmeldungen/Mängeln
und – für Leitung – Auftragswert/bezahlt/offen (aus ph_faktura, sobald installiert; sonst 0)."""

import frappe
from frappe import _

from ph_projekte.utils.portal import PHASEN

LEITUNG = {"PH Projekte Leitung", "PH Geschäftsführung", "System Manager"}


def execute(filters=None):
    filters = frappe._dict(filters or {})
    leitung = bool(LEITUNG & set(frappe.get_roles()))
    bed = {}
    if filters.get("status"):
        bed["status"] = filters.status
    elif not filters.get("mit_abgeschlossenen"):
        bed["status"] = ("not in", ["Abgeschlossen", "Abgebrochen"])
    if filters.get("projektart"):
        bed["projektart"] = filters.projektart
    if filters.get("berater"):
        bed["berater"] = filters.berater

    felder = ["name", "titel", "kunde_name", "projektart", "status", "berater", "eingang", "liefertermin_geplant", "montage_von", "uebergabe_am", "zeit_min_gesamt"]
    if leitung:
        felder += ["auftragswert_cent", "anzahlung_cent", "bezahlt_cent", "offen_cent"]
    rows = frappe.get_all("PH Projekt", filters=bed, fields=felder, order_by="eingang desc")
    namen = [r.name for r in rows]
    feedback = _zaehle("PH Rendering Feedback", {"projekt": ("in", namen), "status": "Offen", "von": "kunde", "art": ("!=", "vote")}, namen)
    maengel_montage = {}
    for m in frappe.get_all("PH Montageauftrag", filters={"projekt": ("in", namen)}, fields=["name", "projekt"]) if namen else []:
        n = frappe.db.count("PH Montage Mangel", {"parent": m.name, "status": ("!=", "behoben")})
        maengel_montage[m.projekt] = maengel_montage.get(m.projekt, 0) + n
    maengel_abnahme = {}
    for a in frappe.get_all("PH Abnahme", filters={"projekt": ("in", namen)}, fields=["projekt", "maengel_offen"]) if namen else []:
        maengel_abnahme[a.projekt] = maengel_abnahme.get(a.projekt, 0) + int(a.maengel_offen or 0)
    aufgaben = _zaehle("PH Projekt Aufgabe", {"projekt": ("in", namen), "status": ("in", ("Offen", "In Arbeit"))}, namen)

    data = []
    for r in rows:
        zeile = {
            "projekt": r.name,
            "titel": r.titel,
            "kunde_name": r.kunde_name,
            "projektart": r.projektart,
            "status": r.status,
            "phase_nr": PHASEN.index(r.status) + 1 if r.status in PHASEN else 0,
            "berater": r.berater,
            "eingang": r.eingang,
            "liefertermin_geplant": r.liefertermin_geplant,
            "montage_von": r.montage_von,
            "uebergabe_am": r.uebergabe_am,
            "feedback_offen": feedback.get(r.name, 0),
            "maengel_offen": maengel_montage.get(r.name, 0) + maengel_abnahme.get(r.name, 0),
            "aufgaben_offen": aufgaben.get(r.name, 0),
            "zeit_h": round((r.zeit_min_gesamt or 0) / 60, 1),
        }
        if leitung:
            zeile.update(auftragswert=(r.auftragswert_cent or 0) / 100, anzahlung=(r.anzahlung_cent or 0) / 100, bezahlt=(r.bezahlt_cent or 0) / 100, offen=(r.offen_cent or 0) / 100)
        data.append(zeile)

    columns = [
        {"fieldname": "projekt", "label": _("Projekt"), "fieldtype": "Link", "options": "PH Projekt", "width": 140},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 200},
        {"fieldname": "kunde_name", "label": _("Kunde"), "fieldtype": "Data", "width": 150},
        {"fieldname": "projektart", "label": _("Art"), "fieldtype": "Data", "width": 90},
        {"fieldname": "status", "label": _("Phase"), "fieldtype": "Data", "width": 100},
        {"fieldname": "berater", "label": _("Berater"), "fieldtype": "Link", "options": "User", "width": 130},
        {"fieldname": "liefertermin_geplant", "label": _("Liefertermin"), "fieldtype": "Date", "width": 100},
        {"fieldname": "montage_von", "label": _("Montage"), "fieldtype": "Date", "width": 100},
        {"fieldname": "feedback_offen", "label": _("Feedback offen"), "fieldtype": "Int", "width": 110},
        {"fieldname": "maengel_offen", "label": _("Mängel offen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "aufgaben_offen", "label": _("Aufgaben offen"), "fieldtype": "Int", "width": 110},
        {"fieldname": "zeit_h", "label": _("Zeit (h)"), "fieldtype": "Float", "width": 80},
    ]
    if leitung:
        columns += [
            {"fieldname": "auftragswert", "label": _("Auftragswert €"), "fieldtype": "Currency", "options": "EUR", "width": 120},
            {"fieldname": "anzahlung", "label": _("Anzahlung €"), "fieldtype": "Currency", "options": "EUR", "width": 110},
            {"fieldname": "bezahlt", "label": _("Bezahlt €"), "fieldtype": "Currency", "options": "EUR", "width": 110},
            {"fieldname": "offen", "label": _("Offen €"), "fieldtype": "Currency", "options": "EUR", "width": 110},
        ]

    je_phase = {}
    for d in data:
        je_phase[d["status"]] = je_phase.get(d["status"], 0) + 1
    labels = [p for p in PHASEN if p in je_phase]
    chart = {"data": {"labels": labels, "datasets": [{"name": _("Projekte"), "values": [je_phase[p] for p in labels]}]}, "type": "bar", "colors": ["#30373e"]}
    summary = [
        {"value": len(data), "label": _("Projekte"), "datatype": "Int"},
        {"value": sum(d["feedback_offen"] for d in data), "label": _("Offene Rückmeldungen"), "datatype": "Int", "indicator": "Orange"},
        {"value": sum(d["maengel_offen"] for d in data), "label": _("Offene Mängel"), "datatype": "Int", "indicator": "Red"},
    ]
    if leitung:
        summary.append({"value": sum(d.get("offen", 0) for d in data), "label": _("Offen € gesamt"), "datatype": "Currency", "currency": "EUR"})
    return columns, data, None, chart, summary


def _zaehle(doctype, filters, namen):
    if not namen:
        return {}
    out = {}
    for r in frappe.get_all(doctype, filters=filters, fields=["projekt", "count(name) as n"], group_by="projekt"):
        out[r.projekt] = int(r.n)
    return out
