"""Tests ohne Site: Preislisten-Formate (CSV, DataNorm 4, XML/IDM-Preset) und Zuordnung."""

import unittest

from ph_sortiment.logik.preislisten_format import FormatFehler, betrag_cent, csv_lesen, datanorm_lesen, dekodieren, dezimal_erkennen, format_erkennen, lesen, mapping_aus_kopf, trennzeichen_erkennen, xml_lesen, zuordnen

CSV_DE = "Artikelnummer;Bezeichnung;Listenpreis;EAN;PE\n4711;Sofa Elba 3-Sitzer;2.490,00;4006381333931;1\n4712;Hocker;129,5;;1\n4713;Schrauben;12,00;;100\n;leer;1,00;;\n"
CSV_EN = "sku,name,price\nA-1,Chair,1234.50\nA-2,Table,99\n"
DATANORM = (
    "V;011126;Musterlieferant GmbH;Preisliste 2026;;EUR\n"
    "A;N;100200;00;Esstisch Eiche;massiv 200x100;1;0;Stk;249000;RG1;WG10;\n"
    "A;N;100300;00;Schraube;verzinkt;2;2;Stk;1500;RG9;WG99;\n"
    "A;L;100400;00;Geloescht;;1;0;Stk;100;;;\n"
    "P;A;100200;1;259000;1;0;0;0;100300;2;1800;1;0;0;0\n"
    "A;N;kaputt\n"
)
XML_IDM = """<?xml version="1.0"?><CATALOG xmlns="urn:x"><SERIE><ITEM TYPE_NO="K60" FEATURE="weiss"><ITEM_TEXT><SHORT_TEXT>Unterschrank 60</SHORT_TEXT></ITEM_TEXT><PRICE VALUE="412.30"/></ITEM><ITEM TYPE_NO="K80"><PRICE VALUE="x"/></ITEM></SERIE></CATALOG>"""


class TestCsv(unittest.TestCase):
    def test_trenner_dezimal_preiseinheit(self):
        e = csv_lesen(CSV_DE)
        self.assertEqual(e["trennzeichen"], ";")
        self.assertEqual(e["dezimal"], ",")
        self.assertEqual([z["artikelnr"] for z in e["zeilen"]], ["4711", "4712", "4713"])
        self.assertEqual(e["zeilen"][0]["preis_cent"], 249000)
        self.assertEqual(e["zeilen"][1]["preis_cent"], 12950)
        self.assertEqual(e["zeilen"][2]["preis_cent"], 12)  # 12,00 € je 100 Stück
        self.assertEqual(e["zeilen"][0]["ean"], "4006381333931")

    def test_englisch_punkt(self):
        e = csv_lesen(CSV_EN)
        self.assertEqual(e["trennzeichen"], ",")
        self.assertEqual(e["dezimal"], ".")
        self.assertEqual(e["zeilen"][0]["preis_cent"], 123450)
        self.assertEqual(e["zeilen"][1]["preis_cent"], 9900)

    def test_mapping_json_vorrang(self):
        text = "Typ;Text;Netto EUR\nX1;Bank;100,00\n"
        with self.assertRaises(FormatFehler):
            csv_lesen(text)
        e = csv_lesen(text, mapping={"artikelnr": "Typ", "preis": "Netto EUR", "bezeichnung": "Text"})
        self.assertEqual(e["zeilen"][0]["preis_cent"], 10000)
        self.assertEqual(mapping_aus_kopf(["Typ", "Netto EUR"], {"artikelnr": "typ"})["artikelnr"], "Typ")

    def test_altformat_neu_cent(self):
        e = csv_lesen("hersteller_artikelnr;neu_cent\nA;12345\n")
        self.assertEqual(e["zeilen"][0]["preis_cent"], 12345)

    def test_fehlerhafte_preise(self):
        e = csv_lesen("artnr;preis\nA;abc\nB;5,00\n")
        self.assertEqual(len(e["zeilen"]), 1)
        self.assertEqual(e["fehler"][0][0], 2)

    def test_helfer(self):
        self.assertEqual(trennzeichen_erkennen("a\tb\tc\n1\t2\t3"), "\t")
        self.assertEqual(dezimal_erkennen(["1.234,56", "12,5"]), ",")
        self.assertEqual(betrag_cent("1,234.56", "."), 123456)
        self.assertIsNone(betrag_cent(""))
        self.assertEqual(dekodieren("Möbel".encode("cp1252"))[1], "cp1252")
        self.assertEqual(dekodieren("﻿Möbel".encode("utf-8"))[0], "Möbel")


