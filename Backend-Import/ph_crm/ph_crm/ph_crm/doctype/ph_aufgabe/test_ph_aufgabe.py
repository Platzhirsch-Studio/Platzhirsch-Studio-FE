import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate


class TestPHAufgabe(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def test_anlegen_status_zuweisung(self):
        doc = frappe.get_doc({"doctype": "PH Aufgabe", "titel": "Rückruf Muster", "faellig": nowdate(), "zugewiesen_an": "Administrator"}).insert()
        self.assertEqual(doc.status, "Offen")
        self.assertTrue(doc.name.startswith("PH-AUF-"))
        self.assertTrue(frappe.db.exists("ToDo", {"reference_type": "PH Aufgabe", "reference_name": doc.name, "status": "Open"}))
        doc.status_setzen("Erledigt", "erledigt")
        doc.reload()
        self.assertEqual(doc.status, "Erledigt")
        self.assertTrue(doc.erledigt_am)
        self.assertFalse(frappe.db.exists("ToDo", {"reference_type": "PH Aufgabe", "reference_name": doc.name, "status": "Open"}))

    def test_kontakt_aus_vorgang(self):
        kontakt = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Aufgabe", "email": "aufgabe@kontakt-test.example"}).insert()
        anfrage = frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "nachname": "Aufgabe", "email": "aufgabe@kontakt-test.example", "anliegen": "x", "kontakt": kontakt.name}).insert()
        doc = frappe.get_doc({"doctype": "PH Aufgabe", "titel": "Nachfassen", "faellig": nowdate(), "referenz_doctype": "PH Anfrage", "referenz_name": anfrage.name}).insert()
        self.assertEqual(doc.kontakt, kontakt.name)

    def test_titel_pflicht_und_verschieben(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Aufgabe", "titel": "  ", "faellig": nowdate()}).insert()
        doc = frappe.get_doc({"doctype": "PH Aufgabe", "titel": "Verschieben", "faellig": add_days(nowdate(), -3)}).insert()
        doc.verschieben(1)
        self.assertEqual(str(doc.faellig), add_days(nowdate(), 1))
