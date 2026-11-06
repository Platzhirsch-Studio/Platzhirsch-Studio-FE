import unittest
from datetime import date

from ph_kundenkarte.utils import kartenregeln as kr

RANG = {"Platzhirsch": 1, "Platzhirsch Plus": 2, "Platzhirsch Privé": 3}


def karte(name, status="Aktiv", stufe="Platzhirsch", **kw):
    d = {"name": name, "status": status, "stufe": stufe}
    d.update(kw)
    return d


class TestSperrgrund(unittest.TestCase):
    def test_katalog_pflicht(self):
        self.assertFalse(kr.sperrgrund_pruefen(None)[0])
        self.assertFalse(kr.sperrgrund_pruefen("Irgendwas")[0])
        self.assertTrue(kr.sperrgrund_pruefen("Verlust")[0])
        self.assertFalse(kr.sperrgrund_pruefen("Sonstiges", " ")[0])
        self.assertTrue(kr.sperrgrund_pruefen("Sonstiges", "Karte im Auto vergessen")[0])

    def test_ersatz_und_entsperren(self):
        self.assertTrue(kr.ersatzkarte_vorgesehen("Verlust"))
        self.assertTrue(kr.ersatzkarte_vorgesehen("Diebstahl"))
        self.assertFalse(kr.ersatzkarte_vorgesehen("Missbrauch"))
        self.assertFalse(kr.entsperrbar("Diebstahl"))
        self.assertFalse(kr.entsperrbar("Datenschutz"))
        self.assertTrue(kr.entsperrbar("Kundenwunsch"))
        self.assertTrue(kr.entsperrbar(None))  # Altdaten ohne Katalogwert

    def test_aus_text(self):
        self.assertEqual(kr.sperrgrund_aus_text("Verlust"), "Verlust")
        self.assertEqual(kr.sperrgrund_aus_text("diebstahl"), "Diebstahl")
        self.assertEqual(kr.sperrgrund_aus_text("Datenschutz-Löschung"), "Datenschutz")
        self.assertEqual(kr.sperrgrund_aus_text("Karte im Auto"), "Sonstiges")
        self.assertIsNone(kr.sperrgrund_aus_text("  "))

    def test_optionen_entsprechen_katalog(self):
        self.assertEqual(kr.SPERRGRUND_OPTIONEN.split("\n"), list(kr.SPERRGRUENDE))


class TestKassa(unittest.TestCase):
    def test_codes(self):
        self.assertEqual(kr.kassa_bewertung("Aktiv")[0], "ok")
        self.assertEqual(kr.kassa_bewertung("Beantragt")[0], "card_pending")
        code, weiter, text = kr.kassa_bewertung("Gesperrt", "Diebstahl")
        self.assertEqual(code, "card_blocked")
        self.assertIn("gestohlen", text)
        self.assertEqual(kr.kassa_bewertung("Ersetzt")[:2], ("card_replaced", None))
        self.assertEqual(kr.kassa_bewertung("Uebertragen")[:2], ("card_transferred", None))
        self.assertEqual(kr.kassa_bewertung("Zusammengefuehrt", zusammengefuehrt_in="KK-ABCDEF")[:2], ("card_merged", "KK-ABCDEF"))
        self.assertEqual(kr.kassa_bewertung("Gekuendigt")[0], "card_cancelled")


