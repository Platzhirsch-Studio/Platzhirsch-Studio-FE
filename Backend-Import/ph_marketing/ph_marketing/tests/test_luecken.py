"""Tests ohne Site für Segment, Mail-Ereignisse, Event-Logik, Attribution, Datenschutz, CSV-Kennzahlen.
cd Backend-Import/ph_marketing && PYTHONPATH=. python -m unittest discover -s ph_marketing/tests -t ."""

import base64
import hashlib
import hmac
import unittest
from datetime import date, datetime

from ph_marketing.utils import attribution, datenschutz, eventlogik, kennzahlen_csv, mail_ereignis, segment
from ph_marketing.utils.token import signatur_gueltig, signieren

HEUTE = date(2026, 11, 4)


def profil(**k):
    p = {"email": "a@example.at", "sprache": "de", "plz": "6911", "land": "AT", "interessen": {"küche"}, "kundenkarte_stufe": "Gold", "letzter_kauf": date(2026, 9, 1), "umsatz_12m_cent": 500000, "kaeufe_anzahl": 2, "events": set(), "abo_status": "Aktiv", "einwilligungen": {"newsletter": "Bestaetigt"}}
    p.update(k)
    return p


class TestSegment(unittest.TestCase):
    def test_regeln_und_oder(self):
        r1 = {"kriterium": "interesse", "operator": "ist", "wert": "Küche"}
        r2 = {"kriterium": "plz", "operator": "beginnt mit", "wert": "69,68"}
        r3 = {"kriterium": "kundenkarte_stufe", "operator": "ist", "wert": "Platin"}
        self.assertTrue(segment.passt([r1, r2], profil(), "UND", HEUTE))
        self.assertFalse(segment.passt([r1, r3], profil(), "UND", HEUTE))
        self.assertTrue(segment.passt([r1, r3], profil(), "ODER", HEUTE))
        self.assertTrue(segment.passt([], profil()))

    def test_kauf_und_umsatz(self):
        self.assertTrue(segment.regel_pruefen({"kriterium": "kauf_in_tagen", "operator": "ist", "wert": "90"}, profil(), HEUTE))
        self.assertFalse(segment.regel_pruefen({"kriterium": "kauf_in_tagen", "operator": "ist", "wert": "30"}, profil(), HEUTE))
        self.assertTrue(segment.regel_pruefen({"kriterium": "kein_kauf_seit_tagen", "operator": "ist", "wert": "30"}, profil(), HEUTE))
        self.assertFalse(segment.regel_pruefen({"kriterium": "kein_kauf_seit_tagen", "operator": "ist", "wert": "30"}, profil(letzter_kauf=None), HEUTE))
        self.assertTrue(segment.regel_pruefen({"kriterium": "umsatz_12m_cent", "operator": "zwischen", "wert": "100000", "wert_bis": "600000"}, profil(), HEUTE))
        self.assertTrue(segment.regel_pruefen({"kriterium": "plz", "operator": "zwischen", "wert": "6900", "wert_bis": "6999"}, profil(), HEUTE))
        self.assertTrue(segment.regel_pruefen({"kriterium": "sprache", "operator": "ist", "wert": "en", "negieren": 1}, profil(), HEUTE))

    def test_syntax(self):
        self.assertIsNone(segment.regel_pruefen_syntax("plz", "beginnt mit", "69"))
        self.assertIn("Wert", segment.regel_pruefen_syntax("sprache", "ist", ""))
        self.assertIsNotNone(segment.regel_pruefen_syntax("umsatz_12m_cent", "zwischen", "10", "5"))
        self.assertIsNotNone(segment.regel_pruefen_syntax("foo", "ist", "x"))

    def test_einwilligung_zwingend(self):
        ok, _ = segment.einwilligung_pruefen(profil(), "newsletter")
        self.assertTrue(ok)
        self.assertEqual(segment.einwilligung_pruefen(profil(abo_status="Abgemeldet"), "newsletter")[1], "kein_aktives_abo")
        self.assertEqual(segment.einwilligung_pruefen(profil(altbestand_ohne_doi=1), "newsletter")[1], "altbestand_ohne_doi")
        self.assertEqual(segment.einwilligung_pruefen(profil(einwilligungen={"newsletter": "Widerrufen"}), "newsletter")[1], "einwilligung_widerrufen")
        self.assertEqual(segment.einwilligung_pruefen(profil(nicht_kontaktieren=1), "newsletter")[1], "nicht_kontaktieren")
        self.assertEqual(segment.einwilligung_pruefen(profil(), "einladungen")[1], "keine_einwilligung")
        self.assertTrue(segment.einwilligung_pruefen(profil(einwilligungen={"einladungen": "Bestaetigt"}, abo_status=None), "einladungen")[0])
        self.assertEqual(segment.einwilligung_pruefen(profil(abo_status="Bounce", einwilligungen={"einladungen": "Bestaetigt"}), "einladungen")[1], "abo_bounce")
        self.assertFalse(segment.einwilligung_pruefen(profil(), "whatsapp")[0])

    def test_auswerten_zaehlt_ausschluesse_und_dubletten(self):
        ps = [profil(), profil(), profil(email="b@example.at", abo_status="Bounce"), profil(email="c@example.at", sprache="en")]
        emp, aus, treffer = segment.auswerten([{"kriterium": "sprache", "operator": "ist", "wert": "de"}], ps, "newsletter")
        self.assertEqual(len(emp), 1)
        self.assertEqual(treffer, 2)
        self.assertEqual(aus["dublette"], 1)
        self.assertEqual(aus["abo_bounce"], 1)


