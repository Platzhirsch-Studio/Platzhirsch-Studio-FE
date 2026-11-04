"""bench --site <site> run-tests --app ph_logistik --doctype "PH Sendung" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.tests.helfer_test import lieferschein, paketprofile, testmodus


class TestPHSendung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        paketprofile()
        testmodus()

    def _gebucht(self):
        ls = lieferschein()
        ls.scan("4001234567890")
        ls.scan("4001234567890")
        ls.pakete_vorschlagen()
        ls.reload()
        return ls, frappe.get_doc("PH Sendung", ls.etikett_erzeugen(ls.tarife()["empfehlung"]))

    def test_validierung(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Sendung", "richtung": "Ausgang", "dienstleister": "LetMeShip"}).insert()

    def test_manuelle_sendung_mit_tracking(self):
        ls = lieferschein()
        s = frappe.get_doc({"doctype": "PH Sendung", "richtung": "Ausgang", "dienstleister": "Manuell", "lieferschein": ls.name, "carrier": "DPD", "tracking_nr": "01234567890", "empf_ort": "Bregenz"}).insert()
        self.assertEqual(s.status, "Etikett")
        self.assertIn("dpd", s.tracking_url)
        self.assertEqual(s.env, "mock")

    def test_retourenlabel_adressen_getauscht(self):
        ls, s = self._gebucht()
        r = frappe.get_doc("PH Sendung", s.retourenlabel())
        self.assertEqual(r.richtung, "Retoure")
        self.assertEqual(r.status, "Etikett")
        self.assertEqual(r.empf_ort, "Lochau")  # Empfänger = wir
        self.assertEqual(r.lieferschein, ls.name)
        self.assertTrue(r.etikett)

    def test_storno_nach_zustellung_verboten(self):
        _ls, s = self._gebucht()
        s.manuell_zugestellt()
        s.reload()
        self.assertEqual(s.status, "Zugestellt")
        with self.assertRaises(frappe.ValidationError):
            s.stornieren("x")

    def test_problem_und_zustellung(self):
        _ls, s = self._gebucht()
        s.problem_melden("Adresse falsch")
        s.reload()
        self.assertEqual(s.status, "Problem")
        self.assertEqual(s.tracking_verlauf[-1].code, "MANUELL")
        s.manuell_zugestellt()
        s.reload()
        self.assertEqual(s.status, "Zugestellt")

    def test_scheduler_tracking(self):
        from ph_logistik.ph_logistik.tasks import tracking_aktualisieren

        _ls, s = self._gebucht()
        n = tracking_aktualisieren()
        self.assertGreaterEqual(n, 1)
        self.assertIn(frappe.db.get_value("PH Sendung", s.name, "status"), ("Etikett", "Unterwegs", "Zugestellt"))
