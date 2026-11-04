"""Tests ohne Site: cd Backend-Import/ph_sortiment && python -m unittest discover -s ph_sortiment/tests -t ."""

import unittest
from datetime import date

from ph_sortiment.logik.preise import ab_preis_cent, abweichung_prozent, gueltig_bis, gueltiger_preis, plus_monate, preisliste_zeilen_pruefen, to_cent, veraltet


class TestPreise(unittest.TestCase):
    def test_to_cent(self):
        self.assertEqual(to_cent(79.9), 7990)
        self.assertEqual(to_cent("2.490,00"), 249000)
        self.assertEqual(to_cent("12,5"), 1250)
        self.assertEqual(to_cent(0.005), 1)
        self.assertIsNone(to_cent(None))

    def test_plus_monate_monatsende(self):
        self.assertEqual(plus_monate(date(2026, 1, 31), 1), date(2026, 2, 28))
        self.assertEqual(plus_monate(date(2026, 11, 4), 3), date(2027, 2, 4))
        self.assertEqual(plus_monate(date(2026, 11, 4), -3), date(2026, 8, 4))

    def test_hoechstalter_verkaufspreis_3_uvp_6(self):
        self.assertEqual(gueltig_bis("2026-10-31", "Verkaufspreis"), date(2027, 1, 31))
        self.assertEqual(gueltig_bis("2026-10-31", "UVP"), date(2027, 4, 30))
        self.assertFalse(veraltet("2026-10-31", "Verkaufspreis", heute="2027-01-31"))
        self.assertTrue(veraltet("2026-10-31", "Verkaufspreis", heute="2027-02-01"))
        self.assertTrue(veraltet(None, "UVP", heute="2026-11-04"))

    def test_gueltiger_preis_juengster_ab_bis_heute(self):
        preise = [
            {"ab": "2026-09-01", "stand": "2026-09-01", "brutto_cent": 10000, "preisart": "Verkaufspreis", "freigegeben": 1},
            {"ab": "2026-10-15", "stand": "2026-10-15", "brutto_cent": 11000, "preisart": "Verkaufspreis", "freigegeben": 1},
            {"ab": "2027-01-01", "stand": "2026-10-15", "brutto_cent": 12000, "preisart": "Verkaufspreis", "freigegeben": 1},  # Zukunft
            {"ab": "2026-10-20", "stand": "2026-10-20", "brutto_cent": 9000, "preisart": "Verkaufspreis", "freigegeben": 0},  # nicht freigegeben
        ]
        self.assertEqual(gueltiger_preis(preise, heute="2026-11-04")["brutto_cent"], 11000)
        self.assertEqual(gueltiger_preis(preise, heute="2027-01-02")["brutto_cent"], 12000)
        # Nach 3 Monaten ist der Stand 2026-10-15 veraltet → kein Preis
        self.assertIsNone(gueltiger_preis(preise[:2], heute="2027-02-01"))

    def test_ausfuehrung_mit_rueckfall(self):
        preise = [
            {"ab": "2026-10-01", "stand": "2026-10-01", "brutto_cent": 5000, "preisart": "Verkaufspreis", "freigegeben": 1},
            {"ab": "2026-10-01", "stand": "2026-10-01", "brutto_cent": 6500, "preisart": "Verkaufspreis", "freigegeben": 1, "ausfuehrung": "x::g::gross"},
        ]
        self.assertEqual(gueltiger_preis(preise, "2026-11-04", "x::g::gross")["brutto_cent"], 6500)
        self.assertEqual(gueltiger_preis(preise, "2026-11-04", "x::g::klein")["brutto_cent"], 5000)
        self.assertEqual(ab_preis_cent(preise, "2026-11-04"), 5000)

    def test_preisliste_pruefung_schwelle(self):
        zeilen = [
            {"produkt": "a", "alt_cent": 10000, "neu_cent": 11000},
            {"produkt": "b", "alt_cent": 10000, "neu_cent": 12000},
            {"produkt": None, "alt_cent": None, "neu_cent": 500},
            {"produkt": "c", "alt_cent": None, "neu_cent": 700},
        ]
        n, auffaellig = preisliste_zeilen_pruefen(zeilen, 15)
        self.assertEqual((n, auffaellig), (4, 1))
        self.assertEqual(zeilen[0]["abweichung_prozent"], 10.0)
        self.assertNotIn("uebernehmen", zeilen[0])
        self.assertEqual(zeilen[1]["uebernehmen"], 0)
        self.assertEqual(zeilen[2]["uebernehmen"], 0)
        self.assertIn("erster Preis", zeilen[3]["hinweis"])
        self.assertEqual(abweichung_prozent(200, 150), -25.0)


if __name__ == "__main__":
    unittest.main()
