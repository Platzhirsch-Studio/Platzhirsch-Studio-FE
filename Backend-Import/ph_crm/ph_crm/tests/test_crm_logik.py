"""Reine Logik ohne Frappe: Dubletten, Zeitleiste, Aufbewahrung, Pipeline, Serien, UTM.
cd Backend-Import/ph_crm && python -m unittest discover -s ph_crm/tests -t ."""

import unittest
from datetime import date, datetime

from ph_crm.utils import aufbewahrung as auf
from ph_crm.utils import dubletten as dub
from ph_crm.utils import pipeline as pl
from ph_crm.utils import zeitleiste as zl


class TestNormalisierung(unittest.TestCase):
    def test_telefon(self):
        self.assertEqual(dub.norm_telefon("0664 12 34 567"), "+436641234567")
        self.assertEqual(dub.norm_telefon("0043 664 1234567"), "+436641234567")
        self.assertEqual(dub.norm_telefon("+43 (0) 664/1234567"), "+436641234567")
        self.assertEqual(dub.norm_telefon("+49 89 123456"), "+4989123456")
        self.assertEqual(dub.norm_telefon("123"), "")

    def test_email_und_name(self):
        self.assertEqual(dub.norm_email(" Anna+Shop@Beispiel.AT "), "anna@beispiel.at")
        self.assertEqual(dub.norm_email("kein-at"), "")
        self.assertEqual(dub.norm_name("Dr. Müller-Lüdenscheid"), "muellerluedenscheid")


class TestDubletten(unittest.TestCase):
    A = {"name": "K1", "vorname": "Anna", "nachname": "Huber", "email": "anna@x.at", "telefon": "0664 1234567", "plz": "6911"}

    def test_email_und_telefon_wahrscheinlich(self):
        b = {"name": "K2", "vorname": "Anna", "nachname": "Huber", "email": "ANNA@x.at", "mobil": "+436641234567"}
        p, g = dub.score(self.A, b)
        self.assertEqual(p, 100)
        self.assertEqual(dub.einstufung(p), "wahrscheinlich")
        self.assertIn("E-Mail gleich", g)

    def test_name_plz_moeglich(self):
        b = {"name": "K3", "vorname": "A.", "nachname": "Huber", "plz": "6911"}
        p, _ = dub.score(self.A, b)
        self.assertEqual(dub.einstufung(p), "moeglich")

    def test_kollegen_derselben_firma_keine_dublette(self):
        a = {"name": "K4", "vorname": "Eva", "nachname": "Plan", "firma": "Büro Plan ZT", "telefon": "05574 1234"}
        b = {"name": "K5", "vorname": "Max", "nachname": "Bau", "firma": "Buero Plan ZT", "telefon": "05574 1234"}
        p, g = dub.score(a, b)
        self.assertIsNone(dub.einstufung(p))
        self.assertIn("Firmenzentrale (verschiedene Personen)", g)

    def test_firmendatensaetze(self):
        p, _ = dub.score({"name": "F1", "firma": "Hotel Post GmbH"}, {"name": "F2", "firma": "Hotel Post GmbH", "nachname": ""})
        self.assertEqual(dub.einstufung(p), "wahrscheinlich")

    def test_paare_mit_ausschluss(self):
        b = {"name": "K2", "nachname": "Huber", "email": "anna@x.at"}
        self.assertEqual(len(dub.paare([self.A, b])), 1)
        self.assertEqual(dub.paare([self.A, b], {frozenset(("K1", "K2"))}), [])

    def test_feld_uebernahme(self):
        ziel = {"vorname": "Anna", "nachname": "Huber", "telefon": "", "status": "Interessent", "kunde_seit": "2025-05-01", "email": "anna@x.at", "notizen": "A"}
        quelle = {"vorname": "Annemarie", "nachname": "Huber", "telefon": "0664", "status": "Kunde", "kunde_seit": "2024-01-01", "email": "alt@x.at", "nicht_kontaktieren": 1, "widerspruchshinweis_am": "2026-01-01", "notizen": "B", "portal_token_hash": "geheim", "geburtstag": "1980-01-01", "geburtstag_einwilligung": 0}
        neu = dub.feld_uebernahme(ziel, quelle)
        self.assertEqual(neu["telefon"], "0664")
        self.assertNotIn("vorname", neu)
        self.assertEqual(neu["status"], "Kunde")
        self.assertEqual(neu["kunde_seit"], "2024-01-01")
        self.assertEqual(neu["nicht_kontaktieren"], 1)
        self.assertNotIn("email", neu)
        self.assertNotIn("portal_token_hash", neu)
        self.assertNotIn("geburtstag", neu)
        self.assertIn("B", neu["notizen"])
        self.assertEqual(dub.feld_uebernahme(ziel, quelle, felder=["vorname"])["vorname"], "Annemarie")

    def test_gesperrt_gewinnt(self):
        self.assertEqual(dub.feld_uebernahme({"status": "Kunde"}, {"status": "Gesperrt"})["status"], "Gesperrt")
        self.assertNotIn("status", dub.feld_uebernahme({"status": "Kunde"}, {"status": "Inaktiv"}))


