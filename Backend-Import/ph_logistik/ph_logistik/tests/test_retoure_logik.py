"""Retourenlabel (Integration Runde 3) – Plan, Pakete, Mock ohne Netz – ohne Frappe."""

import unittest

from ph_logistik.letmeship import ShippingError
from ph_logistik.letmeship.mock import MockClient
from ph_logistik.letmeship.retoure import STANDARD_PAKET, adresse_fehlt, retoure_pakete, retoure_plan
from ph_logistik.letmeship.tarife import tarife_normalisieren

KUNDE = {"name": "Anna Muster", "strasse": "Seestraße", "hausnr": "1", "plz": "6900", "ort": "Bregenz", "land": "at"}
SHOWROOM = {"name": "Platzhirsch Home Living", "firma": "Platzhirsch Home Living", "strasse": "Landstraße", "hausnr": "11", "plz": "6911", "ort": "Lochau", "land": "AT"}
PAKETE = [{"laenge_cm": 60, "breite_cm": 40, "hoehe_cm": 30, "gewicht_g": 4000, "inhalt": "Vase"}, {"laenge_cm": 30, "breite_cm": 30, "hoehe_cm": 30, "gewicht_g": 2000, "inhalt": "Kissen"}]


class TestRetourePlan(unittest.TestCase):
    def test_richtung_kunde_an_absender(self):
        p = retoure_plan(KUNDE, SHOWROOM, PAKETE, ["AT", "DE"], "LS-2026-00001")
        self.assertEqual(p["von"]["ort"], "Bregenz")
        self.assertEqual(p["von"]["land"], "AT")
        self.assertEqual(p["nach"]["ort"], "Lochau")
        self.assertTrue(p["referenz"].startswith("RET "))
        self.assertLessEqual(len(p["referenz"]), 35)

    def test_adresse_unvollstaendig(self):
        self.assertEqual(adresse_fehlt({**KUNDE, "plz": ""}), ["plz"])
        with self.assertRaises(ShippingError) as cm:
            retoure_plan({**KUNDE, "strasse": ""}, SHOWROOM, PAKETE)
        self.assertEqual(cm.exception.code, "adresse")
        with self.assertRaises(ShippingError):
            retoure_plan(KUNDE, {**SHOWROOM, "ort": ""}, PAKETE)

    def test_land_nicht_erlaubt(self):
        with self.assertRaises(ShippingError) as cm:
            retoure_plan({**KUNDE, "land": "CH"}, SHOWROOM, PAKETE, ["AT", "DE"])
        self.assertEqual(cm.exception.code, "land")


class TestRetourePakete(unittest.TestCase):
    def test_alle_bei_voller_ruecknahme(self):
        p = retoure_pakete(PAKETE, 4, 4)
        self.assertEqual(len(p), 2)
        self.assertTrue(p[0]["inhalt"].startswith("Retoure"))

    def test_anteilig_mindestens_eins(self):
        self.assertEqual(len(retoure_pakete(PAKETE, 4, 1)), 1)
        self.assertEqual(len(retoure_pakete(PAKETE, 3, 2)), 2)

    def test_ohne_pakete_standard(self):
        self.assertEqual(retoure_pakete([], 1, 1), [STANDARD_PAKET])
        self.assertEqual(retoure_pakete([{"gewicht_g": 0}]), [STANDARD_PAKET])

    def test_original_unveraendert(self):
        retoure_pakete(PAKETE)
        self.assertEqual(PAKETE[0]["inhalt"], "Vase")


class TestRetoureMock(unittest.TestCase):
    def test_mock_bucht_ohne_netz(self):
        plan = retoure_plan(KUNDE, SHOWROOM, retoure_pakete(PAKETE), ["AT"], "WR-1")
        c = MockClient()
        roh = c.verfuegbar(plan["von"], plan["nach"], plan["pakete"], False, 0, "2026-11-05")
        tarife = tarife_normalisieren(roh.get("serviceList"), 0, 200)
        self.assertTrue(tarife)
        r = c.sendung_anlegen(plan["von"], plan["nach"], plan["pakete"], False, 0, "2026-11-05", {"baseServiceDetails": {"id": tarife[0]["id"], "carrier": tarife[0]["carrier"]}}, plan["referenz"])
        self.assertTrue(r["shipmentId"].startswith("mock-"))
        self.assertTrue(c.etikett(r["shipmentId"]).startswith(b"%PDF"))


if __name__ == "__main__":
    unittest.main()
