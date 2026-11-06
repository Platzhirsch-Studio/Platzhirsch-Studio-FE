"""Tests ohne Site: SLA-Fristen, Werktage, Eskalationsstufen, Fristen unbewegliche Sache, Wartungsplanung."""

import unittest
from datetime import date

from ph_service.ph_service import fristen as fr
from ph_service.ph_service import pflege_logik as pl
from ph_service.utils import sla

# Fr 30.10.2026; Mo 26.10. Nationalfeiertag; So 01.11. Allerheiligen
FEIERTAGE = {date(2026, 10, 26), date(2026, 11, 1), date(2026, 12, 8), date(2026, 12, 24), date(2026, 12, 25)}


class TestSla(unittest.TestCase):
    def test_plus_werktage_ueberspringt_wochenende_und_feiertag(self):
        self.assertEqual(sla.plus_werktage(date(2026, 10, 23), 1, FEIERTAGE), date(2026, 10, 27))  # Fr → Di (Mo Feiertag)
        self.assertEqual(sla.plus_werktage(date(2026, 10, 30), 2, FEIERTAGE), date(2026, 11, 3))
        self.assertEqual(sla.plus_werktage(date(2026, 10, 31), 0, FEIERTAGE), date(2026, 11, 2))  # Sa, Dringend → Mo

    def test_fristen_je_prioritaet(self):
        f = sla.fristen(date(2026, 11, 2), "Hoch", feiertage=FEIERTAGE)
        self.assertEqual(f["frist_reaktion"], date(2026, 11, 3))
        self.assertEqual(f["frist_loesung"], date(2026, 11, 16))
        f = sla.fristen(date(2026, 11, 2), "Dringend", reaktion={"Dringend": 0}, loesung={"Dringend": 1})
        self.assertEqual(f["frist_reaktion"], date(2026, 11, 2))
        self.assertEqual(f["frist_loesung"], date(2026, 11, 3))
        self.assertEqual(sla.fristen(date(2026, 11, 2), "Unbekannt")["frist_reaktion"], date(2026, 11, 4))  # → Normal

    def test_status(self):
        s = sla.status(date(2026, 11, 5), date(2026, 11, 4), date(2026, 11, 30))
        self.assertEqual(s["status"], sla.STATUS_VERLETZT)
        self.assertTrue(s["reaktion_verletzt"])
        s = sla.status(date(2026, 11, 5), date(2026, 11, 4), date(2026, 11, 30), erstreaktion_am=date(2026, 11, 3))
        self.assertEqual(s["status"], sla.STATUS_IM_PLAN)
        s = sla.status(date(2026, 11, 26), date(2026, 11, 4), date(2026, 11, 30), erstreaktion_am=date(2026, 11, 3))
        self.assertEqual(s["status"], sla.STATUS_GEFAEHRDET)
        s = sla.status(date(2026, 12, 5), date(2026, 11, 4), date(2026, 11, 30), erstreaktion_am=date(2026, 11, 3), erledigt_am=date(2026, 11, 20))
        self.assertEqual(s["status"], sla.STATUS_ERFUELLT)
        s = sla.status(date(2026, 12, 5), date(2026, 11, 4), date(2026, 11, 30), erstreaktion_am=date(2026, 11, 3), erledigt_am=date(2026, 12, 1))
        self.assertTrue(s["loesung_verletzt"])

    def test_eskalationsstufe(self):
        self.assertEqual(sla.eskalationsstufe(date(2026, 11, 30), date(2026, 11, 30)), 0)
        self.assertEqual(sla.eskalationsstufe(date(2026, 12, 1), date(2026, 11, 30)), 1)
        self.assertEqual(sla.eskalationsstufe(date(2026, 12, 7), date(2026, 11, 30)), 2)
        self.assertEqual(sla.eskalationsstufe(date(2026, 12, 31), date(2026, 11, 30), feiertage=FEIERTAGE), 3)
        self.assertEqual(sla.eskalationsstufe(date(2026, 12, 31), date(2026, 11, 30), erledigt_am=date(2026, 12, 2)), 0)

    def test_pause_verschiebt_loesungsfrist(self):
        # Pause Mo 02.11. – Mo 09.11. = 5 Werktage
        self.assertEqual(sla.pause_werktage(date(2026, 11, 2), date(2026, 11, 9)), 5)
        self.assertEqual(sla.pause_werktage(date(2026, 11, 2), date(2026, 11, 2)), 0)
        self.assertEqual(sla.frist_verschieben(date(2026, 11, 30), 5), date(2026, 12, 7))
        self.assertEqual(sla.frist_verschieben(date(2026, 12, 4), 2, FEIERTAGE), date(2026, 12, 9))  # 08.12. Feiertag
        # laufende Pause: Frist 05.11. wäre am 10.11. verletzt, pausiert seit 03.11. → Pausiert, nicht verletzt
        s = sla.status(date(2026, 11, 10), date(2026, 11, 3), date(2026, 11, 5), erstreaktion_am=date(2026, 11, 2), pausiert_seit=date(2026, 11, 3))
        self.assertEqual(s["status"], sla.STATUS_PAUSIERT)
        self.assertFalse(s["loesung_verletzt"])
        # Pause erst nach Fristablauf begonnen → bleibt verletzt
        s = sla.status(date(2026, 11, 20), date(2026, 11, 3), date(2026, 11, 5), erstreaktion_am=date(2026, 11, 2), pausiert_seit=date(2026, 11, 18))
        self.assertEqual(s["status"], sla.STATUS_VERLETZT)

    def test_werktage_zwischen(self):
        self.assertEqual(sla.werktage_zwischen(date(2026, 11, 2), date(2026, 11, 9)), 5)
        self.assertEqual(sla.werktage_zwischen(date(2026, 11, 9), date(2026, 11, 2)), -5)


