"""Packtisch nach JTL mit Site: bench --site <site> run-tests --app ph_logistik --doctype "PH Packplatz" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.ph_logistik import packtisch_ablauf as A
from ph_logistik.tests.helfer_test import lieferschein, paketprofile, testmodus


def packplatz(**felder):
    name = felder.pop("geraet", "Test-Packtisch")
    if frappe.db.exists("PH Packplatz", name):
        frappe.delete_doc("PH Packplatz", name, force=True)
    frappe.get_doc({"doctype": "PH Packplatz", "geraet": name, "aktiv": 1, **felder}).insert(ignore_permissions=True)
    return name


class TestPacktischJTL(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        paketprofile()
        testmodus()
        self.pp = packplatz(mengen_bestaetigen=1, gewicht_pflicht=1, schnellversand=1)

    def test_vorgang_scan_lieferschein_und_ean(self):
        ls = lieferschein()
        self.assertEqual(A.vorgang_scannen(ls.name)["lieferschein"], ls.name)
        r = A.vorgang_scannen("4001234567890", self.pp)
        self.assertIn(ls.name, r["kandidaten"])
        self.assertIsNone(A.vorgang_scannen("UNBEKANNT-XYZ")["lieferschein"])

    def test_menge_bestaetigen_und_hand(self):
        ls = lieferschein(positionen=[
            {"beschreibung": "Glas", "menge": 2, "ean": "4001234567890", "einzel_cent": 5900, "paketprofil": "glas-2er-set"},
            {"beschreibung": "Tisch ohne EAN", "menge": 1, "einzel_cent": 90000},
        ])
        r = A.scan_menge(ls.name, "4001234567890", 2, packplatz=self.pp)
        self.assertTrue(r["bestaetigen"])
        r = A.scan_menge(ls.name, "4001234567890", 2, bestaetigt=1, packplatz=self.pp)
        self.assertEqual(r["menge_gepackt"], 2)
        ls.reload()
        tisch = ls.positionen[1]
        self.assertEqual(tisch.ohne_barcode, 1)
        r = A.hand_bestaetigen(ls.name, tisch.name, packplatz=self.pp)
        self.assertTrue(r["alles_gepackt"])
        ls.reload()
        self.assertEqual(ls.positionen[1].hand_bestaetigt, 1)

    def test_verpacken_gewicht_pflicht_label_tracking(self):
        ls = lieferschein()
        A.scan_menge(ls.name, "4001234567890", 2, bestaetigt=1, packplatz=self.pp)
        pos = ls.positionen[0].name
        A.pakete_mit_inhalt(ls.name, [{"paket_nr": 1, "paketprofil": "glas-2er-set", "inhalt_map": {pos: 2}}], self.pp)
        with self.assertRaises(frappe.ValidationError):  # kein manuelles Gewicht
            A.verpacken(ls.name, packplatz=self.pp)
        r = A.pakete_mit_inhalt(ls.name, [{"paket_nr": 1, "paketprofil": "glas-2er-set", "gewicht_g": 1500, "inhalt_map": {pos: 2}}], self.pp)
        self.assertTrue(r["pakete"][0]["plausibel"])
        ls.reload()
        if ls.zerbrechlich:
            A.packhinweise_bestaetigen(ls.name)
        out = A.verpacken(ls.name, packplatz=self.pp)
        self.assertEqual(out["status"], "Gepackt")
        self.assertTrue(out["sendung"]["tracking_nr"])
        self.assertTrue(any(d["dokument"] == "Lieferschein" for d in out["dokumente"]))
        ls.reload()
        ls.uebergeben()
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls.name, "status"), "Uebergeben")

    def test_uebergeben_ohne_tracking_gesperrt(self):
        ls = lieferschein()
        ls.positionen_setzen({ls.positionen[0].name: 2})
        ls.pakete_vorschlagen()
        ls.reload()
        ls.als_gepackt()
        ls.reload()
        with self.assertRaises(frappe.ValidationError):
            ls.uebergeben()
        ls.uebergeben(ohne_tracking=1)  # Leitung (Administrator) darf bewusst ohne Tracking
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls.name, "status"), "Uebergeben")

    def test_zurueckstellen_und_teillieferung(self):
        ls = lieferschein(positionen=[
            {"beschreibung": "Glas", "menge": 2, "ean": "4001234567890", "einzel_cent": 5900, "paketprofil": "glas-2er-set"},
            {"beschreibung": "Kissen", "menge": 3, "ean": "4009999999999", "einzel_cent": 4000},
        ])
        A.zurueckstellen(ls.name, "Kunde Rueckfrage", "Farbe klären")
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls.name, "zurueckgestellt"), 1)
        with self.assertRaises(frappe.ValidationError):
            A.scan_menge(ls.name, "4001234567890", 1)
        A.fortsetzen(ls.name)
        A.scan_menge(ls.name, "4001234567890", 1)
        A.scan_menge(ls.name, "4009999999999", 1)
        r = A.teillieferung_aus_gescannten(ls.name)
        ls.reload()
        rest = frappe.get_doc("PH Lieferschein", r["rest"])
        self.assertEqual(sorted(p.menge for p in ls.positionen), [1, 1])
        self.assertEqual(sorted(p.menge for p in rest.positionen), [1, 2])
        self.assertEqual((ls.teillieferung, rest.teillieferung_von), (1, ls.name))

    def test_schnellversand_einzelartikel(self):
        ls = lieferschein(positionen=[{"beschreibung": "Bildband", "menge": 1, "ean": "4005555555555", "einzel_cent": 8000, "paketprofil": "bildband-klein"}])
        if not frappe.db.exists("PH Paketprofil", "bildband-klein"):
            self.skipTest("Profil bildband-klein fehlt")
        r = A.schnellversand(ls.name, self.pp)
        self.assertTrue(r["schnellversand"])
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls.name, "status"), "Gepackt")

    def test_dokumentregel_geschenk(self):
        A.standardregeln_anlegen()
        if not frappe.db.exists("PH Dokument Regel", "Rechnung immer (Test)"):
            frappe.get_doc({"doctype": "PH Dokument Regel", "bezeichnung": "Rechnung immer (Test)", "dokument": "Rechnung"}).insert(ignore_permissions=True)
        ls = lieferschein(geschenk=1)
        docs, _tl = A.dokumente_fuer(ls)
        self.assertNotIn("Rechnung", [d["dokument"] for d in docs])
        ls2 = lieferschein()
        self.assertIn("Rechnung", [d["dokument"] for d in A.dokumente_fuer(ls2)[0]])
