"""bench --site <site> run-tests --app ph_marketing --doctype "PH Bewertung" – Rückmeldung, Veröffentlichung, Liste."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_core.api import ApiFehler
from ph_marketing.ph_marketing import bewertung


class TestPHBewertung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.delete("PH Bewertung", {"seite": "/test/bewerten"})

    def _neu(self, **kw):
        d = {"sterne": 4, "text": "Lieferung pünktlich, Rückruf unter 0664 1234567.", "name": "Anna Maria Muster", "email": "Anna@Example.at", "anlass": "lieferung", "seite": "/test/bewerten"}
        d.update(kw)
        return bewertung.anlegen(d)

    def test_anlegen_maskiert(self):
        r = self._neu()
        self.assertEqual(r["status"], "Neu")
        self.assertEqual(r["email"], "a***@example.at")
        doc = frappe.get_doc("PH Bewertung", r["referenz"])
        self.assertEqual(doc.autor_anzeige, "Anna M.")
        self.assertEqual(doc.anlass, "Lieferung")
        self.assertTrue(doc.titel.startswith("4 ★"))

    def test_pflicht_und_sterne(self):
        with self.assertRaises(ApiFehler):
            self._neu(sterne=None, text="")
        with self.assertRaises(ApiFehler):
            self._neu(sterne=7)
        with self.assertRaises(ApiFehler):
            self._neu(einwilligung_veroeffentlichung=1, textversion="")

    def test_veroeffentlichen_nur_mit_einwilligung(self):
        ohne = frappe.get_doc("PH Bewertung", self._neu()["referenz"])
        with self.assertRaises(frappe.ValidationError):
            ohne.veroeffentlichen()
        mit = frappe.get_doc("PH Bewertung", self._neu(sterne=1, einwilligung_veroeffentlichung=1, textversion="bewerten-2026-11")["referenz"])
        mit.veroeffentlichen()
        liste = bewertung.oeffentlich(limit=100)
        eintrag = next(x for x in liste["reviews"] if x["id"] == mit.name)
        self.assertEqual(eintrag["rating"], 1)  # auch schlechte Bewertungen erscheinen (kein Gating)
        self.assertEqual(eintrag["author"], "Anna M.")
        self.assertNotIn("1234567", eintrag["text"])
        self.assertNotIn(ohne.name, [x["id"] for x in liste["reviews"]])

    def test_ausblenden_nur_aus_grund(self):
        doc = frappe.get_doc("PH Bewertung", self._neu()["referenz"])
        with self.assertRaises(frappe.ValidationError):
            doc.ausblenden("Zu wenige Sterne")
        doc.ausblenden("Spam")
        self.assertEqual(doc.status, "Ausgeblendet")

    def test_api_idempotent(self):
        from ph_marketing import api

        d = {"sterne": 5, "text": "Sehr gute Beratung", "seite": "/test/bewerten", "idempotency_key": "test-bewertung-1"}
        r1 = api.create_bewertung(**dict(d))
        r2 = api.create_bewertung(**dict(d))
        self.assertEqual(r1["referenz"], r2["referenz"])
        self.assertIn("reviews", api.get_bewertungen(limit=5))
