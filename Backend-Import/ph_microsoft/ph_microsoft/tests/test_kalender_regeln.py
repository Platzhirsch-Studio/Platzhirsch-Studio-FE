import unittest
from datetime import date, datetime, timedelta

from ph_microsoft.logik import kalender_regeln as R

T0 = datetime(2026, 11, 10, 10, 0)
T1 = datetime(2026, 11, 10, 11, 0)


class TestQuellen(unittest.TestCase):
    def test_termin_video(self):
        d = {"name": "PH-TER-2026-00001", "titel": "Max Muster", "modus": "Video", "start": "2026-11-10 10:00:00", "ende": "2026-11-10 11:00:00", "status": "Bestaetigt", "berater": "a@x"}
        ev = R.ereignis("PH Termin", d)
        self.assertTrue(ev["online"])
        self.assertEqual((ev["start"], ev["ende"]), (T0, T1))
        self.assertEqual(ev["ort"], "Microsoft Teams")
        self.assertFalse(ev["abgesagt"])
        self.assertEqual(R.benutzer("PH Termin", d), ["a@x"])
        self.assertTrue(R.ereignis("PH Termin", {**d, "status": "Storniert"})["abgesagt"])

    def test_termin_ohne_ende(self):
        s, e = R.zeitraum("PH Termin", {"start": T0, "dauer_min": 45})
        self.assertEqual(e - s, timedelta(minutes=45))

    def test_serviceeinsatz(self):
        d = {"datum": date(2026, 11, 10), "zeit_von": timedelta(hours=8, minutes=30), "zeit_bis": "10:00:00", "techniker": "t1", "techniker_2": "t2", "art": "Wartung", "strasse": "Weg 1", "plz": "6911", "ort": "Lochau"}
        self.assertEqual(R.zeitraum("PH Serviceeinsatz", d), (datetime(2026, 11, 10, 8, 30), datetime(2026, 11, 10, 10, 0)))
        self.assertEqual(R.benutzer("PH Serviceeinsatz", d), ["t1", "t2"])
        self.assertEqual(R.ereignis("PH Serviceeinsatz", d, "PH-SRE-1")["ort"], "Weg 1, 6911 Lochau")
        ohne = R.zeitraum("PH Serviceeinsatz", {"datum": "2026-11-10"})
        self.assertEqual(ohne, (datetime(2026, 11, 10, 8, 0), datetime(2026, 11, 10, 10, 0)))
        self.assertEqual(R.zeit_felder("PH Serviceeinsatz", T0, T1), {"datum": "2026-11-10", "zeit_von": "10:00:00", "zeit_bis": "11:00:00"})

    def test_montage_team(self):
        d = {"montageleiter": "ml", "team": [{"user": "m1"}, {"user": "ml"}, {"user": None}], "start": T0, "ende": T1, "status": "Geplant"}
        self.assertEqual(R.benutzer("PH Montageauftrag", d), ["m1", "ml"])

    def test_graph_event(self):
        ev = R.ereignis("PH Termin", {"titel": "X", "modus": "Video", "start": T0, "ende": T1})
        body = R.graph_event(ev, "PH Termin", "PH-TER-1", "a@x")
        self.assertTrue(body["isOnlineMeeting"])
        self.assertEqual(body["onlineMeetingProvider"], "teamsForBusiness")
        self.assertEqual(body["start"], {"dateTime": "2026-11-10T10:00:00", "timeZone": "Europe/Vienna"})
        self.assertEqual(body["singleValueExtendedProperties"][0]["value"], "PH Termin|PH-TER-1")
        self.assertEqual(body["transactionId"], R.transaction_id("PH Termin", "PH-TER-1", "a@x"))
        self.assertNotIn("transactionId", R.graph_event(ev, "PH Termin", "PH-TER-1", neu=False))

    def test_inhalt_hash_gleich_aus_outlook(self):
        ev = R.ereignis("PH Montageauftrag", {"titel": "Küche", "start": T0, "ende": T1, "projekt": "P1"}, "PH-MON-1")
        body = R.graph_event(ev, "PH Montageauftrag", "PH-MON-1", "u")
        self.assertEqual(R.outlook_inhalt_hash(body), R.inhalt_hash(ev))
        self.assertNotEqual(R.outlook_inhalt_hash({**body, "subject": "geändert"}), R.inhalt_hash(ev))
        self.assertIsNone(R.outlook_inhalt_hash({**body, "body": {"contentType": "html", "content": "<p>"}}))


class TestKonflikt(unittest.TestCase):
    G = (T0, T1)
    NEU = (T0 + timedelta(hours=2), T1 + timedelta(hours=2))
    ANDERS = (T0 + timedelta(hours=3), T1 + timedelta(hours=3))

    def test_nichts(self):
        self.assertEqual(R.konflikt(self.G, self.G, self.G)["aktion"], "nichts")

    def test_outlook_verschiebt_outlook_gewinnt(self):
        r = R.konflikt(self.G, self.G, self.NEU)
        self.assertEqual((r["aktion"], r["aufgabe"]), ("outlook_zeit_uebernehmen", "verschoben"))

    def test_backoffice_verschiebt(self):
        r = R.konflikt(self.G, self.NEU, self.G)
        self.assertEqual((r["aktion"], r["aufgabe"]), ("backoffice_pushen", None))

    def test_beide_unterschiedlich_backoffice_gewinnt_mit_aufgabe(self):
        r = R.konflikt(self.G, self.NEU, self.ANDERS)
        self.assertEqual((r["aktion"], r["aufgabe"]), ("backoffice_pushen", "konflikt"))

    def test_beide_gleich_verschoben(self):
        self.assertEqual(R.konflikt(self.G, self.NEU, self.NEU)["aktion"], "nichts")

    def test_inhalt_in_outlook_geaendert_backoffice_gewinnt(self):
        r = R.konflikt(self.G, self.G, self.G, "hash-outlook", "hash-gespeichert")
        self.assertEqual(r["aktion"], "nichts")
        self.assertTrue(r["inhalt_pushen"])

    def test_sekunden_toleranz(self):
        self.assertEqual(R.konflikt(self.G, self.G, (T0 + timedelta(seconds=30), T1))["aktion"], "nichts")


class TestZeit(unittest.TestCase):
    def test_graph_zeit_wien(self):
        self.assertEqual(R.graph_zeit_lesen({"dateTime": "2026-11-10T10:00:00.0000000", "timeZone": "Europe/Vienna"}), T0)
        self.assertIsNone(R.graph_zeit_lesen(None))

    def test_belegt_bloecke(self):
        antwort = {"value": [{"scheduleId": "A@X", "scheduleItems": [
            {"status": "busy", "start": {"dateTime": "2026-11-10T10:00:00", "timeZone": "Europe/Vienna"}, "end": {"dateTime": "2026-11-10T11:00:00", "timeZone": "Europe/Vienna"}},
            {"status": "free", "start": {"dateTime": "2026-11-10T12:00:00", "timeZone": "Europe/Vienna"}, "end": {"dateTime": "2026-11-10T13:00:00", "timeZone": "Europe/Vienna"}},
        ]}]}
        self.assertEqual(R.belegt_bloecke(antwort), {"a@x": [(T0, T1, "busy")]})

    def test_fremd_belegt(self):
        self.assertTrue(R.ist_fremd_belegt({"showAs": "busy"}))
        self.assertFalse(R.ist_fremd_belegt({"showAs": "free"}))
        self.assertFalse(R.ist_fremd_belegt({"showAs": "busy", "isCancelled": True}))


if __name__ == "__main__":
    unittest.main()
