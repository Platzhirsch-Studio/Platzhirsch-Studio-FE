"""PH Stripe Einstellungen – nur Schlüssel-NAMEN, Schalter, Webhook-Pfad. Werte stehen in site_config.json."""

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import cint


class PHStripeEinstellungen(Document):
    def validate(self):
        if cint(self.webhook_toleranz_s) < 30 or cint(self.webhook_toleranz_s) > 900:
            frappe.throw(_("Signatur-Toleranz zwischen 30 und 900 Sekunden."))
        if not self.simulation and not frappe.conf.get("ph_stripe_secret_key"):
            frappe.throw(_("Simulation kann erst ausgeschaltet werden, wenn ph_stripe_secret_key in site_config.json steht."))
        if not self.testmodus and frappe.conf.get("ph_stripe_secret_key", "").startswith(("sk_test_", "rk_test_")):
            frappe.throw(_("Testmodus aus, aber der hinterlegte Schlüssel ist ein Testschlüssel."))
        self.webhook_pfad = "/api/method/ph_shop.api.stripe.webhook"
        self.schluessel_vorhanden = 1 if frappe.conf.get("ph_stripe_secret_key") else 0
        self.webhook_secret_vorhanden = 1 if frappe.conf.get("ph_stripe_webhook_secret") else 0
        self.livemode_konfiguriert = 1 if frappe.conf.get("ph_stripe_livemode") else 0

    def on_update(self):
        frappe.cache().delete_value("ph_shop:stripe_einstellungen")
        frappe.clear_cache(doctype="PH Stripe Einstellungen")

    @frappe.whitelist()
    def pruefen(self):
        """Button: Vorhandensein der Schlüssel prüfen (nie Werte anzeigen)."""
        from ph_shop.stripe_client import einstellungen_aktualisieren

        self.check_permission("write")
        einstellungen_aktualisieren()
        return {"secret_key": bool(frappe.conf.get("ph_stripe_secret_key")), "webhook_secret": bool(frappe.conf.get("ph_stripe_webhook_secret")), "livemode": bool(frappe.conf.get("ph_stripe_livemode")), "paket": _paket_vorhanden()}


def _paket_vorhanden():
    try:
        import stripe  # noqa: F401

        return True
    except ImportError:
        return False
