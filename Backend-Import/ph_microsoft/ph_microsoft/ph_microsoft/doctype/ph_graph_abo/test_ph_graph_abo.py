"""bench --site <site> run-tests --app ph_microsoft --doctype "PH Graph Abo" – Webhook-Handshake, clientState, Anlage."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_microsoft.logik import webhook as W
from ph_microsoft.ph_microsoft import abos
from ph_microsoft.ph_microsoft.einstellungen import cache_leeren
from ph_microsoft.tests.attrappe_graph import GraphAttrappe


class TestPHGraphAbo(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Microsoft Einstellungen", {"webhook_basis_url": "https://backend.beispiel.invalid", "mail_sync_aktiv": 1})
        cache_leeren()

    def tearDown(self):
        frappe.flags.ph_ms_graph_client = None
        frappe.db.rollback()
        cache_leeren()

    def test_anlegen_speichert_nur_hash(self):
        g = frappe.flags.ph_ms_graph_client = GraphAttrappe([("POST", "/subscriptions", {"id": "sub-test-1", "expirationDateTime": "2026-11-07T10:00:00.0000000Z"})])
        name = abos.anlegen("Mail", "users/x@platzhirsch.studio/mailFolders('Inbox')/messages", "created")
        gesendet = g.aufrufe_mit("POST", "/subscriptions")[0][2]
        a = frappe.get_doc("PH Graph Abo", name)
        self.assertTrue(W.client_state_passt(gesendet["clientState"], a.client_state_hash))
        self.assertNotIn(gesendet["clientState"], frappe.as_json(a.as_dict()))
        self.assertTrue(gesendet["notificationUrl"].endswith("/api/method/ph_microsoft.api.graph_webhook"))

    def test_webhook_handshake(self):
        from ph_microsoft.api import graph_webhook

        frappe.local.request = frappe._dict(args={"validationToken": "Validation: Testing"}, get_data=lambda as_text=True: "")
        antwort = graph_webhook()
        self.assertEqual((antwort.status_code, antwort.get_data(as_text=True), antwort.mimetype), (200, "Validation: Testing", "text/plain"))

    def test_webhook_falscher_client_state_wird_ignoriert(self):
        from ph_microsoft.api import graph_webhook

        frappe.get_doc({"doctype": "PH Graph Abo", "subscription_id": "sub-test-2", "art": "Mail", "status": "Aktiv", "client_state_hash": W.client_state_hash("richtig")}).insert()
        frappe.local.request = frappe._dict(args={}, get_data=lambda as_text=True: "")
        antwort = graph_webhook(value=[{"subscriptionId": "sub-test-2", "clientState": "falsch", "changeType": "created"}])
        self.assertEqual(antwort.status_code, 202)
        self.assertEqual(frappe.db.get_value("PH Graph Abo", {"subscription_id": "sub-test-2"}, "benachrichtigungen") or 0, 0)
        graph_webhook(value=[{"subscriptionId": "sub-test-2", "clientState": "richtig", "changeType": "created"}])
        self.assertEqual(frappe.db.get_value("PH Graph Abo", {"subscription_id": "sub-test-2"}, "benachrichtigungen"), 1)
