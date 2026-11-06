"""bench --site <site> run-tests --app ph_projekte --doctype "PH Aufmass" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte.ph_projekte.doctype.ph_projekt.test_ph_projekt import testprojekt


class TestPHAufmass(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.p = testprojekt("Aufmass Test")

    def _aufmass(self, **extra):
        return frappe.get_doc(
            {
                "doctype": "PH Aufmass",
                "projekt": self.p.name,
                "datum": "2026-11-10",
                "raumhoehe_standard_mm": 2600,
                "raeume": [{"raum": "Küche", "laenge_mm": 4200, "breite_mm": 3000}],
                "masse": [{"raum": "Küche", "bezeichnung": "Wand A", "wert_mm": 4200}],
                "anschluesse": [{"raum": "Küche", "art": "Abluft", "hoehe_mm": 2400, "durchmesser_mm": 150}, {"raum": "Küche", "art": "Starkstrom 400 V", "hoehe_mm": 300}],
                **extra,
            }
        ).insert()

    def test_flaeche_titel_status(self):
        a = self._aufmass()
        self.assertEqual(a.status, "Entwurf")
        self.assertEqual(a.raeume[0].flaeche_m2, 12.6)
        self.assertEqual(a.raeume[0].hoehe_mm, 2600)
        self.assertIn("Aufmaß", a.titel)
        self.assertFalse(a.plausibilitaet)

    def test_plausibilitaet_hinweis(self):
        a = self._aufmass(anschluesse=[{"raum": "Bad", "art": "Abfluss"}])
        self.assertIn("nicht erfasst", a.plausibilitaet)

    def test_erfassen_pruefen_raeume_ins_projekt(self):
        a = self._aufmass()
        self.assertEqual(a.erfasst_melden(), "Erfasst")
        a.reload()
        self.assertEqual(a.pruefen(), "Geprueft")
        self.assertEqual(a.raeume_ins_projekt(), 1)
        self.assertEqual(a.raeume_ins_projekt(), 0)
        self.p.reload()
        self.assertTrue(any(r.raum == "Küche" for r in self.p.raeume))
        planung = a.planung_anlegen()
        self.assertEqual(frappe.db.get_value("PH Planung", planung, "aufmass"), a.name)
