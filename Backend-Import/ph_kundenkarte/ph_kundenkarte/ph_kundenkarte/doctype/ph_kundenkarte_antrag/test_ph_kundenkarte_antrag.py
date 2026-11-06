"""bench --site <site> run-tests --app ph_kundenkarte --doctype "PH Kundenkarte Antrag" – inkl. API create/confirm/get_card_status."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_kundenkarte import api
from ph_kundenkarte.tests.helfer import aufraeumen, einstellungen_fuer_tests, testkontakt

MAIL = "antrag-test@example.com"


def _antwort():
    return frappe.local.response.get("message"), frappe.local.response.get("http_status_code")


class TestPHKundenkarteAntrag(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()
        aufraeumen("PH Kundenkarte Antrag", {"email": MAIL})
        for kontakt in frappe.get_all("PH Kontakt", filters={"email": MAIL}, pluck="name"):
            aufraeumen("PH Kundenkarte", {"kontakt": kontakt})
        frappe.local.response = frappe._dict()

    def _daten(self, **extra):
        d = {"vorname": "Max", "nachname": "Antrag", "email": MAIL, "plz": "6900", "ort": "Bregenz", "vertragsdaten_akzeptiert": 1, "einwilligung_auswertung": 1, "einwilligung_textversion": "kk-ausw-v1", "einwilligung_newsletter": 0}
        d.update(extra)
        return d

    def test_api_kampagnenfelder(self):
        """utm_*/klick_id (Website pickAttribution, nur mit Einwilligung) werden am Antrag gespeichert."""
        r = api.create_card_application(**self._daten(utm_source="newsletter", utm_medium="email", utm_campaign="kundenkarte-herbst", utm_term="", klick_id="fbclid=xyz"))
        antrag = frappe.get_doc("PH Kundenkarte Antrag", r["referenz"])
        self.assertEqual((antrag.utm_source, antrag.utm_medium, antrag.utm_campaign), ("newsletter", "email", "kundenkarte-herbst"))
        self.assertIsNone(antrag.utm_term)
        self.assertEqual(antrag.klick_id, "fbclid=xyz")

    def test_api_create_confirm_annehmen(self):
        r = api.create_card_application(**self._daten())
        self.assertEqual(r["status"], "Neu")
        self.assertTrue(r["doi"])
        self.assertTrue(r["doi_token"])
        self.assertEqual(r["email_maskiert"], "a***@example.com")
        antrag = frappe.get_doc("PH Kundenkarte Antrag", r["referenz"])
        self.assertTrue(antrag.doi_token_hash)
        self.assertNotIn(r["doi_token"], antrag.doi_token_hash)
        # Zweitantrag derselben Adresse → kein neuer Datensatz
        r2 = api.create_card_application(**self._daten())
        self.assertEqual(r2["referenz"], r["referenz"])
        self.assertTrue(r2["bereits_vorhanden"])
        # Status-Abfrage ohne Personendaten
        s = api.get_card_status(email=MAIL)
        self.assertEqual(s, {"found": True, "status": "beantragt"})
        # DOI
        c = api.confirm_card_application(token=r["doi_token"])
        self.assertEqual(c["status"], "bestaetigt")
        self.assertEqual(api.confirm_card_application(token=r["doi_token"])["status"], "bereits_bestaetigt")
        antrag.reload()
        self.assertEqual(antrag.status, "Bestaetigt")
        # Annahme → Kontakt + Karte
        karte = antrag.annehmen()
        self.assertTrue(karte.startswith("KK-"))
        antrag.reload()
        self.assertEqual(antrag.status, "Angenommen")
        self.assertTrue(antrag.kontakt)
        k = frappe.get_doc("PH Kundenkarte", karte)
        self.assertEqual(k.kontakt, antrag.kontakt)
        self.assertEqual(k.status, "Beantragt")  # Website-Karte wird im Showroom aktiviert
        self.assertEqual(k.einwilligung_auswertung, 1)
        self.assertEqual(k.einwilligung_textversion, "kk-ausw-v1")
        self.assertEqual(api.get_card_status(email=MAIL)["status"], "beantragt")
        self.assertEqual(k.aktivieren(), "Aktiv")
        self.assertEqual(api.get_card_status(email=MAIL)["status"], "aktiv")
        # Erneuter Antrag bei bestehender Karte → 409
        api.create_card_application(**self._daten())
        body, status = _antwort()
        self.assertEqual(status, 409)
        self.assertEqual(body["code"], "conflict")

    def test_api_pflichtfeld_fehlt(self):
        api.create_card_application(**self._daten(email=""))
        body, status = _antwort()
        self.assertEqual(status, 400)
        self.assertEqual(body["code"], "invalid")
        self.assertEqual(body["field"], "email")
        api.create_card_application(**self._daten(vertragsdaten_akzeptiert=0))
        body, status = _antwort()
        self.assertEqual(status, 400)
        self.assertEqual(body["field"], "vertragsdaten_akzeptiert")

    def test_api_token_ungueltig(self):
        api.confirm_card_application(token="x" * 40)
        body, status = _antwort()
        self.assertEqual(status, 404)
        self.assertEqual(body["code"], "invalid_token")
        self.assertEqual(api.get_card_status(email="niemand@example.com"), {"found": False, "status": "keine"})

    def test_idempotenz(self):
        r1 = api.create_card_application(idempotency_key="kk-antrag-1", **self._daten())
        r2 = api.create_card_application(idempotency_key="kk-antrag-1", **self._daten())
        self.assertEqual(r1["referenz"], r2["referenz"])

    def test_ablehnen_und_doppelt(self):
        a = frappe.get_doc({"doctype": "PH Kundenkarte Antrag", "quelle": "showroom", **self._daten()}).insert()
        self.assertEqual(a.status, "Bestaetigt")  # Showroom: kein DOI
        with self.assertRaises(frappe.ValidationError):
            a.ablehnen(grund="")
        self.assertEqual(a.ablehnen(grund="Testablehnung"), "Abgelehnt")
        b = frappe.get_doc({"doctype": "PH Kundenkarte Antrag", "quelle": "showroom", **self._daten()}).insert()
        kontakt = testkontakt(email=MAIL, nachname="Antrag", vorname="Max")
        karte = frappe.get_doc({"doctype": "PH Kundenkarte", "kontakt": kontakt}).insert()
        self.assertEqual(b.annehmen(), "Doppelt")
        b.reload()
        self.assertEqual(b.doppelt_zu, karte.name)

    def test_kontakt_suchen_maskiert(self):
        testkontakt(email=MAIL, nachname="Antrag", vorname="Max")
        a = frappe.get_doc({"doctype": "PH Kundenkarte Antrag", "quelle": "showroom", **self._daten()}).insert()
        treffer = a.kontakt_suchen()
        self.assertEqual(len(treffer), 1)
        self.assertEqual(treffer[0]["email"], "a***")

    def tearDown(self):
        frappe.db.rollback()
