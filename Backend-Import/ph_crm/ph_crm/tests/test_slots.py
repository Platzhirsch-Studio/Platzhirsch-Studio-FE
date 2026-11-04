"""Reine Logik ohne Frappe: cd Backend-Import/ph_crm && python -m unittest discover -s ph_crm/tests -t ."""

import unittest
from datetime import date, datetime, time

from ph_crm.utils.feiertage import feiertage_at, ostersonntag
from ph_crm.utils.slots import Terminregel, blockiert, freie_starts, kandidaten, start_erlaubt
from ph_crm.utils.zeit import iso, nach_site, parse_iso

DIENSTAG = date(2026, 11, 10)
FENSTER = [(time(10, 0), time(18, 0))]
JETZT = datetime(2026, 11, 1, 9, 0)


class TestSlots(unittest.TestCase):
    def test_raster_30_min_und_dauer(self):
        regel = Terminregel(dauer_min=60, puffer_min=15)
        starts = kandidaten(DIENSTAG, FENSTER, regel)
        self.assertEqual(starts[0], datetime(2026, 11, 10, 10, 0))
        self.assertEqual(starts[-1], datetime(2026, 11, 10, 17, 0))  # 17:00 + 60 min = 18:00
        self.assertEqual(len(starts), 15)

    def test_feste_startzeiten_und_wochentage(self):
        regel = Terminregel(dauer_min=90, puffer_min=60, anfahrt_min=60, feste_startzeiten=["10:00", "14:00"], wochentage=[1, 2, 3, 4])
        self.assertEqual([s.time() for s in kandidaten(DIENSTAG, FENSTER, regel)], [time(10, 0), time(14, 0)])
        self.assertEqual(kandidaten(date(2026, 11, 9), FENSTER, regel), [])  # Montag ausgeschlossen

    def test_blockierung_mit_puffer_und_anfahrt(self):
        regel = Terminregel(dauer_min=60, puffer_min=15, anfahrt_min=0, vorlauf_stunden=0)
        belegt = [(datetime(2026, 11, 10, 11, 0), datetime(2026, 11, 10, 12, 15))]  # Termin 11:00–12:00 + Puffer
        frei = freie_starts(DIENSTAG, FENSTER, regel, belegt, JETZT)
        self.assertNotIn(datetime(2026, 11, 10, 10, 30), frei)  # 10:30–11:45 kollidiert
        self.assertNotIn(datetime(2026, 11, 10, 12, 0), frei)  # 12:00 liegt im Puffer
        self.assertIn(datetime(2026, 11, 10, 12, 30), frei)
        # 10:00 + 60 min + 15 min Puffer = 11:15 > 11:00 → Kollision über den eigenen Puffer (wie Website blockOf)
        self.assertNotIn(datetime(2026, 11, 10, 10, 0), frei)
        self.assertEqual(frei[0], datetime(2026, 11, 10, 12, 30))

    def test_vorlauf(self):
        regel = Terminregel(dauer_min=60, vorlauf_stunden=24)
        jetzt = datetime(2026, 11, 9, 12, 0)
        frei = freie_starts(DIENSTAG, FENSTER, regel, [], jetzt)
        self.assertEqual(frei[0], datetime(2026, 11, 10, 12, 0))
        self.assertFalse(start_erlaubt(datetime(2026, 11, 10, 10, 0), FENSTER, regel, jetzt))
        self.assertTrue(start_erlaubt(datetime(2026, 11, 10, 14, 0), FENSTER, regel, jetzt))
        self.assertFalse(start_erlaubt(datetime(2026, 11, 10, 14, 10), FENSTER, regel, jetzt))  # nicht im Raster

    def test_blockiert_status(self):
        jetzt = datetime(2026, 11, 1, 12, 0)
        self.assertTrue(blockiert("Bestaetigt", 0, None, jetzt))
        self.assertTrue(blockiert("Unbestaetigt", 0, datetime(2026, 11, 1, 12, 20), jetzt))
        self.assertFalse(blockiert("Unbestaetigt", 0, datetime(2026, 11, 1, 11, 0), jetzt))
        self.assertTrue(blockiert("Unbestaetigt", 1, None, jetzt))  # Vor-Ort-Anfrage
        self.assertFalse(blockiert("Storniert", 1, None, jetzt))


class TestFeiertage(unittest.TestCase):
    def test_ostern(self):
        self.assertEqual(ostersonntag(2026), date(2026, 4, 5))
        self.assertEqual(ostersonntag(2027), date(2027, 3, 28))

    def test_liste(self):
        f = feiertage_at(2026)
        self.assertEqual(f[date(2026, 4, 6)], "Ostermontag")
        self.assertEqual(f[date(2026, 6, 4)], "Fronleichnam")
        self.assertIn(date(2026, 12, 24), f)
        self.assertEqual(len(f), 15)


class TestZeit(unittest.TestCase):
    def test_iso_rundlauf(self):
        dt = parse_iso("2026-11-10T09:00:00.000Z")
        lokal = nach_site(dt)
        self.assertEqual(lokal, datetime(2026, 11, 10, 10, 0))  # MEZ = UTC+1
        self.assertTrue(iso(lokal).startswith("2026-11-10T10:00:00+01:00"))
        self.assertIsNone(parse_iso("kein datum"))
        self.assertEqual(nach_site(parse_iso("2026-11-10T10:00:00+01:00")), datetime(2026, 11, 10, 10, 0))


if __name__ == "__main__":
    unittest.main()
