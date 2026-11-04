import unittest

from ph_sortiment.logik.katalog import kategorie_doc, kategorien_aus_katalog, marke_doc, preis_zeilen, produkt_doc
from ph_sortiment.logik.slug import ist_slug, produkt_slug, slug

T = lambda de, en="en", fr="fr", it="it": {"de": de, "en": en, "fr": fr, "it": it}  # noqa: E731

MARKE = {"slug": "soleum", "name": "Soleum", "welt": "bad-wellness", "herstellerUrl": "https://www.soleum.at/", "dealer": True, "stand": "2026-10-31"}
PRODUKT = {
    "slug": "soleum-flying-carpet", "marke": "soleum", "bereich": "wellness", "welt": "bad-wellness", "kategorie": "waermeliege", "name": "Flying Carpet",
    "kurz": T("Geflieste Wärmeliege.", "Tiled heated lounger.", "Méridienne chauffante.", "Lettino riscaldato."),
    "merkmale": [T("Glasmosaik von SICIS"), "LED 230 V", T("Material: Mikrozement", "Material: microcement", "Matériau : microciment", "Materiale: microcemento")],
    "masse": [{"key": "laenge", "wert": "204 cm"}, {"key": "gewicht", "wert": "~70 kg"}],
    "bilder": [{"src": "/Images/Wellness/produkte/soleum/a.webp", "width": 1600, "height": 715, "alt": T("Bild A"), "quelleUrl": "https://www.soleum.at/x", "abgerufen": "2026-10-31"}, {"src": "/Images/Wellness/produkte/soleum/b.webp", "width": 600, "height": 515, "alt": T("Bild B"), "quelleUrl": "https://www.soleum.de/y", "abgerufen": "2026-10-31", "typ": "ambiente"}],
    "herstellerUrl": "https://www.soleum.de/featured_item/luxus-wellnessliege/", "quellen": ["https://www.soleum.de/a", "https://www.soleum.at/b"], "stand": "2026-10-31",
    "ausfuehrungen": [{"gruppe": T("Front-Paneel"), "optionen": [{"id": "weiss", "name": T("Weiß"), "code": "RAL 9010", "farbe": "#F4F4F4", "standard": True}, {"id": "gold", "name": T("Gold")}]}],
    "zubehoer": [{"slug": "soleum-feuerbox", "hinweis": T("Passt dazu")}],
}
RIEDEL = {**PRODUKT, "slug": "riedel-vinum", "marke": "riedel", "bereich": "accessoires", "welt": "accessoires", "kategorie": "glas", "name": "Vinum", "ausfuehrungen": [], "zubehoer": [],
          "preis": {"art": "verkaufspreis", "varianten": [{"name": "2er-Set", "betrag": 79, "sku": "6416/0", "versandGewichtG": 900, "zerbrechlich": True}, {"name": "4er-Set", "betrag": 149}], "stand": "2026-10-31", "quelle": "https://www.riedel.com/de-at/x"}}
MIELE = {**PRODUKT, "slug": "miele-dgc-7865", "marke": "miele", "bereich": "kueche", "welt": "kuechengeraete", "kategorie": "dampfgarer", "name": "DGC 7865", "ausfuehrungen": [], "zubehoer": [],
         "preis": {"art": "uvp-ab", "uvpAb": 4990, "stand": "2026-10-31", "quelle": "https://www.miele.at/x", "bezeichnung": "herstellerpreis", "zusatz": T("Systempreis")}}


class TestSlug(unittest.TestCase):
    def test_slug_wie_website(self):
        self.assertEqual(slug("Lyngby Porcelæn"), "lyngby-porcelaen")
        self.assertEqual(slug("Kähler"), "kahler")
        self.assertEqual(slug("B&B Italia"), "bb-italia")
        self.assertEqual(slug("Tréca"), "treca")
        self.assertTrue(ist_slug("soleum-flying-carpet"))
        self.assertFalse(ist_slug("Soleum Flying"))

    def test_produkt_slug(self):
        self.assertEqual(produkt_slug("soleum", "Flying Carpet"), "soleum-flying-carpet")
        self.assertEqual(produkt_slug("soleum", "Soleum Lagoon"), "soleum-lagoon")


