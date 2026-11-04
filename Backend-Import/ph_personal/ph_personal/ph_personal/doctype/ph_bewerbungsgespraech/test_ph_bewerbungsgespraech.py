"""bench --site <site> run-tests --app ph_personal --doctype "PH Bewerbungsgespraech" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_to_date, now_datetime

from ph_personal.ph_personal.doctype.ph_bewerbung.test_ph_bewerbung import bewerbung_anlegen


class TestPHBewerbungsgespraech(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def test_anlegen_ende_titel(self):
        bew = bewerbung_anlegen(nachname="Gespräch").insert()
        start = add_to_date(now_datetime(), days=3)
        g = frappe.get_doc({"doctype": "PH Bewerbungsgespraech", "bewerbung": bew.name, "start": start, "dauer_min": 45, "verantwortlich": "Administrator"}).insert()
        self.assertTrue(g.name.startswith("PH-GSP-"))
        self.assertEqual(g.status, "Geplant")
        self.assertEqual(g.ende, add_to_date(start, minutes=45))
        self.assertEqual(g.ort, "Studio Lochau")
        self.assertIn("Gespräch", g.titel)

    def test_dauer_grenzen(self):
        bew = bewerbung_anlegen(nachname="Dauer").insert()
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Bewerbungsgespraech", "bewerbung": bew.name, "start": now_datetime(), "dauer_min": 2, "verantwortlich": "Administrator"}).insert()

    def test_kalender_und_abschluss_mit_angebot(self):
        bew = bewerbung_anlegen(nachname="Kalender").insert()
        g = frappe.get_doc("PH Bewerbungsgespraech", bew.gespraech_anlegen(start=add_to_date(now_datetime(), days=1)))
        ev = g.kalender_eintragen()
        self.assertTrue(frappe.db.exists("Event", ev))
        self.assertEqual(g.kalender_eintragen(), ev)  # idempotent
        g.abschliessen(ergebnis="Angebot")
        bew.reload()
        self.assertEqual(bew.status, "Angebot")
        self.assertTrue(bew.angebot_am)
        g.reload()
        self.assertEqual(g.status, "Durchgefuehrt")
        g.delete()
        self.assertFalse(frappe.db.exists("Event", ev))