class TestZusammenfuehren(unittest.TestCase):
    def test_nichts_zu_tun(self):
        self.assertIsNone(kr.zusammenfuehren_plan([karte("A")], RANG))
        self.assertIsNone(kr.zusammenfuehren_plan([karte("A"), karte("B", status="Gekuendigt")], RANG))

    def test_ziel_aktiv_vor_beantragt_und_hoehere_stufe(self):
        k = [karte("A", status="Beantragt", stufe="Platzhirsch Privé"), karte("B", stufe="Platzhirsch", ausgestellt_am="2025-01-01")]
        plan = kr.zusammenfuehren_plan(k, RANG)
        self.assertEqual(plan["ziel"], "B")
        self.assertEqual(plan["quellen"], ["A"])
        self.assertEqual(plan["werte"]["stufe"], "Platzhirsch Privé")

    def test_aeltere_karte_bei_gleichstand(self):
        k = [karte("B", ausgestellt_am="2026-03-01"), karte("A", ausgestellt_am="2024-03-01")]
        self.assertEqual(kr.ziel_waehlen(k, RANG), "A")

    def test_hoechste_stufe_fruehestes_seit_und_manuell(self):
        k = [
            karte("A", stufe="Platzhirsch Plus", stufe_seit="2026-02-01", ausgestellt_am="2024-01-01"),
            karte("B", stufe="Platzhirsch Plus", stufe_seit="2025-06-01", stufe_manuell=1, ausgestellt_am="2025-01-01"),
        ]
        plan = kr.zusammenfuehren_plan(k, RANG)
        self.assertEqual(plan["ziel"], "A")
        self.assertNotIn("stufe", plan["werte"])
        self.assertEqual(plan["werte"]["stufe_seit"], "2025-06-01")
        self.assertEqual(plan["werte"]["stufe_manuell"], 1)

    def test_juengste_einwilligung_gewinnt(self):
        k = [
            karte("A", ausgestellt_am="2024-01-01", einwilligung_auswertung=0),
            karte("B", ausgestellt_am="2025-01-01", einwilligung_auswertung=1, einwilligung_am="2026-05-01 10:00:00", einwilligung_textversion="v2"),
        ]
        plan = kr.zusammenfuehren_plan(k, RANG)
        self.assertEqual(plan["werte"]["einwilligung_auswertung"], 1)
        self.assertEqual(plan["werte"]["einwilligung_textversion"], "v2")
        # späterer Widerruf auf der anderen Karte gewinnt
        k[0].update(einwilligung_widerrufen_am="2026-06-01 09:00:00")
        k[1].update(einwilligung_auswertung=1)
        k0 = dict(k[0], einwilligung_auswertung=0)
        plan = kr.zusammenfuehren_plan([k0, k[1]], RANG)
        self.assertNotIn("einwilligung_auswertung", plan["werte"])  # Ziel A hat schon „aus“ – nichts ändern
        k2 = [dict(k[1], name="A", ausgestellt_am="2024-01-01"), dict(k0, name="B", ausgestellt_am="2025-01-01")]
        plan = kr.zusammenfuehren_plan(k2, RANG)
        self.assertEqual(plan["werte"]["einwilligung_auswertung"], 0)

    def test_felder_ergaenzen_und_warnung(self):
        k = [
            karte("A", ausgestellt_am="2024-01-01"),
            karte("B", status="Gesperrt", sperrgrund_art="Missbrauch", persoenlicher_berater="berater@x", geburtstag="1980-05-12"),
        ]
        plan = kr.zusammenfuehren_plan(k, RANG)
        self.assertEqual(plan["werte"]["persoenlicher_berater"], "berater@x")
        self.assertEqual(plan["werte"]["geburtstag"], "1980-05-12")
        self.assertEqual(len(plan["warnungen"]), 1)


class TestUebertragungErsatz(unittest.TestCase):
    def test_uebertragung(self):
        ok = lambda **kw: kr.uebertragung_pruefen(**{**dict(status="Aktiv", sperrgrund_art=None, alt_kontakt="K1", ziel_kontakt="K2", ziel_hat_karte=False, grund_art="Partner/Haushalt"), **kw})[0]
        self.assertTrue(ok())
        self.assertFalse(ok(grund_art="Laune"))
        self.assertFalse(ok(grund_art="Sonstiges"))
        self.assertTrue(ok(grund_art="Sonstiges", freitext="Schenkung"))
        self.assertFalse(ok(ziel_kontakt="K1"))
        self.assertFalse(ok(ziel_hat_karte=True))
        self.assertFalse(ok(status="Gekuendigt"))
        self.assertFalse(ok(status="Gesperrt", sperrgrund_art="Missbrauch"))
        self.assertTrue(ok(status="Gesperrt", sperrgrund_art="Kundenwunsch"))

    def test_ersatz(self):
        self.assertTrue(kr.ersatz_pruefen("Aktiv", None)[0])
        self.assertTrue(kr.ersatz_pruefen("Gesperrt", "Verlust")[0])
        self.assertFalse(kr.ersatz_pruefen("Gesperrt", "Missbrauch")[0])
        self.assertFalse(kr.ersatz_pruefen("Ersetzt", None)[0])

    def test_kette(self):
        self.assertEqual(kr.kette("C", {"C": "B", "B": "A", "A": None}), ["C", "B", "A"])
        self.assertEqual(kr.kette("C", {"C": "B", "B": "C"}), ["C", "B"])  # Zyklus
        self.assertEqual(kr.kette(None, {}), [])


