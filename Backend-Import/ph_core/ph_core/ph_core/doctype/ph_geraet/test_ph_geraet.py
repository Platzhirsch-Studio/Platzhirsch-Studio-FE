"""Site-Tests (bench --site <site> run-tests --app ph_core): PH Geraet und API geraete/bediener/suche/aktivitaet."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_core.utils.geraete import token_hash


def _geraet(**werte):
    daten = {"doctype": "PH Geraet", "geraetename": "Test iPad Kassa", "typ": "Kassa", "standort": "Showroom Lochau"}
    daten.update(werte)
    return frappe.get_doc(daten).insert()


class TestPHGeraet(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Geraet", {"geraetename": ("like", "Test %")})

    def test_anlegen_arbeitsplatz_aus_typ(self):
        g = _geraet()
        self.assertTrue(g.name.startswith("PH-GER-"))
        self.assertEqual(g.arbeitsplatz, "kassa")
        self.assertEqual(g.aktiv, 1)
        self.assertFalse(g.token_hash)
        p = _geraet(geraetename="Test Packtisch", typ="Packtisch")
        self.assertEqual(p.arbeitsplatz, "packtisch")

    def test_registrieren_gibt_token_einmal(self):
        g = _geraet()
        r = g.registrieren()
        self.assertEqual(len(r["token"]), 43)
        g.reload()
        self.assertEqual(g.token_hash, token_hash(r["token"]))
        self.assertEqual(g.token_vorhanden, 1)
        with self.assertRaises(frappe.ValidationError):
            g.registrieren()
        r2 = g.token_erneuern()
        self.assertNotEqual(r["token"], r2["token"])
        g.reload()
        self.assertEqual(g.token_hash, token_hash(r2["token"]))

    def test_sperren_entsperren(self):
        g = _geraet()
        g.sperren("Gerät verloren")
        g.reload()
        self.assertEqual(g.aktiv, 0)
        self.assertEqual(g.gesperrt_grund, "Gerät verloren")
        g.entsperren()
        g.reload()
        self.assertEqual(g.aktiv, 1)
        self.assertFalse(g.gesperrt_grund)

    def test_unbekannte_kasse(self):
        if not frappe.db.exists("DocType", "PH Kasse"):
            self.skipTest("ph_kassa nicht installiert")
        with self.assertRaises(frappe.ValidationError):
            _geraet(kasse="GIBT-ES-NICHT")

    def test_api_register_verify_touch_list(self):
        from ph_core.api.geraete import list_devices, register_device, touch_device, verify_device

        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        r = register_device(geraetename="Test API Gerät", typ="Packtisch", standort="Lager")
        self.assertIn("token", r)
        self.assertEqual(r["arbeitsplatz"], "packtisch")
        v = verify_device(token=r["token"])
        self.assertEqual(v["geraet"], r["geraet"])
        self.assertNotIn("token_hash", v)
        t = touch_device(token=r["token"])
        self.assertTrue(t["ok"])
        falsch = verify_device(token="x" * 43)
        self.assertEqual(falsch.get("code"), "invalid_token")
        liste = list_devices()
        self.assertTrue(any(g["geraet"] == r["geraet"] for g in liste))
        self.assertTrue(all("token_hash" not in g for g in liste))
        frappe.get_doc("PH Geraet", r["geraet"]).sperren("Test")
        gesperrt = verify_device(token=r["token"])
        self.assertEqual(gesperrt.get("code"), "forbidden")

    def test_api_pin(self):
        from ph_core.api.bediener import list_operators, set_pin, verify_pin

        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        g = _geraet(geraetename="Test PIN Gerät", standort="Showroom Lochau")
        token = g.registrieren()["token"]
        frappe.db.commit()  # ph_api rollt bei Fehlerantworten zurück – Gerät muss bestehen bleiben
        self.assertEqual(set_pin(pin="1111").get("code"), "invalid")
        r = set_pin(pin="2580", user="Administrator")
        self.assertTrue(r["ok"])
        self.assertTrue(frappe.db.get_value("User", "Administrator", "ph_core_pin_hash").startswith("pbkdf2_sha256$"))
        v = verify_pin(email="Administrator", pin="2580", geraet_token=token)
        self.assertEqual(v["user"], "Administrator")
        self.assertIsInstance(v["roles"], list)
        self.assertEqual(verify_pin(email="Administrator", pin="0000", geraet_token=token).get("code"), "invalid_pin")
        self.assertEqual(verify_pin(email="Administrator", pin="2580", geraet_token="falsch" * 8).get("code"), "invalid_token")
        ops = list_operators(geraet_token=token)
        self.assertIsInstance(ops, list)
        self.assertTrue(all("pin_hash" not in o and "ph_core_pin_hash" not in o for o in ops))
        frappe.db.set_value("User", "Administrator", {"ph_core_pin_hash": None, "ph_core_pin_gesetzt_am": None})

    def test_api_suche_und_aktivitaet(self):
        from ph_core.api.aktivitaet import recent_activity
        from ph_core.api.suche import global_search

        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        g = _geraet(geraetename="Test Suche Gerät")
        frappe.db.commit()
        treffer = global_search(q="Test Suche", doctypes=["PH Geraet"])
        self.assertTrue(any(t["doctype"] == "PH Geraet" and t["name"] == g.name for t in treffer))
        self.assertEqual(global_search(q="x"), [])
        akt = recent_activity(limit=10, bereiche=["zentrale"])
        self.assertIsInstance(akt, list)
        for e in akt:
            self.assertIn("zeit", e)
            self.assertIn("art", e)
