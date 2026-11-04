import frappe
from frappe.tests.utils import FrappeTestCase

from ph_crm.ph_crm.doctype.ph_verfuegbarkeit.ph_verfuegbarkeit import fenster


class TestPHVerfuegbarkeit(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Verfuegbarkeit", {"user": "Administrator"})

    def test_titel_und_fenster(self):
        doc = frappe.get_doc({"doctype": "PH Verfuegbarkeit", "user": "Administrator", "wochentag": "1 Dienstag", "von": "10:00:00", "bis": "18:00:00"}).insert()
        self.assertIn("Dienstag 10:00–18:00", doc.titel)
        from datetime import date

        dienstag = date(2026, 11, 10)
        self.assertEqual(len(fenster("Administrator", dienstag)), 1)
        self.assertEqual(len(fenster("Administrator", date(2026, 11, 11))), 0)

    def test_von_vor_bis(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Verfuegbarkeit", "user": "Administrator", "wochentag": "1 Dienstag", "von": "18:00:00", "bis": "10:00:00"}).insert()

    def test_ueberschneidung(self):
        frappe.get_doc({"doctype": "PH Verfuegbarkeit", "user": "Administrator", "wochentag": "2 Mittwoch", "von": "10:00:00", "bis": "14:00:00"}).insert()
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Verfuegbarkeit", "user": "Administrator", "wochentag": "2 Mittwoch", "von": "13:00:00", "bis": "18:00:00"}).insert()
