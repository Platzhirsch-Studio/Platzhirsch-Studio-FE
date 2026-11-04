"""Tests ohne Site: python -m unittest ph_core.tests.test_naming (aus Backend-Import/ph_core)."""

import unittest

from ph_core.utils.naming import ALPHABET, GETEILTE_SERIEN, NUMMERNKREISE, normalisiere_code, referenz, serie


class TestNaming(unittest.TestCase):
    def test_referenz_format(self):
        r = referenz("PT")
        self.assertRegex(r, r"^PT-[%s]{6}$" % ALPHABET)
        self.assertNotIn("0", r.split("-")[1])
        self.assertNotIn("O", r.split("-")[1])

    def test_normalisiere_code(self):
        self.assertEqual(normalisiere_code(" ph-7k3q x9 "), "PH7K3QX9")
        self.assertEqual(normalisiere_code("O0Il"), "0011")

    def test_nummernkreise_eindeutig(self):
        """Jede Serie gehört genau einer DocType – Ausnahme: dokumentierte Kollisionen (GETEILTE_SERIEN)."""
        besitzer = {}
        for dt, s in NUMMERNKREISE.items():
            besitzer.setdefault(s, []).append(dt)
        for s, dts in besitzer.items():
            if len(dts) > 1:
                self.assertIn(s, GETEILTE_SERIEN, f"Serie {s} mehrfach: {dts} – nicht dokumentiert")
                self.assertEqual(sorted(dts), sorted(GETEILTE_SERIEN[s]["doctypes"]))
        for s in GETEILTE_SERIEN:
            self.assertGreater(len(besitzer.get(s, [])), 1, f"GETEILTE_SERIEN enthält {s}, aber keine Kollision mehr – Eintrag entfernen")

    def test_serien_form(self):
        for dt, s in NUMMERNKREISE.items():
            self.assertTrue(s.endswith("#"), f"{dt}: Serie endet nicht mit Zähler")
            self.assertRegex(s, r"^(PH-)?[A-Z]+-(\.YYYY\.-|\.YY\.MM\.DD\.-)?\.#+$", f"{dt}: ungewöhnliche Serie {s}")
            self.assertTrue(dt.startswith("PH "), f"{dt}: DocType ohne PH-Präfix")

    def test_serie_lookup(self):
        self.assertEqual(serie("PH Anfrage"), "PH-ANF-.YYYY.-.#####")
        with self.assertRaises(KeyError):
            serie("PH Gibt Es Nicht")


if __name__ == "__main__":
    unittest.main()
