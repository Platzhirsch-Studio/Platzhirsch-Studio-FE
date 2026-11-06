"""doc_events-Handler (hooks.py). Nie Ausnahmen werfen; Graph-Arbeit immer in die Warteschlange."""

import frappe

from ph_microsoft.ph_microsoft.einstellungen import einstellungen, kalender_doctypes
from ph_microsoft.ph_microsoft.graph_dienst import ist_konfiguriert


def _bereit():
    try:
        return ist_konfiguriert() and frappe.db.exists("DocType", "PH Microsoft Einstellungen")
    except Exception:  # noqa: BLE001
        return False


def kalender_dokument(doc, method=None):
    """PH Termin / PH Montageauftrag / PH Serviceeinsatz on_update → Outlook."""
    try:
        if doc.flags.get("ph_microsoft_sync") or not _bereit() or doc.doctype not in kalender_doctypes():
            return
        frappe.enqueue("ph_microsoft.ph_microsoft.kalender.dokument_abgleichen", queue="short", doctype=doc.doctype, name=doc.name,
                       job_id=f"ph_ms_kal_doc_{doc.doctype}_{doc.name}", deduplicate=True, enqueue_after_commit=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Microsoft: Kalender-Auftrag für {doc.doctype} {doc.name} nicht eingereiht")


def kalender_geloescht(doc, method=None):
    try:
        if not _bereit() or doc.doctype not in kalender_doctypes():
            return
        frappe.enqueue("ph_microsoft.ph_microsoft.kalender.entfernen", queue="short", doctype=doc.doctype, name=doc.name, enqueue_after_commit=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Microsoft: Kalender-Löschung für {doc.doctype} {doc.name} nicht eingereiht")


def kontakt_geaendert(doc, method=None):
    try:
        if not _bereit() or not einstellungen()["kontakte_sync_aktiv"]:
            return
        frappe.enqueue("ph_microsoft.ph_microsoft.kontakte.kontakt_abgleichen", queue="short", name=doc.name,
                       job_id=f"ph_ms_kontakt_{doc.name}", deduplicate=True, enqueue_after_commit=True)
    except Exception:  # noqa: BLE001
        frappe.log_error(title=f"PH Microsoft: Outlook-Kontakt für {doc.name} nicht eingereiht")


def kontakt_geloescht(doc, method=None):
    kontakt_geaendert(doc, method)
