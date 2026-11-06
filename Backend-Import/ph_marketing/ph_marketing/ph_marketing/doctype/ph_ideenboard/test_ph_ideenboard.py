"""bench --site <site> run-tests --app ph_marketing --doctype "PH Ideenboard" – Speicher-Schnittstelle der Website."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_core.api import ApiFehler
from ph_marketing.ph_marketing import ideenboard
from ph_marketing.utils import ideenboard as ib

BOARD = "T" * 32


def record(**kw):
    r = {"v": 1, "boardId": BOARD, "shareHash": ib.sha256("S" * 32), "adminHash": ib.sha256("A" * 32), "status": "aktiv", "createdAt": "2026-11-04T09:00:00.000Z", "updatedAt": "2026-11-04T09:00:00.000Z", "expiresAt": "2099-11-04T09:00:00.000Z", "cards": [{"type": "moebel", "title": "Sofa", "href": "/de/produkte/sofa"}, {"type": "notiz", "note": "Helles Holz"}]}
    r.update(kw)
    return r


class TestPHIdeenboard(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        if frappe.db.exists("PH Ideenboard", BOARD):
            frappe.delete_doc("PH Ideenboard", BOARD, force=True)

    def test_anlegen_lesen_teilen(self):
        r = ideenboard.anlegen(record())
        self.assertEqual(r["boardId"], BOARD)
        self.assertEqual(len(r["cards"]), 2)
        self.assertEqual(r["updatedAt"], "2026-11-04T09:00:00.000Z")
        doc = frappe.get_doc("PH Ideenboard", BOARD)
        self.assertEqual(doc.status, "Aktiv")
        self.assertTrue(doc.titel.startswith("Sofa"))
        self.assertEqual(ideenboard.lesen_per_share(share_id="S" * 32)["boardId"], BOARD)
        self.assertEqual(ideenboard.lesen_per_share(share_hash=ib.sha256("S" * 32))["boardId"], BOARD)
        self.assertIsNone(ideenboard.lesen_per_share(share_id="X" * 32))

    def test_doppelt_und_leer(self):
        ideenboard.anlegen(record())
        with self.assertRaises(ApiFehler) as e:
            ideenboard.anlegen(record())
        self.assertEqual(e.exception.code, "conflict")
        with self.assertRaises(ApiFehler) as e:
            ideenboard.anlegen(record(boardId="U" * 32, shareHash=ib.sha256("U"), cards=[]))
        self.assertEqual(e.exception.code, "empty")

    def test_aendern_widerrufen_erneuern_konflikt(self):
        r = ideenboard.anlegen(record())
        neu = dict(r, status="widerrufen", updatedAt="2026-11-05T09:00:00.000Z", shareHash=ib.sha256("N" * 32))
        r2 = ideenboard.aendern(BOARD, neu, erwartet=r["updatedAt"])
        self.assertEqual(r2["status"], "widerrufen")
        self.assertEqual(r2["adminHash"], r["adminHash"])
        self.assertIsNone(ideenboard.lesen_per_share(share_id="S" * 32))
        with self.assertRaises(ApiFehler) as e:
            ideenboard.aendern(BOARD, neu, erwartet=r["updatedAt"])
        self.assertEqual(e.exception.code, "conflict")
        with self.assertRaises(ApiFehler) as e:
            ideenboard.aendern("V" * 32, neu)
        self.assertEqual(e.exception.code, "not_found")

    def test_ablauf_und_entfernen(self):
        ideenboard.anlegen(record(expiresAt="2026-01-01T00:00:00.000Z"))
        self.assertIsNone(ideenboard.lesen(BOARD))
        self.assertFalse(frappe.db.exists("PH Ideenboard", BOARD))
        ideenboard.anlegen(record())
        self.assertTrue(ideenboard.entfernen(BOARD))
        self.assertFalse(ideenboard.entfernen(BOARD))

    def test_sweep(self):
        ideenboard.anlegen(record(expiresAt="2026-01-01T00:00:00.000Z"))
        r = ideenboard.abgelaufene_loeschen()
        self.assertGreaterEqual(r["removed"], 1)
        self.assertEqual(r["orphans"], 0)

    def test_api_idempotent(self):
        from ph_marketing import api

        r1 = api.create_ideenboard(record=record(), idempotency_key="test-ideenboard-1")
        r2 = api.create_ideenboard(record=record(), idempotency_key="test-ideenboard-1")
        self.assertEqual(r1, r2)
        self.assertEqual(api.get_ideenboard(board_id=BOARD)["record"]["boardId"], BOARD)
        self.assertEqual(api.remove_ideenboard(board_id=BOARD), {"removed": True})
        self.assertIsNone(api.get_ideenboard(board_id=BOARD)["record"])
