"""Tests ohne Site: Teilstorno/Teilerstattung (ph_shop/teilerstattung.py)."""

import unittest

from ph_shop import teilerstattung as te
from ph_shop import ust

POS = [
    {"key": "1", "menge": 3, "summe_cent": 10000, "ust_satz_promille": 2000},  # 3 Stück, 100 €
    {"key": "2", "menge": 1, "summe_cent": 4400, "ust_satz_promille": 1000},   # Bildband 44 €
]
VERSAND = [{"satz_promille": 2000, "versand_cent": 694}, {"satz_promille": 1000, "versand_cent": 296}]


class TestTeilerstattung(unittest.TestCase):
    def test_zeilenbetrag_rest_ohne_rundungsdifferenz(self):
        a = te.zeilenbetrag(10000, 3, 0, 0, 1)
        b = te.zeilenbetrag(10000, 3, 1, a, 1)
        c = te.zeilenbetrag(10000, 3, 2, a + b, 1)
        self.assertEqual((a, b, c), (3333, 3333, 3334))
        self.assertEqual(a + b + c, 10000)

    def test_menge_zu_gross(self):
        with self.assertRaises(te.ErstattungFehler):
            te.zeilenbetrag(10000, 3, 2, 6667, 2)

    def test_positionsweise_mit_ust_je_satz(self):
        r = te.berechne(POS, {"1": 1, "2": 1}, bezahlt_cent=15390)
        self.assertEqual(r["betrag_cent"], 3333 + 4400)
        saetze = {p["satz_promille"]: p for p in r["posten"]}
        self.assertEqual(saetze[2000]["ust_cent"], ust.ust_aus_brutto(3333, 2000))
        self.assertEqual(saetze[1000]["ust_cent"], 400)
        self.assertEqual(r["ust_cent"], saetze[2000]["ust_cent"] + 400)

    def test_versand_folgt_der_ware(self):
        r = te.berechne(POS, {}, versand_cent=990, versand_posten=VERSAND, bezahlt_cent=15390)
        self.assertEqual(r["betrag_cent"], 990)
        self.assertEqual({v["satz_promille"]: v["versand_cent"] for v in r["versand"]}, {2000: 694, 1000: 296})
        with self.assertRaises(te.ErstattungFehler):
            te.berechne(POS, {}, versand_cent=991, versand_posten=VERSAND, bezahlt_cent=15390)

    def test_kulanz_anteilig(self):
        r = te.berechne(POS, None, kulanz_cent=1440, bezahlt_cent=15390)
        saetze = {p["satz_promille"]: p["brutto_cent"] for p in r["posten"]}
        self.assertEqual(sum(saetze.values()), 1440)
        self.assertEqual(saetze[2000], 1000)
        self.assertEqual(saetze[1000], 440)

    def test_nie_mehr_als_bezahlt(self):
        with self.assertRaises(te.ErstattungFehler):
            te.berechne(POS, {"1": 3}, bezahlt_cent=10000, erstattet_cent=1)
        r = te.berechne(POS, {"1": 3}, bezahlt_cent=0, nur_storno=True)
        self.assertEqual(r["betrag_cent"], 10000)

    def test_leer_und_unbekannt(self):
        with self.assertRaises(te.ErstattungFehler):
            te.berechne(POS, {}, bezahlt_cent=100)
        with self.assertRaises(te.ErstattungFehler):
            te.berechne(POS, {"9": 1}, bezahlt_cent=100)

    def test_verteilung_gutschein_zuletzt(self):
        z = [
            {"name": "Z1", "kanal": "Gutschein", "offen_cent": 5000, "zeit": "2026-11-01 10:00"},
            {"name": "Z2", "kanal": "Stripe Checkout", "offen_cent": 3900, "zeit": "2026-11-01 10:01"},
        ]
        self.assertEqual(te.verteile_auf_zahlungen(4000, z), [{"name": "Z2", "kanal": "Stripe Checkout", "betrag_cent": 3900}, {"name": "Z1", "kanal": "Gutschein", "betrag_cent": 100}])
        with self.assertRaises(te.ErstattungFehler):
            te.verteile_auf_zahlungen(9000, z)

    def test_status_und_zahlungsstand(self):
        self.assertEqual(te.status_nach_erstattung(8900, 8900, 8900), "erstattet")
        self.assertEqual(te.status_nach_erstattung(8900, 8900, 100), "teilerstattet")
        self.assertIsNone(te.status_nach_erstattung(8900, 8900, 0))
        self.assertEqual(te.zahlungsstand(8900, 5000, 3900), (8900, True))
        self.assertEqual(te.zahlungsstand(8900, 5000, 1000), (6000, False))

    def test_ersatz_zeilen(self):
        self.assertEqual(te.ersatz_zeilen(POS, {"1": 2, "2": 0}), [{"key": "1", "menge": 2}])
        with self.assertRaises(te.ErstattungFehler):
            te.ersatz_zeilen(POS, {"1": 4})
        with self.assertRaises(te.ErstattungFehler):
            te.ersatz_zeilen(POS, {})


if __name__ == "__main__":
    unittest.main()
