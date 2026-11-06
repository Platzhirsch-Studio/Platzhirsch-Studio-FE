"""bench --site <site> run-tests --app ph_kundenkarte --doctype "PH Kundenkarte" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate

from ph_kundenkarte.ph_kundenkarte import umsatz
from ph_kundenkarte.tests.helfer import aufraeumen, einstellungen_fuer_tests, testkarte, testkontakt, vorteil


class TestPHKundenkarte(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()
        aufraeumen("PH Kundenkarte Einloesung", {"kontakt": testkontakt()})
        aufraeumen("PH Kundenkarte", {"kontakt": testkontakt()})

    def test_anlegen_nummer_titel_startstufe(self):
        k = testkarte()
        self.assertTrue(k.kartennummer.startswith("KK-"))
        self.assertEqual(len(k.kartennummer), 9)
        self.assertEqual(k.name, k.kartennummer)
        self.assertEqual(k.status, "Aktiv")
        self.assertEqual(k.stufe, "Platzhirsch")
        self.assertIn("Anna Kartentest", k.titel)
        self.assertTrue(k.wallet_pass_seriennummer)
        self.assertTrue(k.einwilligung_am)
        self.assertTrue(frappe.db.exists("PH Kundenkarte Ereignis", {"kundenkarte": k.name, "art": "Ausgestellt"}))

    def test_eine_karte_je_kontakt(self):
        testkarte()
        with self.assertRaises(frappe.ValidationError):
            testkarte()

    def test_sperren_entsperren_kuendigen(self):
        k = testkarte()
        self.assertEqual(k.sperren(grund="Verlust"), "Gesperrt")
        k.reload()
        self.assertEqual(k.status, "Gesperrt")
        self.assertEqual(k.sperrgrund, "Verlust")
        self.assertEqual(k.entsperren(), "Aktiv")
        self.assertEqual(k.kuendigen(grund="Kundenwunsch"), "Gekuendigt")
        k.reload()
        self.assertEqual(k.status, "Gekuendigt")
        self.assertEqual(frappe.db.count("PH Kundenkarte Ereignis", {"kundenkarte": k.name, "art": ("in", ["Sperrung", "Entsperrung", "Kuendigung"])}), 3)
        # Nach Kündigung darf eine neue Karte ausgestellt werden
        neu = testkarte()
        self.assertNotEqual(neu.name, k.name)

    def test_einwilligung_widerruf_leert_umsatz(self):
        k = testkarte()
        frappe.db.set_value("PH Kundenkarte", k.name, {"jahresumsatz_cent": 1234, "gesamtumsatz_cent": 5678})
        k.reload()
        k.einwilligung_auswertung = 0
        k.save()
        self.assertTrue(k.einwilligung_widerrufen_am)
        self.assertEqual(k.jahresumsatz_cent, 0)
        self.assertEqual(k.gesamtumsatz_cent, 0)
        self.assertEqual(umsatz.karte_neu_berechnen(k.name)["berechnet"], False)

    def test_umsatz_neu_berechnen_ohne_belege(self):
        k = testkarte()
        r = k.umsatz_neu_berechnen()
        self.assertTrue(r["berechnet"])
        self.assertEqual(r["jahresumsatz_cent"], 0)
        self.assertEqual(r["stufe"], "Platzhirsch")

    def test_manuelle_stufe_bleibt(self):
        k = testkarte()
        k.stufe = "Platzhirsch Privé"
        k.save()
        self.assertEqual(k.stufe_manuell, 1)
        self.assertEqual(k.stufe_seit, frappe.utils.getdate(nowdate()))
        umsatz.karte_neu_berechnen(k.name)
        self.assertEqual(frappe.db.get_value("PH Kundenkarte", k.name, "stufe"), "Platzhirsch Privé")

    def test_vorteil_einloesen_button(self):
        k = testkarte()
        name = k.vorteil_einloesen(vorteil=vorteil("Persönliche Beratung"), ort="Showroom")
        e = frappe.get_doc("PH Kundenkarte Einloesung", name)
        self.assertEqual(e.kundenkarte, k.name)
        self.assertEqual(e.status, "Eingeloest")
        self.assertEqual(e.stufe, "Platzhirsch")

    def test_portal_daten(self):
        k = testkarte()
        d = k.portal_daten()
        self.assertEqual(d["kartennummer"], k.name)
        self.assertEqual(d["naechste_stufe"], "Platzhirsch Plus")
        self.assertEqual(d["fehlt_noch_cent"], 1_000_000)
        titel = [v["titel"] for v in d["vorteile"]]
        self.assertIn("Persönliche Beratung", titel)
        self.assertNotIn("Montage durch unser Team", titel)

    def test_kontakt_spiegel(self):
        k = testkarte()
        if frappe.get_meta("PH Kontakt").has_field("ph_kundenkarte_karte"):
            self.assertEqual(frappe.db.get_value("PH Kontakt", k.kontakt, "ph_kundenkarte_karte"), k.name)

    def test_geburtstagsaufgabe(self):
        from ph_kundenkarte.ph_kundenkarte.tasks import geburtstage_heute

        k = testkarte(geburtstag=add_days(nowdate(), -365 * 30))
        geburtstage_heute()
        self.assertTrue(frappe.db.exists("PH Aufgabe", {"referenz_doctype": "PH Kundenkarte", "referenz_name": k.name}))
        geburtstage_heute()
        self.assertEqual(frappe.db.count("PH Aufgabe", {"referenz_doctype": "PH Kundenkarte", "referenz_name": k.name}), 1)

    def test_wallet_pass_json_und_503_ohne_zertifikat(self):
        from ph_core.api import ApiFehler
        from ph_kundenkarte.ph_kundenkarte import wallet

        k = testkarte()
        p = wallet.apple_pass_json(k.name)
        self.assertEqual(p["barcodes"][0]["message"], k.kartennummer)
        if not frappe.conf.get("ph_wallet_apple_cert"):
            with self.assertRaises(ApiFehler) as cm:
                wallet.apple_pkpass(k.name)
            self.assertEqual(cm.exception.http_status, 503)

    def tearDown(self):
        frappe.db.rollback()


class TestKartenLebenszyklus(FrappeTestCase):
    """Sperrgrund-Katalog, Ersatzkarte, Übertragung, Zusammenführen, Übergabe, Kassa-API (lookup/redeem/cancel/hand_over)."""

    ZWEIT_EMAIL = "kundenkarte-test-2@example.com"

    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_fuer_tests()
        self.kontakt = testkontakt()
        self.kontakt2 = testkontakt(email=self.ZWEIT_EMAIL, nachname="Partnertest", vorname="Ben")
        for k in (self.kontakt, self.kontakt2):
            aufraeumen("PH Kundenkarte Einloesung", {"kontakt": k})
            aufraeumen("PH Kundenkarte", {"kontakt": k})
        frappe.local.response = frappe._dict()

    def _antwort(self):
        return frappe.local.response.get("message"), frappe.local.response.get("http_status_code")

    def _einloesen(self, karte, titel, **werte):
        d = {"doctype": "PH Kundenkarte Einloesung", "kundenkarte": karte, "vorteil": vorteil(titel), "ort": "Showroom"}
        d.update(werte)
        return frappe.get_doc(d).insert(ignore_permissions=True)

    def test_sperrgrund_pflicht_und_endgueltig(self):
        k = testkarte()
        with self.assertRaises(frappe.ValidationError):
            k.sperren()
        k.sperren(sperrgrund_art="Diebstahl")
        k.reload()
        self.assertEqual(k.sperrgrund_art, "Diebstahl")
        with self.assertRaises(frappe.ValidationError):
            k.entsperren()  # Diebstahl ist endgültig
        k2 = testkarte(kontakt=self.kontakt2)
        k2.sperren(grund="Karte im Auto vergessen")
        self.assertEqual(frappe.db.get_value("PH Kundenkarte", k2.name, "sperrgrund_art"), "Sonstiges")

    def test_ersatzkarte_neue_nummer_limit_bleibt(self):
        k = testkarte()
        self._einloesen(k.name, "Gruß zum Geburtstag")
        neu = k.ersatzkarte_ausstellen(sperrgrund_art="Verlust")
        k.reload()
        self.assertEqual(k.status, "Ersetzt")
        self.assertEqual(k.nachfolger_karte, neu)
        n = frappe.get_doc("PH Kundenkarte", neu)
        self.assertEqual((n.status, n.stufe, n.vorgaenger_karte, n.kontakt), ("Aktiv", k.stufe, k.name, k.kontakt))
        self.assertTrue(n.einwilligung_auswertung)
        with self.assertRaises(frappe.ValidationError):
            self._einloesen(neu, "Gruß zum Geburtstag")  # Jahreslimit zählt über die Kette
        from ph_kundenkarte import api

        r = api.lookup_card(kartennummer=k.name)
        self.assertEqual((r["code"], r["vorteile"]), ("card_replaced", []))

    def test_uebertragen(self):
        k = testkarte()
        neu = k.uebertragen(self.kontakt2, "Partner/Haushalt")
        k.reload()
        n = frappe.get_doc("PH Kundenkarte", neu)
        self.assertEqual((k.status, n.kontakt, n.stufe, n.einwilligung_auswertung), ("Uebertragen", self.kontakt2, k.stufe, 0))
        with self.assertRaises(frappe.ValidationError):
            n.uebertragen(self.kontakt2, "Erbe")  # gleicher Kontakt

    def test_zusammenfuehren_hoehere_stufe_einloesungen(self):
        a = testkarte()
        b = testkarte(kontakt=self.kontakt2, stufe="Platzhirsch Plus")
        e = self._einloesen(b.name, "Gruß zum Geburtstag")
        frappe.db.set_value("PH Kundenkarte", b.name, "kontakt", self.kontakt)  # Kontakt-Dublette bereits zusammengeführt
        plan = a.zusammenfuehren_mit(b.name, nur_plan=1)
        self.assertFalse(plan["ausgefuehrt"])
        ergebnis = a.zusammenfuehren_mit(b.name)
        ziel, quelle = ergebnis["ziel"], ergebnis["quellen"][0]
        self.assertEqual(frappe.db.get_value("PH Kundenkarte", ziel, "stufe"), "Platzhirsch Plus")
        self.assertEqual(frappe.db.get_value("PH Kundenkarte", quelle, ["status", "zusammengefuehrt_in"]), ("Zusammengefuehrt", ziel))
        self.assertEqual(frappe.db.get_value("PH Kundenkarte Einloesung", e.name, "kundenkarte"), ziel)
        from ph_kundenkarte import api

        r = api.lookup_card(kartennummer=quelle)
        self.assertEqual((r["kartennummer"], r["weitergeleitet_von"], r["code"]), (ziel, quelle, "ok"))

    def test_hook_kontakt_zusammengefuehrt(self):
        from ph_kundenkarte.ph_kundenkarte import kontakt as kh

        testkarte()
        testkarte(kontakt=self.kontakt2)
        ergebnis = kh.zusammengefuehrt(self.kontakt2, self.kontakt)
        self.assertTrue(ergebnis["ausgefuehrt"])
        self.assertEqual(frappe.db.count("PH Kundenkarte", {"kontakt": self.kontakt, "status": "Aktiv"}), 1)
        self.assertTrue(kh.zeitleiste(self.kontakt))
        self.assertTrue(any(x["doctype"] == "PH Kundenkarte" for x in kh.datenauskunft(self.kontakt)))

    def test_anonymisieren(self):
        from ph_kundenkarte.ph_kundenkarte import kontakt as kh

        k = testkarte(geburtstag="1980-05-12")
        plan = kh.anonymisieren(self.kontakt)
        self.assertEqual(frappe.db.get_value("PH Kundenkarte", k.name, "status"), "Aktiv")  # nur Plan
        self.assertTrue(plan)
        kh.anonymisieren(self.kontakt, ausfuehren=True)
        werte = frappe.db.get_value("PH Kundenkarte", k.name, ["status", "kunde_name", "geburtstag", "sperrgrund_art"])
        self.assertEqual(werte, ("Gekuendigt", "anonymisiert", None, "Datenschutz"))

    def test_uebergabe_und_kassa_api(self):
        from ph_kundenkarte import api

        k = testkarte(status="Beantragt")
        r = api.lookup_card(kartennummer=k.name)
        self.assertEqual((r["code"], r["vorteile"]), ("card_pending", []))
        api.redeem_benefit(kartennummer=k.name, vorteil=vorteil("Gruß zum Geburtstag"))
        body, status = self._antwort()
        self.assertEqual((status, body["code"]), (409, "card_pending"))
        frappe.local.response = frappe._dict()
        self.assertEqual(api.hand_over_card(kartennummer=k.name)["status"], "Aktiv")
        r1 = api.redeem_benefit(kartennummer=k.name, vorteil=vorteil("Gruß zum Geburtstag"))
        self.assertFalse(r1["bereits_eingeloest"])
        c = api.cancel_redemption(referenz=r1["referenz"], grund="Test")
        self.assertEqual(c["storniert"], [r1["referenz"]])
        self.assertEqual(frappe.db.get_value("PH Kundenkarte Einloesung", r1["referenz"], "status"), "Storniert")

    def test_storno_bezug_gibt_einloesung_frei(self):
        from ph_kundenkarte.ph_kundenkarte.lebenszyklus import einloesungen_zu_bezug_stornieren

        k = testkarte()
        e = self._einloesen(k.name, "Gruß zum Geburtstag")
        frappe.db.set_value("PH Kundenkarte Einloesung", e.name, {"bezug_doctype": "PH Kassenbeleg", "bezug": "K1-TEST-1"})
        self.assertEqual(einloesungen_zu_bezug_stornieren("PH Kassenbeleg", "K1-TEST-1", "Kassenstorno"), [e.name])
        self.assertEqual(frappe.db.get_value("PH Kundenkarte Einloesung", e.name, "status"), "Storniert")

    def test_geburtstag_teildatum(self):
        k = testkarte(geburtstag_tag_monat="--05-12")
        self.assertEqual(k.geburtstag_tag_monat, "05-12")
        k2 = testkarte(kontakt=self.kontakt2, geburtstag="1980-02-29")
        self.assertEqual(k2.geburtstag_tag_monat, "02-29")

    def tearDown(self):
        frappe.db.rollback()
