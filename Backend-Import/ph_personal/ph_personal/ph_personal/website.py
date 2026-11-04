"""Website-Cache erneuern (Pfad „karriere“): läuft über den gemeinsamen Helfer ph_core.utils.website.revalidate
(POST <ph_website_revalidate_url>/revalidate/karriere, Header X-Revalidate-Secret, Drossel und enqueue in ph_core).
Der App-Schalter PH Personal Einstellungen.website_revalidate_aktiv bleibt zusätzlich zum Core-Schalter wirksam.
"""

import frappe

PFAD = "karriere"


def revalidate_career(grund="", sofort=False):
    """Erneuert den Website-Cache für /karriere; Rückgabe {"ok": bool, "grund": str}."""
    from ph_personal.ph_personal.doctype.ph_personal_einstellungen.ph_personal_einstellungen import einstellungen

    if not einstellungen()["website_revalidate_aktiv"]:
        return {"ok": False, "grund": "deaktiviert"}
    if frappe.flags.in_test:
        return {"ok": True, "grund": "Test – nicht gesendet"}
    try:
        from ph_core.utils.website import revalidate

        ergebnis = revalidate(PFAD, sofort=sofort, grund=grund or "ph_personal")
        return {"ok": True, "grund": "gesendet" if sofort else "geplant", "ergebnis": ergebnis.get(PFAD) if isinstance(ergebnis, dict) else ergebnis}
    except Exception:  # noqa: BLE001
        frappe.log_error(title="PH Personal: Website-Revalidate fehlgeschlagen")
        return {"ok": False, "grund": "fehler"}
