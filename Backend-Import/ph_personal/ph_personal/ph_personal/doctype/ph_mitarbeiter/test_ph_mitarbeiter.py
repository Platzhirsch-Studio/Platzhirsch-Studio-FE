"""bench --site <site> run-tests --app ph_personal --doctype "PH Mitarbeiter" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate


def mitarbeiter_anlegen(nachname="Muster", **extra):
    daten = {"doctype": "PH Mitarbeiter", "vorname": "Max", "nachname": nachname, "rolle_intern": "Verkauf", "eintritt": "2026-01-01", "beispiel": 1}
    daten.update(extra)
    return frappe.get_doc(daten).insert()


def testuser(email="ma.test@example.com"):
    if not frappe.db.exists("User", email):
        u = frappe.get_doc({"doctype": "User", "email": email, "first_name": "MA", "last_name": "Test", "send_welcome_email": 0})
        u.flags.no_welcome_mail = True
        u.insert(ignore_permissions=True)
    return email


class TestPHMitarbeiter(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def test_titel_teams_serie(self):
        ma = mitarbeiter_anlegen("Titel", rolle_intern="Montage")
        self.assertTrue(ma.name.startswith("PH-MA-"))
        self.assertEqual(ma.titel, "Max Titel")
        self.assertEqual(ma.team_montage, 1)
        self.assertEqual(ma.status, "Aktiv")
        self.assertEqual(ma.wochenstunden_effektiv(), 38.5)
        self.assertEqual(ma.urlaubsanspruch_effektiv(), 25)

    def test_austritt_regeln(self):
        with self.assertRaises(frappe.ValidationError):
            mitarbeiter_anlegen("Falsch", austritt="2025-12-31")
        ma = mitarbeiter_anlegen("Weg", austritt=add_days(nowdate(), -1))
        self.assertEqual(ma.status, "Ausgetreten")

    def test_selbstservice_user_permission(self):
        user = testuser()
        ma = mitarbeiter_anlegen("Selbst", user=user)
        self.assertTrue(frappe.db.exists("User Permission", {"user": user, "allow": "PH Mitarbeiter", "for_value": ma.name}))
        self.assertIn("PH Personal Selbstservice", frappe.get_roles(user))
        ma.austritt_erfassen(add_days(nowdate(), -1))
        self.assertFalse(frappe.db.exists("User Permission", {"user": user, "allow": "PH Mitarbeiter", "for_value": ma.name}))