class TestKatalogMapping(unittest.TestCase):
    def test_marke(self):
        d = marke_doc(MARKE)
        self.assertEqual((d["marke"], d["slug"], d["welt"], d["haendlerstatus"], d["preisart"]), ("Soleum", "soleum", "Bad-Wellness", "Haendler", "Auf Anfrage"))
        self.assertEqual(marke_doc({**MARKE, "slug": "riedel", "welt": "accessoires"})["preisart"], "Verkaufspreis")
        self.assertEqual(marke_doc({**MARKE, "slug": "miele", "welt": "kuechengeraete", "dealer": False})["haendlerstatus"], "Keiner")
        self.assertTrue(marke_doc({**MARKE, "slug": "assouline"})["preise_pausiert_grund"])

    def test_produkt_grunddaten(self):
        d, optionen = produkt_doc(PRODUKT, "Soleum")
        self.assertEqual(d["name"] if "name" in d else d["slug"], "soleum-flying-carpet")
        self.assertEqual(d["status"], "Entwurf")
        self.assertEqual(d["kurz_fr"], "Méridienne chauffante.")
        self.assertEqual(len(d["merkmale"]), 3)
        self.assertEqual(d["merkmale"][1]["text_en"], "LED 230 V")
        self.assertEqual(d["merkmale"][2]["gruppe"], "Material")
        self.assertEqual(d["masse"], [{"key": "laenge", "wert": "204 cm"}, {"key": "gewicht", "wert": "~70 kg"}])
        self.assertEqual(d["bilder"][0]["bild"], "https://platzhirsch.studio/Images/Wellness/produkte/soleum/a.webp")
        self.assertEqual(d["bilder"][0]["freigabe"], "offen")
        self.assertEqual(d["bilder"][1]["typ"], "ambiente")
        self.assertEqual(d["bilder"][1]["quelle_url"], "https://www.soleum.de/y")
        self.assertEqual(d["zubehoer"][0]["produkt"], "soleum-feuerbox")
        self.assertEqual(d["preisart"], "Auf Anfrage")
        self.assertEqual(d["preise"], [])
        self.assertIn("<li>Glasmosaik von SICIS</li>", d["beschreibung_de"])

    def test_ausfuehrungen(self):
        d, optionen = produkt_doc(PRODUKT, "Soleum")
        self.assertEqual(d["ausfuehrungen"][0]["gruppe_key"], "front-paneel")
        self.assertEqual(len(optionen), 2)
        self.assertEqual(optionen[0]["produkt"], "soleum-flying-carpet")
        self.assertEqual((optionen[0]["option_id"], optionen[0]["code"], optionen[0]["farbe_hex"], optionen[0]["standard"]), ("weiss", "RAL 9010", "#F4F4F4", 1))
        self.assertEqual(optionen[1]["standard"], 0)

    def test_verkaufspreis_varianten_in_cent(self):
        zeilen = preis_zeilen(RIEDEL)
        self.assertEqual([z["brutto_cent"] for z in zeilen], [7900, 14900])
        self.assertTrue(all(z["preisart"] == "Verkaufspreis" and z["freigegeben"] == 1 and z["stand"] == "2026-10-31" for z in zeilen))
        self.assertEqual(zeilen[0]["sku"], "6416/0")
        d, _ = produkt_doc(RIEDEL, "Riedel")
        self.assertEqual(d["preisart"], "Verkaufspreis")
        self.assertEqual(d["verkauf_online"], 1)
        self.assertEqual(d["zerbrechlich"], 1)
        self.assertEqual(d["gewicht_g"], 900)
        self.assertNotIn("_variante_id", d["preise"][0])

    def test_uvp_herstellerpreis(self):
        d, _ = produkt_doc(MIELE, "Miele")
        self.assertEqual(d["preise"][0]["preisart"], "Herstellerpreis")
        self.assertEqual(d["preise"][0]["brutto_cent"], 499000)
        self.assertEqual(d["preise"][0]["zusatz_de"], "Systempreis")
        self.assertEqual(d["preisart"], "UVP")
        self.assertEqual(d["verkauf_online"], 0)

    def test_kategorien(self):
        k = kategorie_doc("bildband", "Bildband", ["accessoires"], "Accessoires")
        self.assertEqual((k["ust_klasse"], k["grundpreis_pflicht"]), ("ermaessigt", 0))
        self.assertEqual(kategorie_doc("raumduft")["grundpreis_pflicht"], 1)
        alle = kategorien_aus_katalog({"kategorien": {"sauna": ["wellness", "objekt"]}, "produkte": [PRODUKT]})
        self.assertIn("waermeliege", alle)
        self.assertIn("Bad-Wellness", alle["waermeliege"]["welten"])


if __name__ == "__main__":
    unittest.main()
