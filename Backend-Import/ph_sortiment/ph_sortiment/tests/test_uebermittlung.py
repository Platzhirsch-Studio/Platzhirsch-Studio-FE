"""Tests ohne Site: Übermittlungs-Adapter (CSV, IWOfurn-XML, EDIFACT ORDERS), GLN, Status, AB-Merker, Konditionen, Reklamationsstatistik."""

import unittest
import xml.etree.ElementTree as ET
from datetime import date

from ph_sortiment.logik.kalkulation import rabatt_fuer, skonto_cent, zuschlaege_cent
from ph_sortiment.logik.statistik import reklamationsstatistik
from ph_sortiment.logik.uebermittlung import ADAPTER, AdapterFehler, ab_merker, ab_vollstaendig, adapter_fuer_bestellweg, edi_escape, exportieren, gln_gueltig, uebermittlung_erlaubt

GLN_PH = "4012345000009"   # gültige Prüfziffer (Beispiel-GLN)
GLN_LF = "4000001000005"

BESTELLUNG = {
    "name": "HB-2026-00042", "datum": "2026-11-04", "wunschtermin": "2026-12-15", "kommission": "Müller Küche", "waehrung": "EUR",
    "lieferadresse_text": "Platzhirsch Home Living\nLandstraße 11\n6911 Lochau", "notizen_lieferant": "Bitte avisieren",
    "positionen": [
        {"idx": 1, "hersteller_artikelnr": "US60", "ean": "4006381333931", "bezeichnung": "Unterschrank 60 cm", "ausfuehrung_text": "Front Lack weiß+matt", "menge": 2, "einheit": "Stk", "wunschtermin": "2026-12-15"},
        {"idx": 2, "hersteller_artikelnr": "AP-1'2", "bezeichnung": "Arbeitsplatte: Eiche", "menge": 1},
    ],
}
ABSENDER = {"firma": "Platzhirsch Home Living", "gln": GLN_PH}
LIEFERANT = {"firmenname": "Musterküchen GmbH", "gln": GLN_LF, "kundennummer": "K-77"}


class TestAdapter(unittest.TestCase):
    def test_registry_und_bestellweg(self):
        self.assertEqual(set(ADAPTER), {"E-Mail", "CSV", "IWOfurn", "EDI"})
        self.assertEqual(adapter_fuer_bestellweg("IWOfurn"), "IWOfurn")
        self.assertEqual(adapter_fuer_bestellweg("Fax"), "E-Mail")
        with self.assertRaises(AdapterFehler):
            exportieren("E-Mail", BESTELLUNG, ABSENDER, LIEFERANT)
        with self.assertRaises(AdapterFehler):
            exportieren("X400", BESTELLUNG, ABSENDER, LIEFERANT)

    def test_csv_kompatibel(self):
        r = exportieren("CSV", BESTELLUNG, {}, {})
        self.assertEqual(r["dateiname"], "HB-2026-00042-csv.csv")
        self.assertTrue(r["inhalt"].startswith("﻿pos;hersteller_artikelnr;bezeichnung;ausfuehrung;menge;wunschtermin;kommission\r\n"))
        self.assertIn("1;US60;Unterschrank 60 cm;Front Lack weiß+matt;2;2026-12-15;", r["inhalt"])
        self.assertIsNone(r["hinweis"])

    def test_iwofurn_xml_wohlgeformt(self):
        r = exportieren("IWOfurn", BESTELLUNG, ABSENDER, LIEFERANT)
        wurzel = ET.fromstring(r["inhalt"].split("\n", 1)[1].split("\n", 1)[1])
        self.assertEqual(wurzel.get("Nummer"), "HB-2026-00042")
        self.assertEqual(wurzel.find("Lieferant").get("GLN"), GLN_LF)
        self.assertEqual(len(wurzel.findall("Position")), 2)
        self.assertIn("unverifiziert", r["hinweis"])

    def test_edi_orders(self):
        r = exportieren("EDI", BESTELLUNG, ABSENDER, LIEFERANT)
        segs = [s for s in r["inhalt"].split("'\n") if s.strip()]
        self.assertTrue(segs[0].startswith("UNA:+.? "))
        self.assertTrue(segs[1].startswith(f"UNB+UNOC:3+{GLN_PH}:14+{GLN_LF}:14+"))
        unh = next(i for i, s in enumerate(segs) if s.startswith("UNH"))
        unt = next(i for i, s in enumerate(segs) if s.startswith("UNT"))
        self.assertEqual(segs[unt], f"UNT+{unt - unh + 1}+1")
        self.assertIn("PIA+1+AP-1?'2:SA", segs)
        self.assertIn("IMD+F++:::Arbeitsplatte?: Eiche", segs)
        self.assertIn("QTY+21:2", segs)
        self.assertIn("CNT+2:2", segs)
        self.assertTrue(segs[-1].startswith("UNZ+1+"))

    def test_gln_pflicht_und_pruefziffer(self):
        self.assertTrue(gln_gueltig(GLN_PH))
        self.assertFalse(gln_gueltig("4012345000001"))
        self.assertFalse(gln_gueltig("12"))
        with self.assertRaises(AdapterFehler) as f:
            exportieren("EDI", BESTELLUNG, {"gln": "1"}, LIEFERANT)
        self.assertIn("Eigene GLN", str(f.exception))
        self.assertEqual(edi_escape("a+b:c'd?e"), "a?+b?:c?'d??e")

    def test_status_uebergaenge(self):
        self.assertTrue(uebermittlung_erlaubt(None, "Exportiert"))
        self.assertTrue(uebermittlung_erlaubt("Uebermittelt", "Bestaetigt"))
        self.assertFalse(uebermittlung_erlaubt("Exportiert", "Bestaetigt"))
        self.assertFalse(uebermittlung_erlaubt("Bestaetigt", "Fehler"))


