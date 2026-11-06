"""bench --site <site> run-tests --app ph_kundenkarte --doctype "PH Kundenkarte Stufe" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_stufe.ph_kundenkarte_stufe import stufen_liste, stufen_vorteile
from ph_kundenkarte.tests.helfer import einstellungen_fuer_tests


class TestPHKundenkarteStufe(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()

    def test_installdaten(self):
        liste = stufen_liste()
        self.assertEqual([s["name"] for s in liste], ["Platzhirsch", "Platzhirsch Plus", "Platzhirsch Privé"])
        self.assertEqual(liste[0]["schwelle_jahresumsatz_cent"], 0)
        zuordnung = stufen_vorteile()
        self.assertTrue(any(z["stufe"] == "Platzhirsch Plus" and z["titel"] == "Lieferung im Liefergebiet" for z in zuordnung))

    def test_schwellen_monoton(self):
        s = frappe.get_doc("PH Kundenkarte Stufe", "Platzhirsch Plus")
        s.schwelle_jahresumsatz_cent = 9_000_000  # höher als Privé
        with self.assertRaises(frappe.ValidationError):
            s.save()

    def test_reihenfolge_eindeutig(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kundenkarte Stufe", "stufenname": "Testdoppelt", "reihenfolge": 2, "schwelle_jahresumsatz_cent": 1_000_000}).insert()

    def test_kein_geldwert_in_kundentext(self):
        s = frappe.get_doc("PH Kundenkarte Stufe", "Platzhirsch")
        s.beschreibung_kunde = "Sie erhalten 10 % Rabatt."
        with self.assertRaises(frappe.ValidationError):
            s.save()
        s.reload()
        s.beschreibung_kunde = "Die beste Karte der Stadt."
        with self.assertRaises(frappe.ValidationError):
            s.save()

    def test_vorteil_doppelt(self):
        s = frappe.get_doc("PH Kundenkarte Stufe", "Platzhirsch")
        s.append("vorteile", {"vorteil": s.vorteile[0].vorteil})
        with self.assertRaises(frappe.ValidationError):
            s.save()

    def tearDown(self):
        frappe.db.rollback()
