"""bench --site <site> run-tests --app ph_service --doctype "PH Serviceeinsatz" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate

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

    def test_umplanen_setzt_bestaetigung_zurueck(self):
        fall = testfall()
        einsatz = frappe.get_doc({"doctype": "PH Serviceeinsatz", "servicefall": fall.name, "techniker": "Administrator", "datum": nowdate(), "zeit_von": "09:00:00", "zeit_bis": "11:00:00"}).insert()
        einsatz.bestaetigen()
        einsatz.reload()
        self.assertTrue(einsatz.bestaetigt_kunde_am)
        einsatz.umplanen(datum=add_days(nowdate(), 3), zeit_von="13:00:00", zeit_bis="15:00:00", grund="Kunde verhindert")
        einsatz.reload()
        self.assertEqual(einsatz.status, "Geplant")
        self.assertFalse(einsatz.bestaetigt_kunde_am)
        self.assertTrue(einsatz.umgeplant_am)

    def test_abbrechen_und_bestaetigung_ohne_unterschrift(self):
        fall = testfall()
        einsatz = frappe.get_doc({"doctype": "PH Serviceeinsatz", "servicefall": fall.name, "techniker": "Administrator", "datum": nowdate()}).insert()
        with self.assertRaises(frappe.ValidationError):
            einsatz.abbrechen(grund="")
        einsatz.abbrechen(grund="Kunde sagt ab")
        einsatz.reload()
        self.assertEqual(einsatz.status, "Abgebrochen")
        zweiter = frappe.get_doc({"doctype": "PH Serviceeinsatz", "servicefall": fall.name, "techniker": "Administrator", "datum": nowdate()}).insert()
        with self.assertRaises(frappe.ValidationError):
            zweiter.abschliessen(ergebnis="Behoben", bericht="ok", unterschrift_art="Name bestätigt", unterschrift_name="")
        zweiter.reload()
        zweiter.abschliessen(ergebnis="Behoben", bericht="ok", unterschrift_art="Name bestätigt", unterschrift_name="Anna Servicetest")
        zweiter.reload()
        self.assertEqual(zweiter.unterschrift_art, "Name bestätigt")
        self.assertTrue(zweiter.unterschrift_am)

    def test_freie_fenster_api(self):
        from ph_service.api import get_technician_slots

        fall = testfall()
        frappe.get_doc({"doctype": "PH Serviceeinsatz", "servicefall": fall.name, "techniker": "Administrator", "datum": add_days(nowdate(), 30), "zeit_von": "08:00:00", "zeit_bis": "12:00:00"}).insert()
        r = get_technician_slots(datum=add_days(nowdate(), 30), techniker="Administrator")
        starts = [f["von"] for f in r["techniker"]["Administrator"]]
        self.assertNotIn("09:00", starts)
        self.assertIn("13:00", starts)

    def tearDown(self):
        frappe.db.rollback()
