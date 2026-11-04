import datetime as dt
import unittest

from ph_faktura.rechenwerk import epc, mahnen, nummern


class TestEpc(unittest.TestCase):
    def test_text(self):
        t = epc.epc_text("MW Immobilienverwaltungs GmbH", "AT61 1904 3002 3457 3201", 568000, "RE-2026-00001", bic="RZOOAT2L")
        z = t.split("\n")
        self.assertEqual(z[:4], ["BCD", "002", "1", "SCT"])
        self.assertEqual(z[4], "RZOOAT2L")
        self.assertEqual(z[6], "AT611904300234573201")
        self.assertEqual(z[7], "EUR5680.00")
        self.assertEqual(z[10], "RE-2026-00001")
        self.assertEqual(len(z), 12)

    def test_leer_bei_null(self):
        self.assertEqual(epc.epc_text("X", "AT1", 0, "r"), "")
        self.assertEqual(epc.epc_text("", "AT1", 100, "r"), "")

    def test_svg_ohne_fehler(self):
        # Mit oder ohne QR-Bibliothek: nie Ausnahme, Ergebnis '' oder Data-URI
        s = epc.epc_svg(epc.epc_text("X", "AT611904300234573201", 100, "r"))
        self.assertTrue(s == "" or s.startswith("data:image/svg+xml;base64,"))


class TestNummern(unittest.TestCase):
    def test_luecken(self):
        erg = nummern.luecken(["RE-2026-00001", "RE-2026-00002", "RE-2026-00004", "RE-2025-00001", "GU-2026-00001", "GU-2026-00001", "ENTW-2026-00009"])
        self.assertEqual(erg[("RE", 2026)]["fehlend"], [3])
        self.assertEqual(erg[("RE", 2025)]["fehlend"], [])
        self.assertEqual(erg[("GU", 2026)]["doppelt"], [1])
        self.assertNotIn(("ENTW", 2026), erg)

    def test_formatiere(self):
        self.assertEqual(nummern.formatiere("RE", 2026, 12), "RE-2026-00012")


class TestMahnen(unittest.TestCase):
    EINST = {"stufe1_tage": 7, "stufe2_tage": 14, "stufe3_tage": 21, "abstand_tage": 7, "gebuehr1_cent": 0, "gebuehr2_cent": 500, "gebuehr3_cent": 1000,
             "zinsen_ab_stufe": 2, "zinssatz_verbraucher_promille": 40, "zinssatz_unternehmer_promille": 122}

    def test_verzugstage_und_stufe(self):
        self.assertEqual(mahnen.verzugstage(dt.date(2026, 10, 1), dt.date(2026, 10, 20), 3), 16)
        self.assertEqual(mahnen.stufe_bestimmen(5, self.EINST), 0)
        self.assertEqual(mahnen.stufe_bestimmen(8, self.EINST), 1)
        self.assertEqual(mahnen.stufe_bestimmen(30, self.EINST), 3)
        self.assertEqual(mahnen.stufe_bestimmen(30, self.EINST, letzte_stufe=1, tage_seit_letzter=3), 0)  # Abstand
        self.assertEqual(mahnen.stufe_bestimmen(30, self.EINST, letzte_stufe=1, tage_seit_letzter=8), 3)
        self.assertEqual(mahnen.stufe_bestimmen(16, self.EINST, letzte_stufe=2, tage_seit_letzter=8), 3)
        self.assertEqual(mahnen.stufe_bestimmen(60, self.EINST, letzte_stufe=3, tage_seit_letzter=30), 0)

    def test_zinsen_und_gesamt(self):
        self.assertEqual(mahnen.verzugszinsen(100000, 365, 40), 4000)
        m = mahnen.mahnbetrag(100000, 2, 30, self.EINST)
        self.assertEqual(m["mahngebuehr_cent"], 500)
        self.assertEqual(m["verzugszinsen_cent"], 329)  # 1000 € × 4 % × 30/365 = 3,29 €
        self.assertEqual(m["gesamt_cent"], 100829)
        m1 = mahnen.mahnbetrag(100000, 1, 30, self.EINST)
        self.assertEqual(m1["verzugszinsen_cent"], 0)
        mu = mahnen.mahnbetrag(100000, 3, 30, self.EINST, unternehmer=True)
        self.assertEqual(mu["zinssatz_promille"], 122)


if __name__ == "__main__":
    unittest.main()
