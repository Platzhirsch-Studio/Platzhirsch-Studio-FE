"""bench --site <site> run-tests --app ph_ablage --doctype "PH Datei" """

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_ablage import api
from ph_ablage.ph_ablage import dienste
from ph_ablage.tests.helfer import aufraeumen, einstellungen_fuer_tests, hochladen, testordner


class TestPHDatei(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()
        self.ordner = testordner()

    def tearDown(self):
        aufraeumen()
        frappe.db.rollback()

    def test_upload_version_schluessel(self):
        erg = hochladen(self.ordner, "Angebot Küche.txt", b"Version 1")
        d = frappe.get_doc("PH Datei", erg["datei"])
        self.assertEqual(d.status, "Aktiv")
        self.assertEqual(d.aktuelle_version, 1)
        v = d.versionen[0]
        self.assertTrue(v.schluessel.startswith("test/"))
        self.assertNotIn("Küche", v.schluessel)  # Dateiname nie im Speicher
        self.assertEqual(v.geprueft, 1)
        hochladen(self.ordner, inhalt=b"Version 2", datei=d.name)
        d.reload()
        self.assertEqual(d.aktuelle_version, 2)
        self.assertEqual(len(d.versionen), 2)

    def test_pruefsumme_falsch(self):
        import base64

        from ph_ablage.ph_ablage import upload
        from ph_core.api import ApiFehler

        s = upload.start(ordner=self.ordner, dateiname="x.txt", groesse=3)
        upload.chunk(s["token"], 0, base64.b64encode(b"abc").decode())
        with self.assertRaises(ApiFehler) as e:
            upload.abschliessen(s["token"], "0" * 64)
        self.assertEqual(e.exception.code, "checksum_mismatch")

    def test_gesperrte_endung(self):
        r = api.upload_start(ordner=self.ordner, dateiname="tool.exe", groesse=10)
        self.assertEqual(r["code"], "blocked_type")
        self.assertEqual(frappe.local.response["http_status_code"], 415)

    def test_pflichtfeld_fehlt(self):
        r = api.upload_start(ordner=self.ordner, dateiname="", groesse=10)
        self.assertEqual(r["code"], "invalid")

    def test_umbenennen_ohne_speicher(self):
        erg = hochladen(self.ordner, "plan.dwg", b"AC1032....")
        alt = frappe.get_doc("PH Datei", erg["datei"]).versionen[0].schluessel
        r = api.umbenennen(datei=erg["datei"], dateiname="Grundriss EG")
        self.assertEqual(r["dateiname"], "Grundriss EG.dwg")
        self.assertEqual(frappe.get_doc("PH Datei", erg["datei"]).versionen[0].schluessel, alt)

    def test_duplikat_erkennung(self):
        a = hochladen(self.ordner, "a.txt", b"gleich")
        b = hochladen(self.ordner, "b.txt", b"gleich")
        self.assertTrue(b["duplikat"])
        self.assertEqual(b["duplikate"][0]["datei"], a["datei"])

    def test_checkout_sperrt_andere(self):
        erg = hochladen(self.ordner, "c.txt", b"inhalt")
        d = frappe.get_doc("PH Datei", erg["datei"])
        dienste.sperren(d, 2)
        d.reload()
        frappe.db.set_value("PH Datei", d.name, "gesperrt_von", "Guest")  # anderer Benutzer
        r = api.umbenennen(datei=d.name, dateiname="neu.txt")
        self.assertEqual(r["code"], "locked")

    def test_papierkorb_und_beleg_sperre(self):
        erg = hochladen(self.ordner, "d.txt", b"beleg")
        r = api.aufbewahrung_setzen(datei=erg["datei"], aufbewahrungsklasse="Beleg")
        self.assertEqual(r["loeschsperre"], 1)
        r = api.loeschen(datei=erg["datei"])
        self.assertEqual(r["code"], "locked")
        api.aufbewahrung_setzen(datei=erg["datei"], aufbewahrungsklasse="Allgemein")
        r = api.loeschen(datei=erg["datei"])
        self.assertEqual(r["status"], "Papierkorb")
        r = api.wiederherstellen(datei=erg["datei"])
        self.assertEqual(r["status"], "Aktiv")

    def test_version_wiederherstellen(self):
        erg = hochladen(self.ordner, "e.txt", b"eins")
        hochladen(self.ordner, inhalt=b"zwei", datei=erg["datei"])
        r = api.version_wiederherstellen(datei=erg["datei"], version=1)
        self.assertEqual(r["version"], 3)
        d = frappe.get_doc("PH Datei", erg["datei"])
        self.assertEqual(d.versionen[2].schluessel, d.versionen[0].schluessel)

    def test_download_proxy_und_suche(self):
        erg = hochladen(self.ordner, "Notiz Arbeitsplatte.txt", b"Eiche geoelt")
        r = api.download_link(datei=erg["datei"])
        self.assertEqual(r["art"], "proxy")
        self.assertIn("ph_ablage.api.herunterladen?dl=", r["url"])
        treffer = api.suche(q="Arbeitsplatte")
        self.assertIn(erg["datei"], [t["datei"] for t in treffer])

    def test_endgueltig_loescht_objekt(self):
        from ph_ablage import speicher

        erg = hochladen(self.ordner, "f.txt", b"weg")
        d = frappe.get_doc("PH Datei", erg["datei"])
        schluessel = d.versionen[0].schluessel
        dienste.in_papierkorb(d)
        dienste.endgueltig_loeschen(frappe.get_doc("PH Datei", d.name))
        self.assertFalse(speicher.speicher_fuer("lokal").exists(schluessel))
        self.assertTrue(frappe.db.exists("PH Ablage Ereignis", {"datei": d.name, "art": "Endgueltig geloescht"}))
