"""Integration Runde 3 (52-…, Abschnitt 8): Rabattgutschein, Einzweck-Satz, Kundenkarten-Fehler, Ausstellungsstück – ohne Frappe."""

import unittest

from ph_kassa.logik.betraege import KassenFehler, beleg_pruefen, position_berechnen
from ph_kassa.logik.integration import (
    ausstellungsstueck_position,
    ausstellungsstuecke_im_beleg,
    einloese_steuersatz,
    gutscheine_umstellen,
    karten_fehler,
    rabatt_aufteilen,
    rabatt_positionen,
)

WARE = [
    {"art": "Artikel", "menge": 1, "einzel_brutto_cent": 12000, "steuersatz": "Normal 20"},
    {"art": "Artikel", "menge": 2, "einzel_brutto_cent": 2000, "steuersatz": "Ermaessigt-1 10"},
]
RABATT = {"gutschein": "PH-GS-1", "art": "Rabatt", "mindert_entgelt": True, "rest_cent": 5000, "letzte4": "AB12", "steuersatz": None, "einloesbar": True}
EINZWECK = {"gutschein": "PH-GS-2", "art": "Einzweck", "mindert_entgelt": False, "rest_cent": 5000, "steuersatz": "Ermaessigt-1 10"}


class TestRabattAufteilung(unittest.TestCase):
    def test_anteilig_je_satz_summe_exakt(self):
        teile = rabatt_aufteilen(1001, WARE)
        self.assertEqual(sum(t["brutto_cent"] for t in teile), 1001)
        d = {t["steuersatz"]: t["brutto_cent"] for t in teile}
        self.assertEqual(d["Normal 20"] + d["Ermaessigt-1 10"], 1001)
        self.assertAlmostEqual(d["Normal 20"] / 1001, 12000 / 16000, delta=0.01)

    def test_gedeckelt_auf_ware(self):
        self.assertEqual(sum(t["brutto_cent"] for t in rabatt_aufteilen(99999, WARE)), 16000)

    def test_ohne_ware_fehler(self):
        with self.assertRaises(KassenFehler):
            rabatt_aufteilen(500, [{"art": "Anzahlung", "einzel_brutto_cent": 10000, "steuersatz": "Normal 20"}])

    def test_rabattpositionen_negativ_und_mit_bezug(self):
        pos = rabatt_positionen("PH-GS-1", 1600, WARE, "AB12")
        self.assertTrue(all(p["art"] == "Rabatt" and p["einzel_brutto_cent"] < 0 and p["gutschein"] == "PH-GS-1" and p["bezug_doctype"] == "PH Gutschein" for p in pos))
        b = [position_berechnen(p) for p in pos]
        self.assertEqual(sum(x["brutto_cent"] for x in b), -1600)
        self.assertLess(sum(x["ust_cent"] for x in b), 0)  # Entgeltminderung mindert auch die USt


