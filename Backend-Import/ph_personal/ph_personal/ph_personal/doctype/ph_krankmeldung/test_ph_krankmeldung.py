"""bench --site <site> run-tests --app ph_personal --doctype "PH Krankmeldung" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_personal.ph_personal.doctype.ph_abwesenheit.test_ph_abwesenheit import abwesenheit
from ph_personal.ph_personal.doctype.ph_mitarbeiter.test_ph_mitarbeiter import mitarbeiter_anlegen


class TestPHKrankmeldung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.ma = mitarbeiter_anlegen("Krank").name

    def test_melden_bestaetigen_beenden(self):
        k = frappe.get_doc({"doctype": "PH Krankmeldung", "mitarbeiter": self.ma, "von": "2026-11-02"}).insert()
        self.assertEqual(k.status, "Gemeldet")
        self.assertTrue(k.name.startswith("PH-KRANK-"))
        k.bestaetigung_erfasst("2026-11-03")
        self.assertEqual(k.status, "Bestaetigt")
        k.gesund_melden("2026-11-06")
        self.assertEqual(k.status, "Beendet")
        self.assertEqual(k.tage, 5.0)

    def test_urlaub_unterbrechen(self):
        u = abwesenheit(self.ma, "2026-12-14", "2026-12-18")
        u.status = "Genehmigt"
        u.save()
        k = frappe.get_doc({"doctype": "PH Krankmeldung", "mitarbeiter": self.ma, "von": "2026-12-15", "bis_offen": 0, "bis_voraussichtlich": "2026-12-18"}).insert()
        u.reload()
        self.assertEqual(u.unterbrechung_krankmeldung, k.name)
        self.assertEqual(u.tage, 1.0)

    def test_keine_ueberschneidung(self):
        frappe.get_doc({"doctype": "PH Krankmeldung", "mitarbeiter": self.ma, "von": "2027-01-11", "bis_offen": 0, "bis_voraussichtlich": "2027-01-12"}).insert()
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Krankmeldung", "mitarbeiter": self.ma, "von": "2027-01-12"}).insert()
