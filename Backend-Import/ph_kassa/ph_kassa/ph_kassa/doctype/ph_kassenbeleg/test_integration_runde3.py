"""Site-Tests Integration Runde 3 (bench --site <site> run-tests --app ph_kassa --module
ph_kassa.ph_kassa.doctype.ph_kassenbeleg.test_integration_runde3).

Gutscheine über ph_shop (ausstellen_verkauf / verkauf_stornieren / Rabatt als Entgeltminderung), Ausstellungsstück
(ph_logistik), Kundenkarte (ph_kundenkarte.kassa), Rechnungsempfänger über ph_crm. Nachbar-Apps fehlen → skip.
Kein Netz: Signer im Speicher, Terminal-Mock.
"""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_kassa.ph_kassa.doctype.ph_kassenbeleg.test_ph_kassenbeleg import kasse_anlegen
from ph_kassa.ph_kassa.page.ph_kassa import ph_kassa as page
from ph_kassa.rksv import buchung
from ph_kassa.rksv.signer import SoftwareSigner


def _installiert(doctype):
    return bool(frappe.db.exists("DocType", doctype))


class TestIntegrationRunde3(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.flags.ph_kassa_test_signer = SoftwareSigner()
        self.kasse = kasse_anlegen()
        frappe.get_doc("PH Signatureinheit", "Test-SEE Unit").zertifikat_abrufen()
        if not self.kasse.startbeleg:
            buchung.startbeleg(self.kasse.name)
            self.kasse.reload()

    def tearDown(self):
        frappe.flags.ph_kassa_test_signer = None

    def _buchen(self, positionen, zahlarten, **kw):
        return page.beleg_buchen(self.kasse.name, positionen, zahlarten, drucken=0, **kw)

    # ── Gutscheine (ph_shop) ────────────────────────────────────────────────
    def test_gutschein_verkauf_und_storno_sperrt(self):
        if not _installiert("PH Gutschein"):
            self.skipTest("ph_shop fehlt")
        r = self._buchen([{"art": "Gutschein Verkauf", "bezeichnung": "Gutschein", "menge": 1, "einzel_brutto_cent": 5000}], [{"zahlart": "Bar", "betrag_cent": 5000, "gegeben_cent": 5000}])
        self.assertEqual(len(r["gutschein_codes"]), 1)
        g = r["gutschein_codes"][0]["gutschein"]
        self.assertEqual(frappe.db.get_value("PH Gutschein", g, "ausgabe_beleg"), r["beleg"])
        # Wiederholung (gleicher Schlüssel) stellt nicht erneut aus
        from ph_shop.gutschein import ausstellen_verkauf

        self.assertTrue(ausstellen_verkauf(wert_cent=5000, beleg_doctype="PH Kassenbeleg", beleg=r["beleg"], idempotency_key=f"kassa:{r['beleg']}:gs:1")["bereits_ausgestellt"])
        page.storno(r["beleg"], "Test")
        self.assertEqual(frappe.db.get_value("PH Gutschein", g, "status"), "Gesperrt")

    def test_rabattgutschein_mindert_entgelt(self):
        if not _installiert("PH Gutschein"):
            self.skipTest("ph_shop fehlt")
        from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import ausstellen

        gs, _code = ausstellen(2000, test=True, kanal="Showroom", art="Rabatt", quelle="backoffice")
        pos = [{"art": "Freitext", "bezeichnung": "Vase", "menge": 1, "einzel_brutto_cent": 10000, "steuersatz": "Normal 20"}]
        r = self._buchen(pos, [{"zahlart": "Gutschein", "gutschein": gs.name, "betrag_cent": 2000}, {"zahlart": "Bar", "betrag_cent": 8000, "gegeben_cent": 8000}])
        kb = frappe.get_doc("PH Kassenbeleg", r["beleg"])
        self.assertEqual(kb.gesamt_cent, 8000)
        self.assertEqual(sum(p.brutto_cent for p in kb.positionen if p.art == "Rabatt"), -2000)
        self.assertFalse([z for z in kb.zahlarten if z.zahlart == "Gutschein"])
        self.assertEqual(frappe.db.get_value("PH Gutschein", gs.name, "rest_cent"), 0)
        page.storno(r["beleg"], "Test")
        self.assertEqual(frappe.db.get_value("PH Gutschein", gs.name, "rest_cent"), 2000)

    def test_einzweck_ohne_satz_klare_meldung(self):
        if not _installiert("PH Gutschein"):
            self.skipTest("ph_shop fehlt")
        from ph_shop.ph_shop.doctype.ph_gutschein.ph_gutschein import ausstellen

        gs, code = ausstellen(2000, test=True, kanal="Showroom", art="Mehrzweck", quelle="backoffice")
        frappe.db.set_value("PH Gutschein", gs.name, {"art": "Einzweck", "ust_satz_promille": None})  # Altbestand ohne Satz
        with self.assertRaises(frappe.ValidationError) as cm:
            page.gutschein_pruefen(code)
        self.assertIn("USt-Satz", str(cm.exception))

    # ── Ausstellungsstück (ph_logistik) ─────────────────────────────────────
    def test_ausstellungsstueck_position_und_bestand(self):
        if not _installiert("PH Lagerbestand"):
            self.skipTest("ph_logistik fehlt")
        try:
            from ph_logistik.tests.helfer_test import lagerort, produkt
        except ImportError:
            self.skipTest("ph_logistik fehlt")

        lb = frappe.get_doc({"doctype": "PH Lagerbestand", "produkt": produkt("Teststuhl Kassa"), "lagerort": lagerort("Showroom Kassa", "Showroom"), "ausstellungsstueck": 1, "seriennummer": "SN-KASSA-1", "menge": 1, "vk_cent_ausstellung": 45000}).insert()
        pos = page.ausstellungsstueck(lb.name)
        self.assertEqual((pos["bezug_doctype"], pos["einzel_brutto_cent"]), ("PH Lagerbestand", 45000))
        r = self._buchen([pos], [{"zahlart": "Bar", "betrag_cent": 45000, "gegeben_cent": 45000}], kontakt=None, rechnung_erstellen=0)
        self.assertEqual(frappe.db.get_value("PH Lagerbestand", lb.name, "status"), "Verkauft")
        self.assertTrue(frappe.db.exists("PH Lagerbewegung", {"lagerbestand": lb.name, "art": "Verkauf", "bezug": r["beleg"]}))
        with self.assertRaises(frappe.ValidationError):  # nicht zweimal kassieren
            self._buchen([page.ausstellungsstueck(lb.name)], [{"zahlart": "Bar", "betrag_cent": 45000, "gegeben_cent": 45000}])

    # ── Kundenkarte (ph_kundenkarte.kassa) ──────────────────────────────────
    def test_kundenkarte_fehler_in_kassa_form(self):
        if not _installiert("PH Kundenkarte"):
            self.skipTest("ph_kundenkarte fehlt")
        r = self._buchen([{"art": "Freitext", "bezeichnung": "Kissen", "menge": 1, "einzel_brutto_cent": 3000, "steuersatz": "Normal 20"}], [{"zahlart": "Bar", "betrag_cent": 3000, "gegeben_cent": 3000}],
                         kundenkarte="KK-ZZZZZZ", kundenkarte_vorteile=["GIBTSNICHT"])
        self.assertTrue(r["kundenkarte"]["fehler"])
        self.assertIn(r["kundenkarte"]["fehler"][0]["code"], ("not_found", "invalid"))
        e = page.code_erkennen("KK-ZZZZZZ")
        self.assertEqual(e["art"], "kundenkarte")
        self.assertIsNone(e["treffer"])
        self.assertIsNone(page._kundenkarte_zuruecknehmen(r["beleg"], "Test"))

    # ── Rechnungsempfänger (ph_crm create_kontakt) ──────────────────────────
    def test_rechnungsempfaenger_dublettenschutz(self):
        if not _installiert("PH Kontakt"):
            self.skipTest("ph_crm fehlt")
        from ph_kassa import dienste

        a = dienste.kunde_anlegen(vorname="Kassa", nachname="Dublette", strasse="Seestraße 1", plz="6900", ort="Bregenz", email="kassa.dublette@example.com")
        b = dienste.kunde_anlegen(vorname="Kassa", nachname="Dublette", strasse="Seestraße 1", plz="6900", ort="Bregenz", email="KASSA.dublette@example.com")
        self.assertTrue(a["neu"])
        self.assertTrue(b["bestehend"])
        self.assertEqual(a["kontakt"], b["kontakt"])
