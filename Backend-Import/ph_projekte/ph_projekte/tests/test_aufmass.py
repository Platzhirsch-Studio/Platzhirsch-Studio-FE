import unittest

from ph_projekte.utils.aufmass import flaeche_m2, plausibilitaet, raeume_fuer_projekt


class TestAufmass(unittest.TestCase):
    def test_flaeche(self):
        self.assertEqual(flaeche_m2(4000, 3250), 13.0)
        self.assertEqual(flaeche_m2(0, 3000), 0.0)
        self.assertEqual(flaeche_m2(None, "2500"), 0.0)

    def test_plausibel(self):
        raeume = [{"raum": "Küche", "laenge_mm": 4000, "breite_mm": 3000, "hoehe_mm": 2600}]
        self.assertEqual(plausibilitaet(raeume, [{"raum": "Küche", "bezeichnung": "Wand A", "wert_mm": 4000}], [{"raum": "Küche", "art": "Abluft", "hoehe_mm": 2400}]), [])

    def test_hinweise(self):
        raeume = [{"raum": "Küche", "laenge_mm": 400000, "hoehe_mm": 1200}, {"raum": "Küche"}]
        h = plausibilitaet(raeume, [{"raum": "Bad", "bezeichnung": "Nische", "wert_mm": 0}], [{"raum": "Küche", "art": "Gas", "hoehe_mm": 3000}, {"raum": "X", "art": "Dampf"}])
        text = " ".join(h)
        for teil in ("doppelt", "unplausibel", "Raumhöhe", "nicht erfasst", "über der Raumhöhe", "Unbekannte Anschlussart", "keinen Wert"):
            self.assertIn(teil, text)

    def test_raeume_fuer_projekt(self):
        neu = raeume_fuer_projekt([{"raum": "Küche", "laenge_mm": 4000, "breite_mm": 2000}, {"raum": "Bad"}, {"raum": "bad"}], ["Bad"])
        self.assertEqual(neu, [{"raum": "Küche", "flaeche_m2": 8.0}])


if __name__ == "__main__":
    unittest.main()
