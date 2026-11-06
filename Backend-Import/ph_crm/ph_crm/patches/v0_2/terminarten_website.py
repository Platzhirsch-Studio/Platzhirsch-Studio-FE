"""Patch (post_model_sync): Terminarten mit Website-Keys studio, video, vor_ort, planung sicherstellen
(src/lib/booking/types.js; ohne sie antwortet get_freie_slots 404) und leere Texte aus copy.js nachtragen.
Bestehende Werte bleiben unverändert (60-website-backend-umstellung.md, Lücke ph_crm 1)."""

import frappe


def execute():
    if not frappe.db.exists("DocType", "PH Terminart"):
        return
    from ph_crm.install import terminarten_anlegen

    terminarten_anlegen()
