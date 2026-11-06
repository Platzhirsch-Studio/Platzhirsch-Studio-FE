"""Packtisch nach JTL ohne Site (33-referenz-jtl-packtisch.md Abschnitt 4)."""

import unittest

from ph_logistik.ph_logistik import packtisch_regeln as R

VORGAENGE = [
    {"name": "LS-2026-00010", "bestellung": "PH-S-26.11.04.-00001", "auftrag": None, "kommission": None, "datum": "2026-11-02",
     "positionen": [{"ean": "4001", "menge": 2, "menge_gepackt": 0}, {"ean": "4002", "menge": 1, "menge_gepackt": 0}]},
    {"name": "LS-2026-00011", "bestellung": None, "auftrag": "AB-2026-0005", "kommission": "Hotel Adler", "datum": "2026-11-03",
     "positionen": [{"ean": "4001", "menge": 1, "menge_gepackt": 0}]},
    {"name": "LS-2026-00012", "bestellung": None, "auftrag": None, "kommission": None, "datum": "2026-11-01", "zurueckgestellt": 1,
     "positionen": [{"ean": "4001", "menge": 1, "menge_gepackt": 0}]},
]


class TestVorgang(unittest.TestCase):
    def test_nummern(self):
        self.assertEqual(R.vorgang_aus_scan("ls-2026-00010", VORGAENGE)["art"], "lieferschein")
        self.assertEqual(R.vorgang_aus_scan("PH-S-26.11.04.-00001", VORGAENGE)["lieferschein"], "LS-2026-00010")
        self.assertEqual(R.vorgang_aus_scan("AB-2026-0005", VORGAENGE)["lieferschein"], "LS-2026-00011")
        # zurückgestellt nur per direkter Nummer
        self.assertEqual(R.vorgang_aus_scan("LS-2026-00012", VORGAENGE)["lieferschein"], "LS-2026-00012")

    def test_kommission(self):
        r = R.vorgang_aus_scan("KOM:Hotel Adler", VORGAENGE)
        self.assertEqual((r["lieferschein"], r["art"]), ("LS-2026-00011", "kommission"))

    def test_artikel_wenigste_positionen(self):
        r = R.vorgang_aus_scan("4001", VORGAENGE)
        self.assertEqual((r["lieferschein"], r["art"]), ("LS-2026-00011", "artikel"))
        self.assertNotIn("LS-2026-00012", r["kandidaten"])
        self.assertIsNone(R.vorgang_aus_scan("9999", VORGAENGE)["lieferschein"])
        self.assertIsNone(R.vorgang_aus_scan("", VORGAENGE)["lieferschein"])


class TestMenge(unittest.TestCase):
    P = {"menge": 4, "menge_gepackt": 1}

    def test_bestaetigung(self):
        self.assertTrue(R.menge_pruefen(self.P, 1)["ok"])
        r = R.menge_pruefen(self.P, 3)
        self.assertEqual((r["ok"], r["bestaetigen"]), (False, True))
        self.assertTrue(R.menge_pruefen(self.P, 3, bestaetigt=True)["ok"])
        self.assertTrue(R.menge_pruefen(self.P, 3, mengen_bestaetigen=False)["ok"])

    def test_fehler(self):
        self.assertEqual(R.menge_pruefen(self.P, 4)["fehler"], "zu_viel")
        self.assertEqual(R.menge_pruefen(self.P, 0)["fehler"], "ungueltig")
        self.assertEqual(R.menge_pruefen(self.P, "x")["fehler"], "ungueltig")
        self.assertEqual(R.menge_pruefen({"menge": 1, "menge_gepackt": 1}, 1)["fehler"], "vollstaendig")

    def test_ohne_barcode(self):
        self.assertTrue(R.ohne_barcode({"ean": " ", "seriennummer": None}))
        self.assertFalse(R.ohne_barcode({"ean": "4001"}))
        self.assertFalse(R.ohne_barcode({"seriennummer": "SN1"}))


POS = [{"name": "a", "beschreibung": "Vase", "menge": 2, "menge_gepackt": 2}, {"name": "b", "beschreibung": "Kissen", "menge": 3, "menge_gepackt": 1}]