class TestDataNorm(unittest.TestCase):
    def test_a_und_p_saetze(self):
        e = datanorm_lesen(DATANORM)
        nach = {z["artikelnr"]: z for z in e["zeilen"]}
        self.assertEqual(set(nach), {"100200", "100300"})  # Löschsatz übersprungen
        self.assertEqual(nach["100200"]["preis_cent"], 259000)  # P-Satz überschreibt
        self.assertEqual(nach["100200"]["preiskennzeichen"], "brutto")
        self.assertEqual(nach["100300"]["preis_cent"], 18)  # 1800 Cent je 100 Stück
        self.assertEqual(nach["100300"]["preiskennzeichen"], "netto")
        self.assertEqual(nach["100200"]["bezeichnung"], "Esstisch Eiche massiv 200x100")
        self.assertEqual(e["waehrung"], "EUR")
        self.assertEqual(len(e["fehler"]), 1)

    def test_erkennung(self):
        self.assertEqual(format_erkennen(DATANORM), "DataNorm")
        self.assertEqual(format_erkennen(CSV_DE), "CSV")
        self.assertEqual(format_erkennen(XML_IDM), "XML")
        e = lesen(DATANORM.encode("cp1252"))
        self.assertEqual(e["format"], "DataNorm")
        self.assertTrue(e["hinweise"])


class TestXml(unittest.TestCase):
    def test_idm_preset_namespace(self):
        e = lesen(XML_IDM, format="IDM-XML")
        self.assertEqual(len(e["zeilen"]), 1)
        z = e["zeilen"][0]
        self.assertEqual((z["artikelnr"], z["preis_cent"], z["bezeichnung"], z["ausfuehrung"]), ("K60", 41230, "Unterschrank 60", "weiss"))
        self.assertEqual(len(e["fehler"]), 1)
        self.assertTrue(any("unverifiziert" in h for h in e["hinweise"]))

    def test_eigenes_mapping_und_sicherheit(self):
        x = "<L><Art><Nr>9</Nr><Preis>1.234,00</Preis></Art></L>"
        e = xml_lesen(x, {"artikel": "Art", "artikelnr": "Nr", "preis": "Preis", "dezimal": ","})
        self.assertEqual(e["zeilen"][0]["preis_cent"], 123400)
        with self.assertRaises(FormatFehler):
            xml_lesen('<!DOCTYPE x [<!ENTITY a "b">]><x/>')


class TestZuordnung(unittest.TestCase):
    def test_reihenfolge_sku_artikelnr_ean(self):
        zeilen = csv_lesen(CSV_DE)["zeilen"]
        stat = zuordnen(zeilen, {"4711": "elba"}, {"4006381333931": "falsch"}, {"4712": ("hocker", "hocker::farbe::rot")})
        self.assertEqual(zeilen[0]["produkt"], "elba")
        self.assertEqual(zeilen[0]["zuordnung"], "artikelnr")
        self.assertEqual(zeilen[1]["ausfuehrung_name"], "hocker::farbe::rot")
        self.assertEqual(zeilen[1]["zuordnung"], "sku")
        self.assertEqual(stat, {"zugeordnet": 2, "ohne": 1})


if __name__ == "__main__":
    unittest.main()
