"""Nachauftrag 32-marktfunktionen-nachtrag: Änderungsabgleich, pCon, Küche komplett, Montagezeit, Qualifikation, E-Geräte."""

import unittest

from ph_projekte.utils import kuechenplanung as kp
from ph_projekte.utils import lieferung as l
from ph_projekte.utils import montageplan as m


class TestAbgleich(unittest.TestCase):
    ALT = [
        {"name": "a1", "pos_nr": "1", "hersteller_artikelnr": "US60", "bezeichnung": "Unterschrank", "menge": 1, "preis_cent": 50000, "ausfuehrung_text": "Lack weiß"},
        {"name": "a2", "pos_nr": "2", "hersteller_artikelnr": "HS30", "bezeichnung": "Hochschrank", "menge": 1, "lieferstatus": "bestellt", "herstellerbestellung": "HB-1", "projekt_zeile": "pz2"},
        {"name": "a3", "pos_nr": "3", "hersteller_artikelnr": "GS60", "bezeichnung": "Geschirrspüler", "menge": 1},
        {"name": "a4", "pos_nr": "4", "hersteller_artikelnr": "X", "bezeichnung": "alt storniert", "storniert": 1},
    ]

    def test_neu_geaendert_entfallen(self):
        neu = kp.vorschau("csv", "Pos;Typ;Bezeichnung;Menge;Front;VK\n1;US60;Unterschrank;2;Lack weiß;500\n3;GS60;Geschirrspüler;1;;\n5;AP;Arbeitsplatte;1;;\n")["positionen"]
        e = kp.abgleich(self.ALT, neu)
        self.assertEqual([p["hersteller_artikelnr"] for p in e["neu"]], ["AP"])
        self.assertEqual(e["geaendert"][0]["name"], "a1")
        self.assertEqual(e["geaendert"][0]["felder"]["menge"], [1, 2])
        self.assertNotIn("vk_cent", e["geaendert"][0]["felder"])
        self.assertEqual(e["unveraendert"], 1)
        self.assertEqual([x["name"] for x in e["entfallen"]], ["a2"])
        self.assertTrue(e["entfallen"][0]["bestellt"])
        self.assertEqual(e["entfallen"][0]["projekt_zeile"], "pz2")

    def test_schluessel_ohne_nummern(self):
        self.assertEqual(kp.abgleich_schluessel({"bezeichnung": " Sofa "}), "txt|sofa")
        self.assertFalse(kp.ist_bestellt({"lieferstatus": "offen"}))

    def test_pcon_vorlagen(self):
        self.assertFalse(kp.adapter("pcon_obx").verifiziert)
        v = kp.vorschau("pcon_obx", '<basket><artItem itemNo="10" quantity="2"><artNr>ABC-1</artNr><shortText>Stuhl</shortText><salesPrice>199.00</salesPrice></artItem></basket>')
        self.assertEqual((v["positionen"][0]["pos_nr"], v["positionen"][0]["menge"], v["positionen"][0]["vk_cent"]), ("10", 2, 19900))
        v2 = kp.vorschau("pcon_csv", "ArticleNumber;ShortText;Quantity\nT-1;Tisch;1\n")
        self.assertEqual(v2["positionen"][0]["hersteller_artikelnr"], "T-1")


class TestKomplett(unittest.TestCase):
    def test_ware_komplett(self):
        pos = [
            {"name": "1", "bezeichnung": "Korpus", "lieferant": "L", "menge": 2, "menge_geliefert": 2},
            {"name": "2", "bezeichnung": "Montage", "menge": 1},
            {"name": "3", "bezeichnung": "Front", "lieferant": "L", "menge": 1, "lieferstatus": "storniert"},
        ]
        self.assertEqual(l.ware_komplett(pos), (True, []))
        pos[0]["menge_geliefert"] = 1
        ok, fehlend = l.ware_komplett(pos)
        self.assertFalse(ok)
        self.assertEqual(fehlend[0]["offen"], 1)
        pos[0].update(menge_geliefert=2, nachlieferung_noetig=1, nachlieferung_menge=1)
        self.assertFalse(l.ware_komplett(pos)[0])
        self.assertFalse(l.ware_komplett([{"bezeichnung": "nur Dienstleistung"}])[0])


class TestMontagezeitQualifikation(unittest.TestCase):
    def test_montagezeit(self):
        rw = [{"kategorie": "Unterschrank", "minuten_je_stueck": 45}, {"kategorie": "Schrank", "minuten_je_stueck": 30}, {"kategorie": "Arbeitsplatte", "minuten_je_stueck": 90}]
        pos = [
            {"bezeichnung": "Unterschrank 60", "kategorie": "Unterschrank", "menge": 4},
            {"bezeichnung": "Hochschrank 60", "kategorie": "", "menge": 2},
            {"bezeichnung": "Arbeitsplatte Granit", "kategorie": "Arbeitsplatte", "menge": 1},
            {"bezeichnung": "Wandbild", "menge": 1},
            {"bezeichnung": "Elektro", "menge": 1, "montage_art": "Fremdgewerk"},
        ]
        r = m.montagezeit(pos, rw, standard_min_je_stueck=15, grundzeit_min=60)
        self.assertEqual(r["minuten"], 60 + 180 + 60 + 90 + 15)
        self.assertEqual(r["ohne_richtwert"], ["Wandbild"])
        self.assertEqual(r["stunden"], round(405 / 60, 2))

    def test_verschiebung(self):
        self.assertTrue(m.verschiebung_relevant("2027-01-10 08:00", "2027-01-11 08:00"))
        self.assertFalse(m.verschiebung_relevant("2027-01-10 08:00", "2027-01-10 08:20"))
        self.assertIn("10.01.2027 08:00 → 11.01.2027 08:00", m.kundentext_verschiebung("Küche", "2027-01-10 08:00", "2027-01-11 08:00"))

    def test_qualifikationen(self):
        qm = m.qualifikationen_je_monteur([{"user": "anna", "qualifikation": "Kueche"}, {"user": "anna", "qualifikation": "Wasser-Anschluss"}, {"user": "ben", "qualifikation": "Elektro-Anschluss"}])
        self.assertEqual(m.fehlende_qualifikationen(["Kueche", "Elektro-Anschluss", "Naturstein"], ["anna", "ben"], qm), ["Naturstein"])
        self.assertEqual(m.geeignete_monteure(["Kueche"], qm), ["anna"])
        v = m.qualifikationen_vorschlagen("Kueche", ["Wasser kalt", "Starkstrom 400 V"], ["Arbeitsplatte Granit", "Leuchte"])
        self.assertEqual(v, ["Elektro-Anschluss", "Kueche", "Leuchten", "Naturstein", "Wasser-Anschluss"])

    def test_geraet(self):
        self.assertTrue(m.ist_geraet({"bezeichnung": "Geschirrspüler vollintegriert"}))
        self.assertTrue(m.ist_geraet({"kategorie": "Gerät", "bezeichnung": "X"}))
        self.assertFalse(m.ist_geraet({"bezeichnung": "Unterschrank"}))


if __name__ == "__main__":
    unittest.main()
