"""Scheduler-Einstiege (hooks.py scheduler_events). Idempotent, Fehler nur per frappe.log_error.

Zeitplan (Europe/Vienna):
  */15 min   newsletter_versand       geplante Ausgaben ab versand_geplant stapelweise senden
  */30 min   doi_erinnerungen          DOI-Erinnerung nach X Stunden (einmalig)
  03:30      doi_aufraeumen            unbestätigte Abos nach 30 Tagen löschen (DSGVO)
  06:00      reisen_planen             fällige Kundenreisen als PH Reise Versand „geplant“
  07:00      empfehlungen_pruefen      Rücktrittsfrist vorbei → Gutschein fällig
  08:00      event_erinnerungen        Erinnerung X Tage vor dem Event; vergangene Events schließen; Löschfrist
  09:00      reisen_senden             Service täglich, Werbung nur Di–Do, nie an Sperrtagen
"""

import frappe
from frappe.utils import now_datetime

from ph_marketing.ph_marketing import empfehlung, engine, events, newsletter
from ph_marketing.ph_marketing.einstellungen import einstellungen


def _sicher(fn, titel):
    try:
        return fn()
    except Exception:  # noqa: BLE001
        frappe.db.rollback()
        frappe.log_error(title=f"PH Marketing Scheduler: {titel}")
        return None


def newsletter_versand():
    def lauf():
        n = 0
        for name in frappe.get_all("PH Newsletter Ausgabe", filters={"status": ("in", ("Geplant", "Wird versendet")), "versand_geplant": ("<=", now_datetime())}, pluck="name", order_by="versand_geplant asc"):
            ausgabe = frappe.get_doc("PH Newsletter Ausgabe", name)
            if ausgabe.status == "Geplant":
                newsletter.versand_vorbereiten(ausgabe)
                frappe.db.commit()
            n += newsletter.versand_stapel(ausgabe, einstellungen()["versand_stapel"])
        return n

    return _sicher(lauf, "Newsletter-Versand")


def doi_erinnerungen():
    return _sicher(newsletter.doi_erinnern, "DOI-Erinnerung")


def doi_aufraeumen():
    return _sicher(newsletter.unbestaetigte_loeschen, "DOI aufräumen")


def reisen_planen():
    if not einstellungen()["automatik_aktiv"]:
        return 0
    return _sicher(engine.planen_fuer, "Reisen planen")


def reisen_senden():
    return _sicher(engine.senden_fuer, "Reisen senden")


def empfehlungen_pruefen():
    return _sicher(empfehlung.empfehlungen_pruefen, "Empfehlungen prüfen")


def event_erinnerungen():
    _sicher(events.erinnerungen_faellig, "Event-Erinnerung")
    _sicher(events.vergangene_schliessen, "Events schließen")
    _sicher(events.anmeldedaten_loeschen, "Event-Löschfrist")
