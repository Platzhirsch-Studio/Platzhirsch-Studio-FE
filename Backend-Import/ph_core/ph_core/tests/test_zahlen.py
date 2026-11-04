"""Tests ohne Site: python -m unittest ph_core.tests.test_zahlen (aus Backend-Import/ph_core)."""

import unittest

from ph_core.utils.zahlen import anteil_cent, betrag_text, satz_aus_prozent, satz_text, ust_aus_brutto_cent


class TestZahlen(unittest.TestCase):
    def test_satz_text(self):
        self.assertEqual(satz_text(2000), "20 %")
        self.assertEqual(satz_text(1000), "10 %")
        self.assertEqual(satz_text(1300), "13 %")
        self.assertEqual(satz_text(1950), "19,5 %")
        self.assertEqual(satz_text(0), "0 %")
        self.assertEqual(satz_text(None), "")
        self.assertEqual(satz_text("2000"), "20 %")
        self.assertEqual(satz_text(2000, mit_prozent=False), "20")

    def test_satz_aus_prozent(self):
        self.assertEqual(satz_aus_prozent("20"), 2000)
        self.assertEqual(satz_aus_prozent("19,5 %"), 1950)
        self.assertEqual(satz_aus_prozent(13.0), 1300)
        self.assertEqual(satz_aus_prozent(None), 0)

    def test_anteil_und_ust(self):
        self.assertEqual(anteil_cent(10000, 2000), 2000)
        self.assertEqual(anteil_cent(333, 2000), 67)  # 66,6 → 67
        self.assertEqual(ust_aus_brutto_cent(12000, 2000), 2000)
        self.assertEqual(ust_aus_brutto_cent(11000, 1000), 1000)
        self.assertEqual(ust_aus_brutto_cent(0, 2000), 0)

    def test_betrag_text(self):
        self.assertEqual(betrag_text(123450), "1.234,50 €")
        self.assertEqual(betrag_text(5), "0,05 €")
        self.assertEqual(betrag_text(-199), "-1,99 €")
        self.assertEqual(betrag_text(100, "CHF"), "1,00 CHF")
        self.assertEqual(betrag_text(None), "")


if __name__ == "__main__":
    unittest.main()
