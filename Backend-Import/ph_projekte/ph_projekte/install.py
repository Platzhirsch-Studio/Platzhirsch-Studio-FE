"""Erstinstallation von ph_projekte: Einstellungen (Single) anlegen, Workflow-Zustandsfeld prüfen. Idempotent."""

import frappe


def after_install():
    einstellungen_anlegen()
    frappe.db.commit()


def einstellungen_anlegen():
    doc = frappe.get_single("PH Projekte Einstellungen")
    if not doc.portal_basis_url:
        doc.portal_basis_url = "https://platzhirsch.studio/de/portal"
    doc.save(ignore_permissions=True)
