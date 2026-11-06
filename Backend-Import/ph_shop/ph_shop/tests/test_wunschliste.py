"""Tests ohne Site: Wunschliste-Datensatz der Website (src/lib/wunschliste/model.js) ↔ Felder von PH Wunschliste."""

import copy
import hashlib
import unittest

from ph_shop import wunschliste as wl


def sha(x):
    return hashlib.sha256(x.encode()).hexdigest()


def key(x):
    return sha(x)[:16]


def record():
    """Wie createRecord() + reserveItem() + addContribution() der Website."""
    k1, k2 = key("1-Sessel-Minotti"), key("2-Lampe-Flos")
    return {
        "v": 1,
        "listId": "A" * 32,
        "shareHash": sha("share"),
        "shareSealed": "aXY.dGFn.ZGF0YQ",
        "adminHash": sha("admin"),
        "ref": "WL-7K3Q-9PX2",
        "status": "aktiv",
        "locale": "de",
        "occasion": "einzug",
        "title": "Unser neues Wohnzimmer",
        "date": "2026-12-24",
        "message": "Danke!",
        "items": [
            {"key": k1, "name": "Sessel", "brand": "Minotti", "image": "/cmx/files/sessel.jpg", "href": "/produkte/sessel"},
            {"key": k2, "name": "Lampe", "brand": "Flos", "image": None, "href": None},
        ],
        "reservations": {k1: {"at": "2026-11-04T10:00:00.000Z", "cancelHash": sha("cancel"), "name": "Oma", "note": "kommt mit Schleife"}},
        "contributions": [
            {"id": "abc123def456", "at": "2026-11-04T11:00:00.000Z", "amount": 50, "name": "Max", "email": "max@example.com", "message": "Alles Gute", "showName": True, "consentAt": "2026-11-04T11:00:00.000Z", "channel": "anfrage", "status": "angefragt"},
            {"id": "zzz999yyy888", "at": "2026-11-04T12:00:00.000Z", "amount": None, "name": "Eva", "email": "eva@example.org", "message": "", "showName": False, "consentAt": None, "channel": "stripe", "status": "offen"},
        ],
        "createdAt": "2026-11-04T09:00:00.000Z",
        "updatedAt": "2026-11-04T12:00:00.000Z",
        "expiresAt": "2027-12-24T23:59:59.000Z",
    }


ident = lambda x: x  # noqa: E731 – Zeiten ohne Site unverändert durchreichen


class TestWunschliste(unittest.TestCase):
    def test_hin_und_zurueck_gleich(self):
        r = record()
        werte = wl.record_zu_werten(r, ident)
        self.assertEqual((werte["status"], werte["anlass"], werte["list_id"]), ("Aktiv", "einzug", "A" * 32))
        self.assertEqual(werte["positionen"][0]["reserviert"], 1)
        self.assertEqual(werte["positionen"][1]["reserviert"], 0)
        self.assertEqual(werte["beitraege"][0]["betrag_cent"], 5000)
        self.assertEqual(werte["beitraege"][1]["name_anzeigen"], 0)
        zurueck = wl.werte_zu_record(werte, ident, email_maskieren=False)
        self.assertEqual(zurueck, r)

    def test_email_maskiert_und_beim_speichern_erhalten(self):
        werte = wl.record_zu_werten(record(), ident)
        aus = wl.werte_zu_record(werte, ident)
        self.assertEqual(aus["contributions"][0]["email"], "m***@e***.com")
        self.assertNotIn("max@example.com", str(aus))
        # Website schickt den Datensatz mit maskierter E-Mail zurück → gespeicherte Adresse bleibt.
        alte = {b["beitrag_id"]: b["schenker_email"] for b in werte["beitraege"]}
        wieder = wl.record_zu_werten(aus, ident, alte)
        self.assertEqual(wieder["beitraege"][0]["schenker_email"], "max@example.com")
        self.assertEqual(wieder["beitraege"][1]["schenker_email"], "eva@example.org")

    def test_pruefung(self):
        for feld, wert in (("listId", "kurz"), ("shareHash", "x" * 64), ("occasion", "party"), ("status", "geloescht"), ("items", []), ("date", "24.12.2026"), ("title", "x")):
            r = record()
            r[feld] = wert
            with self.assertRaises(wl.RecordFehler) as cm:
                wl.pruefe_record(r)
            self.assertEqual(cm.exception.feld, feld)
        r = record()
        r["reservations"] = {"0" * 16: {"at": None}}
        with self.assertRaises(wl.RecordFehler):
            wl.pruefe_record(r)
        r = record()
        r["contributions"].append(copy.deepcopy(r["contributions"][0]))
        with self.assertRaises(wl.RecordFehler):
            wl.pruefe_record(r)  # doppelte Beitrags-ID
        r = record()
        r["contributions"][0]["amount"] = 6000
        with self.assertRaises(wl.RecordFehler):
            wl.pruefe_record(r)  # über LIMITS.contributionMax
        with self.assertRaises(wl.RecordFehler):
            wl.pruefe_record(record(), list_id="B" * 32)
        self.assertTrue(wl.pruefe_record(record(), list_id="A" * 32))

    def test_widerrufen_und_hash_vergleich(self):
        r = record()
        r["status"] = "widerrufen"
        self.assertEqual(wl.werte_zu_record(wl.record_zu_werten(r, ident), ident)["status"], "widerrufen")
        self.assertTrue(wl.hash_gleich(sha("admin"), sha("admin")))
        self.assertFalse(wl.hash_gleich(sha("admin"), sha("andere")))
        self.assertFalse(wl.hash_gleich(None, sha("admin")))
        self.assertFalse(wl.hash_gleich("admin", "admin"))

    def test_maske(self):
        self.assertEqual(wl.maske_email("a@b.at"), "a***@b***.at")
        self.assertEqual(wl.maske_email(""), "")
        self.assertTrue(wl.ist_maskiert(wl.maske_email("x@y.de")))


if __name__ == "__main__":
    unittest.main()
