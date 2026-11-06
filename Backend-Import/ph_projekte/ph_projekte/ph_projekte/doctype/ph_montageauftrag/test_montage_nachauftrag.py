"""bench --site <site> run-tests --app ph_projekte --module ph_projekte.ph_projekte.doctype.ph_montageauftrag.test_montage_nachauftrag
Küche komplett, Qualifikation, Montagezeit, Verschiebung, E-Geräte, Planungsabgleich mit Storno."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte.ph_projekte.doctype.ph_projekt.test_ph_projekt import testprojekt


class TestMontageNachauftrag(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        e = frappe.get_single("PH Projekte Einstellungen")
        e.set("montage_richtwerte", [{"kategorie": "Sofa", "minuten_je_stueck": 40}])
        e.set("monteur_qualifikationen", [{"user": "Administrator", "qualifikation": "Polster"}])
        e.montage_nur_bei_ware_komplett = 1
        e.montage_grundzeit_min = 20
        e.save()
        self.p = testprojekt("Nachauftrag Montage Test")

    def tearDown(self):
        frappe.db.set_single_value("PH Projekte Einstellungen", "montage_nur_bei_ware_komplett", 0)

    def test_ware_komplett_sperrt_start(self):
        self.p.append("positionen", {"bezeichnung": "Geschirrspüler", "hersteller_artikelnr": "GS60", "menge": 1, "lieferant": None, "kategorie": "Gerät"})
        self.p.save()
        self.assertFalse(self.p.ware_komplett)
        m = frappe.get_doc({"doctype": "PH Montageauftrag", "projekt": self.p.name, "start": "2027-03-01 08:00:00", "team": [{"user": "Administrator", "rolle": "Monteur"}], "qualifikationen": [{"qualifikation": "Kueche"}]}).insert()
        self.assertIn("Ware noch nicht komplett", m.ware_hinweis)
        self.assertIn("Kueche", m.kollisionen)
        m.status = "Unterwegs"
        with self.assertRaises(frappe.ValidationError):
            m.save()
        m.reload()
        for z in self.p.positionen:
            self.p.lieferung_buchen(z.name, z.menge or 1)
            self.p.reload()
        self.assertTrue(self.p.ware_komplett)
        self.assertEqual(m.geraete_aus_stueckliste(), 1)

    def test_montagezeit_und_verschiebung(self):
        m = frappe.get_doc({"doctype": "PH Montageauftrag", "projekt": self.p.name, "start": "2027-03-02 08:00:00"}).insert()
        r = m.montagezeit_vorschlagen(uebernehmen=1)
        self.assertEqual(r["minuten"], 20 + 40)
        m.reload()
        self.assertEqual(m.stunden_geplant, 1.0)
        m.start = "2027-03-05 08:00:00"
        m.save()
        self.assertTrue(frappe.db.exists("PH Projekt Aufgabe", {"referenz_doctype": "PH Montageauftrag", "referenz_name": m.name, "art": "Montage"}))
