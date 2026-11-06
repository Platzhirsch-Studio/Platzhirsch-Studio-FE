"""bench --site <site> run-tests --app ph_logistik --doctype "PH Inventur" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_logistik.ph_logistik.bestand import buche
from ph_logistik.tests.helfer_test import lagerort, produkt


class TestPHInventur(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.lager = lagerort("Inventurlager")
        self.p1 = produkt("Inventur Vase")
        self.p2 = produkt("Inventur Kerze")
        buche("Wareneingang", self.p1, 3, lagerort_nach=self.lager)
        buche("Wareneingang", self.p2, 1, lagerort_nach=self.lager)

    def test_zaehlliste_zaehlen_freigeben(self):
        inv = frappe.get_doc({"doctype": "PH Inventur", "lagerort": self.lager, "datum": nowdate()}).insert()
        self.assertEqual(inv.status, "Geplant")
        self.assertIn("Inventurlager", inv.titel)
        n = inv.zaehlliste_erzeugen()
        self.assertGreaterEqual(n, 2)
        inv.starten()
        inv.reload()
        self.assertEqual(inv.status, "Laufend")
        zeile = next(p for p in inv.positionen if p.produkt == self.p1)
        self.assertEqual(zeile.soll, 3)
        self.assertEqual(inv.zaehlen(zeile.lagerbestand, 2), -1)
        zeile2 = next(p for p in inv.positionen if p.produkt == self.p2)
        inv.zaehlen(zeile2.lagerbestand, 1)
        inv.reload()
        self.assertEqual(inv.differenz_positionen, 1)
        self.assertEqual(inv.differenz_summe, -1)
        gebucht = inv.freigeben()
        self.assertEqual(gebucht, 1)
        inv.reload()
        self.assertEqual(inv.status, "Abgeschlossen")
        self.assertTrue(inv.freigegeben_am)
        self.assertEqual(frappe.db.get_value("PH Lagerbestand", zeile.lagerbestand, "menge"), 2)
        self.assertTrue(frappe.db.exists("PH Lagerbewegung", {"art": "Inventur", "bezug": inv.name, "lagerbestand": zeile.lagerbestand}))
        self.assertEqual(str(frappe.db.get_value("PH Lagerbestand", zeile2.lagerbestand, "inventur_am")), nowdate())
        # Freigabe ist idempotent (gleicher Schlüssel) – kein doppeltes Buchen
        self.assertEqual(frappe.db.count("PH Lagerbewegung", {"art": "Inventur", "bezug": inv.name}), 1)

    def test_freigabe_nur_laufend(self):
        inv = frappe.get_doc({"doctype": "PH Inventur", "lagerort": self.lager, "datum": nowdate()}).insert()
        with self.assertRaises(frappe.ValidationError):
            inv.freigeben()
        inv.verwerfen()
        self.assertEqual(frappe.db.get_value("PH Inventur", inv.name, "status"), "Verworfen")


class TestPHInventurScanFund(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def test_zaehlen_plus_und_fund(self):
        from ph_logistik.ph_logistik.bestand import buche
        from ph_logistik.tests.helfer_test import lagerort, produkt

        lo = lagerort("Testlager Inventur Scan")
        p = produkt("Testkerze Scan")
        p2 = produkt("Testkerze Fund")
        b = buche("Wareneingang", p, 3, lagerort_nach=lo)
        inv = frappe.get_doc({"doctype": "PH Inventur", "lagerort": lo, "datum": frappe.utils.nowdate()})
        inv.insert()
        inv.zaehlliste_erzeugen()
        inv.starten()
        inv.reload()
        inv.zaehlen_plus(b.lagerbestand)
        r = inv.zaehlen_plus(b.lagerbestand, 1)
        self.assertEqual((r["ist"], r["soll"], r["differenz"]), (2, 3, -1))
        with self.assertRaises(frappe.ValidationError):
            inv.zaehlen_plus("UNBEKANNT")
        inv.reload()
        neu = inv.position_hinzufuegen(produkt=p2, ist=2, bemerkung="hinter Regal")
        inv.reload()
        fund = next(x for x in inv.positionen if x.lagerbestand == neu)
        self.assertEqual((fund.fund, fund.soll, fund.ist), (1, 0, 2))
        inv.freigeben()
        self.assertEqual(frappe.db.get_value("PH Lagerbestand", neu, "menge"), 2)
        self.assertEqual(frappe.db.get_value("PH Lagerbestand", b.lagerbestand, "menge"), 2)


class TestPHInventurTeilMobil(FrappeTestCase):
    """Lager & Inventur Ergänzung: Teilinventur mit Abdeckung, Vier-Augen, mobiler Zählmodus (inventur_mobil)."""

    def setUp(self):
        frappe.set_user("Administrator")
        kennung = frappe.generate_hash(length=6)
        self.lo = lagerort(f"Testlager Teil {kennung}")
        lo = frappe.get_doc("PH Lagerort", self.lo)
        for platz in ("A1", "A2", "B1"):
            lo.append("plaetze", {"platz": platz, "aktiv": 1})
        lo.save()
        self.p = produkt(f"Testschale Teil {kennung}")
        self.b = buche("Wareneingang", self.p, 2, lagerort_nach=self.lo, platz_nach="A1").lagerbestand
        frappe.db.set_value("PH Lagerbestand", self.b, "platz", "A1")

    def test_teilinventur_abdeckung(self):
        from ph_logistik.ph_logistik.inventur_plan import naechste_plaetze

        inv = frappe.get_doc({"doctype": "PH Inventur", "lagerort": self.lo, "datum": nowdate(), "inventur_art": "Teilinventur"}).insert()
        with self.assertRaises(frappe.ValidationError):
            inv.zaehlliste_erzeugen()  # ohne Plätze
        plaetze = inv.plaetze_vorschlagen(2)
        self.assertEqual(len(plaetze), 2)
        inv.reload()
        inv.plaetze = "A1"
        inv.save()
        self.assertEqual(inv.zaehlliste_erzeugen(), 1)
        inv.starten()
        inv.reload()
        inv.zaehlen(self.b, 2)
        inv.freigeben()
        self.assertEqual(str(frappe.db.get_value("PH Lagerort Platz", {"parent": self.lo, "platz": "A1"}, "zuletzt_gezaehlt")), nowdate())
        self.assertIsNone(frappe.db.get_value("PH Lagerort Platz", {"parent": self.lo, "platz": "B1"}, "zuletzt_gezaehlt"))
        self.assertNotIn("A1", [p["platz"] for p in naechste_plaetze(self.lo, 2)])

    def test_vier_augen(self):
        mail = "ph-inventur-leitung@example.com"
        if not frappe.db.exists("User", mail):
            u = frappe.get_doc({"doctype": "User", "email": mail, "first_name": "Inventur", "send_welcome_email": 0, "roles": [{"role": "PH Logistik Leitung"}]})
            u.insert(ignore_permissions=True)
        inv = frappe.get_doc({"doctype": "PH Inventur", "lagerort": self.lo, "datum": nowdate()}).insert()
        inv.starten()
        inv.db_set("gezaehlt_von", mail)
        frappe.set_user(mail)
        try:
            with self.assertRaises(frappe.ValidationError):
                frappe.get_doc("PH Inventur", inv.name).freigeben()
        finally:
            frappe.set_user("Administrator")
        frappe.get_doc("PH Inventur", inv.name).freigeben()  # andere Person darf
        self.assertEqual(frappe.db.get_value("PH Inventur", inv.name, "status"), "Abgeschlossen")

    def test_mobil_api(self):
        from ph_logistik.ph_logistik import inventur_mobil as M

        inv = frappe.get_doc({"doctype": "PH Inventur", "lagerort": self.lo, "datum": nowdate()}).insert()
        self.assertIn(inv.name, [r.name for r in M.inventur_offen()])
        M.starten(inv.name)
        n = M.naechste_position(inv.name)
        self.assertEqual((n["fertig"], n["position"]["lagerbestand"]), (0, self.b))
        s = M.scan(inv.name, f"{self.lo}/A1")
        self.assertEqual((s["art"], len(s["positionen"])), ("platz", 1))
        r1 = M.zaehlen_plus(inv.name, self.b, 1, idempotency_key=f"t-{inv.name}-1")
        r2 = M.zaehlen_plus(inv.name, self.b, 1, idempotency_key=f"t-{inv.name}-1")  # Wiederholung zählt nicht doppelt
        self.assertEqual((r1["ist"], r2.get("wiederholt")), (1, 1))
        M.zaehlen(inv.name, self.b, 2)
        self.assertEqual(M.naechste_position(inv.name)["fertig"], 1)
        self.assertEqual(M.fortschritt(inv.name)["gezaehlt"], 1)
        self.assertEqual(M.scan(inv.name, "UNBEKANNT-XYZ")["art"], "unbekannt")