class TestZeitleiste(unittest.TestCase):
    def test_sortierung_dedupe_seiten(self):
        a = [{"zeit": "2026-11-01T10:00:00+01:00", "art": "E-Mail", "doctype": "Communication", "name": "C1"},
             {"zeit": "2026-11-03T10:00:00+01:00", "art": "Termin", "doctype": "PH Termin", "name": "T1"}]
        b = [{"zeit": "2026-11-02T10:00:00+01:00", "art": "Rechnung", "doctype": "PH Rechnung", "name": "R1", "app": "ph_faktura"},
             {"zeit": "2026-11-03T10:00:00+01:00", "art": "Termin", "doctype": "PH Termin", "name": "T1"},
             {"zeit": "", "art": "kaputt", "doctype": "X", "name": "Y"}]
        r = zl.zusammenfuehren([a, b], limit=2)
        self.assertEqual([e["name"] for e in r["eintraege"]], ["T1", "R1"])
        self.assertEqual(r["weiter"], "2026-11-02T10:00:00+01:00")
        r2 = zl.zusammenfuehren([a, b], vor=r["weiter"], limit=2)
        self.assertEqual([e["name"] for e in r2["eintraege"]], ["C1"])
        self.assertIsNone(r2["weiter"])

    def test_letzter_kontakt(self):
        e = [{"zeit": "2026-10-01 09:00:00", "art": "E-Mail", "doctype": "Communication", "name": "C"},
             {"zeit": "2026-10-05 09:00:00", "art": "Status", "doctype": "PH Anfrage", "name": "A"}]
        self.assertEqual(zl.letzter_kontakt(e), ("2026-10-01 09:00:00", "E-Mail"))


class TestAufbewahrung(unittest.TestCase):
    def test_bao_frist(self):
        self.assertEqual(auf.frist_bis("2026-03-15"), date(2033, 12, 31))
        e = auf.entscheide("PH Rechnung", "2026-03-15", "2030-01-01")
        self.assertEqual((e["aktion"], e["frist_bis"]), ("aufbewahren", "2033-12-31"))
        self.assertEqual(auf.entscheide("PH Rechnung", "2018-03-15", "2026-01-01")["aktion"], "loeschen")

    def test_submittable_fremd_und_crm(self):
        self.assertEqual(auf.entscheide("PH Fremdbeleg", "2026-01-01", "2026-06-01", ist_submittable=True, docstatus=1)["aktion"], "aufbewahren")
        self.assertEqual(auf.entscheide("PH Fremdbeleg", "2026-01-01", "2026-06-01", ist_submittable=True, docstatus=0)["aktion"], "anonymisieren")
        self.assertEqual(auf.entscheide("PH Anfrage", "2026-01-01", "2026-06-01")["aktion"], "loeschen")
        self.assertEqual(auf.entscheide("PH Anfrage", "2026-01-01", "2026-06-01", sperre=True)["aktion"], "aufbewahren")
        self.assertEqual(auf.entscheide("PH Servicefall", "2026-01-01", "2026-06-01", eigene_frist="2028-01-01")["aktion"], "aufbewahren")

    def test_nachweis_datenschutzanfrage(self):
        e = auf.entscheide("PH Datenschutzanfrage", "2026-11-04", "2027-01-01")
        self.assertEqual((e["aktion"], e["frist_bis"]), ("aufbewahren", "2029-12-31"))
        nur_nachweis = [{"doctype": "PH Datenschutzanfrage", "name": "D", "aktion": "aufbewahren", "frist_bis": "2029-12-31"}]
        self.assertFalse(auf.braucht_name(nur_nachweis))
        self.assertIsNone(auf.gesamtfrist(nur_nachweis))

    def test_kontakt_minimierung(self):
        teil = auf.kontakt_werte(aufbewahren=True)
        self.assertNotIn("nachname", teil)
        self.assertIn("email", teil)
        voll = auf.kontakt_werte(aufbewahren=False)
        self.assertEqual(voll["nachname"], "Anonymisiert")
        plan = [{"doctype": "PH Rechnung", "name": "R", "aktion": "aufbewahren", "frist_bis": "2033-12-31"},
                {"doctype": "PH Rechnung", "name": "R2", "aktion": "aufbewahren", "frist_bis": "2031-12-31"}]
        self.assertEqual(auf.kontakt_zeile(plan, "2026-01-01")["frist_bis"], "2033-12-31")
        self.assertEqual(auf.pruefe_plan([{"doctype": "X", "name": "1", "aktion": "vernichten"}])[0]["aktion"], "aufbewahren")


