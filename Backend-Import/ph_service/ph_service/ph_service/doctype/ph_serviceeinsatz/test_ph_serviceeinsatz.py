"""bench --site <site> run-tests --app ph_service --doctype "PH Serviceeinsatz" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_service.ph_service.doctype.ph_ersatzteil.ph_ersatzteil import buchen
from ph_service.tests.helfer import einstellungen_fuer_tests, testfall


class TestPHServiceeinsatz(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()

    def test_abschluss_bucht_ersatzteile_und_kosten(self):
        teil = frappe.get_doc({"doctype": "PH Ersatzteil", "bezeichnung": "Scharnier Einsatztest", "bestand_fuehren": 1}).insert()
        buchen(teil.name, "Zugang", 3)
        fall = testfall(fehlercode="MEC-01", entscheidung="Verbesserung", entscheidung_begruendung="Nachjustieren")
        name = fall.einsatz_anlegen(datum=nowdate(), techniker="Administrator")
        einsatz = frappe.get_doc("PH Serviceeinsatz", name)
        einsatz.append("ersatzteile", {"ersatzteil": teil.name, "menge": 2, "aus_bestand": 1})
        einsatz.zeit_arbeit_min = 60
        einsatz.zeit_anfahrt_min = 30
        einsatz.save()
        einsatz.abschliessen(ergebnis="Behoben", bericht="Scharnier getauscht", unterschrift_name="Anna Servicetest")
        einsatz.reload()
        self.assertEqual(einsatz.status, "Erledigt")
        self.assertTrue(einsatz.ersatzteile_gebucht)
        self.assertTrue(einsatz.kosten_gebucht)
        teil.reload()
        self.assertEqual(teil.bestand, 1)
        fall.reload()
        arten = [k.art for k in fall.kosten]
        self.assertIn("Intern Arbeitszeit", arten)
        self.assertIn("Intern Anfahrt", arten)
        self.assertEqual(fall.kosten_intern_cent, 7500 + 3750)
        # Einsatz erledigt → Servicefall zurück auf In Bearbeitung (ereignisse.py)
        self.assertEqual(fall.status, "In Bearbeitung")

    def test_zeitfenster_und_ergebnis_pflicht(self):
        fall = testfall()
        daten = {"doctype": "PH Serviceeinsatz", "servicefall": fall.name, "techniker": "Administrator", "datum": nowdate(), "zeit_von": "10:00:00", "zeit_bis": "09:00:00"}
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc(daten).insert()
        daten["zeit_bis"] = "12:00:00"
        einsatz = frappe.get_doc(daten).insert()
        self.assertEqual(einsatz.status, "Geplant")
        einsatz.status = "Erledigt"
        with self.assertRaises(frappe.ValidationError):
            einsatz.save()  # Ergebnis fehlt

    def test_ohne_bezug_verboten(self):
        einsatz = frappe.get_doc({"doctype": "PH Serviceeinsatz", "techniker": "Administrator", "datum": nowdate()})
        with self.assertRaises(frappe.ValidationError):
            einsatz.insert()

    def tearDown(self):
        frappe.db.rollback()
