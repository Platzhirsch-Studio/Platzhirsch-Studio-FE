"""AZG/ARG/KJBG-Logik, Dienstplan und Datenschutzfristen ohne Site."""

import unittest
from datetime import date, datetime

from ph_personal.utils.arbeitszeit import (
    FREI_BETRIEBSRUHE,
    FREI_GESETZLICH,
    FREI_LAND,
    ist_jugendlich,
    modell_am,
    pause_pflicht_min,
    ruhezeit_verstoesse,
    soll_tag,
    standardmodell,
    stunden_aufteilen,
    tag_bewerten,
    tag_pruefen,
    urlaubstage,
    wochen_auswerten,
    wochenruhe_ok,
    za_wert,
    zeitfenster_minuten,
)
from ph_personal.utils.datenschutz import (
    aufbewahrung_bis,
    loeschfrist_bewerbung,
    offene_bewerbung_zu_alt,
    titel_geschlechtsneutral,
)
from ph_personal.utils.dienstplan import konflikte, unterbesetzung, uhrzeit_min, vorwoche_kopieren, wochenstunden

DI_SA = {"gueltig_ab": date(2026, 1, 1), "mo_min": 0, "di_min": 462, "mi_min": 462, "do_min": 462, "fr_min": 462, "sa_min": 462, "so_min": 0}
MO_FR = {"gueltig_ab": date(2025, 1, 1), "mo_min": 462, "di_min": 462, "mi_min": 462, "do_min": 462, "fr_min": 462, "sa_min": 0, "so_min": 0}


class TestModell(unittest.TestCase):
    def test_modell_mit_gueltigkeit(self):
        modelle = [MO_FR, DI_SA]
        self.assertIs(modell_am(modelle, date(2025, 6, 1)), MO_FR)
        self.assertIs(modell_am(modelle, date(2026, 6, 1)), DI_SA)
        self.assertIsNone(modell_am(modelle, date(2024, 6, 1)))

    def test_samstagskraft_urlaub(self):
        # Mi 04.11.2026 – Sa 07.11.2026, Modell Di–Sa: Mi, Do, Fr, Sa = 4 Tage
        tage = urlaubstage(date(2026, 11, 4), date(2026, 11, 7), [DI_SA])
        self.assertEqual(len(tage), 4)
        # Montag ist frei → 0
        self.assertEqual(urlaubstage(date(2026, 11, 9), date(2026, 11, 9), [DI_SA]), [])

    def test_feiertag_verbraucht_keinen_urlaub(self):
        frei = {date(2026, 12, 8): FREI_GESETZLICH}
        tage = urlaubstage(date(2026, 12, 7), date(2026, 12, 11), [MO_FR], frei)
        self.assertEqual(len(tage), 4)

    def test_betriebsruhe_und_land(self):
        frei = {date(2026, 12, 24): FREI_BETRIEBSRUHE, date(2026, 3, 19): FREI_LAND}
        self.assertEqual(soll_tag([MO_FR], date(2026, 12, 24), frei)[0], 0)
        self.assertEqual(soll_tag([MO_FR], date(2026, 12, 24), frei, betriebsruhe_behandlung="Urlaub")[0], 462)
        self.assertEqual(soll_tag([MO_FR], date(2026, 3, 19), frei, landesfeiertag_frei=False)[0], 462)

    def test_standardmodell(self):
        m = standardmodell(38.5)
        self.assertEqual(m["mo_min"], 462)
        self.assertEqual(m["sa_min"], 0)


class TestGutschrift(unittest.TestCase):
    def test_urlaub_gutschrift(self):
        self.assertEqual(tag_bewerten(462, "Urlaub")["gutschrift"], 462)

    def test_zeitausgleich_senkt_saldo(self):
        t = tag_bewerten(462, "Zeitausgleich")
        self.assertEqual(t["gutschrift"], 0)
        self.assertEqual(t["soll"], 462)  # Saldo = 0 + 0 − 462

    def test_unbezahlt_soll_null(self):
        t = tag_bewerten(462, "Unbezahlt")
        self.assertEqual(t["soll"], 0)
        self.assertEqual(t["unbezahlt"], 462)

    def test_halber_tag(self):
        self.assertEqual(tag_bewerten(462, "Urlaub", halbtags=True)["gutschrift"], 231)


class TestUeberstunden(unittest.TestCase):
    def test_vollzeit(self):
        a = stunden_aufteilen(45 * 60, 2310, 2310)
        self.assertEqual(a["normal"], 2310)
        self.assertEqual(a["kv_mehrstunden"], 90)
        self.assertEqual(a["ueberstunden"], 300)

    def test_teilzeit_mehrarbeit(self):
        a = stunden_aufteilen(25 * 60, 20 * 60, 2310)
        self.assertEqual(a["mehrarbeit"], 300)
        self.assertEqual(a["ueberstunden"], 0)

    def test_za_wert(self):
        a = {"mehrarbeit": 60, "kv_mehrstunden": 0, "ueberstunden": 120}
        self.assertEqual(za_wert(a), 255)
        self.assertEqual(za_wert(a, "Gleitzeit"), 180)
        self.assertEqual(za_wert(a, "Auszahlung"), 0)

    def test_wochen_auswerten(self):
        tage = [{"datum": date(2026, 11, d), "ist": 540, "gutschrift": 0, "modell_min": 462, "modell_woche_min": 2310} for d in range(2, 7)]
        wochen, summe = wochen_auswerten(tage, 2310)
        self.assertEqual(len(wochen), 1)
        self.assertEqual(summe["ueberstunden"], 2700 - 2400)


