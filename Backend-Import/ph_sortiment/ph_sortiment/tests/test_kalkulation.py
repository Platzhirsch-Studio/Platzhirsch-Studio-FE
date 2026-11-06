"""Tests ohne Site: EK mit Gültigkeit, Kalkulationsfaktor, Rundung, Variantenmatrix."""

import unittest

from ph_sortiment.logik.kalkulation import ausschluesse, faktor_fuer, gueltiger_ek, kombi_schluessel, netto_ek_cent, rohertrag_promille, runden, variante_preis, vk_aus_ek


class TestEk(unittest.TestCase):
    def test_netto_rabattkette(self):
        self.assertEqual(netto_ek_cent(100000, 400, 50), 57000)
        self.assertEqual(netto_ek_cent(100000), 100000)
        with self.assertRaises(ValueError):
            netto_ek_cent(1, 1200)

    def test_gueltiger_ek(self):
        zeilen = [
            {"ab": "2026-01-01", "bis": "2026-06-30", "netto_ek_cent": 100, "lieferant": "A"},
            {"ab": "2026-07-01", "bis": None, "netto_ek_cent": 120, "lieferant": "A"},
            {"ab": "2026-12-01", "netto_ek_cent": 130, "lieferant": "A"},
            {"ab": "2026-08-01", "netto_ek_cent": 90, "lieferant": "B"},
        ]
        self.assertEqual(gueltiger_ek(zeilen, "2026-03-01")["netto_ek_cent"], 100)
        self.assertEqual(gueltiger_ek(zeilen, "2026-11-04", lieferant="A")["netto_ek_cent"], 120)
        self.assertEqual(gueltiger_ek(zeilen, "2026-11-04")["netto_ek_cent"], 90)
        self.assertIsNone(gueltiger_ek(zeilen, "2025-01-01"))


class TestFaktor(unittest.TestCase):
    def test_vk_aus_ek_und_rundung(self):
        self.assertEqual(vk_aus_ek(57000, 2200), 125400)
        self.assertEqual(vk_aus_ek(57000, 2200, "auf 9er-Endung"), 125900)
        self.assertEqual(vk_aus_ek(57001, 2000, "auf 10 Euro"), 115000)
        self.assertIsNone(vk_aus_ek(57000, 0))
        with self.assertRaises(ValueError):
            vk_aus_ek(100, 900)

    def test_runden(self):
        self.assertEqual(runden(123901, "auf 9er-Endung"), 124900)
        self.assertEqual(runden(123900, "auf 9er-Endung"), 123900)
        self.assertEqual(runden(100001, "auf 1 Euro"), 100100)
        self.assertEqual(runden(100001, "auf 5 Euro"), 100500)

    def test_override_kategorie(self):
        ov = [{"kategorie": "kueche", "faktor_promille": 1800, "rundung": "auf 10 Euro"}]
        self.assertEqual(faktor_fuer(2200, "kueche", ov), (1800, "auf 10 Euro"))
        self.assertEqual(faktor_fuer(2200, "sofa", ov), (2200, None))

    def test_rohertrag(self):
        self.assertEqual(rohertrag_promille(50000, 120000, 2000), 500)


class TestVariante(unittest.TestCase):
    def setUp(self):
        self.gewaehlt = {
            "bezug": {"option_id": "stoff-elba-blau", "preisgruppe": "PG3", "aufpreis_cent": 30000, "ek_aufpreis_cent": 12000},
            "breite": {"option_id": "200", "aufpreis_cent": 20000, "ek_aufpreis_cent": 8000},
            "fuss": {"option_id": "chrom", "aufpreis_cent": 5000, "nicht_kombinierbar_mit": "bezug=stoff-xx"},
        }

    def test_aufpreise_ohne_matrix(self):
        r = variante_preis(200000, self.gewaehlt, basis_ek_cent=90000)
        self.assertEqual((r["vk_cent"], r["ek_cent"], r["quelle"]), (255000, 110000, "aufpreise"))

    def test_matrix_spezifischste_zeile(self):
        matrix = [
            {"kombination": "bezug=PG3", "vk_cent": 260000, "ek_cent": 100000},
            {"kombination": kombi_schluessel({"bezug": "PG3", "breite": "200"}), "vk_cent": 290000, "ek_cent": 120000},
            {"kombination": "bezug=PG3|breite=200", "vk_cent": 1, "ab": "2099-01-01"},
        ]
        r = variante_preis(200000, self.gewaehlt, matrix, basis_ek_cent=90000, heute="2026-11-04")
        self.assertEqual(r["matrix_kombination"], "bezug=PG3|breite=200")
        self.assertEqual(r["vk_cent"], 295000)  # Matrix + Aufpreis Fuß
        self.assertEqual(r["ek_cent"], 120000)

    def test_ausschluss_und_pflicht(self):
        g = dict(self.gewaehlt)
        g["bezug"] = {"option_id": "stoff-xx"}
        self.assertTrue(ausschluesse(g))
        r = variante_preis(1000, {"breite": {"option_id": "200"}}, pflicht_gruppen=("bezug",))
        self.assertIn("Pflichtgruppe bezug ohne Auswahl", r["fehler"])


if __name__ == "__main__":
    unittest.main()
