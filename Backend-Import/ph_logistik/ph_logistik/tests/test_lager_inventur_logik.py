"""Reine Logik Lager & Inventur Ergänzung (ohne Frappe):
cd Backend-Import/ph_logistik && PYTHONPATH=. python -m unittest ph_logistik.tests.test_lager_inventur_logik"""

import unittest
from datetime import date

from ph_logistik.ph_logistik import inventur_logik as IL
from ph_logistik.ph_logistik import nachbestellung_logik as NL


class TestMeldebestand(unittest.TestCase):
    def test_disponierbar_formel(self):
        zeilen = [
            {"menge": 10, "reserviert": 3},
            {"menge": 4, "reserviert": 4, "kommission": "PRJ-1"},  # Kommission ganz abgezogen, Reservierung nicht doppelt
            {"menge": 2, "gesperrt": 1},
            {"menge": 1, "ausstellungsstueck": 1},  # zählt nicht
        ]
        k = NL.disponierbar(zeilen, offen_bestellt=5)
        self.assertEqual((k["bestand"], k["reserviert"], k["kommission"], k["gesperrt"], k["offen_bestellt"]), (16, 3, 4, 2, 5))
        self.assertEqual(k["verfuegbar"], 16 - 3 - 4 - 2 + 5)

    def test_reservierung_hoechstens_menge(self):
        self.assertEqual(NL.disponierbar([{"menge": 2, "reserviert": 5}])["verfuegbar"], 0)

    def test_ausloesung_und_menge(self):
        self.assertFalse(NL.unter_meldebestand(6, 5, 20))
        self.assertTrue(NL.unter_meldebestand(5, 5, 20))  # Meldebestand erreicht
        self.assertFalse(NL.unter_meldebestand(0, 0, 0))  # Regel ohne Ziel inaktiv
        self.assertEqual(NL.vorschlag_menge(6, 5, 20), 0)
        self.assertEqual(NL.vorschlag_menge(4, 5, 20), 16)
        self.assertEqual(NL.vorschlag_menge(4, 5, 20, bestellmenge_min=24), 24)
        self.assertEqual(NL.vorschlag_menge(4, 5, 20, verpackungseinheit=6), 18)
        self.assertEqual(NL.vorschlag_menge(-3, 0, 2), 5)  # Überverkauf wird mit aufgefüllt
        self.assertEqual(NL.vorschlag_menge(5, 5, 5), 1)  # mindestens 1

    def test_regelpruefung(self):
        self.assertIsNone(NL.pruefe_regel(5, 20, 0))
        self.assertIn("Zielbestand", NL.pruefe_regel(10, 5))
        self.assertIn("negativ", NL.pruefe_regel(-1, 5))

    def test_wiederbeschaffung_und_empfehlung(self):
        self.assertEqual(NL.wiederbeschaffung_tage(10, 6), (10, "manuell"))
        self.assertEqual(NL.wiederbeschaffung_tage(None, 6, 3), (42, "Lieferant Lieferzeit"))
        self.assertEqual(NL.wiederbeschaffung_tage(None, None, 3, 8), (21, "Produkt"))
        self.assertEqual(NL.wiederbeschaffung_tage(None, None, None, 8), (56, "Lieferant Standard"))
        self.assertEqual(NL.wiederbeschaffung_tage(), (None, None))
        self.assertEqual(NL.meldebestand_empfehlung(90, 90, 14, 7), 21)
        self.assertIsNone(NL.meldebestand_empfehlung(0, 90, 14))

    def test_offene_menge_lagerort(self):
        pos = [
            {"menge": 10, "menge_erhalten": 4, "lieferadresse": "Lager"},
            {"menge": 3, "menge_erhalten": 0, "lieferadresse": "Showroom"},
            {"menge": 5, "menge_erhalten": 0, "lieferadresse": "Kunde direkt"},
            {"menge": 2, "menge_erhalten": 0, "lieferadresse": "Lager", "kommission": "PRJ-1"},
            {"menge": 7, "menge_erhalten": 0, "lieferadresse": None},
        ]
        self.assertEqual(NL.offene_menge(pos, "Lager", 2, "Lager", "Showroom"), 6)
        self.assertEqual(NL.offene_menge(pos, "Lager", 1, "Lager", "Showroom"), 16)  # genau eine Regel: alles außer Kunde direkt/Kommission
        self.assertEqual(NL.offene_menge(pos, "Showroom", 2, "Lager", "Showroom"), 3)


