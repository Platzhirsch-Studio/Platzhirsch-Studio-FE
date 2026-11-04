"""bench --site <site> run-tests --app ph_shop --doctype "PH Bestellung" – Anlage, USt, API, Webhook-Ablauf, Idempotenz, Erstattung."""

import json

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_shop.api import create_order, get_order, order_event, request_withdrawal
from ph_shop.stripe_webhook import verarbeite


def website_record(nummer, zahlung="online", lieferart="versand", token="a" * 36):
    """Datensatz wie src/lib/shop/handlers.js checkoutHandler ihn anlegt."""
    return {
        "id": nummer,
        "token": token,
        "status": "reserviert" if zahlung == "vorort" else "offen",
        "modus": "test",
        "testmodus": True,
        "lieferart": lieferart,
        "zahlung": zahlung,
        "kunde": {"name": "Anna Muster", "email": "anna@example.com", "telefon": "+43 660 1234567"},
        "adresse": {"land": "AT", "plz": "6911", "ort": "Lochau", "strasse": "Landstraße", "hausnr": "11", "zusatz": ""} if lieferart == "versand" else None,
        "zeilen": [
            {"slug": "assouline-bildband", "variante": None, "varianteName": None, "name": "Bildband", "markeName": "Assouline", "menge": 1, "einzelCent": 10000, "summeCent": 10000, "kategorie": "bildband", "ustKlasse": "ermaessigt", "zerbrechlich": False, "test": True},
            {"slug": "kerze-gross", "variante": "v1", "varianteName": {"de": "Groß", "en": "Large"}, "name": "Duftkerze", "markeName": "Assouline", "menge": 2, "einzelCent": 3000, "summeCent": 6000, "kategorie": "accessoire", "ustKlasse": "normal", "zerbrechlich": True, "test": True},
        ],
        "summen": {"warenCent": 16000, "versandCent": 990 if lieferart == "versand" else 0, "gesamtCent": 16990 if lieferart == "versand" else 16000, "mwstCent": 0, "ust": {"steuerland": "AT", "posten": []}},
        "versand": {"tarifId": "q_" + "0" * 24, "cent": 990, "quelle": "pauschale", "dienst": {"carrier": "DPD", "name": "Classic", "tage": 2}, "service": None, "pakete": [{"kg": 2}], "versichert": True, "zerbrechlich": True} if lieferart == "versand" else None,
        "locale": "de",
        "angelegt": "2026-11-04T09:00:00.000Z",
    }


def session_event(event_id, nummer, typ="checkout.session.completed", betrag=16990, paid=True, pi="pi_test_1", livemode=False):
    return {"id": event_id, "type": typ, "livemode": livemode, "api_version": "2024-06-20", "data": {"object": {"id": f"cs_{event_id}", "object": "checkout.session", "payment_status": "paid" if paid else "unpaid", "amount_total": betrag, "currency": "eur", "payment_intent": pi, "client_reference_id": nummer, "metadata": {"art": "shop", "order_id": nummer}, "customer_details": {"email": "anna@example.com", "name": "Anna Muster"}}}}


def refund_event(event_id, pi, amount, refunded, voll):
    return {"id": event_id, "type": "charge.refunded", "livemode": False, "data": {"object": {"id": f"ch_{event_id}", "object": "charge", "payment_intent": pi, "amount": amount, "amount_refunded": refunded, "refunded": voll, "metadata": {}, "refunds": {"data": [{"id": f"re_{event_id}", "amount": refunded, "status": "succeeded", "reason": "requested_by_customer"}]}}}}