class TestMailEreignis(unittest.TestCase):
    SECRET = "whsec_" + base64.b64encode(b"geheim-nur-fuer-tests").decode()

    def _sig(self, mid, ts, body):
        key = base64.b64decode(self.SECRET[6:])
        return "v1," + base64.b64encode(hmac.new(key, f"{mid}.{ts}.".encode() + body, hashlib.sha256).digest()).decode()

    def test_signatur(self):
        body = b'{"type":"email.bounced"}'
        sig = self._sig("msg_1", 1700000000, body)
        self.assertTrue(mail_ereignis.signatur_pruefen(self.SECRET, "msg_1", "1700000000", "v1,falsch " + sig, body, jetzt=1700000100))
        with self.assertRaises(mail_ereignis.SignaturFehler):
            mail_ereignis.signatur_pruefen(self.SECRET, "msg_1", "1700000000", sig, body + b" ", jetzt=1700000100)
        with self.assertRaises(mail_ereignis.SignaturFehler):
            mail_ereignis.signatur_pruefen(self.SECRET, "msg_1", "1700000000", sig, body, jetzt=1700001000)
        with self.assertRaises(mail_ereignis.SignaturFehler):
            mail_ereignis.signatur_pruefen("", "msg_1", "1700000000", sig, body, jetzt=1700000000)

    def test_abbilden_und_folgen(self):
        e = mail_ereignis.ereignis_abbilden({"type": "email.bounced", "data": {"email_id": "re_1", "to": ["A@x.at"], "bounce": {"type": "Permanent", "message": "no such user"}}})
        self.assertEqual((e["art"], e["bounce_typ"], e["emails"], e["nachricht_id"]), ("bounce", "hart", ["a@x.at"], "re_1"))
        weich = mail_ereignis.ereignis_abbilden({"type": "email.bounced", "data": {"to": "b@x.at", "bounce": {"type": "Transient"}}})
        self.assertEqual(weich["bounce_typ"], "weich")
        self.assertEqual(mail_ereignis.ereignis_abbilden({"type": "email.opened", "data": {}})["art"], "ignoriert")
        self.assertEqual(mail_ereignis.abo_folge("bounce", "hart", 1), "bounce")
        self.assertIsNone(mail_ereignis.abo_folge("bounce", "weich", 2))
        self.assertEqual(mail_ereignis.abo_folge("bounce", "weich", 3), "bounce")
        self.assertEqual(mail_ereignis.abo_folge("beschwerde", None, 0), "beschwerde")
        self.assertEqual(mail_ereignis.status_uebernehmen("bounce_hart", "zugestellt"), "bounce_hart")
        self.assertEqual(mail_ereignis.status_uebernehmen("gesendet", "zugestellt"), "zugestellt")

    def test_list_unsubscribe(self):
        h = mail_ereignis.list_unsubscribe_header("https://platzhirsch.studio/api/abmelden?token=x", "abmelden@platzhirsch.studio")
        self.assertTrue(h["List-Unsubscribe"].startswith("<https://"))
        self.assertIn("mailto:", h["List-Unsubscribe"])
        self.assertEqual(h["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click")
        with self.assertRaises(ValueError):
            mail_ereignis.list_unsubscribe_header("http://unsicher")
        self.assertTrue(mail_ereignis.one_click_gueltig(b"List-Unsubscribe=One-Click"))
        self.assertTrue(mail_ereignis.one_click_gueltig({"List-Unsubscribe": "One-Click"}))
        self.assertFalse(mail_ereignis.one_click_gueltig(""))


class TestEvent(unittest.TestCase):
    def test_kontingent_und_frei(self):
        a = [{"status": "angemeldet", "personen": 4}, {"status": "angemeldet", "personen": 2, "eingeladen": 1}, {"status": "abgesagt", "personen": 5}]
        self.assertEqual(eventlogik.belegt(a), 6)
        # 20 Plätze, 10 reserviert für Eingeladene, 2 davon belegt → Öffentliche: 14 frei − 8 Restkontingent = 6
        self.assertEqual(eventlogik.frei(20, a, eingeladen=False, kontingent=10, kontingent_bis=date(2026, 11, 10), heute=HEUTE), 6)
        self.assertEqual(eventlogik.frei(20, a, eingeladen=True, kontingent=10, kontingent_bis=date(2026, 11, 10), heute=HEUTE), 14)
        self.assertEqual(eventlogik.frei(20, a, kontingent=10, kontingent_bis=date(2026, 11, 1), heute=HEUTE), 14)
        self.assertIsNone(eventlogik.frei(0, a))

    def test_nachruecken_fifo_ohne_blockade(self):
        a = [
            {"name": "x", "status": "angemeldet", "personen": 8},
            {"name": "w1", "status": "warteliste", "personen": 4, "angemeldet_am": "2026-11-01 10:00"},
            {"name": "w2", "status": "warteliste", "personen": 2, "angemeldet_am": "2026-11-02 10:00"},
            {"name": "w3", "status": "warteliste", "personen": 1, "angemeldet_am": "2026-11-03 10:00"},
        ]
        n = eventlogik.nachruecker(a, 11)
        self.assertEqual([z["name"] for z in n], ["w2", "w3"])  # w1 (4) passt nicht in 3, blockiert aber nicht
        self.assertEqual([z["name"] for z in eventlogik.nachruecker(a, 12)], ["w1"])

    def test_checkin_code(self):
        code = eventlogik.checkin_code("adventsabend-2026", "abc123", "schluessel")
        self.assertEqual(eventlogik.checkin_lesen(code, "schluessel"), ("adventsabend-2026", "abc123"))
        with self.assertRaises(ValueError):
            eventlogik.checkin_lesen(code[:-1] + ("A" if code[-1] != "A" else "B"), "schluessel")
        with self.assertRaises(ValueError):
            eventlogik.checkin_lesen(code, "anderer")
        self.assertEqual(eventlogik.checkin_entscheiden("erschienen"), "bereits")
        self.assertEqual(eventlogik.checkin_entscheiden("angemeldet"), "ok")
        self.assertEqual(eventlogik.checkin_entscheiden("abgesagt"), "abgesagt")
        self.assertTrue(signatur_gueltig("x", signieren("x", "k").lower(), "k"))


class TestAttribution(unittest.TestCase):
    KAMPAGNEN = [
        {"name": "K1", "utm_campaign": "advent26", "utm_source": "meta", "status": "Aktiv", "zeitraum_von": "2026-11-01", "zeitraum_bis": "2026-11-30"},
        {"name": "K2", "utm_campaign": "advent26", "utm_source": "google", "status": "Aktiv", "zeitraum_von": "2026-11-01", "zeitraum_bis": "2026-11-30"},
        {"name": "K3", "utm_campaign": "sommer", "status": "Beendet", "zeitraum_von": "2026-06-01", "zeitraum_bis": "2026-07-31"},
        {"name": "K4", "utm_campaign": "entwurf", "status": "Entwurf"},
    ]

    def test_utm_aus_text(self):
        u = attribution.utm_aus_text("Seite: https://platzhirsch.studio/de/kuechen?utm_source=Meta&utm_campaign=Advent26\nutm_medium: paid")
        self.assertEqual(u, {"utm_source": "meta", "utm_campaign": "advent26", "utm_medium": "paid"})
        self.assertEqual(attribution.utm_aus_text(""), {})

    def test_kampagne_waehlen(self):
        self.assertEqual(attribution.kampagne_waehlen(self.KAMPAGNEN, {"utm_campaign": "advent26", "utm_source": "google"}, "2026-11-10"), "K2")
        self.assertEqual(attribution.kampagne_waehlen(self.KAMPAGNEN, {"utm_campaign": "sommer"}, "2026-08-15"), "K3")
        self.assertIsNone(attribution.kampagne_waehlen(self.KAMPAGNEN, {"utm_campaign": "sommer"}, "2026-10-15"))
        self.assertIsNone(attribution.kampagne_waehlen(self.KAMPAGNEN, {"utm_campaign": "entwurf"}, "2026-10-15"))

    def test_modelle(self):
        pk = [{"zeit": "2026-03-01", "kampagne": "A"}, {"zeit": "2026-05-01", "kampagne": "B"}, {"zeit": "2026-06-01", "kampagne": "B"}]
        self.assertEqual(attribution.verteilen(pk, "2026-06-10", 1000, "last"), {"B": 1000})
        self.assertEqual(attribution.verteilen(pk, "2026-06-10", 1000, "first"), {"A": 1000})
        self.assertEqual(attribution.verteilen(pk, "2026-06-10", 1000, "linear"), {"A": 333, "B": 667})
        self.assertEqual(attribution.verteilen(pk, "2026-06-10", 1000, "first", fenster_tage=60), {"B": 1000})
        self.assertEqual(attribution.verteilen(pk, "2026-01-01", 1000), {})
        erg = attribution.auswerten([{"kontaktpunkte": pk, "abschluesse": [{"zeit": "2026-06-10", "betrag_cent": 1000}]}], "linear")
        self.assertEqual(erg["B"], {"umsatz_cent": 667, "abschluesse": 1})
        self.assertEqual(attribution.roi_promille(30000, 10000), 2000)
        self.assertIsNone(attribution.roi_promille(1, 0))


class TestDatenschutz(unittest.TestCase):
    def test_widerruf_hat_vorrang(self):
        alt = [{"name": "E1", "zweck": "newsletter", "status": "Widerrufen", "widerrufen_am": "2026-10-01 10:00"}]
        neu = [{"name": "E2", "zweck": "newsletter", "status": "Bestaetigt", "doi_bestaetigt_am": "2026-09-01 10:00"}, {"name": "E3", "zweck": "einladungen", "status": "Bestaetigt", "doi_bestaetigt_am": "2026-09-01"}]
        self.assertEqual([a[0] for a in datenschutz.einwilligungen_abgleichen(alt, neu)], ["E2"])
        neu_spaeter = [{"name": "E4", "zweck": "newsletter", "status": "Bestaetigt", "doi_bestaetigt_am": "2026-10-20 10:00"}]
        self.assertEqual(datenschutz.einwilligungen_abgleichen(alt, neu_spaeter), [])

    def test_abgleich_nach_rename_eine_liste(self):
        alle = [
            {"name": "E1", "zweck": "newsletter", "status": "Widerrufen", "widerrufen_am": "2026-10-01 10:00", "doi_bestaetigt_am": "2026-01-01"},
            {"name": "E2", "zweck": "newsletter", "status": "Bestaetigt", "doi_bestaetigt_am": "2026-09-01 10:00"},
            {"name": "E3", "zweck": "newsletter", "status": "Bestaetigt", "doi_bestaetigt_am": "2026-10-15 10:00"},
        ]
        self.assertEqual([a[0] for a in datenschutz.einwilligungen_abgleichen(alle, alle)], ["E2"])

    def test_loeschplan(self):
        self.assertEqual(datenschutz.plan_einwilligung({"status": "Offen"})["aktion"], "loeschen")
        p = datenschutz.plan_einwilligung({"status": "Widerrufen", "widerrufen_am": "2026-11-04 09:00"})
        self.assertEqual((p["aktion"], p["frist_bis"]), ("aufbewahren", "2029-11-04"))
        self.assertEqual(datenschutz.plan_empfehlung({"gutschein_ausgegeben_am": "2026-05-01"})["frist_bis"], "2033-12-31")
        self.assertEqual(datenschutz.plan_empfehlung({})["aktion"], "loeschen")
        self.assertTrue(datenschutz.frist_abgelaufen("2026-01-01", HEUTE))
        self.assertFalse(datenschutz.frist_abgelaufen("2029-01-01", HEUTE))


class TestLoeschfristen(unittest.TestCase):
    def test_katalog_vollstaendig(self):
        from ph_marketing.utils.regeln import ZWECK_TEXT, ZWECKE

        for k, (doctype, tage, aktion, feld, grund) in datenschutz.LOESCHFRISTEN.items():
            self.assertTrue(doctype.startswith("PH "), k)
            self.assertGreater(tage, 0)
            self.assertIn(aktion, ("loeschen", "anonymisieren", "abgelaufen"))
            self.assertTrue(feld and grund)
        self.assertEqual(datenschutz.LOESCHFRISTEN["einwilligung_widerrufen"][1], 3 * 365)
        self.assertIn("kundenkarte_auswertung", ZWECKE)
        self.assertEqual(set(ZWECKE), set(ZWECK_TEXT))


class TestKennzahlenCsv(unittest.TestCase):
    def test_meta_deutsch(self):
        csv_text = "Berichtsbeginn;Impressionen;Link-Klicks;Ausgegebener Betrag (EUR)\n2026-11-01;1.234;56;12,50\n02.11.2026;100;3;1.002,10\nGesamt;1334;59;1014,60\n"
        zeilen, fehler = kennzahlen_csv.lesen(csv_text)
        self.assertEqual(fehler, [])
        self.assertEqual(zeilen[0], {"datum": "2026-11-01", "impressionen": 1234, "klicks": 56, "kosten_cent": 1250})
        self.assertEqual(zeilen[1]["kosten_cent"], 100210)
        self.assertEqual(len(zeilen), 2)

    def test_google_englisch_und_fehler(self):
        zeilen, fehler = kennzahlen_csv.lesen("Day,Impressions,Clicks,Cost\n2026-11-01,10,1,0.99\nkaputt,1,1,1\n")
        self.assertEqual(zeilen[0]["kosten_cent"], 99)
        self.assertEqual(len(fehler), 1)
        self.assertEqual(kennzahlen_csv.lesen("a;b\n1;2")[0], [])


if __name__ == "__main__":
    unittest.main()
