"""Packtisch-Logik ohne Site: Scan-Zuordnung, Abhaken, Paketvorschlag, Versicherung (Glas), Versandfähigkeit."""

import unittest

from ph_logistik.ph_logistik.packtisch_logik import abhaken, alles_gepackt, gesamtgewicht_g, paket_vorschlag, scan_treffer, versandfaehig, versicherung, warenwert_cent

PROFILE = {
    "glas-2er-set": {"key": "glas-2er-set", "laenge_cm": 47, "breite_cm": 32, "hoehe_cm": 32, "gewicht_g": 1500, "tara_g": 700, "max_artikel_gewicht_g": 800, "max_stueck": 2, "glas": 1, "zerbrechlich": 1},
    "bildband-klein": {"key": "bildband-klein", "laenge_cm": 31, "breite_cm": 25, "hoehe_cm": 12, "gewicht_g": 1800, "tara_g": 300, "max_artikel_gewicht_g": 1500, "max_stueck": 1, "glas": 0, "zerbrechlich": 0},
    "parfum": {"key": "parfum", "laenge_cm": 26, "breite_cm": 19, "hoehe_cm": 17, "gewicht_g": 900, "versand_gesperrt": "Gefahrgut UN 1266", "glas": 1},
}
POS = [
    {"name": "r1", "produkt": "riedel-glas", "beschreibung": "Riedel Glas 2er", "menge": 3, "menge_gepackt": 0, "ean": "4001234567890", "slug": "riedel-veritas-2er", "paketprofil": "glas-2er-set", "einzel_cent": 5900},
    {"name": "r2", "produkt": "taschen-bildband", "beschreibung": "Bildband", "menge": 1, "menge_gepackt": 0, "slug": "taschen-bildband", "paketprofil": "bildband-klein", "einzel_cent": 8000},
]


class TestPacktisch(unittest.TestCase):
    def test_scan_ean_slug_url(self):
        self.assertEqual(scan_treffer("4001234567890", POS)["name"], "r1")
        self.assertEqual(scan_treffer(" 4001 2345 67890 ", POS)["name"], "r1")
        self.assertEqual(scan_treffer("https://platzhirsch.studio/de/shop/taschen-bildband?x=1", POS)["name"], "r2")
        self.assertEqual(scan_treffer("RIEDEL-GLAS", POS)["name"], "r1")
        self.assertIsNone(scan_treffer("unbekannt", POS))
        voll = [dict(p, menge_gepackt=p["menge"]) for p in POS]
        self.assertIsNone(scan_treffer("4001234567890", voll))  # nichts mehr offen

    def test_abhaken_und_alles_gepackt(self):
        p = dict(POS[0])
        p["menge_gepackt"], voll = abhaken(p)
        self.assertEqual((p["menge_gepackt"], voll), (1, False))
        p["menge_gepackt"], voll = abhaken(p, 5)
        self.assertEqual((p["menge_gepackt"], voll), (3, True))
        self.assertFalse(alles_gepackt(POS))
        self.assertTrue(alles_gepackt([p, dict(POS[1], menge_gepackt=1)]))
        self.assertFalse(alles_gepackt([]))

    def test_paketvorschlag_max_stueck(self):
        pk = paket_vorschlag(POS, PROFILE)
        # 3 Gläser bei max 2 je Paket → 2 Pakete Glas + 1 Bildband
        self.assertEqual(len(pk), 3)
        self.assertEqual([p["paketprofil"] for p in pk], ["glas-2er-set", "glas-2er-set", "bildband-klein"])
        self.assertEqual(pk[0]["gewicht_g"], 1500)  # 2 × 400 + 700
        self.assertEqual(pk[1]["gewicht_g"], 1100)  # 1 × 400 + 700
        self.assertEqual(pk[0]["zerbrechlich"], 1)
        self.assertEqual(pk[2]["zerbrechlich"], 0)
        self.assertEqual(gesamtgewicht_g(pk), 1500 + 1100 + 1800)

    def test_versicherung_glas(self):
        self.assertEqual(warenwert_cent(POS), 3 * 5900 + 8000)
        self.assertEqual(versicherung(POS, PROFILE, glas_immer=True, ab_cent=100000), (True, 25700))
        nur_buch = [POS[1]]
        self.assertEqual(versicherung(nur_buch, PROFILE, glas_immer=True, ab_cent=100000), (False, 0))
        self.assertEqual(versicherung(nur_buch, PROFILE, glas_immer=True, ab_cent=5000), (True, 8000))
        self.assertEqual(versicherung(POS, PROFILE, glas_immer=False, ab_cent=0), (False, 0))

    def test_versandfaehig(self):
        pk = paket_vorschlag(POS, PROFILE)
        self.assertEqual(versandfaehig(pk, PROFILE), (True, None))
        ok, grund = versandfaehig([{"paketprofil": "parfum", "laenge_cm": 26, "breite_cm": 19, "hoehe_cm": 17, "gewicht_g": 900}], PROFILE)
        self.assertFalse(ok)
        self.assertIn("UN 1266", grund)
        ok, grund = versandfaehig([{"paketprofil": None, "laenge_cm": 0}], PROFILE)
        self.assertFalse(ok)


if __name__ == "__main__":
    unittest.main()
