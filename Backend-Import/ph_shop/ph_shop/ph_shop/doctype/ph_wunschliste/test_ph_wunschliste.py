"""bench --site <site> run-tests --app ph_shop --doctype "PH Wunschliste" – Wunschliste-API (src/lib/wunschliste)
und Migration M6 (import_local_store)."""

import hashlib
import json
import secrets

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_shop.api import create_wishlist, get_wishlist, get_wishlist_by_share, import_local_store, remove_wishlist, update_wishlist


def sha(x):
    return hashlib.sha256(x.encode()).hexdigest()


def neuer_record():
    lid = secrets.token_urlsafe(24)[:32].ljust(32, "A")
    k = sha(f"1-Sessel-{lid}")[:16]
    return {
        "v": 1, "listId": lid, "shareHash": sha("s" + lid), "shareSealed": "aXY.dGFn.ZGF0YQ", "adminHash": sha("a" + lid),
        "ref": "WL-7K3Q-9PX2", "status": "aktiv", "locale": "de", "occasion": "hochzeit", "title": "Hochzeit Test",
        "date": None, "message": "", "items": [{"key": k, "name": "Sessel", "brand": "Minotti", "image": None, "href": "/produkte/sessel"}],
        "reservations": {}, "contributions": [], "createdAt": "2026-11-04T09:00:00.000Z", "updatedAt": "2026-11-04T09:00:00.000Z",
        "expiresAt": "2027-11-04T09:00:00.000Z",
    }


