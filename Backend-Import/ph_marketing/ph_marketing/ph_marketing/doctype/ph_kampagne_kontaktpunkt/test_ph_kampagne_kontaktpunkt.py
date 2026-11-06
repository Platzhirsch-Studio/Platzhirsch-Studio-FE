import frappe
from frappe.tests.utils import FrappeTestCase

from ph_marketing.ph_marketing import kampagnen


class TestPHKampagneKontaktpunkt(FrappeTestCase):
    def test_kontaktpunkt_idempotent_und_ohne_utm_leer(self):
        k = frappe.get_doc({"doctype": "PH Kampagne", "titel": "Test UTM", "kanal": "Meta", "status": "Aktiv", "utm_campaign": "test-utm-kp"}).insert(ignore_permissions=True)
        n1, kam = kampagnen.kontaktpunkt({"utm_campaign": "Test-UTM-KP", "utm_source": "meta"}, "Anfrage", email="kp@example.invalid", referenz=("PH Kampagne", k.name))
        n2, _ = kampagnen.kontaktpunkt({"utm_campaign": "test-utm-kp"}, "Anfrage", email="kp@example.invalid", referenz=("PH Kampagne", k.name))
        self.assertEqual(kam, k.name)
        self.assertEqual(n1, n2)
        self.assertEqual(kampagnen.kontaktpunkt({}, "Anfrage"), (None, None))
