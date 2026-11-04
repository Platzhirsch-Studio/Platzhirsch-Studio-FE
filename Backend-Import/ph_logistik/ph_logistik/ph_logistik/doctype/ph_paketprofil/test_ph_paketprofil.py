"""bench --site <site> run-tests --app ph_logistik --doctype "PH Paketprofil" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.ph_logistik.doctype.ph_paketprofil.ph_paketprofil import profile_map, vorschlag_fuer
from ph_logistik.tests.helfer_test import paketprofile


class TestPHPaketprofil(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        paketprofile()

    def test_installation_idempotent_und_werte(self):
        paketprofile()
        self.assertEqual(frappe.db.count("PH Paketprofil", {"beispiel": 1}), 29)
        k = frappe.get_doc("PH Paketprofil", "karaffe")
        self.assertEqual((k.laenge_cm, k.breite_cm, k.hoehe_cm, k.gewicht_g), (53, 39, 39, 2950))
        self.assertEqual(k.glas, 1)
        self.assertEqual(k.geprueft, 0)
        self.assertTrue(frappe.db.get_value("PH Paketprofil", "parfum", "versand_gesperrt"))
        self.assertEqual(frappe.db.count("PH Paketprofil", {"familie": "glas", "standard": 1}), 1)

    def test_validierung_sortiert_masse(self):
        p = frappe.get_doc({"doctype": "PH Paketprofil", "key": "Test Karton", "bezeichnung": "Test", "familie": "sonstige", "laenge_cm": 10, "breite_cm": 40, "hoehe_cm": 20, "gewicht_g": 500, "glas": 1}).insert()
        self.assertEqual(p.name, "test-karton")
        self.assertEqual((p.laenge_cm, p.breite_cm, p.hoehe_cm), (40, 20, 10))
        self.assertEqual(p.zerbrechlich, 1)
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Paketprofil", "key": "kaputt", "bezeichnung": "x", "laenge_cm": 0, "breite_cm": 1, "hoehe_cm": 1, "gewicht_g": 1}).insert()

    def test_vorschlag(self):
        self.assertEqual(vorschlag_fuer({"paketprofil": "vase-gross"}), "vase-gross")
        self.assertEqual(vorschlag_fuer({"kategorie": "duftkerze"}), "kerze-klein")
        self.assertIsNone(vorschlag_fuer({"kategorie": "moebel-xy"}))
        self.assertIn("glas-1", profile_map())
