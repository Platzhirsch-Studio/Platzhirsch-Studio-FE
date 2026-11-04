"""bench --site <site> run-tests --app ph_service --doctype "PH Servicefall" """

import frappe
from frappe.model.workflow import apply_workflow
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_months, getdate, nowdate

from ph_service.api import create_service_case, get_service_status
from ph_service.ph_service import fristen as fr
from ph_service.tests.helfer import TEST_EMAIL, aufraeumen, einstellungen_fuer_tests, testfall, testkontakt


class TestPHServicefall(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()

    def test_anlegen_titel_status_fristen(self):
        doc = testfall()
        self.assertTrue(doc.name.startswith("PH-SRV-"))
        self.assertEqual(doc.status, "Gemeldet")
        self.assertIn("Mangel:", doc.titel)
        self.assertIn("Testschrank", doc.titel)
        self.assertEqual(getdate(doc.gewaehrleistung_bis), fr.monate_dazu(getdate(doc.uebergabe_datum), 24))
        self.assertEqual(getdate(doc.beweislast_bis), fr.monate_dazu(getdate(doc.uebergabe_datum), 12))
        self.assertEqual(doc.fristen_status, "Gewaehrleistung (Vermutung)")
        self.assertTrue(doc.frist_reaktion)
        self.assertEqual(len(doc.verlauf), 1)
        self.assertEqual(doc.kunde_email, TEST_EMAIL)

    def test_unternehmer_vermutung_sechs_monate(self):
        doc = testfall(kundentyp="Unternehmer", uebergabe_datum=add_months(nowdate(), -8))
        self.assertEqual(doc.fristen_status, "Gewaehrleistung")
        self.assertIn("377 UGB", doc.rechtsgrundlage_hinweis)

    def test_abgelaufen_mit_garantie(self):
        doc = testfall(kaufdatum=add_months(nowdate(), -40), uebergabe_datum=add_months(nowdate(), -40), garantie_monate=60)
        self.assertEqual(doc.fristen_status, "Nur Garantie")
        self.assertTrue(doc.garantie_bis)

    def test_fehlercode_bereich_abgleich(self):
        doc = testfall(fehlercode="MEC-01")
        self.assertEqual(doc.fehlerbereich, "MEC")
        self.assertEqual(doc.fehlercode_bezeichnung, "Scharnier defekt / schwergängig")
        doc.fehlerbereich = "OBF"
        with self.assertRaises(frappe.ValidationError):
            doc.save()

    def test_entscheidung_braucht_begruendung(self):
        doc = testfall(fehlercode="MEC-01")
        doc.entscheidung = "Verbesserung"
        with self.assertRaises(frappe.ValidationError):
            doc.save()
        doc.reload()
        doc.entscheidung = "Verbesserung"
        doc.entscheidung_begruendung = "Scharnier wird nachjustiert."
        doc.save()
        self.assertEqual(doc.entschieden_von, "Administrator")
        self.assertTrue(doc.entschieden_am)

    def test_kulanz_schwelle_leitung(self):
        doc = testfall(fehlercode="POL-01")
        doc.kulanz_cent = 60000
        doc.entscheidung = "Kulanz"
        doc.entscheidung_begruendung = "Kulanz Polster"
        doc.save()
        self.assertTrue(doc.kulanz_freigabe_noetig)
        # Administrator gilt als Leitung → Freigabe wird gesetzt
        self.assertEqual(doc.kulanz_freigegeben_von, "Administrator")
        self.assertEqual(doc.kosten_kulanz_cent, 60000)
        self.assertEqual(doc.kosten_gesamt_cent, 60000)

    def test_kosten_summen(self):
        doc = testfall()
        doc.append("kosten", {"datum": nowdate(), "art": "Intern Arbeitszeit", "betrag_cent": 7500, "regressfaehig": 1})
        doc.append("kosten", {"datum": nowdate(), "art": "Ersatzteil", "betrag_cent": 2500, "regressfaehig": 1})
        doc.append("kosten", {"datum": nowdate(), "art": "Kulanz", "betrag_cent": 1000})
        doc.kosten_kunde_cent = 500
        doc.save()
        self.assertEqual(doc.kosten_intern_cent, 7500)
        self.assertEqual(doc.kosten_extern_cent, 2500)
        self.assertEqual(doc.kosten_kulanz_cent, 1000)
        self.assertEqual(doc.kosten_gesamt_cent, 11000)
        self.assertEqual(doc.netto_kosten_cent, 10500)

    def test_workflow_bis_geschlossen(self):
        if not frappe.db.exists("Workflow", "PH Servicefall"):
            self.skipTest("Workflow-Fixture nicht installiert")
        doc = testfall()
        with self.assertRaises(frappe.ValidationError):
            apply_workflow(doc, "Prüfung abschließen")  # kein Fehlercode
        doc.reload()
        doc.fehlercode = "MEC-01"
        doc.mangel_bestaetigt = "Ja"
        doc.save()
        doc = apply_workflow(doc, "Prüfung abschließen")
        self.assertEqual(doc.status, "Geprueft")
        self.assertTrue(doc.erstreaktion_am)
        doc.entscheidung = "Verbesserung"
        doc.entscheidung_begruendung = "Nachjustieren"
        doc.save()
        doc = apply_workflow(doc, "Entscheidung treffen")
        doc = apply_workflow(doc, "In Bearbeitung nehmen")
        self.assertEqual(doc.status, "In Bearbeitung")
        with self.assertRaises(frappe.ValidationError):
            apply_workflow(doc, "Erledigt melden")  # kein Abschlussbericht
        doc.reload()
        doc.abschlussbericht = "Scharnier justiert, Tür schließt bündig."
        doc.save()
        doc = apply_workflow(doc, "Erledigt melden")
        self.assertEqual(doc.status, "Erledigt")
        self.assertTrue(doc.erledigt_am)
        self.assertIsNotNone(doc.dauer_tage)
        self.assertEqual(getdate(doc.regress_frist_bis), fr.monate_dazu(getdate(doc.erledigt_am), 2))
        doc = apply_workflow(doc, "Schließen")
        self.assertEqual(doc.status, "Geschlossen")
        self.assertGreaterEqual(len(doc.verlauf), 6)

    def test_ablehnen_nur_mit_begruendung_und_bericht(self):
        doc = testfall(fehlercode="PFL-03")
        doc.ablehnen("Kein Mangel (Gebrauchsspur)", "Normale Gebrauchsfalte laut Herstellerrichtlinie.")
        doc.reload()
        self.assertEqual(doc.status, "Abgelehnt")
        self.assertEqual(doc.entscheidung, "Abgelehnt")
        self.assertTrue(doc.abschlussbericht)

    def test_einsatz_anlegen_setzt_status(self):
        doc = testfall(fehlercode="MEC-01", entscheidung="Verbesserung", entscheidung_begruendung="Nachjustieren")
        name = doc.einsatz_anlegen(datum=nowdate(), zeit_von="08:00:00", zeit_bis="10:00:00", techniker="Administrator")
        einsatz = frappe.get_doc("PH Serviceeinsatz", name)
        self.assertEqual(einsatz.servicefall, doc.name)
        self.assertEqual(einsatz.kunde_name, doc.kunde_name)
        doc.reload()
        self.assertEqual(doc.status, "Einsatz geplant")

    def test_regress_anlegen_spiegelt_status(self):
        if not frappe.db.exists("DocType", "PH Lieferant"):
            self.skipTest("PH Lieferant (ph_sortiment) fehlt")
        lieferant = frappe.get_all("PH Lieferant", limit=1, pluck="name")
        if not lieferant:
            self.skipTest("Kein PH Lieferant vorhanden")
        doc = testfall(lieferant=lieferant[0])
        doc.append("kosten", {"datum": nowdate(), "art": "Ersatzteil", "betrag_cent": 4200, "regressfaehig": 1})
        doc.save()
        name = doc.regress_anlegen()
        reg = frappe.get_doc("PH Lieferantenregress", name)
        self.assertEqual(reg.betrag_gefordert_cent, 4200)
        doc.reload()
        self.assertEqual(doc.regress_status, "Offen")
        self.assertEqual(doc.regress_gefordert_cent, 4200)
        self.assertEqual(doc.regress_anlegen(), name)  # idempotent

    def test_api_create_service_case_idempotent(self):
        testkontakt()
        daten = {"nachname": "Servicetest", "email": TEST_EMAIL, "beschreibung": "Lampe flackert", "art": "mangel", "kundenwunsch": "austausch", "idempotency_key": "srv-test-idem-1"}
        a = create_service_case(**daten)
        b = create_service_case(**daten)
        self.assertEqual(a["referenz"], b["referenz"])
        doc = frappe.get_doc("PH Servicefall", a["referenz"])
        self.assertEqual(doc.kanal, "Website")
        self.assertEqual(doc.kundenwunsch, "Austausch")
        self.assertEqual(doc.quelle, "website")
        status = get_service_status(referenz=a["referenz"], email=TEST_EMAIL)
        self.assertEqual(status["status"], "gemeldet")
        self.assertNotIn(TEST_EMAIL, str(status))

    def test_api_pflichtfeld_und_falsche_email(self):
        r = create_service_case(nachname="X", email="kein-mail", beschreibung="y")
        self.assertEqual(r.get("code"), "invalid")
        r = create_service_case(nachname="X", email=TEST_EMAIL)
        self.assertEqual(r.get("code"), "invalid")
        r = get_service_status(referenz="PH-SRV-0000-99999", email=TEST_EMAIL)
        self.assertEqual(r.get("code"), "not_found")

    def tearDown(self):
        frappe.db.rollback()
