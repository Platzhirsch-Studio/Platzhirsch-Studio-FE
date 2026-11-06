"""bench --site <site> run-tests --app ph_personal --doctype "PH Urlaubsanspruch" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_personal.ph_personal.doctype.ph_mitarbeiter.test_ph_mitarbeiter import mitarbeiter_anlegen
from ph_personal.ph_personal.urlaubskonto import ansprueche_sicherstellen, ersatzleistung, konto


class TestPHUrlaubsanspruch(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.ma = mitarbeiter_anlegen("Anspruch", eintritt="2025-03-01").name

    def test_anlegen_idempotent(self):
        a = ansprueche_sicherstellen(self.ma, "2026-11-04")
        b = ansprueche_sicherstellen(self.ma, "2026-11-04")
        self.assertEqual(a, b)
        doc = frappe.get_doc("PH Urlaubsanspruch", a[0])
        self.assertEqual(doc.anspruch_tage, 25.0)
        self.assertTrue(doc.verjaehrt_am)

    def test_konto_und_ersatzleistung(self):
        k = konto(self.ma, "2026-11-04")
        self.assertGreaterEqual(k["rest"], 25.0)
        self.assertIn("verjährt", k["hinweis"])
        e = ersatzleistung(self.ma, "2026-11-04")
        self.assertGreater(e["tage"], 0)
