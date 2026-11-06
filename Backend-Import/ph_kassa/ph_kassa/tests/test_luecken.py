"""Tests für die Backend-Lücken Kassa (50-backend-luecken-kassa-faktura.md) – ohne Frappe."""

import unittest
from datetime import date, datetime

from ph_kassa.logik import codes, notbetrieb, regeln, retoure
from ph_kassa.logik.abschluss import anfangsbestand, geschaeftstag, soll_aus_belegen, zeitraum
from ph_kassa.logik.betraege import (
    KassenFehler,
    beleg_pruefen,
    fremd_in_eur,
    position_berechnen,
    rabatt_berechnen,
    rabatt_freigabe_noetig,
    summen,
    zahlarten_pruefen,
)
from ph_kassa.terminal import TerminalFehler, TerminalMock, zeitueberschreitung

EINST = {"gutschein_art": "Mehrzweck", "barverkauf_rechnung_ab_cent": 40000, "bar_identitaet_ab_cent": 1000000, "retoure_bar_nur_leitung": 1}


class TestBetraegeErweitert(unittest.TestCase):
    def test_retoure_immer_negativ(self):
        p = position_berechnen({"art": "Retoure", "menge": 1, "einzel_brutto_cent": 12000, "steuersatz": "Normal 20"})
        self.assertEqual(p["brutto_cent"], -12000)
        self.assertEqual(p["ust_cent"], -2000)
        self.assertEqual(p["einzel_brutto_cent"], -12000)

    def test_menge_null_verboten(self):
        with self.assertRaises(KassenFehler):
            position_berechnen({"art": "Artikel", "menge": 0, "einzel_brutto_cent": 100})

    def test_rabatt_prozent_und_betrag(self):
        self.assertEqual(rabatt_berechnen(19900, rabatt_promille=150), {"einzel_brutto_cent": 16915, "rabatt_cent": 2985, "rabatt_promille": 150})
        self.assertEqual(rabatt_berechnen(19900, rabatt_cent=900)["einzel_brutto_cent"], 19000)
        with self.assertRaises(KassenFehler):
            rabatt_berechnen(1000, rabatt_cent=2000)
        with self.assertRaises(KassenFehler):
            rabatt_berechnen(1000, rabatt_promille=10, rabatt_cent=10)

    def test_rabatt_in_position_braucht_grund(self):
        with self.assertRaises(KassenFehler):
            position_berechnen({"art": "Artikel", "listenpreis_cent": 10000, "rabatt_promille": 100})
        p = position_berechnen({"art": "Artikel", "menge": 2, "listenpreis_cent": 10000, "rabatt_promille": 100, "rabatt_grund": "Ausstellungsstück"})
        self.assertEqual((p["einzel_brutto_cent"], p["brutto_cent"], p["rabatt_gesamt_cent"]), (9000, 18000, 2000))

    def test_rabatt_freigabe(self):
        pos = [{"listenpreis_cent": 10000, "rabatt_promille": 50}, {"listenpreis_cent": 10000, "rabatt_cent": 2500}, {"einzel_brutto_cent": 5}]
        self.assertEqual(rabatt_freigabe_noetig(pos, 100), [1])
        self.assertEqual(rabatt_freigabe_noetig(pos, 0), [])

    def test_chf_bar_rueckgeld_eur(self):
        z = zahlarten_pruefen(8970, [{"zahlart": "Bar", "fremdwaehrung": "CHF", "fremd_gegeben_cent": 10000, "kurs_mikro": 1045000}])
        bar = z["zahlarten"][0]
        self.assertEqual(bar["gegeben_cent"], 10450)
        self.assertEqual(bar["betrag_cent"], 8970)
        self.assertEqual(z["rueckgeld_cent"], 1480)
        with self.assertRaises(KassenFehler):
            zahlarten_pruefen(8970, [{"zahlart": "Bar", "fremdwaehrung": "CHF", "fremd_gegeben_cent": 10002, "kurs_mikro": 1045000}])
        with self.assertRaises(KassenFehler):
            zahlarten_pruefen(8970, [{"zahlart": "Karte extern", "betrag_cent": 8970, "fremdwaehrung": "CHF"}])
        self.assertEqual(fremd_in_eur(5, 1045000), 5)

    def test_rueckzahlung_gemischt(self):
        z = zahlarten_pruefen(-15000, [{"zahlart": "Karte Stripe Terminal", "betrag_cent": 10000, "terminal_payment_intent": "pi_1"}, {"zahlart": "Bar"}])
        self.assertEqual([x["betrag_cent"] for x in z["zahlarten"]], [-10000, -5000])
        with self.assertRaises(KassenFehler):
            zahlarten_pruefen(-1000, [{"zahlart": "Gutschein", "betrag_cent": 1000}])
        with self.assertRaises(KassenFehler):
            zahlarten_pruefen(-1000, [{"zahlart": "Ueberweisung", "betrag_cent": 2000}])

    def test_retoure_gegen_gutschein_nullbeleg(self):
        s = beleg_pruefen([{"art": "Retoure", "einzel_brutto_cent": 5000, "steuersatz": "Normal 20", "zusatz": "Umtausch"}, {"art": "Gutschein Verkauf", "einzel_brutto_cent": 5000, "steuersatz": "Null 0"}], [])
        self.assertEqual(s["gesamt_cent"], 0)
        self.assertEqual(s["je_satz"]["Normal 20"]["ust_cent"], -833)


