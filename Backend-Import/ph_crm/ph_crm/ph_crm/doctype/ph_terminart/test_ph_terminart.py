import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHTerminart(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.delete_doc("PH Terminart", "test_art", force=True, ignore_missing=True)

    def test_anlegen_und_website_form(self):
        doc = frappe.get_doc({"doctype": "PH Terminart", "key": "test_art", "titel_de": "Testtermin", "modus": "Showroom", "dauer_min": 60, "bestaetigung": "automatisch"}).insert()
        w = doc.fuer_website("en")
        self.assertEqual(w["key"], "test_art")
        self.assertEqual(w["modus"], "studio")
        self.assertEqual(w["bestaetigung"], "sofort")
        self.assertEqual(doc.modus_aufloesen("studio"), "Showroom")
        self.assertIsNone(doc.modus_aufloesen("video"))

    def test_modi_pflicht_ohne_festen_modus(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Terminart", "key": "test_art", "titel_de": "x", "dauer_min": 60}).insert()
        doc = frappe.get_doc({"doctype": "PH Terminart", "key": "test_art", "titel_de": "x", "dauer_min": 90, "modi_erlaubt": "Showroom,Video"}).insert()
        self.assertEqual(doc.modus_aufloesen("video"), "Video")
        self.assertIsNone(doc.modus_aufloesen("vor_ort"))

    def test_schluessel_format(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Terminart", "key": "Test Art", "titel_de": "x", "modus": "Video", "dauer_min": 45}).insert()
