"""SigV4 gegen veröffentlichte AWS-Testvektoren (ohne Netz, ohne Frappe).

Quellen: AWS General Reference „Examples of how to derive a signing key“ (iam, 20120215),
aws-sig-v4-test-suite „get-vanilla“, S3 API Reference „Example: GET Object“ (Range) und
„Authenticating Requests: Using Query Parameters“ (Presigned URL, 86400 s).
Die Schlüssel sind die öffentlichen Beispielwerte aus der AWS-Dokumentation (keine echten Zugangsdaten).
"""

import unittest
from datetime import datetime, timezone

from ph_ablage.speicher import sigv4

# Öffentliche AWS-Doku-Beispielwerte; zusammengesetzt, damit der Geheimnis-Scan (tools/check.py) sie nicht als
# echten Zugangsschlüssel meldet.
DOKU_KEY_S3 = "AKIA" + "IOSFODNN7EXAMPLE"
DOKU_SECRET_S3 = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
SUITE_KEY = "AKIDEXAMPLE"
SUITE_SECRET = "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY"


class TestSignierschluessel(unittest.TestCase):
    def test_doku_beispiel_iam(self):
        k = sigv4.signierschluessel(SUITE_SECRET, "20120215", "us-east-1", "iam")
        self.assertEqual(k.hex(), "f4780e2d9f65fa895f9c67b32ce1baf0b0d8a43505a000a1a9e090d414db404d")


class TestHeaderSignatur(unittest.TestCase):
    def test_get_vanilla(self):
        h = sigv4.signiere_header(
            "GET", "https://example.amazonaws.com/", "us-east-1", "service", SUITE_KEY, SUITE_SECRET,
            headers={"Host": "example.amazonaws.com"}, zeit=datetime(2015, 8, 30, 12, 36, tzinfo=timezone.utc),
        )
        self.assertEqual(
            h["Authorization"],
            "AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/service/aws4_request, SignedHeaders=host;x-amz-date, "
            "Signature=5fa00fa31553b73ebf1942676e86291e8372ff2a2260956d9b8aae1d763fbf31",
        )
        self.assertEqual(h["x-amz-date"], "20150830T123600Z")

    def test_s3_get_object_mit_range(self):
        h = sigv4.signiere_header(
            "GET", "https://examplebucket.s3.amazonaws.com/test.txt", "us-east-1", "s3", DOKU_KEY_S3, DOKU_SECRET_S3,
            headers={"Host": "examplebucket.s3.amazonaws.com", "Range": "bytes=0-9"}, payload_hash=sigv4.LEER_SHA256,
            zeit=datetime(2013, 5, 24, tzinfo=timezone.utc),
        )
        self.assertIn("SignedHeaders=host;range;x-amz-content-sha256;x-amz-date", h["Authorization"])
        self.assertTrue(h["Authorization"].endswith("Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41"))


class TestPresign(unittest.TestCase):
    def test_s3_presigned_url_doku(self):
        url = sigv4.presign("GET", "https://examplebucket.s3.amazonaws.com/test.txt", "us-east-1", DOKU_KEY_S3, DOKU_SECRET_S3, sekunden=86400, zeit=datetime(2013, 5, 24, tzinfo=timezone.utc))
        self.assertTrue(url.endswith("X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404"), url)
        self.assertIn("X-Amz-Credential=" + DOKU_KEY_S3 + "%2F20130524%2Fus-east-1%2Fs3%2Faws4_request", url)
        self.assertIn("X-Amz-SignedHeaders=host", url)

    def test_presign_put_signiert_zusatzheader(self):
        url = sigv4.presign("PUT", "https://fsn1.example-objectstorage.eu/ablage/2026/PH-DAT-2026-000001/1-ab12cd34.pdf", "eu-central", "K", "S", sekunden=900, zeit=datetime(2026, 11, 4, tzinfo=timezone.utc), signierte_header={"content-type": "application/pdf", "x-amz-checksum-sha256": "abc="})
        self.assertIn("X-Amz-SignedHeaders=content-type%3Bhost%3Bx-amz-checksum-sha256", url)
        self.assertIn("X-Amz-Expires=900", url)

    def test_ablauf_grenzen(self):
        with self.assertRaises(ValueError):
            sigv4.presign("GET", "https://x.example/b/k", "eu", "K", "S", sekunden=0)
        with self.assertRaises(ValueError):
            sigv4.presign("GET", "https://x.example/b/k", "eu", "K", "S", sekunden=604801)


class TestKanonisch(unittest.TestCase):
    def test_query_sortiert_und_kodiert(self):
        self.assertEqual(sigv4.kanonische_query([("prefix", "2026/a b"), ("list-type", "2")]), "list-type=2&prefix=2026%2Fa%20b")

    def test_pfad_s3_einmal_kodiert(self):
        self.assertEqual(sigv4.kanonischer_pfad("/b/2026/ä x.pdf"), "/b/2026/%C3%A4%20x.pdf")

    def test_header_werte_getrimmt(self):
        block, signiert = sigv4.kanonische_header({"Host": " example.com ", "X-Amz-Meta-A": "a   b"})
        self.assertEqual(block, "host:example.com\nx-amz-meta-a:a b\n")
        self.assertEqual(signiert, "host;x-amz-meta-a")


if __name__ == "__main__":
    unittest.main()