class TestRegeln(unittest.TestCase):
    def _e(self, positionen, zahlarten=None, **kw):
        s = summen(positionen)
        return {"positionen": s["positionen"], "zahlarten": zahlarten or [], "gesamt_cent": s["gesamt_cent"], **kw}

    def test_rechnung_ab_400(self):
        e = self._e([{"art": "Artikel", "einzel_brutto_cent": 45000}])
        self.assertTrue(regeln.pruefe(e, EINST)["fehler"])
        e["empfaenger"] = {"name": "Hotel Post", "strasse": "Hauptstraße 1", "ort": "Lech"}
        self.assertFalse(regeln.pruefe(e, EINST)["fehler"])
        self.assertFalse(regeln.pruefe(self._e([{"art": "Artikel", "einzel_brutto_cent": 40000}]), EINST)["fehler"])

    def test_anzahlung_nur_mit_auftrag_und_ueberzahlung(self):
        e = self._e([{"art": "Anzahlung", "einzel_brutto_cent": 100000}])
        self.assertTrue(regeln.pruefe(e, EINST)["fehler"])
        e.update(auftrag="AB-2026-00001", auftrag_offen_cent=50000, vertragsort="Beim Kunden", fagg_frist_ende="18.11.2026")
        r = regeln.pruefe(e, EINST)
        self.assertEqual(r["fehler"], [])
        self.assertEqual(r["freigaben"], ["ueberzahlung"])
        self.assertTrue(r["hinweise"])

    def test_gutschein_regeln(self):
        e = self._e([{"art": "Gutschein Verkauf", "einzel_brutto_cent": 5000, "steuersatz": "Null 0"}], [{"zahlart": "Gutschein", "betrag_cent": 5000}])
        self.assertTrue(regeln.pruefe(e, EINST)["fehler"])
        e2 = self._e([{"art": "Artikel", "einzel_brutto_cent": 5000}], [{"zahlart": "Gutschein", "betrag_cent": 5000}])
        self.assertTrue(regeln.pruefe(e2, {**EINST, "gutschein_art": "Einzweck"})["fehler"])
        self.assertFalse(regeln.pruefe(e2, EINST)["fehler"])

    def test_bar_ab_10000_identitaet(self):
        e = self._e([{"art": "Artikel", "einzel_brutto_cent": 1200000}], [{"zahlart": "Bar", "betrag_cent": 1200000}], kontakt="K-1")
        self.assertTrue(any("Identität" in f for f in regeln.pruefe(e, EINST)["fehler"]))
        e["identitaet"] = {"art": "Reisepass", "nummer": "P1234567"}
        self.assertFalse(regeln.pruefe(e, EINST)["fehler"])

    def test_retoure_bar_braucht_freigabe(self):
        e = self._e([{"art": "Retoure", "einzel_brutto_cent": 5000, "zusatz": "Mangel"}], [{"zahlart": "Bar", "betrag_cent": -5000}], retoure_original=True)
        r = regeln.pruefe(e, EINST)
        self.assertEqual(r["fehler"], [])
        self.assertEqual(r["freigaben"], ["retoure_bar"])
        e2 = self._e([{"art": "Retoure", "einzel_brutto_cent": 5000}], [{"zahlart": "Bar"}])
        self.assertTrue(regeln.pruefe(e2, EINST)["fehler"])

    def test_storno_freigabe(self):
        b = {"bediener": "a@x", "datum": date(2026, 11, 4), "gesamt_cent": 5000}
        self.assertEqual(regeln.storno_freigabe(b, "a@x", date(2026, 11, 4), False, 10000), [])
        self.assertEqual(regeln.storno_freigabe(b, "a@x", date(2026, 11, 4), False, 0), ["storno_betrag"])
        self.assertEqual(regeln.storno_freigabe(b, "b@x", date(2026, 11, 5), False, 10000), ["storno_fremd"])
        self.assertEqual(regeln.storno_freigabe(b, "b@x", date(2026, 11, 5), True, 0), [])


