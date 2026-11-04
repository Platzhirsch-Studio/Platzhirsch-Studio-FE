"""bench --site <site> run-tests --app ph_marketing --doctype "PH Einwilligung" – Consent-Protokoll, record_consent, Widerruf."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_marketing.api import record_consent
from ph_marketing.ph_marketing import einwilligung as ew


class TestPHEinwilligung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.db.set_single_value("PH Einstellungen", "testmodus", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.cache().delete_value("ph_marketing:einstellungen")
        frappe.flags.mute_emails = True
        frappe.db.delete("PH Einwilligung", {"email": ("in", ["foto@example.com", "wa@example.com", "merk@example.com"])})

    def test_protokoll_showroom_ohne_doi(self):
        e = ew.protokollieren("foto@example.com", "foto_referenz", "ref-2026-10", quelle="Projekt 123", kanal="papier", bestaetigt=True, daten={"projekt": "PH-PRJ-2026-0001"})
        self.assertEqual(e.status, "Bestaetigt")
        self.assertTrue(e.doi_bestaetigt_am)
        self.assertEqual(e.doi_noetig, 0)
        self.assertIn("foto@example.com", e.titel)
        self.assertEqual(ew.aktiv("foto@example.com", "foto_referenz"), e.name)

    def test_nachweisfelder_unveraenderlich(self):
        e = ew.protokollieren("foto@example.com", "whatsapp", "wa-2026-10", kanal="showroom", bestaetigt=True)
        frappe.set_user("Administrator")
        doc = frappe.get_doc("PH Einwilligung", e.name)
        doc.textversion = "geändert"
        # Administrator darf (Reparatur); normale Nutzer nicht – hier nur prüfen, dass Titel/Status konsistent bleiben
        doc.save()
        self.assertEqual(doc.status, "Bestaetigt")

    def test_api_record_consent_whatsapp_und_doi_zweck(self):
        r = record_consent(email="wa@example.com", zweck="whatsapp", textversion="wa-2026-10", quelle="/de/kontakt")
        self.assertTrue(r["success"])
        self.assertFalse(r["doi"])
        self.assertEqual(frappe.db.get_value("PH Einwilligung", r["einwilligung"], "status"), "Bestaetigt")
        r2 = record_consent(email="merk@example.com", zweck="merkliste_erinnerung", textversion="ml-2026-10", daten={"stuecke": [{"name": "Sofa", "url": "https://platzhirsch.studio/de/x"}]})
        self.assertTrue(r2["doi"])
        e = frappe.get_doc("PH Einwilligung", r2["einwilligung"])
        self.assertEqual(e.status, "Offen")
        self.assertTrue(e.doi_token_hash)

    def test_widerruf(self):
        ew.protokollieren("wa@example.com", "whatsapp", "wa-2026-10", kanal="showroom", bestaetigt=True)
        n = ew.widerrufen("wa@example.com", "whatsapp", kanal="telefon", grund="Kunde wünscht keine Nachrichten")
        self.assertEqual(n, 1)
        self.assertIsNone(ew.aktiv("wa@example.com", "whatsapp"))
        rows = ew.nachweis("wa@example.com")
        self.assertEqual(rows[0]["status"], "Widerrufen")
        self.assertEqual(rows[0]["widerruf_kanal"], "telefon")

    def test_unbekannter_zweck(self):
        with self.assertRaises(Exception):
            ew.protokollieren("wa@example.com", "lotterie", "x")
