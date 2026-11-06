"""UrlG-Logik ohne Site: cd Backend-Import/ph_personal && PYTHONPATH=. python -m unittest discover -s ph_personal/tests -t ."""

import unittest
from datetime import date

from ph_personal.utils.urlaub import (
    aliquot_bis_austritt,
    anspruch_arbeitstage,
    anspruch_urlaubsjahr,
    anspruch_wochen,
    arbeitstage_zu_werktage,
    dienstjahre,
    ersatzleistung_tage,
    rest_umrechnen,
    tage_aufteilen,
    tage_pro_woche,
    urlaubsjahr,
    urlaubsjahre,
    verbrauch_fifo,
    verfuegbar_am,
    verjaehrt_am,
    werktage_zu_arbeitstage,
)


class TestAnspruch(unittest.TestCase):
    def test_werktage_arbeitstage(self):
        self.assertEqual(werktage_zu_arbeitstage(30, 5), 25.0)
        self.assertEqual(werktage_zu_arbeitstage(36, 5), 30.0)
        self.assertEqual(arbeitstage_zu_werktage(25, 5), 30.0)
        self.assertEqual(werktage_zu_arbeitstage(30, 4), 20.0)

    def test_tage_pro_woche_und_anspruch(self):
        self.assertEqual(tage_pro_woche([480, 480, 0, 480, 480, 480, 0]), 5)
        self.assertEqual(anspruch_arbeitstage(5), 25.0)
        self.assertEqual(anspruch_arbeitstage(3), 15.0)
        self.assertEqual(anspruch_arbeitstage(5, 6), 30.0)

    def test_25_dienstjahre(self):
        self.assertEqual(anspruch_wochen(date(2000, 3, 1), date(2025, 2, 28)), 5)
        self.assertEqual(anspruch_wochen(date(2000, 3, 1), date(2025, 3, 1)), 6)
        # Vordienstzeiten max. 5 Jahre
        self.assertEqual(dienstjahre(date(2010, 1, 1), date(2030, 1, 1), 9), 25)

    def test_urlaubsjahr_arbeitsjahr(self):
        self.assertEqual(urlaubsjahr(date(2024, 4, 15), date(2026, 11, 4)), (date(2026, 4, 15), date(2027, 4, 14)))
        self.assertEqual(urlaubsjahr(date(2024, 4, 15), date(2026, 4, 14)), (date(2025, 4, 15), date(2026, 4, 14)))
        self.assertEqual(urlaubsjahr(date(2024, 4, 15), date(2026, 4, 1), "Kalenderjahr"), (date(2026, 1, 1), date(2026, 12, 31)))
        self.assertEqual(urlaubsjahr(date(2026, 4, 15), date(2026, 6, 1), "Kalenderjahr"), (date(2026, 4, 15), date(2026, 12, 31)))

    def test_urlaubsjahre_ueber_grenze(self):
        jahre = urlaubsjahre(date(2020, 1, 1), date(2026, 12, 28), date(2027, 1, 5), "Kalenderjahr")
        self.assertEqual(len(jahre), 2)

    def test_erstes_jahr_aliquot(self):
        a = anspruch_urlaubsjahr(date(2026, 3, 1), date(2026, 3, 1), date(2027, 2, 28), 5)
        self.assertEqual(a["anspruch"], 25.0)
        self.assertEqual(a["aliquot_bis"], date(2026, 8, 31))
        # nach 2 Monaten: 61/365 × 25
        self.assertAlmostEqual(verfuegbar_am(25, date(2026, 3, 1), a["aliquot_bis"], date(2026, 4, 30)), 4.18, places=2)
        self.assertEqual(verfuegbar_am(25, date(2026, 3, 1), a["aliquot_bis"], date(2026, 9, 1)), 25.0)

    def test_kalenderjahr_rumpfjahr(self):
        a = anspruch_urlaubsjahr(date(2026, 7, 1), date(2026, 7, 1), date(2026, 12, 31), 5, modus="Kalenderjahr")
        self.assertAlmostEqual(a["anspruch"], 12.6, places=1)

    def test_verjaehrung(self):
        self.assertEqual(verjaehrt_am(date(2026, 12, 31)), date(2028, 12, 31))


class TestVerbrauch(unittest.TestCase):
    def _konten(self):
        return [
            {"schluessel": "2025", "von": date(2025, 1, 1), "bis": date(2025, 12, 31), "anspruch": 25, "verjaehrt_am": date(2027, 12, 31)},
            {"schluessel": "2026", "von": date(2026, 1, 1), "bis": date(2026, 12, 31), "anspruch": 25, "verjaehrt_am": date(2028, 12, 31)},
        ]

    def test_fifo_aeltester_zuerst(self):
        buch = [(date(2025, 6, d), 1) for d in range(2, 22)] + [(date(2026, 2, d), 1) for d in range(2, 12)]
        s = verbrauch_fifo(self._konten(), buch)
        self.assertEqual(s["2025"]["rest"], 0.0)
        self.assertEqual(s["2026"]["rest"], 20.0)

    def test_vorgriff(self):
        konten = self._konten()[1:]
        s = verbrauch_fifo(konten, [(date(2026, 3, d), 1) for d in range(1, 31)])
        self.assertEqual(s["2026"]["rest"], -5.0)
        self.assertEqual(s["2026"]["vorgriff"], 5.0)

    def test_verjaehrter_rest_wird_nicht_genutzt(self):
        konten = [
            {"schluessel": "2023", "von": date(2023, 1, 1), "bis": date(2023, 12, 31), "anspruch": 5, "verjaehrt_am": date(2025, 12, 31)},
            {"schluessel": "2026", "von": date(2026, 1, 1), "bis": date(2026, 12, 31), "anspruch": 25, "verjaehrt_am": date(2028, 12, 31)},
        ]
        s = verbrauch_fifo(konten, [(date(2026, 1, 5), 1)])
        self.assertEqual(s["2023"]["rest"], 5.0)
        self.assertEqual(s["2026"]["rest"], 24.0)

    def test_tage_aufteilen(self):
        jahre = [(date(2026, 1, 1), date(2026, 12, 31)), (date(2027, 1, 1), date(2027, 12, 31))]
        t = tage_aufteilen([(date(2026, 12, 29), 1), (date(2026, 12, 30), 1), (date(2027, 1, 4), 1)], jahre)
        self.assertEqual(t[jahre[0]], 2.0)
        self.assertEqual(t[jahre[1]], 1.0)


class TestAustritt(unittest.TestCase):
    def test_aliquot(self):
        self.assertAlmostEqual(aliquot_bis_austritt(25, date(2026, 1, 1), date(2026, 12, 31), date(2026, 6, 30)), 12.4, places=1)

    def test_ersatzleistung(self):
        # 3 Tage Rest Vorjahr + aliquot 12,4 − 10 verbraucht
        self.assertAlmostEqual(ersatzleistung_tage([3], 25, date(2026, 1, 1), date(2026, 12, 31), date(2026, 6, 30), 10), 5.4, places=1)
        # zu viel verbraucht → negativ
        self.assertLess(ersatzleistung_tage([], 25, date(2026, 1, 1), date(2026, 12, 31), date(2026, 3, 31), 15), 0)

    def test_teilzeit_umrechnen(self):
        self.assertEqual(rest_umrechnen(10, 5, 3), 6.0)


if __name__ == "__main__":
    unittest.main()
