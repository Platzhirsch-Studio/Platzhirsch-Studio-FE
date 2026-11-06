"""bench --site <site> run-tests --app ph_personal --doctype "PH Onboarding Vorlage" """

import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHOnboardingVorlage(FrappeTestCase):
    def test_braucht_aufgabe(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Onboarding Vorlage", "titel": "Leer-Test", "art": "Onboarding"}).insert()
        v = frappe.get_doc({"doctype": "PH Onboarding Vorlage", "titel": "Test Onboarding", "art": "Onboarding", "aufgaben": [{"aufgabe": "ÖGK-Anmeldung", "tage_relativ": -1, "pflicht": 1, "nachweis_feld": "oegk_anmeldung_am"}]}).insert()
        self.assertEqual(v.name, "Test Onboarding")
