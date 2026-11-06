import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHSegment(FrappeTestCase):
    def test_anlegen_und_regelpruefung(self):
        doc = frappe.get_doc({"doctype": "PH Segment", "segment_id": "test-kueche", "titel": "Test Küche", "zweck": "newsletter", "regeln": [{"kriterium": "interesse", "operator": "ist", "wert": "Küche"}]})
        doc.insert(ignore_permissions=True)
        self.assertEqual(doc.name, "test-kueche")
        doc.append("regeln", {"kriterium": "umsatz_12m_cent", "operator": "zwischen", "wert": "10", "wert_bis": "5"})
        self.assertRaises(frappe.ValidationError, doc.save)

    def test_vorschau_ohne_daten(self):
        doc = frappe.get_doc({"doctype": "PH Segment", "segment_id": "test-leer", "titel": "Leer", "zweck": "einladungen"}).insert(ignore_permissions=True)
        r = doc.vorschau(speichern=0)
        self.assertIn("empfaenger", r)