class TestPakete(unittest.TestCase):
    def test_inhalt(self):
        r = R.inhalt_pruefen([{"paket_nr": 1, "inhalt_map": {"a": 1}}, {"paket_nr": 2, "inhalt_map": {"a": 1, "b": 2}}], POS)
        self.assertEqual(r["fehler"], [("b", 2, 1)])
        r = R.inhalt_pruefen([{"paket_nr": 1, "inhalt_map": {"a": 1, "x": 1}}], POS)
        self.assertIn(("x", 1, 0), r["fehler"])
        self.assertEqual(r["ohne_paket"], {"a": 1, "b": 1})
        self.assertEqual(R.inhalt_text({"a": 2, "b": 0}, POS), "2× Vase")

    def test_gewicht_vorschlag(self):
        g, fehlend = R.gewicht_vorschlag({"a": 2, "b": 1}, POS, {"a": 800}, {"tara_g": 400})
        self.assertEqual((g, fehlend), (2000, ["b"]))
        self.assertEqual(R.gewicht_vorschlag({}, POS, {}, {"gewicht_g": 1500})[0], 1500)

    def test_plausibel(self):
        self.assertEqual(R.gewicht_plausibel(0, 1000), (False, "gewicht_fehlt"))
        self.assertTrue(R.gewicht_plausibel(1200, 1000)[0])            # Mindesttoleranz 300 g
        self.assertEqual(R.gewicht_plausibel(1400, 1000)[1], "abweichung")
        self.assertTrue(R.gewicht_plausibel(11000, 10000)[0])          # 25 % von 10 kg
        self.assertEqual(R.gewicht_plausibel(5000, None, max_g=4000)[1], "ueber_profilgrenze")
        self.assertTrue(R.gewicht_plausibel(500, None)[0])

    def test_packmittel(self):
        prof = {"k1": {"key": "k1", "packmittel_produkt": "Karton S"}, "k2": {"key": "k2"}}
        b = R.packmittel_buchungen([{"paket_nr": 1, "paketprofil": "k1"}, {"paket_nr": 2, "paketprofil": "k2"}, {"paket_nr": 3, "paketprofil": "k1", "packmittel_gebucht": 1}], prof)
        self.assertEqual(b, [{"produkt": "Karton S", "menge": 1, "paket_nr": 1, "profil": "k1"}])


class TestRegeln(unittest.TestCase):
    def test_packhinweise(self):
        regeln = [
            {"bezeichnung": "Glas", "kategorie": "glaeser", "hinweis": "Polster + Fragile", "bestaetigen": 1, "prioritaet": 5},
            {"bezeichnung": "CH", "laender": "Drittland", "hinweis": "Zollpapiere außen"},
            {"bezeichnung": "Wert", "wert_ab_cent": 100000, "hinweis": "Siegelband"},
            {"bezeichnung": "Aus", "aktiv": 0, "hinweis": "x"},
            {"bezeichnung": "Zerbr", "nur_zerbrechlich": 1, "hinweis": "Oben"},
        ]
        h = R.packhinweise(regeln, {"kategorien": {"Glaeser"}, "land": "CH", "warenwert_cent": 5000, "zerbrechlich": False})
        self.assertEqual([x["bezeichnung"] for x in h], ["Glas", "CH"])
        self.assertEqual(h[0]["bestaetigen"], 1)
        h = R.packhinweise(regeln, {"land": "AT", "warenwert_cent": 150000, "zerbrechlich": True})
        self.assertEqual(sorted(x["bezeichnung"] for x in h), ["Wert", "Zerbr"])

    def test_dokumente(self):
        regeln = [
            {"bezeichnung": "LS", "dokument": "Lieferschein"},
            {"bezeichnung": "Rechnung", "dokument": "Rechnung", "print_format": "PH Rechnung Standard"},
            {"bezeichnung": "keine Rechnung bei Geschenk", "dokument": "Rechnung", "aktion": "Nicht beilegen", "geschenk": "ja"},
            {"bezeichnung": "Proforma Drittland", "dokument": "Proforma-Rechnung", "laender": "Drittland", "anzahl": 3},
            {"bezeichnung": "Retourenschein nur letzte", "dokument": "Retourenschein", "teillieferung": "Letzte Teillieferung"},
            {"bezeichnung": "Packliste Teil", "dokument": "Packliste", "teillieferung": "Teillieferung"},
        ]
        d = R.dokumente(regeln, {"land": "AT", "teillieferung_art": "Komplettlieferung"})
        self.assertEqual([x["dokument"] for x in d], ["Lieferschein", "Rechnung"])
        d = R.dokumente(regeln, {"land": "CH", "geschenk": True, "teillieferung_art": "Letzte Teillieferung"})
        self.assertEqual([x["dokument"] for x in d], ["Lieferschein", "Packliste", "Proforma-Rechnung", "Retourenschein"])
        self.assertEqual(next(x for x in d if x["dokument"] == "Proforma-Rechnung")["anzahl"], 3)
        self.assertEqual(R.dokumente([], {})[0]["print_format"], "PH Lieferschein Standard")
        self.assertEqual(R.dokumente([{"dokument": "Lieferschein", "aktion": "Nicht beilegen"}], {}), [])

    def test_teillieferung_art(self):
        self.assertEqual(R.teillieferung_art(False, True, False), "Komplettlieferung")
        self.assertEqual(R.teillieferung_art(True, True, True), "Erste Teillieferung")
        self.assertEqual(R.teillieferung_art(True, False, True), "Teillieferung")
        self.assertEqual(R.teillieferung_art(True, False, False), "Letzte Teillieferung")


