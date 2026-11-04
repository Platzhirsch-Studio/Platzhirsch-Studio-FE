"""bench --site <site> run-tests --app ph_marketing --doctype "PH Social Beitrag" – Claim-Guard."""

import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHSocialBeitrag(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def _beitrag(self, **k):
        d = {"doctype": "PH Social Beitrag", "titel": "Pool am See", "kanal": "Pinterest", "format": "Pin", "datum_geplant": frappe.utils.nowdate(), "bildquelle_freigabe": "offen", "bild": "/files/test.jpg", "alt_text": "Pool"}
        d.update(k)
        return frappe.get_doc(d).insert()

    def test_anlegen_idee(self):
        b = self._beitrag()
        self.assertEqual(b.status, "Idee")
        self.assertTrue(b.name.startswith("PH-SOC-"))

    def test_freigabe_ohne_bildfreigabe_fehler(self):
        b = self._beitrag()
        with self.assertRaises(frappe.ValidationError):
            b.freigeben()

    def test_freigabe_mit_eigenem_bild(self):
        b = self._beitrag(bildquelle_freigabe="eigen", bild_credit="Platzhirsch")
        b.freigeben()
        b.reload()
        self.assertEqual(b.status, "Freigegeben")
        self.assertTrue(b.freigegeben_am)

    def test_gesperrte_marke(self):
        with self.assertRaises(frappe.ValidationError):
            self._beitrag(bildquelle_freigabe="Hersteller freigegeben", marke_name="Minotti", bild_credit="Minotti")

    def test_herstellerbild_ohne_credit(self):
        with self.assertRaises(frappe.ValidationError):
            self._beitrag(bildquelle_freigabe="Hersteller freigegeben", marke_name="Ezarri")

    def test_pinterest_kein_reel(self):
        with self.assertRaises(frappe.ValidationError):
            self._beitrag(format="Reel")
