"""bench --site <site> run-tests --app ph_logistik --module ph_logistik.ph_logistik.doctype.ph_sendung.test_retourenlabel

Retourenetikett zu Lieferschein und Warenrücknahme (Integration Runde 3), Mock ohne Netz."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.tests.helfer_test import lieferschein, paketprofile, testmodus


class TestRetourenlabel(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        paketprofile()
        testmodus()

    def _zugestellt(self):
        ls = lieferschein()
        ls.scan("4001234567890")
        ls.scan("4001234567890")
        ls.pakete_vorschlagen()
        ls.reload()
        ls.etikett_erzeugen(ls.tarife()["empfehlung"])
        ls.reload()
        if ls.status == "Gepackt":
            ls.uebergeben()
            ls.reload()
        return ls

    def test_retourenetikett_lieferschein_idempotent(self):
        ls = self._zugestellt()
        n1 = ls.retourenetikett()
        r = frappe.get_doc("PH Sendung", n1)
        self.assertEqual((r.richtung, r.status, r.empf_ort, r.lieferschein), ("Retoure", "Etikett", "Lochau", ls.name))
        self.assertTrue(r.etikett)
        self.assertEqual(ls.retourenetikett(), n1)

    def test_retourenetikett_vor_uebergabe_verboten(self):
        ls = lieferschein()
        with self.assertRaises(frappe.ValidationError):
            ls.retourenetikett()

    def test_warenruecknahme_retourenetikett(self):
        from ph_logistik.ph_logistik.doctype.ph_warenruecknahme.ph_warenruecknahme import aus_lieferschein

        ls = self._zugestellt()
        wr = frappe.get_doc("PH Warenruecknahme", aus_lieferschein(ls.name))
        name = wr.retourenetikett()
        wr.reload()
        self.assertEqual(wr.retourenlabel, name)
        self.assertEqual(frappe.db.get_value("PH Sendung", name, "warenruecknahme"), wr.name)
