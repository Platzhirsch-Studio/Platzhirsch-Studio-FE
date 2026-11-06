"""Liefertermin-Generator und Terminänderung ohne Site (tour_logik)."""

import unittest
from datetime import date

from ph_logistik.ph_logistik import tour_logik as tl

FZ = [{"name": "B-1", "zuladung_kg": 1000, "ladevolumen_m3": 12}, {"name": "B-2", "zuladung_kg": 3000, "ladevolumen_m3": 20}]
MO = date(2026, 11, 9)  # Montag


class TestGenerator(unittest.TestCase):
    def test_wochenende_und_feiertag_uebersprungen(self):
        v = tl.termine_vorschlagen(60, date(2026, 11, 7), FZ[:1], [], feiertage={MO}, anzahl=1)  # Sa 7.11., So, Mo Feiertag
        self.assertEqual(v[0]["datum"], date(2026, 11, 10))
        v = tl.termine_vorschlagen(60, date(2026, 11, 7), FZ[:1], [], anzahl=1, samstag=True)
        self.assertEqual(v[0]["datum"], date(2026, 11, 7))

    def test_neue_tour_zeitfenster_mit_anfahrt(self):
        v = tl.termine_vorschlagen(120, MO, FZ[:1], [], arbeitsbeginn="07:30", fahrt_min_standard=30, anzahl=1)
        self.assertEqual((v[0]["tour"], v[0]["von"], v[0]["bis"], v[0]["grund"]), (None, "07:30", "10:00", "neue Tour"))
        self.assertEqual(v[0]["rest_min"], 480 - 150)

    def test_bestehende_tour_region_zuerst_und_kapazitaet(self):
        touren = [
            {"name": "T1", "datum": MO, "fahrzeug": "B-1", "status": "Geplant", "stopps": [{"plz": "6900", "fahrt_min": 30, "dauer_min": 30, "montage_min": 120}]},
            {"name": "T2", "datum": MO, "fahrzeug": "B-2", "status": "Geplant", "stopps": [{"plz": "6850", "fahrt_min": 30, "dauer_min": 30}]},
        ]
        v = tl.termine_vorschlagen(60, MO, FZ, touren, plz="6850", anzahl=2)
        self.assertEqual([x["tour"] for x in v], ["T2", "T1"])  # Region 68 passt zu T2
        v = tl.termine_vorschlagen(60, MO, FZ, touren, plz="7000", anzahl=2)
        self.assertEqual([x["tour"] for x in v], ["T2", "T1"])  # keine Region passt → mehr Restkapazität zuerst
        v = tl.termine_vorschlagen(60, MO, FZ, touren, plz="6901", anzahl=2)
        self.assertEqual(v[0]["tour"], "T1")
        self.assertTrue(v[0]["region_passt"])
        self.assertEqual(v[0]["von"], "10:30")  # 07:30 + 180 min belegt
        voll = [dict(touren[0], stopps=[{"fahrt_min": 30, "dauer_min": 30, "montage_min": 400}])]
        v = tl.termine_vorschlagen(60, MO, FZ[:1], voll, anzahl=1)
        self.assertNotEqual(v[0]["datum"], MO)  # B-1 am Montag voll → nächster Tag

    def test_zuladung_volumen_team(self):
        v = tl.termine_vorschlagen(60, MO, FZ, [], gewicht_g=1_500_000, anzahl=1)
        self.assertEqual(v[0]["fahrzeug"], "B-2")
        v = tl.termine_vorschlagen(60, MO, FZ, [], volumen_m3=25, anzahl=1, tage_max=3)
        self.assertEqual(v, [])
        t = [{"name": "T1", "datum": MO, "fahrzeug": "B-1", "status": "Freigegeben", "team_anzahl": 1, "stopps": []}]
        v = tl.termine_vorschlagen(60, MO, FZ[:1], t, monteure=2, anzahl=1)
        self.assertNotEqual(v[0]["datum"], MO)  # Team zu klein, keine zweite Tour für dasselbe Fahrzeug am Tag

    def test_laufende_tour_nicht_planbar(self):
        t = [{"name": "T1", "datum": MO, "fahrzeug": "B-1", "status": "Unterwegs", "stopps": []}]
        v = tl.termine_vorschlagen(60, MO, FZ[:1], t, anzahl=1)
        self.assertNotEqual(v[0]["datum"], MO)

    def test_anzahl_und_belegung(self):
        self.assertEqual(len(tl.termine_vorschlagen(60, MO, FZ, [], anzahl=5)), 5)
        self.assertEqual(tl.tour_belegung([{"dauer_min": 30, "montage_min": 90}, {}]), 30 + 30 + 90 + 30 + 30)


class TestAenderung(unittest.TestCase):
    def test_verschoben(self):
        a = {"zeitfenster_von": "08:00", "zeitfenster_bis": "10:00"}
        self.assertFalse(tl.verschoben(a, dict(a, zeitfenster_von="08:00:00"), "2026-11-09", date(2026, 11, 9)))
        self.assertTrue(tl.verschoben(a, dict(a, zeitfenster_bis="11:00"), MO, MO))
        self.assertTrue(tl.verschoben(a, a, "2026-11-09", "2026-11-10"))

    def test_avis_aenderung_texte(self):
        for spr, wort in (("de", "Neuer Termin"), ("en", "New date"), ("fr", "Nouvelle date"), ("it", "Nuova data")):
            t = tl.avis_text(spr, {"datum": "10.11.2026", "von": "09:00", "bis": "11:00"}, aenderung=True)
            self.assertIn(wort, t["betreff"])
        self.assertIn("NEUER Termin", tl.avis_text("de", {"datum": "x"}, aenderung=True)["sms"])

    def test_eta_mit_montage(self):
        e = tl.eta("08:00", [{"reihenfolge": 1, "fahrt_min": 30, "dauer_min": 30, "montage_min": 120}, {"reihenfolge": 2, "fahrt_min": 10}])
        self.assertEqual(e[0]["ende"], "11:00")
        self.assertEqual(e[1]["ankunft"], "11:10")


if __name__ == "__main__":
    unittest.main()
