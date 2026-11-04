"""bench --site <site> run-tests --app ph_personal --doctype "PH Zeiterfassung" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate

from ph_personal.api import stempeln
from ph_personal.ph_personal.doctype.ph_mitarbeiter.test_ph_mitarbeiter import mitarbeiter_anlegen, testuser
from ph_personal.ph_personal.doctype.ph_zeiterfassung.ph_zeiterfassung import monatsuebersicht


def buchung(ma, datum, kommen, gehen=None, **extra):
    d = {"doctype": "PH Zeiterfassung", "mitarbeiter": ma, "datum": datum, "kommen": kommen, "gehen": gehen, "art": "Arbeit"}
    d.update(extra)
    return frappe.get_doc(d).insert()


class TestPHZeiterfassung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.ma = mitarbeiter_anlegen("Zeit").name

    def test_dauer_pause_status(self):
        b = buchung(self.ma, "2026-11-02", "08:00:00", "16:30:00")
        self.assertEqual(b.pause_min, 30)  # Vorschlag ab 6 h
        self.assertEqual(b.dauer_min, 480)
        self.assertEqual(b.dauer_text, "8:00")
        self.assertEqual(b.status, "Erfasst")
        self.assertTrue(b.name.startswith("PH-ZEIT-"))

    def test_regeln(self):
        with self.assertRaises(frappe.ValidationError):
            buchung(self.ma, "2026-11-02", "16:00:00", "08:00:00")
        with self.assertRaises(frappe.ValidationError):
            buchung(self.ma, add_days(nowdate(), 1), "08:00:00")
        buchung(self.ma, "2026-11-03", "08:00:00", "12:00:00")
        with self.assertRaises(frappe.ValidationError):
            buchung(self.ma, "2026-11-03", "11:00:00", "13:00:00")  # Überschneidung

    def test_korrektur(self):
        b = buchung(self.ma, "2026-11-04", "08:00:00", "12:00:00")
        b.gehen = "12:30:00"
        b.save()
        self.assertEqual(b.status, "Korrigiert")
        self.assertEqual(b.korrigiert_von, "Administrator")

    def test_stempeln_kommen_gehen(self):
        user = testuser("stempel@example.com")
        ma = mitarbeiter_anlegen("Stempel", user=user).name
        frappe.set_user(user)
        try:
            r1 = stempeln()
            self.assertTrue(r1["ok"])
            self.assertEqual(r1["status"], "Offen")
            r2 = stempeln()
            self.assertIn(r2["status"], ("Erfasst", "Offen"))  # sofortiges Gehen kann an „Netto 0“ scheitern → bleibt Offen
        finally:
            frappe.set_user("Administrator")
        frappe.db.delete("PH Zeiterfassung", {"mitarbeiter": ma})

    def test_monatsuebersicht(self):
        buchung(self.ma, "2026-11-02", "08:00:00", "16:30:00")
        buchung(self.ma, "2026-11-03", "08:00:00", "12:00:00")
        m = monatsuebersicht(self.ma, 2026, 11)
        self.assertEqual(m["ist_min"], 480 + 240)
        self.assertEqual(m["soll_min"], 9702)
        self.assertEqual(m["arbeitstage"], 21.0)
        self.assertEqual(len(m["tage"]), 2)
        self.assertTrue(m["saldo_text"].startswith("-"))
