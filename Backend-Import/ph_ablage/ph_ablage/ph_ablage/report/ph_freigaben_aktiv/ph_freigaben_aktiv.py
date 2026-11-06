"""PH Freigaben aktiv: aktive Freigabelinks (Ablauf, Downloads, Passwort, Ersteller) und Portal-Freigaben."""

import frappe
from frappe import _
from frappe.utils import cint, now_datetime


def execute(filters=None):
    filters = frappe._dict(filters or {})
    data = []
    if filters.get("art") in (None, "", "Alle", "Freigabelink"):
        links = frappe.get_all("PH Datei Freigabelink", filters={"status": "Aktiv", "ablauf": (">", now_datetime())}, fields=["name", "datei", "ablauf", "download_zaehler", "max_downloads", "passwort_gesetzt", "erstellt_von", "empfaenger_hinweis", "creation"], order_by="ablauf asc")
        namen = {d.name: d for d in frappe.get_all("PH Datei", filters={"name": ("in", [l.datei for l in links] or ["-"])}, fields=["name", "dateiname", "bezug_titel"])}
        for l in links:
            d = namen.get(l.datei) or frappe._dict()
            data.append({"art": _("Freigabelink"), "datei": l.datei, "dateiname": d.dateiname, "bezug": d.bezug_titel, "bis": l.ablauf, "downloads": cint(l.download_zaehler), "max_downloads": cint(l.max_downloads) or None, "passwort": cint(l.passwort_gesetzt), "fuer": l.empfaenger_hinweis, "von": l.erstellt_von, "referenz": l.name})
    if filters.get("art") in (None, "", "Alle", "Portal"):
        for d in frappe.get_all("PH Datei", filters={"portal_freigabe": 1, "status": "Aktiv"}, fields=["name", "dateiname", "bezug_titel", "portal_ablauf", "portal_dokument", "modified_by"]):
            data.append({"art": _("Kundenportal"), "datei": d.name, "dateiname": d.dateiname, "bezug": d.bezug_titel, "bis": d.portal_ablauf, "downloads": None, "max_downloads": None, "passwort": 0, "fuer": _("Kunde (Portal)"), "von": d.modified_by, "referenz": d.portal_dokument})
    columns = [
        {"fieldname": "art", "label": _("Art"), "fieldtype": "Data", "width": 120},
        {"fieldname": "datei", "label": _("Datei"), "fieldtype": "Link", "options": "PH Datei", "width": 170},
        {"fieldname": "dateiname", "label": _("Dateiname"), "fieldtype": "Data", "width": 220},
        {"fieldname": "bezug", "label": _("Bezug"), "fieldtype": "Data", "width": 200},
        {"fieldname": "bis", "label": _("Gültig bis"), "fieldtype": "Datetime", "width": 160},
        {"fieldname": "downloads", "label": _("Downloads"), "fieldtype": "Int", "width": 90},
        {"fieldname": "max_downloads", "label": _("Max."), "fieldtype": "Int", "width": 70},
        {"fieldname": "passwort", "label": _("Passwort"), "fieldtype": "Check", "width": 80},
        {"fieldname": "fuer", "label": _("Für"), "fieldtype": "Data", "width": 180},
        {"fieldname": "von", "label": _("Erstellt/geändert von"), "fieldtype": "Link", "options": "User", "width": 170},
        {"fieldname": "referenz", "label": _("Referenz"), "fieldtype": "Data", "width": 150},
    ]
    summary = [{"label": _("Aktive Links"), "value": sum(1 for r in data if r["art"] == _("Freigabelink")), "datatype": "Int"}, {"label": _("Im Portal"), "value": sum(1 for r in data if r["art"] == _("Kundenportal")), "datatype": "Int"}]
    return columns, data, None, None, summary
