"""bench --site <site> run-tests --app ph_projekte --doctype "PH Projekt"

Voraussetzung: ph_crm mit PH Kontakt (Felder nachname, email, portal_token_hash, portal_aktiv) ist installiert.
Gemeinsame Testdaten: testdaten() legt Kontakt + Projekt an (idempotent)."""

import frappe
from frappe.tests.utils import FrappeTestCase

from ph_projekte.utils.portal import neuer_token, token_hash

TEST_EMAIL = "projekt-test@example.com"


def testkontakt():
    name = frappe.db.get_value("PH Kontakt", {"email": TEST_EMAIL}, "name")
    if name:
        return name
    doc = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Anna", "nachname": "Projekttest", "email": TEST_EMAIL, "kontaktart": "Privat"})
    doc.flags.ignore_mandatory = True
    doc.insert(ignore_permissions=True)
    return doc.name


def testprojekt(titel="Wohnzimmer Test"):
    kontakt = testkontakt()
    name = frappe.db.get_value("PH Projekt", {"kontakt": kontakt, "titel": titel}, "name")
    if name:
        return frappe.get_doc("PH Projekt", name)
    return frappe.get_doc(
        {
            "doctype": "PH Projekt",
            "kontakt": kontakt,
            "titel": titel,
            "projektart": "Wohnung",
            "raum": "Wohnzimmer",
            "positionen": [{"bezeichnung": "Sofa Connery", "marke": "Minotti", "kategorie": "Sofa", "menge": 1, "status": "bestellt"}],
        }
    ).insert()


def kunden_token(kontakt):
    """Setzt einen Portal-Token am Kontakt (wie portal_login_token) und gibt ihn zurück."""
    token = neuer_token()
    werte = {"portal_token_hash": token_hash(token)}
    meta = frappe.get_meta("PH Kontakt")
    if meta.has_field("portal_aktiv"):
        werte["portal_aktiv"] = 1
    if meta.has_field("portal_letzter_login"):
        werte["portal_letzter_login"] = frappe.utils.now_datetime()
    frappe.db.set_value("PH Kontakt", kontakt, werte, update_modified=False)
    return token


class TestPHProjekt(FrappeTestCase):
    def setUp(self):
        frappe.set_user("Administrator")
        frappe.db.set_single_value("PH Einstellungen", "api_aktiv", 1)
        frappe.cache().delete_value("ph_core:einstellungen")

    def test_anlegen_titel_status_verlauf(self):
        p = testprojekt()
        self.assertTrue(p.name.startswith("PH-PRJ-"))
        self.assertEqual(p.status, "Anfrage")
        self.assertEqual(p.kunde_name, "Anna Projekttest")
        self.assertEqual(p.phasen_verlauf[0].phase, "Anfrage")

    def test_phasenwechsel_protokolliert_und_abbruch_braucht_grund(self):
        p = testprojekt("Phasen Test")
        p.status = "Planung"
        p.save()
        self.assertIn("Planung", [z.phase for z in p.phasen_verlauf])
        p.status = "Abgebrochen"
        p.abgebrochen_grund = ""
        with self.assertRaises(frappe.ValidationError):
            p.save()
        p.abgebrochen_grund = "Kunde verzieht"
        p.save()
        self.assertEqual(p.status, "Abgebrochen")

    def test_montage_termine_plausibel(self):
        p = testprojekt("Termin Test")
        p.montage_von = "2026-12-10"
        p.montage_bis = "2026-12-01"
        with self.assertRaises(frappe.ValidationError):
            p.save()

    def test_montageauftrag_und_abnahme_aus_projekt(self):
        p = testprojekt("Montage Test")
        m = p.montageauftrag_anlegen(start="2026-12-01 08:00:00")
        mo = frappe.get_doc("PH Montageauftrag", m)
        self.assertEqual(mo.projekt, p.name)
        self.assertEqual(len(mo.leistungen), 1)  # Position „bestellt“ wird übernommen
        a = p.abnahme_anlegen(montageauftrag=m)
        self.assertEqual(frappe.db.get_value("PH Projekt", p.name, "abnahme"), a)
        self.assertEqual(p.abnahme_anlegen(), a)  # idempotent

    def test_produktpaesse_erzeugen(self):
        p = testprojekt("Pass Test")
        neu = p.produktpaesse_erzeugen(lieferdatum="2026-11-01")
        self.assertEqual(len(neu), 1)
        p.reload()
        self.assertEqual(p.positionen[0].produktpass, neu[0])
        self.assertEqual(p.produktpaesse_erzeugen(), [])  # keine Dubletten

    def test_portal_projects_api_und_fremder_kontakt(self):
        from ph_projekte.api import portal_project, portal_projects

        p = testprojekt("Portal Test")
        token = kunden_token(p.kontakt)
        liste = portal_projects(kontakt=p.kontakt, kunde_token=token)
        self.assertTrue(any(x["id"] == p.name for x in liste))
        eintrag = next(x for x in liste if x["id"] == p.name)
        self.assertEqual(eintrag["currentStep"], "anfrage")
        self.assertEqual(len(eintrag["steps"]), 8)
        self.assertEqual(eintrag["items"][0]["name"], "Sofa Connery")
        self.assertNotIn("priceCent", eintrag["items"][0])
        # falscher Token → invalid_token (404) als Fehlerbild des Decorators
        antwort = portal_projects(kontakt=p.kontakt, kunde_token="falsch")
        self.assertEqual(antwort.get("code"), "invalid_token")
        # fremdes Projekt → null
        fremd = frappe.get_doc({"doctype": "PH Kontakt", "vorname": "Fremd", "nachname": "Kunde", "email": "fremd-test@example.com", "kontaktart": "Privat"})
        fremd.flags.ignore_mandatory = True
        fremd.insert(ignore_permissions=True)
        token2 = kunden_token(fremd.name)
        self.assertIsNone(portal_project(kontakt=fremd.name, kunde_token=token2, projekt=p.name))

    def test_auftragsmappe_liefert_alle_bloecke(self):
        from ph_projekte.api import auftragsmappe

        p = testprojekt("Mappe Test")
        d = auftragsmappe(p.name)
        for key in ("projekt", "phasen", "positionen", "planungen", "renderings", "dokumente", "montagen", "gewerke", "abnahmen", "aufgaben", "zeiten", "nachrichten", "apps"):
            self.assertIn(key, d)
        self.assertEqual(d["projekt"]["name"], p.name)


