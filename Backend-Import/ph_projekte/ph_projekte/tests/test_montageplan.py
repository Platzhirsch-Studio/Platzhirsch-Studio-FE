import unittest
from datetime import date, datetime

from ph_projekte.utils import montageplan as m


class TestMontageplan(unittest.TestCase):
    def test_ueberlappung(self):
        a = (datetime(2026, 11, 10, 8), datetime(2026, 11, 10, 12))
        self.assertTrue(m.ueberlappt(*a, datetime(2026, 11, 10, 11), datetime(2026, 11, 10, 14)))
        self.assertFalse(m.ueberlappt(*a, datetime(2026, 11, 10, 12), datetime(2026, 11, 10, 14)))

    def test_kollisionen(self):
        neu = {"name": "MON-2", "start": "2026-11-10 08:00:00", "ende": "2026-11-10 16:00:00", "monteure": ["anna", "ben"], "fahrzeug": "b-123ab"}
        bel = [
            {"name": "MON-1", "start": "2026-11-10 13:00:00", "ende": "2026-11-10 17:00:00", "monteure": ["ben"], "fahrzeug": "B-123AB", "titel": "Küche Huber"},
            {"name": "MON-2", "start": "2026-11-10 08:00:00", "monteure": ["anna"]},
            {"name": "MON-3", "start": "2026-11-11 08:00:00", "monteure": ["anna"]},
            {"art": "Abwesenheit", "name": "ABW-1", "start": date(2026, 11, 10), "ende": date(2026, 11, 10), "monteure": "anna"},
        ]
        k = m.kollisionen(neu, bel)
        self.assertEqual(sorted((x["name"], x["typ"], x["ressource"]) for x in k), [("ABW-1", "monteur", "anna"), ("MON-1", "fahrzeug", "B-123AB"), ("MON-1", "monteur", "ben")])
        self.assertIn("bereits eingeplant", m.kollisionstext(k[0]))

    def test_standarddauer(self):
        s, e = m.zeitraum("2026-11-10 08:00")
        self.assertEqual((e - s).total_seconds(), 8 * 3600)

    def test_auslastung(self):
        a = m.tagesauslastung([{"start": "2026-11-10 07:00", "ende": "2026-11-10 13:00", "monteure": ["anna"]}, {"start": "2026-11-10 13:00", "ende": "2026-11-10 17:00", "monteure": ["anna"]}])
        self.assertEqual(a["2026-11-10"]["anna"], 10.0)
        self.assertEqual(m.ueberbucht(a, 8), [("2026-11-10", "anna", 10.0)])

    def test_abhaengigkeit(self):
        self.assertIsNone(m.abhaengigkeit_konflikt("Erledigt", "2026-11-12", "2026-11-10"))
        self.assertIn("endet", m.abhaengigkeit_konflikt("Geplant", "2026-11-12 12:00", "2026-11-10 08:00"))
        self.assertIn("keinen Termin", m.abhaengigkeit_konflikt("Offen", None, "2026-11-10"))
        self.assertIsNone(m.abhaengigkeit_konflikt("Geplant", "2026-11-09", "2026-11-10"))

    def test_spanne(self):
        v, b = m.termine_spanne([{"von": "2026-11-10 08:00", "bis": "2026-11-10 12:00"}, {"von": "2026-11-20 08:00", "status": "abgesagt"}, {"von": "2026-11-12 08:00"}])
        self.assertEqual((v.day, b.day), (10, 12))


if __name__ == "__main__":
    unittest.main()
