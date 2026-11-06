"""bench --site <site> run-tests --app ph_microsoft --doctype "PH Postfach" – Mail-Regeln gegen Graph-Attrappe."""

import unittest

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_microsoft.ph_microsoft import mail
from ph_microsoft.ph_microsoft.einstellungen import cache_leeren
from ph_microsoft.tests.attrappe_graph import GraphAttrappe

PF = "testteam@platzhirsch.studio"
KUNDE = "kunde.ms-test@beispiel.invalid"


def nachricht(mid, absender, **kw):
    m = {"id": mid, "internetMessageId": f"<{mid}@test.invalid>", "subject": "Test", "from": {"emailAddress": {"address": absender, "name": "Max Muster"}},
         "toRecipients": [{"emailAddress": {"address": PF}}], "receivedDateTime": "2026-11-04T09:00:00Z", "sensitivity": "normal", "hasAttachments": False,
         "body": {"contentType": "html", "content": "<p>Hallo</p>"}, "internetMessageHeaders": []}
    m.update(kw)
    return m


class TestPHPostfach(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Microsoft Einstellungen", {"mail_sync_aktiv": 1, "interne_domains": "platzhirsch.studio", "anhaenge_uebernehmen": 0})
        cache_leeren()
        if not frappe.db.exists("PH Postfach", PF):
            frappe.get_doc({"doctype": "PH Postfach", "adresse": PF.upper(), "art": "Shared", "benutzer": [{"user": "Administrator", "lesen": 1, "senden": 1}]}).insert()
        frappe.local.ph_ms_mailcache = {}

    def tearDown(self):
        frappe.flags.ph_ms_graph_client = None
        frappe.db.rollback()
        cache_leeren()

    def test_adresse_normalisiert_und_status(self):
        pf = frappe.get_doc("PH Postfach", PF)
        self.assertEqual(pf.adresse, PF)
        pf.aktiv = 0
        pf.save()
        self.assertEqual(pf.status, "Pausiert")

    def test_rechte_auf_postfach(self):
        self.assertIn(PF, mail.erlaubte_postfaecher("Administrator"))
        self.assertNotIn(PF, mail.erlaubte_postfaecher("Guest"))

    def test_unbekannte_mail_wird_nicht_gespeichert(self):
        g = frappe.flags.ph_ms_graph_client = GraphAttrappe([("GET", "/messages/delta", {"value": [nachricht("m1", "fremd@beispiel.invalid")]})])
        mail.abholen(PF)
        self.assertFalse(frappe.db.exists("Communication", {"message_id": "<m1@test.invalid>"}))
        self.assertEqual(g.aufrufe_mit("GET", "/messages/m1"), [])  # nicht einmal der Inhalt wurde geladen
        self.assertTrue(frappe.db.get_value("PH Postfach", PF, "delta_json"))

    @unittest.skipUnless(frappe.db.exists("DocType", "PH Kontakt"), "ph_crm nicht installiert")
    def test_bekannte_mail_automatisch_und_aufheben(self):
        k = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "MS-Test", "email": KUNDE}).insert()
        m = nachricht("m2", KUNDE)
        frappe.flags.ph_ms_graph_client = GraphAttrappe([("GET", "/messages/delta", {"value": [m]}), ("GET", "/messages/m2", m)])
        self.assertEqual(mail.abholen(PF), 1)
        c = frappe.db.get_value("Communication", {"message_id": "<m2@test.invalid>"}, ["name", "ph_microsoft_zuordnung", "reference_name"], as_dict=True)
        self.assertEqual((c.ph_microsoft_zuordnung, c.reference_name), ("automatisch", k.name))
        mail.zuordnung_aufheben(c.name)
        self.assertFalse(frappe.db.exists("Communication", c.name))

    @unittest.skipUnless(frappe.db.exists("DocType", "PH Kontakt"), "ph_crm nicht installiert")
    def test_vertraulich_und_newsletter_nicht_automatisch(self):
        frappe.get_doc({"doctype": "PH Kontakt", "nachname": "MS-Test", "email": KUNDE}).insert()
        vertraulich = nachricht("m3", KUNDE, sensitivity="confidential")
        news = nachricht("m4", KUNDE, internetMessageHeaders=[{"name": "List-Unsubscribe", "value": "<mailto:x>"}])
        frappe.flags.ph_ms_graph_client = GraphAttrappe([("GET", "/messages/delta", {"value": [vertraulich, news]}), ("GET", "/messages/m4", news)])
        self.assertEqual(mail.abholen(PF), 0)
        self.assertFalse(frappe.db.exists("Communication", {"message_id": ("in", ["<m3@test.invalid>", "<m4@test.invalid>"])}))

    @unittest.skipUnless(frappe.db.exists("DocType", "PH Kontakt"), "ph_crm nicht installiert")
    def test_manuell_zuordnen_mit_adresse_merken_und_sperren(self):
        k = frappe.get_doc({"doctype": "PH Kontakt", "nachname": "MS-Test", "email": KUNDE}).insert()
        m = nachricht("m5", "privat.ms-test@beispiel.invalid")
        frappe.flags.ph_ms_graph_client = GraphAttrappe([("GET", "/messages", {"value": [m]}), ("GET", "/messages/m5", m)])
        liste = mail.unzugeordnet(PF, 14)
        self.assertEqual([x["message_id"] for x in liste], ["m5"])
        self.assertEqual(set(liste[0]) - {"vorschlaege"}, {"message_id", "postfach", "richtung", "absender", "absender_name", "gegenadresse", "betreff", "datum", "grund", "vertraulich"})
        r = mail.zuordnen("m5", PF, "PH Kontakt", k.name, adresse_merken=1)
        self.assertTrue(r["adresse_gemerkt"])
        frappe.local.ph_ms_mailcache = {}
        self.assertEqual(mail.treffer("privat.ms-test@beispiel.invalid"), [("PH Kontakt", k.name)])
        mail.adresse_sperren("werbung.ms-test@beispiel.invalid")
        self.assertIn("werbung.ms-test@beispiel.invalid", mail.gesperrte_adressen() | set(frappe.get_all("PH Mail Adresse", filters={"art": "Sperre"}, pluck="adresse")))

    def test_senden_testmodus_und_rechte(self):
        from ph_core.api import ApiFehler

        g = frappe.flags.ph_ms_graph_client = GraphAttrappe([("POST", "/sendMail", {})])
        with self.assertRaises(ApiFehler):
            mail.senden("x@beispiel.invalid", "Betreff", "<p>x</p>", von="fremd@platzhirsch.studio")
        r = mail.senden("x@beispiel.invalid", "Betreff", "<p>x</p>", von=PF)
        self.assertTrue(r["communication"])
        gesendet = g.aufrufe_mit("POST", "/sendMail")[0][2]["message"]
        marke = gesendet["internetMessageHeaders"][0]["value"]
        self.assertEqual(frappe.db.get_value("Communication", r["communication"], "ph_microsoft_graph_id"), f"ph:{marke}")
        # Kopie aus „Gesendete Elemente“ legt keine zweite Communication an, sondern ergänzt die Kennungen
        kopie = nachricht("s1", PF, toRecipients=[{"emailAddress": {"address": "x@beispiel.invalid"}}], internetMessageHeaders=[{"name": "X-PH-Mail-Id", "value": marke}])
        frappe.flags.ph_ms_graph_client = GraphAttrappe([("GET", "/messages/s1", kopie)])
        self.assertIsNone(mail.verarbeiten(kopie, PF, "SentItems"))
