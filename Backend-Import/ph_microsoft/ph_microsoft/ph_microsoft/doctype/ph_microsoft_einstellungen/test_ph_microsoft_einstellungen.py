"""bench --site <site> run-tests --app ph_microsoft --doctype "PH Microsoft Einstellungen"
Validierung und SSO-Brücke mit selbst erzeugten RSA-Testschlüsseln (JWKS-Abruf ersetzt, kein Aufruf an Microsoft)."""

from unittest.mock import patch

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_core.api import ApiFehler
from ph_microsoft.ph_microsoft import sso
from ph_microsoft.ph_microsoft.einstellungen import cache_leeren
from ph_microsoft.tests.hilfen import CLIENT, TENANT, Schluesselquelle, jwk, schluesselpaar, token

GRUPPE = "ab000000-0000-0000-0000-000000000001"
TESTMAIL = "sso.test@platzhirsch.studio"


class TestPHMicrosoftEinstellungen(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.privat = schluesselpaar()
        cls.quelle = Schluesselquelle({"k1": jwk(cls.privat, "k1")})

    def setUp(self):
        frappe.set_user("Administrator")
        e = frappe.get_single("PH Microsoft Einstellungen")
        e.update({"sso_aktiv": 1, "tenant_id": TENANT, "backoffice_client_id": CLIENT, "auto_benutzer_anlegen": 0, "rollen_aus_gruppen": 1})
        e.set("gruppen_rollen", [{"gruppe_id": GRUPPE, "rolle": "PH CRM Mitarbeiter"}])
        e.save()
        cache_leeren()
        frappe.cache().delete_keys("ph_microsoft:sso_uti")

    def tearDown(self):
        frappe.set_user("Administrator")
        frappe.db.rollback()
        cache_leeren()

    def _user(self, **kw):
        if not frappe.db.exists("User", TESTMAIL):
            frappe.get_doc({"doctype": "User", "email": TESTMAIL, "first_name": "SSO", "last_name": "Test", "send_welcome_email": 0, "user_type": "System User"}).insert(ignore_permissions=True)
        if kw:
            frappe.db.set_value("User", TESTMAIL, kw)
        return TESTMAIL

    def _sitzung(self, **claims):
        claims.setdefault("preferred_username", TESTMAIL)
        claims.setdefault("uti", frappe.generate_hash(length=12))
        with patch.object(sso, "schluessel_quelle", lambda tenant: self.quelle):
            return sso.sitzung(token(self.privat, **claims))

    def test_validierung_guid_und_geschuetzte_rolle(self):
        e = frappe.get_single("PH Microsoft Einstellungen")
        e.tenant_id = "kein-guid"
        self.assertRaises(frappe.ValidationError, e.save)
        e.reload()
        e.append("gruppen_rollen", {"gruppe_id": GRUPPE, "rolle": "System Manager"})
        self.assertRaises(frappe.ValidationError, e.save)
        e.reload()
        e.webhook_basis_url = "http://unsicher.invalid"
        self.assertRaises(frappe.ValidationError, e.save)

    def test_sso_erfolg_mit_rolle_aus_gruppe(self):
        self._user()
        r = self._sitzung(groups=[GRUPPE])
        self.assertEqual(r["user"], TESTMAIL)
        self.assertTrue(r["sid"])
        self.assertIn("PH CRM Mitarbeiter", r["roles"])
        self.assertEqual(frappe.db.get_value("User", TESTMAIL, "ph_microsoft_oid"), "99999999-0000-0000-0000-000000000001")

    def test_sso_entfernt_gemappte_rolle_ohne_gruppe(self):
        self._user()
        frappe.get_doc("User", TESTMAIL).add_roles("PH CRM Mitarbeiter", "PH Shop Mitarbeiter")
        r = self._sitzung(groups=[])
        self.assertNotIn("PH CRM Mitarbeiter", r["roles"])
        self.assertIn("PH Shop Mitarbeiter", r["roles"])

    def test_sso_unbekannter_benutzer_404_und_auto_anlage(self):
        with self.assertRaises(ApiFehler) as ctx:
            self._sitzung(preferred_username="neu.sso@platzhirsch.studio", oid="99999999-0000-0000-0000-000000000077")
        self.assertEqual((ctx.exception.code, ctx.exception.http_status), ("not_found", 404))
        frappe.db.set_single_value("PH Microsoft Einstellungen", "auto_benutzer_anlegen", 1)
        cache_leeren()
        with self.assertRaises(ApiFehler):  # ohne gemappte Gruppe trotzdem nicht
            self._sitzung(preferred_username="neu.sso@platzhirsch.studio", oid="99999999-0000-0000-0000-000000000077", groups=[])
        r = self._sitzung(preferred_username="neu.sso@platzhirsch.studio", oid="99999999-0000-0000-0000-000000000077", groups=[GRUPPE])
        self.assertTrue(r["neu_angelegt"])

    def test_sso_gesperrt_403(self):
        self._user(ph_microsoft_sso_gesperrt=1)
        with self.assertRaises(ApiFehler) as ctx:
            self._sitzung()
        self.assertEqual(ctx.exception.http_status, 403)

    def test_sso_falsche_identitaet_403(self):
        self._user(ph_microsoft_oid="99999999-0000-0000-0000-00000000aaaa")
        with self.assertRaises(ApiFehler) as ctx:
            self._sitzung()
        self.assertEqual(ctx.exception.code, "forbidden")

    def test_sso_ungueltig_401_und_wiederverwendung(self):
        self._user()
        fremd = schluesselpaar()
        with patch.object(sso, "schluessel_quelle", lambda tenant: self.quelle):
            with self.assertRaises(ApiFehler) as ctx:
                sso.sitzung(token(fremd, preferred_username=TESTMAIL))
            self.assertEqual((ctx.exception.code, ctx.exception.http_status), ("invalid_token", 401))
            t = token(self.privat, preferred_username=TESTMAIL, uti="einmalig-1")
            sso.sitzung(t)
            frappe.set_user("Administrator")
            with self.assertRaises(ApiFehler) as ctx:
                sso.sitzung(t)
            self.assertEqual(ctx.exception.http_status, 401)

    def test_sso_aus_503(self):
        frappe.db.set_single_value("PH Microsoft Einstellungen", "sso_aktiv", 0)
        cache_leeren()
        with self.assertRaises(ApiFehler) as ctx:
            self._sitzung()
        self.assertEqual(ctx.exception.http_status, 503)

    def test_protokoll_ohne_token(self):
        self._user()
        self._sitzung()
        for m in frappe.get_all("PH Sync Protokoll", filters={"bereich": "SSO"}, pluck="meldung"):
            self.assertNotIn("eyJ", m or "")
