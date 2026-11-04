"""bench --site <site> run-tests --app ph_sortiment --doctype "PH Marke" """

import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHMarke(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        for n in ("Claimtest Marke", "Lyngby Porcelæn Test"):
            if frappe.db.exists("PH Marke", n):
                frappe.delete_doc("PH Marke", n, force=True)

    def test_slug_und_status(self):
        m = frappe.get_doc({"doctype": "PH Marke", "marke": "Lyngby Porcelæn Test", "welt": "Accessoires"}).insert()
        self.assertEqual(m.slug, "lyngby-porcelaen-test")
        self.assertEqual(m.haendlerstatus, "Keiner")
        self.assertEqual(m.es_gibt_produkte, 0)

    def test_haendlerstatus_braucht_beleg(self):
        m = frappe.get_doc({"doctype": "PH Marke", "marke": "Claimtest Marke", "haendlerstatus": "Vertragshaendler"})
        with self.assertRaises(frappe.ValidationError):
            m.insert()
        m.haendler_beleg_url = "https://www.example.com/haendler"
        m.insert()
        self.assertEqual(m.haendlerstatus, "Vertragshaendler")

    def test_claim_guard_ohne_status(self):
        m = frappe.get_doc({"doctype": "PH Marke", "marke": "Claimtest Marke", "kurz_de": "Wir sind autorisierter Händler."})
        with self.assertRaises(frappe.ValidationError):
            m.insert()
        m2 = frappe.get_doc({"doctype": "PH Marke", "marke": "Claimtest Marke", "claims_erlaubt": [{"claim_text": "Platzhirsch ist Händler von X.", "quelle": "Akte"}]})
        with self.assertRaises(frappe.ValidationError):
            m2.insert()

    def test_claim_mit_status_und_beleg(self):
        m = frappe.get_doc({"doctype": "PH Marke", "marke": "Claimtest Marke", "haendlerstatus": "Haendler", "haendler_notiz": "Inhaber-Entscheidung Nr. 19", "kurz_de": "Händler seit 2020.",
                            "claims_erlaubt": [{"claim_text": "Platzhirsch Home Living ist Händler von Claimtest.", "quelle": "Liefervereinbarung, Firmenakten", "freigegeben_am": "2026-10-31"}]}).insert()
        self.assertEqual(len(m.claims_erlaubt), 1)
        self.assertEqual(m.lieferant_anlegen(), "Claimtest Marke")
        self.assertTrue(frappe.db.exists("PH Lieferant", "Claimtest Marke"))
