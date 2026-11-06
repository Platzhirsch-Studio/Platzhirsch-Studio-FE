"""Tests ohne Site: Ratenbegrenzung je Client (ph_core/utils/ratelimit.py).

cd Backend-Import/ph_core && PYTHONPATH=. python -I -m unittest discover -s ph_core/tests -t .
"""

import hashlib
import unittest

from ph_core.utils import ratelimit as RL


class TestClient(unittest.TestCase):
    def test_header_nur_fuer_website(self):
        h = hashlib.sha256(b"203.0.113.7").hexdigest()
        self.assertEqual(RL.client_kennung(False, True, h, "ipx"), f"c:{h[:32]}")
        # Gast: Header wird ignoriert (Umgehung durch wechselnde Header)
        self.assertEqual(RL.client_kennung(True, False, h, "ipx"), "ip:ipx")
        # Desk-Benutzer ohne Website-Rolle: IP
        self.assertEqual(RL.client_kennung(False, False, h, "ipx"), "ip:ipx")

    def test_ungueltiger_header(self):
        self.assertEqual(RL.client_kennung(False, True, "1.2.3.4", "ipx"), "ip:ipx")
        self.assertEqual(RL.client_kennung(False, True, "ZZ" * 20, None), "-")
        self.assertEqual(RL.normalisiere_client(" ABCDEF0123456789 "), "abcdef0123456789")
        self.assertEqual(RL.normalisiere_client("abc"), "")

    def test_schluessel_trennt_clients(self):
        a = RL.schluessel("m", "website@x", "c:aa", 120)
        b = RL.schluessel("m", "website@x", "c:bb", 120)
        self.assertNotEqual(a, b)
        self.assertEqual(RL.schluessel("m", "u", "c", 60), RL.schluessel("m", "u", "c", 119))
        self.assertNotEqual(RL.schluessel("m", "u", "c", 119), RL.schluessel("m", "u", "c", 120))
        self.assertTrue(RL.gesamt_schluessel("m", "u", 0).startswith("ph_api:rlg:m:u:"))

    def test_erlaubt(self):
        self.assertTrue(RL.erlaubt(5, 5))
        self.assertFalse(RL.erlaubt(6, 5))
        self.assertTrue(RL.erlaubt(10 ** 6, 0))


if __name__ == "__main__":
    unittest.main()
