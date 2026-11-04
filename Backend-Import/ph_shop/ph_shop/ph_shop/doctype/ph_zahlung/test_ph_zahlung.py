"""bench --site <site> run-tests --app ph_shop --doctype "PH Zahlung" – buche()/erstatte() und Rückerstattungs-Button."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_shop.zahlung import buche, erstatte, finde


class TestPHZahlung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.flags.ph_stripe_simulation = True

    def test_buche_eingang_submitted_und_titel(self):
        z = buche(kanal="Bar", betrag_cent=12345, zahlungsreferenz="Bon 1")
        self.assertEqual(z.docstatus, 1)
        self.assertEqual(z.status, "Bezahlt")
        self.assertTrue(z.name.startswith("PH-ZAH-"))
        self.assertIn("123.45", z.titel)
        self.assertEqual(float(z.betrag_eur), 123.45)

    def test_buche_idempotent_payment_intent(self):
        pi = f"pi_test_{frappe.generate_hash(length=8)}"
        a = buche(kanal="Stripe Checkout", betrag_cent=5000, stripe_payment_intent=pi, livemode=False)
        b = buche(kanal="Stripe Checkout", betrag_cent=5000, stripe_payment_intent=pi, livemode=False)
        self.assertEqual(a.name, b.name)
        self.assertTrue(b.flags.bereits_gebucht)
        self.assertEqual(finde(stripe_payment_intent=pi), a.name)

    def test_buche_idempotency_key(self):
        a = buche(kanal="Ueberweisung", betrag_cent=100, idempotency_key="test-idem-zahlung-1")
        b = buche(kanal="Ueberweisung", betrag_cent=100, idempotency_key="test-idem-zahlung-1")
        self.assertEqual(a.name, b.name)

    def test_betrag_null_abgelehnt(self):
        with self.assertRaises(frappe.ValidationError):
            buche(kanal="Bar", betrag_cent=0)

    def test_erstatte_teil_und_voll(self):
        z = buche(kanal="Bar", betrag_cent=10000)
        g1 = erstatte(z, 3000, "Kulanz")
        self.assertEqual(g1.art, "Erstattung")
        self.assertEqual(g1.ursprung, z.name)
        self.assertEqual(g1.docstatus, 1)
        z.reload()
        self.assertEqual((z.erstattet_cent, z.status, len(z.erstattungen)), (3000, "Teilerstattet", 1))
        with self.assertRaises(frappe.ValidationError):
            erstatte(z, 8000, "zu viel")
        erstatte(z, 7000, "Rest")
        z.reload()
        self.assertEqual((z.erstattet_cent, z.status), (10000, "Erstattet"))

    def test_erstatte_idempotent_refund_id(self):
        z = buche(kanal="Stripe Checkout", betrag_cent=4000, stripe_payment_intent=f"pi_test_{frappe.generate_hash(length=8)}", livemode=False)
        a = erstatte(z, 1000, "x", stripe_refund="re_test_dup_1")
        b = erstatte(z, 1000, "x", stripe_refund="re_test_dup_1")
        self.assertEqual(a.name, b.name)
        z.reload()
        self.assertEqual(z.erstattet_cent, 1000)

    def test_cancel_verboten(self):
        z = buche(kanal="Bar", betrag_cent=500)
        with self.assertRaises(frappe.ValidationError):
            z.cancel()

    def test_button_rueckerstatten_stripe_simuliert(self):
        z = buche(kanal="Stripe Checkout", betrag_cent=2500, stripe_payment_intent=f"pi_test_{frappe.generate_hash(length=8)}", livemode=False)
        r = z.rueckerstatten(2500, "Storno")
        self.assertTrue(r["gegenbuchung"])
        self.assertTrue(r["simuliert"])
        self.assertTrue(r["stripe_refund"].startswith("re_sim_"))
        z.reload()
        self.assertEqual(z.status, "Erstattet")

    def test_vier_augen_grenze(self):
        frappe.db.set_single_value("PH Stripe Einstellungen", "vier_augen_ab_cent", 100000)
        frappe.cache().delete_value("ph_shop:stripe_einstellungen")
        z = buche(kanal="Bar", betrag_cent=150000)
        # Testbenutzer mit Shop-Leitung, aber ohne Geschäftsführung
        user = "shop-leitung-test@example.com"
        if not frappe.db.exists("User", user):
            u = frappe.get_doc({"doctype": "User", "email": user, "first_name": "Leitung", "send_welcome_email": 0}).insert(ignore_permissions=True)
            u.add_roles("PH Shop Leitung")
        frappe.set_user(user)
        try:
            r = frappe.get_doc("PH Zahlung", z.name).rueckerstatten(120000, "Widerruf")
            self.assertTrue(r.get("angefordert"))
            self.assertEqual(frappe.db.get_value("PH Zahlung", z.name, "status"), "Erstattung angefordert")
        finally:
            frappe.set_user("Administrator")
        r2 = frappe.get_doc("PH Zahlung", z.name).erstattung_freigeben()
        self.assertTrue(r2["gegenbuchung"])
        self.assertEqual(frappe.db.get_value("PH Zahlung", z.name, "status"), "Teilerstattet")
