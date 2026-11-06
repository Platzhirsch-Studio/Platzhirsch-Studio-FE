"""Tests ohne Site: cd Backend-Import/ph_kundenkarte && PYTHONPATH=. python -m unittest discover -s ph_kundenkarte/tests -t ."""

import unittest
from datetime import date, datetime

from ph_kundenkarte.utils import stufen as st

STUFEN = [
    {"name": "Platzhirsch", "reihenfolge": 1, "schwelle_jahresumsatz_cent": 0},
    {"name": "Platzhirsch Plus", "reihenfolge": 2, "schwelle_jahresumsatz_cent": 1_000_000},
    {"name": "Platzhirsch Privé", "reihenfolge": 3, "schwelle_jahresumsatz_cent": 5_000_000},
]


class TestStufen(unittest.TestCase):
    def test_stufe_fuer_umsatz(self):
        self.assertEqual(st.stufe_fuer_umsatz(STUFEN, 0), "Platzhirsch")
        self.assertEqual(st.stufe_fuer_umsatz(STUFEN, 999_999), "Platzhirsch")
        self.assertEqual(st.stufe_fuer_umsatz(STUFEN, 1_000_000), "Platzhirsch Plus")
        self.assertEqual(st.stufe_fuer_umsatz(STUFEN, 7_000_000), "Platzhirsch Privé")
        self.assertEqual(st.stufe_fuer_umsatz(reversed(STUFEN), 1_500_000), "Platzhirsch Plus")
        self.assertIsNone(st.stufe_fuer_umsatz([], 100))
        # Keine Schwelle erreicht → niedrigste Stufe (auch wenn ihre Schwelle > 0 ist)
        self.assertEqual(st.stufe_fuer_umsatz(STUFEN[1:], 5), "Platzhirsch Plus")

    def test_naechste_stufe_und_fehlt_noch(self):
        self.assertEqual(st.naechste_stufe(STUFEN, "Platzhirsch")["name"], "Platzhirsch Plus")
        self.assertIsNone(st.naechste_stufe(STUFEN, "Platzhirsch Privé"))
        self.assertEqual(st.fehlt_noch_cent(STUFEN, "Platzhirsch", 250_000), 750_000)
        self.assertEqual(st.fehlt_noch_cent(STUFEN, "Platzhirsch", 1_200_000), 0)
        self.assertIsNone(st.fehlt_noch_cent(STUFEN, "Platzhirsch Privé", 0))

    def test_aufstufung_sofort(self):
        heute = date(2026, 11, 4)
        self.assertEqual(st.zielstufe(STUFEN, "Platzhirsch", 1_000_000, date(2026, 10, 1), heute), "Platzhirsch Plus")
        self.assertEqual(st.zielstufe(STUFEN, None, 5_000_000, None, heute), "Platzhirsch Privé")

    def test_herabstufung_nur_erlaubt_und_nach_zeitraum(self):
        heute = date(2026, 11, 4)
        # nicht erlaubt → Stufe bleibt
        self.assertEqual(st.zielstufe(STUFEN, "Platzhirsch Plus", 0, date(2024, 1, 1), heute, 12, False), "Platzhirsch Plus")
        # erlaubt, aber Zeitraum nicht abgelaufen → bleibt
        self.assertEqual(st.zielstufe(STUFEN, "Platzhirsch Plus", 0, date(2026, 6, 1), heute, 12, True), "Platzhirsch Plus")
        # erlaubt und abgelaufen → berechnete Stufe
        self.assertEqual(st.zielstufe(STUFEN, "Platzhirsch Plus", 0, date(2025, 11, 4), heute, 12, True), "Platzhirsch")
        self.assertEqual(st.zielstufe(STUFEN, "Platzhirsch Privé", 1_500_000, date(2025, 1, 1), heute, 12, True), "Platzhirsch Plus")

    def test_monate_und_zeitraum(self):
        self.assertEqual(st.monate_addieren(date(2026, 1, 31), 1), date(2026, 2, 28))
        self.assertEqual(st.monate_addieren(date(2026, 3, 31), -1), date(2026, 2, 28))
        self.assertEqual(st.zeitraum_beginn(date(2026, 11, 4), 12), date(2025, 11, 4))
        self.assertEqual(st.zeitraum_beginn(date(2026, 11, 4), 6), date(2026, 5, 4))

    def test_summe_und_letzter_einkauf(self):
        belege = [
            {"datum": date(2025, 10, 1), "betrag_cent": 100_000},
            {"datum": datetime(2026, 3, 1, 10, 0), "betrag_cent": 250_000},
            {"datum": date(2026, 6, 1), "betrag_cent": -50_000},  # Storno
            {"datum": None, "betrag_cent": 999_999},
        ]
        self.assertEqual(st.summe_im_zeitraum(belege), 300_000)
        self.assertEqual(st.summe_im_zeitraum(belege, von=date(2025, 11, 4)), 200_000)
        self.assertEqual(st.summe_im_zeitraum(belege, von=date(2025, 11, 4), bis=date(2026, 5, 1)), 250_000)
        self.assertEqual(st.letzter_einkauf(belege), date(2026, 3, 1))
        self.assertIsNone(st.letzter_einkauf([]))


if __name__ == "__main__":
    unittest.main()
