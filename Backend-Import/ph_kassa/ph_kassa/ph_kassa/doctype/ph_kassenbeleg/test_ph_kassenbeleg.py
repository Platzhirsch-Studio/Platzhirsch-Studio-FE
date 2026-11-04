"""Site-Tests (bench --site <site> run-tests --app ph_kassa --doctype "PH Kassenbeleg").

Signatur über frappe.flags.ph_kassa_test_signer (SoftwareSigner im Speicher), AES-Schlüssel über frappe.conf –
kein A-Trust-Aufruf, kein Netz. Deckt den Frappe-Ablauf ab: Startbeleg, Verkettung, Zähler in PH Kasse,
Storno, Training, SEE-Ausfall + Sammelbeleg, DEP-Export, Monats-/Jahresbeleg, manuelle Anlage verboten.
"""

import base64
import json
import os

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_kassa.rksv import buchung, counter
from ph_kassa.rksv.beleg import hash_startbeleg, hash_vorbeleg
from ph_kassa.rksv.pruefung import pruefe_kette
from ph_kassa.rksv.signer import KaputterSigner, SoftwareSigner

KASSEN_ID = "TEST-KASSE-1"
KEY_B64 = base64.b64encode(os.urandom(32)).decode()
POS = [{"art": "Freitext", "bezeichnung": "Hocker", "menge": 1, "einzel_brutto_cent": 12000, "steuersatz": "Normal 20"}]
BAR = [{"zahlart": "Bar", "betrag_cent": 12000, "gegeben_cent": 15000}]


def kasse_anlegen(kassen_id=KASSEN_ID):
    frappe.conf[f"ph_kassa_aes_key_{kassen_id}"] = KEY_B64
    if not frappe.db.exists("PH Signatureinheit", "Test-SEE Unit"):
        frappe.get_doc({"doctype": "PH Signatureinheit", "bezeichnung": "Test-SEE Unit", "art": "Test", "env": "test", "vda_id": "AT0"}).insert()
    if frappe.db.exists("PH Kasse", kassen_id):
        return frappe.get_doc("PH Kasse", kassen_id)
    return frappe.get_doc({"doctype": "PH Kasse", "kassen_id": kassen_id, "bezeichnung": "Testkasse", "see": "Test-SEE Unit"}).insert()


