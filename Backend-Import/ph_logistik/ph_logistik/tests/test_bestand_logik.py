"""Bestandslogik ohne Site: Bewegungsarten, Konsistenz, Inventurdifferenzen, Paketprofile-Port."""

import unittest

from ph_logistik.ph_logistik.bestand_logik import BestandsFehler, anwenden, inventur_differenzen, pruefe_bewegung, status_aus, verfuegbar, wirkung
from ph_logistik.ph_logistik.paketprofile import KATEGORIE_FAMILIE, PAKETTYPEN, karton_aus, profil, profil_nutzbar, tara_aus


class TestBestandLogik(unittest.TestCase):
    def test_wareneingang_verkauf_umlagerung(self):
        b = {}
        b = anwenden(b, {"art": "Wareneingang", "menge": 5, "lagerort_nach": "Lager"})
        self.assertEqual(b["Lager"]["menge"], 5)
        b = anwenden(b, {"art": "Umlagerung", "menge": 2, "lagerort_von": "Lager", "lagerort_nach": "Showroom"})
        self.assertEqual((b["Lager"]["menge"], b["Showroom"]["menge"]), (3, 2))
        b = anwenden(b, {"art": "Verkauf", "menge": 3, "lagerort_von": "Lager"})
        self.assertEqual(b["Lager"]["menge"], 0)
        self.assertEqual(sum(z["menge"] for z in b.values()), 2)  # Gesamtmenge konsistent

    def test_negativ_verboten(self):
        with self.assertRaises(BestandsFehler):
            anwenden({"Lager": {"menge": 1, "reserviert": 0}}, {"art": "Verkauf", "menge": 2, "lagerort_von": "Lager"})
        neu = anwenden({"Lager": {"menge": 1, "reserviert": 0}}, {"art": "Verkauf", "menge": 2, "lagerort_von": "Lager"}, negativ_erlaubt=True)
        self.assertEqual(neu["Lager"]["menge"], -1)

    def test_reservierung_und_freigabe(self):
        b = anwenden({"Lager": {"menge": 2, "reserviert": 0}}, {"art": "Reservierung", "menge": 1, "lagerort_von": "Lager"})
        self.assertEqual(b["Lager"]["reserviert"], 1)
        self.assertEqual(verfuegbar(b["Lager"]["menge"], b["Lager"]["reserviert"]), 1)
        with self.assertRaises(BestandsFehler):
            anwenden(b, {"art": "Reservierung", "menge": 2, "lagerort_von": "Lager"})
        b = anwenden(b, {"art": "Freigabe", "menge": 5, "lagerort_von": "Lager"})
        self.assertEqual(b["Lager"]["reserviert"], 0)

    def test_pruefungen(self):
        with self.assertRaises(BestandsFehler):
            pruefe_bewegung({"art": "Wareneingang", "menge": 0, "lagerort_nach": "L"})
        with self.assertRaises(BestandsFehler):
            pruefe_bewegung({"art": "Umlagerung", "menge": 1, "lagerort_von": "L", "lagerort_nach": "L"})
        self.assertTrue(pruefe_bewegung({"art": "Umlagerung", "menge": 1, "lagerort_von": "L", "lagerort_nach": "L", "platz_nach": "B"}))
        with self.assertRaises(BestandsFehler):
            pruefe_bewegung({"art": "Beamen", "menge": 1})
        self.assertEqual(wirkung({"art": "Inventur", "menge": -2, "lagerort_nach": "L"}), [("L", -2, 0)])

    def test_status(self):
        self.assertEqual(status_aus(3, 0), "Verfuegbar")
        self.assertEqual(status_aus(3, 3), "Reserviert")
        self.assertEqual(status_aus(0, 0, verkauft=True), "Verkauft")
        self.assertEqual(status_aus(0, 0, ausgeschieden=True), "Ausgeschieden")

    def test_inventur_differenzen(self):
        pos = [
            {"lagerbestand": "A", "produkt": "P1", "soll": 3, "ist": 2, "gezaehlt": 1, "grund": "Schwund"},
            {"lagerbestand": "B", "produkt": "P2", "soll": 1, "ist": 1, "gezaehlt": 1},
            {"lagerbestand": "C", "produkt": "P3", "soll": 1, "ist": 4, "gezaehlt": 1},
            {"lagerbestand": "D", "produkt": "P4", "soll": 1, "ist": 0, "gezaehlt": 0},
        ]
        n, gez, diff, summe, bew = inventur_differenzen(pos)
        self.assertEqual((n, gez, diff, summe), (4, 3, 2, 2))
        self.assertEqual([b["menge"] for b in bew], [-1, 3])
        self.assertEqual(bew[0]["art"], "Inventur")


class TestPaketprofile(unittest.TestCase):
    def test_formeln_wie_website(self):
        # paketprofile.js: kartonAus([36,22,22], 8) → [53,39,39]; taraAus → ceil((150+12*80.6)/50)*50 = 1150
        self.assertEqual(karton_aus([36, 22, 22], 8), [53, 39, 39])
        self.assertEqual(tara_aus((53, 39, 39)), 1150)
        k = profil("karaffe")
        self.assertEqual((k["laenge_cm"], k["breite_cm"], k["hoehe_cm"], k["tara_g"], k["gewicht_g"]), (53, 39, 39, 1150, 2950))

    def test_glas_versichert_und_gefahrgut_gesperrt(self):
        self.assertEqual(profil("glas-6er-set")["glas"], 1)
        self.assertEqual(profil("glas-6er-set")["max_stueck"], 6)
        self.assertEqual(profil("bildband-klein")["glas"], 0)
        self.assertTrue(profil("parfum")["versand_gesperrt"])
        self.assertTrue(profil("leuchte")["versand_gesperrt"])
        self.assertTrue(profil("streichhoelzer")["versand_gesperrt"])
        self.assertFalse(profil_nutzbar(profil("parfum"), "test"))
        self.assertTrue(profil_nutzbar(profil("vase-klein"), "test"))
        self.assertFalse(profil_nutzbar(profil("vase-klein"), "live"))  # Schätzung nur im Test
        self.assertFalse(profil_nutzbar(profil("diffuser"), "live"))
        self.assertTrue(profil_nutzbar({**profil("vase-klein"), "geprueft": 1}, "live"))

    def test_keys_eindeutig_und_kategorien(self):
        keys = [p["key"] for p in PAKETTYPEN]
        self.assertEqual(len(keys), len(set(keys)))
        self.assertEqual(len(keys), 29)
        self.assertEqual(KATEGORIE_FAMILIE["duftkerze"], "kerze")


if __name__ == "__main__":
    unittest.main()
