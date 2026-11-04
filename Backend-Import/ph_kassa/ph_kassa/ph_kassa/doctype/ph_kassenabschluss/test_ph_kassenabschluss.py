"""Site-Tests: bench --site <site> run-tests --app ph_kassa --doctype "PH Kassenabschluss"

Setzt PH Kasse (WP10a) voraus; ohne die DocType werden die Tests übersprungen.
"""

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_kassa.ph_kassa.doctype.ph_kassenabschluss.ph_kassenabschluss import ist_gesperrt, oeffnen_oder_holen

KASSE = "TEST-KASSA-B"


def kasse_anlegen():
    if not frappe.db.exists("DocType", "PH Kasse"):
        return None
    if not frappe.db.exists("PH Kasse", KASSE):
        frappe.get_doc({"doctype": "PH Kasse", "kassen_id": KASSE, "bezeichnung": "Testkasse WP10b", "aes_schluessel_name": f"ph_kassa_aes_key_{KASSE}"}).insert(ignore_permissions=True)
    return KASSE


class TestPHKassenabschluss(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.kasse = kasse_anlegen()
        if not self.kasse:
            self.skipTest("PH Kasse (WP10a) nicht installiert")
        for n in frappe.get_all("PH Kassenabschluss", filters={"kasse": self.kasse}, pluck="name"):
            frappe.db.set_value("PH Kassenabschluss", n, "status", "Offen")
            frappe.delete_doc("PH Kassenabschluss", n, force=True)

    def test_oeffnen_zaehlen_abschliessen_sperrt(self):
        a = oeffnen_oder_holen(self.kasse, nowdate())
        self.assertEqual(a.status, "Offen")
        self.assertEqual(len(a.zaehlprotokoll), 15)
        self.assertFalse(ist_gesperrt(self.kasse, nowdate()))
        a.zaehlen(zaehlprotokoll=[{"stueckelung_cent": 5000, "anzahl": 2}, {"stueckelung_cent": 100, "anzahl": 3}], bargeld_anfang_cent=10000)
        a.reload()
        self.assertEqual(a.status, "Gezaehlt")
        self.assertEqual(a.bargeld_ist_cent, 10300)
        self.assertEqual(a.differenz_cent, 10300 - a.bargeld_soll_cent)
        frappe.db.set_single_value("PH Kassa Einstellungen", "abschluss_unterschrift_pflicht", 0)
        frappe.db.set_single_value("PH Kassa Einstellungen", "abschluss_nullbeleg_automatisch", 0)
        frappe.cache().delete_value("ph_kassa:einstellungen")
        a.abschliessen(differenz_grund="Test")
        a.reload()
        self.assertEqual(a.status, "Abgeschlossen")
        self.assertTrue(ist_gesperrt(self.kasse, nowdate()))
        if a.differenz_cent:
            self.assertTrue(a.differenz_buchung)
            self.assertEqual(frappe.db.get_value("PH Kassenbuch", a.differenz_buchung, "art"), "Differenz")
        a.oeffnen("Test-Korrektur")
        self.assertFalse(ist_gesperrt(self.kasse, nowdate()))

    def test_zweiter_offener_abschluss_verboten(self):
        oeffnen_oder_holen(self.kasse, nowdate())
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kassenabschluss", "kasse": self.kasse, "datum": nowdate()}).insert()
