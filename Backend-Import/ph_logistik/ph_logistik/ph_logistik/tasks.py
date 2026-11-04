"""Scheduler-Jobs (hooks.scheduler_events). Idempotent, commit je Einheit, Fehler nur protokollieren."""

import frappe
from frappe.utils import add_days, nowdate


@frappe.whitelist()
def tracking_aktualisieren(sofort=0):
    """Alle 2 h (Scheduler) oder per Listen-Button: Tracking offener LetMeShip-Sendungen abgleichen."""
    from ph_logistik.letmeship.dienst import tracking_abgleich

    if getattr(frappe.local, "request", None):
        frappe.only_for(("PH Logistik Mitarbeiter", "PH Logistik Leitung", "PH Backoffice-Admin", "System Manager"))
    namen = frappe.get_all("PH Sendung", {"status": ("in", ["Etikett", "Unterwegs", "Problem"]), "dienstleister": "LetMeShip", "shipment_id": ("is", "set")}, pluck="name", limit=500)
    n = 0
    for name in namen:
        try:
            tracking_abgleich(frappe.get_doc("PH Sendung", name))
            frappe.db.commit()
            n += 1
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_logistik: Tracking {name}")
    return n


def haengende_sendungen_melden():
    """Täglich 07:00: Sendungen > 7 Tage „Unterwegs“ oder > 2 Tage „Angelegt“ → Problem bzw. Kommentar + PH Aufgabe (wenn ph_crm)."""
    from ph_logistik.ph_logistik.helfer import setze_status

    alt_unterwegs = frappe.get_all("PH Sendung", {"status": "Unterwegs", "unterwegs_seit": ("<", add_days(nowdate(), -7))}, pluck="name")
    for name in alt_unterwegs:
        try:
            s = frappe.get_doc("PH Sendung", name)
            s.append("tracking_verlauf", {"zeit": frappe.utils.now_datetime(), "status": "Problem", "code": "ZEIT", "text": "Länger als 7 Tage unterwegs"})
            s.save(ignore_permissions=True)
            setze_status(s, "Problem")
            _aufgabe(f"Sendung {name} seit > 7 Tagen unterwegs", "PH Sendung", name)
            frappe.db.commit()
        except Exception:  # noqa: BLE001
            frappe.db.rollback()
            frappe.log_error(title=f"ph_logistik: hängende Sendung {name}")
    for name in frappe.get_all("PH Sendung", {"status": "Angelegt", "creation": ("<", add_days(nowdate(), -2))}, pluck="name"):
        _aufgabe(f"Sendung {name} seit 2 Tagen ohne Etikett", "PH Sendung", name)
    frappe.db.commit()


def touren_morgen_pruefen():
    """Täglich 16:00: Touren für morgen ohne Freigabe oder ohne Fahrer → Aufgabe an Leitung."""
    morgen = add_days(nowdate(), 1)
    for t in frappe.get_all("PH Tour", {"datum": morgen, "status": "Geplant"}, ["name", "fahrer"]):
        _aufgabe(f"Tour {t.name} für morgen ist nicht freigegeben" + ("" if t.fahrer else " (kein Fahrer)"), "PH Tour", t.name)
    frappe.db.commit()


def _aufgabe(titel, dt, name):
    try:
        if frappe.db.exists("ToDo", {"reference_type": dt, "reference_name": name, "status": "Open", "description": titel}):
            return
        frappe.get_doc({"doctype": "ToDo", "description": titel, "reference_type": dt, "reference_name": name, "priority": "Medium", "role": "PH Logistik Leitung"}).insert(ignore_permissions=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_logistik: Aufgabe anlegen")