class TestAbMerker(unittest.TestCase):
    def test_merker(self):
        self.assertEqual(ab_merker(False, []), "offen")
        self.assertEqual(ab_merker(True, []), "bestaetigt")
        self.assertEqual(ab_merker(True, [{"bewertung": "pruefen"}]), "abweichung")
        self.assertEqual(ab_merker(True, [{"bewertung": "ok"}, {"bewertung": "abgelehnt"}]), "geklaert")
        self.assertTrue(ab_vollstaendig(["bestaetigt", "geklaert"]))
        self.assertFalse(ab_vollstaendig(["bestaetigt", "abweichung"]))
        self.assertFalse(ab_vollstaendig([]))


class TestKonditionen(unittest.TestCase):
    def test_rabattstaffel(self):
        st = [{"rabatt_promille": 300}, {"ab_wert_cent": 1000000, "rabatt_promille": 350}, {"marke": "nolte", "rabatt_promille": 400}, {"marke": "nolte", "kategorie": "kueche", "ab_wert_cent": 500000, "rabatt_promille": 450}]
        self.assertEqual(rabatt_fuer(st, 0, bestellwert_cent=200000), 300)
        self.assertEqual(rabatt_fuer(st, 0, bestellwert_cent=1200000), 350)
        self.assertEqual(rabatt_fuer(st, 0, "nolte", "bad", 0), 400)
        self.assertEqual(rabatt_fuer(st, 0, "nolte", "kueche", 600000), 450)
        self.assertEqual(rabatt_fuer(st, 0, "nolte", "kueche", 100000), 400)
        self.assertEqual(rabatt_fuer([], 250), 250)
        self.assertEqual(rabatt_fuer([]), 0)

    def test_zuschlaege_skonto(self):
        self.assertEqual(zuschlaege_cent(40000, 50000, 2500, 4900, 100000), 7400)
        self.assertEqual(zuschlaege_cent(150000, 50000, 2500, 4900, 100000), 0)
        self.assertEqual(skonto_cent(123456, 20), 2469)


class TestStatistik(unittest.TestCase):
    def test_quoten_je_lieferant(self):
        zeilen, gesamt = reklamationsstatistik(
            we_positionen=[{"lieferant": "A", "zustand": "ok"}, {"lieferant": "A", "zustand": "Transportschaden"}, {"lieferant": "A", "zustand": "ok", "menge_erwartet": 2, "menge_erhalten": 1}, {"lieferant": "B", "zustand": "ok"}],
            hb_positionen=[{"lieferant": "A", "abweichung": "Termin"}, {"lieferant": "A", "abweichung": "keine"}, {"lieferant": "B", "abweichung": "keine"}],
            lieferungen=[{"lieferant": "A", "termin": "2026-11-01", "geliefert_am": date(2026, 11, 8)}, {"lieferant": "B", "termin": "2026-11-01", "geliefert_am": "2026-10-30"}, {"lieferant": "B", "termin": None, "geliefert_am": "2026-10-30"}],
            servicefaelle=[{"lieferant": "A"}],
            regresse=[{"lieferant": "A", "betrag_gefordert_cent": 10000, "betrag_anerkannt_cent": 8000}],
        )
        self.assertEqual([z["lieferant"] for z in zeilen], ["A", "B"])
        a = zeilen[0]
        self.assertEqual((a["we_schaeden"], a["Transportschaden"], a["unterlieferung"]), (1, 1, 1))
        self.assertEqual(a["schadenquote_promille"], 333)
        self.assertEqual(a["ab_abweichungsquote_promille"], 500)
        self.assertEqual((a["termintreue_promille"], a["verspaetung_tage_schnitt"]), (0, 7))
        self.assertEqual(a["regress_quote_promille"], 800)
        self.assertEqual(zeilen[1]["termintreue_promille"], 1000)
        self.assertEqual(gesamt["we_positionen"], 4)
        self.assertEqual(gesamt["schadenquote_promille"], 250)
        self.assertEqual(reklamationsstatistik(), ([], None))


if __name__ == "__main__":
    unittest.main()
