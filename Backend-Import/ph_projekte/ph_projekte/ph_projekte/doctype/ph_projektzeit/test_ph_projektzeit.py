"""bench --site <site> run-tests --app ph_projekte --doctype "PH Projektzeit" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte.ph_projekte.doctype.ph_projekt.test_ph_projekt import testprojekt


class TestPHProjektzeit(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.p = testprojekt("Zeit Test")

    def test_dauer_aus_von_bis_und_projektsumme(self):
        z = frappe.get_doc({"doctype": "PH Projektzeit", "projekt": self.p.name, "user": "Administrator", "datum": "2026-11-04", "start": "08:15:00", "ende": "10:45:00", "taetigkeit": "Planung"}).insert()
        self.assertEqual(z.dauer_min, 150)
        self.assertEqual(z.status, "Offen")
        self.assertGreaterEqual(frappe.db.get_value("PH Projekt", self.p.name, "zeit_min_gesamt"), 150)

    def test_dauer_pflicht_und_plausibel(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Projektzeit", "projekt": self.p.name, "user": "Administrator", "datum": "2026-11-04", "taetigkeit": "Planung"}).insert()
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Projektzeit", "projekt": self.p.name, "user": "Administrator", "datum": "2026-11-04", "taetigkeit": "Planung", "dauer_min": 2000}).insert()

    def test_aufgabe_summe_und_abrechnung_sperrt(self):
        a = frappe.get_doc({"doctype": "PH Projekt Aufgabe", "projekt": self.p.name, "titel": "Planung Wohnzimmer", "art": "Planung"}).insert()
        a.zeit_buchen(45)  # Button „Zeit buchen“ an der Aufgabe
        z = frappe.get_doc({"doctype": "PH Projektzeit", "projekt": self.p.name, "aufgabe": a.name, "user": "Administrator", "datum": "2026-11-04", "taetigkeit": "Planung", "dauer_min": 30, "stundensatz_cent": 9000}).insert()
        self.assertEqual(z.betrag_cent, 4500)
        self.assertEqual(frappe.db.get_value("PH Projekt Aufgabe", a.name, "erfasst_min"), 75)
        z.als_abgerechnet("RE-2026-00001")
        z.reload()
        self.assertEqual(z.status, "Abgerechnet")
        z.dauer_min = 60
        with self.assertRaises(frappe.ValidationError):
            z.save()
        with self.assertRaises(frappe.ValidationError):
            frappe.delete_doc("PH Projektzeit", z.name)

    def test_aufgabe_muss_zum_projekt_gehoeren(self):
        anderes = testprojekt("Zeit Anderes")
        a = frappe.get_doc({"doctype": "PH Projekt Aufgabe", "projekt": anderes.name, "titel": "Fremd"}).insert()
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Projektzeit", "projekt": self.p.name, "aufgabe": a.name, "user": "Administrator", "datum": "2026-11-04", "taetigkeit": "Planung", "dauer_min": 10}).insert()