class TestAbschluss(unittest.TestCase):
    def test_verpacken(self):
        self.assertIn("nicht_alles_gepackt", R.verpacken_pruefen(POS, [{"paket_nr": 1, "gewicht_g": 100}], "Versand"))
        self.assertEqual(R.verpacken_pruefen(POS, [{"paket_nr": 1, "gewicht_g": 100}], "Versand", teillieferung=True), [])
        voll = [dict(p, menge_gepackt=p["menge"]) for p in POS]
        g = R.verpacken_pruefen(voll, [{"paket_nr": 1, "gewicht_g": 0}], "Versand", hinweise_offen=1, zurueckgestellt=True)
        self.assertEqual(g, ["zurueckgestellt", "gewicht_paket_1", "packhinweise_bestaetigen"])
        self.assertEqual(R.verpacken_pruefen(voll, [], "Abholung"), [])
        self.assertEqual(R.verpacken_pruefen(voll, [], "Versand"), ["keine_pakete"])
        self.assertEqual(R.verpacken_pruefen(voll, [{"paket_nr": 1, "gewicht_g": 900}], "Versand", gewicht_ergebnisse={1: (False, "abweichung")}), ["gewicht_paket_1"])

    def test_tracking(self):
        ok, ohne = R.alle_pakete_mit_tracking([{"paket_nr": 1, "sendung": "S1"}, {"paket_nr": 2, "sendung": None}], {"S1": "AWB1"})
        self.assertEqual((ok, ohne), (False, [2]))
        self.assertTrue(R.alle_pakete_mit_tracking([{"paket_nr": 1, "sendung": "S1"}], {"S1": "AWB1"})[0])
        self.assertFalse(R.alle_pakete_mit_tracking([], {})[0])

    def test_teillieferung(self):
        bleibt, rest = R.teillieferung_aufteilen(POS)
        self.assertEqual(bleibt, {"a": 2, "b": 1})
        self.assertEqual(rest, [{"position": "b", "menge": 2}])
        with self.assertRaises(ValueError):
            R.teillieferung_aufteilen([{"name": "x", "menge": 1, "menge_gepackt": 0}])

    def test_schnellversand(self):
        prof = {"k": {"key": "k"}, "g": {"key": "g", "versand_gesperrt": "UN 1266"}}
        v = {"lieferart": "Versand", "positionen": [{"menge": 1, "paketprofil": "k"}]}
        self.assertEqual(R.schnellversand_moeglich(v, prof), (True, None))
        self.assertEqual(R.schnellversand_moeglich(v, prof, aktiv=False)[1], "aus")
        self.assertEqual(R.schnellversand_moeglich(dict(v, positionen=[{"menge": 2, "paketprofil": "k"}]), prof)[1], "mehrere_artikel")
        self.assertEqual(R.schnellversand_moeglich(dict(v, positionen=[{"menge": 1, "paketprofil": "g"}]), prof)[1], "gesperrt")
        self.assertEqual(R.schnellversand_moeglich(dict(v, lieferart="Abholung"), prof)[1], "lieferart")


if __name__ == "__main__":
    unittest.main()
