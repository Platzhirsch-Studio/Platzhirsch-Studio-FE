"""Karten ohne Einkauf seit N Monaten (Standard 12) – nur Karten mit Einwilligung zur Auswertung sind beurteilbar;
Karten ohne Einwilligung werden gesondert ausgewiesen (kein Rückschluss auf Einkäufe). Für persönliche Ansprache
durch den Berater – keine automatische Werbung (Einwilligung „einladungen“/Newsletter in ph_marketing getrennt)."""

import frappe
from frappe import _
from frappe.utils import add_months, cint, getdate, nowdate


def execute(filters=None):
    filters = frappe._dict(filters or {})
    monate = cint(filters.get("monate")) or 12
    grenze = getdate(add_months(nowdate(), -monate))
    bedingungen = {"status": "Aktiv"}
    if filters.get("berater"):
        bedingungen["persoenlicher_berater"] = filters.get("berater")
    if filters.get("stufe"):
        bedingungen["stufe"] = filters.get("stufe")
    karten = frappe.get_all(
        "PH Kundenkarte",
        filters=bedingungen,
        fields=["name", "kontakt", "kunde_name", "stufe", "letzter_einkauf", "ausgestellt_am", "einwilligung_auswertung", "persoenlicher_berater", "gesamtumsatz_cent"],
        order_by="letzter_einkauf asc",
    )
    data = []
    ohne_einwilligung = 0
    for k in karten:
        if not cint(k.einwilligung_auswertung):
            ohne_einwilligung += 1
            if not filters.get("mit_ohne_einwilligung"):
                continue
            data.append({"karte": k.name, "kunde_name": k.kunde_name, "kontakt": k.kontakt, "stufe": k.stufe, "letzter_einkauf": None, "tage": None, "ausgestellt_am": k.ausgestellt_am, "berater": k.persoenlicher_berater, "hinweis": _("keine Einwilligung zur Auswertung")})
            continue
        letzter = getdate(k.letzter_einkauf) if k.letzter_einkauf else None
        if letzter and letzter >= grenze:
            continue
        if not letzter and getdate(k.ausgestellt_am or nowdate()) >= grenze:
            continue  # junge Karte ohne Einkauf: noch kein Befund
        tage = (getdate(nowdate()) - (letzter or getdate(k.ausgestellt_am or nowdate()))).days
        data.append({"karte": k.name, "kunde_name": k.kunde_name, "kontakt": k.kontakt, "stufe": k.stufe, "letzter_einkauf": letzter, "tage": tage, "ausgestellt_am": k.ausgestellt_am, "berater": k.persoenlicher_berater, "hinweis": _("nie eingekauft") if not letzter else ""})
    columns = [
        {"fieldname": "karte", "label": _("Karte"), "fieldtype": "Link", "options": "PH Kundenkarte", "width": 110},
        {"fieldname": "kunde_name", "label": _("Kunde"), "fieldtype": "Data", "width": 170},
        {"fieldname": "kontakt", "label": _("Kontakt"), "fieldtype": "Link", "options": "PH Kontakt", "width": 120},
        {"fieldname": "stufe", "label": _("Stufe"), "fieldtype": "Link", "options": "PH Kundenkarte Stufe", "width": 130},
        {"fieldname": "letzter_einkauf", "label": _("Letzter Einkauf"), "fieldtype": "Date", "width": 105},
        {"fieldname": "tage", "label": _("Tage ohne Einkauf"), "fieldtype": "Int", "width": 120},
        {"fieldname": "ausgestellt_am", "label": _("Ausgestellt"), "fieldtype": "Date", "width": 95},
        {"fieldname": "berater", "label": _("Berater"), "fieldtype": "Link", "options": "User", "width": 140},
        {"fieldname": "hinweis", "label": _("Hinweis"), "fieldtype": "Data", "width": 200},
    ]
    summary = [
        {"value": len([d for d in data if d["tage"] is not None]), "label": _("Karten ohne Einkauf ({0} Monate)").format(monate), "datatype": "Int", "indicator": "Orange"},
        {"value": ohne_einwilligung, "label": _("ohne Einwilligung (nicht beurteilbar)"), "datatype": "Int", "indicator": "Gray"},
    ]
    return columns, data, None, None, summary
