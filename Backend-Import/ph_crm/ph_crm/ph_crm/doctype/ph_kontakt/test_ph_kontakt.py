"""bench --site <site> run-tests --app ph_crm --doctype "PH Kontakt" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_crm.ph_crm.doctype.ph_kontakt.ph_kontakt import plz_ort_teilen, token_hash


class TestPHKontakt(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Kontakt", {"email": ("like", "%@kontakt-test.example")})

    def test_titel_status_und_serie(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Anna", "nachname": "Muster", "email": "anna@kontakt-test.example"}).insert()
        self.assertEqual(doc.status, "Interessent")
        self.assertEqual(doc.titel, "Anna Muster")
        self.assertTrue(doc.name.startswith("PH-KON-"))

    def test_firmentitel(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "kontaktart": "Architekt", "nachname": "Plan", "firma": "Büro Plan ZT", "email": "plan@kontakt-test.example"}).insert()
        self.assertEqual(doc.titel, "Büro Plan ZT – Plan")

    def test_email_eindeutig(self):
        frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Eins", "email": "doppelt@kontakt-test.example"}).insert()
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Zwei", "email": "Doppelt@kontakt-test.example"}).insert()

    def test_geburtstag_nur_mit_einwilligung(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Geb", "email": "geb@kontakt-test.example", "geburtstag": "1980-01-01"}).insert()
        self.assertIsNone(doc.geburtstag)

    def test_portal_zugang(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Portal", "email": "portal@kontakt-test.example"}).insert()
        r = doc.portal_zugang_erzeugen()
        doc.reload()
        self.assertEqual(doc.portal_aktiv, 1)
        self.assertEqual(doc.portal_token_hash, token_hash(r["token"]))
        doc.portal_sperren()
        doc.reload()
        self.assertEqual(doc.portal_aktiv, 0)
        self.assertFalse(doc.portal_token_hash)

    def test_kunde_markieren_und_datenauskunft(self):
        doc = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Kunde", "email": "kunde@kontakt-test.example"}).insert()
        doc.als_kunde_markieren("Test-AB")
        doc.reload()
        self.assertEqual(doc.status, "Kunde")
        self.assertTrue(doc.kunde_seit)
        frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "nachname": "Kunde", "email": "kunde@kontakt-test.example", "anliegen": "x", "kontakt": doc.name}).insert()
        auskunft = doc.datenauskunft()
        self.assertIn("E-Mail", auskunft["stamm"])
        self.assertTrue(any(v["doctype"] == "PH Anfrage" and v["anzahl"] >= 1 for v in auskunft["vorgaenge"]))

    def test_plz_ort_teilen(self):
        self.assertEqual(plz_ort_teilen("6911 Lochau"), ("6911", "Lochau"))
        self.assertEqual(plz_ort_teilen("A-6900 Bregenz"), ("6900", "Bregenz"))
        self.assertEqual(plz_ort_teilen("Lindau"), ("", "Lindau"))
