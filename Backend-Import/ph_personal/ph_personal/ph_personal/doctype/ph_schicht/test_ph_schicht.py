"""bench --site <site> run-tests --app ph_personal --doctype "PH Schicht" """

import frappe
from frappe.tests.utils import FrappeTestCase


def schicht(kurz="TFR", beginn="09:00:00", ende="17:00:00", pause=30):
    if frappe.db.exists("PH Schicht", kurz):
        return frappe.get_doc("PH Schicht", kurz)
    return frappe.get_doc({"doctype": "PH Schicht", "kurzname": kurz, "bezeichnung": f"Test {kurz}", "beginn": beginn, "ende": ende, "pause_min": pause}).insert()


class TestPHSchicht(FrappeTestCase):
    def test_netto_und_regel(self):
        s = schicht()
        self.assertEqual(s.netto_min, 450)
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Schicht", "kurzname": "TX", "bezeichnung": "x", "beginn": "18:00:00", "ende": "09:00:00"}).insert()
