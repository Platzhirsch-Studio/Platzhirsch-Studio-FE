"""bench --site <site> run-tests --app ph_projekte --doctype "PH Portal Sitzung"

Mehrere gültige Kunden-Tokens je Kontakt, Logout nur der eigenen Sitzung, Teamliste Bautagebuch, Standard-Planer,
E-Nummer/FD am Produktpass (Integration Runde 3)."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte import api
from ph_projekte.ph_projekte.doctype.ph_projekt.test_ph_projekt import TEST_EMAIL, testkontakt, testprojekt


class TestPHPortalSitzung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        self.kontakt = testkontakt()
        if frappe.get_meta("PH Kontakt").has_field("portal_aktiv"):
            frappe.db.set_value("PH Kontakt", self.kontakt, "portal_aktiv", 1)
        frappe.db.delete("PH Portal Sitzung", {"kontakt": self.kontakt})

    def _login(self):
        r = api.portal_login_token(email=TEST_EMAIL)
        self.assertTrue(r["found"])
        return r["kunde_token"]

    def test_zweiter_login_meldet_ersten_nicht_ab(self):
        t1 = self._login()
        api.portal_customer(kontakt=self.kontakt, kunde_token=t1)  # Aktivierung (erster Klick)
        t2 = self._login()
        self.assertEqual(api.portal_customer(kontakt=self.kontakt, kunde_token=t1)["id"], self.kontakt)
        self.assertEqual(api.portal_customer(kontakt=self.kontakt, kunde_token=t2)["id"], self.kontakt)
        self.assertEqual(frappe.db.count("PH Portal Sitzung", {"kontakt": self.kontakt, "status": "Aktiv"}), 2)

    def test_logout_nur_eigene_sitzung(self):
        t1, t2 = self._login(), self._login()
        api.portal_customer(kontakt=self.kontakt, kunde_token=t1)
        api.portal_customer(kontakt=self.kontakt, kunde_token=t2)
        self.assertEqual(api.portal_logout(kontakt=self.kontakt, kunde_token=t2), {"ok": True})
        self.assertEqual(api.portal_customer(kontakt=self.kontakt, kunde_token=t1)["id"], self.kontakt)
        r = api.portal_customer(kontakt=self.kontakt, kunde_token=t2)
        self.assertEqual(r.get("code"), "invalid_token")

    def test_hoechstens_fuenf_aktive(self):
        tokens = []
        for _i in range(6):
            t = self._login()
            api.portal_customer(kontakt=self.kontakt, kunde_token=t)
            tokens.append(t)
        self.assertEqual(frappe.db.count("PH Portal Sitzung", {"kontakt": self.kontakt, "status": "Aktiv"}), 5)
        self.assertEqual(api.portal_customer(kontakt=self.kontakt, kunde_token=tokens[0]).get("code"), "invalid_token")

    def test_teamliste_paginiert(self):
        testprojekt()
        r = api.tagebuch_list_alle(rolle="team", seite=1, groesse=1)
        self.assertEqual(r["groesse"], 1)
        self.assertLessEqual(len(r["items"]), 1)
        self.assertGreaterEqual(r["gesamt"], 1)
        self.assertEqual(api.tagebuch_list_alle(rolle="kunde").get("code"), "forbidden")

    def test_planer_standard_ersteller(self):
        user = "planer-test@example.com"
        if not frappe.db.exists("User", user):
            frappe.get_doc({"doctype": "User", "email": user, "first_name": "Planer", "send_welcome_email": 0, "roles": [{"role": "PH Projekte Mitarbeiter"}]}).insert(ignore_permissions=True)
        frappe.set_user(user)
        try:
            p = frappe.get_doc({"doctype": "PH Projekt", "kontakt": self.kontakt, "titel": "Planer Test " + frappe.generate_hash(length=4), "projektart": "Wohnung"}).insert(ignore_permissions=True)
            self.assertEqual(p.planer, user)
        finally:
            frappe.set_user("Administrator")

    def test_produktpass_e_nummer(self):
        from ph_projekte.ph_projekte.doctype.ph_produktpass.ph_produktpass import pass_anlegen

        name, _neu = pass_anlegen(kontakt=self.kontakt, produkt_name="Backofen", seriennummer="SN-E-" + frappe.generate_hash(length=4), e_nummer="HBG7741B1", fd_nummer="FD 9912")
        self.assertEqual(frappe.db.get_value("PH Produktpass", name, ["e_nummer", "fd_nummer"]), ("HBG7741B1", "FD 9912"))
        self.assertEqual(api._pass_payload(name)["eNumber"], "HBG7741B1")
