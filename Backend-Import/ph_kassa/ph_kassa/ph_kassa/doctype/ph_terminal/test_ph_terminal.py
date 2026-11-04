"""Site-Tests: bench --site <site> run-tests --app ph_kassa --doctype "PH Terminal" (Mock, keine Stripe-Aufrufe)."""

import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHTerminal(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        if frappe.db.exists("PH Terminal", "tmr_mock_1"):
            frappe.delete_doc("PH Terminal", "tmr_mock_1", force=True)

    def test_anlegen_und_status_mock(self):
        t = frappe.get_doc({"doctype": "PH Terminal", "reader_id": "tmr_mock_1", "bezeichnung": "Theke", "testmodus": 1}).insert()
        self.assertEqual(t.titel, "Theke (tmr_mock_1)")
        self.assertEqual(t.status_abfragen(), "Online")

    def test_reader_id_format(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Terminal", "reader_id": "falsch", "bezeichnung": "x"}).insert()

    def test_mock_nur_testmodus(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Terminal", "reader_id": "tmr_mock_2", "bezeichnung": "x", "testmodus": 0}).insert()
