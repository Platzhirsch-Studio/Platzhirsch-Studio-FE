"""bench --site <site> run-tests --app ph_shop --doctype "PH Stripe Ereignis" – payment_event v1 (backoffice.js), Anzahlung doppelt, Payout, Fehlerpfad."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_shop.api import create_deposit, get_deposit, payment_event
from ph_shop.stripe_webhook import verarbeite


def ereignis_v1(typ, art, referenz, betrag, zahlungsstatus, pi=None, session=None, beleg=None, livemode=False):
    """Schema v1 aus src/lib/payments/backoffice.js paymentEvent()."""
    e = {"v": 1, "typ": typ, "zeit": "2026-11-04T10:00:00.000Z", "referenz": referenz, "art": art, "betrag_cent": betrag, "waehrung": "EUR", "zahlungsstatus": zahlungsstatus, "stripe": {"session": session, "payment_intent": pi, "livemode": livemode}}
    if beleg:
        e["beleg"] = beleg
    return e


class TestPHStripeEreignis(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")
        frappe.flags.ph_stripe_simulation = True

    def test_payment_event_gutschein_bezahlt_und_wiederholt(self):
        ref = "G-" + frappe.generate_hash(length=8).upper()[:4] + "-" + frappe.generate_hash(length=8).upper()[4:8]
        pi = f"pi_test_{frappe.generate_hash(length=8)}"
        e = ereignis_v1("gutschein.bezahlt", "gutschein", ref, 10000, "bezahlt", pi=pi, session="cs_pe_1", beleg={"name": "Anna Muster", "firma": "", "adresse": {"line1": "Weg 1", "postal_code": "6900", "city": "Bregenz", "country": "AT"}, "anzahl": 2, "einzelwert_cent": 5000, "codes_ende": ["ABCD", "EFGH"]})
        r = payment_event(event=e)
        self.assertEqual((r["doctype"], r["referenz"], r["status"], r["ergebnis"]), ("PH Gutschein Bestellung", ref, "bezahlt", "bezahlt"))
        gb = frappe.get_doc("PH Gutschein Bestellung", ref)
        self.assertEqual((gb.anzahl, gb.betrag_cent, gb.summe_cent, gb.rechnung_name), (2, 5000, 10000, "Anna Muster"))
        self.assertEqual(frappe.db.count("PH Zahlung", {"stripe_payment_intent": pi}), 1)
        r2 = payment_event(event=e)
        self.assertEqual(r2["ergebnis"], "wiederholt")
        self.assertEqual(frappe.db.count("PH Zahlung", {"stripe_payment_intent": pi}), 1)
        # Teilerstattung über v1
        r3 = payment_event(event=ereignis_v1("gutschein.teilerstattet", "gutschein", ref, 2500, "teilerstattet", pi=pi))
        self.assertEqual(r3["status"], "teilerstattet")
        self.assertEqual(frappe.db.get_value("PH Zahlung", {"stripe_payment_intent": pi}, "erstattet_cent"), 2500)
        # Widerruf über v1
        r4 = payment_event(event=ereignis_v1("gutschein.widerruf", "gutschein", ref, 10000, "widerruf_eingegangen", pi=pi))
        self.assertEqual(r4["status"], "widerrufen")

    def test_payment_event_anzahlung_bezahlt_doppelt_erstattet(self):
        pi = f"pi_test_{frappe.generate_hash(length=8)}"
        r = payment_event(event=ereignis_v1("anzahlung.bezahlt", "anzahlung", "AB-2026-00042", 50000, "bezahlt", pi=pi, session="cs_az_1", beleg={"anzahlung_id": "AZ-TEST-0001", "name": "Bert", "adresse": None, "kunde": "k1"}))
        self.assertEqual((r["doctype"], r["referenz"], r["status"]), ("PH Anzahlung", "AZ-TEST-0001", "bezahlt"))
        az = frappe.get_doc("PH Anzahlung", "AZ-TEST-0001")
        self.assertEqual((az.auftrag_referenz, az.betrag_cent, az.bezahlt_session), ("AB-2026-00042", 50000, "cs_az_1"))
        pi2 = f"pi_test_{frappe.generate_hash(length=8)}"
        r2 = payment_event(event=ereignis_v1("anzahlung.doppelt", "anzahlung", "AB-2026-00042", 50000, "doppelt_bezahlt", pi=pi2, session="cs_az_2", beleg={"anzahlung_id": "AZ-TEST-0001", "hinweis": "Rückerstattung im Stripe-Dashboard auslösen"}))
        self.assertEqual(r2["status"], "doppelt")
        az.reload()
        self.assertEqual(len(az.doppelt), 1)
        self.assertTrue(az.doppelt[0].zahlung)
        r3 = payment_event(event=ereignis_v1("anzahlung.doppelt_erstattet", "anzahlung", "AB-2026-00042", 50000, "doppelt_erstattet", pi=pi2))
        self.assertEqual(r3["ergebnis"], "doppelt_erstattet")
        az.reload()
        self.assertEqual((az.doppelt[0].erstattet_cent, az.status), (50000, "bezahlt"))

    def test_payment_event_schema_fehler(self):
        self.assertEqual(payment_event(event={"v": 2, "typ": "x", "referenz": "y", "art": "gutschein"}).get("code"), "invalid")
        self.assertEqual(payment_event(event={"v": 1, "typ": "x", "referenz": "y", "art": "unbekannt"}).get("code"), "invalid")
        self.assertEqual(payment_event(event={"v": 1, "typ": "x"}).get("code"), "invalid")

    def test_anzahlung_webhook_doppelt_und_button(self):
        r = create_deposit(record={"id": "AZ-TEST-0002", "auftrag": "AN-2026-00007", "betrag_cent": 120000, "email": "kunde@example.com", "gueltig_tage": 14})
        self.assertEqual(r["status"], "offen")
        self.assertEqual(get_deposit(id="AZ-TEST-0002")["betrag_cent"], 120000)
        pi1 = f"pi_test_{frappe.generate_hash(length=8)}"
        pi2 = f"pi_test_{frappe.generate_hash(length=8)}"
        mk = lambda eid, sid, pi: {"id": eid, "type": "checkout.session.completed", "livemode": False, "data": {"object": {"id": sid, "payment_status": "paid", "amount_total": 120000, "currency": "eur", "payment_intent": pi, "metadata": {"art": "anzahlung", "deposit_id": "AZ-TEST-0002", "auftrag": "AN-2026-00007"}, "customer_details": {"email": "kunde@example.com"}}}}  # noqa: E731
        e1, _ = verarbeite(mk(f"evt_test_{frappe.generate_hash(length=10)}", "cs_d1", pi1))
        self.assertEqual(e1, "erfuellt")
        e2, _ = verarbeite(mk(f"evt_test_{frappe.generate_hash(length=10)}", "cs_d2", pi2))
        self.assertEqual(e2, "doppelt")
        az = frappe.get_doc("PH Anzahlung", "AZ-TEST-0002")
        self.assertEqual((az.status, len(az.doppelt)), ("doppelt", 1))
        ergebnisse = az.doppelte_erstatten()
        self.assertEqual(len(ergebnisse), 1)
        self.assertTrue(ergebnisse[0]["gegenbuchung"])
        az.reload()
        self.assertEqual((az.status, az.doppelt[0].erstattet_cent), ("bezahlt", 120000))
        self.assertEqual(frappe.db.get_value("PH Zahlung", {"stripe_payment_intent": pi2}, "status"), "Erstattet")

    def test_payout_ereignis_und_abgleich(self):
        pid = f"po_test_{frappe.generate_hash(length=8)}"
        e, _ = verarbeite({"id": f"evt_test_{frappe.generate_hash(length=10)}", "type": "payout.paid", "livemode": False, "data": {"object": {"id": pid, "object": "payout", "amount": 25000, "currency": "eur", "status": "paid", "arrival_date": 1_762_300_800, "metadata": {}}}})
        self.assertEqual(e, "bezahlt")
        po = frappe.get_doc("PH Stripe Auszahlung", pid)
        self.assertEqual((po.betrag_cent, po.status), (25000, "bezahlt"))
        r = po.abgleichen()
        self.assertTrue(r["simuliert"])
        self.assertIn("differenz_cent", r)

    def test_livemode_im_testmodus_ignoriert(self):
        e, name = verarbeite({"id": f"evt_test_{frappe.generate_hash(length=10)}", "type": "checkout.session.completed", "livemode": True, "data": {"object": {"id": "cs_live", "payment_status": "paid", "metadata": {"art": "shop", "order_id": "PH-S-000000-000000"}}}})
        self.assertEqual(e, "ignoriert")
        self.assertEqual(frappe.db.get_value("PH Stripe Ereignis", name, "ergebnis"), "livemode im Testmodus abgewiesen")

    def test_fehler_wird_protokolliert_und_erneut_versucht(self):
        from unittest.mock import patch

        eid = f"evt_test_{frappe.generate_hash(length=10)}"
        evt = {"id": eid, "type": "charge.dispute.created", "livemode": False, "data": {"object": {"id": "dp_1", "amount": 100, "payment_intent": None, "reason": "fraudulent"}}}
        with patch("ph_shop.stripe_webhook._dispute", side_effect=RuntimeError("kaputt")):
            with self.assertRaises(RuntimeError):
                verarbeite(evt)
        self.assertEqual(frappe.db.get_value("PH Stripe Ereignis", eid, "status"), "fehler")
        e, _ = verarbeite(evt)  # zweite Zustellung verarbeitet nach Fehler erneut (kein „wiederholt“)
        self.assertEqual(e, "dispute")
        self.assertEqual(frappe.db.get_value("PH Stripe Ereignis", eid, ["status", "versuche"]), ("verarbeitet", 2))