class TestGutscheineUmstellen(unittest.TestCase):
    def test_rabatt_zahlart_wird_position(self):
        zahl = [{"zahlart": "Gutschein", "gutschein": "PH-GS-1", "betrag_cent": 2000}, {"zahlart": "Bar", "betrag_cent": 14000}]
        pos, z, hinweise = gutscheine_umstellen(list(WARE), zahl, {"PH-GS-1": RABATT})
        self.assertEqual([x["zahlart"] for x in z], ["Bar"])
        self.assertEqual(sum(-p["einzel_brutto_cent"] for p in pos if p["art"] == "Rabatt"), 2000)
        self.assertTrue(hinweise)
        s = beleg_pruefen(pos, z)  # Summe 16000 − 2000 = 14000 = Bar
        self.assertEqual(s["gesamt_cent"], 14000)

    def test_rabatt_auf_restwert_begrenzt(self):
        zahl = [{"zahlart": "Gutschein", "gutschein": "PH-GS-1", "betrag_cent": 9000}]
        pos, _z, _h = gutscheine_umstellen(list(WARE), zahl, {"PH-GS-1": RABATT})
        self.assertEqual(sum(-p["einzel_brutto_cent"] for p in pos if p["art"] == "Rabatt"), 5000)

    def test_rabatt_als_einloese_position(self):
        p = list(WARE) + [{"art": "Gutschein Einloesung", "gutschein": "PH-GS-1", "menge": 1, "einzel_brutto_cent": 1000, "steuersatz": "Normal 20"}]
        pos, _z, _h = gutscheine_umstellen(p, [], {"PH-GS-1": RABATT})
        self.assertFalse(any(x["art"] == "Gutschein Einloesung" for x in pos))
        self.assertEqual(sum(-x["einzel_brutto_cent"] for x in pos if x["art"] == "Rabatt"), 1000)

    def test_einzweck_satz_der_ausgabe(self):
        p = list(WARE) + [{"art": "Gutschein Einloesung", "gutschein": "PH-GS-2", "menge": 1, "einzel_brutto_cent": 1000, "steuersatz": "Normal 20"}]
        pos, _z, _h = gutscheine_umstellen(p, [], {"PH-GS-2": EINZWECK})
        self.assertEqual(pos[-1]["steuersatz"], "Ermaessigt-1 10")

    def test_einzweck_ohne_satz_klare_meldung(self):
        with self.assertRaises(KassenFehler) as cm:
            einloese_steuersatz({"gutschein": "PH-GS-3", "art": "Einzweck", "steuersatz": None})
        self.assertIn("USt-Satz", str(cm.exception))

    def test_mehrzweck_bleibt_zahlart(self):
        zahl = [{"zahlart": "Gutschein", "gutschein": "PH-GS-4", "betrag_cent": 2000}]
        pos, z, h = gutscheine_umstellen(list(WARE), zahl, {"PH-GS-4": {"art": "Mehrzweck", "mindert_entgelt": False}})
        self.assertEqual(z, zahl)
        self.assertEqual(h, [])
        self.assertIsNone(einloese_steuersatz({"art": "Mehrzweck"}))


class TestKartenFehler(unittest.TestCase):
    def test_card_code_bleibt_und_meldung(self):
        f = karten_fehler("card_blocked", "card_blocked", "V-1", 409)
        self.assertEqual(f["code"], "card_blocked")
        self.assertEqual(f["vorteil"], "V-1")
        self.assertIn("gesperrt", f["meldung"])

    def test_eigene_meldung_gewinnt(self):
        self.assertEqual(karten_fehler("limit_reached", "Pflegetermin: Limit erreicht")["meldung"], "Pflegetermin: Limit erreicht")

    def test_ohne_code(self):
        self.assertEqual(karten_fehler(None)["code"], "unavailable")


class TestAusstellungsstueck(unittest.TestCase):
    LB = {"name": "PH-LB-00001", "produkt": "P1", "produkt_name": "Sofa Nube", "marke": "Arflex", "seriennummer": "SN1", "ausstellungsstueck": 1, "status": "Verfuegbar", "vk_cent_ausstellung": 99000, "zustand": "Ausstellung"}

    def test_position_mit_bezug(self):
        p = ausstellungsstueck_position(self.LB, None, "Normal 20", "normal")
        self.assertEqual((p["art"], p["bezug_doctype"], p["bezug"], p["einzel_brutto_cent"], p["steuersatz"]), ("Artikel", "PH Lagerbestand", "PH-LB-00001", 99000, "Normal 20"))
        self.assertTrue(p["bezeichnung"].startswith("Ausstellungsstück"))
        self.assertIn("S/N SN1", p["zusatz"])
        self.assertFalse(p["bereits_gebucht"])

    def test_preis_ueberschreibbar_und_bereits_verkauft(self):
        p = ausstellungsstueck_position({**self.LB, "status": "Verkauft"}, 80000)
        self.assertEqual(p["einzel_brutto_cent"], 80000)
        self.assertTrue(p["bereits_gebucht"])

    def test_nicht_verkaeuflich(self):
        for lb in ({**self.LB, "ausstellungsstueck": 0}, {**self.LB, "status": "Gesperrt"}, {**self.LB, "status": "Reserviert"}, {**self.LB, "vk_cent_ausstellung": 0}):
            with self.assertRaises(KassenFehler):
                ausstellungsstueck_position(lb)

    def test_doppelt_im_beleg(self):
        p = {"bezug_doctype": "PH Lagerbestand", "bezug": "PH-LB-1", "menge": 1}
        self.assertEqual(len(ausstellungsstuecke_im_beleg([p, {"art": "Artikel"}])), 1)
        with self.assertRaises(KassenFehler):
            ausstellungsstuecke_im_beleg([p, dict(p)])
        with self.assertRaises(KassenFehler):
            ausstellungsstuecke_im_beleg([{**p, "menge": 2}])


if __name__ == "__main__":
    unittest.main()
