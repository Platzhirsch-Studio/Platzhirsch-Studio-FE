"""Scheduler-Einstiege (hooks.py scheduler_events). Idempotent, Fehler nur per frappe.log_error.

Zeitplan (Europe/Vienna):
  */15 min   newsletter_versand       geplante Ausgaben ab versand_geplant stapelweise senden
  */30 min   doi_erinnerungen          DOI-Erinnerung nach X Stunden (einmalig)
  03:30      doi_aufraeumen            unbestätigte Abos nach 30 Tagen löschen (DSGVO)
  06:00      reisen_planen             fällige Kundenreisen als PH Reise Versand „geplant“
  07:00      empfehlungen_pruefen      Rücktrittsfrist vorbei → Gutschein fällig
  08:00      event_erinnerungen        Erinnerung X Tage vor dem Event; vergangene Events schließen; Löschfrist
  09:00      reisen_senden             Service täglich, Werbung nur Di–Do, nie an Sperrtagen
  03:45      datenschutz_aufraeumen    Löschfristen-Katalog A14 (utils/datenschutz.LOESCHFRISTEN)
  05:00      kampagnen_attribution     Umsatz/ROI/Zielfortschritt je Kampagne aus Kontaktpunkten
  (08:00     event_erinnerungen        zusätzlich: abgelaufene Kontingente → Warteliste nachrücken)
"""

import frappe
from frappe.utils import now_datetime

from ph_marketing.ph_marketing import empfehlung, engine, events, kampagnen, mail_ereignisse, newsletter
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
    _sicher(events.kontingente_freigeben, "Event-Kontingente")


def kampagnen_attribution():
    return _sicher(kampagnen.alle_aktualisieren, "Kampagnen-Attribution")


def datenschutz_aufraeumen():
    """A14: Mail-Ereignisse und Löschfristen-Katalog (utils/datenschutz.LOESCHFRISTEN)."""
    from ph_marketing.ph_marketing import loeschfristen

    _sicher(mail_ereignisse.aufraeumen, "Mail-Ereignisse aufräumen")
    _sicher(loeschfristen.anwenden, "Löschfristen")
    from ph_marketing.ph_marketing import ideenboard

    _sicher(ideenboard.abgelaufene_loeschen, "Ideenboards (expiresAt)")
