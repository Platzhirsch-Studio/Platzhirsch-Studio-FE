"""Integration Runde 3: Gutschrift aus Shop-Erstattung/Warenrücknahme, Lieferanten-Gutschrift, Regress-Ausbuchung,
Angebot aus Pflegevertrag – reine Logik ohne Frappe."""

import json
import unittest
from datetime import date

from ph_faktura.rechenwerk import export as E
from ph_faktura.rechenwerk import integration as IR


class TestShopErstattung(unittest.TestCase):
    SATZ = json.dumps({"posten": [{"satz_promille": 1000, "brutto_cent": 1100, "ust_cent": 100, "netto_cent": 1000}, {"satz_promille": 2000, "brutto_cent": 12000, "ust_cent": 2000, "netto_cent": 10000}], "versand": [], "zeilen": []})

    def test_je_satz_eine_position_absteigend(self):
        p = IR.gutschrift_positionen_aus_erstattung(self.SATZ, "Teilerstattung", "B-1")
        self.assertEqual([(x["ust_satz_promille"], x["einzel_netto_cent"]) for x in p], [(2000, 10000), (1000, 1000)])
        self.assertTrue(all(x["menge"] == 1 and "B-1" in x["bezeichnung"] for x in p))

    def test_netto_aus_brutto_wenn_fehlend(self):
        p = IR.gutschrift_positionen_aus_erstattung({"posten": [{"satz_promille": 2000, "brutto_cent": 1200}]}, "Kulanz")
        self.assertEqual(p[0]["einzel_netto_cent"], 1000)
        self.assertIn("Kulanz", p[0]["bezeichnung"])

    def test_ohne_posten_fehler(self):
        with self.assertRaises(IR.IntegrationFehler):
            IR.gutschrift_positionen_aus_erstattung("{}")
        with self.assertRaises(IR.IntegrationFehler):
            IR.gutschrift_positionen_aus_erstattung({"posten": [{"satz_promille": 2000, "brutto_cent": 0}]})

    def test_art(self):
        self.assertEqual(IR.gutschrift_art_aus_erstattung("Kulanz"), "Kulanz")
        self.assertEqual(IR.gutschrift_art_aus_erstattung("Teilstorno"), "Teilgutschrift")
        self.assertEqual(IR.gutschrift_art_aus_erstattung(None), "Teilgutschrift")


class TestWarenruecknahme(unittest.TestCase):
    RE = [
        {"name": "p1", "art": "Produkt", "produkt": "SOFA", "bezeichnung": "Sofa", "menge": 2, "einzel_netto_cent": 100000, "ust_satz_promille": 2000, "ab_position": "ab1"},
        {"name": "p2", "art": "Produkt", "produkt": "TISCH", "bezeichnung": "Tisch", "menge": 1, "einzel_netto_cent": 50000, "ust_satz_promille": 2000, "ab_position": "ab2"},
    ]

    def test_zuordnung_ab_position_und_produkt(self):
        out = IR.ruecknahme_positionen(self.RE, [{"ab_position": "ab1", "menge": 1}, {"produkt": "TISCH", "menge": 1}])
        self.assertEqual([(x["rechnung_position"], x["menge"]) for x in out], [("p1", 1), ("p2", 1)])
        self.assertEqual(out[0]["einzel_netto_cent"], 100000)

    def test_bereits_gutgeschrieben_deckelt(self):
        with self.assertRaises(IR.IntegrationFehler):
            IR.ruecknahme_positionen(self.RE, [{"ab_position": "ab1", "menge": 2, "beschreibung": "Sofa"}], {"p1": 1})
        out = IR.ruecknahme_positionen(self.RE, [{"ab_position": "ab1", "menge": 1}], {"p1": 1})
        self.assertEqual(out[0]["menge"], 1)

    def test_unbekannt_und_leer(self):
        with self.assertRaises(IR.IntegrationFehler):
            IR.ruecknahme_positionen(self.RE, [{"produkt": "LAMPE", "menge": 1}])
        with self.assertRaises(IR.IntegrationFehler):
            IR.ruecknahme_positionen(self.RE, [{"produkt": "SOFA", "menge": 0}])