class TestStichtag(unittest.TestCase):
    def test_rueckrechnung(self):
        jetzt = {"LB1": 5, "LB2": 3, "LB3": 0}
        danach = [
            {"art": "Verkauf", "menge": 2, "lagerbestand": "LB1"},
            {"art": "Wareneingang", "menge": 4, "lagerbestand": "LB1"},
            {"art": "Umlagerung", "menge": 1, "lagerbestand": "LB2", "lagerbestand_von": "LB1"},
            {"art": "Inventur", "menge": -1, "lagerbestand": "LB3"},
            {"art": "Reservierung", "menge": 1, "lagerbestand": "LB2"},
            {"art": "Umlagerung", "menge": 2, "lagerbestand": "LB2"},  # alte Bewegung ohne Quellzeile
        ]
        erg, unbekannt = IL.bestand_zum_stichtag(jetzt, danach)
        self.assertEqual(erg["LB1"], 5 + 2 - 4 + 1)
        self.assertEqual(erg["LB2"], 3 - 1 - 2)
        self.assertEqual(erg["LB3"], 1)
        self.assertEqual(unbekannt, 2)

    def test_umlagerung_platz_gleiche_zeile(self):
        self.assertEqual(IL.zeilen_wirkung({"art": "Umlagerung", "menge": 3, "lagerbestand": "A", "lagerbestand_von": "A"}), [])


class TestBewertung(unittest.TestCase):
    EREIGNISSE = [
        {"delta": 10, "ek_cent": 1000},
        {"delta": -4},
        {"delta": 6, "ek_cent": 1600},  # (6×1000 + 6×1600)/12 = 1300
        {"delta": 1},  # Retoure ohne EK – Ø bleibt
        {"delta": 2, "ek_cent": 1800},
    ]

    def test_gleitender_durchschnitt(self):
        avg, bestand = IL.gleitender_durchschnitt(self.EREIGNISSE[:3])
        self.assertEqual((avg, bestand), (1300, 12))
        avg, bestand = IL.gleitender_durchschnitt(self.EREIGNISSE)
        self.assertEqual(bestand, 15)
        self.assertEqual(avg, round((13 * 1300 + 2 * 1800) / 15))

    def test_neubeginn_nach_null(self):
        avg, _b = IL.gleitender_durchschnitt([{"delta": 2, "ek_cent": 500}, {"delta": -2}, {"delta": 1, "ek_cent": 900}])
        self.assertEqual(avg, 900)

    def test_methoden_und_rueckfall(self):
        self.assertEqual(IL.einstandspreis("Letzter EK", self.EREIGNISSE), (1800, "Letzter EK"))
        self.assertEqual(IL.einstandspreis("Gleitender Durchschnitt", [], 4200), (4200, "Rückfall EK"))
        self.assertEqual(IL.einstandspreis("Letzter EK", [{"delta": 3}]), (0, "ohne EK"))
        with self.assertRaises(ValueError):
            IL.einstandspreis("FIFO", [])

    def test_abwertung_staffel(self):
        self.assertEqual(IL.bewertungsart({"ausstellungsstueck": 1}), "Ausstellungsstueck")
        self.assertEqual(IL.bewertungsart({"zustand": "B-Ware"}), "B-Ware")
        self.assertEqual(IL.bewertungsart({"zustand": "Neu"}), "Lagerware")
        self.assertEqual(IL.alter_monate("2024-03-15", "2025-03-14"), 11)
        self.assertEqual(IL.alter_monate("2024-03-15", "2025-03-15"), 12)
        self.assertEqual(IL.abwertung_promille("Ausstellungsstueck", 11), 200)
        self.assertEqual(IL.abwertung_promille("Ausstellungsstueck", 12), 400)
        self.assertEqual(IL.abwertung_promille("Ausstellungsstueck", 50), 800)
        self.assertEqual(IL.abwertung_promille("B-Ware", 0), 300)
        self.assertEqual(IL.abwertung_promille("Lagerware", 10), 0)
        self.assertEqual(IL.abwertung_promille("Lagerware", 30), 500)
        self.assertEqual(IL.abwertung_promille("B-Ware", 5, [{"art": "B-Ware", "ab_monate": 0, "abwertung_promille": 1500}]), 1000)

    def test_niederstwert(self):
        r = IL.bewerte(3, 10000, 200)
        self.assertEqual((r["einzelwert_cent"], r["wert_ak_cent"], r["abwertung_cent"], r["wert_cent"], r["niederstwert"]), (8000, 30000, 6000, 24000, False))
        ne = IL.nettoerloes(8400, 2000, 100)  # 7000 netto − 10 % = 6300
        self.assertEqual(ne, 6300)
        r = IL.bewerte(1, 10000, 200, ne)
        self.assertEqual((r["wert_cent"], r["niederstwert"]), (6300, True))
        self.assertIsNone(IL.nettoerloes(0))
        self.assertEqual(IL.bewerte(-2, 500)["wert_cent"], 0)

    def test_summen_und_veraenderung(self):
        z = [{"lagerort": "Lager", "menge": 2, "wert_ak_cent": 100, "abwertung_cent": 10, "wert_cent": 90},
             {"lagerort": "Lager", "menge": 1, "wert_ak_cent": 50, "abwertung_cent": 0, "wert_cent": 50},
             {"lagerort": "Showroom", "menge": 1, "wert_ak_cent": 70, "abwertung_cent": 20, "wert_cent": 50}]
        s = IL.summen(z, "lagerort")
        self.assertEqual([(x["gruppe"], x["menge"], x["wert_cent"], x["positionen"]) for x in s], [("Lager", 3, 140, 2), ("Showroom", 1, 50, 1)])
        self.assertEqual(IL.bestandsveraenderung(1000, 400), (600, "Erhoehung"))
        self.assertEqual(IL.bestandsveraenderung(400, 1000), (600, "Minderung"))
        self.assertEqual(IL.bestandsveraenderung(5, 5), (0, None))


