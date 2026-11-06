"""Tour-Logik ohne Site: Zeitfenster, ETA, Konflikte, Doppelbelegung, Avis-Texte, SMS, Telefonnummern."""

import unittest
from datetime import date, time, timedelta

from ph_logistik.ph_logistik import tour_logik as tl


class TestZeit(unittest.TestCase):
    def test_minuten_formate(self):
        self.assertEqual(tl._minuten("08:30"), 510)
        self.assertEqual(tl._minuten("8:30:00"), 510)
        self.assertEqual(tl._minuten(time(9, 5)), 545)
        self.assertEqual(tl._minuten(timedelta(hours=10)), 600)
        self.assertIsNone(tl._minuten("25:00"))
        self.assertIsNone(tl._minuten(""))

    def test_zeitfenster_ok(self):
        self.assertTrue(tl.zeitfenster_ok("08:00", "10:00"))
        self.assertFalse(tl.zeitfenster_ok("10:00", "08:00"))
        self.assertTrue(tl.zeitfenster_ok(None, "10:00"))

    def test_eta_mit_wartezeit_und_fenster(self):
        stopps = [
            {"reihenfolge": 1, "fahrt_min": 20, "dauer_min": 60},
            {"reihenfolge": 2, "fahrt_min": 30, "dauer_min": 30, "zeitfenster_von": "10:30", "zeitfenster_bis": "12:00"},
            {"reihenfolge": 3, "fahrt_min": 15, "dauer_min": 30, "zeitfenster_von": "09:00", "zeitfenster_bis": "10:00"},
        ]
        e = tl.eta("08:00", stopps)
        self.assertEqual(e[0]["ankunft"], "08:20")
        self.assertEqual(e[0]["ende"], "09:20")
        self.assertEqual(e[1]["ankunft"], "09:50")
        self.assertEqual(e[1]["beginn"], "10:30")  # wartet auf Fenster
        self.assertEqual(e[1]["warte_min"], 40)
        self.assertTrue(e[1]["im_fenster"])
        self.assertFalse(e[2]["im_fenster"])  # 11:15 > 10:00
        self.assertEqual(tl.konflikte(stopps, start_zeit="08:00"), [3])

    def test_standardzeiten(self):
        e = tl.eta(None, [{"reihenfolge": 1}], fahrt_min_standard=30, dauer_min_standard=45)
        self.assertEqual((e[0]["ankunft"], e[0]["ende"]), ("08:30", "09:15"))

    def test_ueberschneidungen(self):
        b = [
            {"ref": "T1", "ressource": "B-123AB", "datum": date(2026, 11, 5)},
            {"ref": "T2", "ressource": "B-123AB", "datum": date(2026, 11, 5), "von": "13:00", "bis": "15:00"},
            {"ref": "T3", "ressource": "B-123AB", "datum": date(2026, 11, 6)},
            {"ref": "T4", "ressource": "fahrer@x", "datum": date(2026, 11, 5), "von": "08:00", "bis": "10:00"},
            {"ref": "T5", "ressource": "fahrer@x", "datum": date(2026, 11, 5), "von": "10:00", "bis": "12:00"},
        ]
        self.assertEqual(tl.ueberschneidungen(b), [("T1", "T2", "B-123AB")])


class TestAvis(unittest.TestCase):
    def test_avis_de_mit_fenster(self):
        t = tl.avis_text("de", {"name": "Anna Muster", "datum": "05.11.2026", "von": "09:00", "bis": "11:00", "art": "Lieferung", "fahrzeug": "Sprinter B-123AB", "telefon": "+43 5574 12345", "referenz": "LS-2026-00001"})
        self.assertIn("Ihre Lieferung am 05.11.2026", t["betreff"])
        self.assertIn("zwischen 09:00 und 11:00", t["text"])
        self.assertIn("Sprinter", t["text"])
        self.assertIn("<p>", t["html"])
        self.assertIn("LS-2026-00001", t["sms"])
        self.assertLessEqual(len(t["sms"]), tl.SMS_MAX)

    def test_avis_eta_plus_minus_stunde_und_sprachen(self):
        t = tl.avis_text("it", {"name": "Marco", "datum": "05.11.2026", "eta": "10:30", "art": "Montage"})
        self.assertIn("09:30", t["text"])
        self.assertIn("11:30", t["text"])
        self.assertIn("il montaggio", t["text"])
        self.assertIn("Votre livraison", tl.avis_text("fr", {"datum": "x"})["betreff"])
        self.assertIn("Your delivery", tl.avis_text("en", {"datum": "x"})["betreff"])
        self.assertIn("Ihre Lieferung", tl.avis_text("xx", {"datum": "x"})["betreff"])  # Rückfall Deutsch

    def test_html_escape(self):
        t = tl.avis_text("de", {"name": "<script>", "datum": "1"})
        self.assertNotIn("<script>", t["html"])

    def test_sms_kuerzen_und_telefon(self):
        self.assertEqual(len(tl.sms_kuerzen("x" * 400)), tl.SMS_MAX)
        self.assertEqual(tl.telefon_normalisieren("0664 123 45 67"), "+436641234567")
        self.assertEqual(tl.telefon_normalisieren("0049 171 1234567"), "+491711234567")
        self.assertEqual(tl.telefon_normalisieren("0171 1234567", "DE"), "+491711234567")
        self.assertIsNone(tl.telefon_normalisieren("123"))
        self.assertIsNone(tl.telefon_normalisieren(None))

    def test_datum_text(self):
        self.assertEqual(tl.datum_text("2026-11-05"), "05.11.2026")
        self.assertEqual(tl.datum_text(date(2026, 11, 5), "en"), "05/11/2026")


if __name__ == "__main__":
    unittest.main()
