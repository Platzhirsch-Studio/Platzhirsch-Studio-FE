"""API-Methoden mit Site (bench run-tests --app ph_logistik): get_shipping_quote, create_shipment, get_tracking – mit Mock-LetMeShip."""

import unittest

try:
    import frappe
    from frappe.tests.utils import FrappeTestCase
except ImportError:  # ohne Bench/Site (python -m unittest discover) überspringen
    raise unittest.SkipTest("Frappe-Site nötig (bench run-tests)")

from ph_logistik.api import create_shipment, get_shipping_quote, get_tracking
from ph_logistik.tests.helfer_test import lieferschein, paketprofile, testmodus


class TestAPI(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        paketprofile()
        testmodus()

    def test_quote_wie_website(self):
        r = get_shipping_quote(zeilen=[{"slug": "riedel-veritas", "name": "Riedel Veritas", "menge": 2, "paketprofil": "glas-2er-set", "kategorie": "glas"}], ziel={"land": "AT", "plz": "6900", "ort": "Bregenz"}, warenwert_cent=11800)
        self.assertTrue(r["ok"])
        self.assertEqual(r["quelle"], "mock")
        self.assertTrue(r["versichert"])
        self.assertTrue(r["zerbrechlich"])
        self.assertEqual(r["cent"], 700)  # MOCK AT Standard 500 + Versicherung 200
        self.assertTrue(r["tarifId"].startswith("q-"))
        self.assertIn("dienst", r)
        self.assertEqual(r["dienst"]["carrier"], "MOCK-Carrier")

    def test_quote_fehler(self):
        self.assertEqual(get_shipping_quote(zeilen=[], ziel={"land": "AT", "plz": "1", "ort": "x"})["fehler"], "leer")
        self.assertEqual(get_shipping_quote(zeilen=[{"menge": 1, "paketprofil": "glas-1"}], ziel={"land": "CH", "plz": "8000", "ort": "Zürich"})["fehler"], "land_ch")
        r = get_shipping_quote(zeilen=[{"menge": 1, "paketprofil": "parfum", "kategorie": "parfum"}], ziel={"land": "AT", "plz": "6900", "ort": "Bregenz"})
        self.assertEqual(r["fehler"], "profil_fehlt")
        self.assertEqual(r["gesperrt"], ["parfum"])
        r = get_shipping_quote(zeilen=[{"menge": 1, "kategorie": "moebel"}], ziel={"land": "AT", "plz": "6900", "ort": "Bregenz"})
        self.assertEqual(r["fehler"], "profil_fehlt")

    def test_create_shipment_und_tracking_idempotent(self):
        ls = lieferschein()
        ls.scan("4001234567890")
        ls.scan("4001234567890")
        ls.pakete_vorschlagen()
        r = create_shipment(lieferschein=ls.name, idempotency_key="t-ship-1")
        self.assertEqual(r["status"], "Etikett")
        self.assertTrue(r["tracking_nr"])
        r2 = create_shipment(lieferschein=ls.name, idempotency_key="t-ship-2")
        self.assertEqual(r2["sendung"], r["sendung"])  # bestehende aktive Sendung wird zurückgegeben
        t = get_tracking(referenz=ls.name)
        self.assertEqual(t["status"], "Etikett")
        self.assertEqual(t["carrier"], "MOCK-Carrier")
        self.assertNotIn("empf_email", t)
        self.assertEqual(get_tracking(referenz="gibt-es-nicht").get("code"), "not_found")

    def test_create_shipment_mit_quote_id(self):
        q = get_shipping_quote(zeilen=[{"name": "Bildband", "menge": 1, "paketprofil": "bildband-klein"}], ziel={"land": "DE", "plz": "88131", "ort": "Lindau"}, warenwert_cent=8000)
        ls = lieferschein(liefer_land="DE", liefer_plz="88131", liefer_ort="Lindau", positionen=[{"beschreibung": "Bildband", "menge": 1, "einzel_cent": 8000}])
        ls.position_packen(ls.positionen[0].name)
        r = create_shipment(lieferschein=ls.name, tarif_id=q["tarifId"])
        self.assertEqual(r["status"], "Etikett")
        s = frappe.get_doc("PH Sendung", r["sendung"])
        self.assertEqual(s.service_id, "mock-de-standard")
        self.assertEqual(s.anzahl_pakete, 1)
