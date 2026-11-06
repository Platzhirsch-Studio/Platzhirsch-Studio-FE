"""bench --site <site> run-tests --app ph_kundenkarte --doctype "PH Kundenkarte Einloesung" – inkl. API lookup_card/redeem_benefit."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_kundenkarte import api
from ph_kundenkarte.tests.helfer import aufraeumen, einstellungen_fuer_tests, testkarte, testkontakt, vorteil


def _antwort():
    return frappe.local.response.get("message"), frappe.local.response.get("http_status_code")


class TestPHKundenkarteEinloesung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()
        aufraeumen("PH Kundenkarte Einloesung", {"kontakt": testkontakt()})
        aufraeumen("PH Kundenkarte", {"kontakt": testkontakt()})
        frappe.local.response = frappe._dict()

    def _einloesung(self, karte, titel, **werte):
        d = {"doctype": "PH Kundenkarte Einloesung", "kundenkarte": karte.name, "vorteil": vorteil(titel), "ort": "Showroom"}
        d.update(werte)
        return frappe.get_doc(d).insert()

    def test_anlegen_titel_status(self):
        k = testkarte()
        e = self._einloesung(k, "Persönliche Beratung")
        self.assertEqual(e.status, "Eingeloest")
        self.assertIn("Persönliche Beratung", e.titel)
        self.assertEqual(e.kunde_name, k.kunde_name)
        self.assertEqual(e.eingeloest_durch, "Administrator")

    def test_limit_pro_jahr(self):
        k = testkarte()
        self._einloesung(k, "Gruß zum Geburtstag")  # 1× je Jahr
        with self.assertRaises(frappe.ValidationError):
            self._einloesung(k, "Gruß zum Geburtstag")

    def test_stufe_passt_nicht(self):
        k = testkarte()
        with self.assertRaises(frappe.ValidationError):
            self._einloesung(k, "Montage durch unser Team")  # erst Privé
        k.stufe = "Platzhirsch Privé"
        k.save()
        e = self._einloesung(k, "Montage durch unser Team")
        self.assertEqual(e.stufe, "Platzhirsch Privé")

    def test_karte_gesperrt(self):
        k = testkarte()
        k.sperren(grund="Test")
        with self.assertRaises(frappe.ValidationError):
            self._einloesung(k, "Persönliche Beratung")

    def test_storno_gibt_kontingent_frei(self):
        k = testkarte()
        e = self._einloesung(k, "Gruß zum Geburtstag")
        self.assertEqual(e.stornieren(grund="Irrtum"), "Storniert")
        e2 = self._einloesung(k, "Gruß zum Geburtstag")
        self.assertEqual(e2.status, "Eingeloest")

    def test_bezug_typ(self):
        k = testkarte()
        with self.assertRaises(frappe.ValidationError):
            self._einloesung(k, "Persönliche Beratung", bezug_doctype="User", bezug="Administrator")

    def test_api_lookup_und_redeem(self):
        k = testkarte()
        r = api.lookup_card(kartennummer=k.kartennummer.lower().replace("-", " "))
        self.assertEqual(r["kartennummer"], k.kartennummer)
        self.assertEqual(r["stufe"], "Platzhirsch")
        self.assertNotIn("kontakt", r)
        self.assertNotIn("jahresumsatz_cent", r)
        verf = {v["titel"]: v for v in r["vorteile"]}
        self.assertTrue(verf["Gruß zum Geburtstag"]["verfuegbar"])
        self.assertEqual(verf["Gruß zum Geburtstag"]["verbleibend"], 1)
        e = api.redeem_benefit(kartennummer=k.kartennummer, vorteil=vorteil("Gruß zum Geburtstag"), ort="Kassa")
        self.assertTrue(e["referenz"].startswith("PH-KKE-"))
        self.assertEqual(e["verbleibend"], 0)
        api.redeem_benefit(kartennummer=k.kartennummer, vorteil=vorteil("Gruß zum Geburtstag"))
        body, status = _antwort()
        self.assertEqual(status, 409)
        self.assertEqual(body["code"], "limit_reached")
        api.redeem_benefit(kartennummer=k.kartennummer, vorteil=vorteil("Montage durch unser Team"))
        body, status = _antwort()
        self.assertEqual(status, 409)
        self.assertIn(body["code"], ("tier_too_low", "benefit_not_in_tier"))

    def test_api_fehler(self):
        api.lookup_card(kartennummer="KK-000000")
        body, status = _antwort()
        self.assertEqual(status, 400)
        self.assertEqual(body["code"], "invalid")
        api.lookup_card(kartennummer="KK-ZZZZZZ")
        body, status = _antwort()
        self.assertEqual(status, 404)
        api.redeem_benefit(kartennummer="")
        body, status = _antwort()
        self.assertEqual(status, 400)

    def test_api_idempotenz(self):
        k = testkarte()
        r1 = api.redeem_benefit(idempotency_key="kk-redeem-1", kartennummer=k.kartennummer, vorteil=vorteil("Gruß zum Geburtstag"))
        r2 = api.redeem_benefit(idempotency_key="kk-redeem-1", kartennummer=k.kartennummer, vorteil=vorteil("Gruß zum Geburtstag"))
        self.assertEqual(r1["referenz"], r2["referenz"])
        self.assertEqual(frappe.db.count("PH Kundenkarte Einloesung", {"kundenkarte": k.name, "status": "Eingeloest"}), 1)

    def tearDown(self):
        frappe.db.rollback()
