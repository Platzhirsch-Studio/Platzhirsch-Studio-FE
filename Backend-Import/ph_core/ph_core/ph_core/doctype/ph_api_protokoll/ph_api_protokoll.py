import frappe
from frappe.model.document import Document
from frappe.utils import add_days, now_datetime


class PHAPIProtokoll(Document):
    pass


def aufraeumen():
    """Täglich: Einträge älter als die Aufbewahrungsfrist löschen (Scheduler, hooks.py)."""
    from ph_core.ph_core.doctype.ph_einstellungen.ph_einstellungen import einstellungen

    tage = einstellungen()["api_protokoll_aufbewahrung_tage"]
    grenze = add_days(now_datetime(), -tage)
    frappe.db.delete("PH API Protokoll", {"zeitpunkt": ("<", grenze)})
    frappe.db.commit()
