"""bench --site <site> run-tests --app ph_logistik --doctype "PH Lagerbestand" – Bestand und Bewegungen konsistent."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.ph_logistik.bestand import buche, storno
from ph_logistik.tests.helfer_test import lagerort, produkt


class TestPHLagerbestand(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.p = produkt("Testvase Bestand")
        self.lager = lagerort("Testlager")
        self.showroom = lagerort("Testshowroom", "Showroom")

    def _menge(self, ort):
        return frappe.db.get_value("PH Lagerbestand", {"produkt": self.p, "lagerort": ort, "ausstellungsstueck": 0}, ["menge", "reserviert", "verfuegbar", "status"], as_dict=True)

    def test_wareneingang_umlagerung_verkauf(self):
        b = buche("Wareneingang", self.p, 5, lagerort_nach=self.lager, idempotency_key="t-we-1")
        self.assertTrue(b.name.startswith("PH-LBW-"))
        self.assertEqual(self._menge(self.lager).menge, 5)
        self.assertEqual(buche("Wareneingang", self.p, 5, lagerort_nach=self.lager, idempotency_key="t-we-1").name, b.name)  # idempotent
        self.assertEqual(self._menge(self.lager).menge, 5)
        buche("Umlagerung", self.p, 2, lagerort_von=self.lager, lagerort_nach=self.showroom, platz_nach="EG")
        self.assertEqual((self._menge(self.lager).menge, self._menge(self.showroom).menge), (3, 2))
        buche("Verkauf", self.p, 3, lagerort_von=self.lager)
        z = self._menge(self.lager)
        self.assertEqual((z.menge, z.status), (0, "Verkauft"))
        with self.assertRaises(frappe.ValidationError):
            buche("Verkauf", self.p, 1, lagerort_von=self.lager)
        gesamt = sum(r.menge for r in frappe.get_all("PH Lagerbestand", {"produkt": self.p}, ["menge"]))
        self.assertEqual(gesamt, 2)

    def test_reservierung(self):
        buche("Wareneingang", self.p, 2, lagerort_nach=self.lager)
        bs = frappe.get_doc("PH Lagerbestand", frappe.db.get_value("PH Lagerbestand", {"produkt": self.p, "lagerort": self.lager, "ausstellungsstueck": 0}, "name"))
        bs.reservieren("PH Lagerort", self.lager, 2)
        z = self._menge(self.lager)
        self.assertEqual((z.reserviert, z.verfuegbar, z.status), (2, 0, "Reserviert"))
        bs.reload()
        bs.freigeben()
        self.assertEqual(self._menge(self.lager).status, "Verfuegbar")

    def test_storno_gegenbuchung(self):
        b = buche("Wareneingang", self.p, 4, lagerort_nach=self.lager)
        g = storno(b)
        self.assertEqual(g.art, "Ausbuchung")
        self.assertEqual(g.storno_von, b.name)
        self.assertEqual(frappe.db.get_value("PH Lagerbewegung", b.name, "status"), "Storniert")
        self.assertEqual(self._menge(self.lager).menge, 0)

    def test_ausstellungsstueck_braucht_seriennummer(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Lagerbestand", "produkt": self.p, "lagerort": self.showroom, "ausstellungsstueck": 1, "menge": 1}).insert()
        bs = frappe.get_doc({"doctype": "PH Lagerbestand", "produkt": self.p, "lagerort": self.showroom, "ausstellungsstueck": 1, "seriennummer": "SN-TEST-1", "menge": 1, "vk_cent_ausstellung": 99000}).insert()
        bs.reload()
        self.assertEqual(bs.menge, 1)  # Erstanlage wurde als Wareneingang gebucht
        self.assertEqual(bs.zustand, "Ausstellung")
        self.assertTrue(frappe.db.exists("PH Lagerbewegung", {"lagerbestand": bs.name, "art": "Wareneingang"}))
        r = bs.als_ausstellungsstueck_verkaufen()
        self.assertEqual(r["vk_cent"], 99000)
        bs.reload()
        self.assertEqual(bs.status, "Verkauft")

    def test_bewegung_loeschen_verboten(self):
        b = buche("Wareneingang", self.p, 1, lagerort_nach=self.lager)
        with self.assertRaises(frappe.ValidationError):
            frappe.delete_doc("PH Lagerbewegung", b.name)
