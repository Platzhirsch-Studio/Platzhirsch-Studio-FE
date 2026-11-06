"""Spedition (Lademeter, Volumen, Pflichtangaben) und Warenrücknahme (Buchungsplan) ohne Site."""

import unittest

from ph_logistik.ph_logistik import ruecknahme_logik as rl
from ph_logistik.ph_logistik import spedition_logik as sl


class TestSpedition(unittest.TestCase):
    def test_eur_palette_04_ldm(self):
        s = sl.summen([{"art": "Palette", "anzahl": 1, "laenge_cm": 120, "breite_cm": 80, "hoehe_cm": 150, "gewicht_g": 200000}])
        self.assertEqual(s["lademeter"], 0.4)
        self.assertEqual(s["volumen_m3"], 1.44)
        self.assertEqual(s["gewicht_g"], 200000)

    def test_stapelbar_teilt_flaeche(self):
        p = {"art": "Kolli", "anzahl": 4, "laenge_cm": 120, "breite_cm": 80, "hoehe_cm": 60, "gewicht_g": 10000}
        self.assertEqual(sl.summen([p])["lademeter"], 1.6)
        self.assertEqual(sl.summen([dict(p, stapelbar=1)])["lademeter"], 0.4)  # 240/60 = 4 übereinander
        self.assertEqual(sl.summen([dict(p, stapelbar=1)])["anzahl"], 4)
        self.assertEqual(sl.summen([dict(p, stapelbar=1)])["gewicht_g"], 40000)

    def test_fehlende_masse(self):
        s = sl.summen([{"art": "Moebel lose", "anzahl": 2, "gewicht_g": 50000}])
        self.assertEqual((s["fehlende_masse"], s["lademeter"], s["anzahl"]), (1, 0.0, 2))

    def test_pruefen(self):
        a = {"spediteur_email": "dispo@spedition.example", "abhol_plz": "6911", "abhol_ort": "Lochau", "ziel_plz": "6900", "ziel_ort": "Bregenz", "zustell_datum": "2026-11-10"}
        self.assertEqual(sl.pruefen(a, [{"art": "Kolli", "gewicht_g": 1000}]), [])
        f = sl.pruefen({}, [])
        self.assertIn("E-Mail des Spediteurs fehlt", f)
        self.assertIn("Mindestens ein Packstück ist nötig", f)
        self.assertTrue(any("Gewicht" in x for x in sl.pruefen(a, [{"art": "Kolli"}])))
        self.assertTrue(any("Zeitfenster" in x for x in sl.pruefen(dict(a, zustell_von="12:00", zustell_bis="10:00"), [{"gewicht_g": 1}])))

    def test_leistungen_text(self):
        t = sl.leistungen_text({"avis_noetig": 1, "etage": 3, "aufzug": 0, "trageservice": 1, "zustellart": "Mit Montage"})
        self.assertIn("Etage 3 ohne Aufzug", t)
        self.assertIn("Trageservice (2 Personen)", t)
        self.assertIn("Zustellung: Mit Montage", t)


class TestRuecknahme(unittest.TestCase):
    def test_regeln(self):
        self.assertIsNone(rl.position_fehler({"menge": 1, "produkt": "p", "zustand": "Neuwertig", "entscheidung": "Wiedereinlagern"}))
        self.assertIn("neuwertige", rl.position_fehler({"menge": 1, "produkt": "p", "zustand": "B-Ware", "entscheidung": "Wiedereinlagern"}))
        self.assertIn("Defekte", rl.position_fehler({"menge": 1, "produkt": "p", "zustand": "Defekt", "entscheidung": "B-Ware"}))
        self.assertIn("Menge", rl.position_fehler({"menge": 0}))
        self.assertIn("Produkt", rl.position_fehler({"menge": 1, "zustand": "Neuwertig", "entscheidung": "Wiedereinlagern"}))
        self.assertIsNone(rl.position_fehler({"menge": 1, "zustand": "Defekt", "entscheidung": "Ausbuchen"}))

    def test_buchungsplan(self):
        pos = [
            {"name": "a", "produkt": "sofa", "menge": 1, "zustand": "Neuwertig", "entscheidung": "Wiedereinlagern"},
            {"name": "b", "produkt": "tisch", "menge": 1, "zustand": "B-Ware", "entscheidung": "B-Ware"},
            {"name": "c", "produkt": "lampe", "menge": 2, "zustand": "Defekt", "entscheidung": "An Lieferant"},
            {"name": "d", "produkt": "stuhl", "menge": 1, "zustand": "Defekt", "entscheidung": "Ausbuchen"},
            {"name": "e", "produkt": "vase", "menge": 1, "zustand": "Neuwertig", "entscheidung": "Wiedereinlagern", "gebucht": 1},
            {"name": "f", "produkt": "kissen", "menge": 1},
        ]
        b = rl.buchungen(pos, "Lager Lochau")
        self.assertEqual([(x["position"], x["art"]) for x in b], [("a", "Retoure"), ("b", "Retoure"), ("c", "Retoure"), ("d", "Retoure"), ("d", "Ausbuchung")])
        self.assertEqual((b[0]["zustand"], b[0]["gesperrt"]), ("Neu", 0))
        self.assertEqual((b[1]["zustand"], b[1]["gesperrt"]), ("B-Ware", 0))
        self.assertEqual((b[2]["zustand"], b[2]["gesperrt"], b[2]["menge"]), ("B-Ware", 1, 2))
        self.assertEqual(b[4]["lagerort_von"], "Lager Lochau")
        self.assertFalse(rl.vollstaendig(pos))
        self.assertTrue(rl.vollstaendig(pos[:5]))


if __name__ == "__main__":
    unittest.main()
