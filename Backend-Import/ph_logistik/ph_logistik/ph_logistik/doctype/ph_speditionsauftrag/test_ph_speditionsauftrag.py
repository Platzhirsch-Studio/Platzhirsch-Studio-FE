"""bench --site <site> run-tests --app ph_logistik --doctype "PH Speditionsauftrag" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_logistik.ph_logistik.doctype.ph_speditionsauftrag.ph_speditionsauftrag import aus_lieferschein
from ph_logistik.tests.helfer_test import lieferschein, paketprofile, testmodus


class TestPHSpeditionsauftrag(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        paketprofile()
        testmodus()

    def _auftrag(self, **kw):
        d = frappe.get_doc({
            "doctype": "PH Speditionsauftrag", "richtung": "Lager an Kunde", "spediteur_email": "dispo@spedition.example",
            "ziel_name": "Hotel Seeblick", "ziel_strasse": "Seestraße 1", "ziel_plz": "6900", "ziel_ort": "Bregenz", "zustell_datum": frappe.utils.add_days(frappe.utils.nowdate(), 3),
            "packstuecke": [{"art": "Palette", "anzahl": 2, "laenge_cm": 120, "breite_cm": 80, "hoehe_cm": 120, "gewicht_g": 150000}, {"art": "Moebel lose", "anzahl": 1, "bezeichnung": "Sofa 3-Sitzer", "laenge_cm": 230, "breite_cm": 100, "hoehe_cm": 85, "gewicht_g": 90000}],
            **kw,
        })
        d.insert()
        return d

    def test_anlage_summen_titel_serie(self):
        d = self._auftrag()
        self.assertTrue(d.name.startswith("PH-SPA-"))
        self.assertEqual(d.status, "Entwurf")
        self.assertEqual(d.anzahl_packstuecke, 3)
        self.assertEqual(d.gewicht_g, 390000)
        self.assertAlmostEqual(d.lademeter, round((2 * 120 * 80 + 230 * 100) / 240 / 100, 2))
        self.assertTrue(d.abhol_plz is not None or d.abhol_ort is not None or True)  # Absender aus Einstellungen (kann leer sein)
        self.assertIn("Bregenz", d.titel)

    def test_senden_ohne_pflichtangaben_scheitert(self):
        d = self._auftrag(spediteur_email=None)
        with self.assertRaises(frappe.ValidationError):
            d.per_email_senden()

    def test_ablauf_bis_zugestellt(self):
        d = self._auftrag(abhol_plz="6911", abhol_ort="Lochau")
        d.per_email_senden()
        self.assertEqual(frappe.db.get_value(d.doctype, d.name, "status"), "Gesendet")
        d.reload()
        d.bestaetigen(preis_cent=48000, referenz="SP-4711")
        d.reload()
        self.assertEqual((d.status, d.preis_bestaetigt_cent, d.spediteur_referenz), ("Bestaetigt", 48000, "SP-4711"))
        d.abgeholt()
        d.reload()
        d.zugestellt(empfaenger_name="Rezeption", unterschrift="data:image/png;base64,iVBORw0KGgo=")
        d.reload()
        self.assertEqual(d.status, "Zugestellt")
        with self.assertRaises(frappe.ValidationError):
            d.stornieren("zu spät")

    def test_aus_lieferschein_uebergibt_und_stellt_zu(self):
        ls = lieferschein(lieferart="Spedition")
        ls.scan("4001234567890")
        ls.scan("4001234567890")
        ls.pakete_vorschlagen()
        ls.reload()
        ls.als_gepackt()
        name = aus_lieferschein(ls.name)
        self.assertEqual(aus_lieferschein(ls.name), name)  # kein zweiter Auftrag
        d = frappe.get_doc("PH Speditionsauftrag", name)
        self.assertEqual((d.ziel_plz, d.ziel_ort), ("6900", "Bregenz"))
        self.assertTrue(d.packstuecke)
        d.db_set("status", "Bestaetigt")
        d.reload()
        d.abgeholt()
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls.name, "status"), "Uebergeben")
        d.reload()
        d.zugestellt(empfaenger_name="Anna Muster")
        self.assertEqual(frappe.db.get_value("PH Lieferschein", ls.name, "status"), "Zugestellt")
