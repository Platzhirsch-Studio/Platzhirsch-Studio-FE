"""Tests ohne Site: BAO-Frist und Anonymisierungsentscheidung."""

import datetime
import unittest

from ph_shop import aufbewahrung as ab


class TestAufbewahrung(unittest.TestCase):
    def test_bao_frist(self):
        self.assertEqual(ab.bao_frist_ende("2026-03-15"), datetime.date(2033, 12, 31))
        self.assertEqual(ab.bao_frist_ende(datetime.datetime(2026, 12, 31, 23, 0)), datetime.date(2033, 12, 31))
        self.assertIsNone(ab.bao_frist_ende(None))

    def test_entscheidung(self):
        self.assertEqual(ab.entscheidung("2026-03-15", heute="2033-12-31")[0], "aufbewahren")
        self.assertEqual(ab.entscheidung("2026-03-15", heute="2034-01-01")[0], "anonymisieren")
        self.assertEqual(ab.entscheidung("2010-01-01", heute="2034-01-01", restwert_cent=100)[0], "aufbewahren")
        self.assertEqual(ab.entscheidung("2010-01-01", heute="2034-01-01", verfahren_offen=True)[0], "aufbewahren")

    def test_anonym_werte(self):
        w = ab.anonym_werte(("kunde_name", "kunde_telefon"), email_feld="kunde_email")
        self.assertEqual(w["kunde_name"], ab.ANONYM)
        self.assertIsNone(w["kunde_telefon"])
        self.assertIn("@", w["kunde_email"])


if __name__ == "__main__":
    unittest.main()
