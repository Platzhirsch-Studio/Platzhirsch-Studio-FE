"""bench --site <site> run-tests --app ph_personal --doctype "PH Dienstplan" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_personal.ph_personal.doctype.ph_mitarbeiter.test_ph_mitarbeiter import mitarbeiter_anlegen
from ph_personal.ph_personal.doctype.ph_schicht.test_ph_schicht import schicht


class TestPHDienstplan(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.a = mitarbeiter_anlegen("PlanA").name
        self.b = mitarbeiter_anlegen("PlanB").name
        schicht()

    def test_pruefen_und_kopieren(self):
        frappe.db.delete("PH Dienstplan", {"kennung": ("in", ["2027-KW02", "2027-KW03"])})
        p = frappe.get_doc({"doctype": "PH Dienstplan", "woche_von": "2027-01-13", "schichten": [
            {"datum": "2027-01-15", "mitarbeiter": self.a, "beginn": "12:00:00", "ende": "22:00:00", "pause_min": 30},
            {"datum": "2027-01-16", "mitarbeiter": self.a, "beginn": "06:00:00", "ende": "12:00:00"},
            {"datum": "2027-01-16", "mitarbeiter": self.b, "schicht": "TFR"},
        ]}).insert()
        self.assertEqual(p.kennung, "2027-KW02")
        self.assertEqual(str(p.woche_von), "2027-01-11")
        self.assertGreaterEqual(p.konflikte_anzahl, 1)  # Ruhezeit A
        self.assertEqual(p.schichten[2].netto_min, 450)
        neu = p.in_folgewoche_kopieren()
        self.assertEqual(frappe.get_doc("PH Dienstplan", neu).kennung, "2027-KW03")
