"""Erstinstallation von ph_shop: Einstellungen anlegen, Schlüssel-Vorhandensein spiegeln. Idempotent, ohne Geheimnisse."""

import frappe


def after_install():
    shop = frappe.get_single("PH Shop Einstellungen")
    shop.flags.ignore_permissions = True
    shop.save(ignore_permissions=True)
    stripe = frappe.get_single("PH Stripe Einstellungen")
    stripe.flags.ignore_permissions = True
    stripe.flags.ignore_validate = True
    stripe.simulation = 1
    stripe.testmodus = 1
    stripe.save(ignore_permissions=True)
    try:
        from ph_shop.stripe_client import einstellungen_aktualisieren

        einstellungen_aktualisieren()
    except Exception:  # noqa: BLE001
        frappe.log_error(title="ph_shop after_install: Stripe-Einstellungen")
    frappe.db.commit()
