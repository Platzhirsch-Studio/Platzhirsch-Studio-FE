"""bench --site <site> run-tests --app ph_service --doctype "PH Pflege Abo" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, add_months, getdate, nowdate

from ph_service.ph_service import pflege_logik as logik
from ph_service.tests.helfer import einstellungen_fuer_tests, testkontakt


class TestPHPflegeAbo(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()

    def _abo(self, **werte):
        daten = {"doctype": "PH Pflege Abo", "kontakt": testkontakt(), "art": "Wartungsvertrag", "bereich": "Whirlpool", "intervall_monate": 12, "startdatum": add_months(nowdate(), -11), "stuecke": [{"bezeichnung": "Whirlpool Terrasse", "material": "Whirlpool"}]}
        daten.update(werte)
        doc = frappe.get_doc(daten)
        doc.insert()
        return doc

    def test_titel_und_standardwerte(self):
        abo = self._abo(intervall_monate=0)
        self.assertEqual(abo.intervall_monate, 12)
        self.assertEqual(abo.status, "Angefragt")
        self.assertIn("Whirlpool", abo.titel)
        self.assertEqual(abo.erinnerung_tage_vorher, 42)
        self.assertTrue(abo.kunde_name)

    def test_aktiv_setzt_naechsten_termin(self):
        abo = self._abo()
        abo.status = "Aktiv"
        abo.save()
        self.assertEqual(getdate(abo.naechster_termin), logik.naechster_termin_nach(getdate(abo.startdatum), 12))

    def test_protokoll_schiebt_termin(self):
        abo = self._abo(status="Aktiv")
        abo.protokoll_erfassen(datum=nowdate(), leistungen="Filter getauscht, Wasser geprüft", empfohlene_produkte="Filterkartusche")
        abo.reload()
        self.assertEqual(getdate(abo.letzte_wartung), getdate(nowdate()))
        self.assertEqual(getdate(abo.naechster_termin), add_months(getdate(nowdate()), 12))
        self.assertIsNone(abo.letzte_erinnerung)

    def test_ueberfaellig(self):
        abo = self._abo(status="Aktiv", naechster_termin=add_days(nowdate(), -30))
        self.assertEqual(abo.ueberfaellig, 1)

    def test_einwilligung_widerruf(self):
        abo = self._abo(nachkauf_einwilligung=1, nachkauf_textversion="pflege-nachkauf-v1")
        self.assertTrue(abo.nachkauf_einwilligung_am)
        abo.nachkauf_einwilligung = 0
        abo.save()
        self.assertTrue(abo.nachkauf_widerrufen_am)
        abo.nachkauf_einwilligung = 1
        abo.save()
        self.assertIsNone(abo.nachkauf_widerrufen_am)

    def test_kuendigung_braucht_datum(self):
        abo = self._abo(status="Aktiv")
        abo.status = "Gekuendigt"
        with self.assertRaises(frappe.ValidationError):
            abo.save()

    def test_einsatz_aus_vertrag(self):
        abo = self._abo(status="Aktiv")
        name = abo.einsatz_planen(datum=add_days(nowdate(), 7), techniker="Administrator")
        einsatz = frappe.get_doc("PH Serviceeinsatz", name)
        self.assertEqual(einsatz.art, "Wartung")
        self.assertEqual(einsatz.pflege_abo, abo.name)
        self.assertEqual(einsatz.kunde_name, abo.kunde_name)

    def test_automatische_wartungseinsaetze_idempotent(self):
        from ph_service.ph_service import tasks

        abo = self._abo(status="Aktiv", naechster_termin=add_days(nowdate(), 10), techniker="Administrator")
        tasks.wartungseinsaetze_erzeugen()
        einsaetze = frappe.get_all("PH Serviceeinsatz", filters={"pflege_abo": abo.name}, pluck="name")
        self.assertEqual(len(einsaetze), 1)
        tasks.wartungseinsaetze_erzeugen()  # zweiter Lauf legt nichts an
        self.assertEqual(len(frappe.get_all("PH Serviceeinsatz", filters={"pflege_abo": abo.name})), 1)
        self.assertEqual(frappe.db.get_value("PH Pflege Abo", abo.name, "naechster_einsatz"), einsaetze[0])
        self.assertTrue(frappe.db.get_value("PH Serviceeinsatz", einsaetze[0], "planschluessel").startswith("wartung:"))

    def test_kein_automatischer_einsatz_ohne_schalter(self):
        from ph_service.ph_service import tasks

        abo = self._abo(status="Aktiv", naechster_termin=add_days(nowdate(), 10), automatisch_einplanen=0)
        tasks.wartungseinsaetze_erzeugen()
        self.assertFalse(frappe.get_all("PH Serviceeinsatz", filters={"pflege_abo": abo.name}))

    def tearDown(self):
        frappe.db.rollback()
