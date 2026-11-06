import unittest
from datetime import datetime, timedelta

from ph_kundenkarte.utils import antrag as an
from ph_kundenkarte.utils import karte as k


class TestKartennummer(unittest.TestCase):
    def test_normalisierung(self):
        self.assertEqual(k.normalisiere_kartennummer("kk 7k3qx9"), "KK-7K3QX9")
        self.assertEqual(k.normalisiere_kartennummer("KK7K3QX9"), "KK-7K3QX9")
        self.assertEqual(k.normalisiere_kartennummer("  kk-7k3qx9\n"), "KK-7K3QX9")
        self.assertEqual(k.normalisiere_kartennummer("7K3QX9"), "KK-7K3QX9")
        self.assertEqual(k.normalisiere_kartennummer(""), "")
        self.assertEqual(k.normalisiere_kartennummer(None), "")

    def test_gueltigkeit(self):
        self.assertTrue(k.kartennummer_gueltig("KK-7K3QX9"))
        self.assertTrue(k.kartennummer_gueltig("kk7k3qx9"))
        self.assertFalse(k.kartennummer_gueltig("KK-7K3QX"))  # zu kurz
        self.assertFalse(k.kartennummer_gueltig("KK-7K3QX0"))  # 0 nicht im Alphabet
        self.assertFalse(k.kartennummer_gueltig("KK-7K3QXO"))  # O nicht im Alphabet
        self.assertFalse(k.kartennummer_gueltig("PT-7K3QX9"))
        self.assertFalse(k.kartennummer_gueltig(""))

    def test_maskiert(self):
        self.assertEqual(k.kartennummer_maskiert("KK-7K3QX9"), "KK-••••X9")
        self.assertEqual(k.kartennummer_maskiert(""), "")


class TestAntrag(unittest.TestCase):
    def test_token(self):
        t = an.neuer_token()
        self.assertTrue(an.token_plausibel(t))
        self.assertEqual(len(an.hash_token(t)), 64)
        self.assertNotEqual(an.hash_token(t), an.hash_token(t + "x"))
        self.assertIsNone(an.hash_token(""))
        self.assertFalse(an.token_plausibel("kurz"))
        self.assertFalse(an.token_plausibel("a" * 30 + "!"))
        jetzt = datetime(2026, 11, 4, 12, 0)
        self.assertTrue(an.token_gueltig(jetzt - timedelta(hours=47), 48, jetzt))
        self.assertFalse(an.token_gueltig(jetzt - timedelta(hours=49), 48, jetzt))
        self.assertFalse(an.token_gueltig(None, 48, jetzt))

    def test_maskierung(self):
        self.assertEqual(an.email_maskieren("Anna.Muster@Example.com"), "a***@example.com")
        self.assertEqual(an.email_maskieren("kein-at"), "")
        self.assertEqual(an.telefon_maskieren("+43 660 1234567"), "+•••••••••567")
        self.assertEqual(an.telefon_maskieren("12"), "")

    def test_antrag_pruefen(self):
        gut = {"vorname": "Anna", "nachname": "Muster", "email": "anna@example.com", "plz": "6911", "vertragsdaten_akzeptiert": 1}
        self.assertEqual(an.antrag_pruefen(gut), (True, None, None))
        self.assertEqual(an.antrag_pruefen({**gut, "email": "x"})[1], "email")
        self.assertEqual(an.antrag_pruefen({**gut, "nachname": " "})[1], "nachname")
        self.assertEqual(an.antrag_pruefen({**gut, "plz": "ab"})[1], "plz")
        self.assertEqual(an.antrag_pruefen({**gut, "vertragsdaten_akzeptiert": 0})[1], "vertragsdaten_akzeptiert")
        self.assertTrue(an.plz_plausibel("A-6911"))
        self.assertTrue(an.plz_plausibel(""))


if __name__ == "__main__":
    unittest.main()
