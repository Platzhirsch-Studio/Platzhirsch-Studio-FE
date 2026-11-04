"""Tests ohne Site: cd Backend-Import/ph_marketing && PYTHONPATH=. python -m unittest discover -s ph_marketing/tests -t ."""

import unittest
from datetime import datetime, timedelta

from ph_marketing.utils.token import email_maskieren, email_normalisieren, email_plausibel, hash_token, neuer_token, token_gueltig, token_plausibel


class TestToken(unittest.TestCase):
    def test_token_zufaellig_und_plausibel(self):
        a, b = neuer_token(), neuer_token()
        self.assertNotEqual(a, b)
        self.assertTrue(token_plausibel(a))
        self.assertGreaterEqual(len(a), 40)

    def test_hash_deterministisch_und_nie_leer(self):
        t = neuer_token()
        self.assertEqual(hash_token(t), hash_token(t))
        self.assertEqual(len(hash_token(t)), 64)
        self.assertIsNone(hash_token(""))
        self.assertIsNone(hash_token(None))
        self.assertNotEqual(hash_token("a"), hash_token("b"))

    def test_token_plausibel_lehnt_muell_ab(self):
        self.assertFalse(token_plausibel("kurz"))
        self.assertFalse(token_plausibel("x" * 20 + " ' OR 1=1"))
        self.assertFalse(token_plausibel(None))

    def test_token_gueltigkeit(self):
        jetzt = datetime(2026, 11, 4, 12, 0)
        self.assertTrue(token_gueltig(jetzt - timedelta(hours=47), 48, jetzt))
        self.assertFalse(token_gueltig(jetzt - timedelta(hours=49), 48, jetzt))
        self.assertFalse(token_gueltig(None, 48, jetzt))

    def test_email(self):
        self.assertEqual(email_normalisieren("  Anna@Example.COM "), "anna@example.com")
        self.assertTrue(email_plausibel("anna@example.com"))
        self.assertFalse(email_plausibel("anna@example"))
        self.assertFalse(email_plausibel("anna example@x.at"))
        self.assertFalse(email_plausibel(""))
        self.assertEqual(email_maskieren("anna@example.com"), "a***@example.com")


if __name__ == "__main__":
    unittest.main()
