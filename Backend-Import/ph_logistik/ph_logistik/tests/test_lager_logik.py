"""Lager-Logik ohne Site: Sperre/Kommission, Wareneingang-Zustände, Reservierungsablauf, Platz-Codes, Stückscan, Pack-Stand, Abholcode."""

import unittest
from datetime import date

from ph_logistik.ph_logistik import bestand_logik as bl
from ph_logistik.ph_logistik import packtisch_logik as pl


class TestBestandErweitert(unittest.TestCase):
    def test_verfuegbar_und_status(self):
        self.assertEqual(bl.verfuegbar(5, 1), 4)
        self.assertEqual(bl.verfuegbar(5, 0, gesperrt=1), 0)
        self.assertEqual(bl.verfuegbar(5, 0, kommission="PH-PRJ-2026-0001"), 0)
        self.assertEqual(bl.status_aus(3, 0, gesperrt=1), "Gesperrt")
        self.assertEqual(bl.status_aus(3, 0, kommission="PH-PRJ-2026-0001"), "Kommission")
        self.assertEqual(bl.status_aus(0, 0, verkauft=True, kommission="x"), "Verkauft")
        self.assertEqual(bl.status_aus(2, 2), "Reserviert")

    def test_wareneingang_zustaende(self):
        self.assertEqual(bl.einlagerung_aus_wareneingang("ok"), (True, "Neu", 0))
        self.assertEqual(bl.einlagerung_aus_wareneingang("Transportschaden"), (True, "B-Ware", 1))
        self.assertEqual(bl.einlagerung_aus_wareneingang("beschaedigt"), (True, "B-Ware", 1))
        self.assertEqual(bl.einlagerung_aus_wareneingang("falsch")[0], False)
        self.assertEqual(bl.einlagerung_aus_wareneingang("fehlt")[0], False)

    def test_reservierung_abgelaufen(self):
        self.assertTrue(bl.reservierung_abgelaufen(date(2026, 11, 3), date(2026, 11, 4)))
        self.assertFalse(bl.reservierung_abgelaufen("2026-11-04", "2026-11-04"))
        self.assertFalse(bl.reservierung_abgelaufen(None, "2026-11-04"))

    def test_platz_code(self):
        self.assertEqual(bl.platz_code("Lager Lochau", "R1-03"), "Lager Lochau/R1-03")
        self.assertEqual(bl.platz_aus_code(" Lager Lochau/R1-03 "), ("Lager Lochau", "R1-03"))
        self.assertEqual(bl.platz_aus_code("Showroom"), ("Showroom", None))
        self.assertEqual(bl.platz_aus_code(""), (None, None))
        self.assertEqual(bl.platz_aus_code("Lager/A/1"), ("Lager", "A/1"))

    def test_kommission_offen(self):
        s = bl.kommission_offen([{"menge": 2}, {"menge": 1, "gesperrt": 1}], [{"menge": 3, "menge_erhalten": 1}, {"menge": 1, "menge_erhalten": 1}])
        self.assertEqual(s, {"im_lager": 2, "gesperrt": 1, "erwartet_offen": 2, "vollstaendig": False})
        self.assertTrue(bl.kommission_offen([{"menge": 1}], [])["vollstaendig"])

    def test_zaehlen_plus(self):
        pos = [{"name": "r1", "lagerbestand": "PH-LB-00001", "seriennummer": "SN1", "ean": "400", "ist": 2}, {"name": "r2", "lagerbestand": "PH-LB-00002", "ist": 0}]
        self.assertEqual(bl.zaehlen_plus(pos, "ph-lb-00002"), ("r2", 1))
        self.assertEqual(bl.zaehlen_plus(pos, "SN1", 3), ("r1", 5))
        self.assertEqual(bl.zaehlen_plus(pos, "400", -5), ("r1", 0))
        self.assertEqual(bl.zaehlen_plus(pos, "nix"), (None, None))


class TestPacktischErweitert(unittest.TestCase):
    def test_stand_anwenden(self):
        pos = [{"name": "a", "menge": 3}, {"name": "b", "menge": 1}]
        self.assertEqual(pl.stand_anwenden(pos, {"a": 2, "b": 5, "x": 1, "c": None}), {"a": (2, False), "b": (1, True)})
        self.assertEqual(pl.stand_anwenden(pos, {"a": -1}), {"a": (0, False)})
        self.assertEqual(pl.stand_anwenden(pos, {"a": "zwei"}), {})

    def test_abholcode(self):
        self.assertTrue(pl.abholcode_passt("AB-12 34", "ab1234"))
        self.assertFalse(pl.abholcode_passt("AB1234", "AB1235"))
        self.assertFalse(pl.abholcode_passt("", ""))


if __name__ == "__main__":
    unittest.main()
