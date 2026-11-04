"""bench --site <site> run-tests --app ph_logistik --doctype "PH Tour" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_logistik.ph_logistik.doctype.ph_tour.ph_tour import maps_link
from ph_logistik.tests.helfer_test import lieferschein, paketprofile, testmodus


class TestPHTour(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        paketprofile()
        testmodus()
        if not frappe.db.exists("PH Fahrzeug", "T-TEST1"):
            frappe.get_doc({"doctype": "PH Fahrzeug", "kennzeichen": "T-TEST1", "bezeichnung": "Test-Transporter"}).insert()

    def _gepackt(self, plz="6900"):
        ls = lieferschein(lieferart="Eigenlieferung", liefer_plz=plz)
        ls.scan("4001234567890")
        ls.scan("4001234567890")
        ls.als_gepackt()
        ls.reload()
        return ls

    def test_maps_link(self):
        self.assertIn("destination=", maps_link(["A 1, 6911 Lochau"]))
        link = maps_link(["Start", "Mitte", "Ziel"])
        self.assertIn("origin=Start", link)
        self.assertIn("waypoints=Mitte", link)
        self.assertIsNone(maps_link([]))

    def test_fahrzeug_erzeugt_lagerort(self):
        self.assertTrue(frappe.db.exists("PH Lagerort", "Fahrzeug T-TEST1"))
        self.assertEqual(frappe.db.get_value("PH Lagerort", "Fahrzeug T-TEST1", "art"), "Fahrzeug")

    def test_tour_ablauf(self):
        ls1, ls2 = self._gepackt("6900"), self._gepackt("6850")
        t = frappe.get_doc({"doctype": "PH Tour", "datum": nowdate(), "region": "Rheintal", "fahrzeug": "T-TEST1", "fahrer": "Administrator"}).insert()
        self.assertEqual(t.status, "Geplant")
        self.assertEqual(t.stopps_hinzufuegen([ls1.name, ls2.name]), 2)
        t.reload()
        self.assertEqual(t.anzahl_stopps, 2)
        self.assertEqual(t.stopps[0].kunde_name, "Anna Muster")  # aus Lieferschein gefüllt
        self.assertTrue(t.stopps[0].navigation_url.startswith("https://www.google.com/maps"))
        self.assertIn("waypoints", t.route_url)
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls1.name, "tour"), t.name)
        t.reihenfolge_optimieren()
        t.reload()
        self.assertEqual(t.stopps[0].lieferschein, ls2.name)  # PLZ 6850 vor 6900
        t.freigeben()
        t.starten(km_start=1000)
        t.reload()
        self.assertEqual(t.status, "Unterwegs")
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls1.name, "status"), "Uebergeben")
        with self.assertRaises(frappe.ValidationError):
            t.abschliessen()  # offene Stopps
        r = t.stopp_status(t.stopps[0].name, "erledigt", unterschrift="data:image/png;base64,iVBORw0KGgo=", unterschrift_name="Anna Muster")
        self.assertEqual(r["erledigt"], 1)
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls2.name, "status"), "Zugestellt")
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls2.name, "empfaenger_name"), "Anna Muster")
        t.reload()
        t.stopp_status("2", "nicht angetroffen", notiz="Niemand da")
        t.reload()
        self.assertEqual(t.foto_hinzufuegen(1, "/private/files/test.jpg", "nachher"), 1)
        t.reload()
        t.abschliessen(km_ende=1042)
        t.reload()
        self.assertEqual(t.status, "Abgeschlossen")
        self.assertEqual(t.anzahl_erledigt, 2)

    def test_freigabe_ohne_fahrer(self):
        t = frappe.get_doc({"doctype": "PH Tour", "datum": nowdate(), "stopps": [{"reihenfolge": 1, "art": "Montage", "kunde_name": "X", "plz": "6900", "ort": "Bregenz"}]}).insert()
        with self.assertRaises(frappe.ValidationError):
            t.freigeben()
