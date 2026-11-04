"""bench --site <site> run-tests --app ph_logistik --doctype "PH Inventur" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_logistik.ph_logistik.bestand import buche
from ph_logistik.tests.helfer_test import lagerort, produkt


class TestPHInventur(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.lager = lagerort("Inventurlager")
        self.p1 = produkt("Inventur Vase")
        self.p2 = produkt("Inventur Kerze")
        buche("Wareneingang", self.p1, 3, lagerort_nach=self.lager)
        buche("Wareneingang", self.p2, 1, lagerort_nach=self.lager)

    def test_zaehlliste_zaehlen_freigeben(self):
        inv = frappe.get_doc({"doctype": "PH Inventur", "lagerort": self.lager, "datum": nowdate()}).insert()
        self.assertEqual(inv.status, "Geplant")
        self.assertIn("Inventurlager", inv.titel)
        n = inv.zaehlliste_erzeugen()
        self.assertGreaterEqual(n, 2)
        inv.starten()
        inv.reload()
        self.assertEqual(inv.status, "Laufend")
        zeile = next(p for p in inv.positionen if p.produkt == self.p1)
        self.assertEqual(zeile.soll, 3)
        self.assertEqual(inv.zaehlen(zeile.lagerbestand, 2), -1)
        zeile2 = next(p for p in inv.positionen if p.produkt == self.p2)
        inv.zaehlen(zeile2.lagerbestand, 1)
        inv.reload()
        self.assertEqual(inv.differenz_positionen, 1)
        self.assertEqual(inv.differenz_summe, -1)
        gebucht = inv.freigeben()
        self.assertEqual(gebucht, 1)
        inv.reload()
        self.assertEqual(inv.status, "Abgeschlossen")
        self.assertTrue(inv.freigegeben_am)
        self.assertEqual(frappe.db.get_value("PH Lagerbestand", zeile.lagerbestand, "menge"), 2)
        self.assertTrue(frappe.db.exists("PH Lagerbewegung", {"art": "Inventur", "bezug": inv.name, "lagerbestand": zeile.lagerbestand}))
        self.assertEqual(str(frappe.db.get_value("PH Lagerbestand", zeile2.lagerbestand, "inventur_am")), nowdate())
        # Freigabe ist idempotent (gleicher Schlüssel) – kein doppeltes Buchen
        self.assertEqual(frappe.db.count("PH Lagerbewegung", {"art": "Inventur", "bezug": inv.name}), 1)

    def test_freigabe_nur_laufend(self):
        inv = frappe.get_doc({"doctype": "PH Inventur", "lagerort": self.lager, "datum": nowdate()}).insert()
        with self.assertRaises(frappe.ValidationError):
            inv.freigeben()
        inv.verwerfen()
        self.assertEqual(frappe.db.get_value("PH Inventur", inv.name, "status"), "Verworfen")
