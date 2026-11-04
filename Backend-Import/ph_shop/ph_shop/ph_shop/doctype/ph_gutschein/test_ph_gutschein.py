"""bench --site <site> run-tests --app ph_shop --doctype "PH Gutschein" – Ausstellen, Einlösen, Sperren, Ersetzen, API, Gutschein-Bestellung über Webhook."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_shop import gutschein_code as gc
from ph_shop.api import create_voucher_order, get_voucher, redeem_voucher
from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import ausstellen, finde_nach_code
from ph_shop.stripe_webhook import verarbeite


class TestPHGutschein(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.db.set_single_value("PH Shop Einstellungen", "shop_modus", "test")
        frappe.flags.ph_stripe_simulation = True

    def test_ausstellen_hash_und_titel(self):
        doc, code = ausstellen(10000, kaeufer={"name": "Carl", "email": "carl@example.com"})
        self.assertTrue(code.startswith("PH-"))
        self.assertEqual(doc.code_hash, gc.code_hash(gc.normalisiere(code)))
        self.assertEqual(doc.code_letzte4, code[-4:])
        self.assertEqual((doc.status, doc.rest_cent, doc.art), ("Aktiv", 10000, "Mehrzweck"))
        self.assertIsNone(doc.gueltig_bis)  # unbefristet (Inhaber 03.11.2026)
        self.assertTrue(doc.name.startswith("PH-GS-"))
        self.assertEqual(finde_nach_code(code.lower().replace("-", " ")).name, doc.name)
        self.assertIsNone(finde_nach_code("PH-0000-0000-0000-0000"))

    def test_einloesen_teil_voll_und_ueber_rest(self):
        doc, _code = ausstellen(5000)
        r = doc.einloesen(2000, kanal="Showroom", zahlung_buchen=True)
        self.assertEqual((r["rest_cent"], r["status"]), (3000, "Teilweise eingeloest"))
        self.assertTrue(r["zahlung"])
        self.assertEqual(frappe.db.get_value("PH Zahlung", r["zahlung"], ["kanal", "gutschein", "docstatus"]), ("Gutschein", doc.name, 1))
        doc.reload()
        with self.assertRaises(frappe.ValidationError):
            doc.einloesen(3001)
        r2 = doc.einloesen(3000)
        self.assertEqual((r2["rest_cent"], r2["status"]), (0, "Eingeloest"))
        doc.reload()
        self.assertEqual(len(doc.einloesungen), 2)
        with self.assertRaises(frappe.ValidationError):
            doc.einloesen(1)

    def test_sperren_entsperren_ersetzen(self):
        doc, _code = ausstellen(8000)
        doc.einloesen(1000)
        doc.reload()
        doc.sperren("verloren gemeldet")
        self.assertEqual(frappe.db.get_value("PH Gutschein", doc.name, "status"), "Gesperrt")
        doc.reload()
        with self.assertRaises(frappe.ValidationError):
            doc.einloesen(100)
        self.assertEqual(doc.entsperren(), "Teilweise eingeloest")
        doc.reload()
        r = doc.ersetzen()
        neu = frappe.get_doc("PH Gutschein", r["gutschein"])
        self.assertEqual((neu.rest_cent, neu.kanal_ausgabe), (7000, "Ersatz"))
        self.assertEqual(finde_nach_code(r["code"]).name, neu.name)
        doc.reload()
        self.assertEqual((doc.status, doc.rest_cent, doc.ersetzt_durch), ("Gesperrt", 0, neu.name))

    def test_api_get_und_redeem(self):
        doc, code = ausstellen(3000)
        s = get_voucher(code)
        self.assertEqual((s["rest_cent"], s["status"], s["einloesbar"], s["ende"]), (3000, "Aktiv", True, code[-4:]))
        self.assertNotIn("kaeufer_email", s)
        zu_viel = redeem_voucher(code, 4000, kanal="Showroom")
        self.assertEqual(zu_viel.get("code"), "conflict")
        ok = redeem_voucher(code, 1000, kanal="Showroom", beleg="Bon 17", idempotency_key="redeem-test-1")
        self.assertEqual(ok["rest_cent"], 2000)
        nochmal = redeem_voucher(code, 1000, kanal="Showroom", beleg="Bon 17", idempotency_key="redeem-test-1")
        self.assertEqual(nochmal["rest_cent"], 2000)  # idempotent: keine zweite Einlösung
        self.assertEqual(frappe.db.get_value("PH Gutschein", doc.name, "rest_cent"), 2000)
        self.assertEqual(get_voucher("PH-XXXX")["code"], "invalid")
        self.assertEqual(get_voucher("PH-2222-3333-4444-5555")["code"], "not_found")

    def test_gutschein_bestellung_webhook_erzeugt_codes(self):
        r = create_voucher_order(record={"id": "G-TEST-" + frappe.generate_hash(length=4).upper(), "betrag_cent": 5000, "anzahl": 2, "motiv": "schlicht", "empfaenger": "Oma", "grusstext": "Alles Gute", "kaeufer": {"name": "Dora", "email": "dora@example.com", "firma": ""}, "zustimmung": {"bedingungen": "2026-11-03", "widerruf": "2026-11-03", "zeit": "2026-11-04T09:00:00Z"}})
        nummer = r["referenz"]
        self.assertEqual(frappe.db.get_value("PH Gutschein Bestellung", nummer, "summe_cent"), 10000)
        pi = f"pi_test_{frappe.generate_hash(length=8)}"
        evt = {"id": f"evt_test_{frappe.generate_hash(length=10)}", "type": "checkout.session.completed", "livemode": False, "data": {"object": {"id": "cs_g1", "payment_status": "paid", "amount_total": 10000, "currency": "eur", "payment_intent": pi, "metadata": {"art": "gutschein", "order_id": nummer}, "customer_details": {"name": "Dora Test", "email": "dora@example.com", "address": {"line1": "Weg 1", "postal_code": "6900", "city": "Bregenz", "country": "AT"}}}}}
        ergebnis, _ = verarbeite(evt)
        self.assertEqual(ergebnis, "erfuellt")
        gb = frappe.get_doc("PH Gutschein Bestellung", nummer)
        self.assertEqual((gb.status, len(gb.gutscheine)), ("bezahlt", 2))
        gs = frappe.get_doc("PH Gutschein", gb.gutscheine[0].gutschein)
        self.assertEqual((gs.test, gs.wert_cent, gs.empfaenger, gs.kanal_ausgabe), (1, 5000, "Oma", "Online"))  # livemode False → Testgutschein
        self.assertEqual(frappe.db.count("PH Zahlung", {"stripe_payment_intent": pi}), 1)
        # Erneute Zustellung: keine neuen Codes
        ergebnis2, _ = verarbeite({**evt, "id": f"evt_test_{frappe.generate_hash(length=10)}"})
        self.assertEqual(ergebnis2, "bereits_erfuellt")
        self.assertEqual(frappe.db.count("PH Gutschein", {"gutschein_bestellung": nummer}), 2)
        # Vollerstattung sperrt ungenutzte Gutscheine
        ref = {"id": f"evt_test_{frappe.generate_hash(length=10)}", "type": "charge.refunded", "livemode": False, "data": {"object": {"id": "ch_g1", "payment_intent": pi, "amount": 10000, "amount_refunded": 10000, "refunded": True, "metadata": {"art": "gutschein", "order_id": nummer}}}}
        ergebnis3, _ = verarbeite(ref)
        self.assertTrue(ergebnis3.startswith("erstattet"))
        self.assertEqual(frappe.db.get_value("PH Gutschein", gs.name, "status"), "Erstattet")
        self.assertEqual(frappe.db.get_value("PH Gutschein Bestellung", nummer, "status"), "erstattet")

    def test_betrag_abweichung_erzeugt_keine_codes(self):
        r = create_voucher_order(record={"betrag_cent": 5000, "anzahl": 1, "motiv": "geweih", "kaeufer": {"name": "E", "email": "e@example.com"}})
        evt = {"id": f"evt_test_{frappe.generate_hash(length=10)}", "type": "checkout.session.completed", "livemode": False, "data": {"object": {"id": "cs_g2", "payment_status": "paid", "amount_total": 4900, "currency": "eur", "payment_intent": f"pi_test_{frappe.generate_hash(length=8)}", "metadata": {"art": "gutschein", "order_id": r["referenz"]}}}}
        ergebnis, _ = verarbeite(evt)
        self.assertEqual(ergebnis, "pruefen")
        self.assertEqual(frappe.db.get_value("PH Gutschein Bestellung", r["referenz"], "status"), "pruefen")
        self.assertEqual(frappe.db.count("PH Gutschein", {"gutschein_bestellung": r["referenz"]}), 0)
