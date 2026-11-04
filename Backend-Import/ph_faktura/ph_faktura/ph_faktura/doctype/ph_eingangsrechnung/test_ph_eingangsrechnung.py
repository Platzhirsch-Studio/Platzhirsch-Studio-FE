"""bench --site <site> run-tests --app ph_faktura --doctype "PH Eingangsrechnung" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate


class TestPHEingangsrechnung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def er(self, **kw):
        d = frappe.get_doc({"doctype": "PH Eingangsrechnung", "lieferant_name": kw.pop("lieferant_name", "Minotti S.p.A."), "rechnungsnummer_lieferant": kw.pop("nr", frappe.generate_hash(length=8)), "datum": nowdate(),
                            "netto_cent": kw.pop("netto_cent", 500000), "ust_cent": kw.pop("ust_cent", 0), "brutto_cent": kw.pop("brutto_cent", 500000), **kw})
        d.flags.ignore_links = True
        d.insert()
        return d

    def test_reverse_charge_eu(self):
        er = self.er(ust_fall="Reverse Charge EU", land_lieferant="IT", uid_lieferant="IT12345678901")
        self.assertEqual(er.status, "Erfasst")
        self.assertEqual(er.rc_steuer_cent, 100000)
        self.assertEqual(er.vorsteuer_cent, 100000)
        self.assertEqual(er.zahlbetrag_cent, 500000)

    def test_vorsteuer_at_und_skonto(self):
        er = self.er(ust_fall="Vorsteuer AT", netto_cent=100000, ust_cent=20000, brutto_cent=120000, skonto_promille=20, skonto_bis=add_days(nowdate(), 5))
        self.assertEqual(er.vorsteuer_cent, 20000)
        self.assertEqual(er.skonto_cent, 2400)
        self.assertEqual(er.zahlbetrag_cent, 117600)

    def test_brutto_plausibilitaet_und_doppelerfassung(self):
        with self.assertRaises(frappe.ValidationError):
            self.er(netto_cent=100, ust_cent=20, brutto_cent=999)
        self.er(nr="DUP-1")
        with self.assertRaises(frappe.ValidationError):
            self.er(nr="DUP-1")

    def test_workflow_pruefen_freigeben(self):
        er = self.er()
        er.pruefen("Menge stimmt")
        er.reload()
        self.assertEqual(er.status, "Sachlich geprueft")
        er.freigeben()
        er.reload()
        self.assertEqual(er.status, "Freigegeben")
        self.assertEqual(er.zahllauf, 1)
        from ph_faktura.ph_faktura.doctype.ph_eingangsrechnung.ph_eingangsrechnung import zahllauf_vorschlag

        self.assertIn(er.name, [r.name for r in zahllauf_vorschlag(add_days(nowdate(), 60))])
        with self.assertRaises(frappe.ValidationError):
            self.er(nr="X-2").als_bezahlt_buchen()  # nicht freigegeben
