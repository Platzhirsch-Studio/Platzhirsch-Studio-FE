"""bench --site <site> run-tests --app ph_marketing --doctype "PH Event" – Anmeldung, Kapazität, Warteliste, Absage, Workflow-Regel."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_core.api import ApiFehler
from ph_marketing.api import register_event
from ph_marketing.ph_marketing import events


class TestPHEvent(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.db.set_single_value("PH Einstellungen", "testmodus", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.cache().delete_value("ph_marketing:einstellungen")
        frappe.flags.mute_emails = True
        if frappe.db.exists("PH Event", "test-abend"):
            frappe.delete_doc("PH Event", "test-abend", force=True)
        self.ev = frappe.get_doc({"doctype": "PH Event", "event_id": "test-abend", "titel": "Testabend", "datum": frappe.utils.add_days(frappe.utils.nowdate(), 10), "uhrzeit_von": "18:00:00", "kapazitaet": 3, "warteliste": 1})
        self.ev.insert()
        # Veröffentlichen wie der Workflow-Übergang (Leitung), hier direkt:
        self.ev.db_set({"status": "Offen", "workflow_state": "PH Offen"})

    def test_geplant_ohne_uhrzeit_nicht_veroeffentlichen(self):
        if frappe.db.exists("PH Event", "ohne-zeit"):
            frappe.delete_doc("PH Event", "ohne-zeit", force=True)
        d = frappe.get_doc({"doctype": "PH Event", "event_id": "ohne-zeit", "titel": "x", "datum": "2026-12-01"}).insert()
        d.status = "Offen"
        with self.assertRaises(frappe.ValidationError):
            d.save()

    def test_anmeldung_und_ausgebucht(self):
        r = register_event(event_id="test-abend", name="Anna Muster", email="anna@example.com", personen=2)
        self.assertTrue(r["success"])
        self.assertEqual(r["status"], "angemeldet")
        self.assertEqual(r["plaetze_frei"], 1)
        self.assertEqual(r["email"], "a***@example.com")
        r2 = register_event(event_id="test-abend", name="Bert Beispiel", email="bert@example.com", personen=1)
        self.assertEqual(r2["plaetze_frei"], 0)
        ev = frappe.get_doc("PH Event", "test-abend")
        self.assertEqual(ev.status, "Ausgebucht")
        self.assertEqual(ev.plaetze_belegt, 3)
        # Warteliste
        r3 = register_event(event_id="test-abend", name="Carla", email="carla@example.com", personen=1)
        self.assertEqual(r3["status"], "warteliste")
        # Duplikat neutral
        r4 = register_event(event_id="test-abend", name="Anna Muster", email="anna@example.com", personen=2)
        self.assertTrue(r4["bereits_angemeldet"])
        # Einwilligungs-Nachweis
        self.assertTrue(frappe.db.exists("PH Einwilligung", {"email": "anna@example.com", "zweck": "einladungen", "status": "Bestaetigt"}))

    def test_ohne_warteliste_conflict(self):
        self.ev.db_set("warteliste", 0)
        register_event(event_id="test-abend", name="Anna", email="a1@example.com", personen=3)
        with self.assertRaises(ApiFehler) as cm:
            events.anmelden("test-abend", "Dora", "d@example.com", personen=1)
        self.assertEqual(cm.exception.code, "conflict")

    def test_absage_per_token_gibt_platz_frei(self):
        from ph_marketing.utils.token import hash_token, neuer_token

        events.anmelden("test-abend", "Anna", "a2@example.com", personen=3)
        ev = frappe.get_doc("PH Event", "test-abend")
        self.assertEqual(ev.status, "Ausgebucht")
        token = neuer_token()
        frappe.db.set_value("PH Event Anmeldung", ev.anmeldungen[0].name, "anmelde_token_hash", hash_token(token))
        r = events.absagen_mit_token(token)
        self.assertEqual(r["status"], "abgesagt")
        ev.reload()
        self.assertEqual(ev.status, "Offen")
        self.assertEqual(ev.plaetze_frei, 3)

    def test_teilnehmerliste(self):
        events.anmelden("test-abend", "Zed", "z@example.com", personen=1)
        events.anmelden("test-abend", "Anna", "a3@example.com", personen=2)
        liste = frappe.get_doc("PH Event", "test-abend").teilnehmerliste()
        self.assertEqual(liste["personen"], 3)
        self.assertEqual(liste["zeilen"][0]["name"], "Anna")
