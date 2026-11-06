"""PH Projektkalkulation – Soll/Ist je Projekt (EK, VK, Montage, Deckungsbeitrag). Nur Leitung/GF (Report-Rollen).
Logik: ph_projekte.utils.kalkulation, Daten: PH Projekt.kalkulation_daten."""

import frappe
from frappe import _

from ph_projekte.ph_projekte.doctype.ph_projekt.ph_projekt import kalkulation_daten


def execute(filters=None):
    filters = frappe._dict(filters or {})
    if not {"PH Projekte Leitung", "PH Geschäftsführung", "System Manager", "PH Backoffice-Admin"} & set(frappe.get_roles()):
        frappe.throw(_("Die Kalkulation sieht nur die Leitung."), frappe.PermissionError)
    f = {}
    if filters.projekt:
        f["name"] = filters.projekt
    if filters.status:
        f["status"] = filters.status
    else:
        f["status"] = ("not in", ("Abgebrochen",))
    if filters.projektart:
        f["projektart"] = filters.projektart
    columns = [
        {"fieldname": "projekt", "label": _("Projekt"), "fieldtype": "Link", "options": "PH Projekt", "width": 140},
        {"fieldname": "titel", "label": _("Titel"), "fieldtype": "Data", "width": 200},
        {"fieldname": "status", "label": _("Phase"), "fieldtype": "Data", "width": 100},
        {"fieldname": "vk_soll", "label": _("VK Soll"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "vk_ist", "label": _("VK Ist (Rechnungen)"), "fieldtype": "Currency", "width": 120},
        {"fieldname": "ek_soll", "label": _("EK Soll"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "ek_ist", "label": _("EK Ist (Bestellungen/AB)"), "fieldtype": "Currency", "width": 130},
        {"fieldname": "h_soll", "label": _("Montage h Soll"), "fieldtype": "Float", "width": 100},
        {"fieldname": "h_ist", "label": _("Montage h Ist"), "fieldtype": "Float", "width": 100},
        {"fieldname": "db_soll", "label": _("DB Soll"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "db_ist", "label": _("DB Ist"), "fieldtype": "Currency", "width": 110},
        {"fieldname": "marge_soll", "label": _("Marge Soll %"), "fieldtype": "Percent", "width": 90},
        {"fieldname": "marge_ist", "label": _("Marge Ist %"), "fieldtype": "Percent", "width": 90},
    ]
    data = []
    for name in frappe.get_all("PH Projekt", filters=f, pluck="name", order_by="eingang desc", limit=500):
        p = frappe.get_doc("PH Projekt", name)
        k = kalkulation_daten(p)
        s, i = k["soll"], k["ist"]
        data.append({
            "projekt": p.name, "titel": p.titel, "status": _(p.status),
            "vk_soll": s["vk_cent"] / 100, "vk_ist": i["vk_cent"] / 100, "ek_soll": s["ek_cent"] / 100, "ek_ist": i["ek_cent"] / 100,
            "h_soll": s["montage_h"], "h_ist": i["montage_h"], "db_soll": s["db_cent"] / 100, "db_ist": i["db_cent"] / 100,
            "marge_soll": (s["marge_promille"] or 0) / 10, "marge_ist": (i["marge_promille"] or 0) / 10,
        })
    summary = [
        {"label": _("DB Soll gesamt"), "value": sum(d["db_soll"] for d in data), "datatype": "Currency", "indicator": "Blue"},
        {"label": _("DB Ist gesamt"), "value": sum(d["db_ist"] for d in data), "datatype": "Currency", "indicator": "Green"},
    ]
    return columns, data, _("Ist-VK nur aus gestellten Rechnungen (ph_faktura), Anzahlungen nicht doppelt; Montagekosten = Stunden × Kostensatz (PH Projekte Einstellungen)."), None, summary
