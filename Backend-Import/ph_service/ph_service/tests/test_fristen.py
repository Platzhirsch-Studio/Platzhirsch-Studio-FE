"""Tests ohne Site: cd Backend-Import/ph_service && python -m unittest ph_service.tests.test_fristen"""

import unittest
from datetime import date

from ph_service.ph_service import fristen as fr


class TestFristen(unittest.TestCase):
    def test_verbraucher_fristen_ab_uebergabe(self):
        f = fr.fristen(kaufdatum=date(2026, 1, 10), uebergabe=date(2026, 3, 15), kundentyp="Verbraucher", heute=date(2026, 6, 1))
        self.assertEqual(f["basis"], date(2026, 3, 15))
        self.assertEqual(f["gewaehrleistung_bis"], date(2028, 3, 15))  # § 10 Abs 1 VGG
        self.assertEqual(f["beweislast_bis"], date(2027, 3, 15))  # § 11 VGG
        self.assertEqual(f["verjaehrung_bis"], date(2028, 6, 15))  # § 10 Abs 2 VGG
        self.assertEqual(f["status"], fr.STATUS_VERMUTUNG)
        self.assertEqual(f["ampel"], "gruen")
        self.assertEqual(f["beweislast"], "Unternehmer")

    def test_unternehmer_vermutung_sechs_monate(self):
        f = fr.fristen(kaufdatum=date(2026, 1, 10), kundentyp="Unternehmer", heute=date(2026, 9, 1))
        self.assertEqual(f["beweislast_bis"], date(2026, 7, 10))  # § 924 ABGB
        self.assertEqual(f["status"], fr.STATUS_GEWAEHRLEISTUNG)
        self.assertEqual(f["ampel"], "gelb")
        self.assertEqual(f["beweislast"], "Kunde")

    def test_verjaehrung_und_abgelaufen(self):
        self.assertEqual(fr.fristen(kaufdatum=date(2024, 1, 1), heute=date(2026, 2, 1))["status"], fr.STATUS_VERJAEHRUNG)
        f = fr.fristen(kaufdatum=date(2024, 1, 1), heute=date(2026, 5, 1))
        self.assertEqual(f["status"], fr.STATUS_ABGELAUFEN)
        self.assertEqual(f["ampel"], "rot")
        self.assertLess(f["tage_rest"], 0)

    def test_nur_garantie(self):
        f = fr.fristen(kaufdatum=date(2023, 6, 1), garantie_monate=60, heute=date(2026, 6, 1))
        self.assertEqual(f["garantie_bis"], date(2028, 6, 1))
        self.assertTrue(f["garantie_aktiv"])
        self.assertEqual(f["status"], fr.STATUS_GARANTIE)
        self.assertEqual(f["ampel"], "orange")

    def test_ohne_datum_unbekannt(self):
        f = fr.fristen()
        self.assertEqual(f["status"], fr.STATUS_UNBEKANNT)
        self.assertIsNone(f["gewaehrleistung_bis"])
        self.assertEqual(f["ampel"], "grau")

    def test_monatsende(self):
        self.assertEqual(fr.monate_dazu(date(2026, 1, 31), 1), date(2026, 2, 28))
        self.assertEqual(fr.monate_dazu(date(2024, 2, 29), 12), date(2025, 2, 28))
        self.assertEqual(fr.monate_dazu(date(2026, 11, 30), 24), date(2028, 11, 30))

    def test_regress_933b(self):
        f = fr.fristen(kaufdatum=date(2025, 1, 1), erledigt_am=date(2026, 3, 10), lieferung_an_haendler=date(2024, 10, 1), heute=date(2026, 3, 20))
        self.assertEqual(f["regress_frist_bis"], date(2026, 5, 10))
        self.assertEqual(f["regress_absolut_bis"], date(2029, 10, 1))
        ok, _ = fr.regress_moeglich(date(2026, 3, 10), heute=date(2026, 5, 10))
        self.assertTrue(ok)
        ok, hinweis = fr.regress_moeglich(date(2026, 3, 10), heute=date(2026, 5, 11))
        self.assertFalse(ok)
        self.assertIn("abgelaufen", hinweis)
        ok, _ = fr.regress_moeglich(date(2026, 3, 10), lieferung_an_haendler=date(2020, 1, 1), heute=date(2026, 4, 1))
        self.assertFalse(ok)
        ok, _ = fr.regress_moeglich(None)
        self.assertFalse(ok)

    def test_ablaufend_und_durchlaufzeit(self):
        self.assertTrue(fr.ablaufend(date(2026, 7, 1), 60, heute=date(2026, 6, 1)))
        self.assertFalse(fr.ablaufend(date(2026, 9, 1), 60, heute=date(2026, 6, 1)))
        self.assertFalse(fr.ablaufend(date(2026, 5, 1), 60, heute=date(2026, 6, 1)))
        self.assertEqual(fr.durchlaufzeit_tage(date(2026, 1, 1), date(2026, 1, 15)), 14)
        self.assertEqual(fr.durchlaufzeit_tage(date(2026, 1, 1), None, heute=date(2026, 1, 3)), 2)

    def test_reaktionsfrist_werktage(self):
        self.assertEqual(fr.reaktionsfrist(date(2026, 11, 6), 2), date(2026, 11, 10))  # Fr → Di
        self.assertEqual(fr.reaktionsfrist(date(2026, 11, 2), 2), date(2026, 11, 4))  # Mo → Mi

    def test_iso_strings_akzeptiert(self):
        f = fr.fristen(kaufdatum="2026-01-10", uebergabe="2026-02-01 10:00:00", heute="2026-03-01")
        self.assertEqual(f["basis"], date(2026, 2, 1))


if __name__ == "__main__":
    unittest.main()
