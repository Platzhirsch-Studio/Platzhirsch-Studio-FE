"""Gecachte PH Microsoft Einstellungen als dict (Cache wird beim Speichern der Einstellungen geleert)."""

import frappe
from frappe.utils import cint

from ph_microsoft.logik.gruppen import zuordnung_normalisieren
from ph_microsoft.logik.zuordnung import domains_liste

CACHE_KEY = "ph_microsoft:einstellungen"


def einstellungen():
    data = frappe.cache().get_value(CACHE_KEY)
    if data:
        return data
    d = frappe.get_cached_doc("PH Microsoft Einstellungen")
    data = {
        "sso_aktiv": cint(d.sso_aktiv),
        "tenant_id": (d.tenant_id or "").strip().lower(),
        "backoffice_client_id": (d.backoffice_client_id or "").strip(),
        "toleranz_sekunden": cint(d.toleranz_sekunden) or 300,
        "sso_rate_limit_pro_minute": cint(d.sso_rate_limit_pro_minute) or 10,
        "auto_benutzer_anlegen": cint(d.auto_benutzer_anlegen),
        "rollen_aus_gruppen": cint(d.rollen_aus_gruppen),
        "gruppen": [{"gruppe_id": z.gruppe_id, "rolle": z.rolle, "standort": z.standort} for z in d.gruppen_rollen or []],
        "webhook_basis_url": (d.webhook_basis_url or "").strip().rstrip("/"),
        "interne_domains": sorted(domains_liste(d.interne_domains or "platzhirsch.studio")),
        "mail_sync_aktiv": cint(d.mail_sync_aktiv),
        "anhaenge_uebernehmen": cint(d.anhaenge_uebernehmen),
        "anhang_max_mb": cint(d.anhang_max_mb) or 10,
        "kundenmails_ueber_exchange": cint(d.kundenmails_ueber_exchange),
        "unzugeordnet_tage": cint(d.unzugeordnet_tage) or 14,
        "kalender_sync_aktiv": cint(d.kalender_sync_aktiv),
        "kalender_termin": cint(d.kalender_termin),
        "kalender_montage": cint(d.kalender_montage),
        "kalender_service": cint(d.kalender_service),
        "teams_fuer_video": cint(d.teams_fuer_video),
        "belegt_als_event": cint(d.belegt_als_event),
        "aufgabe_bei_verschiebung": cint(d.aufgabe_bei_verschiebung),
        "sync_tage_zukunft": cint(d.sync_tage_zukunft) or 90,
        "sync_tage_vergangenheit": cint(d.sync_tage_vergangenheit) or 7,
        "kontakte_sync_aktiv": cint(d.kontakte_sync_aktiv),
        "kontakte_postfach": (d.kontakte_postfach or "").strip().lower(),
        "kontakte_ordner": (d.kontakte_ordner or "Platzhirsch Kunden").strip(),
        "protokoll_aufbewahrung_tage": cint(d.protokoll_aufbewahrung_tage) or 90,
    }
    frappe.cache().set_value(CACHE_KEY, data, expires_in_sec=600)
    return data


def gruppen_zuordnung():
    return zuordnung_normalisieren(einstellungen()["gruppen"])


def cache_leeren():
    frappe.cache().delete_value(CACHE_KEY)


def kalender_doctypes():
    e = einstellungen()
    if not e["kalender_sync_aktiv"]:
        return []
    aus = []
    for dt, an in (("PH Termin", e["kalender_termin"]), ("PH Montageauftrag", e["kalender_montage"]), ("PH Serviceeinsatz", e["kalender_service"])):
        if an and frappe.db.exists("DocType", dt):
            aus.append(dt)
    return aus


def status_setzen(**werte):
    """Statusfelder der Einstellungen ohne Validierung/Versionen setzen (Scheduler)."""
    try:
        for k, v in werte.items():
            frappe.db.set_single_value("PH Microsoft Einstellungen", k, v)
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Microsoft: Status konnte nicht gesetzt werden")
