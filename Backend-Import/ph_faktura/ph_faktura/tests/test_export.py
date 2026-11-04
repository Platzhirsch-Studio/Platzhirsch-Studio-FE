import datetime as dt
import unittest

from ph_faktura.rechenwerk import export as E


def zeilen():
    return [
        {"beleg_doctype": "PH Rechnung", "beleg": "RE-2026-00001", "nummer": "RE-2026-00001", "datum": dt.date(2026, 11, 4), "kontakt_name": "Anna Muster",
         "konto": "200001", "gegenkonto": "4000", "satz_promille": 2000, "netto_cent": 1000000, "ust_cent": 200000, "brutto_cent": 1200000, "soll_haben": "S",
         "text": "Rechnung RE-2026-00001 Anna Muster", "leistungsdatum": dt.date(2026, 11, 2), "uid": ""},
        {"beleg_doctype": "PH Rechnung", "beleg": "RE-2026-00001", "nummer": "RE-2026-00001", "datum": dt.date(2026, 11, 4), "kontakt_name": "Anna Muster",
         "konto": "200001", "gegenkonto": "4010", "satz_promille": 1000, "netto_cent": 200000, "ust_cent": 20000, "brutto_cent": 220000, "soll_haben": "S",
         "text": "Rechnung RE-2026-00001 Anna Muster", "leistungsdatum": dt.date(2026, 11, 2), "uid": ""},
        {"beleg_doctype": "PH Gutschrift", "beleg": "GU-2026-00001", "nummer": "GU-2026-00001", "datum": dt.date(2026, 11, 5), "kontakt_name": "Anna Muster",
         "konto": "200001", "gegenkonto": "4000", "satz_promille": 2000, "netto_cent": 10000, "ust_cent": 2000, "brutto_cent": 12000, "soll_haben": "H",
         "text": "Gutschrift zu RE-2026-00001", "leistungsdatum": None, "uid": ""},
    ]


class TestExport(unittest.TestCase):
    def test_bmd_spalten_und_pruefsumme(self):
        text, ps = E.bmd_csv(zeilen())
        rows = [r.split(";") for r in text.strip().splitlines()]
        self.assertEqual(rows[0][:5], ["satzart", "konto", "gkonto", "belegnr", "belegdatum"])
        self.assertEqual(len(rows), 4)
        self.assertEqual(rows[1][9], "12000,00")
        self.assertEqual(rows[1][10], "2000,00")
        self.assertEqual(rows[1][8], "1")  # Steuercode 20 %
        self.assertEqual(rows[2][7], "10,0")
        self.assertEqual(rows[3][9], "-120,00")  # Gutschrift negativ
        self.assertEqual(len(ps), 64)
        text2, ps2 = E.bmd_csv(zeilen())
        self.assertEqual(ps, ps2)

    def test_datev_header(self):
        text, ps = E.datev_buchungsstapel(zeilen(), "12345", "67890", dt.date(2026, 11, 1), dt.date(2026, 11, 30), dt.date(2026, 1, 1), erzeugt=dt.datetime(2026, 12, 1, 8, 0, 0))
        rows = text.splitlines()
        self.assertTrue(rows[0].startswith("EXTF;700;21;Buchungsstapel;12;20261201080000000"))
        self.assertIn(";12345;67890;20260101;4;20261101;20261130;", rows[0])
        self.assertEqual(rows[1].split(";")[0], "Umsatz (ohne Soll/Haben-Kz)")
        felder = rows[2].split(";")
        self.assertEqual(felder[0], "12000,00")
        self.assertEqual(felder[1], "S")
        self.assertEqual(felder[6], "200001")
        self.assertEqual(felder[9], "0411")
        self.assertEqual(rows[4].split(";")[1], "H")

    def test_protokoll_je_beleg(self):
        text, protokoll = E.protokoll_csv(zeilen())
        self.assertEqual(len(protokoll), 2)
        re1 = next(p for p in protokoll if p["beleg"] == "RE-2026-00001")
        self.assertEqual(re1["brutto_cent"], 1420000)
        self.assertEqual(len(re1["pruefsumme"]), 16)
        self.assertIn("RE-2026-00001", text)

    def test_generisch(self):
        text, ps = E.csv_generisch(zeilen())
        self.assertEqual(len(text.strip().splitlines()), 4)


if __name__ == "__main__":
    unittest.main()
