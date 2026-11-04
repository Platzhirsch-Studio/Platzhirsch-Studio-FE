"""bench --site <site> run-tests --app ph_personal --doctype "PH Abwesenheit" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_personal.ph_personal.doctype.ph_abwesenheit.ph_abwesenheit import urlaubskonto
from ph_personal.ph_personal.doctype.ph_mitarbeiter.test_ph_mitarbeiter import mitarbeiter_anlegen


def abwesenheit(ma, von, bis, art="Urlaub", **extra):
    d = {"doctype": "PH Abwesenheit", "mitarbeiter": ma, "von": von, "bis": bis, "art": art}
    d.update(extra)
    return frappe.get_doc(d).insert()


class TestPHAbwesenheit(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.ma = mitarbeiter_anlegen("Urlaub").name

    def test_tage_und_konto(self):
        a = abwesenheit(self.ma, "2026-11-02", "2026-11-08")
        self.assertEqual(a.tage, 5.0)
        self.assertEqual(a.status, "Beantragt")
        self.assertEqual(a.urlaub_anspruch, 25.0)
        self.assertEqual(a.urlaub_rest, 20.0)
        self.assertTrue(a.name.startswith("PH-ABW-"))
        k = urlaubskonto(self.ma, 2026)
        self.assertEqual(k["beantragt"], 5.0)
        self.assertEqual(k["genommen"], 0.0)

    def test_regeln(self):
        with self.assertRaises(frappe.ValidationError):
            abwesenheit(self.ma, "2026-11-08", "2026-11-02")
        with self.assertRaises(frappe.ValidationError):
            abwesenheit(self.ma, "2026-11-07", "2026-11-08")  # Wochenende
        with self.assertRaises(frappe.ValidationError):
            abwesenheit(self.ma, "2026-11-02", "2026-11-03", halbtags=1)
        abwesenheit(self.ma, "2026-12-01", "2026-12-03")
        with self.assertRaises(frappe.ValidationError):
            abwesenheit(self.ma, "2026-12-03", "2026-12-04")  # Überschneidung

    def test_genehmigung_und_storno(self):
        a = abwesenheit(self.ma, "2027-01-04", "2027-01-05")
        a.status = "Genehmigt"
        a.save()
        self.assertEqual(a.genehmigt_von, "Administrator")
        self.assertTrue(a.genehmigt_am)
        self.assertEqual(urlaubskonto(self.ma, 2027)["genommen"], 2.0)
        a.stornieren()
        a.reload()
        self.assertEqual(a.status, "Storniert")
        self.assertEqual(urlaubskonto(self.ma, 2027)["genommen"], 0.0)
        # nach Storno darf derselbe Zeitraum neu beantragt werden
        abwesenheit(self.ma, "2027-01-04", "2027-01-05")

    def test_ablehnung_braucht_grund(self):
        a = abwesenheit(self.ma, "2027-02-01", "2027-02-01")
        a.status = "Abgelehnt"
        with self.assertRaises(frappe.ValidationError):
            a.save()
