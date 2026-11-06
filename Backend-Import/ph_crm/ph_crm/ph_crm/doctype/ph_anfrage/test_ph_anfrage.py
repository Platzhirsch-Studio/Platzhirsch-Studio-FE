"""bench --site <site> run-tests --app ph_crm --doctype "PH Anfrage" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_crm.api import create_anfrage, create_contact


class TestPHAnfrage(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")

    def test_titel_und_status(self):
        doc = frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "vorname": "Anna", "nachname": "Muster", "email": "anna@example.com", "anliegen": "Testanfrage"}).insert()
        self.assertEqual(doc.status, "Neu")
        self.assertEqual(doc.titel, "Kontakt: Anna Muster")
        self.assertTrue(doc.name.startswith("PH-ANF-"))

    def test_kontaktmoeglichkeit_pflicht(self):
        doc = frappe.get_doc({"doctype": "PH Anfrage", "art": "Kontakt", "nachname": "Ohne", "anliegen": "x"})
        with self.assertRaises(frappe.ValidationError):
            doc.insert()

    def test_api_beratung_idempotent(self):
        daten = {
            "bei_meiner_anfrage_geht_es_um": "eine Renovierung",
            "das_projekt_soll_verwirklicht_werden": "in einer Wohnung",
            "bitte_beschreiben_sie_ihr_vorhaben": "Küche und Bad neu.\n\n── Herkunft (automatisch) ──\nKanal: Organisch\nReferenz: test-ref-1",
            "vorname": "Bea",
            "nachname": "Test",
            "email": "bea@example.com",
            "idempotency_key": "test-idem-1",
        }
        a = create_anfrage(**daten)
        b = create_anfrage(**daten)
        self.assertEqual(a["referenz"], b["referenz"])
        doc = frappe.get_doc("PH Anfrage", a["referenz"])
        self.assertEqual(doc.art, "Beratung")
        self.assertEqual(doc.kanal, "Organisch")
        self.assertEqual(doc.referenz_website, "test-ref-1")
        self.assertEqual(doc.projektart, "eine Renovierung")

    def test_api_kontakt_form_kompatibel(self):
        r = create_anfrage(name="Carl Kontakt", email_address="carl@example.com", ihre_nachricht="Bitte um Rückruf wegen Sofa.")
        doc = frappe.get_doc("PH Anfrage", r["referenz"])
        self.assertEqual(doc.art, "Kontakt")
        self.assertEqual(doc.nachname, "Kontakt")
        self.assertEqual(doc.vorname, "Carl")

    def test_api_produkt_mit_merkliste(self):
        r = create_anfrage(anfrage_type="Privat", anfrage_vorname="Dora", anfrage_nachname="Produkt", anfrage_email="dora@example.com", anfrage_phone="+43 660 1234567", anfrage_country="Österreich", anfrage_city="Bregenz", anfrage_address="Hauptstraße 1", produkte=["minotti-lawrence", "flexform-groundpiece"])
        doc = frappe.get_doc("PH Anfrage", r["referenz"])
        self.assertEqual(doc.art, "Produkt")
        self.assertEqual(len(doc.produkte), 2)

    def test_api_planer_konfiguration_sofaplaner(self):
        """Sofaplaner (ph_projekte gesperrt): Konfiguration als Feld + privater JSON-Anhang (utils/planer.py)."""
        plan = {"v": 2, "family": "minotti-connery", "room": {"w": 500, "d": 400}, "items": []}
        r = create_anfrage(bei_meiner_anfrage_geht_es_um="Anderes", das_projekt_soll_verwirklicht_werden="in einer Wohnung", bitte_beschreiben_sie_ihr_vorhaben="Sofa für das Wohnzimmer.",
                           vorname="Sofa", nachname="Planer", email="sofa@example.com", planer="sofaplaner", planer_konfiguration=frappe.as_json(plan),
                           planer_link="https://platzhirsch.studio/de/sofaplaner/teilen?p=abc.def", idempotency_key="test-planer-1")
        doc = frappe.get_doc("PH Anfrage", r["referenz"])
        self.assertEqual(doc.planer, "sofaplaner")
        self.assertEqual(frappe.parse_json(doc.planer_konfiguration)["family"], "minotti-connery")
        self.assertTrue(doc.planer_datei)
        self.assertTrue(frappe.db.exists("File", {"attached_to_doctype": "PH Anfrage", "attached_to_name": doc.name, "is_private": 1}))
        self.assertIn("Sofaplaner", doc.anliegen)
        # Idempotenz: kein zweiter Anhang
        create_anfrage(bei_meiner_anfrage_geht_es_um="Anderes", bitte_beschreiben_sie_ihr_vorhaben="Sofa für das Wohnzimmer.", nachname="Planer", email="sofa@example.com", planer="sofaplaner", planer_konfiguration=plan, idempotency_key="test-planer-1")
        self.assertEqual(frappe.db.count("File", {"attached_to_doctype": "PH Anfrage", "attached_to_name": doc.name}), 1)

    def test_api_planer_dreilaender_und_fehler(self):
        r = create_contact(name="Drei Land", email_address="drei@example.com", ihre_nachricht="Lieferung in die Schweiz?", planer="dreilaender", planer_konfiguration={"land": "CH", "wert": "5000-10000"})
        doc = frappe.get_doc("PH Anfrage", r["referenz"])
        self.assertEqual(doc.planer, "dreilaender")
        self.assertIn("Land CH", doc.anliegen)
        vorher = frappe.db.count("PH Anfrage")
        f = create_anfrage(name="X", email_address="x@example.com", ihre_nachricht="Test", planer="unbekannt", planer_konfiguration={"a": 1})
        self.assertEqual(f["code"], "invalid")
        self.assertEqual(f["field"], "planer")
        self.assertEqual(frappe.db.count("PH Anfrage"), vorher)


class TestPHAnfragePipeline(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.db.delete("PH Anfrage", {"email": ("like", "%@pipeline-test.example")})

    def _a(self, **kw):
        return frappe.get_doc({"doctype": "PH Anfrage", "art": "Beratung", "nachname": "Pipe", "email": "p@pipeline-test.example", "anliegen": "Küche", **kw}).insert()

    def test_wahrscheinlichkeit_und_gewichtet(self):
        a = self._a(wert_cent=2500000)
        self.assertEqual(a.wahrscheinlichkeit_prozent, 10)
        self.assertEqual(a.gewichtet_cent, 250000)
        a.wahrscheinlichkeit_prozent, a.wahrscheinlichkeit_manuell = 80, 1
        a.save()
        self.assertEqual(a.gewichtet_cent, 2000000)
        with self.assertRaises(frappe.ValidationError):
            self._a(wert_cent=-1)

    def test_verloren_mit_grund_und_gewonnen(self):
        a = self._a(wert_cent=100000)
        with self.assertRaises(frappe.ValidationError):
            a.als_verloren("")
        a.als_verloren("Mitbewerber", details="günstiger", mitbewerber="Möbel X")
        a.reload()
        self.assertEqual((a.status, a.verloren_grund, a.mitbewerber, a.gewichtet_cent), ("Verloren", "Mitbewerber", "Möbel X", 0))
        self.assertTrue(a.verloren_am)
        b = self._a(wert_cent=100000)
        b.als_gewonnen(wert_cent=120000)
        b.reload()
        self.assertEqual((b.status, b.wert_cent, b.gewichtet_cent), ("Gewonnen", 120000, 120000))
        self.assertTrue(b.gewonnen_am)

    def test_api_utm_und_duplikat(self):
        text = "Bitte um Beratung.\n\n── Herkunft (automatisch) ──\nKanal: Bezahlt\nQuelle: google / cpc\nKampagne: kuechen-herbst\nKlick-ID: gclid"
        r1 = create_anfrage(name="Ute Utm", email_address="utm@pipeline-test.example", ihre_nachricht=text)
        d1 = frappe.get_doc("PH Anfrage", r1["referenz"])
        self.assertEqual((d1.utm_source, d1.utm_medium, d1.utm_campaign, d1.klick_id), ("google", "cpc", "kuechen-herbst", "gclid"))
        r2 = create_anfrage(name="Ute Utm", email_address="utm@pipeline-test.example", ihre_nachricht="Nochmal")
        self.assertEqual(frappe.db.get_value("PH Anfrage", r2["referenz"], "duplikat_von"), d1.name)

    def test_r7_erste_ab_gewinnt_angebot(self):
        k = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Pipe", "email": "k@pipeline-test.example"}).insert()
        a = self._a(kontakt=k.name, wert_cent=500000)
        frappe.db.set_value("PH Anfrage", a.name, "status", "Angebot")
        k.als_kunde_markieren("AB-TEST")
        self.assertEqual(frappe.db.get_value("PH Anfrage", a.name, "status"), "Gewonnen")
        frappe.delete_doc("PH Anfrage", a.name, force=True)
        frappe.delete_doc("PH Kontakt", k.name, force=True)

    def test_phase_pflichtfelder_und_wahrscheinlichkeit(self):
        a = self._a()
        a.phase = "Angebot"
        with self.assertRaises(frappe.ValidationError):
            a.save()  # Kontakt, Zuständig, Wert, Abschluss fehlen
        k = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Phase", "email": "phase@pipeline-test.example"}).insert()
        a.reload()
        a.update({"phase": "Angebot", "kontakt": k.name, "zugewiesen_an": "Administrator", "wert_cent": 1000000, "erwarteter_abschluss": "2030-01-01"})
        a.save()
        self.assertEqual((a.wahrscheinlichkeit_prozent, a.gewichtet_cent), (60, 600000))
        self.assertTrue(a.phase_seit)
