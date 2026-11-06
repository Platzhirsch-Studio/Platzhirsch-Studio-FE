"""Ideenboard-Regeln ohne Site: PYTHONPATH=. python -m unittest ph_marketing.tests.test_ideenboard

Erwartete cardKey-Werte mit Node aus src/lib/ideenboard/model.js berechnet (04.11.2026).
"""

import unittest
from datetime import datetime, timezone

from ph_marketing.utils import ideenboard as ib

T = "A" * 32
H = "a" * 64


def record(**kw):
    r = {"v": 1, "boardId": T, "shareHash": H, "adminHash": "b" * 64, "status": "aktiv", "createdAt": "2026-11-04T09:00:00.000Z", "updatedAt": "2026-11-04T09:00:00.000Z", "expiresAt": "2027-11-04T09:00:00.000Z", "cards": [{"type": "moebel", "title": "Sofa", "href": "/de/produkte/sofa", "image": "/cmx/files/a.jpg"}]}
    r.update(kw)
    return r


class TestKarten(unittest.TestCase):
    def test_card_key_wie_website(self):
        self.assertEqual(ib.card_key("moebel", "/de/produkte/sofa", "/cmx/files/a.jpg", "Sofa"), "ojww6sd7hrom")
        self.assertEqual(ib.card_key("notiz", None, None, "Grüne Wand – Ölfarbe 😀"), "1s0ou4d1wflotx")

    def test_sanitize_wie_website(self):
        k = ib.sanitize_card({"type": "moebel", "title": " <b>Sofa</b> ", "image": "/files/x y.jpg", "href": "//evil"})
        self.assertEqual(k["id"], "fax6fopxmapy")
        self.assertEqual(k["title"], "bSofa/b")
        self.assertIsNone(k["href"])
        self.assertEqual(k["image"], "/cms/files/x y.jpg")

    def test_unbrauchbare_karten(self):
        self.assertIsNone(ib.sanitize_card({"type": "fremd", "title": "x"}))
        self.assertIsNone(ib.sanitize_card({"type": "moebel"}))
        notiz = ib.sanitize_card({"type": "notiz", "note": "Nur Notiz", "image": "/cmx/a.jpg"})
        self.assertEqual(notiz["title"], "Nur Notiz")
        self.assertIsNone(notiz["image"])
        self.assertIsNone(ib.safe_image("https://fremd.example/a.jpg"))
        self.assertIsNone(ib.safe_href("/de/../x"))

    def test_board_dubletten_und_grenze(self):
        karten = [{"type": "moebel", "title": f"S{i}", "href": f"/de/p/{i}"} for i in range(70)]
        self.assertEqual(len(ib.sanitize_board({"cards": karten + karten[:3]})), 60)

    def test_zeile_hin_und_zurueck(self):
        k = ib.sanitize_card({"type": "moebel", "title": "Sofa", "nopin": True, "addedAt": "2026-11-01T10:00:00.000Z"})
        z = ib.karte_zu_zeile(k, 1)
        self.assertEqual(z["nopin"], 1)
        self.assertEqual(ib.zeile_zu_karte(z), k)


class TestRecord(unittest.TestCase):
    def test_neu_ok(self):
        w = ib.record_pruefen(record())
        self.assertEqual(w["board_id"], T)
        self.assertEqual(w["status"], "aktiv")
        self.assertEqual(len(w["cards"]), 1)

    def test_pflicht_und_form(self):
        for feld, wert in (("boardId", "kurz"), ("shareHash", "x"), ("adminHash", None), ("status", "offen"), ("expiresAt", "kein-datum")):
            with self.assertRaises(ib.BoardFehler) as e:
                ib.record_pruefen(record(**{feld: wert}))
            self.assertEqual(e.exception.feld, feld)
        with self.assertRaises(ib.BoardFehler) as e:
            ib.record_pruefen(record(cards=[]))
        self.assertEqual(e.exception.code, "empty")

    def test_update_ohne_admin(self):
        r = record()
        r.pop("adminHash")
        r.pop("boardId")
        r.pop("createdAt")
        w = ib.record_pruefen(r, neu=False)
        self.assertNotIn("created_at", w)

    def test_ablauf_standard_12_monate(self):
        w = ib.record_pruefen(record(expiresAt=None))
        self.assertEqual(w["expires_at"], "2027-11-04T09:00:00.000Z")

    def test_zeiten(self):
        self.assertEqual(ib.utc_iso(ib.iso_zu_utc("2026-11-04T10:00:00+01:00")), "2026-11-04T09:00:00.000Z")
        self.assertTrue(ib.abgelaufen("2026-11-04T09:00:00.000Z", datetime(2026, 11, 4, 9, 0, tzinfo=timezone.utc)))
        self.assertFalse(ib.abgelaufen("2026-11-04T09:00:01.000Z", datetime(2026, 11, 4, 9, 0, tzinfo=timezone.utc)))
        self.assertTrue(ib.abgelaufen(None))
        self.assertEqual(ib.add_months(datetime(2026, 1, 31, tzinfo=timezone.utc), 1).date().isoformat(), "2026-03-03")

    def test_sichten(self):
        r = record(cards=ib.sanitize_board(record()["cards"]))
        p = ib.public_view(r)
        self.assertEqual(set(p), {"updatedAt", "cards"})
        self.assertNotIn("addedAt", p["cards"][0])
        self.assertEqual(ib.owner_view(r)["count"], 1)
        self.assertEqual(ib.sha256("x"), "2d711642b726b04401627ca9fbac32f5c8530fb1903cc4db02258717921a4881")


if __name__ == "__main__":
    unittest.main()
