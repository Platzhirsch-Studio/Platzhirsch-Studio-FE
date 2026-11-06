"""bench --site <site> run-tests --app ph_kundenkarte --doctype "PH Kundenkarte Vorteil" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_kundenkarte.tests.helfer import einstellungen_fuer_tests


class TestPHKundenkarteVorteil(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()

    def test_anlegen_nummernkreis(self):
        v = frappe.get_doc({"doctype": "PH Kundenkarte Vorteil", "titel": "Testvorteil Abholung", "art": "Service", "einloesbar_pro_jahr": -3, "beschreibung_kunde": "Wir halten Ihre Ware zur Abholung bereit."}).insert()
        self.assertTrue(v.name.startswith("PH-KKV-"))
        self.assertEqual(v.einloesbar_pro_jahr, 0)
        self.assertEqual(v.aktiv, 1)

    def test_kein_geldwert(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kundenkarte Vorteil", "titel": "5 € Guthaben", "art": "Sonstiges"}).insert()
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kundenkarte Vorteil", "titel": "Treuepunkte", "art": "Sonstiges", "beschreibung_kunde": "Sie sammeln Punkte."}).insert()

    def test_titel_pflicht(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kundenkarte Vorteil", "titel": "  ", "art": "Service"}).insert()

    def tearDown(self):
        frappe.db.rollback()
