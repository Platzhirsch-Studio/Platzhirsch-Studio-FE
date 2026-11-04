"""bench --site <site> run-tests --app ph_personal --doctype "PH Stelle" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate

from ph_personal.api import karriere_data


def stelle_anlegen(titel="Testplaner/in (m/w/d)", **extra):
    daten = {
        "doctype": "PH Stelle",
        "titel": titel,
        "kategorie": "Planung",
        "beschaeftigungsart": "Vollzeit",
        "stellenbeschreibung": "Testbeschreibung.",
        "aufgaben_de": [{"responsibility": "Pläne zeichnen"}],
        "anforderungen_de": [{"anforderungen": "CAD-Kenntnisse"}],
        "leistungen_de": [{"benefit": "Arbeitsort Lochau"}],
        "aufgaben_en": [{"responsibility": "Drawing plans"}],
        "titel_en": "Test Planner (m/f/d)",
        "job_description_en": "Test description.",
        "kv_mindest_brutto_cent": 253500,
        "entgelt_zeitraum": "Monat",
        "kollektivvertrag": "KV Handel Angestellte, Beschäftigungsgruppe E, Stufe 1",
        "ueberzahlung": "ja",
        "beispiel": 1,
    }
    daten.update(extra)
    return frappe.get_doc(daten)


class TestPHStelle(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Stelle", {"beispiel": 1})

    def test_slug_titel_status(self):
        doc = stelle_anlegen("Verkäufer/in Einrichtungsberatung (m/w/d)").insert()
        self.assertEqual(doc.name, "verkaeufer-in-einrichtungsberatung-m-w-d")
        self.assertEqual(doc.status, "Entwurf")
        self.assertEqual(doc.entgelt_vollstaendig, 1)
        self.assertIn("€ 2.535,00", doc.entgelt_text)
        self.assertTrue(doc.website_url.endswith("/de/karriere/verkaeufer-in-einrichtungsberatung-m-w-d"))

    def test_aktiv_ohne_entgelt_verboten(self):
        doc = stelle_anlegen(kollektivvertrag="", status="Aktiv")
        with self.assertRaises(frappe.ValidationError):
            doc.insert()
        doc2 = stelle_anlegen("Ohne Überzahlung (m/w/d)", ueberzahlung="", status="Aktiv")
        with self.assertRaises(frappe.ValidationError):
            doc2.insert()

    def test_aktiv_setzt_veroeffentlichung(self):
        doc = stelle_anlegen(status="Aktiv").insert()
        self.assertEqual(doc.veroeffentlicht, frappe.utils.getdate(nowdate()))
        self.assertEqual(doc.gueltig_bis, frappe.utils.getdate(add_days(nowdate(), 60)))

    def test_api_nur_vollstaendige_aktive(self):
        stelle_anlegen("API Aktiv (m/w/d)", status="Aktiv").insert()
        stelle_anlegen("API Entwurf (m/w/d)").insert()
        stelle_anlegen("API Abgelaufen (m/w/d)", status="Aktiv", veroeffentlicht=add_days(nowdate(), -90), gueltig_bis=add_days(nowdate(), -1)).insert()
        # Aktiv, aber Entgelt nachträglich entfernt (db_set umgeht validate) → darf nicht erscheinen
        kaputt = stelle_anlegen("API Kaputt (m/w/d)", status="Aktiv").insert()
        kaputt.db_set({"entgelt_vollstaendig": 0, "kollektivvertrag": ""})
        frappe.cache().delete_value("ph_personal:karriere_data")
        titel = [j["title"] for j in karriere_data()]
        self.assertIn("API Aktiv (m/w/d)", titel)
        self.assertNotIn("API Entwurf (m/w/d)", titel)
        self.assertNotIn("API Abgelaufen (m/w/d)", titel)
        self.assertNotIn("API Kaputt (m/w/d)", titel)

    def test_api_format_wie_karriere_data(self):
        stelle_anlegen("API Format (m/w/d)", status="Aktiv").insert()
        frappe.cache().delete_value("ph_personal:karriere_data")
        job = next(j for j in karriere_data() if j["title"] == "API Format (m/w/d)")
        for feld in ("title", "status", "posted", "type", "positions", "salary", "stellenbeschreibung", "category_de", "responsibilities_de", "requirement_de", "benefits_de", "slug", "entgelt", "job_description_en", "title_en", "job_status_en", "start_en"):
            self.assertIn(feld, job, feld)
        self.assertEqual(job["status"], "Aktiv")
        self.assertEqual(job["type"], "Vollzeit")
        self.assertEqual(job["salary"], 2535)
        self.assertEqual(job["salary_unit"], "MONTH")
        self.assertEqual(job["entgelt"], {"kvMindestBrutto": 2535, "zeitraum": "Monat", "ueberzahlung": True, "kollektivvertrag": "KV Handel Angestellte, Beschäftigungsgruppe E, Stufe 1"})
        self.assertEqual(job["responsibilities_de"], [{"responsibility": "Pläne zeichnen"}])
        self.assertEqual(job["responsibilities_en"], [{"responsibility": "Drawing plans"}])
        self.assertEqual(job["category_en"], "Planning")
        self.assertEqual(job["job_status_fr"], "Temps plein")
        self.assertEqual(job["start_it"], "da subito")
        self.assertNotIn("notiz_intern", job)

    def test_duplizieren_und_besetzen(self):
        doc = stelle_anlegen("Original (m/w/d)", status="Aktiv").insert()
        kopie = frappe.get_doc("PH Stelle", doc.duplizieren())
        self.assertEqual(kopie.status, "Entwurf")
        self.assertEqual(kopie.titel, "Original (m/w/d) (Kopie)")
        self.assertEqual(kopie.name, "original-m-w-d-kopie")
        doc.als_besetzt()
        doc.reload()
        self.assertEqual(doc.status, "Besetzt")
        self.assertTrue(doc.besetzt_am)
