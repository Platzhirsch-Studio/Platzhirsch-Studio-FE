"""bench --site <site> run-tests --app ph_ablage --doctype "PH Ablage Einstellungen" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_ablage import api
from ph_ablage.ph_ablage.doctype.ph_ablage_einstellungen.ph_ablage_einstellungen import einstellungen
from ph_ablage.tests.helfer import einstellungen_fuer_tests


class TestPHAblageEinstellungen(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()

    def tearDown(self):
        frappe.db.rollback()
        frappe.cache().delete_value("ph_ablage:einstellungen")

    def test_standardvorlagen_installiert(self):
        e = einstellungen()
        self.assertIn("PH Projekt", e.vorlagen)
        self.assertEqual(e.vorlagen["PH Projekt"][0]["pfad"], "01 Aufmaß")
        self.assertIn("exe", e.gesperrt)

    def test_grenzen_und_endungen(self):
        d = frappe.get_single("PH Ablage Einstellungen")
        d.presign_sekunden = 999999
        d.erlaubte_endungen = ".PDF, dwg ;docx"
        d.save()
        self.assertEqual(d.presign_sekunden, 3600)
        self.assertEqual(d.erlaubte_endungen, "docx, dwg, pdf")

    def test_ungueltige_vorlage(self):
        d = frappe.get_single("PH Ablage Einstellungen")
        d.append("ordnervorlagen", {"bezug_doctype": "User", "pfad": "x"})
        with self.assertRaises(frappe.ValidationError):
            d.save()

    def test_nicht_konfigurierter_adapter_503(self):
        frappe.db.set_single_value("PH Ablage Einstellungen", "speicher_adapter", "s3")
        frappe.cache().delete_value("ph_ablage:einstellungen")
        from ph_ablage.tests.helfer import testordner

        r = api.upload_start(ordner=testordner(), dateiname="a.pdf", groesse=10)
        self.assertEqual(r["code"], "unavailable")
        self.assertIn("ph_ablage_s3_bucket", r["fehlend"])

    def test_info(self):
        self.assertEqual(api.einstellungen_info()["adapter"], "lokal")
