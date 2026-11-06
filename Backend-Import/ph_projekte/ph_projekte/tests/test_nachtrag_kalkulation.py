import io
import unittest
from datetime import date

from ph_projekte.utils import kalkulation as k
from ph_projekte.utils import maengel, mappe
from ph_projekte.utils import nachtrag as n


class TestNachtrag(unittest.TestCase):
    Z = [
        {"art": "neu", "bezeichnung": "Weinkühlschrank", "menge": 1, "einzel_cent": 189000, "ek_cent": 120000},
        {"art": "entfall", "bezeichnung": "Mikrowelle", "menge": 1, "einzel_cent": 59000, "bezug_zeile": "z3", "ek_cent": 35000},
        {"art": "aenderung", "bezeichnung": "Front Eiche statt Lack", "menge": 6, "einzel_cent": 4500, "bezug_zeile": "z1", "ausfuehrung_text": "Eiche geölt"},
    ]

    def test_summen(self):
        s = n.summen(self.Z)
        self.assertEqual((s["summe_neu_cent"], s["summe_entfall_cent"], s["summe_aenderung_cent"], s["differenz_cent"]), (189000, -59000, 27000, 157000))
        self.assertEqual(s["ek_differenz_cent"], 85000)
        self.assertEqual(n.zeilenbetrag("aenderung", 2, -1000), -2000)

    def test_pruefen(self):
        self.assertEqual(n.pruefen(self.Z), [])
        f = n.pruefen([{"art": "entfall", "bezeichnung": ""}, {"art": "x", "bezeichnung": "a"}, {"art": "neu", "bezeichnung": "b", "einzel_cent": -1}])
        self.assertEqual(len(f), 4)
        self.assertTrue(n.pruefen([]))

    def test_uebergaenge(self):
        self.assertTrue(n.uebergang_erlaubt("Entwurf", "Vorgelegt"))
        self.assertTrue(n.uebergang_erlaubt("Vorgelegt", "Freigegeben"))
        self.assertFalse(n.uebergang_erlaubt("Freigegeben", "Entwurf"))
        self.assertFalse(n.uebergang_erlaubt("Entwurf", "Freigegeben"))

    def test_projekt_aenderungen(self):
        neu, aend = n.projekt_aenderungen(self.Z, "PH-NT-1")
        self.assertEqual((neu[0]["preis_cent"], neu[0]["nachtrag"]), (189000, "PH-NT-1"))
        self.assertEqual(aend["z3"]["lieferstatus"], "storniert")
        self.assertEqual(aend["z1"]["ausfuehrung_text"], "Eiche geölt")
        self.assertEqual(n.portal_status("Vorgelegt"), "pending")


class TestKalkulation(unittest.TestCase):
    def test_soll_ist(self):
        pos = [{"menge": 2, "ek_cent": 50000, "preis_cent": 100000}, {"menge": 1, "ek_cent": 10000, "preis_cent": 30000, "lieferstatus": "storniert"}]
        hb = [{"menge": 2, "ek_cent": 50000, "ab_ek_cent": 52000}, {"menge": 1, "ek_cent": 9999, "status_hb": "Storniert"}]
        re = [{"betrag_cent": 60000, "art": "Anzahlung"}, {"betrag_cent": 205000, "art": "Schlussrechnung"}]
        r = k.kalkulation(pos, [{"summe_aenderung_cent": 5000}], hb, re, stunden_soll=8, stunden_ist=10, kostensatz_cent=4500)
        self.assertEqual(r["soll"], {"ek_cent": 100000, "vk_cent": 205000, "montage_h": 8.0, "montage_cent": 36000, "db_cent": 69000, "marge_promille": 337})
        self.assertEqual((r["ist"]["ek_cent"], r["ist"]["vk_cent"], r["ist"]["montage_cent"]), (104000, 205000, 45000))
        self.assertEqual(r["abweichung"]["db_cent"], r["ist"]["db_cent"] - 69000)
        self.assertIsNone(k.marge_promille(100, 0))


class TestMaengel(unittest.TestCase):
    def test_erledigt_klein_gross(self):
        self.assertTrue(maengel.ist_erledigt("behoben"))
        self.assertTrue(maengel.ist_erledigt("Behoben"))
        self.assertFalse(maengel.ist_erledigt("in Arbeit"))
        self.assertTrue(maengel.ist_erledigt(None, "2026-11-01"))
        self.assertTrue(maengel.ist_erledigt(erledigt=1))

    def test_ueberfaellig(self):
        h = date(2026, 11, 10)
        self.assertTrue(maengel.ueberfaellig("2026-11-09", h, "offen"))
        self.assertFalse(maengel.ueberfaellig("2026-11-10", h, "offen"))
        self.assertFalse(maengel.ueberfaellig("2026-11-01", h, "behoben"))
        self.assertEqual(maengel.tage_ueberfaellig("2026-11-01", h), 9)
        self.assertTrue(maengel.erinnerung_faellig("2026-11-01", None, h))
        self.assertFalse(maengel.erinnerung_faellig("2026-11-01", "2026-11-09", h))
        self.assertTrue(maengel.erinnerung_faellig("2026-11-01", "2026-11-06", h))


class TestMappe(unittest.TestCase):
    def test_teile(self):
        self.assertEqual(mappe.teile_waehlen(), list(mappe.TEILE))
        self.assertEqual(mappe.teile_waehlen("abnahme, deckblatt,xyz"), ["deckblatt", "abnahme"])
        self.assertTrue(mappe.ist_pdf(b"%PDF-1.4 ..."))
        self.assertFalse(mappe.ist_pdf(b"<html>"))
        self.assertEqual(mappe.inhaltsverzeichnis([("deckblatt", "Deckblatt")])[0]["nr"], 1)

    def test_zusammenfuehren(self):
        try:
            from pypdf import PdfWriter
        except ImportError:
            self.skipTest("pypdf nicht installiert (kommt mit Frappe)")

        def leer(anzahl):
            w = PdfWriter()
            for _ in range(anzahl):
                w.add_blank_page(width=595, height=842)
            b = io.BytesIO()
            w.write(b)
            return b.getvalue()

        daten, seiten, ueber = mappe.zusammenfuehren([leer(1), b"kein pdf", leer(2)])
        self.assertEqual((seiten, ueber), (3, 1))
        self.assertTrue(mappe.ist_pdf(daten))


if __name__ == "__main__":
    unittest.main()
