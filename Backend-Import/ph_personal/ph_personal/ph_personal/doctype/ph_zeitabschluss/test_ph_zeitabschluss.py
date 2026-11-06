"""bench --site <site> run-tests --app ph_personal --doctype "PH Zeitabschluss" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_personal.ph_personal.doctype.ph_mitarbeiter.test_ph_mitarbeiter import mitarbeiter_anlegen
from ph_personal.ph_personal.doctype.ph_zeitabschluss.ph_zeitabschluss import abschliessen
from ph_personal.ph_personal.doctype.ph_zeiterfassung.test_ph_zeiterfassung import buchung


class TestPHZeitabschluss(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.ma = mitarbeiter_anlegen("Abschluss").name

    def test_abschluss_sperrt_und_oeffnet(self):
        buchung(self.ma, "2026-10-05", "08:00:00", "16:30:00")
        z = abschliessen(self.ma, 2026, 10)
        self.assertEqual(z.status, "Abgeschlossen")
        self.assertEqual(z.ist_min, 480)
        self.assertEqual(abschliessen(self.ma, 2026, 10).name, z.name)  # idempotent
        with self.assertRaises(frappe.ValidationError):
            buchung(self.ma, "2026-10-06", "08:00:00", "12:00:00")
        z.wieder_oeffnen("Nachtrag Test")
        self.assertEqual(z.status, "Wieder geoeffnet")
        buchung(self.ma, "2026-10-06", "08:00:00", "12:00:00")
