"""bench --site <site> run-tests --app ph_ablage --doctype "PH Ordner" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_ablage import api
from ph_ablage.ph_ablage import dienste
from ph_ablage.tests.helfer import aufraeumen, einstellungen_fuer_tests, hochladen, testordner


class TestPHOrdner(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()
        self.wurzel = testordner()

    def tearDown(self):
        aufraeumen()
        frappe.db.rollback()

    def test_modus_vererbt_strengsten(self):
        a = testordner("Leitungsordner", eltern=self.wurzel, rechte_modus="leitung")
        b = testordner("Unterordner", eltern=a, rechte_modus="intern")
        self.assertEqual(frappe.db.get_value("PH Ordner", b, "effektiver_modus"), "leitung")
        self.assertIn("Leitungsordner / Unterordner", frappe.db.get_value("PH Ordner", b, "pfad"))

    def test_gleicher_name_verboten(self):
        testordner("Doppelt", eltern=self.wurzel)
        with self.assertRaises(frappe.DuplicateEntryError):
            frappe.get_doc({"doctype": "PH Ordner", "titel": "Doppelt", "parent_ph_ordner": self.wurzel}).insert()

    def test_api_anlegen_idempotent_und_baum(self):
        r = api.ordner_anlegen(titel="Über API", eltern=self.wurzel, idempotency_key="test-ordner-1")
        r2 = api.ordner_anlegen(titel="Über API", eltern=self.wurzel, idempotency_key="test-ordner-1")
        self.assertEqual(r["ordner"], r2["ordner"])
        baum = api.ordner_baum(ordner=self.wurzel)
        self.assertIn("Über API", [k["titel"] for k in baum["wurzeln"][0]["kinder"]])

    def test_pflichtfeld(self):
        self.assertEqual(api.ordner_anlegen(titel="", eltern=self.wurzel)["code"], "invalid")

    def test_verschieben_zieht_dateien_nach(self):
        a = testordner("Team", eltern=self.wurzel, rechte_modus="team")
        b = testordner("Frei", eltern=self.wurzel)
        erg = hochladen(b, "x.txt", b"x")
        self.assertEqual(frappe.db.get_value("PH Datei", erg["datei"], "effektiver_modus"), "intern")
        api.ordner_verschieben(ordner=b, eltern=a)
        self.assertEqual(frappe.db.get_value("PH Datei", erg["datei"], "effektiver_modus"), "team")

    def test_loeschen_nur_leer(self):
        a = testordner("Voll", eltern=self.wurzel)
        hochladen(a, "y.txt", b"y")
        self.assertEqual(api.ordner_loeschen(ordner=a)["code"], "conflict")

    def test_projektvorlage(self):
        if not frappe.db.exists("DocType", "PH Projekt"):
            self.skipTest("ph_projekte nicht installiert")
        projekt = frappe.get_all("PH Projekt", pluck="name", limit=1)
        if not projekt:
            self.skipTest("kein PH Projekt vorhanden")
        w = dienste.wurzel_fuer_bezug("PH Projekt", projekt[0])
        titel = frappe.get_all("PH Ordner", filters={"parent_ph_ordner": w}, pluck="titel")
        self.assertIn("01 Aufmaß", titel)
        self.assertIn("08 Service", titel)
        self.assertEqual(dienste.ordner_aus_vorlage(w, "PH Projekt"), 0)  # idempotent
