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


class TestPHHerstellerbestellungLuecken(FrappeTestCase):
    """Backend-Lücken 04.11. (51-backend-luecken): Terminänderung, Abweichung klären, Sammeln, Ausführung, Lieferzeit."""

    def setUp(self):
        frappe.set_user("Administrator")

    def _mit_ab(self):
        hb = bestellung()
        hb.workflow_setzen("Gesendet")
        hb.reload()
        hb.ab_einlesen("AB-1", nowdate(), positionen=[{"idx": 1, "bestaetigter_termin": add_days(nowdate(), 30)}, {"idx": 2, "bestaetigter_termin": add_days(nowdate(), 30)}])
        hb.reload()
        return hb

    def test_terminaenderung_protokolliert(self):
        hb = self._mit_ab()
        self.assertEqual(len(hb.terminaenderungen), 0)  # Erstbestätigung ist keine Änderung
        hb.termin_aendern(add_days(nowdate(), 44), position=1, grund="Werk verschiebt", quelle="Lieferant")
        hb.reload()
        pos = [z for z in hb.terminaenderungen if z.position == 1]
        self.assertEqual(len(pos), 1)
        self.assertEqual(pos[0].quelle, "Lieferant")
        self.assertTrue(hb.liefertermin_geaendert_am)
        self.assertTrue(any(z.position == 0 for z in hb.terminaenderungen))
        with self.assertRaises(frappe.ValidationError):
            hb.termin_aendern(add_days(nowdate(), 50))

    def test_ausfuehrung_und_klaeren(self):
        hb = bestellung()
        hb.positionen[0].ausfuehrung_text = "Blau"
        hb.save()
        hb.workflow_setzen("Gesendet")
        hb.reload()
        hb.ab_einlesen("AB-2", nowdate(), positionen=[{"idx": 1, "ab_ausfuehrung_text": "Grau"}])
        hb.reload()
        zeile = next(z for z in hb.ab_abgleich if z.feld == "Ausfuehrung")
        r = hb.abweichung_klaeren(zeile.name, "kunde_rueckfragen", "Kunde fragen")
        self.assertEqual(r["bewertung"], "pruefen")
        r = hb.abweichung_klaeren(zeile.name, "akzeptieren")
        self.assertEqual(r["bewertung"], "ok")
        with self.assertRaises(frappe.ValidationError):
            hb.abweichung_klaeren(zeile.name, "loeschen")

    def test_bestellungen_sammeln_idempotent(self):
        from ph_sortiment.api import bestellungen_sammeln

        lieferant()
        frappe.db.set_value("PH Marke", "Testmarke Sortiment", "lieferant", "Testlieferant Sortiment")
        p = produkt("Sammelglas")
        pos = [{"produkt": p.name, "menge": 2, "bezug_zeile": "test-r1", "raum": "Küche"}, {"bezeichnung": "ohne Lieferant", "menge": 1, "bezug_zeile": "test-r2"}]
        r = bestellungen_sammeln(pos, kommission="TEST-SAMMELN", idempotency_key="test-sammeln-1")
        self.assertEqual(len(r["bestellungen"]), 1)
        self.assertEqual(r["ohne_lieferant"], ["test-r2"])
        hb = frappe.get_doc("PH Herstellerbestellung", r["bestellungen"][0]["name"])
        self.assertEqual((hb.positionen[0].bezug_zeile, hb.positionen[0].raum), ("test-r1", "Küche"))
        r2 = bestellungen_sammeln(pos, kommission="TEST-SAMMELN", idempotency_key="test-sammeln-1")
        self.assertEqual(r2.get("wiederholt"), 1)
        with self.assertRaises(frappe.ValidationError):
            bestellungen_sammeln([], kommission="X")

    def test_wunschtermin_aus_lieferzeit(self):
        lf = lieferant()
        lf.set("lieferzeiten", [{"marke": "Testmarke Sortiment", "wochen_von": 4, "wochen_bis": 6}])
        lf.save()
        hb = bestellung(wunschtermin=None)
        self.assertTrue(hb.wunschtermin)
        self.assertGreaterEqual(frappe.utils.date_diff(hb.wunschtermin, nowdate()), 42)


class TestPHHerstellerbestellungUebermittlung(FrappeTestCase):
    """Nachauftrag 32-Nachtrag: Übermittlung mit Status, AB-Merker, Konditionen, Reklamationsstatistik."""

    def setUp(self):
        frappe.set_user("Administrator")

    def test_export_csv_kompatibel_und_status(self):
        hb = bestellung()
        url = hb.export_schnittstelle("csv")
        self.assertTrue(url.endswith(".csv"))
        hb.reload()
        self.assertEqual(hb.uebermittlung_status, "Exportiert")
        self.assertEqual(len(hb.uebermittlungen), 1)
        hb.uebermittlung_setzen("Uebermittelt", "Portal-Upload")
        hb.reload()
        self.assertEqual((hb.uebermittlung_status, hb.status), ("Uebermittelt", "Gesendet"))
        with self.assertRaises(frappe.ValidationError):
            hb.uebermittlung_setzen("Unsinn")

    def test_edi_ohne_gln_gesperrt(self):
        hb = bestellung()
        with self.assertRaises(frappe.ValidationError):
            hb.exportieren("EDI")

    def test_ab_merker_und_vollstaendig(self):
        hb = bestellung()
        self.assertEqual({p.ab_merker for p in hb.positionen}, {"offen"})
        self.assertFalse(hb.ab_vollstaendig)
        hb.workflow_setzen("Gesendet")
        hb.reload()
        hb.ab_einlesen("AB-M", nowdate(), positionen=[{"idx": 1, "ab_menge": 1}])
        hb.reload()
        self.assertEqual([p.ab_merker for p in hb.positionen], ["abweichung", "bestaetigt"])
        self.assertFalse(hb.ab_vollstaendig)
        hb.status = "AB geprueft"
        with self.assertRaises(frappe.ValidationError):
            hb.save()
        hb.reload()
        z = next(x for x in hb.ab_abgleich if x.position == 1)
        hb.abweichung_bewerten(z.name, "ok")
        hb.reload()
        self.assertEqual(hb.positionen[0].ab_merker, "geklaert")
        self.assertTrue(hb.ab_vollstaendig)

    def test_konditionen_zuschlaege(self):
        lf = lieferant()
        lf.update({"mindestbestellwert_cent": 500000, "mindermengenzuschlag_cent": 2500, "fracht_pauschale_cent": 4900, "frachtfrei_ab_cent": 1000000, "skonto_promille": 20})
        lf.save()
        hb = bestellung()
        self.assertEqual(hb.zuschlaege_cent, 7400)  # 205000 < 500000 → Mindermenge + Fracht
        self.assertEqual(hb.skonto_cent, round((205000 + 7400) * 0.02))

    def test_reklamationsstatistik_api(self):
        from ph_sortiment.api import reklamationsstatistik

        r = reklamationsstatistik(von="2020-01-01")
        self.assertIn("zeilen", r)
        self.assertIn("service_installiert", r)
