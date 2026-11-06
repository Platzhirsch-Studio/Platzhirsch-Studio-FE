"""Bewertungs-Regeln ohne Site: PYTHONPATH=. python -m unittest ph_marketing.tests.test_bewertung"""

import unittest

from ph_marketing.utils import bewertung as bw


class TestBewertung(unittest.TestCase):
    def test_sterne(self):
        self.assertEqual(bw.sterne_pruefen("5"), 5)
        self.assertIsNone(bw.sterne_pruefen(None))
        self.assertIsNone(bw.sterne_pruefen(0))
        for falsch in ("6", -1, "viel"):
            with self.assertRaises(ValueError):
                bw.sterne_pruefen(falsch)

    def test_maskieren(self):
        self.assertEqual(bw.autor_maskieren("Anna Maria müller"), "Anna M.")
        self.assertEqual(bw.autor_maskieren("Anna"), "Anna")
        self.assertEqual(bw.autor_maskieren("  "), "Kundin/Kunde")

    def test_text_oeffentlich_ohne_kontaktdaten(self):
        t = bw.text_oeffentlich("Bitte rufen Sie mich an: +43 660 123 45 67 oder max@example.at. Lieferung 2026 für 1.290 €.")
        self.assertNotIn("660", t)
        self.assertNotIn("max@", t)
        self.assertIn("2026", t)
        self.assertIn("1.290", t)

    def test_kein_gating_durchschnitt_ueber_alle(self):
        self.assertEqual(bw.durchschnitt([5, 1, None, 3]), 3.0)
        self.assertIsNone(bw.durchschnitt([None, 0]))

    def test_normalisieren(self):
        self.assertEqual(bw.quelle_normalisieren("qr"), "QR-Karte")
        self.assertEqual(bw.quelle_normalisieren("QR-Karte"), "QR-Karte")
        self.assertEqual(bw.quelle_normalisieren("unbekannt"), "Direkt")
        self.assertEqual(bw.anlass_normalisieren("Montage"), "Montage")
        self.assertEqual(bw.anlass_normalisieren("xyz"), "Sonstiges")
        self.assertEqual(bw.anlass_normalisieren(""), "")
        self.assertNotIn("Sterne", " ".join(bw.AUSBLENDEN_GRUENDE))

    def test_bereinigen(self):
        self.assertEqual(bw.text_bereinigen(" <script>x</script>\x00 "), "scriptx/script")
        self.assertEqual(bw.titel(4, "Anna M.", "Lieferung"), "4 ★ · Anna M. · Lieferung")


if __name__ == "__main__":
    unittest.main()
