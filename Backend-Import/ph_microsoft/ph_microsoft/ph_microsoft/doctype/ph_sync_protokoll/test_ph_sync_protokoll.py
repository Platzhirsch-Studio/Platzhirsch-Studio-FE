"""bench --site <site> run-tests --app ph_microsoft --doctype "PH Sync Protokoll" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_microsoft.ph_microsoft.protokoll import bereinigt, eintrag


class TestPHSyncProtokoll(FrappeTestCase):
    def tearDown(self):
        frappe.db.rollback()

    def test_titel_und_felder(self):
        n = eintrag("Mail", "Abholung", "OK", "3 Mails", anzahl=3)
        p = frappe.get_doc("PH Sync Protokoll", n)
        self.assertEqual(p.titel, "Mail · Abholung · OK")
        self.assertEqual(p.anzahl, 3)

    def test_token_wird_entfernt(self):
        self.assertNotIn("eyJ", bereinigt("Fehler eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.sig Bearer abc"))
        n = eintrag("SSO", "Anmeldung", "Abgelehnt", "Token eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.x")
        self.assertNotIn("eyJ", frappe.db.get_value("PH Sync Protokoll", n, "meldung"))

    def test_wirft_nie(self):
        self.assertIsNone(eintrag("Unbekannt", "x"))
