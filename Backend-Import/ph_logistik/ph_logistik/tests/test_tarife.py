"""Reine Tarif-Logik ohne Site: cd Backend-Import/ph_logistik && python -m unittest discover -s ph_logistik/tests -t ."""

import unittest

from ph_logistik.letmeship.tarife import abrechnungsgewicht_g, kunden_cent, pakete_pruefen, party, shipment_details, tarife_normalisieren, telefon_teile, tracking_link, waehle_dienst

SERVICES = [
    {"baseServiceDetails": {"id": "s1", "carrier": "DPD", "name": "Classic", "transferTime": 2, "priceInfo": {"netPrice": 5.0, "totalPrice": 6.0}}},
    {"baseServiceDetails": {"id": "s2", "carrier": "UPS", "name": "Express", "transferTime": 1, "priceInfo": {"netPrice": 10.0}}},
    {"baseServiceDetails": {"id": "s3", "carrier": "GLS", "name": "Ohne Preis", "priceInfo": {}}},
    {"baseServiceDetails": {"id": "s4", "carrier": "Post", "name": "Standard", "transferTime": 3, "priceInfo": {"totalPrice": 5.5}}},
]


class TestTarife(unittest.TestCase):
    def test_kunden_cent_brutto_vor_netto(self):
        self.assertEqual(kunden_cent({"netPrice": 5.0, "totalPrice": 6.0}), 600)
        self.assertEqual(kunden_cent({"netPrice": 10.0}, ust_promille=200), 1200)
        self.assertEqual(kunden_cent({"netPrice": 10.0}, aufschlag_cent=50), 1250)
        self.assertIsNone(kunden_cent({}))
        self.assertIsNone(kunden_cent(None))

    def test_normalisieren_verwirft_ohne_preis(self):
        t = tarife_normalisieren(SERVICES)
        self.assertEqual([x["id"] for x in t], ["s1", "s2", "s4"])
        self.assertEqual(t[1]["cent"], 1200)
        self.assertEqual(t[0]["tage"], 2)

    def test_wahl_guenstigster_schnellster_bevorzugt(self):
        t = tarife_normalisieren(SERVICES)
        self.assertEqual(waehle_dienst(t, "guenstigster")["id"], "s4")
        self.assertEqual(waehle_dienst(t, "schnellster")["id"], "s2")
        self.assertEqual(waehle_dienst(t, "bevorzugt", ["GLS", "dpd"])["id"], "s1")
        self.assertEqual(waehle_dienst(t, "bevorzugt", ["Hermes"])["id"], "s4")
        self.assertIsNone(waehle_dienst([], "guenstigster"))

    def test_party_und_telefon(self):
        p = party({"name": "Anna Maria Muster", "firma": "Muster GmbH Sehr Lange Firmenbezeichnung AG", "telefon": "+43 5574 46255", "land": "AT", "plz": "6911", "ort": "Lochau", "strasse": "Landstraße", "hausnr": "11"})
        self.assertEqual(p["person"], {"firstname": "Anna", "lastname": "Maria Muster"})
        self.assertEqual(len(p["company"]), 30)
        self.assertEqual(p["phone"], {"phoneNumberPrefix": "+43", "phoneNumber": "557446255"})
        self.assertEqual(p["address"]["countryCode"], "AT")
        self.assertEqual(telefon_teile(None), ("", ""))

    def test_shipment_details_einheiten(self):
        d = shipment_details([{"laenge_cm": 30.2, "breite_cm": 20, "hoehe_cm": 15, "gewicht_g": 1234, "menge": 2, "inhalt": "x" * 50}], True, 12345, "2026-11-05")
        self.assertEqual(d["parcelList"][0]["length"], 31)
        self.assertEqual(d["parcelList"][0]["weight"], 1.234)
        self.assertEqual(d["parcelList"][0]["quantity"], 2)
        self.assertEqual(len(d["parcelList"][0]["contentDescription"]), 35)
        self.assertEqual(d["goodsValue"], 123.45)
        self.assertTrue(d["shipmentSettings"]["insurance"])
        self.assertEqual(d["pickupInterval"]["date"], "2026-11-05")

    def test_pakete_pruefen_und_volumengewicht(self):
        self.assertEqual(pakete_pruefen([{"laenge_cm": 10, "breite_cm": 10, "hoehe_cm": 10, "gewicht_g": 100}, {"laenge_cm": 0}]), [2])
        self.assertEqual(abrechnungsgewicht_g({"laenge_cm": 50, "breite_cm": 50, "hoehe_cm": 50, "gewicht_g": 3000}), 25000)
        self.assertEqual(abrechnungsgewicht_g({"laenge_cm": 10, "breite_cm": 10, "hoehe_cm": 10, "gewicht_g": 3000}), 3000)

    def test_tracking_link(self):
        self.assertIn("dhl.com", tracking_link("DHL Paket", "123"))
        self.assertIn("post.at", tracking_link("Österreichische Post", "A B"))
        self.assertIsNone(tracking_link("Unbekannt", "1"))
        self.assertIsNone(tracking_link("DHL", None))


if __name__ == "__main__":
    unittest.main()
