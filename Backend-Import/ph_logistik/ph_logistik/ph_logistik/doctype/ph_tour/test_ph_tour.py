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


class TestPHTourErweitert(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        paketprofile()
        testmodus()

    def test_eta_konflikt_stopp_entfernen_avis(self):
        ls1 = lieferschein(lieferart="Eigenlieferung", liefer_plz="6900")
        ls2 = lieferschein(lieferart="Eigenlieferung", liefer_plz="6911")
        t = frappe.get_doc({"doctype": "PH Tour", "datum": nowdate(), "start_zeit": "08:00", "stopps": [
            {"reihenfolge": 1, "art": "Lieferung", "lieferschein": ls1.name, "fahrt_min": 20, "dauer_min": 60},
            {"reihenfolge": 2, "art": "Lieferung", "lieferschein": ls2.name, "fahrt_min": 30, "dauer_min": 30, "zeitfenster_von": "08:00", "zeitfenster_bis": "09:00"},
        ]})
        t.insert()
        self.assertEqual(str(t.stopps[0].eta)[:5], "08:20")
        self.assertEqual(t.stopps[1].zeitfenster_konflikt, 1)
        r = t.avis_senden("sms")
        self.assertFalse(r[0]["ok"])  # SMS nicht aktiviert → nur Protokoll
        r = t.avis_senden("mail")
        self.assertTrue(all(x["kanal"] == "mail" for x in r))
        t.reload()
        if r and r[0]["ok"]:
            self.assertTrue(t.stopps[0].avis_gesendet_am)
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls2.name, "tour"), t.name)
        t.stopp_entfernen(2)
        t.reload()
        self.assertEqual(len(t.stopps), 1)
        self.assertFalse(frappe.db.get_value("PH Lieferschein", ls2.name, "tour"))
        from ph_logistik.ph_logistik.doctype.ph_tour.ph_tour import plantafel

        p = plantafel(nowdate(), nowdate())
        self.assertTrue(any(x.name == t.name for x in p["touren"]))
        self.assertTrue(any(x.name == ls2.name for x in p["ungeplant"]))

    def test_stopp_status_idempotent(self):
        ls = lieferschein(lieferart="Eigenlieferung")
        t = frappe.get_doc({"doctype": "PH Tour", "datum": nowdate(), "stopps": [{"reihenfolge": 1, "art": "Lieferung", "lieferschein": ls.name}]})
        t.insert()
        a = t.stopp_status(1, "unterwegs", notiz="los", idempotency_key="t-st-1")
        t.reload()
        b = t.stopp_status(1, "unterwegs", notiz="los", idempotency_key="t-st-1")
        t.reload()
        self.assertEqual(a, b)
        self.assertEqual(t.stopps[0].notiz.count("los"), 1)


class TestPHTourLiefertermin(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        paketprofile()
        testmodus()
        if not frappe.db.exists("PH Fahrzeug", "T-TEST1"):
            frappe.get_doc({"doctype": "PH Fahrzeug", "kennzeichen": "T-TEST1", "bezeichnung": "Test-Transporter", "zuladung_kg": 1200}).insert()

    def test_vorschlagen_und_einplanen(self):
        from frappe.utils import add_days

        from ph_logistik.ph_logistik.doctype.ph_tour.ph_tour import liefertermine_vorschlagen, stopp_einplanen

        ab = add_days(nowdate(), 7)
        v = liefertermine_vorschlagen(dauer_min=30, montage_min=120, plz="6900", ab=ab, monteure=2, anzahl=3)
        self.assertTrue(v)
        self.assertTrue(all(x["datum"] >= str(ab) for x in v))
        ls = lieferschein(lieferart="Eigenlieferung")
        r = stopp_einplanen(v[0], lieferschein=ls.name, dauer_min=30, montage_min=120)
        t = frappe.get_doc("PH Tour", r["tour"])
        s = next(x for x in t.stopps if x.lieferschein == ls.name)
        self.assertEqual((s.montage_min, s.dauer_min), (120, 30))
        with self.assertRaises(frappe.ValidationError):
            stopp_einplanen({"tour": t.name, "datum": str(t.datum)}, lieferschein=ls.name)

    def test_verschiebung_meldet_aenderung(self):
        ls = lieferschein(lieferart="Eigenlieferung")
        t = frappe.get_doc({"doctype": "PH Tour", "datum": nowdate(), "stopps": [{"reihenfolge": 1, "art": "Lieferung", "lieferschein": ls.name, "zeitfenster_von": "09:00", "zeitfenster_bis": "11:00"}]})
        t.insert()
        t.stopps[0].db_set("avis_gesendet_am", frappe.utils.now_datetime())
        t.reload()
        t.stopps[0].zeitfenster_von, t.stopps[0].zeitfenster_bis = "13:00", "15:00"
        t.save()
        self.assertTrue(frappe.db.exists("Comment", {"reference_doctype": "PH Tour", "reference_name": t.name, "content": ("like", "%Terminänderung%")}))
