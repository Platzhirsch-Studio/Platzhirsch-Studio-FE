"""Portal-Sitzungen (mehrere Tokens je Kontakt), Paginierung Teamliste, Standard-Planer – ohne Frappe."""

import unittest
from datetime import datetime, timedelta

from ph_projekte.utils import portal_sitzung as PS

JETZT = datetime(2026, 11, 4, 12, 0)


def s(name, status, minuten, aktiv=True, **kw):
    t = JETZT - timedelta(minutes=minuten)
    return {"name": name, "status": status, "angefordert_am": t, "aktiviert_am": t if aktiv and status == "Aktiv" else None, "token_hash": f"h-{name}", **kw}


class TestSitzungen(unittest.TestCase):
    def test_zustand(self):
        self.assertEqual(PS.zustand(s("a", "Aktiv", 10, ablauf_am=JETZT + timedelta(days=1)), JETZT), "ok")
        self.assertEqual(PS.zustand(s("a", "Aktiv", 10, ablauf_am=JETZT - timedelta(seconds=1)), JETZT), "expired")
        self.assertEqual(PS.zustand(s("a", "Widerrufen", 10), JETZT), "revoked")
        self.assertEqual(PS.zustand(s("a", "Angefordert", 60 * 25, aktiv=False), JETZT), "expired")  # Magic Link > 24 h
        self.assertEqual(PS.zustand(s("a", "Angefordert", 60, aktiv=False), JETZT), "ok")

    def test_max_fuenf_aktive_aelteste_faellt(self):
        sitz = [s(f"a{i}", "Aktiv", i) for i in range(7)]
        self.assertEqual(PS.ueberzaehlig(sitz), ["a5", "a6"])

    def test_login_spam_verdraengt_keine_aktive(self):
        sitz = [s("aktiv", "Aktiv", 500)] + [s(f"o{i}", "Angefordert", i, aktiv=False) for i in range(6)]
        weg = PS.ueberzaehlig(sitz)
        self.assertNotIn("aktiv", weg)
        self.assertEqual(weg, ["o3", "o4", "o5"])

    def test_nachfolger_hash_nach_logout(self):
        sitz = [s("alt", "Aktiv", 100), s("neu", "Aktiv", 5), s("offen", "Angefordert", 1, aktiv=False)]
        self.assertEqual(PS.nachfolger_hash(sitz), "h-neu")
        self.assertEqual(PS.nachfolger_hash(sitz, ausser="neu"), "h-alt")
        self.assertIsNone(PS.nachfolger_hash([s("offen", "Angefordert", 1, aktiv=False)]))

    def test_ablauf(self):
        self.assertEqual(PS.ablauf(JETZT, 30), JETZT + timedelta(days=30))
        self.assertEqual(PS.ablauf(JETZT, 0), JETZT + timedelta(days=30))


class TestSeiteUndPlaner(unittest.TestCase):
    def test_seite(self):
        self.assertEqual(PS.seite(1, 20), (0, 20))
        self.assertEqual(PS.seite(3, 10), (20, 10))
        self.assertEqual(PS.seite("x", 1000), (0, 100))
        self.assertEqual(PS.seite(0, None), (0, 20))

    def test_planer_standard(self):
        self.assertEqual(PS.planer_standard("anna@platzhirsch.studio", ["PH Projekte Mitarbeiter"]), "anna@platzhirsch.studio")
        self.assertIsNone(PS.planer_standard("website@platzhirsch.studio", ["PH Website Integration"]))
        self.assertIsNone(PS.planer_standard("Guest", ["Guest"]))
        self.assertIsNone(PS.planer_standard("Administrator", ["System Manager"]))


if __name__ == "__main__":
    unittest.main()