class TestPHWunschliste(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")

    def _status(self):
        return frappe.local.response.get("http_status_code", 200)

    def test_anlegen_lesen_teilen(self):
        r = neuer_record()
        a = create_wishlist(record=json.dumps(r))
        self.assertEqual(self._status(), 200)
        self.assertTrue(a["referenz"].startswith("PH-WL-"))
        doc = frappe.get_doc("PH Wunschliste", a["referenz"])
        self.assertEqual((doc.status, doc.anzahl_stuecke, doc.titel), ("Aktiv", 1, "WL-7K3Q-9PX2 · Hochzeit Test"))
        g = get_wishlist(list_id=r["listId"])
        self.assertTrue(g["found"])
        self.assertEqual(g["record"]["items"], r["items"])
        self.assertEqual(g["record"]["adminHash"], r["adminHash"])
        s = get_wishlist_by_share(share_hash=r["shareHash"])
        self.assertEqual(s["referenz"], a["referenz"])
        self.assertFalse(get_wishlist_by_share(share_hash=sha("unbekannt"))["found"])
        self.assertFalse(get_wishlist(list_id=r["listId"], admin_hash=sha("falsch"))["found"])

    def test_idempotent_und_pflicht(self):
        r = neuer_record()
        a = create_wishlist(record=r, idempotency_key=f"wl-{r['listId']}")
        b = create_wishlist(record=r, idempotency_key=f"wl-{r['listId']}")
        self.assertEqual(a["referenz"], b["referenz"])
        c = create_wishlist(record=r)  # ohne Schlüssel: gleiche listId + adminHash → vorhanden
        self.assertTrue(c["bereits_vorhanden"])
        fremd = dict(r, adminHash=sha("anderer"))
        self.assertEqual(create_wishlist(record=fremd)["code"], "conflict")
        ohne = neuer_record()
        ohne["items"] = []
        res = create_wishlist(record=ohne)
        self.assertEqual((res["code"], res["field"], self._status()), ("invalid", "items", 400))

    def test_update_mit_sperre_und_email_maske(self):
        r = neuer_record()
        create_wishlist(record=r)
        g = get_wishlist(list_id=r["listId"])
        rec = g["record"]
        key = rec["items"][0]["key"]
        rec["reservations"][key] = {"at": "2026-11-04T10:00:00.000Z", "cancelHash": sha("c"), "name": "Oma", "note": ""}
        rec["contributions"].append({"id": "b1", "at": "2026-11-04T10:00:00.000Z", "amount": 40, "name": "Max", "email": "max@example.com", "message": "", "showName": True, "consentAt": "2026-11-04T10:00:00.000Z", "channel": "anfrage", "status": "angefragt"})
        u = update_wishlist(list_id=r["listId"], record=rec, expected_modified=g["modified"])
        self.assertEqual(self._status(), 200)
        self.assertIn(key, u["record"]["reservations"])
        self.assertEqual(u["record"]["contributions"][0]["email"], "m***@e***.com")
        # Zweiter Schreiber mit altem Stand → 409
        alt = update_wishlist(list_id=r["listId"], record=rec, expected_modified=g["modified"])
        self.assertEqual((alt["code"], self._status()), ("conflict", 409))
        # Website schickt die maskierte E-Mail zurück → gespeicherte bleibt
        u2 = update_wishlist(list_id=r["listId"], record=u["record"], expected_modified=u["modified"])
        name = u2["referenz"]
        self.assertEqual(frappe.db.get_value("PH Wunschliste Beitrag", {"parent": name, "beitrag_id": "b1"}, "schenker_email"), "max@example.com")
        self.assertEqual(frappe.db.get_value("PH Wunschliste", name, "anzahl_reserviert"), 1)
        # adminHash ist unveränderlich
        bad = dict(u2["record"], adminHash=sha("neu"))
        self.assertEqual(update_wishlist(list_id=r["listId"], record=bad)["code"], "invalid")

    def test_widerruf_sperre_und_loeschen(self):
        r = neuer_record()
        a = create_wishlist(record=r)
        doc = frappe.get_doc("PH Wunschliste", a["referenz"])
        self.assertEqual(doc.sperren("Test"), "Widerrufen")
        self.assertEqual(get_wishlist(list_id=r["listId"])["record"]["status"], "widerrufen")
        self.assertFalse(remove_wishlist(list_id=r["listId"], admin_hash=sha("falsch"))["deleted"])
        self.assertTrue(remove_wishlist(list_id=r["listId"], admin_hash=r["adminHash"])["deleted"])
        self.assertFalse(frappe.db.exists("PH Wunschliste", a["referenz"]))
        self.assertEqual(update_wishlist(list_id=r["listId"], record=r)["code"], "not_found")


class TestImportLocalStore(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.db.set_single_value("PH Shop Einstellungen", "shop_modus", "test")

    def tearDown(self):
        frappe.db.set_single_value("PH Shop Einstellungen", "import_local_store_aktiv", 0)

    def test_schalter_aus(self):
        frappe.db.set_single_value("PH Shop Einstellungen", "import_local_store_aktiv", 0)
        self.assertEqual(import_local_store(bestellungen=[])["code"], "forbidden")

    def test_import_idempotent(self):
        frappe.db.set_single_value("PH Shop Einstellungen", "import_local_store_aktiv", 1)
        g = f"G-{secrets.token_hex(2).upper()}-M6TS"
        hash_ = sha(f"ph-voucher:IMPORT{secrets.token_hex(6)}")
        daten = {
            "gutschein_bestellungen": [{"id": g, "status": "bezahlt", "erstellt": "2026-10-01T10:00:00.000Z", "betrag_cent": 5000, "anzahl": 1, "motiv": "schlicht", "kaeufer": {"name": "Carla Test", "email": "carla@example.com"}, "session": "cs_test_x", "payment_intent": "pi_test_x", "livemode": False, "bezahlt": "2026-10-01T10:05:00.000Z"}],
            "gutscheine": [{"hash": hash_, "ende": "AB12", "bestellung": g, "wert_cent": 5000, "rest_cent": 3000, "status": "aktiv", "test": False, "ausgestellt": "2026-10-01T10:05:00.000Z", "einloesungen": [{"zeit": "2026-10-10T15:00:00.000Z", "cent": 2000, "beleg": "Kasse 1"}]}],
            "widerrufe": [{"id": f"W-{secrets.token_hex(2).upper()}-M6TS", "zeit": "2026-10-02T08:00:00.000Z", "name": "Carla Test", "email": "carla@example.com", "angabe": g, "nachricht": "Bitte stornieren"}],
            "anzahlungen": [{"id": "kaputt"}],
        }
        r = import_local_store(**daten)
        self.assertEqual(r["angelegt"]["gutschein_bestellungen"], 1)
        self.assertEqual(r["angelegt"]["gutscheine"], 1)
        self.assertEqual(r["angelegt"]["widerrufe"], 1)
        self.assertEqual([f["art"] for f in r["fehler"]], ["anzahlungen"])
        gs = frappe.get_doc("PH Gutschein", {"code_hash": hash_})
        self.assertEqual((gs.status, gs.rest_cent, gs.gutschein_bestellung, gs.quelle, len(gs.einloesungen)), ("Teilweise eingeloest", 3000, g, "import", 1))
        self.assertEqual(frappe.db.get_value("PH Gutschein Bestellung", g, "status"), "bezahlt")
        r2 = import_local_store(**daten)
        self.assertEqual(sum(r2["angelegt"].values()), 0)
        self.assertEqual(r2["uebersprungen"]["gutscheine"], 1)

    def test_probelauf(self):
        frappe.db.set_single_value("PH Shop Einstellungen", "import_local_store_aktiv", 1)
        hash_ = sha(f"ph-voucher:PROBE{secrets.token_hex(6)}")
        r = import_local_store(gutscheine=[{"hash": hash_, "ende": "ZZ99", "wert_cent": 1000, "rest_cent": 1000, "status": "aktiv"}], probelauf=1)
        self.assertEqual(r["angelegt"]["gutscheine"], 1)
        self.assertFalse(frappe.db.exists("PH Gutschein", {"code_hash": hash_}))
