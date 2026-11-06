import unittest
from datetime import datetime, timedelta

from ph_microsoft.logik import webhook as W


class TestWebhook(unittest.TestCase):
    def test_validierungs_handshake(self):
        self.assertEqual(W.validierungs_token({"validationToken": "Validation: Testing client application reachability"}), "Validation: Testing client application reachability")
        self.assertIsNone(W.validierungs_token({}))
        self.assertIsNone(W.validierungs_token({"validationToken": "a\nb"}))
        self.assertIsNone(W.validierungs_token({"validationToken": "x" * 3000}))

    def test_client_state(self):
        geheim = W.neues_client_state()
        self.assertLessEqual(len(geheim), 128)
        h = W.client_state_hash(geheim)
        self.assertTrue(W.client_state_passt(geheim, h))
        self.assertFalse(W.client_state_passt("falsch", h))
        self.assertFalse(W.client_state_passt(None, h))
        self.assertFalse(W.client_state_passt(geheim, None))

    def test_benachrichtigungen_filtern(self):
        geheim = W.neues_client_state()
        abos = {"sub-1": W.client_state_hash(geheim)}
        body = {"value": [
            {"subscriptionId": "sub-1", "clientState": geheim, "changeType": "created", "resource": "Users/x/Messages/1", "resourceData": {"id": "1"}},
            {"subscriptionId": "sub-1", "clientState": "falsch", "changeType": "created"},
            {"subscriptionId": "sub-unbekannt", "clientState": geheim},
            {"subscriptionId": "sub-1", "clientState": geheim, "lifecycleEvent": "reauthorizationRequired"},
            "kein-dict",
        ]}
        gueltig, abgelehnt = W.benachrichtigungen(body, abos.get)
        self.assertEqual(len(gueltig), 2)
        self.assertEqual(abgelehnt, 3)
        self.assertEqual(gueltig[0]["ressource_id"], "1")
        self.assertEqual(gueltig[1]["lifecycle"], "reauthorizationrequired")

    def test_laufzeit_und_erneuern(self):
        jetzt = datetime(2026, 11, 4, 12, 0)
        ablauf = W.ablauf_neu(jetzt)
        self.assertLessEqual(ablauf - jetzt, timedelta(minutes=W.MAX_MINUTEN_OUTLOOK))
        self.assertFalse(W.erneuern_noetig(ablauf, jetzt))
        self.assertTrue(W.erneuern_noetig(jetzt + timedelta(hours=10), jetzt))
        self.assertTrue(W.erneuern_noetig(None, jetzt))
        self.assertEqual(W.iso_utc(jetzt), "2026-11-04T12:00:00.0000000Z")


if __name__ == "__main__":
    unittest.main()
