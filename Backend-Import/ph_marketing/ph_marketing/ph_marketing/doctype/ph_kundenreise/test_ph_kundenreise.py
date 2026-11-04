"""bench --site <site> run-tests --app ph_marketing --doctype "PH Kundenreise" – Werbe-Reise ohne Grundlage → kein Aktivieren/kein Versand."""

import json

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_marketing.ph_marketing import engine
from ph_marketing import install


class TestPHKundenreise(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "testmodus", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.cache().delete_value("ph_marketing:einstellungen")
        frappe.flags.mute_emails = True
        install.vorlagen_anlegen()
        install.event_anlegen()
        install.reisen_anlegen()

    def test_generator_reisen_vorhanden_und_inaktiv(self):
        for r in install.REISEN:
            doc = frappe.get_doc("PH Kundenreise", r["reise_id"])
            self.assertEqual(doc.aktiv, 0)
            self.assertEqual(doc.status, "Entwurf")

    def test_werbung_ohne_grundlage_nicht_aktivierbar(self):
        if frappe.db.exists("PH Kundenreise", "test_werbung"):
            frappe.delete_doc("PH Kundenreise", "test_werbung", force=True)
        d = frappe.get_doc({"doctype": "PH Kundenreise", "reise_id": "test_werbung", "titel": "Werbung ohne Grundlage", "vorlage": "reise_outdoor", "werbung": 1, "aktiv": 1, "trigger": [{"ausloeser_typ": "jaehrlich", "tag_monat": "03-10"}]})
        with self.assertRaises(frappe.ValidationError):
            d.insert()

    def test_darf_senden_ohne_einwilligung(self):
        reise = frappe.get_doc("PH Kundenreise", "merkliste")
        ok, grundlage, grund = engine.darf_senden(reise, {"email": "niemand@example.com"})
        self.assertFalse(ok)
        self.assertIn(grund, ("fusszeilen_nicht_freigegeben", "keine_grundlage"))

    def test_service_reise_darf_senden(self):
        reise = frappe.get_doc("PH Kundenreise", "danke")
        ok, grundlage, _ = engine.darf_senden(reise, {"email": "kunde@example.com"})
        self.assertTrue(ok)
        self.assertEqual(grundlage, "V")

    def test_b_ohne_widerspruchshinweis(self):
        frappe.db.set_single_value("PH Marketing Einstellungen", "kanzlei_fusszeilen_freigegeben", 1)
        frappe.db.set_single_value("PH Marketing Einstellungen", "ecg_abgleich_gueltig_bis", frappe.utils.add_days(frappe.utils.nowdate(), 30))
        frappe.cache().delete_value("ph_marketing:einstellungen")
        reise = frappe.get_doc("PH Kundenreise", "jahrestag")
        ok, _, grund = engine.darf_senden(reise, {"email": "k@example.com", "hat_auftrag": True})
        self.assertFalse(ok)
        self.assertEqual(grund, "kein_widerspruchshinweis")
        ok2, g2, _ = engine.darf_senden(reise, {"email": "k@example.com", "hat_auftrag": True, "widerspruchshinweis_am": "2026-01-01", "widerspruchshinweis_quelle": "AB"})
        self.assertTrue(ok2)
        self.assertEqual(g2, "B")
        frappe.db.set_single_value("PH Marketing Einstellungen", "kanzlei_fusszeilen_freigegeben", 0)
        frappe.cache().delete_value("ph_marketing:einstellungen")

    def test_planen_ohne_automatik_schreibt_nichts(self):
        from ph_marketing.ph_marketing import tasks

        vorher = frappe.db.count("PH Reise Versand")
        tasks.reisen_planen()
        self.assertEqual(frappe.db.count("PH Reise Versand"), vorher)

    def test_vorschau_rendert(self):
        reise = frappe.get_doc("PH Kundenreise", "danke")
        v = reise.vorschau()
        self.assertIn("Willkommen", v["betreff"])
        self.assertIn("Platzhirsch", v["html"])
        self.assertEqual(v["grundlage"], "V")
        json.dumps(v)
