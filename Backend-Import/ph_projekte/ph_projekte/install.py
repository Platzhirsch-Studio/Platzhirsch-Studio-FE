"""Erstinstallation von ph_projekte: Einstellungen (Single) anlegen, Workflow-Zustandsfeld prüfen. Idempotent."""

import frappe


def after_install():
    einstellungen_anlegen()
    kalkulation_einrichten()
    frappe.db.commit()


def einstellungen_anlegen():
    doc = frappe.get_single("PH Projekte Einstellungen")
    if not doc.portal_basis_url:
        doc.portal_basis_url = "https://platzhirsch.studio/de/portal"
    doc.save(ignore_permissions=True)


def kalkulation_einrichten():
    """Kostenarten-Katalog und Platzhalter-Kostensätze (0 €/h, markiert) für die Projektnachkalkulation."""
    from ph_projekte.ph_projekte.nachkalkulation import kostenarten_anlegen, platzhalter_anlegen

    kostenarten_anlegen()
    platzhalter_anlegen()
