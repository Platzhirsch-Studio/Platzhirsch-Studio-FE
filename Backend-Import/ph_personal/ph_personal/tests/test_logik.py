"""Tests ohne Site: cd Backend-Import/ph_personal && PYTHONPATH=. python -m unittest discover -s ph_personal/tests -t ."""

import unittest
from datetime import date, time

from ph_personal.logik import (
    arbeitstage,
    dauer_minuten,
    entgelt_text,
    entgelt_vollstaendig,
    euro,
    loeschfrist,
    minuten_text,
    monate_addieren,
    slug,
    soll_minuten_monat,
    ueberschneidung,
    ueberzahlung_fuer_website,
    uebersetze,
    veroeffentlichbar,
    AUSMASS,
)


class TestSlug(unittest.TestCase):
    def test_wie_website(self):
        # Erwartete Slugs aus qa-screenshots/karriere/frappe-import.json (_hinweise.slug)
        self.assertEqual(slug("CAD-Planer/in (m/w/d)"), "cad-planer-in-m-w-d")
        self.assertEqual(slug("Verkäufer/in Einrichtungsberatung (m/w/d)"), "verkaeufer-in-einrichtungsberatung-m-w-d")
        self.assertEqual(slug("Installateur/in Sanitär/Heizung (m/w/d)"), "installateur-in-sanitaer-heizung-m-w-d")
        self.assertEqual(slug("Monteur/in – Tischlerlehre"), "monteur-in-tischlerlehre")
        self.assertEqual(slug("Dessinateur·rice CAO"), "dessinateurrice-cao")
        self.assertEqual(slug(""), "")


class TestEntgelt(unittest.TestCase):
    def test_vollstaendig(self):
        self.assertTrue(entgelt_vollstaendig(253500, "Monat", "KV Handel Angestellte, BG E, Stufe 1", "ja"))
        self.assertTrue(entgelt_vollstaendig(253500, "Jahr", "KV", "nein"))
        self.assertTrue(entgelt_vollstaendig(253500, "Monat", "KV", "", "Überzahlung nach Vereinbarung"))

    def test_unvollstaendig(self):
        self.assertFalse(entgelt_vollstaendig(0, "Monat", "KV", "ja"))
        self.assertFalse(entgelt_vollstaendig(253500, "Woche", "KV", "ja"))
        self.assertFalse(entgelt_vollstaendig(253500, "Monat", "  ", "ja"))
        self.assertFalse(entgelt_vollstaendig(253500, "Monat", "KV", ""))
        self.assertFalse(entgelt_vollstaendig("abc", "Monat", "KV", "ja"))

    def test_euro_formate(self):
        self.assertEqual(euro(253500, "de"), "€ 2.535,00")
        self.assertEqual(euro(253500, "en"), "€2,535.00")
        self.assertEqual(euro(253500, "it"), "2.535,00 €")
        self.assertEqual(euro(253500, "fr"), "2 535,00 €")

    def test_text_de(self):
        t = entgelt_text(253500, "Monat", "KV Handel Angestellte, Beschäftigungsgruppe E, Stufe 1", "ja", sprache="de")
        self.assertEqual(
            t,
            "Das kollektivvertragliche Mindestentgelt beträgt € 2.535,00 brutto pro Monat (KV Handel Angestellte, Beschäftigungsgruppe E, Stufe 1). "
            "Bereitschaft zur Überzahlung je nach Qualifikation und Erfahrung.",
        )

    def test_text_leer_wenn_unvollstaendig(self):
        self.assertEqual(entgelt_text(0, "Monat", "KV", "ja"), "")

    def test_text_ohne_ueberzahlung(self):
        t = entgelt_text(217800, "Monat", "KV", "nein", sprache="en")
        self.assertTrue(t.endswith("(KV)."))

    def test_ueberzahlung_website(self):
        self.assertIs(ueberzahlung_fuer_website("ja"), True)
        self.assertIs(ueberzahlung_fuer_website("nein"), False)
        self.assertEqual(ueberzahlung_fuer_website("ja", " eigener Text "), "eigener Text")

    def test_uebersetze(self):
        self.assertEqual(uebersetze(AUSMASS, "Vollzeit", "fr"), "Temps plein")
        self.assertEqual(uebersetze(AUSMASS, "Vollzeit", "xx"), "Vollzeit")
        self.assertEqual(uebersetze(AUSMASS, "Unbekannt", "en"), "Unbekannt")


class TestVeroeffentlichung(unittest.TestCase):
    def test_regeln(self):
        h = date(2026, 11, 4)
        self.assertTrue(veroeffentlichbar("Aktiv", True, date(2026, 11, 3), date(2027, 1, 2), h))
        self.assertFalse(veroeffentlichbar("Aktiv", False, heute=h))
        self.assertFalse(veroeffentlichbar("Entwurf", True, heute=h))
        self.assertFalse(veroeffentlichbar("Aktiv", True, date(2026, 11, 5), None, h))
        self.assertFalse(veroeffentlichbar("Aktiv", True, None, date(2026, 11, 3), h))
        self.assertTrue(veroeffentlichbar("Aktiv", True, None, None, h))


class TestFristen(unittest.TestCase):
    def test_loeschfrist_7_monate(self):
        self.assertEqual(loeschfrist(date(2026, 11, 4)), date(2027, 6, 4))
        self.assertEqual(loeschfrist(date(2026, 8, 31)), date(2027, 3, 31))
        self.assertEqual(loeschfrist(date(2026, 7, 31)), date(2027, 2, 28))
        self.assertIsNone(loeschfrist(None))

    def test_monate_addieren_jahreswechsel(self):
        self.assertEqual(monate_addieren(date(2026, 12, 15), 1), date(2027, 1, 15))
        self.assertEqual(monate_addieren(date(2026, 1, 31), 13), date(2027, 2, 28))


class TestZeit(unittest.TestCase):
    def test_arbeitstage(self):
        # Mo 02.11.2026 – So 08.11.2026 = 5 Werktage
        self.assertEqual(arbeitstage(date(2026, 11, 2), date(2026, 11, 8)), 5.0)
        self.assertEqual(arbeitstage(date(2026, 11, 7), date(2026, 11, 8)), 0.0)
        self.assertEqual(arbeitstage(date(2026, 11, 2), date(2026, 11, 2), halbtags=True), 0.5)
        self.assertEqual(arbeitstage(date(2026, 11, 2), date(2026, 11, 6), feiertage=(date(2026, 11, 3),)), 4.0)
        self.assertEqual(arbeitstage(date(2026, 11, 6), date(2026, 11, 2)), 0.0)

    def test_dauer(self):
        self.assertEqual(dauer_minuten(time(8, 0), time(16, 30), 30), 480)
        self.assertEqual(dauer_minuten(time(16, 0), time(8, 0)), 0)
        self.assertEqual(dauer_minuten(None, time(8, 0)), 0)

    def test_soll(self):
        # November 2026: 21 Werktage × 7,7 h = 161,7 h = 9702 min
        self.assertEqual(soll_minuten_monat(38.5, 2026, 11), 9702)
        self.assertEqual(minuten_text(9702), "161:42")
        self.assertEqual(minuten_text(-90), "-1:30")

    def test_ueberschneidung(self):
        self.assertTrue(ueberschneidung(date(2026, 1, 1), date(2026, 1, 5), date(2026, 1, 5), date(2026, 1, 9)))
        self.assertFalse(ueberschneidung(date(2026, 1, 1), date(2026, 1, 4), date(2026, 1, 5), date(2026, 1, 9)))


if __name__ == "__main__":
    unittest.main()
