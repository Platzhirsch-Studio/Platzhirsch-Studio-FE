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
        er = self.er(zuordnung_modus="Gemeinkosten")
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


class TestPHEingangsrechnungKostenzuordnung(FrappeTestCase):
    """Kostenzuordnung (Projektnachkalkulation): ganz, aliquot mit Rundung, Pflicht bei Freigabe, Umbuchung mit Protokoll."""

    def setUp(self):
        frappe.set_user("Administrator")
        from ph_projekte.ph_projekte.nachkalkulation import kostenarten_anlegen

        kostenarten_anlegen()
        self.p1, self.p2 = (self.projekt(f"ER-Zuordnung {i}") for i in (1, 2))

    def projekt(self, titel):
        p = frappe.get_doc({"doctype": "PH Projekt", "titel": titel, "projektart": "Kueche", "status": "Auftrag"})
        p.flags.ignore_links = True
        p.insert()
        return p.name

    def er(self, **kw):
        d = frappe.get_doc({"doctype": "PH Eingangsrechnung", "lieferant_name": "Tischlerei Test", "rechnungsnummer_lieferant": frappe.generate_hash(length=8), "datum": nowdate(),
                            "netto_cent": 100000, "ust_cent": 20000, "brutto_cent": 120000, **kw})
        d.flags.ignore_links = True
        return d.insert()

    def test_ganz_einem_projekt(self):
        er = self.er(projekt=self.p1, kostenart="Fremdgewerk")
        self.assertEqual(er.zuordnung_modus, "Ganz einem Projekt")
        self.assertEqual([(z.projekt, z.kostenart, z.betrag_cent) for z in er.zuordnung], [(self.p1, "Fremdgewerk", 100000)])
        self.assertEqual(er.zuordnung_status, "Vollstaendig")

    def test_aliquot_rundung_und_kopfprojekt(self):
        er = self.er(netto_cent=100, ust_cent=20, brutto_cent=120, zuordnung_modus="Aliquot", zuordnung=[
            {"projekt": self.p1, "kostenart": "Fracht", "prozent": 100 / 3}, {"projekt": self.p2, "kostenart": "Fracht", "prozent": 100 / 3}, {"projekt": self.p2, "kostenart": "Material", "prozent": 100 / 3}])
        self.assertEqual(sum(z.betrag_cent for z in er.zuordnung), 100)
        self.assertEqual(er.zuordnung_status, "Vollstaendig")
        self.assertEqual(er.projekt, self.p1)  # größte Zeile (Rundungsrest)

    def test_freigabe_nur_vollstaendig(self):
        er = self.er()
        self.assertEqual(er.zuordnung_status, "Offen")
        with self.assertRaises(frappe.ValidationError):
            er.freigeben()
        er.reload()
        er.zuordnung_modus = "Aliquot"
        er.set("zuordnung", [{"projekt": self.p1, "kostenart": "Ware", "prozent": 60}])
        er.save()
        self.assertEqual(er.zuordnung_differenz_cent, 40000)
        with self.assertRaises(frappe.ValidationError):
            er.freigeben()

    def test_umbuchung_nach_freigabe_mit_protokoll(self):
        er = self.er(projekt=self.p1, kostenart="Ware")
        er.freigeben()
        er.reload()
        er.set("zuordnung", [{"projekt": self.p2, "kostenart": "Ware", "betrag_cent": 100000}])
        er.zuordnung_modus = "Aliquot"
        with self.assertRaises(frappe.ValidationError):
            er.save()  # direkt nach Freigabe gesperrt
        er.reload()
        with self.assertRaises(frappe.ValidationError):
            er.zuordnung_umbuchen("Aliquot", [{"projekt": self.p2, "kostenart": "Ware", "prozent": 50}], grund="Teilweise falsch")
        er.reload()
        er.zuordnung_umbuchen("Aliquot", [{"projekt": self.p1, "kostenart": "Ware", "prozent": 50}, {"projekt": self.p2, "kostenart": "Ware", "prozent": 50}], grund="Zwei Küchen auf einer Rechnung")
        er.reload()
        self.assertEqual(sorted((z.projekt, z.betrag_cent) for z in er.zuordnung), sorted([(self.p1, 50000), (self.p2, 50000)]))
        self.assertTrue(frappe.db.exists("PH Kalkulation Protokoll", {"referenz_name": er.name, "bereich": "Eingangsrechnung"}))

    def test_gutschrift_negativ_im_projekt(self):
        er = self.er(projekt=self.p1, kostenart="Ware")
        gs = self.er(belegart="Gutschrift", bezug_eingangsrechnung=er.name, netto_cent=10000, ust_cent=2000, brutto_cent=12000)
        self.assertEqual([(z.projekt, z.kostenart, z.betrag_cent) for z in gs.zuordnung], [(self.p1, "Ware", 10000)])
        from ph_projekte.ph_projekte.nachkalkulation import berechnen

        ware = next(z for z in berechnen(self.p1)["kostenarten"] if z["kostenart"] == "Ware")
        self.assertEqual(ware["ist_cent"], 90000)