class TestGrenzen(unittest.TestCase):
    def test_pause(self):
        self.assertEqual(pause_pflicht_min(361), 30)
        self.assertEqual(pause_pflicht_min(300), 0)
        self.assertEqual(pause_pflicht_min(300, jugendlich=True), 30)

    def test_tag(self):
        self.assertEqual(tag_pruefen(500), [])
        self.assertEqual(tag_pruefen(660)[0][0], "hinweis")
        self.assertEqual(tag_pruefen(780)[0][0], "verstoss")
        self.assertEqual(tag_pruefen(500, jugendlich=True)[0][0], "verstoss")

    def test_ruhezeit(self):
        iv = [(datetime(2026, 11, 6, 10), datetime(2026, 11, 6, 22)), (datetime(2026, 11, 7, 7), datetime(2026, 11, 7, 15))]
        v = ruhezeit_verstoesse(iv)
        self.assertEqual(len(v), 1)
        self.assertEqual(v[0]["stunden"], 9.0)

    def test_wochenruhe(self):
        iv = [(datetime(2026, 11, 2 + i, 9), datetime(2026, 11, 2 + i, 18)) for i in range(7)]
        self.assertFalse(wochenruhe_ok(iv, date(2026, 11, 2))[0])
        self.assertTrue(wochenruhe_ok(iv[:5], date(2026, 11, 2))[0])

    def test_zeitfenster(self):
        z = zeitfenster_minuten(date(2026, 11, 7), 9 * 60, 18 * 60)
        self.assertEqual(z["samstag_ab_13"], 300)
        z = zeitfenster_minuten(date(2026, 12, 8), 9 * 60, 12 * 60, {date(2026, 12, 8): FREI_GESETZLICH})
        self.assertEqual(z["feiertag"], 180)
        self.assertEqual(zeitfenster_minuten(date(2026, 11, 4), 5 * 60, 23 * 60)["nacht"], 120)

    def test_jugendlich(self):
        self.assertTrue(ist_jugendlich(date(2009, 1, 1), date(2026, 11, 4)))
        self.assertFalse(ist_jugendlich(date(2008, 11, 4), date(2026, 11, 4)))


class TestDienstplan(unittest.TestCase):
    def _s(self, ma, tag, b, e, bereich="Showroom"):
        return {"mitarbeiter": ma, "datum": tag, "beginn_min": uhrzeit_min(b), "ende_min": uhrzeit_min(e), "pause_min": 30, "bereich": bereich}

    def test_unterbesetzung(self):
        sa = date(2026, 11, 7)
        anf = [{"wochentag": 5, "von_min": 540, "bis_min": 1020, "anzahl": 2, "bereich": "Showroom"}]
        schichten = [self._s("A", sa, "09:00", "17:00"), self._s("B", sa, "12:00", "17:00")]
        l = unterbesetzung(schichten, anf, [sa])
        self.assertEqual(len(l), 1)
        self.assertEqual((l[0]["von_min"], l[0]["bis_min"], l[0]["ist"]), (540, 720, 1))

    def test_konflikte(self):
        fr, sa = date(2026, 11, 6), date(2026, 11, 7)
        schichten = [self._s("A", fr, "12:00", "22:00"), self._s("A", sa, "06:00", "12:00"), self._s("B", sa, "09:00", "13:00"), self._s("B", sa, "12:00", "18:00")]
        k = konflikte(schichten, {"B": [(sa, sa, "abwesend")]})
        arten = sorted(x["art"] for x in k)
        self.assertIn("ruhezeit", arten)
        self.assertIn("doppelt", arten)
        self.assertIn("abwesend", arten)

    def test_wochenstunden_und_kopie(self):
        s = [self._s("A", date(2026, 11, 7), "09:00", "17:00")]
        self.assertEqual(wochenstunden(s)["A"], 450)
        self.assertEqual(vorwoche_kopieren(s)[0]["datum"], date(2026, 11, 14))


class TestDatenschutz(unittest.TestCase):
    def test_loeschfrist_ab_zugang(self):
        self.assertEqual(loeschfrist_bewerbung(date(2026, 3, 1), date(2026, 3, 5), 7), date(2026, 10, 5))
        self.assertEqual(loeschfrist_bewerbung(date(2026, 3, 1), None, 3), date(2026, 9, 1))  # mindestens 6
        self.assertEqual(loeschfrist_bewerbung(date(2026, 3, 1), None, 7, date(2027, 3, 1)), date(2027, 3, 1))
        self.assertIsNone(loeschfrist_bewerbung())

    def test_offen_zu_alt(self):
        self.assertTrue(offene_bewerbung_zu_alt(date(2026, 1, 1), date(2026, 6, 1), 90))

    def test_aufbewahrung(self):
        self.assertEqual(aufbewahrung_bis(date(2026, 5, 1)), date(2033, 12, 31))

    def test_titel(self):
        self.assertTrue(titel_geschlechtsneutral("Küchenplaner:in"))
        self.assertTrue(titel_geschlechtsneutral("Verkäufer (m/w/d)"))
        self.assertTrue(titel_geschlechtsneutral("MonteurIn"))
        self.assertTrue(titel_geschlechtsneutral("Lehrling Einzelhandel"))
        self.assertFalse(titel_geschlechtsneutral("Monteur"))
        self.assertFalse(titel_geschlechtsneutral("Teamleiter Verkauf"))


if __name__ == "__main__":
    unittest.main()