class TestPipeline(unittest.TestCase):
    def test_wahrscheinlichkeit_gewichtet(self):
        self.assertEqual(pl.wahrscheinlichkeit("Angebot"), 60)
        self.assertEqual(pl.wahrscheinlichkeit("Angebot", 80), 80)
        self.assertEqual(pl.wahrscheinlichkeit("Verloren", 80), 0)
        self.assertEqual(pl.gewichtet_cent(1234567, 60), 740740)
        self.assertEqual(pl.gewichtet_cent(5, 50), 3)

    def test_ruhend_und_summe(self):
        self.assertTrue(pl.ruhend("Angebot", 21))
        self.assertFalse(pl.ruhend("Angebot", 20))
        self.assertFalse(pl.ruhend("Gewonnen", 400))
        s = pl.pipeline_summe([{"status": "Angebot", "wert_cent": 100, "gewichtet_cent": 60}, {"status": "Gewonnen", "wert_cent": 9}])
        self.assertEqual(s["Angebot"], {"anzahl": 1, "wert_cent": 100, "gewichtet_cent": 60})
        self.assertNotIn("Gewonnen", s)

    def test_serien(self):
        st = datetime(2026, 1, 31, 10, 0)
        m = pl.serien_starts(st, "monatlich", anzahl=3)
        self.assertEqual([d.date() for d in m], [date(2026, 1, 31), date(2026, 2, 28), date(2026, 3, 31)])
        w = pl.serien_starts(datetime(2026, 11, 10, 14), "zweiwoechentlich", bis=date(2026, 12, 8))
        self.assertEqual(len(w), 3)
        self.assertEqual(len(pl.serien_starts(st, "woechentlich", anzahl=500)), pl.SERIE_MAX)
        with self.assertRaises(ValueError):
            pl.serien_starts(st, "taeglich", anzahl=2)
        with self.assertRaises(ValueError):
            pl.serien_starts(st, "woechentlich")

    def test_utm(self):
        u = pl.utm_aus_herkunft({"quelle": "google / cpc", "kampagne": "kuechen-herbst", "klick-id": "gclid"}, {"utm_content": "anzeige-a"})
        self.assertEqual((u["utm_source"], u["utm_medium"], u["utm_campaign"], u["utm_content"], u["klick_id"]), ("google", "cpc", "kuechen-herbst", "anzeige-a", "gclid"))
        self.assertEqual(pl.utm_aus_herkunft({}, {})["utm_source"], "")


if __name__ == "__main__":
    unittest.main()


class TestKanaeleUndPhasen(unittest.TestCase):
    def test_kanal(self):
        from ph_crm.utils.kanaele import kanal

        self.assertEqual(kanal("PH Bestellung", {"bestellart": "Online"}), "Shop")
        self.assertEqual(kanal("PH Bestellung", {"bestellart": "Showroom"}), "Showroom")
        self.assertEqual(kanal("PH Kassenbeleg", {}), "Showroom")
        self.assertEqual(kanal("PH Rechnung", {"bestellung": "PH-S-1"}), "Shop")
        self.assertEqual(kanal("PH Rechnung", {}, projektart="Hotel"), "Objekt")
        self.assertEqual(kanal("PH Projekt", {"projektart": "Kueche"}), "Showroom")
        self.assertEqual(kanal("PH Auftragsbestaetigung", {"vertragsort": "Fernabsatz"}), "Shop")

    def test_gruppieren(self):
        from ph_crm.utils.kanaele import gruppieren

        g = gruppieren([{"kanal": "Shop", "bereich": "kaeufe", "betrag_cent": 500}, {"kanal": "Shop", "bereich": "reklamationen"}, {"kanal": "Objekt", "bereich": "planungen"}])
        self.assertEqual((g["Shop"]["summe_cent"], g["Shop"]["anzahl"], len(g["Objekt"]["planungen"])), (500, 2, 1))
        self.assertEqual(g["Showroom"]["anzahl"], 0)

    def test_phasen_pflichtfelder(self):
        from ph_crm.utils.kanaele import fehlende_pflichtfelder, phasen_wahrscheinlichkeit

        self.assertEqual([f for f, _ in fehlende_pflichtfelder("Angebot", {"kontakt": "K", "zugewiesen_an": "u", "wert_cent": 0})], ["wert_cent", "erwarteter_abschluss"])
        self.assertEqual(fehlende_pflichtfelder("Erstberatung", {"kontakt": "K", "zugewiesen_an": "u"}), [])
        self.assertEqual(fehlende_pflichtfelder("Unbekannt", {}), [])
        self.assertEqual(phasen_wahrscheinlichkeit("Planung"), 50)

    def test_interessent_loeschfrist(self):
        from ph_crm.utils.kanaele import interessent_loeschfaellig

        self.assertTrue(interessent_loeschfaellig("2022-11-01", "2025-11-02"))
        self.assertFalse(interessent_loeschfaellig("2022-11-01", "2025-11-01"))
        self.assertFalse(interessent_loeschfaellig(None, "2030-01-01"))
        self.assertFalse(interessent_loeschfaellig("2024-02-29", "2027-02-28"))

    def test_kassa_belege_ohne_kontaktbezug(self):
        plan = [{"doctype": "PH Kassenbeleg", "name": "K1", "aktion": "aufbewahren", "frist_bis": "2033-12-31", "ohne_kontaktbezug": True}]
        self.assertFalse(auf.braucht_name(plan))
        self.assertIsNone(auf.gesamtfrist(plan))
