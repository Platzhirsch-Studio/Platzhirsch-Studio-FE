"""bench --site <site> run-tests --app ph_personal --doctype "PH Bewerbung" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, add_months, getdate, nowdate

from ph_personal.api import attach_unterlage, create_bewerbung
from ph_personal.ph_personal.doctype.ph_stelle.test_ph_stelle import stelle_anlegen
from ph_personal.ph_personal.tasks import loeschfristen_ausfuehren

PDF_LEER = "JVBERi0xLjQKJSBsZWVyZSBUZXN0ZGF0ZWkK"  # base64 von "%PDF-1.4\n% leere Testdatei\n"


def bewerbung_anlegen(**extra):
    daten = {
        "doctype": "PH Bewerbung",
        "vorname": "Berta",
        "nachname": "Test",
        "email": "berta@example.com",
        "quelle": "E-Mail",
        "anschreiben": "<p>Ich bewerbe mich.</p>",
        "einwilligung_datenschutz": 1,
    }
    daten.update(extra)
    return frappe.get_doc(daten)


class TestPHBewerbung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.cache().delete_value("ph_personal:einstellungen")
        if not frappe.db.exists("PH Stelle", "testplaner-in-m-w-d"):
            stelle_anlegen(status="Aktiv").insert()

    def test_titel_status_initiativ(self):
        doc = bewerbung_anlegen().insert()
        self.assertTrue(doc.name.startswith("PH-BEW-"))
        self.assertEqual(doc.status, "Eingegangen")
        self.assertEqual(doc.initiativ, 1)
        self.assertEqual(doc.titel, "Berta Test – Initiativ")
        mit = bewerbung_anlegen(stelle="testplaner-in-m-w-d").insert()
        self.assertEqual(mit.initiativ, 0)
        self.assertIn("Testplaner/in (m/w/d)", mit.titel)

    def test_kontakt_pflicht(self):
        with self.assertRaises(frappe.ValidationError):
            bewerbung_anlegen(email=None, telefon=None).insert()

    def test_loeschfrist_nach_absage(self):
        doc = bewerbung_anlegen().insert()
        doc.absage_senden(grund="Qualifikation", per_mail=0)
        doc.reload()
        self.assertEqual(doc.status, "Abgesagt")
        self.assertTrue(doc.entschieden_am)
        self.assertEqual(doc.loeschfrist, getdate(add_months(getdate(doc.entschieden_am), 7)))
        self.assertEqual(doc.durchlauf_tage, 0)

    def test_eingestellt_ohne_loeschfrist(self):
        doc = bewerbung_anlegen(stelle="testplaner-in-m-w-d").insert()
        doc.gespraech_anlegen(start=frappe.utils.add_to_date(None, days=2), dauer_min=45, modus="Video")
        doc.reload()
        self.assertEqual(doc.status, "Gespraech")
        self.assertTrue(doc.gespraech_am)
        ma = doc.einstellen(eintritt=add_days(nowdate(), 30), rolle_intern="Planung")
        doc.reload()
        self.assertEqual(doc.status, "Eingestellt")
        self.assertIsNone(doc.loeschfrist)
        self.assertEqual(frappe.db.get_value("PH Mitarbeiter", ma, "bewerbung"), doc.name)

    def test_evidenz_setzt_loeschfrist(self):
        doc = bewerbung_anlegen().insert()
        doc.absage_senden(per_mail=0)
        bis = add_months(nowdate(), 12)
        doc.reload()
        doc.evidenz_verlaengern(bis)
        doc.reload()
        self.assertEqual(doc.loeschfrist, getdate(bis))

    def test_api_create_idempotent_und_unterlage_privat(self):
        daten = {
            "stelle": "testplaner-in-m-w-d",
            "vorname": "Api",
            "nachname": "Bewerber",
            "email": "api@example.com",
            "anschreiben": "Hallo\nZeile 2",
            "einwilligung_datenschutz": 1,
            "einwilligung_text_version": "2026-11",
            "sprache": "en",
            "idempotency_key": "bew-test-1",
        }
        a = create_bewerbung(**daten)
        b = create_bewerbung(**daten)
        self.assertEqual(a["referenz"], b["referenz"])
        doc = frappe.get_doc("PH Bewerbung", a["referenz"])
        self.assertEqual(doc.quelle, "Website")
        self.assertEqual(doc.status, "Eingegangen")
        self.assertEqual(doc.sprache, "en")
        self.assertTrue(doc.einwilligung_zeitpunkt)
        r = attach_unterlage(referenz=doc.name, dateiname="lebenslauf.pdf", inhalt_base64=PDF_LEER, art="Lebenslauf")
        self.assertTrue(r["ok"])
        doc.reload()
        self.assertEqual(len(doc.unterlagen), 1)
        self.assertTrue(doc.unterlagen[0].datei.startswith("/private/files/"))
        self.assertEqual(frappe.db.get_value("File", {"file_url": doc.unterlagen[0].datei}, "is_private"), 1)

    def test_api_pflichtfelder(self):
        from ph_core.api import ApiFehler

        with self.assertRaises(ApiFehler):
            create_bewerbung.__wrapped__(vorname="x", email="x@example.com", einwilligung_datenschutz=1)
        with self.assertRaises(ApiFehler):
            create_bewerbung.__wrapped__(nachname="x", email="x@example.com")  # ohne Datenschutz-Bestätigung
        with self.assertRaises(ApiFehler):
            create_bewerbung.__wrapped__(nachname="x", email="x@example.com", einwilligung_datenschutz=1, stelle="gibt-es-nicht")

    def test_loeschjob_pseudonymisiert(self):
        doc = bewerbung_anlegen(nachname="Frist").insert()
        attach_unterlage.__wrapped__(referenz=doc.name, dateiname="cv.pdf", inhalt_base64=PDF_LEER)
        doc.reload()
        doc.absage_senden(per_mail=0)
        doc.db_set("loeschfrist", add_days(nowdate(), -1))
        loeschfristen_ausfuehren()
        doc.reload()
        self.assertEqual(doc.pseudonymisiert, 1)
        self.assertEqual(doc.nachname, "Gelöscht")
        self.assertIsNone(doc.email)
        self.assertEqual(len(doc.unterlagen), 0)
        self.assertFalse(frappe.get_all("File", {"attached_to_doctype": "PH Bewerbung", "attached_to_name": doc.name}))
        self.assertEqual(frappe.db.count("Version", {"ref_doctype": "PH Bewerbung", "docname": doc.name}), 0)
        # zweiter Lauf ändert nichts mehr
        loeschfristen_ausfuehren()

    def test_loeschjob_verschont_evidenz_und_offene(self):
        offen = bewerbung_anlegen(nachname="Offen").insert()
        offen.db_set("loeschfrist", add_days(nowdate(), -1))
        loeschfristen_ausfuehren()
        offen.reload()
        self.assertEqual(offen.pseudonymisiert, 0)