class TestPHBestellung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.db.set_single_value("PH Shop Einstellungen", "shop_modus", "test")
        frappe.flags.ph_stripe_simulation = True

    def _nummer(self):
        import secrets

        return f"PH-S-261104-{secrets.token_hex(3).upper()}"  # wie newId() in handlers.js

    def test_anlage_summen_und_ust(self):
        r = create_order(record=website_record(self._nummer()))
        doc = frappe.get_doc("PH Bestellung", r["referenz"])
        self.assertEqual(doc.status, "offen")
        self.assertEqual(doc.waren_cent, 16000)
        self.assertEqual(doc.versand_cent, 990)
        self.assertEqual(doc.gesamt_cent, 16990)
        self.assertEqual(doc.steuerland, "AT")
        self.assertEqual(doc.oss, 0)
        saetze = {u.satz_promille: u for u in doc.ust_aufteilung}
        self.assertEqual(set(saetze), {2000, 1000})
        self.assertEqual(saetze[1000].waren_cent, 10000)
        self.assertEqual(sum(u.versand_cent for u in doc.ust_aufteilung), 990)
        self.assertEqual(doc.positionen[1].variante_name, "Groß")
        self.assertEqual(doc.positionen[1].ust_satz_promille, 2000)
        self.assertEqual(len(doc.verlauf), 1)
        self.assertTrue(doc.kunden_token_hash)

    def test_create_order_idempotent_und_pflichtfeld(self):
        rec = website_record(self._nummer())
        a = create_order(record=rec, idempotency_key="test-order-idem-1")
        b = create_order(record=rec, idempotency_key="test-order-idem-1")
        self.assertEqual(a["referenz"], b["referenz"])
        c = create_order(record=rec)  # gleiche Bestellnummer ohne Schlüssel → vorhandene zurück
        self.assertEqual(c["referenz"], a["referenz"])
        kaputt = website_record(self._nummer())
        kaputt["kunde"]["email"] = ""
        antwort = create_order(record=kaputt)
        self.assertEqual(antwort.get("code"), "invalid")

    def test_reservierung_vorort_sendet_bestaetigung(self):
        r = create_order(record=website_record(self._nummer(), zahlung="vorort", lieferart="abholung"))
        doc = frappe.get_doc("PH Bestellung", r["referenz"])
        self.assertEqual(doc.status, "reserviert")
        self.assertTrue(doc.abholung_bis)
        self.assertIn(doc.mail_status, ("gesendet", "fehlgeschlagen"))
        code = doc.abholbereit_melden()
        doc.reload()
        self.assertEqual((doc.status, doc.abholcode), ("abholbereit", code))
        with self.assertRaises(frappe.ValidationError):
            doc.abgeholt_melden()  # noch nicht bezahlt
        doc.zahlung_erfassen("Bar")
        doc.reload()
        self.assertTrue(doc.bezahlt_am)
        doc.abgeholt_melden()
        self.assertEqual(frappe.db.get_value("PH Bestellung", doc.name, "status"), "abgeholt")

    def test_webhook_completed_bezahlt_zahlung_submitted_und_duplikat(self):
        nummer = self._nummer()
        create_order(record=website_record(nummer))
        pi = f"pi_test_{frappe.generate_hash(length=8)}"
        evt = f"evt_test_{frappe.generate_hash(length=10)}"
        ergebnis, _ = verarbeite(session_event(evt, nummer, pi=pi))
        self.assertEqual(ergebnis, "bezahlt")
        doc = frappe.get_doc("PH Bestellung", nummer)
        self.assertEqual(doc.status, "bezahlt")
        self.assertEqual(doc.payment_intent, pi)
        z = frappe.get_doc("PH Zahlung", doc.zahlung_ref)
        self.assertEqual((z.docstatus, z.status, z.betrag_cent, z.kanal, z.livemode), (1, "Bezahlt", 16990, "Stripe Checkout", 0))
        self.assertEqual(frappe.db.get_value("PH Stripe Ereignis", evt, "status"), "verarbeitet")
        # Duplikat: gleiche Event-ID → wiederholt, keine zweite Zahlung
        ergebnis2, _ = verarbeite(session_event(evt, nummer, pi=pi))
        self.assertEqual(ergebnis2, "wiederholt")
        self.assertEqual(frappe.db.count("PH Zahlung", {"stripe_payment_intent": pi}), 1)
        # Zweites Ereignis (async_payment_succeeded) für dieselbe Session → bereits_erfuellt
        ergebnis3, _ = verarbeite(session_event(f"evt_test_{frappe.generate_hash(length=10)}", nummer, typ="checkout.session.async_payment_succeeded", pi=pi))
        self.assertEqual(ergebnis3, "bereits_erfuellt")

    def test_webhook_unpaid_dann_failed_dann_expired(self):
        nummer = self._nummer()
        create_order(record=website_record(nummer))
        verarbeite(session_event(f"evt_test_{frappe.generate_hash(length=10)}", nummer, paid=False))
        self.assertEqual(frappe.db.get_value("PH Bestellung", nummer, "status"), "zahlung_ausstehend")
        verarbeite(session_event(f"evt_test_{frappe.generate_hash(length=10)}", nummer, typ="checkout.session.async_payment_failed"))
        self.assertEqual(frappe.db.get_value("PH Bestellung", nummer, "status"), "fehlgeschlagen")
        nummer2 = self._nummer()
        create_order(record=website_record(nummer2))
        verarbeite(session_event(f"evt_test_{frappe.generate_hash(length=10)}", nummer2, typ="checkout.session.expired"))
        self.assertEqual(frappe.db.get_value("PH Bestellung", nummer2, "status"), "abgelaufen")

    def test_webhook_teilerstattung(self):
        nummer = self._nummer()
        create_order(record=website_record(nummer))
        pi = f"pi_test_{frappe.generate_hash(length=8)}"
        verarbeite(session_event(f"evt_test_{frappe.generate_hash(length=10)}", nummer, pi=pi))
        e1 = f"evt_test_{frappe.generate_hash(length=10)}"
        ergebnis, _ = verarbeite(refund_event(e1, pi, 16990, 5000, False))
        self.assertEqual(ergebnis, "teilerstattet")
        doc = frappe.get_doc("PH Bestellung", nummer)
        self.assertEqual((doc.status, doc.erstattet_cent), ("teilerstattet", 5000))
        z = frappe.get_doc("PH Zahlung", doc.zahlung_ref)
        self.assertEqual((z.status, z.erstattet_cent, len(z.erstattungen)), ("Teilerstattet", 5000, 1))
        # Duplikat des Refund-Ereignisses bucht nicht doppelt
        verarbeite(refund_event(e1, pi, 16990, 5000, False))
        z.reload()
        self.assertEqual(z.erstattet_cent, 5000)

    def test_ungueltiges_ereignis_und_unbekannter_typ(self):
        with self.assertRaises(frappe.ValidationError):
            verarbeite({"type": "x"})
        ergebnis, _ = verarbeite({"id": f"evt_test_{frappe.generate_hash(length=10)}", "type": "customer.created", "livemode": False, "data": {"object": {}}})
        self.assertEqual(ergebnis, "ignoriert")

    def test_get_order_token_und_oeffentliche_sicht(self):
        nummer = self._nummer()
        create_order(record=website_record(nummer, token="b" * 36))
        sicht = get_order(nummer, token="b" * 36)
        self.assertEqual(sicht["id"], nummer)
        self.assertEqual(sicht["vorname"], "Anna")
        self.assertNotIn("kunde_email", json.dumps(sicht))
        falsch = get_order(nummer, token="c" * 36)
        self.assertEqual(falsch.get("code"), "not_found")

    def test_order_event_spiegelt_bezahlt(self):
        nummer = self._nummer()
        create_order(record=website_record(nummer))
        r = order_event(nummer, typ="checkout.session.completed", payment_intent=f"pi_test_{frappe.generate_hash(length=8)}", session="cs_x", livemode=0, betrag_bezahlt_cent=16990)
        self.assertEqual(r["status"], "bezahlt")
        self.assertTrue(frappe.db.get_value("PH Bestellung", nummer, "zahlung_ref"))

    def test_request_withdrawal_zuordnung(self):
        nummer = self._nummer()
        create_order(record=website_record(nummer))
        r = request_withdrawal(name="Anna Muster", email="anna@example.com", bestellung=nummer, anschrift="Landstraße 11, 6911 Lochau", artikel="Bildband", bestelltAm="2026-11-04", id="WS-TEST-0001")
        self.assertTrue(r["zugeordnet"])
        w = frappe.get_doc("PH Widerruf", r["referenz"])
        self.assertEqual((w.bestellung, w.eingangsnummer), (nummer, "WS-TEST-0001"))
        self.assertEqual(frappe.db.get_value("PH Bestellung", nummer, "widerruf"), w.name)
        fremd = request_withdrawal(name="Böse Person", email="jemand@example.com", bestellung=nummer)
        self.assertFalse(fremd["zugeordnet"])
        self.assertTrue(fremd["id"].startswith("WS-"))

    def test_storno_mit_erstattung_simuliert(self):
        nummer = self._nummer()
        create_order(record=website_record(nummer))
        verarbeite(session_event(f"evt_test_{frappe.generate_hash(length=10)}", nummer, pi=f"pi_test_{frappe.generate_hash(length=8)}"))
        doc = frappe.get_doc("PH Bestellung", nummer)
        doc.stornieren("Kunde wünscht Storno")
        doc.reload()
        self.assertEqual(doc.status, "storniert")
        self.assertEqual(doc.erstattet_cent, 16990)
        self.assertEqual(frappe.db.get_value("PH Zahlung", doc.zahlung_ref, "status"), "Erstattet")