class TestLieferantenGutschrift(unittest.TestCase):
    def test_vorzeichen_und_regressbetrag(self):
        self.assertEqual(IR.er_vorzeichen("Gutschrift"), -1)
        self.assertEqual(IR.er_vorzeichen(None), 1)
        self.assertEqual(IR.regress_betrag(10000, 12000), 10000)
        self.assertEqual(IR.regress_betrag(10000, 12000, "brutto"), 12000)

    def test_bmd_gutschrift_negativ(self):
        z = {"beleg_doctype": "PH Eingangsrechnung", "beleg": "ER-1", "nummer": "G-9", "datum": date(2026, 11, 4), "konto": "330000", "gegenkonto": "5000", "satz_promille": 2000, "netto_cent": 1000, "ust_cent": 200, "brutto_cent": 1200, "soll_haben": "S"}
        text, _ps = E.bmd_csv([z])
        zeile = text.splitlines()[1].split(";")
        self.assertEqual(zeile[9], "-12,00")
        self.assertEqual(zeile[10], "-2,00")
        text_h, _ = E.bmd_csv([{**z, "soll_haben": "H"}])
        self.assertEqual(text_h.splitlines()[1].split(";")[9], "12,00")

    def test_ausbuchung_zeile(self):
        z = IR.regress_ausbuchung_zeile("PH-REG-1", "Hersteller GmbH", date(2026, 11, 4), 2500, "330001", "7800", "Kulanz Lieferant")
        self.assertEqual((z["soll_haben"], z["brutto_cent"], z["ust_cent"], z["gegenkonto"], z["steuercode"]), ("S", 2500, 0, "7800", "0"))
        self.assertIn("PH-REG-1", z["text"])
        with self.assertRaises(IR.IntegrationFehler):
            IR.regress_ausbuchung_zeile("PH-REG-1", None, None, 0, "1", "2")
        text, _ = E.csv_generisch([z])
        self.assertIn("PH Lieferantenregress", text)


class TestPflegeAngebot(unittest.TestCase):
    ABO = {"art": "Wartungsvertrag", "bereich": "Whirlpool", "intervall_monate": 3, "preis_cent": 24000, "abrechnung": "Jaehrlich im Voraus", "leistungen": "Filterwechsel", "stuecke": [{"bezeichnung": "Spa 1"}], "mindestlaufzeit_monate": 12, "kuendigungsfrist_monate": 3}

    def test_jaehrlich_menge_termine(self):
        p = IR.pflege_angebot_positionen(self.ABO)
        self.assertEqual((p[0]["menge"], p[0]["einzel_netto_cent"], p[0]["ust_satz_promille"]), (4, 20000, 2000))
        self.assertIn("Spa 1", p[0]["ausfuehrung_text"])
        self.assertEqual(p[1]["art"], "Text")

    def test_je_termin(self):
        p = IR.pflege_angebot_positionen({**self.ABO, "art": "Pflege einmalig", "abrechnung": "Je Termin", "mindestlaufzeit_monate": 0, "kuendigungsfrist_monate": 0})
        self.assertEqual(len(p), 1)
        self.assertEqual(p[0]["menge"], 1)

    def test_ohne_preis_nie_schaetzen(self):
        with self.assertRaises(IR.IntegrationFehler):
            IR.pflege_angebot_positionen({**self.ABO, "preis_cent": 0})

    def test_termine_pro_jahr(self):
        self.assertEqual([IR.termine_pro_jahr(x) for x in (0, 1, 6, 12, 18)], [1, 12, 2, 1, 1])


class TestBestandsveraenderung(unittest.TestCase):
    """Export-Erweiterung Lager & Inventur (ph_logistik PH Inventurbewertung)."""

    def test_erhoehung_und_minderung(self):
        z = IR.bestandsveraenderung_zeile("PH-IB-2026-0001", date(2026, 12, 31), 123456, "1600", "5010")
        self.assertEqual((z["soll_haben"], z["brutto_cent"], z["ust_cent"], z["konto"], z["gegenkonto"], z["steuercode"]), ("S", 123456, 0, "1600", "5010", "0"))
        z = IR.bestandsveraenderung_zeile("PH-IB-2026-0002", date(2026, 12, 31), -5000, "1600", "5010")
        self.assertEqual((z["soll_haben"], z["brutto_cent"]), ("H", 5000))
        text, _ = E.bmd_csv([z])
        self.assertIn("PH-IB-2026-0002", text)

    def test_fehler(self):
        with self.assertRaises(IR.IntegrationFehler):
            IR.bestandsveraenderung_zeile("PH-IB-1", date(2026, 12, 31), 0, "1600", "5010")
        with self.assertRaises(IR.IntegrationFehler):
            IR.bestandsveraenderung_zeile("PH-IB-1", date(2026, 12, 31), 100, "", "5010")


if __name__ == "__main__":
    unittest.main()
