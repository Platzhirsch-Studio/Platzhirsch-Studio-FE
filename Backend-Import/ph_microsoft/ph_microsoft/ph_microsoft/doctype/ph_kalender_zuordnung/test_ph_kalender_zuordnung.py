"""bench --site <site> run-tests --app ph_microsoft --doctype "PH Kalender Zuordnung" – Kalender gegen Graph-Attrappe."""

import unittest
from datetime import timedelta

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import now_datetime

from ph_microsoft.ph_microsoft import kalender
from ph_microsoft.ph_microsoft.einstellungen import cache_leeren
from ph_microsoft.tests.attrappe_graph import GraphAttrappe

USER = "kal.test@platzhirsch.studio"


class TestPHKalenderZuordnung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        if not frappe.db.exists("User", USER):
            frappe.get_doc({"doctype": "User", "email": USER, "first_name": "Kal", "send_welcome_email": 0, "user_type": "System User"}).insert(ignore_permissions=True)
        frappe.db.set_single_value("PH Microsoft Einstellungen", {"kalender_sync_aktiv": 1, "kalender_termin": 1, "teams_fuer_video": 1, "belegt_als_event": 1, "aufgabe_bei_verschiebung": 1})
        cache_leeren()
        if not frappe.db.exists("PH Kalender Zuordnung", USER):
            frappe.get_doc({"doctype": "PH Kalender Zuordnung", "user": USER}).insert()

    def tearDown(self):
        frappe.flags.ph_ms_graph_client = None
        frappe.db.rollback()
        cache_leeren()

    def test_adresse_aus_benutzer(self):
        self.assertEqual(frappe.db.get_value("PH Kalender Zuordnung", USER, "outlook_adresse"), USER)
        z = frappe.get_doc("PH Kalender Zuordnung", USER)
        z.aktiv = 0
        z.save()
        self.assertEqual(z.status, "Pausiert")

    def test_belegt_spiegel_ohne_inhalt(self):
        start = (now_datetime() + timedelta(days=1)).replace(microsecond=0)
        ev = {"id": "ev-fremd", "subject": "Privat: Arzt", "showAs": "busy", "start": {"dateTime": start.isoformat(), "timeZone": "Europe/Vienna"}, "end": {"dateTime": (start + timedelta(hours=1)).isoformat(), "timeZone": "Europe/Vienna"}}
        frappe.flags.ph_ms_graph_client = GraphAttrappe([("GET", "calendarView/delta", {"value": [ev]})])
        kalender.delta_abgleichen(USER)
        v = frappe.db.get_value("PH Graph Verknuepfung", {"graph_id": "ev-fremd"}, ["art", "frappe_event"], as_dict=True)
        self.assertEqual(v.art, "Belegt")
        e = frappe.db.get_value("Event", v.frappe_event, ["subject", "owner", "event_type"], as_dict=True)
        self.assertEqual((e.subject, e.owner, e.event_type), (kalender.BELEGT_TITEL, USER, "Private"))
        frappe.flags.ph_ms_graph_client = GraphAttrappe([("GET", "delta", {"value": [{"id": "ev-fremd", "@removed": {"reason": "deleted"}}]})])
        kalender.delta_abgleichen(USER)
        self.assertFalse(frappe.db.exists("Event", v.frappe_event))

    @unittest.skipUnless(frappe.db.exists("DocType", "PH Termin"), "ph_crm nicht installiert")
    def test_termin_nach_outlook_mit_teams_und_verschiebung(self):
        start = (now_datetime() + timedelta(days=3)).replace(minute=0, second=0, microsecond=0)
        t = frappe.get_doc({"doctype": "PH Termin", "modus": "Video", "start": start, "ende": start + timedelta(hours=1), "berater": USER, "nachname": "MS-Test", "email": "kal.kunde@beispiel.invalid", "quelle": "backoffice", "status": "Bestaetigt"})
        t.flags.ignore_permissions = True
        t.insert()
        g = frappe.flags.ph_ms_graph_client = GraphAttrappe([("POST", "/calendar/events", {"id": "ev-1", "changeKey": "c1", "onlineMeeting": {"joinUrl": "https://teams.microsoft.com/l/meetup-join/test"}})])
        kalender.dokument_abgleichen("PH Termin", t.name)
        body = g.aufrufe_mit("POST", "/calendar/events")[0][2]
        self.assertTrue(body["isOnlineMeeting"])
        self.assertTrue(frappe.db.get_value("PH Termin", t.name, "meet_url"))
        neu = start + timedelta(hours=2)
        verschoben = {"id": "ev-1", "subject": body["subject"], "body": body["body"], "location": body["location"], "isOnlineMeeting": True,
                      "start": {"dateTime": neu.isoformat(), "timeZone": "Europe/Vienna"}, "end": {"dateTime": (neu + timedelta(hours=1)).isoformat(), "timeZone": "Europe/Vienna"}}
        frappe.flags.ph_ms_graph_client = GraphAttrappe([("GET", "calendarView/delta", {"value": [verschoben]})])
        kalender.delta_abgleichen(USER)
        self.assertEqual(frappe.utils.get_datetime(frappe.db.get_value("PH Termin", t.name, "start")), neu)