class TestPHKassenbeleg(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        self.signer = SoftwareSigner()
        frappe.flags.ph_kassa_test_signer = self.signer
        self.kasse = kasse_anlegen()
        see = frappe.get_doc("PH Signatureinheit", "Test-SEE Unit")
        see.zertifikat_abrufen()
        if not self.kasse.startbeleg:
            buchung.startbeleg(self.kasse.name)
            self.kasse.reload()

    def tearDown(self):
        frappe.flags.ph_kassa_test_signer = None

    def test_startbeleg(self):
        s = frappe.get_doc("PH Kassenbeleg", self.kasse.startbeleg)
        self.assertEqual(s.belegnummer, 1)
        self.assertEqual(s.docstatus, 1)
        self.assertEqual(s.gesamt_cent, 0)
        self.assertEqual(s.signatur_vorbeleg, hash_startbeleg(KASSEN_ID))
        self.assertEqual(s.name, f"{KASSEN_ID}-000001")
        self.assertEqual(frappe.db.get_value("PH Kasse", KASSEN_ID, "umsatzzaehler_cent"), 0)
        self.assertTrue(frappe.db.exists("PH Kassa Ereignis", {"kasse": KASSEN_ID, "art": "Startbeleg Pruefung"}))

    def test_verkettung_und_zaehler(self):
        b1 = buchung.erzeuge_beleg(KASSEN_ID, POS, BAR)
        b2 = buchung.erzeuge_beleg(KASSEN_ID, POS, [{"zahlart": "Karte extern", "betrag_cent": 12000}])
        self.assertEqual(b1.belegnummer + 1, b2.belegnummer)
        self.assertEqual(b2.signatur_vorbeleg, hash_vorbeleg(b1.jws_compact))
        self.assertEqual(b2.vorbeleg, b1.name)
        self.assertEqual(b1.zahlarten[0].retour_cent, 3000)
        k = frappe.get_doc("PH Kasse", KASSEN_ID)
        self.assertEqual(k.umsatzzaehler_cent, 24000)
        self.assertEqual(k.letzter_beleg, b2.name)
        key = counter.schluessel_aus_b64(KEY_B64)
        self.assertEqual(counter.entschluessele(k.umsatzzaehler_verschluesselt, key, KASSEN_ID, k.umsatzzaehler_belegnummer), 24000)
        jws = frappe.get_all("PH Kassenbeleg", {"kasse": KASSEN_ID, "docstatus": 1}, pluck="jws_compact", order_by="belegnummer asc")
        erg = pruefe_kette(jws, self.signer.zertifikat, key, KASSEN_ID)
        self.assertTrue(erg["ok"], erg["fehler"])

    def test_idempotenz(self):
        a = buchung.erzeuge_beleg(KASSEN_ID, POS, BAR, idempotency_key="idem-kassa-1")
        b = buchung.erzeuge_beleg(KASSEN_ID, POS, BAR, idempotency_key="idem-kassa-1")
        self.assertEqual(a.name, b.name)

    def test_storno(self):
        b = buchung.erzeuge_beleg(KASSEN_ID, POS, BAR)
        vorher = frappe.db.get_value("PH Kasse", KASSEN_ID, "umsatzzaehler_cent")
        st = buchung.storniere_beleg(b.name, "Kunde hat es sich anders überlegt")
        self.assertEqual(st.belegart, "Stornobeleg")
        self.assertEqual(st.gesamt_cent, -12000)
        self.assertEqual(st.umsatzzaehler_verschluesselt, "U1RP")
        self.assertEqual(st.storno_von, b.name)
        self.assertEqual(frappe.db.get_value("PH Kassenbeleg", b.name, "storniert_durch"), st.name)
        self.assertEqual(frappe.db.get_value("PH Kasse", KASSEN_ID, "umsatzzaehler_cent"), vorher)
        with self.assertRaises(frappe.ValidationError):
            buchung.storniere_beleg(b.name, "doppelt")

    def test_trainingsbeleg(self):
        frappe.db.set_value("PH Kasse", KASSEN_ID, "trainings_modus", 1)
        vorher = frappe.db.get_value("PH Kasse", KASSEN_ID, "umsatzzaehler_cent")
        t = buchung.erzeuge_beleg(KASSEN_ID, POS, BAR)
        frappe.db.set_value("PH Kasse", KASSEN_ID, "trainings_modus", 0)
        self.assertEqual(t.belegart, "Trainingsbeleg")
        self.assertEqual(t.trainings, 1)
        self.assertEqual(t.umsatzzaehler_verschluesselt, "VFJB")
        self.assertEqual(frappe.db.get_value("PH Kasse", KASSEN_ID, "umsatzzaehler_cent"), vorher)

    def test_ausfall_und_sammelbeleg(self):
        frappe.flags.ph_kassa_test_signer = KaputterSigner()
        frappe.flags.ph_kassa_test_signer.zertifikat_seriennummer = self.signer.zertifikat_seriennummer
        a = buchung.erzeuge_beleg(KASSEN_ID, POS, BAR)
        self.assertEqual(a.see_ausgefallen, 1)
        self.assertEqual(a.status, "Ausfall")
        self.assertEqual(frappe.db.get_value("PH Signatureinheit", "Test-SEE Unit", "status"), "Ausgefallen")
        self.assertTrue(frappe.db.exists("PH Kassa Ereignis", {"see": "Test-SEE Unit", "art": "SEE Ausfall Beginn", "status": "Offen"}))
        frappe.flags.ph_kassa_test_signer = self.signer
        erg = buchung.see_ausfall_beenden("Test-SEE Unit")
        self.assertEqual(len(erg["sammelbelege"]), 1)
        sammel = frappe.get_doc("PH Kassenbeleg", erg["sammelbelege"][0])
        self.assertEqual(sammel.belegart, "Sammelbeleg")
        self.assertEqual(sammel.gesamt_cent, 0)
        a.reload()
        self.assertEqual(a.nachsigniert, 1)
        self.assertEqual(a.sammelbeleg, sammel.name)
        self.assertEqual(frappe.db.get_value("PH Signatureinheit", "Test-SEE Unit", "status"), "Aktiv")

    def test_monats_und_jahresbeleg(self):
        m = buchung.monatsbeleg(KASSEN_ID, datum="2026-11-30 23:50:00")
        self.assertEqual(m.belegart, "Monatsbeleg")
        j = buchung.monatsbeleg(KASSEN_ID, datum="2026-12-31 23:50:00")
        self.assertEqual(j.belegart, "Jahresbeleg")
        k = frappe.get_doc("PH Kasse", KASSEN_ID)
        self.assertEqual(k.letzter_monatsbeleg, "2026-12")
        self.assertEqual(k.letzter_jahresbeleg, 2026)

    def test_dep_export(self):
        from ph_kassa.ph_kassa.doctype.ph_dep_export.ph_dep_export import exportiere

        buchung.erzeuge_beleg(KASSEN_ID, POS, BAR)
        exp = exportiere(KASSEN_ID, art="Vollstaendig")
        self.assertGreaterEqual(exp.anzahl_belege, 2)
        inhalt = json.loads(frappe.get_doc("File", {"file_url": exp.datei}).get_content())
        self.assertIn("Belege-Gruppe", inhalt)
        self.assertEqual(len(inhalt["Belege-Gruppe"][0]["Belege-kompakt"]), exp.anzahl_belege)
        self.assertTrue(exp.pruefsumme_pruefen()["ok"])
        self.assertEqual(frappe.db.get_value("PH Kassenbeleg", exp.erster_beleg, "dep_exportiert"), 1)

    def test_manuelle_anlage_und_cancel_verboten(self):
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Kassenbeleg", "kasse": KASSEN_ID, "belegnummer": 999, "belegart": "Standard", "datum_uhrzeit": frappe.utils.now_datetime(), "docstatus": 1}).insert()
        b = buchung.erzeuge_beleg(KASSEN_ID, POS, BAR)
        with self.assertRaises(frappe.ValidationError):
            b.cancel()

    def test_pruefen_button(self):
        b = buchung.erzeuge_beleg(KASSEN_ID, POS, BAR)
        erg = b.pruefen()
        self.assertTrue(erg["signatur_ok"], erg["fehler"])
        self.assertEqual(erg["felder"]["belegnummer"], str(b.belegnummer))
