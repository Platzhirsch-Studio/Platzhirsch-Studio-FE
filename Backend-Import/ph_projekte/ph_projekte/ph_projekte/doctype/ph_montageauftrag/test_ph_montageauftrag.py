"""bench --site <site> run-tests --app ph_projekte --doctype "PH Montageauftrag" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte.ph_projekte.doctype.ph_projekt.test_ph_projekt import kunden_token, testprojekt

SIGNATUR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="


class TestPHMontageauftrag(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        self.p = testprojekt("Montageauftrag Test")

    def _montage(self, **extra):
        werte = {"doctype": "PH Montageauftrag", "projekt": self.p.name, "start": "2026-12-01 08:00:00", "ende": "2026-12-01 12:00:00", "leistungen": [{"beschreibung": "Sofa aufstellen", "dauer_h_geplant": 2.5}, {"beschreibung": "Leuchte montieren", "dauer_h_geplant": 1}]}
        werte.update(extra)
        return frappe.get_doc(werte).insert()

    def test_anlegen_titel_stunden_projekttermine(self):
        m = self._montage()
        self.assertEqual(m.status, "Geplant")
        self.assertTrue(m.titel.startswith("Montage 01.12.2026"))
        self.assertEqual(m.stunden_geplant, 3.5)
        self.assertEqual(m.kontakt, self.p.kontakt)
        self.p.reload()
        self.assertEqual(str(self.p.montage_von), "2026-12-01")

    def test_ende_vor_beginn(self):
        with self.assertRaises(frappe.ValidationError):
            self._montage(ende="2026-12-01 07:00:00")

    def test_abnahme_nur_mit_unterschrift(self):
        m = self._montage(start="2026-12-02 08:00:00")
        m.status = "Abgenommen"
        with self.assertRaises(frappe.ValidationError):
            m.save()
        m.reload()
        m.unterschrift_erfassen(SIGNATUR, name_kunde="Anna Projekttest")
        m.reload()
        self.assertTrue(m.unterschrift_am)
        m.status = "Abgenommen"
        m.save()
        self.assertTrue(m.abgenommen_am)

    def test_abbruch_braucht_grund_und_zeit_buchen(self):
        m = self._montage(start="2026-12-03 08:00:00")
        m.status = "Abgebrochen"
        with self.assertRaises(frappe.ValidationError):
            m.save()
        m.reload()
        z = m.zeit_buchen(user="Administrator", dauer_min=90)
        self.assertEqual(frappe.db.get_value("PH Projektzeit", z, "montageauftrag"), m.name)

    def test_portal_appointments_enthaelt_montage(self):
        from ph_projekte.api import portal_appointments

        m = self._montage(start="2026-12-04 08:00:00")
        token = kunden_token(self.p.kontakt)
        termine = portal_appointments(kontakt=self.p.kontakt, kunde_token=token, projekt=self.p.name)
        eintrag = next(t for t in termine if t["id"] == m.name)
        self.assertEqual(eintrag["kind"], "montage")
        self.assertTrue(eintrag["start"].startswith("2026-12-04T08:00:00"))
        self.assertIn("+", eintrag["start"])  # ISO 8601 mit Offset


class TestPHMontageKollision(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.p = testprojekt("Montage Kollision Test")

    def test_fahrzeug_und_monteur_kollision(self):
        werte = {"doctype": "PH Montageauftrag", "projekt": self.p.name, "start": "2027-01-12 08:00:00", "ende": "2027-01-12 12:00:00", "fahrzeug": "b-123ab", "team": [{"user": "Administrator", "rolle": "Monteur"}]}
        a = frappe.get_doc(werte).insert()
        self.assertEqual(a.fahrzeug, "B-123AB")
        self.assertFalse(a.kollisionen)
        b = frappe.get_doc({**werte, "start": "2027-01-12 10:00:00", "ende": "2027-01-12 14:00:00"}).insert()
        self.assertIn("B-123AB", b.kollisionen)
        self.assertIn("Administrator", b.kollisionen)
        from ph_projekte.api import montage_kollisionen, montage_plantafel

        treffer = montage_kollisionen("2027-01-12 11:00:00", "2027-01-12 13:00:00", monteure='["Administrator"]', fahrzeug="B-123AB", ausser=b.name)
        self.assertTrue(any(t["name"] == a.name for t in treffer))
        tafel = montage_plantafel("2027-01-12", "2027-01-13")
        self.assertTrue(any(m["name"] == b.name for m in tafel["montagen"]))

    def test_abnahme_uebernimmt_nur_offene_maengel(self):
        m = frappe.get_doc({"doctype": "PH Montageauftrag", "projekt": self.p.name, "start": "2027-01-20 08:00:00", "maengel": [{"beschreibung": "Kratzer Front", "status": "behoben"}, {"beschreibung": "Griff fehlt", "status": "offen", "verantwortlich": "Lieferant"}]}).insert()
        abn = frappe.get_doc("PH Abnahme", m.abnahme_anlegen())
        texte = [p.bezeichnung for p in abn.positionen]
        self.assertIn("Griff fehlt", texte)
        self.assertNotIn("Kratzer Front", texte)
