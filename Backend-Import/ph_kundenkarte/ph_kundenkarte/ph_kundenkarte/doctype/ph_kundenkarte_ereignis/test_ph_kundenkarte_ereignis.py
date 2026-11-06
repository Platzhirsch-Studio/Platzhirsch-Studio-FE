"""bench --site <site> run-tests --app ph_kundenkarte --doctype "PH Kundenkarte Ereignis" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_kundenkarte.ph_kundenkarte.doctype.ph_kundenkarte_ereignis.ph_kundenkarte_ereignis import protokoll
from ph_kundenkarte.tests.helfer import aufraeumen, einstellungen_fuer_tests, testkarte, testkontakt


class TestPHKundenkarteEreignis(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()
        aufraeumen("PH Kundenkarte", {"kontakt": testkontakt()})

    def test_protokoll_und_titel(self):
        k = testkarte()
        name = protokoll(k.name, "Stufenwechsel", alt="Platzhirsch", neu="Platzhirsch Plus", jahresumsatz_cent=1_000_000, automatisch=True)
        e = frappe.get_doc("PH Kundenkarte Ereignis", name)
        self.assertIn("Platzhirsch → Platzhirsch Plus", e.titel)
        self.assertEqual(e.automatisch, 1)
        self.assertTrue(e.zeitpunkt)

    def test_protokoll_wirft_nie(self):
        self.assertIsNone(protokoll("KK-GIBTSNICHT", "Hinweis"))

    def tearDown(self):
        frappe.db.rollback()
