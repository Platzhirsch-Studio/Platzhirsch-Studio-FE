import unittest

from ph_projekte.utils import kuechenplanung as kp

CSV = "Pos;Typ;Bezeichnung;Breite;Höhe;Tiefe;Menge;Front;VK-Preis;Raum\n1;US60;Unterschrank 1 Auszug;60 cm;720;560;2;Lack weiß matt;1.234,50;Küche\n2;;;;;;;;;\n3;HS30;Hochschrank;300;2100;560;1;Eiche;899;\n"
XML = """<?xml version="1.0"?><Order><Article Position="1" Code="GS60" Quantity="1"><Description>Geschirrspüler vollintegriert</Description><Manufacturer>Miele</Manufacturer><Price>1299.00</Price><Width>598</Width></Article><Article Position="2"><Description></Description></Article></Order>"""


class TestKuechenplanung(unittest.TestCase):
    def test_zahl(self):
        self.assertEqual(kp.zahl("1.234,56"), 1234.56)
        self.assertEqual(kp.zahl("1,234.56"), 1234.56)
        self.assertEqual(kp.zahl("12,5"), 12.5)
        self.assertEqual(kp.zahl("1.234.567"), 1234567.0)
        self.assertIsNone(kp.zahl("abc"))
        self.assertEqual(kp.mass_mm("60 cm"), 600)
        self.assertEqual(kp.mass_mm("2,1", "m"), 2100)

    def test_csv_synonyme(self):
        v = kp.vorschau("csv", CSV.encode("cp1252"))
        self.assertEqual(v["anzahl"], 2)
        p = v["positionen"][0]
        self.assertEqual((p["hersteller_artikelnr"], p["breite_mm"], p["menge"], p["vk_cent"], p["raum"]), ("US60", 600, 2, 123450, "Küche"))
        self.assertEqual(p["ausfuehrung_text"], "Lack weiß matt")
        self.assertEqual(v["summe_vk_cent"], 2 * 123450 + 89900)
        self.assertTrue(v["verifiziert"])
        self.assertTrue(any("Zeile 3" in w for w in v["warnungen"]))

    def test_csv_mapping(self):
        v = kp.vorschau("csv", "A,B,C\nTisch,3,500\n", '{"spalten": {"bezeichnung": "A", "menge": "B", "vk_cent": "C"}, "raum_standard": "Essen"}')
        self.assertEqual(v["positionen"][0]["menge"], 3)
        self.assertEqual(v["positionen"][0]["raum"], "Essen")

    def test_csv_ohne_bezeichnung(self):
        with self.assertRaises(kp.ImportFehler):
            kp.vorschau("csv", "x;y\n1;2\n")

    def test_xml_winner_vorlage_unverifiziert(self):
        v = kp.vorschau("winner_xml", XML)
        self.assertFalse(v["verifiziert"])
        self.assertIn("UNVERIFIZIERT", v["warnungen"][0])
        self.assertEqual(v["anzahl"], 1)
        p = v["positionen"][0]
        self.assertEqual((p["hersteller_artikelnr"], p["marke"], p["vk_cent"], p["breite_mm"]), ("GS60", "Miele", 129900, 598))

    def test_xml_generisch_und_sicherheit(self):
        v = kp.vorschau("xml", "<a><p n='Regal' m='2'/></a>", {"position": "p", "felder": {"bezeichnung": "@n", "menge": "@m"}})
        self.assertEqual(v["positionen"][0]["menge"], 2)
        with self.assertRaises(kp.ImportFehler):
            kp.vorschau("xml", '<!DOCTYPE x [<!ENTITY a "b">]><a/>', {"position": "p"})
        with self.assertRaises(kp.ImportFehler):
            kp.vorschau("xml", "<a/>", {})

    def test_registry(self):
        keys = {f["key"] for f in kp.formate()}
        self.assertTrue({"csv", "xml", "carat_csv", "kps_csv", "winner_xml"} <= keys)
        self.assertFalse(next(f for f in kp.formate() if f["key"] == "carat_csv")["verifiziert"])
        with self.assertRaises(kp.ImportFehler):
            kp.adapter("dwg")

    def test_carat_vorlage(self):
        v = kp.vorschau("carat_csv", "Typnummer;Typentext;Anzahl\nUS60;Unterschrank;1\n")
        self.assertEqual(v["positionen"][0]["hersteller_artikelnr"], "US60")
        self.assertFalse(v["verifiziert"])


if __name__ == "__main__":
    unittest.main()
