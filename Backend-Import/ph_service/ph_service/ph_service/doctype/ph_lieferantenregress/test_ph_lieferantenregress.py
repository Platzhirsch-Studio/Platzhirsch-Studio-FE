"""bench --site <site> run-tests --app ph_service --doctype "PH Lieferantenregress" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_months, getdate, nowdate

from ph_service.ph_service import fristen as fr
from ph_service.tests.helfer import einstellungen_fuer_tests, testfall


class TestPHLieferantenregress(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()
        lieferant = frappe.get_all("PH Lieferant", limit=1, pluck="name") if frappe.db.exists("DocType", "PH Lieferant") else []
        if not lieferant:
            self.skipTest("Kein PH Lieferant (ph_sortiment) vorhanden")
        self.lieferant = lieferant[0]

    def _regress(self, **werte):
        fall = testfall(lieferant=self.lieferant, fehlercode="OBF-03", entscheidung="Austausch", entscheidung_begruendung="Lackfehler", abschlussbericht="Front getauscht")
        fall.append("kosten", {"datum": nowdate(), "art": "Ersatzteil", "betrag_cent": 30000, "regressfaehig": 1})
        fall.append("kosten", {"datum": nowdate(), "art": "Intern Arbeitszeit", "betrag_cent": 5000, "regressfaehig": 1})
        fall.save()
        fall._status_setzen("Erledigt")
        reg = frappe.get_doc({"doctype": "PH Lieferantenregress", "servicefall": fall.name, "lieferant": self.lieferant, "betrag_gefordert_cent": 35000, "beschreibung": "Lackfehler Front", **werte}).insert()
        return fall, reg

    def test_frist_aus_erledigung(self):
        fall, reg = self._regress()
        self.assertEqual(getdate(reg.frist_bis), fr.monate_dazu(getdate(fall.erledigt_am), 2))
        self.assertIn("möglich", reg.frist_hinweis)
        fall.reload()
        self.assertEqual(fall.regress_status, "Offen")
        self.assertEqual(fall.regress_gefordert_cent, 35000)

    def test_status_regress_kosten(self):
        fall, reg = self._regress()
        reg.status = "Gemeldet"
        reg.save()
        self.assertTrue(reg.gemeldet_am)
        reg.status = "Anerkannt"
        with self.assertRaises(frappe.ValidationError):
            reg.save()  # ohne anerkannten Betrag
        reg.reload()
        reg.status = "Anerkannt"
        reg.betrag_anerkannt_cent = 30000
        reg.save()
        reg.status = "Verrechnet"
        reg.gutschrift_nummer = "GS-TEST-1"
        reg.save()
        self.assertEqual(reg.betrag_erhalten_cent, 30000)
        self.assertTrue(reg.verrechnet_am)
        fall.reload()
        self.assertEqual(fall.regress_status, "Verrechnet")
        self.assertEqual(fall.regress_erhalten_cent, 30000)
        self.assertEqual(fall.netto_kosten_cent, 35000 - 30000)

    def test_abgelehnt_zaehlt_nicht(self):
        fall, reg = self._regress()
        reg.status = "Abgelehnt"
        reg.save()
        self.assertEqual(reg.ablehnungsgrund, "Sonstiges")
        fall.reload()
        self.assertEqual(fall.regress_gefordert_cent, 0)
        self.assertEqual(fall.regress_status, "Abgelehnt")

    def test_negative_forderung(self):
        fall, reg = self._regress()
        reg.betrag_gefordert_cent = -1
        with self.assertRaises(frappe.ValidationError):
            reg.save()

    def tearDown(self):
        frappe.db.rollback()