class TestGeburtstag(unittest.TestCase):
    def test_parsen(self):
        self.assertEqual(kr.geburtstag_parsen("1980-05-12"), ("1980-05-12", "05-12"))
        self.assertEqual(kr.geburtstag_parsen("--05-12"), (None, "05-12"))
        self.assertEqual(kr.geburtstag_parsen("05-12"), (None, "05-12"))
        self.assertEqual(kr.geburtstag_parsen("12.5."), (None, "05-12"))
        self.assertEqual(kr.geburtstag_parsen("12.5.1980"), ("1980-05-12", "05-12"))
        self.assertEqual(kr.geburtstag_parsen("--02-29"), (None, "02-29"))
        self.assertEqual(kr.geburtstag_parsen("--02-30"), (None, None))
        self.assertEqual(kr.geburtstag_parsen("1800-01-01"), (None, None))
        self.assertEqual(kr.geburtstag_parsen("morgen"), (None, None))
        self.assertEqual(kr.geburtstag_parsen(None), (None, None))

    def test_heute(self):
        self.assertTrue(kr.geburtstag_heute("05-12", date(2026, 5, 12)))
        self.assertFalse(kr.geburtstag_heute("05-12", date(2026, 5, 13)))
        self.assertTrue(kr.geburtstag_heute("02-29", date(2026, 2, 28)))
        self.assertFalse(kr.geburtstag_heute("02-29", date(2028, 2, 28)))
        self.assertTrue(kr.geburtstag_heute("02-29", date(2028, 2, 29)))
        self.assertFalse(kr.geburtstag_heute(None, date(2026, 1, 1)))


class TestStufenplanVorschau(unittest.TestCase):
    STUFEN = [
        {"stufenname": "Platzhirsch", "reihenfolge": 1, "schwelle_jahresumsatz_cent": 0, "aktiv": 1},
        {"stufenname": "Platzhirsch Plus", "reihenfolge": 2, "schwelle_jahresumsatz_cent": 500_000, "aktiv": 1},
        {"stufenname": "Platzhirsch Privé", "reihenfolge": 3, "schwelle_jahresumsatz_cent": 5_000_000, "aktiv": 1},
    ]

    def test_vorschau(self):
        karten = [
            {"name": "A", "stufe": "Platzhirsch", "jahresumsatz_cent": 600_000, "einwilligung_auswertung": 1},
            {"name": "B", "stufe": "Platzhirsch Privé", "jahresumsatz_cent": 600_000, "einwilligung_auswertung": 1},
            {"name": "C", "stufe": "Platzhirsch", "jahresumsatz_cent": 100, "einwilligung_auswertung": 1},
            {"name": "D", "stufe": "Platzhirsch", "jahresumsatz_cent": 9_000_000, "einwilligung_auswertung": 0},
            {"name": "E", "stufe": "Platzhirsch", "jahresumsatz_cent": 9_000_000, "einwilligung_auswertung": 1, "stufe_manuell": 1},
        ]
        v = kr.stufenplan_vorschau(karten, self.STUFEN)
        self.assertEqual((v["auf"], v["ab"], v["gleich"], v["nicht_beurteilt"]), (1, 1, 1, 2))
        self.assertEqual(v["beispiele"][0], {"karte": "A", "alt": "Platzhirsch", "neu": "Platzhirsch Plus"})


class TestAnonymisierung(unittest.TestCase):
    def test_plan(self):
        plan = kr.anonymisierungsplan(["KK-AAAAAA"], ["E1"], ["A1"], 3)
        self.assertEqual({p["aktion"] for p in plan}, {"anonymisieren"})
        self.assertEqual([p["doctype"] for p in plan], ["PH Kundenkarte", "PH Kundenkarte Einloesung", "PH Kundenkarte Antrag", "PH Kundenkarte Ereignis"])
        self.assertEqual(kr.anonymisierungsplan([], [], []), [])


if __name__ == "__main__":
    unittest.main()
