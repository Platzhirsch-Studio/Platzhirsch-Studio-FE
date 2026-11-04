"""bench --site <site> run-tests --app ph_faktura --doctype "PH Auftragsbestaetigung" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_faktura.testhilfen import beleg, einstellungen_testmodus, position


class TestPHAuftragsbestaetigung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_testmodus()
        frappe.db.set_single_value("PH Faktura Einstellungen", "anzahlung_automatisch", 0)
        from ph_faktura.einstellungen import cache_leeren

        cache_leeren()

    def ab(self, **kw):
        d = beleg("PH Auftragsbestaetigung", datum=nowdate(), positionen=kw.pop("positionen", [position(menge=2, einzel_netto_cent=50000)]), **kw)
        d.insert()
        return d

    def test_zahlungsplan_aus_bedingung_und_rundung(self):
        ab = self.ab(zahlungsbedingung=frappe.db.get_value("PH Zahlungsbedingung", {"standard": 1}, "name"), positionen=[position(menge=1, einzel_netto_cent=100001)])
        self.assertEqual(ab.anzahlung_prozent, 40)
        self.assertEqual(sum(z.betrag_cent for z in ab.zahlungsplan), ab.brutto_cent)
        self.assertEqual(ab.anzahlung_soll_cent, round(ab.brutto_cent * 0.4))

    def test_zahlungsplan_muss_aufgehen(self):
        d = beleg("PH Auftragsbestaetigung", datum=nowdate(), positionen=[position()], zahlungsplan=[{"art": "Anzahlung", "betrag_cent": 100, "faellig_bei": "Auftrag"}])
        with self.assertRaises(frappe.ValidationError):
            d.insert()

    def test_fagg_frist(self):
        ab = self.ab(vertragsort="Beim Kunden")
        self.assertTrue(ab.fagg_frist_ende)
        ab2 = self.ab(vertragsort="Showroom")
        self.assertFalse(ab2.fagg_frist_ende)

    def test_teilrechnung_anteilig(self):
        ab = self.ab(positionen=[position("Sofa", 1, 1000000), position("Sessel", 2, 100000)], zahlungsplan=[{"art": "Anzahlung", "prozent": 50, "faellig_bei": "Auftrag"}, {"art": "Teilzahlung", "prozent": 30, "faellig_bei": "Lieferung"}, {"art": "Schlusszahlung", "prozent": 20, "faellig_bei": "Montage"}])
        anz = frappe.get_doc("PH Rechnung", ab.anzahlungsrechnung_erstellen())
        anz.submit()
        from ph_faktura.zahlung import zahlung_auf_rechnung

        zahlung_auf_rechnung(anz, anz.zahlbar_cent, "Ueberweisung", nowdate())
        sessel = next(p for p in ab.positionen if p.bezeichnung == "Sessel")
        ab.lieferung_melden(mengen={sessel.name: 2})
        teil = frappe.get_doc("PH Rechnung", ab.rechnung_erstellen("Teilrechnung"))
        self.assertEqual(teil.netto_cent, 200000)
        # anteilige Anzahlung: 50 % × 240.000 brutto = 120.000 → Wertanteil 200000/1200000 → 120.000 × 1/6 = 20.000
        self.assertEqual(teil.anzahlung_brutto_cent, 20000)
        self.assertEqual(teil.zahlbar_cent, 240000 - 20000)
        teil.submit()
        ab.reload()
        self.assertEqual(ab.status, "Teilgeliefert")
        sessel = next(p for p in ab.positionen if p.bezeichnung == "Sessel")
        self.assertEqual(sessel.rechnung_menge, 2)
        ab.lieferung_melden(vollstaendig=1)
        schluss = frappe.get_doc("PH Rechnung", ab.rechnung_erstellen("Schlussrechnung"))
        self.assertEqual(schluss.netto_cent, 1000000)
        self.assertEqual(schluss.anzahlung_brutto_cent, 120000 - 20000)
        schluss.submit()
        ab.reload()
        self.assertEqual(ab.status, "Abgerechnet")
        self.assertEqual(ab.abgerechnet_cent, 240000 + 1200000)

    def test_storno_nur_ohne_leistungsrechnung(self):
        ab = self.ab()
        ab.lieferung_melden(vollstaendig=1)
        re = frappe.get_doc("PH Rechnung", ab.rechnung_erstellen("Schlussrechnung"))
        re.submit()
        with self.assertRaises(frappe.ValidationError):
            ab.stornieren("Test")
        ab2 = self.ab()
        ab2.stornieren("Kunde zurückgetreten")
        ab2.reload()
        self.assertEqual(ab2.status, "Storniert")
        self.assertEqual(ab2.offen_cent, 0)
