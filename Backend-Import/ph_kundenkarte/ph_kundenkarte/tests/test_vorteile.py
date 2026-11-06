import unittest

from ph_kundenkarte.utils import vorteile as vt

STUFEN = [
    {"name": "Platzhirsch", "reihenfolge": 1, "schwelle_jahresumsatz_cent": 0},
    {"name": "Platzhirsch Plus", "reihenfolge": 2, "schwelle_jahresumsatz_cent": 1_000_000},
    {"name": "Platzhirsch Privé", "reihenfolge": 3, "schwelle_jahresumsatz_cent": 5_000_000},
]
ZUORDNUNG = [
    {"stufe": "Platzhirsch Privé", "vorteil": "PH-KKV-2026-00003", "hinweis": "Montage"},
    {"stufe": "Platzhirsch", "vorteil": "PH-KKV-2026-00001", "hinweis": "Geburtstag"},
    {"stufe": "Platzhirsch Plus", "vorteil": "PH-KKV-2026-00002", "hinweis": "Lieferung"},
    {"stufe": "Platzhirsch Plus", "vorteil": "PH-KKV-2026-00001", "hinweis": "doppelt"},
]


class TestVorteile(unittest.TestCase):
    def test_limit_pro_jahr(self):
        self.assertEqual(vt.einloesung_erlaubt("Aktiv", True, 1, 0), (True, vt.CODE_OK))
        self.assertEqual(vt.einloesung_erlaubt("Aktiv", True, 1, 1), (False, vt.CODE_LIMIT))
        self.assertEqual(vt.einloesung_erlaubt("Aktiv", True, 0, 99), (True, vt.CODE_OK))  # 0 = unbegrenzt
        self.assertEqual(vt.einloesung_erlaubt("Aktiv", True, 2, 1), (True, vt.CODE_OK))

    def test_karte_und_vorteil_status(self):
        self.assertEqual(vt.einloesung_erlaubt("Gesperrt", True, 0, 0), (False, vt.CODE_KARTE_INAKTIV))
        self.assertEqual(vt.einloesung_erlaubt("Beantragt", True, 0, 0), (False, vt.CODE_KARTE_INAKTIV))
        self.assertEqual(vt.einloesung_erlaubt("Aktiv", False, 0, 0), (False, vt.CODE_VORTEIL_INAKTIV))

    def test_stufe(self):
        self.assertEqual(vt.einloesung_erlaubt("Aktiv", True, 0, 0, stufe_reihenfolge=1, gilt_ab_reihenfolge=2), (False, vt.CODE_STUFE))
        self.assertEqual(vt.einloesung_erlaubt("Aktiv", True, 0, 0, stufe_reihenfolge=2, gilt_ab_reihenfolge=2), (True, vt.CODE_OK))
        self.assertEqual(vt.einloesung_erlaubt("Aktiv", True, 0, 0, stufe_reihenfolge=None, gilt_ab_reihenfolge=3), (True, vt.CODE_OK))
        self.assertEqual(vt.einloesung_erlaubt("Aktiv", True, 0, 0, in_stufe_enthalten=False), (False, vt.CODE_NICHT_IN_STUFE))

    def test_verbleibend(self):
        self.assertIsNone(vt.verbleibend(0, 5))
        self.assertEqual(vt.verbleibend(2, 1), 1)
        self.assertEqual(vt.verbleibend(2, 3), 0)

    def test_vorteile_fuer_stufe_schliesst_niedrigere_ein(self):
        self.assertEqual([z["vorteil"] for z in vt.vorteile_fuer_stufe(ZUORDNUNG, STUFEN, "Platzhirsch")], ["PH-KKV-2026-00001"])
        plus = vt.vorteile_fuer_stufe(ZUORDNUNG, STUFEN, "Platzhirsch Plus")
        self.assertEqual([z["vorteil"] for z in plus], ["PH-KKV-2026-00001", "PH-KKV-2026-00002"])
        self.assertEqual(plus[0]["hinweis"], "Geburtstag")  # erste Zuordnung gewinnt, Doppelte entfallen
        self.assertEqual(len(vt.vorteile_fuer_stufe(ZUORDNUNG, STUFEN, "Platzhirsch Privé")), 3)
        self.assertEqual(vt.vorteile_fuer_stufe(ZUORDNUNG, STUFEN, "Unbekannt"), [])


if __name__ == "__main__":
    unittest.main()
