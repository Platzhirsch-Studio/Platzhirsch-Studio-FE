"""Tests ohne Site: Lieferzeit, Liefertermin mit Betriebsurlaub, Sammeln je Lieferant, Terminänderungen, AB-Ausführung."""

import unittest
from datetime import date

from ph_sortiment.logik.abgleich import abweichungen_position, klaerung, mengen_abgleich, reklamation_text
from ph_sortiment.logik.bestellung import aenderung_text, fruehester_wunschtermin, gruppieren, lieferzeit_fuer, liefertermin_schaetzen, terminaenderungen, verschiebung_tage


class TestLieferzeit(unittest.TestCase):
    def test_spezifischste_regel(self):
        regeln = [{"wochen_von": 6, "wochen_bis": 8}, {"marke": "rolf-benz", "wochen_von": 10, "wochen_bis": 12}, {"kategorie": "sofa", "wochen_von": 12}, {"marke": "rolf-benz", "kategorie": "sofa", "wochen_von": 14, "wochen_bis": 16}]
        self.assertEqual(lieferzeit_fuer(regeln, "rolf-benz", "sofa"), (14, 16))
        self.assertEqual(lieferzeit_fuer(regeln, "rolf-benz", "tisch"), (10, 12))
        self.assertEqual(lieferzeit_fuer(regeln, "x", "sofa"), (12, 12))
        self.assertEqual(lieferzeit_fuer(regeln, "x", "y"), (6, 8))
        self.assertEqual(lieferzeit_fuer([], standard_wochen=4), (4, 4))
        self.assertEqual(lieferzeit_fuer([]), (None, None))

    def test_termin_mit_betriebsurlaub(self):
        # 04.11.2026 (Mi) + 2 Wochen = 18.11. (Mi)
        self.assertEqual(liefertermin_schaetzen("2026-11-04", 2), date(2026, 11, 18))
        # Urlaub 09.–13.11. (5 Tage) → +5 Tage = 23.11. (Mo)
        self.assertEqual(liefertermin_schaetzen("2026-11-04", 2, [{"von": "2026-11-09", "bis": "2026-11-13"}]), date(2026, 11, 23))
        # Werksferien 14.–31.12. (18 Tage) verlängern: 16.12. + 18 = 03.01. (So) → Mo 04.01.2027
        self.assertEqual(liefertermin_schaetzen("2026-11-04", 6, [{"von": "2026-12-14", "bis": "2026-12-31"}]), date(2027, 1, 4))
        # Wochenende → Montag
        self.assertEqual(liefertermin_schaetzen("2026-11-07", 1), date(2026, 11, 16))
        self.assertIsNone(liefertermin_schaetzen("2026-11-04", None))


class TestSammeln(unittest.TestCase):
    def test_gruppieren_idempotent(self):
        pos = [
            {"produkt": "sofa", "menge": 1, "bezug_zeile": "r1"},
            {"produkt": "tisch", "menge": "2", "bezug_zeile": "r2", "lieferant": "Direkt GmbH"},
            {"bezeichnung": "Sonderteil", "menge": 1, "bezug_zeile": "r3"},
            {"produkt": "sofa", "menge": 0, "bezug_zeile": "r4"},
            {"produkt": "sofa", "menge": 1, "bezug_zeile": "r5"},
            {"produkt": "sofa", "menge": 1, "bezug_zeile": "r1"},
        ]
        gruppen, ohne, ueber, ungueltig = gruppieren(pos, lambda p: "Marke AG" if p.get("produkt") == "sofa" else None, schon_bestellt={"r5"})
        self.assertEqual(sorted(gruppen), ["Direkt GmbH", "Marke AG"])
        self.assertEqual([p["bezug_zeile"] for p in gruppen["Marke AG"]], ["r1"])
        self.assertEqual(gruppen["Direkt GmbH"][0]["menge"], 2)
        self.assertEqual(ohne, ["r3"])
        self.assertEqual(ueber, ["r5", "r1"])
        self.assertEqual(ungueltig, ["r4"])
        self.assertEqual(fruehester_wunschtermin([{"wunschtermin": "2026-12-01"}, {"wunschtermin": "2026-11-20"}, {}]), date(2026, 11, 20))


class TestTerminaenderung(unittest.TestCase):
    def test_kopf_und_positionen(self):
        alt = [{"name": "a", "idx": 1, "bestaetigter_termin": "2026-12-01", "bezug_zeile": "r1"}, {"name": "b", "idx": 2, "bestaetigter_termin": None}]
        neu = [{"name": "a", "idx": 1, "bestaetigter_termin": "2026-12-15", "bezug_zeile": "r1"}, {"name": "b", "idx": 2, "bestaetigter_termin": "2026-12-03"}]
        out = terminaenderungen("2026-12-01", "2026-12-15", alt, neu)
        self.assertEqual(len(out), 2)  # Kopf + Pos 1; Pos 2 ist Erstbestätigung
        self.assertEqual(out[1]["bezug_zeile"], "r1")
        self.assertEqual(verschiebung_tage(out[1]), 14)
        self.assertIn("+14 Tage", aenderung_text(out[1], "Sofa"))
        self.assertEqual(terminaenderungen(None, "2026-12-01", [], []), [])
        weg = terminaenderungen(None, None, alt[:1], [{"name": "a", "idx": 1, "bestaetigter_termin": None}])
        self.assertIn("entfernt", aenderung_text(weg[0]))


class TestAbAusfuehrung(unittest.TestCase):
    def test_ausfuehrung_abweichung(self):
        pos = {"menge": 1, "ausfuehrung_text": "Stoff Elba, Blau", "ab_ausfuehrung_text": "stoff elba blau"}
        self.assertEqual(abweichungen_position(pos, 1), [])
        pos["ab_ausfuehrung_text"] = "Stoff Elba Grau"
        z = abweichungen_position(pos, 1)
        self.assertEqual(z[0]["feld"], "Ausfuehrung")
        self.assertIn("Stoff Elba Grau", reklamation_text(z, "HB-2026-00001", "AB-77"))

    def test_klaerung_und_mengen(self):
        self.assertEqual(klaerung("akzeptieren"), ("ok", "akzeptiert"))
        self.assertEqual(klaerung("kunde_rueckfragen")[0], "pruefen")
        with self.assertRaises(ValueError):
            klaerung("loeschen")
        self.assertEqual(mengen_abgleich(3, 2), (-1, "Unterlieferung"))
        self.assertEqual(mengen_abgleich(3, 4), (1, "Ueberlieferung"))
        self.assertEqual(mengen_abgleich(3, 3), (0, "keine"))


if __name__ == "__main__":
    unittest.main()
