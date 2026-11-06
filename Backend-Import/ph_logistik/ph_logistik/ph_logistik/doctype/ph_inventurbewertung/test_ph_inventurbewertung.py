"""bench --site <site> run-tests --app ph_logistik --doctype "PH Inventurbewertung" (Stichtag-Rückrechnung, Abwertung, Festschreiben, CSV, Export)."""

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate

from ph_logistik.ph_logistik.bestand import buche
from ph_logistik.tests.helfer_test import lagerort, produkt


class TestPHInventurbewertung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.lo = lagerort("Testlager Bewertung")
        self.p = produkt("Testvase Bewertung", einkaufspreis_cent=2000)
        frappe.db.set_value("PH Produkt", self.p, "einkaufspreis_cent", 2000)
        b = buche("Wareneingang", self.p, 4, lagerort_nach=self.lo)
        self.bestand = b.lagerbestand

    def test_berechnen_festschreiben_csv(self):
        doc = frappe.get_doc({"doctype": "PH Inventurbewertung", "stichtag": nowdate(), "lagerort": self.lo}).insert()
        doc.berechnen()
        doc.reload()
        zeile = next(p for p in doc.positionen if p.lagerbestand == self.bestand)
        menge = frappe.db.get_value("PH Lagerbestand", self.bestand, "menge")
        self.assertEqual((zeile.menge, zeile.einstandspreis_cent, zeile.ek_quelle, zeile.wert_cent), (menge, 2000, "Rückfall EK", menge * 2000))
        self.assertTrue(doc.methode_beschreibung)
        self.assertIn("1600", doc.buchungsvorschlag or "")
        url = doc.csv_exportieren()
        self.assertTrue(url.startswith("/private/files/"))
        doc.festschreiben()
        doc.reload()
        self.assertEqual(doc.status, "Festgeschrieben")
        doc.stichtag = add_days(nowdate(), -1)
        with self.assertRaises(frappe.ValidationError):
            doc.save()
        with self.assertRaises(frappe.ValidationError):
            doc.delete()

    def test_rueckrechnung_stichtag(self):
        """Alle Bewegungen sind von heute → zum Stichtag gestern ist die Zeile leer; heute zählt der Verkauf."""
        gestern = add_days(nowdate(), -1)
        vorher = frappe.db.get_value("PH Lagerbestand", self.bestand, "menge")
        buche("Verkauf", self.p, 1, lagerort_von=self.lo, lagerbestand=self.bestand)
        from ph_logistik.ph_logistik.bewertung import berechnen

        heute = {z["lagerbestand"]: z["menge"] for z in berechnen(nowdate(), self.lo)["zeilen"]}
        self.assertEqual(heute.get(self.bestand), vorher - 1)
        frueher = {z["lagerbestand"]: z["menge"] for z in berechnen(gestern, self.lo)["zeilen"]}
        self.assertNotIn(self.bestand, frueher)  # Wareneingang erst heute → am Stichtag gestern 0

    def test_abwertung_b_ware(self):
        buche("Wareneingang", self.p, 1, lagerort_nach=self.lo, zustand="B-Ware")
        from ph_logistik.ph_logistik.bewertung import berechnen

        b = next(z for z in berechnen(nowdate(), self.lo)["zeilen"] if z["bewertungsart"] == "B-Ware")
        self.assertGreater(b["abwertung_promille"], 0)
        self.assertLess(b["wert_cent"], b["wert_ak_cent"])

    def test_export_zeile_faktura(self):
        if not frappe.db.exists("DocType", "PH Export Lauf"):
            self.skipTest("ph_faktura nicht installiert")
        from ph_faktura.ph_faktura.integration import inventurbewertung_zeilen

        doc = frappe.get_doc({"doctype": "PH Inventurbewertung", "stichtag": nowdate(), "lagerort": self.lo}).insert()
        doc.berechnen()
        doc.festschreiben()
        zeilen = [z for z in inventurbewertung_zeilen(nowdate(), nowdate(), 1) if z["beleg"] == doc.name]
        self.assertEqual(len(zeilen), 1)
        self.assertEqual(zeilen[0]["ust_cent"], 0)
