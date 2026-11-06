"""after_install/after_migrate: Standardwerte der Einstellungen (idempotent, ohne Geheimnisse)."""

import frappe

STANDARD = {
    "toleranz_sekunden": 300,
    "sso_rate_limit_pro_minute": 10,
    "interne_domains": "platzhirsch.studio",
    "anhang_max_mb": 10,
    "unzugeordnet_tage": 14,
    "kalender_termin": 1,
    "kalender_montage": 1,
    "kalender_service": 1,
    "teams_fuer_video": 1,
    "belegt_als_event": 1,
    "aufgabe_bei_verschiebung": 1,
    "sync_tage_zukunft": 90,
    "sync_tage_vergangenheit": 7,
    "kontakte_ordner": "Platzhirsch Kunden",
    "protokoll_aufbewahrung_tage": 90,
}


SCHALTER = {"kalender_termin", "kalender_montage", "kalender_service", "teams_fuer_video", "belegt_als_event", "aufgabe_bei_verschiebung"}


def after_install():
    _standard(mit_schaltern=True)


def after_migrate():
    """Nur leere Zahl-/Textfelder füllen – Schalter, die der Admin ausgeschaltet hat, bleiben aus."""
    _standard(mit_schaltern=False)


def _standard(mit_schaltern):
    if not frappe.db.exists("DocType", "PH Microsoft Einstellungen"):
        return
    for feld, wert in STANDARD.items():
        if feld in SCHALTER and not mit_schaltern:
            continue
        if frappe.db.get_single_value("PH Microsoft Einstellungen", feld) in (None, "", 0):
            frappe.db.set_single_value("PH Microsoft Einstellungen", feld, wert)
    frappe.cache().delete_value("ph_microsoft:einstellungen")
    frappe.db.commit()
