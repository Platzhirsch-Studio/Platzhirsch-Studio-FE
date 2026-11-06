"""Ohne Site: Regeln für add_service_photo (utils/reklamation_foto.py).

cd Backend-Import/ph_service && python -m unittest discover -s ph_service/tests -t .
"""

import unittest
from datetime import datetime, timedelta

from ph_service.utils import reklamation_foto as RF


class TestReklamationFoto(unittest.TestCase):
    def test_email(self):
        self.assertTrue(RF.email_passt("Kunde@Example.com ", "kunde@example.com"))
        self.assertFalse(RF.email_passt("kunde@example.com", "andere@example.com"))
        self.assertFalse(RF.email_passt("", ""))
        self.assertFalse(RF.email_passt(None, "kunde@example.com"))

    def test_frist(self):
        jetzt = datetime(2026, 11, 20, 12, 0)
        self.assertTrue(RF.in_frist(jetzt - timedelta(days=14), jetzt))
        self.assertFalse(RF.in_frist(jetzt - timedelta(days=14, seconds=1), jetzt))
        self.assertFalse(RF.in_frist(None, jetzt))

    def test_mime(self):
        self.assertTrue(RF.mime_passt("image/jpeg", "Bild"))
        self.assertTrue(RF.mime_passt("", "Video"))
        self.assertTrue(RF.mime_passt("application/pdf", "PDF"))
        self.assertTrue(RF.mime_passt("video/mp4; codecs=avc1", "Video"))
        self.assertFalse(RF.mime_passt("application/pdf", "Bild"))
        self.assertFalse(RF.mime_passt("text/html", "Bild"))

    def test_grenze(self):
        self.assertTrue(RF.platz_frei(9))
        self.assertFalse(RF.platz_frei(10))


if __name__ == "__main__":
    unittest.main()
