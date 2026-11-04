"""doc_events-Handler (hooks.py). Nebenwirkungen ohne Fehler nach außen."""

import frappe


def stelle_geaendert(doc, method=None):
    """API-Cache von karriere_data leeren, sobald sich eine Stelle ändert (Website-Revalidate macht der Controller)."""
    try:
        from ph_personal.api import karriere_cache_leeren

        karriere_cache_leeren()
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Personal: API-Cache konnte nicht geleert werden")
