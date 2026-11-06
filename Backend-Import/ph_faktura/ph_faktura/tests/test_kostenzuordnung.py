"""Kostenzuordnung von Eingangsrechnungen – reine Logik (ohne Frappe)."""

import unittest

from ph_faktura.rechenwerk import kostenzuordnung as K


class TestAufteilung(unittest.TestCase):
    def test_prozent_rundung_auf_groesste_zeile(self):
        b, d = K.aufteilen(100000, [{"prozent": 33.33}, {"prozent": 33.33}, {"prozent": 33.34}])
        self.assertEqual((b, d), ([33330, 33330, 33340], 0))
        b, d = K.aufteilen(100, [{"prozent": 100 / 3}, {"prozent": 100 / 3}, {"prozent": 100 / 3}])
        self.assertEqual(sum(b), 100)
        self.assertEqual(d, 0)
        self.assertEqual(b, [34, 33, 33])  # Rest auf die (erste) größte Zeile

    def test_betrag_und_prozent_gemischt(self):
        b, d = K.aufteilen(100001, [{"betrag_cent": 20000}, {"prozent": 80}])
        self.assertEqual((b, d), ([20000, 80001], 0))

    def test_fehlender_anteil_wird_nicht_versteckt(self):
        b, d = K.aufteilen(100000, [{"prozent": 50}, {"prozent": 40}])
        self.assertEqual(d, 10000)

    def test_gutschrift_negativ(self):
        b, d = K.aufteilen(-30001, [{"prozent": 50}, {"prozent": 50}])
        self.assertEqual(sum(b), -30001)
        self.assertEqual(d, 0)
        self.assertEqual(K.vorzeichen("Gutschrift"), -1)

    def test_aus_positionen(self):
        pos = [{"pos": 1, "art": "Produkt", "netto_cent": 50000, "bezeichnung": "Sofa"}, {"pos": 2, "art": "Text"},
               {"pos": 3, "art": "Leistung", "netto_cent": 12000, "bezeichnung": "Fracht"}, {"pos": 4, "art": "Produkt", "alternativ": 1, "netto_cent": 1}]
        z = K.aus_positionen(pos, [{"belegposition": 3, "projekt": "P2", "kostenart": "Fracht"}], projekt="P1", kostenart="Ware")
        self.assertEqual([(x["belegposition"], x["projekt"], x["kostenart"], x["betrag_cent"]) for x in z], [(1, "P1", "Ware", 50000), (3, "P2", "Fracht", 12000)])
        self.assertEqual(K.pruefen("Nach Positionen", 62000, z), [])

    def test_anteilig(self):
        z = K.anteilig(10001, [{"projekt": "P1", "kostenart": "Ware", "betrag_cent": 2}, {"projekt": "P2", "kostenart": "Ware", "betrag_cent": 1}])
        self.assertEqual(sum(x["betrag_cent"] for x in z), 10001)
        self.assertEqual(z[0]["betrag_cent"], 6667)


class TestPruefen(unittest.TestCase):
    def test_modi(self):
        self.assertEqual(K.pruefen("Gemeinkosten", 1000, []), [])
        self.assertTrue(K.pruefen("Gemeinkosten", 1000, [{"projekt": "P1"}]))
        self.assertTrue(K.pruefen("", 1000, []))
        self.assertEqual(K.pruefen("Ganz einem Projekt", 1000, [{"projekt": "P1", "kostenart": "Ware", "betrag_cent": 1000}]), [])
        f = K.pruefen("Ganz einem Projekt", 1000, [{"projekt": "P1", "kostenart": "", "betrag_cent": 900}, {"projekt": "", "kostenart": "Ware", "betrag_cent": 1}])
        self.assertEqual(len(f), 4)  # Kostenart, Projekt, genau eine Zeile, Summe
        self.assertTrue(K.pruefen("Nach Positionen", 2, [{"belegposition": 1, "projekt": "P", "kostenart": "W", "betrag_cent": 1}, {"belegposition": 1, "projekt": "P", "kostenart": "W", "betrag_cent": 1}]))

    def test_status_und_protokoll(self):
        self.assertEqual(K.status("Aliquot", 10, [{"projekt": "P", "kostenart": "W", "betrag_cent": 10}]), "Vollstaendig")
        self.assertEqual(K.status("Aliquot", 10, [{"projekt": "P", "kostenart": "W", "betrag_cent": 9}]), "Offen")
        self.assertEqual(K.status("Gemeinkosten", 10, []), "Gemeinkosten")
        self.assertEqual(K.unterschied([{"projekt": "P1", "kostenart": "Ware", "betrag_cent": 100}], [{"projekt": "P2", "kostenart": "Ware", "betrag_cent": 100}]), "P1/Ware 1.00 → P2/Ware 1.00")


if __name__ == "__main__":
    unittest.main()
