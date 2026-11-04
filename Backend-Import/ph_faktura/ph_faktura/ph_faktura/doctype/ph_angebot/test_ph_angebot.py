"""bench --site <site> run-tests --app ph_faktura --doctype "PH Angebot" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate

from ph_faktura.testhilfen import beleg, einstellungen_testmodus, position


class TestPHAngebot(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        einstellungen_testmodus()

    def angebot(self, **kw):
        a = beleg("PH Angebot", datum=nowdate(), positionen=kw.pop("positionen", [position(), position("Alternativ: Stoff B", 1, 120000, alternativ=1)]), **kw)
        a.insert()
        return a

    def test_anlegen_summen_alternativ(self):
        a = self.angebot()
        self.assertEqual(a.status, "Entwurf")
        self.assertTrue(a.name.startswith("AN-"))
        self.assertEqual(a.brutto_cent, 120000)
        self.assertEqual(a.alternativ_cent, 144000)
        self.assertEqual(a.gueltig_bis, add_days(nowdate(), 30))
        self.assertIn("Anna Testkundin", a.titel)

    def test_gueltigkeit_regel(self):
        a = beleg("PH Angebot", datum=nowdate(), gueltig_bis=add_days(nowdate(), -1), positionen=[position()])
        with self.assertRaises(frappe.ValidationError):
            a.insert()

    def test_auftrag_erstellen_und_neue_version(self):
        a = self.angebot(zahlungsbedingung=frappe.db.get_value("PH Zahlungsbedingung", {"standard": 1}, "name"))
        ab_name = a.auftrag_erstellen()
        a.reload()
        self.assertEqual(a.status, "Angenommen")
        self.assertEqual(a.auftragsbestaetigung, ab_name)
        ab = frappe.get_doc("PH Auftragsbestaetigung", ab_name)
        self.assertEqual(ab.brutto_cent, 120000)
        self.assertEqual(len(ab.positionen), 1)  # Alternativposition nicht übernommen
        self.assertTrue(ab.zahlungsplan)
        self.assertEqual(sum(z.betrag_cent for z in ab.zahlungsplan), 120000)
        # Gesperrt nach Annahme
        a.positionen[0].einzel_netto_cent = 1
        with self.assertRaises(frappe.ValidationError):
            a.save()
        neu_name = a.neue_version()
        neu = frappe.get_doc("PH Angebot", neu_name)
        self.assertEqual(neu.version, 2)
        self.assertEqual(neu.vorgaenger, a.name)
        self.assertEqual(neu.status, "Entwurf")

    def test_ablehnen_und_ablaufen(self):
        a = self.angebot()
        a.ablehnen("Preis")
        a.reload()
        self.assertEqual(a.status, "Abgelehnt")
        b = self.angebot()
        frappe.db.set_value("PH Angebot", b.name, {"gueltig_bis": add_days(nowdate(), -2), "status": "Gesendet"})
        from ph_faktura.ph_faktura.doctype.ph_angebot.ph_angebot import angebote_ablaufen_lassen

        angebote_ablaufen_lassen()
        self.assertEqual(frappe.db.get_value("PH Angebot", b.name, "status"), "Abgelaufen")
