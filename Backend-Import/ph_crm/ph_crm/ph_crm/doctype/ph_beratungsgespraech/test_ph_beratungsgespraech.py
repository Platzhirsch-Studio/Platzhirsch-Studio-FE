import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHBeratungsgespraech(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Kontakt", {"email": "bg@kontakt-test.example"})
        self.kontakt = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Bea", "nachname": "Gespräch", "email": "bg@kontakt-test.example"}).insert()

    def test_budget_summe_und_titel(self):
        doc = frappe.get_doc(
            {
                "doctype": "PH Beratungsgespraech",
                "kontakt": self.kontakt.name,
                "berater": "Administrator",
                "datum": "2026-11-10",
                "raeume": [{"raum": "Wohnen", "wunsch": "Sofa + Teppich", "budget_cent": 1500000}, {"raum": "Kueche", "wunsch": "Insel", "budget_cent": 4500000}],
            }
        ).insert()
        self.assertEqual(doc.budget_gesamt_cent, 6000000)
        self.assertTrue(doc.titel.startswith("10.11.2026 · Bea Gespräch"))
        self.assertTrue(doc.name.startswith("PH-BG-"))

    def test_abschluss_braucht_inhalt(self):
        doc = frappe.get_doc({"doctype": "PH Beratungsgespraech", "kontakt": self.kontakt.name, "berater": "Administrator", "status": "Abgeschlossen"})
        with self.assertRaises(frappe.ValidationError):
            doc.insert()

    def test_aufgabe_aus_naechstem_schritt(self):
        doc = frappe.get_doc({"doctype": "PH Beratungsgespraech", "kontakt": self.kontakt.name, "berater": "Administrator", "naechster_schritt": "Grundriss anfordern"}).insert()
        name = doc.aufgabe_anlegen()
        aufgabe = frappe.get_doc("PH Aufgabe", name)
        self.assertEqual(aufgabe.kontakt, self.kontakt.name)
        self.assertEqual(aufgabe.referenz_name, doc.name)
