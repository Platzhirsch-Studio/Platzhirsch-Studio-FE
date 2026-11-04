"""bench --site <site> run-tests --app ph_service --doctype "PH Ersatzteil" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_service.ph_service.doctype.ph_ersatzteil.ph_ersatzteil import buchen, unter_mindestbestand
from ph_service.tests.helfer import einstellungen_fuer_tests


class TestPHErsatzteil(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()

    def _teil(self, **werte):
        return frappe.get_doc({"doctype": "PH Ersatzteil", "bezeichnung": "Testscharnier", "hersteller_nr": "SCH-100", "kategorie": "Scharnier", "bestand_fuehren": 1, "mindestbestand": 2, **werte}).insert()

    def test_bestand_aus_bewegungen(self):
        teil = self._teil()
        self.assertEqual(teil.bestand, 0)
        self.assertIn("SCH-100", teil.titel)
        self.assertEqual(buchen(teil.name, "Zugang", 5, hinweis="Test"), 5)
        self.assertEqual(buchen(teil.name, "Verbrauch", 2), 3)
        self.assertEqual(buchen(teil.name, "Retoure", 1), 4)
        teil.reload()
        self.assertEqual(teil.verfuegbar, 4)
        self.assertEqual(len(teil.bewegungen), 3)

    def test_negativ_verboten(self):
        teil = self._teil()
        buchen(teil.name, "Zugang", 1)
        with self.assertRaises(frappe.ValidationError):
            buchen(teil.name, "Verbrauch", 2)
        with self.assertRaises(frappe.ValidationError):
            buchen(teil.name, "Zugang", 0)
        with self.assertRaises(frappe.ValidationError):
            buchen(teil.name, "Unsinn", 1)

    def test_inventur_setzt_zaehlwert(self):
        teil = self._teil()
        buchen(teil.name, "Zugang", 10)
        self.assertEqual(buchen(teil.name, "Inventur", 7), 7)
        self.assertEqual(buchen(teil.name, "Inventur", 7), 7)
        teil.reload()
        self.assertEqual(teil.bewegungen[-1].art, "Korrektur")
        self.assertEqual(teil.bewegungen[-1].menge, -3)

    def test_mindestbestand_liste(self):
        teil = self._teil(bezeichnung="Knappteil")
        buchen(teil.name, "Zugang", 1)
        namen = [r.name for r in unter_mindestbestand()]
        self.assertIn(teil.name, namen)
        buchen(teil.name, "Zugang", 5)
        namen = [r.name for r in unter_mindestbestand()]
        self.assertNotIn(teil.name, namen)

    def test_ohne_bestandsfuehrung(self):
        teil = self._teil(bestand_fuehren=0)
        self.assertEqual(buchen(teil.name, "Zugang", 5), 0)

    def tearDown(self):
        frappe.db.rollback()
