"""Tests ohne Site: Gutscheincodes byte-gleich zu src/lib/payments/codes.js."""

import hashlib
import re
import unittest

from ph_shop import gutschein_code as gc


class TestGutscheinCode(unittest.TestCase):
    def test_format(self):
        code = gc.neuer_code()
        self.assertRegex(code, r"^PH(-[%s]{4}){4}$" % gc.ALPHABET)
        self.assertNotIn("0", code[3:])
        self.assertNotIn("O", code[3:])
        test = gc.neuer_code(test=True)
        self.assertTrue(test.startswith("TEST-PH-"))

    def test_normalisieren_wie_website(self):
        norm = gc.normalisiere(" ph-7k3q-x9ma-2bcd-efgh ")
        self.assertEqual(norm, "7K3QX9MA2BCDEFGH")
        self.assertEqual(gc.normalisiere("test-ph-7K3Q-X9MA-2BCD-EFGH"), "TEST7K3QX9MA2BCDEFGH")
        self.assertIsNone(gc.normalisiere("PH-0000-1111-2222-3333"))  # 0 und 1 nicht im Alphabet (keine Ersetzung!)
        self.assertIsNone(gc.normalisiere("PH-7K3Q"))
        self.assertIsNone(gc.normalisiere(None))

    def test_hash_formel(self):
        norm = "7K3QX9MA2BCDEFGH"
        self.assertEqual(gc.code_hash(norm), hashlib.sha256(b"ph-voucher:7K3QX9MA2BCDEFGH").hexdigest())
        self.assertEqual(gc.code_hash(norm), gc.code_hash(gc.normalisiere("ph 7k3q x9ma 2bcd efgh")))

    def test_bestellnummern(self):
        self.assertRegex(gc.bestellnummer("G"), r"^G-[%s]{4}-[%s]{4}$" % (gc.ALPHABET, gc.ALPHABET))
        self.assertRegex(gc.bestellnummer("AZ"), r"^AZ-[A-Z0-9]{4}-[A-Z0-9]{4}$")
        self.assertTrue(re.match(r"^[%s]{6}$" % gc.ALPHABET, gc.abholcode()))

    def test_abholcode_normalisieren(self):
        self.assertEqual(gc.normalisiere_abhol(" 7k3q o9 "), "7K3Q09")

    def test_letzte4(self):
        self.assertEqual(gc.letzte4("PH-7K3Q-X9MA-2BCD-EFGH"), "EFGH")


if __name__ == "__main__":
    unittest.main()


class TestGutscheinErgaenzungen(unittest.TestCase):
    def test_abholcode_mit_L_bleibt_erkennbar(self):
        # L ist Teil des Alphabets – darf nicht zu 1 werden (10-konzept-shop §10)
        self.assertEqual(gc.normalisiere_abhol("ab-l2kq"), "ABL2KQ")

    def test_steuer_mehrzweck_einzweck(self):
        m = gc.steuer("Mehrzweck")
        self.assertEqual((m["steuersatz_promille"], m["steuersatz"], m["umsatz_bei_verkauf"], m["zahlungsmittel"]), (0, "Null 0", False, True))
        self.assertEqual(gc.steuer("Einzweck", 1000)["steuersatz"], "Ermaessigt-1 10")
        self.assertEqual(gc.steuer("Einzweck", "2000")["steuersatz_promille"], 2000)

    def test_einzweck_ohne_satz_fehler(self):
        for satz in (None, "", 0, 1234):
            with self.assertRaises(gc.GutscheinSteuerFehler):
                gc.steuer("Einzweck", satz)

    def test_rabattgutschein(self):
        r = gc.steuer("Rabatt")
        self.assertEqual((r["steuersatz"], r["mindert_entgelt"], r["zahlungsmittel"]), (None, True, False))

    def test_sperrgruende(self):
        self.assertTrue(gc.sperrgrund_gueltig("Verlust gemeldet"))
        self.assertFalse(gc.sperrgrund_gueltig("weil"))
