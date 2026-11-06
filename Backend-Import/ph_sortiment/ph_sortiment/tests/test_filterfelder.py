"""Tests ohne Site: Filterfelder der Produktkarte, Material/Farbe-Text, Dreiländer-Konfiguration.

cd Backend-Import/ph_sortiment && PYTHONPATH=. python -m unittest discover -s ph_sortiment/tests -t .
Erwartete Formen: src/lib/shop/shopProducts.js, src/lib/backend/katalog.js mapPhProduktDetail,
src/components/Labs/Dreilaender/pricing.js configSchema.
"""

import unittest

from ph_sortiment.logik.filterfelder import filterfelder, indoor_outdoor, material_farbe_text, wechselkurs_konfiguration

INFO = {
    "Weiss": {"key": "weiss", "gruppe": "Farbe"},
    "Eiche": {"key": "eiche", "gruppe": "Holz"},
    "Leder Cognac": {"key": "leder-cognac", "gruppe": "Leder"},
    "Blumig": {"key": "blumig", "gruppe": "Duftfamilie"},
}


class TestKarte(unittest.TestCase):
    def test_filterfelder(self):
        f = filterfelder(
            ["sofas", "ecksofas", "ecksofas", "unsichtbar"],
            [{"merkmal": "Weiss"}, {"merkmal": "Eiche"}, {"merkmal": "Leder Cognac"}, {"merkmal": "Blumig"}, {"merkmal": "Inaktiv"}, {"merkmal": "Weiss"}],
            {"ecksofas", "sofas"},
            INFO,
            "wohnen",
            "Wohnen",
        )
        self.assertEqual(f["subCategoryKeys"], ["sofas", "ecksofas"])
        self.assertEqual(f["colorKeys"], ["weiss"])
        self.assertEqual(f["materialKeys"], ["eiche", "leder-cognac"])
        self.assertEqual(f["indoor_and_outdoor"], "Indoor")

    def test_leer(self):
        f = filterfelder(None, None, set(), {})
        self.assertEqual(f, {"subCategoryKeys": [], "colorKeys": [], "materialKeys": [], "indoor_and_outdoor": "Indoor"})

    def test_outdoor(self):
        self.assertEqual(indoor_outdoor("outdoor", "Wohnen"), "Outdoor")
        self.assertEqual(indoor_outdoor(None, "Outdoor"), "Outdoor")
        self.assertEqual(indoor_outdoor("kueche", None), "Indoor")


class TestDetail(unittest.TestCase):
    def test_material_farbe_wie_website_adapter(self):
        merkmale = [{"de": "Eiche geölt", "gruppe": "Holz"}, {"de": "Stoff Boucle", "gruppe": "Stoff"}, {"de": "Eiche geölt", "gruppe": "Material"}, {"de": "Weiß", "gruppe": "Farbe"}, {"de": "LED", "gruppe": ""}]
        self.assertEqual(material_farbe_text(merkmale), ("Eiche geölt, Stoff Boucle", "Weiß"))
        self.assertEqual(material_farbe_text([]), (None, None))


class TestWechselkurs(unittest.TestCase):
    def test_schema(self):
        cfg = wechselkurs_konfiguration(
            [
                {"posten": "Lieferung CH", "min_cent": 45000, "max_cent": 45000, "freigegeben": 1, "quelle": "Fracht nach St. Gallen"},
                {"posten": "Lieferung DE", "min_cent": 25000, "max_cent": 45000},
                {"posten": "Verzollung CH", "min_cent": 8000, "max_cent": 15000},
                {"posten": "Unbekannt", "min_cent": 1},
            ],
            0,
            0.9227,
            "2026-10-23",
        )
        self.assertEqual(cfg["version"], 1)
        self.assertFalse(cfg["ossActive"])
        self.assertEqual(cfg["deliveryEur"]["CH"], {"min": 450.0, "max": 450.0, "approved": True, "source": "Fracht nach St. Gallen"})
        self.assertEqual(cfg["deliveryEur"]["DE"], {"min": 250.0, "max": 450.0, "approved": False})
        self.assertEqual(cfg["customsFeeChf"], {"min": 80.0, "max": 150.0, "approved": False})
        self.assertNotIn("selfTransportChf", cfg)
        self.assertEqual(cfg["fallbackRate"], {"rate": 0.9227, "date": "2026-10-23"})

    def test_ohne_kurs(self):
        cfg = wechselkurs_konfiguration([], 1)
        self.assertEqual(cfg, {"version": 1, "ossActive": True})


if __name__ == "__main__":
    unittest.main()
