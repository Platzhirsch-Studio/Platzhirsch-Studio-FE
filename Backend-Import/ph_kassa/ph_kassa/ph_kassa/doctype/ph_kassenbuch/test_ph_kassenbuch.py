"""Site-Tests: bench --site <site> run-tests --app ph_kassa --doctype "PH Kassenbuch" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_kassa.ph_kassa.doctype.ph_kassenbuch.ph_kassenbuch import buchen, letzter_bestand


class TestPHKassenbuch(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        if not frappe.db.exists("DocType", "PH Kasse"):
            self.skipTest("PH Kasse (WP10a) nicht installiert")
        from ph_kassa.ph_kassa.doctype.ph_kassenabschluss.test_ph_kassenabschluss import kasse_anlegen

        self.kasse = kasse_anlegen()

    def test_einlage_entnahme_bestand(self):
        start = letzter_bestand(self.kasse)
        e = buchen(self.kasse, "Einlage", 20000, "Wechselgeld")
        self.assertEqual(e.bewegung_cent, 20000)
        self.assertEqual(e.bestand_danach_cent, start + 20000)
        self.assertTrue(e.name.startswith("KB-"))
        a = buchen(self.kasse, "Entnahme", 5000, "Bankeinzahlung")
        self.assertEqual(a.bestand_danach_cent, start + 15000)

    def test_grund_pflicht_und_unveraenderlich(self):
        with self.assertRaises(frappe.ValidationError):
            buchen(self.kasse, "Entnahme", 100, "")
        e = buchen(self.kasse, "Einlage", 100, "x")
        e.betrag_cent = 200
        with self.assertRaises(frappe.ValidationError):
            e.save()

    def test_storno_gegenbuchung(self):
        e = buchen(self.kasse, "Einlage", 300, "Test")
        gegen = e.stornieren("Irrtum")
        self.assertEqual(frappe.db.get_value("PH Kassenbuch", gegen, "art"), "Entnahme")
        self.assertEqual(frappe.db.get_value("PH Kassenbuch", e.name, "status"), "Storniert")
