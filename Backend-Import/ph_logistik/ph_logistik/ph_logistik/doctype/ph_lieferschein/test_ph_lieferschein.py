"""bench --site <site> run-tests --app ph_logistik --doctype "PH Lieferschein" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.tests.helfer_test import lieferschein, paketprofile, testmodus


class TestPHLieferschein(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        paketprofile()
        testmodus()

    def test_anlegen_titel_status_versicherung(self):
        ls = lieferschein()
        self.assertEqual(ls.status, "Entwurf")
        self.assertTrue(ls.name.startswith("LS-"))
        self.assertIn("Versand Anna Muster", ls.titel)
        self.assertEqual(ls.warenwert_cent, 11800)
        self.assertEqual(ls.versichern, 1)  # Glas → versichert (K17)
        self.assertEqual(ls.versicherungswert_cent, 11800)
        self.assertEqual(ls.zerbrechlich, 1)

    def test_adresse_pflicht_bei_versand(self):
        with self.assertRaises(frappe.ValidationError):
            lieferschein(liefer_plz=None, liefer_ort=None)

    def test_scan_und_packen(self):
        ls = lieferschein()
        r = ls.scan("4001234567890")
        self.assertEqual(r["menge_gepackt"], 1)
        self.assertFalse(r["alles_gepackt"])
        r = ls.scan("https://platzhirsch.studio/de/shop/riedel-veritas")
        self.assertTrue(r["alles_gepackt"])
        self.assertEqual(ls.scan("nix")["treffer"], None)
        ls.pakete_vorschlagen()
        ls.reload()
        self.assertEqual(len(ls.pakete), 1)  # 2 Gläser passen in glas-2er-set
        self.assertGreater(ls.gesamtgewicht_g, 0)
        ls.als_gepackt()
        ls.reload()
        self.assertEqual(ls.status, "Gepackt")
        self.assertEqual(ls.workflow_state, "PH Gepackt")
        self.assertTrue(ls.gepackt_am)

    def test_gepackt_ohne_alle_positionen_verboten(self):
        ls = lieferschein()
        with self.assertRaises(frappe.ValidationError):
            ls.als_gepackt()

    def test_etikett_mock_sendung_und_anhang(self):
        ls = lieferschein()
        ls.scan("4001234567890")
        ls.scan("4001234567890")
        ls.pakete_vorschlagen()
        ls.reload()
        t = ls.tarife()
        self.assertEqual(t["env"], "mock")
        self.assertTrue(t["empfehlung"])
        self.assertTrue(all(x["cent"] > 500 for x in t["tarife"]))  # Versicherungszuschlag im Mock
        name = ls.etikett_erzeugen(t["empfehlung"])
        s = frappe.get_doc("PH Sendung", name)
        self.assertEqual(s.status, "Etikett")
        self.assertTrue(s.shipment_id.startswith("mock-shp-"))
        self.assertTrue(s.tracking_nr.startswith("MOCK"))
        self.assertTrue(s.etikett.endswith(".pdf"))
        self.assertTrue(frappe.db.exists("File", {"attached_to_doctype": "PH Sendung", "attached_to_name": s.name, "is_private": 1}))
        self.assertEqual(s.versicherung, 1)
        self.assertEqual(s.versicherungswert_cent, 11800)
        ls.reload()
        self.assertEqual(ls.status, "Gepackt")
        self.assertEqual(ls.pakete[0].sendung, s.name)
        # zweite aktive Sendung verboten
        with self.assertRaises(frappe.ValidationError):
            ls.etikett_erzeugen(t["empfehlung"])
        # Tracking: Mock-Folge REGISTERED → IN_TRANSIT → DELIVERED
        s.tracking_aktualisieren()
        s.tracking_aktualisieren()
        s.reload()
        self.assertEqual(s.status, "Unterwegs")
        ls.reload()
        self.assertEqual(ls.status, "Uebergeben")
        s.tracking_aktualisieren()
        s.reload()
        self.assertEqual(s.status, "Zugestellt")
        self.assertTrue(s.zugestellt_am)
        ls.reload()
        self.assertEqual(ls.status, "Zugestellt")
        self.assertGreaterEqual(len(s.tracking_verlauf), 3)

    def test_abholung_mit_unterschrift(self):
        ls = lieferschein(lieferart="Abholung", liefer_plz=None, liefer_ort=None)
        ls.scan("4001234567890")
        ls.scan("4001234567890")
        ls.als_gepackt()
        ls.reload()
        self.assertEqual(ls.status, "Gepackt")
        ls.als_zugestellt(empfaenger_name="Anna Muster", unterschrift="data:image/png;base64,iVBORw0KGgo=")
        ls.reload()
        self.assertEqual(ls.status, "Zugestellt")
        self.assertEqual(ls.uebergeben_an, "Kunde")
        self.assertEqual(ls.empfaenger_name, "Anna Muster")

    def test_storno_storniert_offene_sendung(self):
        ls = lieferschein()
        ls.scan("4001234567890")
        ls.scan("4001234567890")
        ls.pakete_vorschlagen()
        ls.reload()
        name = ls.etikett_erzeugen(ls.tarife()["empfehlung"])
        ls.reload()
        ls.stornieren("Test")
        self.assertEqual(frappe.db.get_value("PH Sendung", name, "status"), "Storniert")
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls.name, "status"), "Storniert")

    def test_gefahrgut_nicht_versandfaehig(self):
        ls = lieferschein(positionen=[{"beschreibung": "Parfum", "menge": 1, "paketprofil": "parfum", "einzel_cent": 9000}])
        ls.pakete_vorschlagen()
        ls.reload()
        with self.assertRaises(frappe.ValidationError):
            ls.tarife()
