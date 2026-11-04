"""bench --site <site> run-tests --app ph_crm --doctype "PH Anfrage" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_crm.api import create_anfrage


class TestPHAnfrage(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")

    def test_titel_und_status(self):
        doc = frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "vorname": "Anna", "nachname": "Muster", "email": "anna@example.com", "anliegen": "Testanfrage"}).insert()
        self.assertEqual(doc.status, "Neu")
        self.assertEqual(doc.titel, "Kontakt: Anna Muster")
        self.assertTrue(doc.name.startswith("PH-ANF-"))

    def test_kontaktmoeglichkeit_pflicht(self):
        doc = frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "nachname": "Ohne", "anliegen": "x"})
        with self.assertRaises(frappe.ValidationError):
            doc.insert()

    def test_api_beratung_idempotent(self):
        daten = {
            "bei_meiner_anfrage_geht_es_um": "eine Renovierung",
            "das_projekt_soll_verwirklicht_werden": "in einer Wohnung",
            "bitte_beschreiben_sie_ihr_vorhaben": "Küche und Bad neu.\n\n── Herkunft (automatisch) ──\nKanal: Organisch\nReferenz: test-ref-1",
            "vorname": "Bea",
            "nachname": "Test",
            "email": "bea@example.com",
            "idempotency_key": "test-idem-1",
        }
        a = create_anfrage(**daten)
        b = create_anfrage(**daten)
        self.assertEqual(a["referenz"], b["referenz"])
        doc = frappe.get_doc("PH Anfrage", a["referenz"])
        self.assertEqual(doc.art, "Beratung")
        self.assertEqual(doc.kanal, "Organisch")
        self.assertEqual(doc.referenz_website, "test-ref-1")
        self.assertEqual(doc.projektart, "eine Renovierung")

    def test_api_kontakt_form_kompatibel(self):
        r = create_anfrage(name="Carl Kontakt", email_address="carl@example.com", ihre_nachricht="Bitte um Rückruf wegen Sofa.")
        doc = frappe.get_doc("PH Anfrage", r["referenz"])
        self.assertEqual(doc.art, "Kontakt")
        self.assertEqual(doc.nachname, "Kontakt")
        self.assertEqual(doc.vorname, "Carl")

    def test_api_produkt_mit_merkliste(self):
        r = create_anfrage(anfrage_type="Privat", anfrage_vorname="Dora", anfrage_nachname="Produkt", anfrage_email="dora@example.com", anfrage_phone="+43 660 1234567", anfrage_country="Österreich", anfrage_city="Bregenz", anfrage_address="Hauptstraße 1", produkte=["minotti-lawrence", "flexform-groundpiece"])
        doc = frappe.get_doc("PH Anfrage", r["referenz"])
        self.assertEqual(doc.art, "Produkt")
        self.assertEqual(len(doc.produkte), 2)