class TestPHProjektLieferung(FrappeTestCase):
    """Positionen je Raum mit Lieferant → Herstellerbestellung (ph_sortiment) → Lieferstatus, Terminänderung, Kalkulation."""

    def setUp(self):
        frappe.set_user("Administrator")
        if not frappe.db.exists("PH Lieferant", "Test Möbelwerk"):
            frappe.get_doc({"doctype": "PH Lieferant", "firmenname": "Test Möbelwerk", "status": "Aktiv"}).insert()
        self.p = testprojekt("Lieferung Test")
        if not any(z.lieferant for z in self.p.positionen):
            self.p.append("positionen", {"bezeichnung": "Esstisch Eiche", "menge": 2, "raum": "Essen", "lieferant": "Test Möbelwerk", "preis_cent": 150000, "ek_cent": 80000})
            self.p.save()

    def test_bestellen_und_terminaenderung(self):
        erg = self.p.herstellerbestellungen_erzeugen()
        self.assertTrue(erg["bestellungen"])
        self.p.reload()
        zeile = next(z for z in self.p.positionen if z.lieferant == "Test Möbelwerk")
        self.assertTrue(zeile.herstellerbestellung)
        hb = frappe.get_doc("PH Herstellerbestellung", zeile.herstellerbestellung)
        self.assertEqual(hb.bezug_name, self.p.name)
        hb_pos = next(z for z in hb.positionen if z.bezug_zeile == zeile.name)
        hb_pos.bestaetigter_termin = "2027-02-15"
        hb.save()
        self.p.reload()
        zeile = next(z for z in self.p.positionen if z.lieferant == "Test Möbelwerk")
        self.assertEqual(str(zeile.liefertermin), "2027-02-15")

    def test_lieferung_nachlieferung_kalkulation(self):
        zeile = next(z for z in self.p.positionen if z.lieferant == "Test Möbelwerk")
        r = self.p.lieferung_buchen(zeile.name, 1)
        self.assertEqual(r["lieferstatus"], "teilgeliefert")
        self.p.reload()
        self.p.nachlieferung_anlegen(zeile.name, 1, "Platte beschädigt", bestellen=0)
        self.p.reload()
        self.assertTrue(next(z for z in self.p.positionen if z.name == zeile.name).nachlieferung_noetig)
        k = self.p.kalkulation()
        self.assertGreaterEqual(k["soll"]["vk_cent"], 300000)
        self.assertIn("ist", k)
