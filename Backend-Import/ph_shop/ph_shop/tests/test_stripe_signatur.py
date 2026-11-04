"""Tests ohne Site und ohne Netz: cd Backend-Import/ph_shop && PYTHONPATH=. python -m unittest discover -s ph_shop/tests -t ."""

import json
import unittest

from ph_shop.stripe_signatur import SignaturFehler, pruefe, signiere

SECRET = "whsec_mock_platzhirsch_nur_tests_0000000000"  # Testschlüssel, in tools/check.py erlaubt (whsec_mock_platzhirsch)
BODY = json.dumps({"id": "evt_test_1", "type": "checkout.session.completed", "data": {"object": {"id": "cs_test_1"}}}).encode()


class TestStripeSignatur(unittest.TestCase):
    def test_gueltige_signatur(self):
        header = signiere(BODY, SECRET, zeit=1_700_000_000)
        self.assertEqual(pruefe(BODY, header, SECRET, jetzt=1_700_000_100), 1_700_000_000)

    def test_mehrere_v1_signaturen(self):
        header = signiere(BODY, SECRET, zeit=1_700_000_000) + ",v1=deadbeef"
        self.assertEqual(pruefe(BODY, header, SECRET, jetzt=1_700_000_000), 1_700_000_000)

    def test_falsches_geheimnis(self):
        header = signiere(BODY, "whsec_mock_platzhirsch_anderer_schluessel", zeit=1_700_000_000)
        with self.assertRaises(SignaturFehler):
            pruefe(BODY, header, SECRET, jetzt=1_700_000_000)

    def test_veraenderter_body(self):
        header = signiere(BODY, SECRET, zeit=1_700_000_000)
        with self.assertRaises(SignaturFehler):
            pruefe(BODY + b" ", header, SECRET, jetzt=1_700_000_000)

    def test_zu_alt(self):
        header = signiere(BODY, SECRET, zeit=1_700_000_000)
        with self.assertRaises(SignaturFehler):
            pruefe(BODY, header, SECRET, toleranz_s=300, jetzt=1_700_000_301)
        self.assertTrue(pruefe(BODY, header, SECRET, toleranz_s=300, jetzt=1_700_000_300))

    def test_fehlender_header_und_secret(self):
        with self.assertRaises(SignaturFehler):
            pruefe(BODY, None, SECRET)
        with self.assertRaises(SignaturFehler):
            pruefe(BODY, "t=1,v1=00", None)
        with self.assertRaises(SignaturFehler):
            pruefe(BODY, "unsinn", SECRET)

    def test_string_body_gleich_bytes(self):
        header = signiere(BODY.decode(), SECRET, zeit=1_700_000_000)
        self.assertEqual(pruefe(BODY, header, SECRET, jetzt=1_700_000_000), 1_700_000_000)


if __name__ == "__main__":
    unittest.main()
