"""Ohne Site: Planer-Konfiguration an der Anfrage (ph_crm/utils/planer.py).

cd Backend-Import/ph_crm && python -m unittest discover -s ph_crm/tests -t .
"""

import json
import unittest

from ph_crm.utils.planer import MAX_BYTES, PlanerFehler, planer_pruefen

SOFA = {"v": 2, "name": "Mein Sofa", "family": "minotti-connery", "room": {"w": 500, "d": 400}, "grid": 10, "openings": [], "items": [{"id": "a", "code": "X1", "x": 0, "y": 0, "rot": 0, "w": 200, "d": 100}]}


class TestPlaner(unittest.TestCase):
    def test_nichts(self):
        self.assertIsNone(planer_pruefen())
        self.assertIsNone(planer_pruefen("", "", None))

    def test_sofaplaner_dict_und_text(self):
        for konf in (SOFA, json.dumps(SOFA)):
            r = planer_pruefen("Sofaplaner", konf, "https://platzhirsch.studio/de/sofaplaner/teilen?p=abc.def")
            self.assertEqual(r["planer"], "sofaplaner")
            self.assertEqual(json.loads(r["json"]), SOFA)
            self.assertIn("Raum 500 × 400 cm", r["zusammenfassung"])
            self.assertIn("1 Elemente", r["zusammenfassung"])

    def test_dreilaender(self):
        r = planer_pruefen("dreilaender", {"land": "CH", "wert": "5000-10000", "lieferart": "lieferung"})
        self.assertEqual(r["zusammenfassung"], "Land CH, Warenwert 5000-10000, Lieferart lieferung")
        self.assertIsNone(r["link"])

    def test_fehler(self):
        faelle = [
            (("unbekannt", SOFA), "planer"),
            ((None, SOFA), "planer"),
            (("sofaplaner", "[1,2]"), "planer_konfiguration"),
            (("sofaplaner", "{kaputt"), "planer_konfiguration"),
            (("sofaplaner", {"x": "y" * (MAX_BYTES + 1)}), "planer_konfiguration"),
            (("sofaplaner", {"a": {"b": {"c": {"d": {"e": {"f": {"g": {"h": {"i": {"j": {"k": {"l": {"m": 1}}}}}}}}}}}}}), "planer_konfiguration"),
        ]
        for args, feld in faelle:
            with self.subTest(args=str(args)[:40]):
                with self.assertRaises(PlanerFehler) as cm:
                    planer_pruefen(*args)
                self.assertEqual(cm.exception.feld, feld)
        with self.assertRaises(PlanerFehler) as cm:
            planer_pruefen("sofaplaner", SOFA, "https://example.com/x")
        self.assertEqual(cm.exception.feld, "planer_link")
        with self.assertRaises(PlanerFehler):
            planer_pruefen("sofaplaner", SOFA, "http://platzhirsch.studio/x")


if __name__ == "__main__":
    unittest.main()
