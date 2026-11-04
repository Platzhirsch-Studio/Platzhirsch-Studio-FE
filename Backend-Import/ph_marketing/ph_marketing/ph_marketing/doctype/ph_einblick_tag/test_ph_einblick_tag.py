"""bench --site <site> run-tests --app ph_marketing --doctype "PH Einblick Tag" – Upsert über Datum und Teil."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_marketing.ph_marketing import einblicke


class TestPHEinblickTag(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        if frappe.db.exists("PH Einblick Tag", "2026-11-01"):
            frappe.delete_doc("PH Einblick Tag", "2026-11-01", force=True)

    def test_upsert_in_teilen(self):
        r1 = einblicke.tag_speichern("2026-11-01", schema="3", meta={"besuche": 120}, teil="seiten", seiten=[{"pfad": "/de", "besuche": 80}, {"pfad": "/de/kuechen", "besuche": 40}])
        self.assertEqual(r1["status"], "Teilweise")
        r2 = einblicke.tag_speichern("2026-11-01", teil="heatmaps", heatmaps=[{"pfad": "/de", "zellen": []}])
        self.assertIn("heatmaps", r2["teile"])
        self.assertIn("seiten", r2["teile"])
        self.assertEqual(frappe.db.count("PH Einblick Tag", {"datum": "2026-11-01"}), 1)
        doc = frappe.get_doc("PH Einblick Tag", "2026-11-01")
        self.assertEqual(doc.besuche, 120)
        top = einblicke.top_seiten("2026-11-01", "2026-11-01")
        self.assertEqual(top[0]["pfad"], "/de")

    def test_ganzer_tag_vollstaendig(self):
        r = einblicke.tag_speichern("2026-11-01", schema="3", meta={}, seiten=[], heatmaps=[], pfade=[], signale=[], planer=[])
        self.assertEqual(r["status"], "Vollstaendig")

    def test_ungueltiges_datum(self):
        from ph_core.api import ApiFehler

        with self.assertRaises(ApiFehler):
            einblicke.tag_speichern("kein-datum")
