"""Scheduler (hooks.py scheduler_events, Europe/Vienna). Je Postfach/Kalender ein eigener Auftrag mit job_id
(keine Doppelläufe neben Webhook-Auslösern). Fehler → Error Log + PH Sync Protokoll, nie Ausnahme."""

import frappe
from frappe.utils import add_days, now_datetime

from ph_microsoft.ph_microsoft.einstellungen import einstellungen, status_setzen
from ph_microsoft.ph_microsoft.graph_dienst import ist_konfiguriert
from ph_microsoft.ph_microsoft.protokoll import festschreiben


def _aktiv(schalter):
    try:
        return ist_konfiguriert() and einstellungen()[schalter]
    except Exception:  # noqa: BLE001
        return False


def mail_delta():
    """Alle 5 min: Delta-Rückfall je aktivem Postfach."""
    if not _aktiv("mail_sync_aktiv"):
        return
    for pf in frappe.get_all("PH Postfach", filters={"aktiv": 1}, pluck="name"):
        frappe.enqueue("ph_microsoft.ph_microsoft.mail.abholen", queue="long", postfach_name=pf, job_id=f"ph_ms_mail_{pf}", deduplicate=True)
    status_setzen(letzte_mail_sync=now_datetime())


def kalender_delta():
    """Alle 5 min: Outlook → Backoffice je aktiver Kalender-Zuordnung."""
    if not _aktiv("kalender_sync_aktiv"):
        return
    for z in frappe.get_all("PH Kalender Zuordnung", filters={"aktiv": 1}, pluck="name"):
        frappe.enqueue("ph_microsoft.ph_microsoft.kalender.delta_abgleichen", queue="long", zuordnung_name=z, job_id=f"ph_ms_kal_{z}", deduplicate=True)
    status_setzen(letzte_kalender_sync=now_datetime())


def abos_erneuern():
    """Stündlich: Graph-Subscriptions anlegen/erneuern."""
    if not ist_konfiguriert():
        return
    try:
        from ph_microsoft.ph_microsoft.abos import pruefen

        pruefen()
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Microsoft: Abo-Prüfung fehlgeschlagen")
        status_setzen(letzter_fehler="Abo-Prüfung fehlgeschlagen (Error Log)")


def kalender_fenster_erneuern():
    """Täglich 03:10: Delta-Fenster (calendarView) neu aufsetzen, damit es mitwandert."""
    frappe.db.sql("update `tabPH Kalender Zuordnung` set delta_link=NULL where aktiv=1")
    festschreiben()


def kontakte_vollabgleich():
    if not _aktiv("kontakte_sync_aktiv"):
        return
    frappe.enqueue("ph_microsoft.ph_microsoft.kontakte.vollabgleich", queue="long", job_id="ph_ms_kontakte_voll", deduplicate=True)


def protokoll_bereinigen():
    """Täglich 02:40: PH Sync Protokoll älter als protokoll_aufbewahrung_tage löschen (Standard 90)."""
    try:
        tage = einstellungen()["protokoll_aufbewahrung_tage"]
    except Exception:  # noqa: BLE001
        tage = 90
    grenze = add_days(now_datetime(), -int(tage))
    frappe.db.delete("PH Sync Protokoll", {"zeitpunkt": ("<", grenze)})
    frappe.db.delete("PH Graph Verknuepfung", {"status": "Geloescht", "modified": ("<", grenze)})
    frappe.db.delete("PH Graph Abo", {"status": ("in", ["Geloescht", "Abgelaufen"]), "modified": ("<", grenze)})
    festschreiben()
