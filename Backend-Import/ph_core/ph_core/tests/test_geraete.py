"""Tests ohne Site: Geräte-Token und Bediener-PIN (ph_core/utils/geraete.py).

cd Backend-Import/ph_core && PYTHONPATH=. python -I -m unittest discover -s ph_core/tests -t .
"""

import hashlib
import unittest

from ph_core.utils.geraete import (
    ARBEITSPLAETZE,
    GERAETE_TYPEN,
    PIN_PRAEFIX,
    arbeitsplatz_fuer_typ,
    neues_token,
    normalisiere_token,
    pin_hash,
    pin_passt,
    pin_pruefen,
    token_hash,
    token_passt,
)


class TestToken(unittest.TestCase):
    def test_neues_token_form(self):
        t = neues_token()
        self.assertEqual(len(t), 43)
        self.assertRegex(t, r"^[A-Za-z0-9_\-]+$")
        self.assertNotEqual(t, neues_token())

    def test_normalisierung(self):
        t = neues_token()
        self.assertEqual(normalisiere_token(f"  {t} "), t)
        self.assertEqual(normalisiere_token(f'"{t}"'), t)
        self.assertEqual(normalisiere_token(f"Bearer {t}"), t)
        self.assertEqual(normalisiere_token(None), "")
        self.assertEqual(normalisiere_token("kurz"), "")
        self.assertEqual(normalisiere_token("a" * 129), "")
        self.assertEqual(normalisiere_token("x" * 30 + " y" * 5), "")  # Leerzeichen/fremde Zeichen
        self.assertEqual(normalisiere_token("abc$" + "x" * 30), "")

    def test_hash_ist_sha256_des_normalisierten_tokens(self):
        t = neues_token()
        self.assertEqual(token_hash(t), hashlib.sha256(t.encode()).hexdigest())
        self.assertEqual(token_hash(f" {t} "), token_hash(t))
        self.assertEqual(len(token_hash(t)), 64)
        self.assertEqual(token_hash(""), "")
        self.assertEqual(token_hash("zu kurz"), "")

    def test_token_passt(self):
        t = neues_token()
        h = token_hash(t)
        self.assertTrue(token_passt(t, h))
        self.assertFalse(token_passt(neues_token(), h))
        self.assertFalse(token_passt(t, ""))
        self.assertFalse(token_passt("", h))
        self.assertFalse(token_passt(t, h[:-1] + ("0" if h[-1] != "0" else "1")))


class TestPin(unittest.TestCase):
    def test_pruefen(self):
        self.assertIsNone(pin_pruefen("2580"))
        self.assertIsNone(pin_pruefen(" 907312 "))
        self.assertIsNotNone(pin_pruefen("123"))
        self.assertIsNotNone(pin_pruefen("1234567"))
        self.assertIsNotNone(pin_pruefen("12a4"))
        self.assertIsNotNone(pin_pruefen("1111"))
        self.assertIsNotNone(pin_pruefen("1234"))
        self.assertIsNotNone(pin_pruefen("654321"))
        self.assertIsNotNone(pin_pruefen(None))

    def test_hash_form_und_salz(self):
        h = pin_hash("2580")
        teile = h.split("$")
        self.assertEqual(len(teile), 4)
        self.assertEqual(teile[0], PIN_PRAEFIX)
        self.assertGreaterEqual(int(teile[1]), 100_000)
        self.assertEqual(len(teile[2]), 32)
        self.assertEqual(len(teile[3]), 64)
        self.assertNotEqual(h, pin_hash("2580"))  # frisches Salz je Aufruf
        self.assertNotIn("2580", h)

    def test_hash_deterministisch_bei_gleichem_salz(self):
        self.assertEqual(pin_hash("2580", salz="00" * 16, iterationen=1000), pin_hash("2580", salz="00" * 16, iterationen=1000))

    def test_passt(self):
        h = pin_hash("2580")
        self.assertTrue(pin_passt("2580", h))
        self.assertTrue(pin_passt(" 2580 ", h))
        self.assertFalse(pin_passt("2581", h))
        self.assertFalse(pin_passt("", h))
        self.assertFalse(pin_passt("2580", ""))
        self.assertFalse(pin_passt("2580", None))
        self.assertFalse(pin_passt("2580", "2580"))  # Klartext wird nie akzeptiert
        self.assertFalse(pin_passt("2580", "md5$x$y$z"))
        self.assertFalse(pin_passt("2580", "pbkdf2_sha256$10$zz$zz"))  # kein Hex / zu wenige Iterationen

    def test_hash_verweigert_falsches_format(self):
        with self.assertRaises(ValueError):
            pin_hash("12")
        with self.assertRaises(ValueError):
            pin_hash("abcd")


class TestArbeitsplatz(unittest.TestCase):
    def test_ableitung(self):
        self.assertEqual(arbeitsplatz_fuer_typ("Kassa"), "kassa")
        self.assertEqual(arbeitsplatz_fuer_typ("Packtisch"), "packtisch")
        self.assertEqual(arbeitsplatz_fuer_typ("Mobil"), "montage")
        self.assertEqual(arbeitsplatz_fuer_typ("Mobil", "technik"), "technik")
        self.assertEqual(arbeitsplatz_fuer_typ("Mobil", "Technik "), "technik")
        self.assertEqual(arbeitsplatz_fuer_typ("Mobil", "unsinn"), "montage")
        self.assertEqual(arbeitsplatz_fuer_typ("Backoffice"), "backoffice")
        self.assertEqual(arbeitsplatz_fuer_typ("unbekannt"), "backoffice")
        self.assertEqual(set(GERAETE_TYPEN), {"Kassa", "Packtisch", "Mobil", "Backoffice"})
        self.assertIn("technik", ARBEITSPLAETZE)
