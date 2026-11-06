"""bench --site <site> run-tests --app ph_microsoft --doctype "PH Mail Adresse" """

import unittest

import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHMailAdresse(FrappeTestCase):
    def tearDown(self):
        frappe.db.rollback()

    def test_sperre_normalisiert_und_ohne_kontakt(self):
        d = frappe.get_doc({"doctype": "PH Mail Adresse", "adresse": "Werbung <WERBUNG@Beispiel.invalid>", "art": "Sperre", "kontakt_doctype": "PH Kontakt", "kontakt_name": "x"}).insert()
        self.assertEqual((d.adresse, d.kontakt_doctype), ("werbung@beispiel.invalid", None))
        self.assertRaises(frappe.ValidationError, frappe.get_doc({"doctype": "PH Mail Adresse", "adresse": "werbung@beispiel.invalid", "art": "Sperre"}).insert)

    def test_zuordnung_braucht_kontakt(self):
        self.assertRaises(frappe.ValidationError, frappe.get_doc({"doctype": "PH Mail Adresse", "adresse": "a@beispiel.invalid", "art": "Zuordnung", "kontakt_doctype": "User", "kontakt_name": "Administrator"}).insert)
        self.assertRaises(frappe.ValidationError, frappe.get_doc({"doctype": "PH Mail Adresse", "adresse": "ungueltig", "art": "Sperre"}).insert)

    @unittest.skipUnless(frappe.db.exists("DocType", "PH Kontakt"), "ph_crm nicht installiert")
    def test_zuordnung_zu_kontakt(self):
        k = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "MS-Test"}).insert()
        d = frappe.get_doc({"doctype": "PH Mail Adresse", "adresse": "zweit@beispiel.invalid", "art": "Zuordnung", "kontakt_doctype": "PH Kontakt", "kontakt_name": k.name}).insert()
        self.assertTrue(d.name)
