"""bench --site <site> run-tests --app ph_crm --doctype "PH Beratungsvorlage" """

import frappe
from frappe.tests.utils import FrappeTestCase


class TestPHBeratungsvorlage(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Beratungsvorlage", {"vorlage_name": ("like", "Test %")})

    def _vorlage(self, **kw):
        return frappe.get_doc({"doctype": "PH Beratungsvorlage", "vorlage_name": "Test Küche", "fragen": [{"raum": "Kueche", "frage": "Wer kocht wie oft?", "pflicht": 1}, {"raum": "Kueche", "frage": "Geräte-Marken?"}], **kw}).insert()

    def test_anlegen_raumtyp(self):
        v = self._vorlage()
        self.assertEqual(v.name, "Test Küche")
        self.assertEqual(v.raumtyp, "Kueche")

    def test_doppelte_frage(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Beratungsvorlage", "vorlage_name": "Test Doppelt", "fragen": [{"raum": "Bad", "frage": "Dusche?"}, {"raum": "Bad", "frage": "dusche?"}]}).insert()

    def test_vorlage_ins_gespraech_und_pflicht(self):
        v = self._vorlage()
        k = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "Vorlage", "email": "vorlage@kontakt-test.example"}).insert()
        g = frappe.get_doc({"doctype": "PH Beratungsgespraech", "kontakt": k.name, "berater": "Administrator"}).insert()
        self.assertEqual(g.vorlage_anwenden(v.name), 2)
        g.reload()
        self.assertEqual(len(g.fragen), 2)
        self.assertEqual(g.raeume[0].raum, "Kueche")
        self.assertEqual(g.vorlage_anwenden(v.name), 0)  # idempotent
        g.status = "Abgeschlossen"
        g.zusammenfassung = "ok"
        with self.assertRaises(frappe.ValidationError):
            g.save()  # Pflichtfrage ohne Antwort
        g.reload()
        g.fragen[0].antwort = "täglich, zu zweit"
        g.status = "Abgeschlossen"
        g.zusammenfassung = "ok"
        g.save()
        self.assertEqual(g.status, "Abgeschlossen")
        frappe.delete_doc("PH Beratungsgespraech", g.name, force=True)
        frappe.delete_doc("PH Kontakt", k.name, force=True)
