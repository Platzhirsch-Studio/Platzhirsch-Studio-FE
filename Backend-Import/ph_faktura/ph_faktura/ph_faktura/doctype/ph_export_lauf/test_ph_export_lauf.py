"""bench --site <site> run-tests --app ph_faktura --doctype "PH Export Lauf" – Export BMD/DATEV, Sperre, UVA-Kennzahlen aus Testbelegen."""

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_months, getdate, nowdate

from ph_faktura.testhilfen import beleg, einstellungen_testmodus, position


class TestPHExportLauf(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_testmodus()

    def gestellte_rechnung(self, **kw):
        re = beleg("PH Rechnung", art="Rechnung", datum=nowdate(), leistungsdatum=nowdate(), positionen=kw.pop("positionen", [position(), position("Buch", 1, 1000, 1000)]), **kw)
        re.insert()
        re.submit()
        return re

    def test_bmd_und_datev_export_mit_protokoll(self):
        re = self.gestellte_rechnung()
        for fmt in ("BMD CSV", "DATEV Buchungsstapel"):
            lauf = frappe.get_doc({"doctype": "PH Export Lauf", "format": fmt, "zeitraum_von": add_months(nowdate(), -1), "zeitraum_bis": nowdate(), "belegarten": "Alle", "nur_neue": 0}).insert()
            erg = lauf.erzeugen()
            lauf.reload()
            self.assertGreaterEqual(erg["anzahl"], 1)
            self.assertEqual(lauf.status, "Erzeugt")
            self.assertTrue(lauf.datei and lauf.datei_protokoll)
            self.assertEqual(len(lauf.pruefsumme_gesamt), 64)
            zeile = next(b for b in lauf.belege if b.beleg == re.name)
            self.assertEqual(zeile.brutto_cent, re.brutto_cent)
            self.assertEqual(len(zeile.pruefsumme), 16)
            inhalt = frappe.get_doc("File", {"file_url": lauf.datei}).get_content().decode("utf-8-sig")
            self.assertIn(re.name, inhalt)
            if fmt == "DATEV Buchungsstapel":
                self.assertTrue(inhalt.startswith("EXTF;700;21;Buchungsstapel"))
        self.assertEqual(frappe.db.get_value("PH Rechnung", re.name, "export_status"), "exportiert")
        # nur_neue: bereits exportierte Belege werden nicht erneut geliefert
        lauf3 = frappe.get_doc({"doctype": "PH Export Lauf", "format": "BMD CSV", "zeitraum_von": add_months(nowdate(), -1), "zeitraum_bis": nowdate(), "nur_neue": 1}).insert()
        zeilen = lauf3.zeilen_sammeln()
        self.assertNotIn(re.name, [z["beleg"] for z in zeilen])

    def test_verwerfen_gibt_belege_frei(self):
        re = self.gestellte_rechnung()
        lauf = frappe.get_doc({"doctype": "PH Export Lauf", "format": "CSV generisch", "zeitraum_von": nowdate(), "zeitraum_bis": nowdate(), "nur_neue": 1}).insert()
        lauf.erzeugen()
        lauf.verwerfen()
        self.assertEqual(frappe.db.get_value("PH Rechnung", re.name, "export_status"), "offen")

    def test_uva_kennzahlen(self):
        self.gestellte_rechnung()
        heute = getdate(nowdate())
        uva = frappe.get_doc({"doctype": "PH UVA Auswertung", "zeitraum_art": "Monat", "jahr": heute.year, "periode": heute.month})
        if frappe.db.exists("PH UVA Auswertung", {"jahr": heute.year, "periode": heute.month, "zeitraum_art": "Monat"}):
            uva = frappe.get_doc("PH UVA Auswertung", {"jahr": heute.year, "periode": heute.month, "zeitraum_art": "Monat"})
        else:
            uva.insert()
        felder = uva.berechnen()
        self.assertGreaterEqual(felder["kz022_cent"], 100000)
        self.assertGreaterEqual(felder["kz022_ust_cent"], 20000)
        self.assertGreaterEqual(felder["kz029_cent"], 1000)
        self.assertEqual(uva.status, "Berechnet")
        self.assertTrue(any(z.kennzahl == "022" for z in uva.zeilen))
