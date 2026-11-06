"""Site-Test (bench --site <site> run-tests --app ph_core): Standardfirma und Validierung."""

import unittest

try:
    import frappe
    from frappe.tests.utils import FrappeTestCase
except ImportError:  # ohne Bench (python -m unittest discover): überspringen statt scheitern
    raise unittest.SkipTest("Site-Test – nur mit bench run-tests")


class TestPHFirma(FrappeTestCase):
    def test_standardfirma_nach_installation(self):
        self.assertTrue(frappe.db.exists("PH Firma", {"standard": 1}))

    def test_iban_pruefung(self):
        doc = frappe.get_doc({"doctype": "PH Firma", "firmenname": "Testfirma IBAN", "iban": "falsch"})
        with self.assertRaises(frappe.ValidationError):
            doc.insert()

    def test_nur_eine_standardfirma(self):
        alt = frappe.db.get_value("PH Firma", {"standard": 1}, "name")
        neu = frappe.get_doc({"doctype": "PH Firma", "firmenname": "Zweitfirma Test", "standard": 1}).insert()
        self.assertEqual(frappe.db.count("PH Firma", {"standard": 1}), 1)
        neu.standard = 0
        neu.save()
        frappe.db.set_value("PH Firma", alt, "standard", 1)
        frappe.delete_doc("PH Firma", neu.name, force=True)
