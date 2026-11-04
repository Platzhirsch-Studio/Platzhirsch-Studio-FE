"""Tests ohne Site: cd Backend-Import/ph_kassa && PYTHONPATH=. python -m unittest discover -s ph_kassa/tests -t ."""

import unittest

from ph_kassa.logik.betraege import KassenFehler, beleg_pruefen, format_rksv, netto_aus_brutto, rueckgeld, stueckelung, summen, zahlarten_pruefen


class TestBetraege(unittest.TestCase):
    def test_netto_aus_brutto(self):
        self.assertEqual(netto_aus_brutto(12000, "Normal 20"), (10000, 2000))
        self.assertEqual(netto_aus_brutto(11000, "Ermaessigt-1 10"), (10000, 1000))
        self.assertEqual(netto_aus_brutto(11300, "Ermaessigt-2 13"), (10000, 1300))
        self.assertEqual(netto_aus_brutto(5000, "Null 0"), (5000, 0))
        self.assertEqual(netto_aus_brutto(11900, "Besonders 19"), (10000, 1900))
        netto, ust = netto_aus_brutto(999, "Normal 20")
        self.assertEqual(netto + ust, 999)
        with self.assertRaises(KassenFehler):
            netto_aus_brutto(100, "Falsch")

    def test_summen_je_steuersatz(self):
        s = summen(
            [
                {"art": "Artikel", "bezeichnung": "Sofa", "menge": 1, "einzel_brutto_cent": 120000, "steuersatz": "Normal 20"},
                {"art": "Artikel", "bezeichnung": "Kissen", "menge": 3, "einzel_brutto_cent": 2400, "steuersatz": "Normal 20"},
                {"art": "Freitext", "bezeichnung": "Buch", "menge": 1, "einzel_brutto_cent": 2200, "steuersatz": "Ermaessigt-1 10"},
                {"art": "Gutschein Verkauf", "bezeichnung": "Gutschein", "menge": 1, "einzel_brutto_cent": 10000, "steuersatz": "Null 0"},
            ]
        )
        self.assertEqual(s["gesamt_cent"], 120000 + 7200 + 2200 + 10000)
        self.assertEqual(s["je_satz"]["Normal 20"]["brutto_cent"], 127200)
        self.assertEqual(s["je_satz"]["Normal 20"]["netto_cent"], 106000)
        self.assertEqual(s["je_satz"]["Normal 20"]["ust_cent"], 21200)
        self.assertEqual(s["je_satz"]["Ermaessigt-1 10"]["ust_cent"], 200)
        self.assertEqual(s["je_satz"]["Null 0"]["ust_cent"], 0)
        self.assertEqual(s["rksv"]["betrag_normal_cent"], 127200)
        self.assertEqual(s["rksv"]["betrag_ermaessigt1_cent"], 2200)
        self.assertEqual(s["rksv"]["betrag_null_cent"], 10000)
        self.assertEqual(s["rksv"]["betrag_besonders_cent"], 0)
        self.assertEqual(s["netto_cent"] + s["ust_cent"], s["gesamt_cent"])

    def test_gutschein_einloesung_negativ(self):
        s = summen([{"art": "Artikel", "menge": 1, "einzel_brutto_cent": 5000, "steuersatz": "Normal 20"}, {"art": "Gutschein Einloesung", "menge": 1, "einzel_brutto_cent": 2000, "steuersatz": "Normal 20"}])
        self.assertEqual(s["gesamt_cent"], 3000)

    def test_rueckgeld_und_stueckelung(self):
        self.assertEqual(rueckgeld(4350, 5000), 650)
        self.assertEqual(rueckgeld(5000, 4000), -1000)
        self.assertEqual(stueckelung(650), [(500, 1), (100, 1), (50, 1)])
        self.assertEqual(stueckelung(28763), [(20000, 1), (5000, 1), (2000, 1), (1000, 1), (500, 1), (200, 1), (50, 1), (10, 1), (2, 1), (1, 1)])
        with self.assertRaises(KassenFehler):
            stueckelung(-1)

    def test_zahlarten_bar_rueckgeld(self):
        z = zahlarten_pruefen(4350, [{"zahlart": "Bar", "gegeben_cent": 5000}])
        self.assertEqual(z["rueckgeld_cent"], 650)
        self.assertEqual(z["zahlarten"][0]["betrag_cent"], 4350)
        self.assertEqual(z["zahlarten"][0]["retour_cent"], 650)
        self.assertEqual(z["barumsatz_cent"], 4350)

    def test_zahlarten_split(self):
        z = zahlarten_pruefen(10000, [{"zahlart": "Gutschein", "betrag_cent": 3000, "rest_cent": 5000, "gutschein": "G1"}, {"zahlart": "Bar", "gegeben_cent": 10000}])
        self.assertEqual(z["rueckgeld_cent"], 3000)
        bar = next(x for x in z["zahlarten"] if x["zahlart"] == "Bar")
        self.assertEqual(bar["betrag_cent"], 7000)
        self.assertEqual(z["barumsatz_cent"], 10000)

    def test_zahlarten_fehler(self):
        with self.assertRaises(KassenFehler):
            zahlarten_pruefen(10000, [{"zahlart": "Bar", "gegeben_cent": 9000}])
        with self.assertRaises(KassenFehler):
            zahlarten_pruefen(10000, [{"zahlart": "Karte Stripe Terminal", "betrag_cent": 12000}])
        with self.assertRaises(KassenFehler):
            zahlarten_pruefen(10000, [{"zahlart": "Gutschein", "betrag_cent": 6000, "rest_cent": 5000}])
        with self.assertRaises(KassenFehler):
            zahlarten_pruefen(10000, [{"zahlart": "Ueberweisung", "betrag_cent": 9000}])
        with self.assertRaises(KassenFehler):
            zahlarten_pruefen(10000, [])

    def test_ueberweisung_kein_barumsatz(self):
        z = zahlarten_pruefen(10000, [{"zahlart": "Ueberweisung", "betrag_cent": 10000}])
        self.assertEqual(z["barumsatz_cent"], 0)
        self.assertEqual(z["zahlarten"][0]["barumsatz"], 0)

    def test_beleg_pruefen_komplett(self):
        b = beleg_pruefen([{"art": "Anzahlung", "menge": 1, "einzel_brutto_cent": 300000, "steuersatz": "Normal 20"}], [{"zahlart": "Karte Stripe Terminal", "betrag_cent": 300000, "terminal_payment_intent": "pi_x"}])
        self.assertEqual(b["gesamt_cent"], 300000)
        self.assertEqual(b["rueckgeld_cent"], 0)
        self.assertEqual(b["rksv"]["betrag_normal_cent"], 300000)

    def test_format_rksv(self):
        self.assertEqual(format_rksv(123456), "1234,56")
        self.assertEqual(format_rksv(-50), "-0,50")
        self.assertEqual(format_rksv(0), "0,00")


if __name__ == "__main__":
    unittest.main()
