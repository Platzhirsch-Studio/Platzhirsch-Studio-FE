"""bench --site <site> run-tests --app ph_sortiment --doctype "PH Herstellerbestellung" """

import frappe
from frappe.tests.utils import FrappeTestCase
from frappe.utils import add_days, nowdate

from ph_sortiment.ph_sortiment.doctype.ph_produkt.test_ph_produkt import marke, produkt


def lieferant(name="Testlieferant Sortiment"):
    if frappe.db.exists("PH Lieferant", name):
        return frappe.get_doc("PH Lieferant", name)
    marke()
    return frappe.get_doc({"doctype": "PH Lieferant", "firmenname": name, "marke": "Testmarke Sortiment", "bestellweg": "E-Mail", "bestell_email": "bestellung@example.com"}).insert()


def bestellung(**kw):
    lieferant()
    p = produkt("Bestellglas")
    doc = frappe.get_doc({
        "doctype": "PH Herstellerbestellung",
        "lieferant": "Testlieferant Sortiment",
        "kommission": "Test Kommission",
        "wunschtermin": add_days(nowdate(), 30),
        "positionen": [
            {"produkt": p.name, "menge": 2, "ek_cent": 100000, "vk_cent": 150000, "hersteller_artikelnr": "GL-1"},
            {"bezeichnung": "Freitext Zubehör", "menge": 1, "ek_cent": 5000},
        ],
        **kw,
    }).insert()
    return doc


class TestPHHerstellerbestellung(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")

    def test_anlegen_titel_summen(self):
        hb = bestellung()
        self.assertTrue(hb.name.startswith("HB-"))
        self.assertEqual(hb.status, "Entwurf")
        self.assertEqual(hb.summe_ek_cent, 205000)
        self.assertEqual(hb.menge_bestellt, 3)
        self.assertIn("Testlieferant Sortiment", hb.titel)
        self.assertTrue(hb.lieferadresse_text)

    def test_ab_abgleich_erkennt_preis_menge_termin(self):
        hb = bestellung()
        hb.workflow_setzen("Gesendet")
        hb.reload()
        hb.ab_einlesen("AB-4711", nowdate(), positionen=[
            {"idx": 1, "ab_menge": 1, "ab_ek_cent": 110000, "bestaetigter_termin": add_days(nowdate(), 45)},
            {"idx": 2, "ab_menge": 1, "ab_ek_cent": 5000, "bestaetigter_termin": add_days(nowdate(), 30)},
        ])
        hb.reload()
        self.assertEqual(hb.status, "AB erhalten")
        self.assertEqual(hb.ab_nummer, "AB-4711")
        felder = {(z.position, z.feld) for z in hb.ab_abgleich}
        self.assertEqual(felder, {(1, "Preis"), (1, "Menge"), (1, "Termin")})
        self.assertEqual(hb.positionen[0].abweichung, "Mehrfach")
        self.assertEqual(hb.positionen[1].abweichung, "keine")
        self.assertEqual(hb.abweichungen_offen, 3)
        self.assertEqual(str(hb.bestaetigter_termin), add_days(nowdate(), 45))
        # Abschließen mit offenen Abweichungen verboten
        hb.status = "Abgeschlossen"
        with self.assertRaises(frappe.ValidationError):
            hb.save()
        hb.reload()
        for z in hb.ab_abgleich:
            hb.abweichung_bewerten(z.name, "ok", "mit Lieferant geklärt")
        hb.reload()
        self.assertEqual(hb.abweichungen_offen, 0)
        self.assertTrue(all(z.geprueft_von for z in hb.ab_abgleich))

    def test_wareneingang_verbucht_mengen(self):
        hb = bestellung()
        hb.workflow_setzen("Gesendet")
        hb.reload()
        we_name = hb.wareneingang_anlegen()
        we = frappe.get_doc("PH Wareneingang", we_name)
        self.assertEqual(we.status, "Vollstaendig")
        hb.reload()
        self.assertEqual(hb.menge_erhalten, 3)
        self.assertEqual(hb.status, "Geliefert")
        self.assertTrue(hb.geliefert_am)
        with self.assertRaises(frappe.ValidationError):
            hb.wareneingang_anlegen()

    def test_wareneingang_teil_und_reklamation(self):
        hb = bestellung()
        hb.workflow_setzen("Gesendet")
        we = frappe.get_doc({"doctype": "PH Wareneingang", "herstellerbestellung": hb.name, "datum": nowdate(), "positionen": [
            {"position": 1, "menge_erwartet": 2, "menge_erhalten": 1, "zustand": "Transportschaden", "hinweis": "Ecke gestaucht"},
        ]}).insert()
        self.assertEqual(we.status, "Reklamiert")
        self.assertEqual(we.reklamation, 1)
        hb.reload()
        self.assertEqual(hb.status, "Teilgeliefert")
        self.assertEqual(hb.positionen[0].menge_erhalten, 1)
        with self.assertRaises(frappe.ValidationError):
            frappe.get_doc({"doctype": "PH Wareneingang", "herstellerbestellung": hb.name, "datum": nowdate(), "positionen": [{"position": 1, "menge_erwartet": 1, "menge_erhalten": 1, "zustand": "falsch"}]}).insert()

    def test_export_csv(self):
        hb = bestellung()
        url = hb.export_schnittstelle("csv")
        self.assertTrue(url.endswith(".csv"))
        hb.reload()
        self.assertTrue(hb.export_am)
