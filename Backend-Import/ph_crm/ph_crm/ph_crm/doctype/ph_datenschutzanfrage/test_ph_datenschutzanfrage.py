"""bench --site <site> run-tests --app ph_crm --doctype "PH Datenschutzanfrage" """

import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHDatenschutzanfrage(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Kontakt", {"email": ("like", "%@dsgvo-test.example")})
        self.kontakt = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Dora", "nachname": "Daten", "email": "dora@dsgvo-test.example", "telefon": "0664 7654321", "plz": "6911"}).insert()

    def _anfrage(self, art, **kw):
        return frappe.get_doc({"doctype": "PH Datenschutzanfrage", "art": art, "kontakt": self.kontakt.name, "eingang": "2026-11-04", **kw}).insert()

    def test_titel_frist_serie(self):
        a = self._anfrage("Auskunft")
        self.assertEqual(a.status, "Offen")
        self.assertEqual(str(a.frist), "2026-12-04")
        self.assertTrue(a.name.startswith("PH-DSA-"))
        self.assertIn("Dora Daten", a.titel)

    def test_verlaengerung_braucht_grund(self):
        with self.assertRaises(frappe.ValidationError):
            self._anfrage("Auskunft", verlaengert=1)
        a = self._anfrage("Auskunft", verlaengert=1, verlaengerung_grund="komplex, viele Projekte")
        self.assertEqual(str(a.frist), "2027-02-04")

    def test_auskunft_nur_mit_identitaet(self):
        a = self._anfrage("Auskunft")
        with self.assertRaises(frappe.ValidationError):
            a.auskunft_erstellen()
        a.db_set("identitaet_geprueft", 1)
        url = a.auskunft_erstellen()
        a.reload()
        self.assertEqual(a.status, "Erledigt")
        self.assertTrue(url.startswith("/private/files/"))

    def test_loeschung_anonymisiert(self):
        frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "nachname": "Daten", "email": "dora@dsgvo-test.example", "anliegen": "Test", "kontakt": self.kontakt.name}).insert()
        a = self._anfrage("Loeschung", identitaet_geprueft=1)
        plan = a.loeschplan_erstellen()
        self.assertTrue(any(z["doctype"] == "PH Anfrage" and z["aktion"] == "loeschen" for z in plan))
        self.assertEqual(plan[-1]["doctype"], "PH Kontakt")
        with self.assertRaises(frappe.ValidationError):
            a.loeschung_ausfuehren("ja")
        a.loeschung_ausfuehren("ANONYMISIEREN")
        k = frappe.get_doc("PH Kontakt", self.kontakt.name)
        self.assertIsNone(k.email)
        self.assertEqual(k.nachname, "Anonymisiert")
        self.assertTrue(k.anonymisiert_am)
        self.assertFalse(frappe.db.exists("PH Anfrage", {"kontakt": k.name}))
        a.reload()
        self.assertEqual(a.status, "Erledigt")

    def test_ablehnen_braucht_grund(self):
        a = self._anfrage("Berichtigung")
        with self.assertRaises(frappe.ValidationError):
            a.ablehnen("")
        a.ablehnen("Identität nicht nachgewiesen")
        a.reload()
        self.assertEqual(a.status, "Abgelehnt")
