"""bench --site <site> run-tests --app ph_ablage --doctype "PH Datei Freigabelink" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_to_date, now_datetime

from ph_ablage import api
from ph_ablage.tests.helfer import aufraeumen, einstellungen_fuer_tests, hochladen, testordner


class TestPHDateiFreigabelink(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests(freigabe_basis_url="https://backoffice.example/f/")
        self.datei = hochladen(testordner(), "freigabe.txt", b"fuer extern")["datei"]

    def tearDown(self):
        aufraeumen()
        frappe.db.rollback()

    def test_erstellen_und_aufloesen(self):
        r = api.freigabelink_erstellen(datei=self.datei, tage=3, passwort="geheim1", max_downloads=1)
        self.assertTrue(r["url"].startswith("https://backoffice.example/f/"))
        link = frappe.get_doc("PH Datei Freigabelink", r["freigabelink"])
        self.assertNotEqual(link.token_hash, r["token"])  # nur Hash gespeichert
        self.assertEqual(api.freigabe_aufloesen(token=r["token"])["code"], "password_required")
        self.assertEqual(api.freigabe_aufloesen(token=r["token"], passwort="falsch")["code"], "forbidden")
        info = api.freigabe_aufloesen(token=r["token"], passwort="geheim1", nur_info=1)
        self.assertEqual(info["dateiname"], "freigabe.txt")
        dl = api.freigabe_aufloesen(token=r["token"], passwort="geheim1")
        self.assertTrue(dl["url"])
        self.assertEqual(api.freigabe_aufloesen(token=r["token"], passwort="geheim1")["code"], "expired")  # Limit 1

    def test_ungueltig_abgelaufen_widerrufen(self):
        self.assertEqual(api.freigabe_aufloesen(token="gibtsnicht")["code"], "invalid_token")
        r = api.freigabelink_erstellen(datei=self.datei)
        frappe.db.set_value("PH Datei Freigabelink", r["freigabelink"], "ablauf", add_to_date(now_datetime(), minutes=-1))
        self.assertEqual(api.freigabe_aufloesen(token=r["token"])["code"], "expired")
        r2 = api.freigabelink_erstellen(datei=self.datei)
        api.freigabelink_widerrufen(freigabelink=r2["freigabelink"])
        self.assertEqual(api.freigabe_aufloesen(token=r2["token"])["code"], "invalid_token")

    def test_validierung(self):
        self.assertEqual(api.freigabelink_erstellen(datei=self.datei, tage=999)["code"], "invalid")
        self.assertEqual(api.freigabelink_erstellen(datei=self.datei, empfaenger_hinweis="a@b.at")["code"], "invalid")