class TestCodes(unittest.TestCase):
    def test_arten(self):
        self.assertEqual(codes.erkennen("4006381333931")["art"], "ean")
        self.assertEqual(codes.erkennen("4006381333932")["art"], "suche")
        self.assertEqual(codes.erkennen("kk-7k3qx9")["art"], "kundenkarte")
        self.assertEqual(codes.erkennen("PH-7K3Q-X9MA-2BCD-EFGH")["art"], "gutschein")
        self.assertEqual(codes.erkennen("AB-2026-00012")["art"], "auftrag")
        self.assertEqual(codes.erkennen("RE-2026-00012")["art"], "rechnung")
        self.assertEqual(codes.erkennen("SHOWROOM1-000012")["art"], "kassenbeleg")
        q = codes.erkennen("_R1-AT1_SHOWROOM1_12_2026-11-04T10:00:00_1,00_0,00_0,00_0,00_0,00_AAA=_1A_BBB=_CCC=")
        self.assertEqual((q["art"], q["kassen_id"], q["belegnummer"]), ("rksv_qr", "SHOWROOM1", "12"))
        self.assertEqual(codes.erkennen("Sofa Grau")["art"], "suche")


class TestRetoure(unittest.TestCase):
    ORIG = [
        {"name": "z1", "art": "Artikel", "bezeichnung": "Vase", "menge": 3, "einzel_brutto_cent": 4990, "steuersatz": "Normal 20", "produkt": "P1"},
        {"name": "z2", "art": "Gutschein Verkauf", "bezeichnung": "Gutschein", "menge": 1, "einzel_brutto_cent": 5000, "steuersatz": "Null 0"},
    ]

    def test_teilretoure(self):
        zeilen = retoure.ruecknehmbar(self.ORIG, [{"bezug_zeile": "z1", "menge": 1}])
        self.assertEqual(len(zeilen), 1)
        self.assertEqual(zeilen[0]["ruecknehmbar"], 2)
        pos = retoure.retoure_positionen("K1-000005", {"z1": 2}, zeilen, "Umtausch")
        self.assertEqual(pos[0]["einzel_brutto_cent"], -4990)
        self.assertEqual(pos[0]["bezug_zeile"], "z1")
        with self.assertRaises(KassenFehler):
            retoure.retoure_positionen("K1-000005", {"z1": 3}, zeilen, "Umtausch")
        with self.assertRaises(KassenFehler):
            retoure.retoure_positionen("K1-000005", {"z1": 1}, zeilen, "")
        with self.assertRaises(KassenFehler):
            retoure.retoure_positionen("K1-000005", {"z2": 1}, zeilen, "x")

    def test_erstattungsweg(self):
        v = retoure.erstattungsweg_vorschlag([{"zahlart": "Bar", "betrag_cent": 2000}, {"zahlart": "Karte Stripe Terminal", "betrag_cent": 8000, "terminal_payment_intent": "pi_1", "zahlung": "Z1"}], 9000)
        self.assertEqual(v[0], {"zahlart": "Karte Stripe Terminal", "betrag_cent": 8000, "terminal_payment_intent": "pi_1", "erstattung_von_zahlung": "Z1"})
        self.assertEqual(v[1], {"zahlart": "Bar", "betrag_cent": 1000})
        self.assertEqual(retoure.anteil(10000, 1, 3), 3333)


