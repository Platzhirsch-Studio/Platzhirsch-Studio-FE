"""Site-Tests PH Kasse: Validierung Kassen-ID, Checkliste, AES-Prüfwert, Startbeleg nur einmal, Kette prüfen."""

import base64
import os

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_kassa.rksv import buchung
from ph_kassa.rksv.counter import pruefwert_schluessel, schluessel_aus_b64
from ph_kassa.rksv.signer import SoftwareSigner


class TestPHKasse(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.flags.ph_kassa_test_signer = SoftwareSigner()
        if not frappe.db.exists("PH Signatureinheit", "Test-SEE Kasse"):
            frappe.get_doc({"doctype": "PH Signatureinheit", "bezeichnung": "Test-SEE Kasse", "art": "Test", "vda_id": "AT0"}).insert()
        frappe.get_doc("PH Signatureinheit", "Test-SEE Kasse").zertifikat_abrufen()

    def tearDown(self):
        frappe.flags.ph_kassa_test_signer = None

    def test_kassen_id_regeln(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kasse", "kassen_id": "KASSE_1"}).insert()
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kasse", "kassen_id": "Kasse 1"}).insert()

    def test_anlage_checkliste_und_pruefwert(self):
        key = base64.b64encode(os.urandom(32)).decode()
        frappe.conf["ph_kassa_aes_key_TEST-KASSE-2"] = key
        k = frappe.get_doc({"doctype": "PH Kasse", "kassen_id": "TEST-KASSE-2", "see": "Test-SEE Kasse"}).insert()
        self.assertEqual(k.status, "Angelegt")
        self.assertEqual(k.aes_schluessel_name, "ph_kassa_aes_key_TEST-KASSE-2")
        self.assertEqual(k.aes_schluessel_vorhanden, 1)
        self.assertEqual(k.aes_pruefwert, pruefwert_schluessel(schluessel_aus_b64(key)))
        self.assertEqual(len(k.registrierung), 7)
        self.assertTrue(next(z for z in k.registrierung if z.schritt == "AES-Schluessel erzeugt").erledigt)
        with self.assertRaises(frappe.ValidationError):
            k.aes_schluessel_erzeugen()  # Schlüssel existiert bereits

    def test_startbeleg_nur_einmal_und_kette(self):
        frappe.conf["ph_kassa_aes_key_TEST-KASSE-3"] = base64.b64encode(os.urandom(32)).decode()
        k = frappe.get_doc({"doctype": "PH Kasse", "kassen_id": "TEST-KASSE-3", "see": "Test-SEE Kasse"}).insert()
        with self.assertRaises(frappe.ValidationError):
            buchung.nullbeleg(k.name)  # vor Startbeleg verboten
        k.startbeleg_erstellen()
        k.reload()
        self.assertTrue(k.startbeleg)
        self.assertEqual(k.status, "Registriert")
        with self.assertRaises(frappe.ValidationError):
            k.startbeleg_erstellen()
        buchung.nullbeleg(k.name)
        erg = k.kette_pruefen()
        self.assertTrue(erg["ok"], erg["fehler"])
        self.assertEqual(erg["anzahl"], 2)
        with self.assertRaises(frappe.ValidationError):
            k.delete()  # Kasse mit Belegen

    def test_ohne_aes_schluessel_kein_beleg(self):
        k = frappe.get_doc({"doctype": "PH Kasse", "kassen_id": "TEST-KASSE-4", "see": "Test-SEE Kasse"}).insert()
        self.assertEqual(k.aes_schluessel_vorhanden, 0)
        with self.assertRaises(frappe.ValidationError):
            buchung.startbeleg(k.name)
