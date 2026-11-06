"""Lager & Inventur Ergänzung (04.11.2026): Platzhalter-Abwertungsstaffel/Konten in PH Logistik Einstellungen, Inventur-Art „Stichtag“
für bestehende Inventuren. Idempotent."""

import frappe


def execute():
    from ph_logistik.install import bewertung_standard_setzen

    bewertung_standard_setzen()
    if frappe.db.has_column("PH Inventur", "inventur_art"):
        inv = frappe.qb.DocType("PH Inventur")
        frappe.qb.update(inv).set(inv.inventur_art, "Stichtag").where(inv.inventur_art.isnull() | (inv.inventur_art == "")).run()