class TestFristenErweitert(unittest.TestCase):
    def test_unbewegliche_sache_drei_jahre(self):
        f = fr.fristen(uebergabe=date(2026, 3, 1), kundentyp="Verbraucher", sachart="Unbeweglich", heute=date(2026, 8, 1))
        self.assertEqual(f["gewaehrleistung_bis"], date(2029, 3, 1))  # § 933 Abs 1 ABGB
        self.assertEqual(f["beweislast_bis"], date(2026, 9, 1))  # § 924 ABGB 6 Monate
        self.assertEqual(f["verjaehrung_bis"], date(2029, 6, 1))

    def test_reaktionsfrist_mit_feiertag(self):
        self.assertEqual(fr.reaktionsfrist(date(2026, 10, 23), 2, FEIERTAGE), date(2026, 10, 28))


class TestWartungsplanung(unittest.TestCase):
    def test_einsatz_faellig_idempotent(self):
        self.assertTrue(pl.einsatz_faellig(date(2026, 11, 4), date(2026, 12, 1), 28))
        self.assertFalse(pl.einsatz_faellig(date(2026, 11, 2), date(2026, 12, 1), 28))
        self.assertFalse(pl.einsatz_faellig(date(2026, 11, 4), date(2026, 12, 1), 28, schon_geplant=True))
        self.assertFalse(pl.einsatz_faellig(date(2026, 11, 4), date(2026, 12, 1), 28, automatisch=False))
        self.assertTrue(pl.einsatz_faellig(date(2027, 1, 4), date(2026, 12, 1), 28))  # überfällig → trotzdem planen

    def test_plantag_und_schluessel(self):
        self.assertEqual(pl.plantag(date(2026, 12, 8), FEIERTAGE), date(2026, 12, 9))
        self.assertEqual(pl.plantag(date(2026, 12, 5), FEIERTAGE), date(2026, 12, 7))
        self.assertEqual(pl.planschluessel("PFL-2026-00001", date(2026, 12, 1)), "wartung:PFL-2026-00001:2026-12-01")


if __name__ == "__main__":
    unittest.main()