class TestNotbetrieb(unittest.TestCase):
    def test_pruefen(self):
        jetzt = datetime(2026, 11, 4, 12, 0)
        b = [
            {"notbeleg_nr": "N-0002", "zeitpunkt": "2026-11-04T10:30:00", "positionen": [{"art": "Artikel", "einzel_brutto_cent": 2000}], "zahlarten": [{"zahlart": "Bar", "betrag_cent": 2000, "gegeben_cent": 5000}]},
            {"notbeleg_nr": "N-0001", "zeitpunkt": "2026-11-04T10:15:00", "positionen": [{"art": "Artikel", "einzel_brutto_cent": 1000}], "zahlarten": [{"zahlart": "Karte extern", "betrag_cent": 1000}]},
        ]
        out = notbetrieb.pruefe_notbelege(b, jetzt)
        self.assertEqual([x["notbeleg_nr"] for x in out], ["N-0001", "N-0002"])
        self.assertIn("Nacherfassung Notbeleg N-0001", out[0]["positionen"][0]["zusatz"])
        with self.assertRaises(KassenFehler):
            notbetrieb.pruefe_notbelege(b, jetzt, bereits_erfasst={"N-0001"})
        with self.assertRaises(KassenFehler):
            notbetrieb.pruefe_notbelege([{**b[0], "zahlarten": [{"zahlart": "Karte Stripe Terminal", "betrag_cent": 2000}]}], jetzt)
        with self.assertRaises(KassenFehler):
            notbetrieb.pruefe_notbelege([{**b[0], "zeitpunkt": "2026-11-05T10:00:00"}], jetzt)
        with self.assertRaises(KassenFehler):
            notbetrieb.pruefe_notbelege(b, jetzt, limit_cent=1500)
        self.assertTrue(notbetrieb.notbetrieb_zulaessig(False, False))
        self.assertFalse(notbetrieb.notbetrieb_zulaessig(False, True))


class TestAbschlussErweitert(unittest.TestCase):
    def test_chf_und_retoure_im_soll(self):
        belege = [
            {"belegart": "Standard", "gesamt_cent": 8970, "zahlarten": [{"zahlart": "Bar", "betrag_cent": 8970, "retour_cent": 1480, "fremdwaehrung": "CHF", "fremd_gegeben_cent": 10000}], "positionen": [{"art": "Artikel", "steuersatz": "Normal 20", "brutto_cent": 8970}]},
            {"belegart": "Standard", "gesamt_cent": -4990, "zahlarten": [{"zahlart": "Bar", "betrag_cent": -4990}], "positionen": [{"art": "Retoure", "steuersatz": "Normal 20", "brutto_cent": -4990}]},
        ]
        s = soll_aus_belegen(belege)
        self.assertEqual(s["chf_einnahmen_cent"], 10000)
        self.assertEqual(s["bar_einnahmen_cent"], 0)
        self.assertEqual(s["bar_ausgaben_cent"], 1480 + 4990)
        self.assertEqual((s["retouren_cent"], s["retouren_anzahl"]), (4990, 1))

    def test_geschaeftstag_und_zeitraum(self):
        self.assertEqual(geschaeftstag(datetime(2026, 11, 5, 1, 30), "03:00"), date(2026, 11, 4))
        self.assertEqual(geschaeftstag(datetime(2026, 11, 5, 1, 30), None), date(2026, 11, 5))
        self.assertEqual(zeitraum(date(2026, 11, 4), "03:00"), ("2026-11-04 03:00:00", "2026-11-05 02:59:59"))
        self.assertEqual(zeitraum(date(2026, 11, 4)), ("2026-11-04 00:00:00", "2026-11-04 23:59:59"))

    def test_anfangsbestand(self):
        a = anfangsbestand(15000, 0, 15000)
        self.assertEqual((a["bargeld_anfang_cent"], a["hinweis"]), (15000, None))
        self.assertTrue(anfangsbestand(15000, 5000, 14000)["hinweis"])
        self.assertEqual(anfangsbestand(0, 20000)["bargeld_anfang_cent"], 20000)


class TestTerminalErweitert(unittest.TestCase):
    def test_erstatten(self):
        m = TerminalMock()
        pi = m.zahlung_starten("tmr_mock_1", 10000)["payment_intent"]
        with self.assertRaises(TerminalFehler):
            m.erstatten(pi, 1000)
        m.simuliere_zahlung("tmr_mock_1")
        r = m.erstatten(pi, 6000, idempotency_key="k1")
        self.assertEqual(r["status"], "succeeded")
        self.assertEqual(m.erstatten(pi, 6000, idempotency_key="k1")["refund"], r["refund"])
        with self.assertRaises(TerminalFehler):
            m.erstatten(pi, 5000)
        self.assertEqual(m.erstatten(pi, 4000)["betrag_cent"], 4000)

    def test_zeitueberschreitung(self):
        t0 = datetime(2026, 11, 4, 10, 0, 0)
        self.assertEqual(zeitueberschreitung(t0, datetime(2026, 11, 4, 10, 0, 30)), "ok")
        self.assertEqual(zeitueberschreitung(t0, datetime(2026, 11, 4, 10, 1, 30)), "warnung")
        self.assertEqual(zeitueberschreitung(t0, datetime(2026, 11, 4, 10, 3, 0)), "abbruch")
        self.assertEqual(zeitueberschreitung(None, t0), "ok")


if __name__ == "__main__":
    unittest.main()
