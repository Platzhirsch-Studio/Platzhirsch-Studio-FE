"""Patch (post_model_sync): Standarddaten auch bei bestehenden Installationen nachziehen
(Terminarten, Öffnungszeiten, Feiertage, Vorlagen) – ruft dieselbe idempotente Logik wie install.py."""

import frappe


def execute():
    from ph_crm.install import einstellungen_anlegen, terminarten_anlegen

    if not frappe.db.exists("DocType", "PH Terminart"):
        return
    terminarten_anlegen()
    einstellungen_anlegen()
