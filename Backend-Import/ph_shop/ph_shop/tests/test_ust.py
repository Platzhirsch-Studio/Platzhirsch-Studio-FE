"""Tests ohne Site: USt-Aufteilung 1:1 zu src/lib/shop/ust.js (Regeln 1–7)."""

import unittest

from ph_shop import ust


class TestUst(unittest.TestCase):
    def test_ust_aus_brutto(self):
        self.assertEqual(ust.ust_aus_brutto(12000, 2000), 2000)  # 120 € brutto → 20 € USt
        self.assertEqual(ust.ust_aus_brutto(11000, 1000), 1000)
        # 9,99 € brutto: netto 832,5 → Math.round (JS) = 833 → USt 166; floor(x+0.5) rundet gleich.
        self.assertEqual(ust.ust_aus_brutto(999, 2000), 166)
        self.assertEqual(ust.ust_aus_brutto(1190, 1900), 190)

    def test_steuerland(self):
        self.assertEqual(ust.steuerland("abholung", "CH"), "AT")
        self.assertEqual(ust.steuerland("versand", "AT"), "AT")
        self.assertEqual(ust.steuerland("versand", "DE"), "AT")
        self.assertEqual(ust.steuerland("versand", "DE", oss_aktiv=True), "DE")
        self.assertIsNone(ust.steuerland("versand", "CH"))

    def test_ein_satz_versand_folgt(self):
        a = ust.aufteilung([{"summe_cent": 10000}], versand_cent=990, lieferart="versand", land="AT")
        self.assertEqual(a["steuerland"], "AT")
        self.assertEqual(len(a["posten"]), 1)
        p = a["posten"][0]
        self.assertEqual((p["satz_promille"], p["brutto_cent"], p["versand_cent"]), (2000, 10990, 990))
        self.assertEqual(p["ust_cent"], 10990 - round(10990 / 1.2))

    def test_gemischt_versand_anteilig(self):
        zeilen = [{"summe_cent": 6000, "ust_klasse": "normal"}, {"summe_cent": 4000, "kategorie": "bildband"}]
        a = ust.aufteilung(zeilen, versand_cent=1001, lieferart="versand", land="AT")
        self.assertEqual([p["satz_promille"] for p in a["posten"]], [2000, 1000])
        self.assertEqual(sum(p["versand_cent"] for p in a["posten"]), 1001)
        self.assertEqual(a["posten"][0]["versand_cent"], 601)  # 60 % von 1001 = 600,6 → Rest an größten Bruchteil
        self.assertEqual(a["posten"][1]["versand_cent"], 400)
        self.assertEqual(a["ust_cent"], sum(p["ust_cent"] for p in a["posten"]))
        self.assertEqual(a["zeilen_saetze"], [2000, 1000])

    def test_oss_de(self):
        a = ust.aufteilung([{"summe_cent": 11900}], versand_cent=0, lieferart="versand", land="DE", oss_aktiv=True)
        self.assertEqual(a["steuerland"], "DE")
        self.assertEqual(a["posten"][0]["satz_promille"], 1900)
        self.assertEqual(a["posten"][0]["ust_cent"], 1900)

    def test_ch_versand_nicht_unterstuetzt(self):
        a = ust.aufteilung([{"summe_cent": 100}], 0, "versand", "CH")
        self.assertIsNone(a["steuerland"])
        self.assertEqual(a["posten"], [])

    def test_anteilig(self):
        self.assertEqual(ust.anteilig(100, [1, 1, 1]), [34, 33, 33])
        self.assertEqual(ust.anteilig(0, [1, 2]), [0, 0])
        self.assertEqual(ust.anteilig(5, [0, 0]), [5, 0])


if __name__ == "__main__":
    unittest.main()
