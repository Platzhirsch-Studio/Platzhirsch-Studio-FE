"""Tests ohne Site: python -m unittest ph_core.tests.test_feiertage (aus Backend-Import/ph_core)."""

import unittest
from datetime import date

from ph_core.utils.feiertage import (
    arbeitstage,
    arbeitstage_addieren,
    feiertage,
    gesetzliche_feiertage,
    ist_arbeitstag,
    ist_feiertag,
    naechster_arbeitstag,
    ostersonntag,
)


class TestFeiertage(unittest.TestCase):
    def test_ostersonntag(self):
        self.assertEqual(ostersonntag(2024), date(2024, 3, 31))
        self.assertEqual(ostersonntag(2025), date(2025, 4, 20))
        self.assertEqual(ostersonntag(2026), date(2026, 4, 5))
        self.assertEqual(ostersonntag(2027), date(2027, 3, 28))

    def test_gesetzliche_feiertage_2026(self):
        f = gesetzliche_feiertage(2026)
        self.assertEqual(len(f), 13)
        self.assertEqual(f[date(2026, 4, 6)], "Ostermontag")
        self.assertEqual(f[date(2026, 5, 14)], "Christi Himmelfahrt")
        self.assertEqual(f[date(2026, 5, 25)], "Pfingstmontag")
        self.assertEqual(f[date(2026, 6, 4)], "Fronleichnam")
        self.assertNotIn(date(2026, 3, 19), f)
        self.assertNotIn(date(2026, 12, 24), f)

    def test_vorarlberg_und_betriebsruhe(self):
        f = feiertage(2026)  # Standard: Vorarlberg, Betriebsruhe
        self.assertEqual(f[date(2026, 3, 19)], "Josefstag")
        self.assertEqual(f[date(2026, 12, 24)], "Heiliger Abend")
        self.assertEqual(f[date(2026, 12, 31)], "Silvester")
        self.assertEqual(len(f), 16)
        self.assertNotIn(date(2026, 3, 19), feiertage(2026, bundesland="Wien"))
        self.assertIn(date(2026, 11, 15), feiertage(2026, bundesland="Wien"))

    def test_zusaetzlich(self):
        f = feiertage(2026, zusaetzlich=[date(2026, 8, 10), (date(2026, 8, 11), "Betriebsurlaub"), "2026-08-12", date(2027, 1, 2)])
        self.assertEqual(f[date(2026, 8, 10)], "Betriebsruhe")
        self.assertEqual(f[date(2026, 8, 11)], "Betriebsurlaub")
        self.assertIn(date(2026, 8, 12), f)
        self.assertNotIn(date(2027, 1, 2), f)

    def test_ist_arbeitstag(self):
        self.assertTrue(ist_arbeitstag(date(2026, 11, 3)))  # Dienstag
        self.assertFalse(ist_arbeitstag(date(2026, 11, 1)))  # Allerheiligen (Sonntag)
        self.assertFalse(ist_arbeitstag(date(2026, 11, 7)))  # Samstag
        self.assertTrue(ist_arbeitstag(date(2026, 11, 7), samstag=True))
        self.assertTrue(ist_feiertag("2026-10-26"))

    def test_arbeitstage(self):
        self.assertEqual(arbeitstage(date(2026, 11, 2), date(2026, 11, 6)), 5)
        self.assertEqual(arbeitstage(date(2026, 12, 21), date(2026, 12, 31)), 6)  # 24., 25., 26.(Sa), 31. fallen weg
        self.assertEqual(arbeitstage(date(2026, 11, 6), date(2026, 11, 2)), 0)
        self.assertEqual(arbeitstage("2026-05-01", "2026-05-01"), 0)

    def test_arbeitstage_addieren(self):
        self.assertEqual(arbeitstage_addieren(date(2026, 11, 6), 1), date(2026, 11, 9))  # Fr → Mo
        self.assertEqual(arbeitstage_addieren(date(2026, 12, 23), 2), date(2026, 12, 29))
        self.assertEqual(arbeitstage_addieren(date(2026, 11, 7), 0), date(2026, 11, 9))
        self.assertEqual(naechster_arbeitstag(date(2026, 1, 1)), date(2026, 1, 2))


if __name__ == "__main__":
    unittest.main()
