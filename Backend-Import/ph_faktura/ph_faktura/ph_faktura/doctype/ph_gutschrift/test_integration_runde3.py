"""Site-Tests Integration Runde 3 (bench --site <site> run-tests --app ph_faktura --module
ph_faktura.ph_faktura.doctype.ph_gutschrift.test_integration_runde3). Nachbar-Apps fehlen → skip. Kein Netz."""

import json

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import nowdate

from ph_faktura.ph_faktura import integration
from ph_faktura.testhilfen import beleg, position, testkontakt


def _installiert(dt):
    return bool(frappe.db.exists("DocType", dt))


class TestIntegrationRunde3(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def _rechnung(self, **kw):
        re = beleg("PH Rechnung", kontakt=testkontakt(), positionen=[position(menge=2, einzel_netto_cent=50000)], **kw)
        re.submit()
        return re

    def test_hook_registriert(self):
        self.assertIn("ph_faktura.api.gutschrift_aus_bestellung", frappe.get_hooks("ph_shop_gutschrift_erstellen"))

    def test_gutschrift_aus_shop_erstattung(self):
        if not _installiert("PH Bestellung"):
            self.skipTest("ph_shop fehlt")
        b = frappe._dict(name=frappe.generate_hash(length=10), add_comment=lambda *a, **k: None)
        re = self._rechnung()
        frappe.db.set_value("PH Rechnung", re.name, "bestellung", b.name, update_modified=False)
        zeile = frappe._dict(name=frappe.generate_hash(length=10), art="Teilerstattung", betrag_cent=12000, grund="Test", zahlungen="",
                             satz_json=json.dumps({"posten": [{"satz_promille": 2000, "brutto_cent": 12000, "ust_cent": 2000, "netto_cent": 10000}]}))
        nr = integration.gutschrift_aus_bestellung(b, zeile)
        g = frappe.get_doc("PH Gutschrift", {"idempotency_key": f"shop-erstattung:{zeile.name}"})
        self.assertEqual((g.docstatus, g.brutto_cent, g.status, g.rechnung), (1, 12000, "Erstattet", re.name))
        self.assertEqual(nr, g.nummer)
        self.assertEqual(integration.gutschrift_aus_bestellung(b, zeile), nr)  # idempotent

    def test_lieferanten_gutschrift_vorzeichen_und_regress(self):
        er = frappe.get_doc({"doctype": "PH Eingangsrechnung", "belegart": "Gutschrift", "lieferant_name": "Minotti S.p.A.", "rechnungsnummer_lieferant": frappe.generate_hash(length=8), "datum": nowdate(),
                             "ust_fall": "Vorsteuer AT", "netto_cent": 10000, "ust_cent": 2000, "brutto_cent": 12000})
        er.flags.ignore_links = True
        er.insert()
        er.freigeben()
        er.reload()
        self.assertEqual((er.status, er.zahllauf), ("Freigegeben", 0))
        with self.assertRaises(frappe.ValidationError):
            er.als_bezahlt_buchen()
        er.als_verrechnet_buchen()
        self.assertEqual(frappe.db.get_value("PH Eingangsrechnung", er.name, "status"), "Bezahlt")
        if _installiert("PH Lieferantenregress"):
            with self.assertRaises(frappe.ValidationError):  # Regress muss existieren
                frappe.get_doc({**er.as_dict(), "name": None, "rechnungsnummer_lieferant": "X-" + frappe.generate_hash(length=6), "lieferantenregress": "GIBTSNICHT", "status": None}).insert()

    def test_regress_ausbuchung_ins_journal(self):
        doc = frappe._dict(doctype="PH Lieferantenregress", name="PH-REG-TEST-" + frappe.generate_hash(length=4), abgleich_status="Ausgebucht", differenz_cent=2500, ausgebucht_grund="Test", ausgebucht_von="Administrator")
        integration.regress_aktualisiert(doc)
        integration.regress_aktualisiert(doc)  # einmalig
        self.assertEqual(frappe.db.count("PH Buchungsjournal", {"vorgang": "Ausbuchung", "beleg": doc.name}), 1)

    def test_angebot_aus_pflegevertrag(self):
        if not _installiert("PH Pflege Abo"):
            self.skipTest("ph_service fehlt")
        abo = frappe.get_doc({"doctype": "PH Pflege Abo", "art": "Wartungsvertrag", "bereich": "Whirlpool", "kontakt": testkontakt(), "intervall_monate": 6, "preis_cent": 24000, "abrechnung": "Jaehrlich im Voraus"})
        abo.flags.ignore_mandatory = True
        abo.insert()
        an = integration.angebot_aus_pflege_abo(abo.name)
        self.assertEqual(frappe.db.get_value("PH Pflege Abo", abo.name, "angebot"), an)
        self.assertEqual(frappe.db.get_value("PH Angebot", an, "pflege_abo"), abo.name)
        self.assertEqual(integration.angebot_aus_pflege_abo(abo.name), an)
