"""bench --site <site> run-tests --app ph_marketing --doctype "PH Newsletter Abo"

DOI-Fluss, neutrale Duplikat-Antwort, Token-Ablauf, Abmeldung per Token, Löschung unbestätigter Abos.
Mails gehen im Testmodus (PH Einstellungen) an das Team-Postfach; frappe.sendmail landet in der Email Queue, nichts verlässt die Site.
"""

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, add_to_date, now_datetime

from ph_marketing.api import confirm_newsletter, subscribe_newsletter, unsubscribe
from ph_marketing.ph_marketing import newsletter
from ph_marketing.utils.token import hash_token, neuer_token

ABO = "PH Newsletter Abo"


class TestPHNewsletterAbo(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.db.set_single_value("PH Einstellungen", "testmodus", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.cache().delete_value("ph_marketing:einstellungen")
        frappe.flags.mute_emails = True
        for e in ("doi1@example.com", "doi2@example.com", "alt@example.com", "weg@example.com"):
            frappe.db.delete(ABO, {"email": e})
            frappe.db.delete("PH Einwilligung", {"email": e})

    def _token_setzen(self, email):
        token = neuer_token()
        frappe.db.set_value(ABO, email, {"doi_token_hash": hash_token(token), "doi_gesendet_am": now_datetime()})
        return token

    def test_doi_fluss(self):
        r = subscribe_newsletter(email="DOI1@example.com", sprache="de", quelle="/de/newsletter")
        self.assertTrue(r["success"])
        abo = frappe.get_doc(ABO, "doi1@example.com")
        self.assertEqual(abo.status, "Angemeldet unbestaetigt")
        self.assertTrue(abo.doi_token_hash)
        self.assertTrue(abo.einwilligung)
        self.assertEqual(frappe.db.get_value("PH Einwilligung", abo.einwilligung, "status"), "Offen")
        token = self._token_setzen(abo.name)
        r2 = confirm_newsletter(token=token)
        self.assertEqual(r2["status"], "bestaetigt")
        abo.reload()
        self.assertEqual(abo.status, "Aktiv")
        self.assertTrue(abo.doi_bestaetigt_am)
        self.assertFalse(abo.doi_token_hash)
        self.assertTrue(abo.abmelde_token_hash)
        self.assertEqual(frappe.db.get_value("PH Einwilligung", abo.einwilligung, "status"), "Bestaetigt")
        # zweiter Klick: bereits bestätigt, kein Fehler
        self.assertEqual(newsletter.bestaetigen(token)["status"], "ungueltig")  # Token wurde gelöscht

    def test_duplikat_antwort_neutral(self):
        a = subscribe_newsletter(email="doi2@example.com")
        b = subscribe_newsletter(email="doi2@example.com")
        self.assertEqual(a["success"], b["success"])
        self.assertEqual(frappe.db.count(ABO, {"email": "doi2@example.com"}), 1)
        token = self._token_setzen("doi2@example.com")
        confirm_newsletter(token=token)
        c = subscribe_newsletter(email="doi2@example.com")
        self.assertTrue(c["success"])
        self.assertEqual(frappe.db.get_value(ABO, "doi2@example.com", "status"), "Aktiv")

    def test_token_ungueltig_und_abgelaufen(self):
        with self.assertRaises(Exception):
            confirm_newsletter(token="x" * 30)  # ApiFehler invalid_token (vom Decorator als 404 beantwortet)
        subscribe_newsletter(email="alt@example.com")
        token = self._token_setzen("alt@example.com")
        frappe.db.set_value(ABO, "alt@example.com", "doi_gesendet_am", add_to_date(now_datetime(), hours=-72))
        self.assertEqual(newsletter.bestaetigen(token)["status"], "abgelaufen")
        self.assertEqual(frappe.db.get_value(ABO, "alt@example.com", "status"), "Angemeldet unbestaetigt")

    def test_abmeldung_per_token(self):
        subscribe_newsletter(email="weg@example.com")
        confirm_newsletter(token=self._token_setzen("weg@example.com"))
        token = neuer_token()
        frappe.db.set_value(ABO, "weg@example.com", "abmelde_token_hash", hash_token(token))
        r = unsubscribe(token=token)
        self.assertEqual(r["status"], "abgemeldet")
        abo = frappe.get_doc(ABO, "weg@example.com")
        self.assertEqual(abo.status, "Abgemeldet")
        self.assertEqual(abo.abmelde_kanal, "link")
        self.assertEqual(frappe.db.get_value("PH Einwilligung", {"email": "weg@example.com", "zweck": "newsletter"}, "status"), "Widerrufen")
        self.assertEqual(unsubscribe(token=token)["status"], "bereits_abgemeldet")

    def test_status_nicht_von_hand(self):
        subscribe_newsletter(email="alt@example.com")
        abo = frappe.get_doc(ABO, "alt@example.com")
        abo.status = "Aktiv"
        with self.assertRaises(frappe.ValidationError):
            abo.save()

    def test_unbestaetigte_loeschen_nach_30_tagen(self):
        subscribe_newsletter(email="alt@example.com")
        frappe.db.set_value(ABO, "alt@example.com", "angemeldet_am", add_days(now_datetime(), -31))
        n = newsletter.unbestaetigte_loeschen()
        self.assertGreaterEqual(n, 1)
        self.assertFalse(frappe.db.exists(ABO, "alt@example.com"))
        self.assertFalse(frappe.db.exists("PH Einwilligung", {"email": "alt@example.com", "status": "Offen"}))