class TestAbdeckung(unittest.TestCase):
    PLAETZE = [
        {"lagerort": "Lager", "platz": "A1", "zuletzt": "2026-02-01"},
        {"lagerort": "Lager", "platz": "A2", "zuletzt": None},
        {"lagerort": "Lager", "platz": "A3", "zuletzt": "2025-11-30"},
        {"lagerort": "Lager", "platz": "A4", "zuletzt": "2025-06-01"},
    ]

    def test_geschaeftsjahr(self):
        self.assertEqual(IL.geschaeftsjahr("2026-11-04", 1), (date(2026, 1, 1), date(2026, 12, 31)))
        self.assertEqual(IL.geschaeftsjahr("2026-02-04", 4), (date(2025, 4, 1), date(2026, 3, 31)))

    def test_abdeckung_und_rueckstand(self):
        a = IL.abdeckung(self.PLAETZE, "2026-07-02", 1)
        self.assertEqual((a["gesamt"], a["gezaehlt"], a["offen"], a["quote_promille"]), (4, 1, 3, 250))
        self.assertAlmostEqual(a["soll_promille"], 500, delta=2)
        self.assertEqual(a["rueckstand"], 1)

    def test_vorschlag_reihenfolge(self):
        v = IL.plaetze_vorschlagen(self.PLAETZE, "2026-07-02", 1, 3)
        self.assertEqual([p["platz"] for p in v], ["A2", "A4", "A3"])
        self.assertEqual(IL.plaetze_je_woche(0, "2026-07-02"), 0)
        self.assertGreaterEqual(IL.plaetze_je_woche(26, "2026-07-02"), 1)

    def test_platzliste_und_vier_augen(self):
        self.assertEqual(IL.platzliste("A1\n A2 ,A1\n\n"), ["A1", "A2"])
        self.assertTrue(IL.vier_augen_verletzt("lena@x", "lena@x"))
        self.assertFalse(IL.vier_augen_verletzt("lena@x", "chef@x"))
        self.assertFalse(IL.vier_augen_verletzt("Administrator", "Administrator"))
        self.assertFalse(IL.vier_augen_verletzt("lena@x", "lena@x", aktiv=False))


if __name__ == "__main__":
    unittest.main()
