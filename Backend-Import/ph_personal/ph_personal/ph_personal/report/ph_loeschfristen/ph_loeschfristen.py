"""Script Report (DSGVO): Bewerbungen mit Löschfrist – fällig, demnächst fällig, mit Evidenz-Einwilligung,
bereits pseudonymisiert. Grundlage für den Löschnachweis (Art 5 Abs 2 DSGVO)."""

import frappe
from frappe import _
from frappe.utils import add_days, date_diff, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    heute = getdate(nowdate())
    horizont = add_days(heute, int(filters.get("tage") or 30))
    ansicht = filters.get("ansicht") or "Offen"

    bedingungen = {}
    if ansicht == "Offen":
        bedingungen = {"loeschfrist": ("<=", horizont), "pseudonymisiert": 0}
    elif ansicht == "Gelöscht":
        bedingungen = {"pseudonymisiert": 1}
    elif ansicht == "Evidenz":
        bedingungen = {"einwilligung_evidenz": 1, "pseudonymisiert": 0}
    else:
        bedingungen = {"loeschfrist": ("is", "set")}

    rows = frappe.get_all(
        "PH Bewerbung",
        filters=bedingungen,
        fields=["name", "titel", "stelle_titel", "status", "entschieden_am", "loeschfrist", "einwilligung_evidenz", "einwilligung_evidenz_bis", "unterlagen_geloescht_am", "pseudonymisiert"],
        order_by="loeschfrist asc",
    )
    data = []
    for r in rows:
        anzahl = frappe.db.count("PH Bewerbung Unterlage", {"parent": r.name}) if not r.pseudonymisiert else 0
        rest = date_diff(r.loeschfrist, heute) if r.loeschfrist else None
        if r.pseudonymisiert:
            zustand = _("Gelöscht")
        elif r.einwilligung_evidenz:
            zustand = _("Evidenz bis {0}").format(frappe.format(r.einwilligung_evidenz_bis, {"fieldtype": "Date"}))
        elif rest is not None and rest <= 0:
            zustand = _("Fällig")
        elif rest is not None and rest <= 14:
            zustand = _("Fällig in {0} Tagen").format(rest)
        else:
            zustand = _("Läuft")
        data.append(
            {
                "bewerbung": r.name,
                "titel": r.titel,
                "stelle": r.stelle_titel or _("Initiativ"),
                "status": r.status,
                "entschieden_am": r.entschieden_am,
                "loeschfrist": r.loeschfrist,
                "rest_tage": rest,
                "unterlagen": anzahl,
                "zustand": zustand,
                "geloescht_am": r.unterlagen_geloescht_am,
            }
        )

    columns = [
        {"fieldname": "bewerbung", "label": _("Bewerbung"), "fieldtype": "Link", "options": "PH Bewerbung", "width": 160},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 240},
        {"fieldname": "stelle", "label": _("Stelle"), "fieldtype": "Data", "width": 200},
        {"fieldname": "status", "label": _("Status"), "fieldtype": "Data", "width": 110},
        {"fieldname": "entschieden_am", "label": _("Entschieden"), "fieldtype": "Datetime", "width": 150},
        {"fieldname": "loeschfrist", "label": _("Löschfrist"), "fieldtype": "Date", "width": 110},
        {"fieldname": "rest_tage", "label": _("Rest (Tage)"), "fieldtype": "Int", "width": 100},
        {"fieldname": "unterlagen", "label": _("Unterlagen"), "fieldtype": "Int", "width": 100},
        {"fieldname": "zustand", "label": _("Zustand"), "fieldtype": "Data", "width": 160},
        {"fieldname": "geloescht_am", "label": _("Gelöscht am"), "fieldtype": "Datetime", "width": 150},
    ]
    faellig = sum(1 for d in data if d["zustand"] == _("Fällig"))
    summary = [
        {"value": len(data), "label": _("Datensätze"), "datatype": "Int"},
        {"value": faellig, "label": _("Löschung fällig"), "datatype": "Int", "indicator": "Red" if faellig else "Green"},
        {"value": sum(d["unterlagen"] for d in data), "label": _("Unterlagen gesamt"), "datatype": "Int"},
    ]
    message = _("Der tägliche Job (03:15) löscht fällige Unterlagen automatisch und pseudonymisiert die Person. Längere Aufbewahrung nur mit dokumentierter Einwilligung zur Evidenzhaltung.")
    return columns, data, message, None, summary
