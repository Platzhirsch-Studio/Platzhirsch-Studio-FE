"""bench --site <site> run-tests --app ph_faktura --doctype "PH Rechnung"

Deckt ab: Steuerberechnung und Pflichtangaben, Nummer erst beim Stellen und lückenlos (zwei Rechnungen,
Storno per Gutschrift erzeugt keine Lücke), Anzahlungsfluss AB → Anzahlungsrechnung → Zahlung (USt fällig)
→ Schlussrechnung mit Anzahlungsverrechnung je Satz, kein Cancel, OSS DE, Reverse Charge, Kleinbetrag.
"""

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_faktura.testhilfen import beleg, einstellungen_testmodus, position


class TestPHRechnung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_testmodus()

    def rechnung(self, **kw):
        pos = kw.pop("positionen", [position()])
        re = beleg("PH Rechnung", art="Rechnung", datum=nowdate(), leistungsdatum=nowdate(), positionen=pos, **kw)
        re.insert()
        return re

    def test_entwurf_und_steuer(self):
        re = self.rechnung(positionen=[position(menge=2, einzel_netto_cent=100000, rabatt_promille=100), position("Montage", 1, 9000, 2000, art="Leistung")])
        self.assertTrue(re.name.startswith("ENTW-"))
        self.assertEqual(re.status, "Entwurf")
        self.assertEqual(re.netto_cent, 189000)
        self.assertEqual(re.ust_cent, 37800)
        self.assertEqual(re.brutto_cent, 226800)
        self.assertEqual(re.zahlbar_cent, 226800)
        self.assertEqual(len(re.ust_aufteilung), 1)
        self.assertEqual(re.ust_fall, "Steuerpflichtig AT")

    def test_nummer_erst_beim_stellen_und_lueckenlos(self):
        a = self.rechnung()
        b = self.rechnung()
        a.submit()
        b.submit()
        self.assertTrue(a.name.startswith("RE-"))
        self.assertEqual(a.nummer, a.name)
        self.assertEqual(a.status, "Gestellt")
        self.assertEqual(a.zahlungsreferenz, a.name)
        self.assertEqual(int(b.name.rsplit("-", 1)[1]), int(a.name.rsplit("-", 1)[1]) + 1)
        # Storno per Gutschrift: Rechnung bleibt, Nummer bleibt vergeben → keine Lücke
        gu_name = a.gutschrift_erstellen(art="Storno", grund="Test")
        gu = frappe.get_doc("PH Gutschrift", gu_name)
        self.assertEqual(gu.brutto_cent, a.zahlbar_cent)
        gu.submit()
        self.assertTrue(gu.name.startswith("GU-"))
        a.reload()
        self.assertEqual(a.status, "Storniert")
        self.assertEqual(a.storno_durch, gu.name)
        self.assertEqual(a.offen_cent, 0)
        from ph_faktura.rechenwerk.nummern import luecken

        namen = frappe.get_all("PH Rechnung", filters={"docstatus": 1}, pluck="name")
        jahr = int(a.name.split("-")[1])
        self.assertEqual(luecken(namen)[("RE", jahr)]["fehlend"], [])

    def test_kein_cancel_kein_loeschen(self):
        re = self.rechnung()
        re.submit()
        with self.assertRaises(frappe.ValidationError):
            re.cancel()
        with self.assertRaises(frappe.ValidationError):
            frappe.delete_doc("PH Rechnung", re.name)

    def test_pflichtangaben_uid_ab_10000(self):
        re = self.rechnung(positionen=[position(menge=1, einzel_netto_cent=2000000)])  # 24.000 € brutto ohne UID des Empfängers
        with self.assertRaises(frappe.ValidationError):
            re.submit()
        re.uid_empfaenger = "ATU12345678"
        re.save()
        re.submit()
        self.assertEqual(re.status, "Gestellt")

    def test_zahlung_und_status(self):
        re = self.rechnung()
        re.submit()
        from ph_faktura.zahlung import zahlung_auf_rechnung

        zahlung_auf_rechnung(re, 50000, "Bar", nowdate(), zahlung_name=None)
        re.reload()
        self.assertEqual(re.status, "Teilbezahlt")
        self.assertEqual(re.offen_cent, re.zahlbar_cent - 50000)
        zahlung_auf_rechnung(re, re.offen_cent, "Ueberweisung", nowdate())
        re.reload()
        self.assertEqual(re.status, "Bezahlt")
        self.assertEqual(re.offen_cent, 0)

    def test_anzahlungsfluss(self):
        ab = beleg("PH Auftragsbestaetigung", datum=nowdate(), positionen=[position(menge=1, einzel_netto_cent=1000000), position("Kissen", 1, 200000, 1000)],
                   zahlungsplan=[{"art": "Anzahlung", "prozent": 40, "faellig_bei": "Auftrag"}, {"art": "Schlusszahlung", "prozent": 60, "faellig_bei": "Montage"}])
        ab.insert()
        self.assertEqual(ab.brutto_cent, 1420000)
        self.assertEqual(ab.anzahlung_soll_cent, 568000)
        anz_name = frappe.db.get_value("PH Rechnung", {"auftrag": ab.name, "art": "Anzahlungsrechnung"}, "name") or ab.anzahlungsrechnung_erstellen()
        anz = frappe.get_doc("PH Rechnung", anz_name)
        self.assertEqual(anz.brutto_cent, 568000)
        self.assertEqual(len(anz.positionen), 2)
        self.assertEqual(anz.ust_faelligkeit, "nicht faellig")
        anz.submit()
        from ph_faktura.zahlung import zahlung_auf_rechnung

        zahlung_auf_rechnung(anz, 568000, "Ueberweisung", nowdate())
        anz.reload()
        self.assertEqual(anz.status, "Bezahlt")
        self.assertEqual(anz.ust_faelligkeit, "faellig")
        self.assertTrue(anz.uva_monat)
        ab.reload()
        self.assertEqual(ab.anzahlung_ist_cent, 568000)
        ab.lieferung_melden(vollstaendig=1)
        schluss_name = ab.rechnung_erstellen("Schlussrechnung")
        schluss = frappe.get_doc("PH Rechnung", schluss_name)
        self.assertEqual(schluss.brutto_cent, 1420000)
        self.assertEqual(schluss.anzahlung_brutto_cent, 568000)
        self.assertEqual(schluss.anzahlung_ust_cent, 88000)
        self.assertEqual(schluss.zahlbar_cent, 852000)
        self.assertEqual(len(schluss.anzahlungen_verrechnet), 2)
        schluss.submit()
        ab.reload()
        self.assertEqual(ab.status, "Abgerechnet")
        self.assertEqual(ab.bezahlt_cent, 568000)
        self.assertEqual(ab.offen_cent, 852000)

    def test_oss_de_und_reverse_charge(self):
        frappe.db.set_single_value("PH Faktura Einstellungen", "oss_aktiv", 1)
        frappe.db.set_single_value("PH Faktura Einstellungen", "oss_registrierung", "TEST")
        from ph_faktura.einstellungen import cache_leeren

        cache_leeren()
        try:
            de = self.rechnung(land="DE", kunde_name="Kunde Lindau")
            self.assertEqual(de.ust_fall, "OSS")
            self.assertEqual(de.oss_land, "DE")
            self.assertEqual(de.positionen[0].ust_satz_promille, 1900)
            self.assertEqual(de.ust_cent, 19000)
            rc = self.rechnung(land="DE", uid_empfaenger="DE123456789", positionen=[position("Planung", 1, 100000, 2000, art="Planungsleistung")])
            self.assertEqual(rc.ust_fall, "Reverse Charge")
            self.assertEqual(rc.ust_cent, 0)
            self.assertIn("Steuerschuldnerschaft", rc.ust_hinweistext)
            ig = self.rechnung(land="DE", uid_empfaenger="DE123456789")
            self.assertEqual(ig.ust_fall, "Innergemeinschaftlich steuerfrei")
            ch = self.rechnung(land="CH")
            self.assertEqual(ch.ust_fall, "Ausfuhr")
            self.assertEqual(ch.brutto_cent, 100000)
        finally:
            frappe.db.set_single_value("PH Faktura Einstellungen", "oss_aktiv", 0)
            cache_leeren()

    def test_kleinbetragsrechnung(self):
        re = self.rechnung(positionen=[position("Kerze", 2, 1500)])
        self.assertEqual(re.brutto_cent, 3600)
        self.assertEqual(re.kleinbetragsrechnung, 1)
        re.strasse = None
        re.save()
        re.submit()  # Anschrift bei Kleinbetrag nicht Pflicht
        self.assertEqual(re.status, "Gestellt")
