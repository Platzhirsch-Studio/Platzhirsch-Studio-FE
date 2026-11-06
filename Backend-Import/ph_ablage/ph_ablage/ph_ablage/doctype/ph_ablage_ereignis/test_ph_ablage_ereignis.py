"""bench --site <site> run-tests --app ph_ablage --doctype "PH Ablage Ereignis" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_ablage.ph_ablage.doctype.ph_ablage_ereignis.ph_ablage_ereignis import protokoll


class TestPHAblageEreignis(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def tearDown(self):
        frappe.db.rollback()

    def test_protokoll_und_titel(self):
        n = protokoll("Download", datei="PH-DAT-TEST-1", version=2, hinweis="Vorschau")
        e = frappe.get_doc("PH Ablage Ereignis", n)
        self.assertEqual(e.titel, "Download: PH-DAT-TEST-1")
        self.assertEqual(e.benutzer, "Administrator")

    def test_protokoll_wirft_nie(self):
        self.assertIsNone(protokoll("Gibt es nicht"))
