"""AZG/ARG-Prüfung und GlBG-Entgeltangabe ohne Site."""

import unittest
from datetime import date, timedelta

from ph_personal.utils.azg import HINWEIS, VERSTOSS, durchschnitt_17_wochen, pruefen, zusammenfassung
from ph_personal.utils.glbg import SALARY_UNIT, darf_veroeffentlichen, entgelt_fehlt, entgelt_vollstaendig


def b(d, k, g, p=30):
    return {"datum": d, "kommen": k, "gehen": g, "pause_min": p}


class TestAzg(unittest.TestCase):
    def test_normaltag_ohne_befund(self):
        self.assertEqual(pruefen([b(date(2026, 11, 2), "08:00", "16:30")]), [])

    def test_tag_10_und_12_stunden(self):
        r = pruefen([b(date(2026, 11, 2), "07:00", "18:30")])  # 11 h netto
        self.assertEqual(r[0]["stufe"], HINWEIS)
        r = pruefen([b(date(2026, 11, 2), "07:00", "18:30")], ueberstunden_erlaubt=False)
        self.assertEqual(r[0]["stufe"], VERSTOSS)
        r = pruefen([b(date(2026, 11, 2), "06:00", "19:00")])  # 12:30 netto
        self.assertTrue(any(x["art"] == "tag" and x["stufe"] == VERSTOSS for x in r))

    def test_pause(self):
        r = pruefen([b(date(2026, 11, 2), "08:00", "15:00", 0)])
        self.assertEqual([x["art"] for x in r], ["pause"])
        self.assertEqual(pruefen([b(date(2026, 11, 2), "08:00", "13:30", 0)], jugendlich=True)[0]["art"], "pause")

    def test_ruhezeit(self):
        r = pruefen([b(date(2026, 11, 2), "12:00", "22:00"), b(date(2026, 11, 3), "06:00", "12:00", 0)])
        self.assertIn("ruhezeit", [x["art"] for x in r])

    def test_woche_und_wochenruhe(self):
        mo = date(2026, 11, 2)
        r = pruefen([b(mo + timedelta(days=i), "07:00", "16:30") for i in range(6)])  # 6 × 9 h = 54 h
        arten = {(x["art"], x["stufe"]) for x in r}
        self.assertIn(("woche", HINWEIS), arten)
        r = pruefen([b(mo + timedelta(days=i), "08:00", "17:00") for i in range(7)])
        self.assertIn("wochenruhe", [x["art"] for x in r])

    def test_durchschnitt_17_wochen(self):
        start = date(2026, 1, 5)
        wochen = {start + timedelta(weeks=i): 50 * 60 for i in range(17)}
        self.assertEqual(durchschnitt_17_wochen(wochen, start + timedelta(weeks=16)), 3000)
        buch = []
        for w in range(17):
            for t in range(5):
                buch.append(b(start + timedelta(weeks=w, days=t), "07:00", "17:30"))  # 10 h × 5 = 50 h
        r = pruefen(buch, von=start + timedelta(weeks=16), bis=start + timedelta(weeks=16, days=6))
        self.assertIn("durchschnitt", [x["art"] for x in r])

    def test_zusammenfassung(self):
        z = zusammenfassung(pruefen([b(date(2026, 11, 2), "08:00", "15:00", 0)]))
        self.assertEqual(z["verstoesse"], 1)
        self.assertIn("AZG § 11", z["text"])


class TestGlbg(unittest.TestCase):
    def test_vollstaendig(self):
        self.assertTrue(entgelt_vollstaendig(253500, "Monat", "KV Handel", "ja"))
        self.assertTrue(entgelt_vollstaendig(1450, "Stunde", "KV Handel Arbeiter", "", "Überzahlung nach Qualifikation"))
        self.assertEqual(SALARY_UNIT["Stunde"], "HOUR")

    def test_fehlt(self):
        self.assertEqual(len(entgelt_fehlt(0, "Woche", "", "")), 4)
        self.assertEqual(entgelt_fehlt(253500, "Monat", "KV", ""), ["Bereitschaft zur Überzahlung (ja/nein oder eigener Wortlaut)"])

    def test_veroeffentlichen(self):
        self.assertFalse(darf_veroeffentlichen("Aktiv", 0, "Monat", "KV", "ja"))
        self.assertFalse(darf_veroeffentlichen("Entwurf", 253500, "Monat", "KV", "ja"))
        self.assertTrue(darf_veroeffentlichen("Aktiv", 253500, "Monat", "KV", "ja"))

    def test_stundenlohn_veroeffentlichbar(self):
        """Website kann „Stunde“ (stellen.js SALARY_UNIT HOUR) – keine Ausblendung mehr."""
        self.assertTrue(darf_veroeffentlichen("Aktiv", 1450, "Stunde", "KV Handel Arbeiter", "ja"))
        self.assertEqual(SALARY_UNIT["Stunde"], "HOUR")


if __name__ == "__main__":
    unittest.main()
