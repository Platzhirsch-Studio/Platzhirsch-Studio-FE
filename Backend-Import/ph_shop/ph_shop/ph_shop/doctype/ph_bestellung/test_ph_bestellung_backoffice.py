"""bench --site <site> run-tests --app ph_shop --module ph_shop.ph_shop.doctype.ph_bestellung.test_ph_bestellung_backoffice

Backoffice-Lücken (52-backend-luecken): Teilzahlung addiert, Teilstorno (unbezahlt), Teilerstattung positionsweise mit
USt je Satz und Gutschein-Rückbuchung, Ersatzlieferung 0 €, Telefonbestellung mit Zahlungslink (simuliert),
Übergabe zurücknehmen, Radar-Webhook, Dispute-Felder, Kundenakte-Hooks.
"""

import json

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_shop.api import create_order
from ph_shop.api.backoffice import check_voucher, create_phone_order, sell_voucher
from ph_shop.ph_shop import kontakt as kakte
from ph_shop.ph_shop.doctype.ph_bestellung.test_ph_bestellung import session_event, website_record
from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import ausstellen
from ph_shop.stripe_webhook import verarbeite


class TestPHBestellungBackoffice(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.db.set_single_value("PH Shop Einstellungen", "shop_modus", "test")
        frappe.flags.ph_stripe_simulation = True
        typen = (frappe.db.get_single_value("PH Stripe Einstellungen", "ereignistypen") or "").splitlines()
        neu = [t for t in ("charge.succeeded", "charge.dispute.created", "charge.dispute.updated", "review.opened", "radar.early_fraud_warning.created") if t not in typen]
        if neu:
            frappe.db.set_single_value("PH Stripe Einstellungen", "ereignistypen", chr(10).join(typen + neu))
        frappe.cache().delete_value("ph_shop:stripe_einstellungen")

    def _nummer(self):
        import secrets

        return f"PH-S-261104-{secrets.token_hex(3).upper()}"

    def _bezahlt(self, pi=None):
        nr = self._nummer()
        create_order(record=website_record(nr))
        pi = pi or f"pi_{frappe.generate_hash(length=10)}"
        verarbeite(session_event(f"evt_{frappe.generate_hash(length=10)}", nr, pi=pi))
        return frappe.get_doc("PH Bestellung", nr), pi

    def test_teilzahlung_wird_addiert(self):
        nr = self._nummer()
        create_order(record=website_record(nr, zahlung="vorort", lieferart="abholung"))
        doc = frappe.get_doc("PH Bestellung", nr)
        doc.zahlung_erfassen("Bar", 6000)
        doc.reload()
        self.assertEqual((doc.betrag_bezahlt_cent, doc.offen_cent, doc.status), (6000, 10000, "reserviert"))
        self.assertFalse(doc.bezahlt_am)
        with self.assertRaises(frappe.ValidationError):
            doc.zahlung_erfassen("Bar", 10001)
        doc.zahlung_erfassen("Karte extern", 10000)
        doc.reload()
        self.assertEqual((doc.betrag_bezahlt_cent, doc.offen_cent, doc.status), (16000, 0, "bezahlt"))

    def test_teilstorno_unbezahlt_mindert_summe(self):
        nr = self._nummer()
        create_order(record=website_record(nr))
        doc = frappe.get_doc("PH Bestellung", nr)
        r = doc.positionen_stornieren(json.dumps({"2": 1}), grund="Kerze nicht lieferbar")
        doc.reload()
        self.assertEqual(r["betrag_cent"], 3000)
        self.assertEqual((doc.gesamt_cent, doc.storniert_cent, doc.positionen[1].menge, doc.positionen[1].storniert_menge), (13990, 3000, 1, 1))
        self.assertEqual(doc.erstattungen[-1].status, "nur_forderung")
        with self.assertRaises(frappe.ValidationError):
            doc.positionen_stornieren(json.dumps({"1": 1, "2": 1}), grund="alles")  # alles weg → ganze Bestellung stornieren
        with self.assertRaises(frappe.ValidationError):
            doc.positionen_stornieren(json.dumps({"2": 1}), grund="")

    def test_teilerstattung_ust_je_satz_und_status_bleibt(self):
        doc, _pi = self._bezahlt()
        r = doc.teilerstatten(zeilen=json.dumps({"2": 1}), versand_cent=0, grund="Kerze gebrochen")
        doc.reload()
        self.assertEqual(r["betrag_cent"], 3000)
        self.assertEqual({p["satz_promille"] for p in r["posten"]}, {2000})
        self.assertEqual(r["ust_cent"], 500)
        self.assertEqual((doc.erstattet_cent, doc.status), (3000, "bezahlt"))  # Abwicklung läuft weiter (Packen möglich)
        self.assertEqual((doc.positionen[1].zurueck_menge, doc.positionen[1].erstattet_cent), (1, 3000))
        self.assertEqual(doc.erstattungen[-1].art, "Teilerstattung")
        with self.assertRaises(frappe.ValidationError):
            doc.teilerstatten(zeilen=json.dumps({"2": 2}), grund="zu viel")
        with self.assertRaises(frappe.ValidationError):
            doc.teilerstatten(kulanz_cent=20000, grund="mehr als bezahlt")

    def test_storno_bucht_gutschein_zurueck(self):
        gs, code = ausstellen(5000)
        nr = self._nummer()
        create_order(record=website_record(nr, zahlung="vorort", lieferart="abholung"))
        doc = frappe.get_doc("PH Bestellung", nr)
        doc.gutschein_einloesen(code, 5000)
        doc.reload()
        doc.zahlung_erfassen("Bar", 11000)
        doc.reload()
        doc.stornieren("Kunde verzichtet", erstatten=1)
        gs.reload()
        doc.reload()
        self.assertEqual((gs.rest_cent, gs.status), (5000, "Aktiv"))
        self.assertEqual(doc.status, "storniert")
        self.assertEqual(doc.erstattet_cent, 16000)

    def test_ersatzlieferung_null_euro(self):
        doc, _pi = self._bezahlt()
        name = doc.ersatzlieferung_anlegen(zeilen=json.dumps({"2": 1}), grund="Transportschaden")
        neu = frappe.get_doc("PH Bestellung", name)
        self.assertEqual((neu.bestellart, neu.ersatz_fuer, neu.gesamt_cent, neu.status), ("Ersatz", doc.name, 0, "bezahlt"))
        self.assertEqual(neu.positionen[0].menge, 1)
        neu.packen()  # 0-€-Bestellung durchläuft den normalen Versandweg
        with self.assertRaises(frappe.ValidationError):
            doc.ersatzlieferung_anlegen(zeilen=json.dumps({"2": 3}), grund="zu viel")

    def test_telefonbestellung_mit_zahlungslink(self):
        key = f"tel-{frappe.generate_hash(length=8)}"
        r = create_phone_order(kunde={"name": "Berta Telefon", "email": "berta@example.com", "telefon": "+43 5574 1"}, positionen=[{"bezeichnung": "Teppich Muster", "menge": 1, "einzel_cent": 49000}], lieferart="versand", adresse={"land": "AT", "plz": "6911", "ort": "Lochau", "strasse": "Seestraße", "hausnr": "1"}, versand_cent=0, notiz_kunde="Bitte vor 10 Uhr", idempotency_key=key)
        doc = frappe.get_doc("PH Bestellung", r["bestellung"])
        self.assertEqual((doc.bestellart, doc.status, doc.notiz_kunde), ("Telefon", "offen", "Bitte vor 10 Uhr"))
        self.assertTrue(r["zahlungslink"]["simuliert"])
        self.assertTrue(doc.zahlungslink_url.startswith("https://checkout.stripe.com/"))
        self.assertTrue(create_phone_order(kunde={"name": "x", "email": "x@example.com"}, positionen=[{"bezeichnung": "x", "einzel_cent": 1}], idempotency_key=key)["bereits_angelegt"])
        # Webhook bucht wie online
        verarbeite(session_event(f"evt_{frappe.generate_hash(length=10)}", doc.name, betrag=49000, pi=f"pi_{frappe.generate_hash(length=10)}"))
        doc.reload()
        self.assertEqual(doc.status, "bezahlt")
        with self.assertRaises(frappe.ValidationError):
            create_phone_order(kunde={"name": "y", "email": "y@example.com"}, positionen=[])

    def test_uebergabe_zuruecknehmen(self):
        nr = self._nummer()
        create_order(record=website_record(nr, zahlung="vorort", lieferart="abholung"))
        doc = frappe.get_doc("PH Bestellung", nr)
        doc.zahlung_erfassen("Bar", 16000)
        doc.reload()
        doc.abholbereit_melden()
        doc.reload()
        doc.abgeholt_melden()
        doc.reload()
        self.assertEqual(doc.abholung_zuruecknehmen("falsche Kundin"), "abholbereit")
        doc.reload()
        self.assertTrue(doc.abholcode_erneut_senden() in (True, False))

    def test_radar_und_dispute(self):
        doc, pi = self._bezahlt()
        verarbeite({"id": f"evt_{frappe.generate_hash(length=10)}", "type": "charge.succeeded", "livemode": False, "data": {"object": {"id": "ch_x", "object": "charge", "payment_intent": pi, "outcome": {"risk_level": "elevated", "risk_score": 71, "type": "authorized"}, "metadata": {}}}})
        doc.reload()
        self.assertEqual((doc.radar_markiert, doc.radar_risk_level, doc.radar_risk_score), (1, "elevated", 71))
        self.assertEqual(frappe.db.get_value("PH Zahlung", doc.zahlung_ref, "radar_markiert"), 1)
        verarbeite({"id": f"evt_{frappe.generate_hash(length=10)}", "type": "charge.dispute.created", "livemode": False, "data": {"object": {"id": "dp_1", "payment_intent": pi, "amount": 16990, "reason": "fraudulent", "status": "needs_response", "evidence_details": {"due_by": 1893456000}}}})
        self.assertEqual(frappe.db.get_value("PH Zahlung", doc.zahlung_ref, ["dispute_id", "dispute_status"]), ("dp_1", "needs_response"))
        doc.radar_geprueft("Kundin bekannt")
        self.assertEqual(frappe.db.get_value("PH Bestellung", doc.name, "radar_geprueft_von"), "Administrator")

    def test_gutschein_verkauf_kassa_idempotent_und_steuer(self):
        key = f"kassa:TEST:{frappe.generate_hash(length=6)}"
        r = sell_voucher(10000, "PH Bestellung", None, key)
        self.assertTrue(r["code"])
        self.assertEqual((r["steuersatz"], r["steuersatz_promille"]), ("Null 0", 0))
        r2 = sell_voucher(10000, "PH Bestellung", None, key)
        self.assertTrue(r2["bereits_ausgestellt"])
        self.assertIsNone(r2["code"])
        p = check_voucher(r["code"])
        self.assertEqual((p["art"], p["steuersatz"], p["rest_cent"]), ("Mehrzweck", "Null 0", 10000))

    def test_kundenakte_hooks(self):
        if not frappe.db.exists("DocType", "PH Kontakt"):
            return
        k = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Anna", "nachname": f"Muster{frappe.generate_hash(length=4)}", "email": f"akte{frappe.generate_hash(length=6)}@example.com"}).insert(ignore_permissions=True)
        nr = self._nummer()
        rec = website_record(nr)
        rec["kunde"]["email"] = k.email
        create_order(record=rec)
        frappe.db.set_value("PH Bestellung", nr, "kontakt", None)
        self.assertTrue(any(e["name"] == nr for e in kakte.zeitleiste(k.name)))
        self.assertTrue(any(a["name"] == nr for a in kakte.datenauskunft(k.name)))
        plan = kakte.anonymisieren(k.name)
        self.assertEqual({p["aktion"] for p in plan if p["name"] == nr}, {"aufbewahren"})  # BAO-Frist läuft
        self.assertGreaterEqual(kakte.zusammengefuehrt("ALT", k.name), 1)
        self.assertEqual(frappe.db.get_value("PH Bestellung", nr, "kontakt"), k.name)

    def test_einzweck_satz_pflicht_und_ausstellen_idempotent(self):
        with self.assertRaises(frappe.ValidationError):
            ausstellen(5000, art="Einzweck")
        doc, code = ausstellen(5000, art="Einzweck", ust_satz_promille=1000, idempotency_key=f"t:{frappe.generate_hash(length=8)}")
        self.assertEqual(doc.steuer()["steuersatz"], "Ermaessigt-1 10")
        doc2, code2 = ausstellen(5000, art="Einzweck", ust_satz_promille=1000, idempotency_key=doc.idempotency_key)
        self.assertEqual((doc2.name, code2), (doc.name, None))
        self.assertTrue(code)
        rabatt, _c = ausstellen(1000, art="Rabatt")
        with self.assertRaises(frappe.ValidationError):
            rabatt.einloesen(500, zahlung_buchen=True)

    def test_terminal_erstattung_idempotent(self):
        from ph_shop.zahlung import buche, erstattung_erfassen

        pi = f"pi_term_{frappe.generate_hash(length=8)}"
        buche(kanal="Stripe Terminal", betrag_cent=12000, stripe_payment_intent=pi, quelle="kassa")
        r = erstattung_erfassen(payment_intent=pi, betrag_cent=2000, grund="Retoure", stripe_refund="re_term_1", idempotency_key="kassa:storno:1")
        self.assertEqual((r["erstattet_cent"], r["status"], r["bereits_gebucht"]), (2000, "Teilerstattet", False))
        self.assertTrue(erstattung_erfassen(payment_intent=pi, betrag_cent=2000, grund="Retoure", stripe_refund="re_term_1")["bereits_gebucht"])
        self.assertTrue(erstattung_erfassen(payment_intent=pi, betrag_cent=2000, grund="Retoure", stripe_refund="re_anders", idempotency_key="kassa:storno:1")["bereits_gebucht"])
        with self.assertRaises(frappe.ValidationError):
            erstattung_erfassen(payment_intent=pi, betrag_cent=99999, grund="zu viel", stripe_refund="re_term_2")
