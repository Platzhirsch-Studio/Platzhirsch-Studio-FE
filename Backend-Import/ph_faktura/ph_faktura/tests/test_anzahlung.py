import unittest
from decimal import Decimal

from ph_faktura.rechenwerk import anzahlung as A
from ph_faktura.rechenwerk import steuer as S


def auftrag():
    pos = [
        {"art": "Produkt", "menge": 1, "einzel_netto_cent": 1000000, "ust_satz_promille": 2000},  # 10.000 € netto, 20 %
        {"art": "Produkt", "menge": 1, "einzel_netto_cent": 200000, "ust_satz_promille": 1000},  # 2.000 € netto, 10 %
    ]
    return S.summen(pos)  # brutto 12.000 + 2.200 = 14.200 €


class TestAnzahlung(unittest.TestCase):
    def test_aufteilung_40_prozent(self):
        s = auftrag()
        z = A.anzahlung_aufteilen(s["aufteilung"], prozent=40)
        self.assertEqual(sum(x["brutto_cent"] for x in z), 568000)  # 40 % von 14.200 €
        z20 = next(x for x in z if x["ust_satz_promille"] == 2000)
        z10 = next(x for x in z if x["ust_satz_promille"] == 1000)
        self.assertEqual(z20["brutto_cent"], 480000)
        self.assertEqual(z20["netto_cent"], 400000)
        self.assertEqual(z20["ust_cent"], 80000)
        self.assertEqual(z10["brutto_cent"], 88000)
        self.assertEqual(z10["netto_cent"], 80000)
        self.assertEqual(z10["ust_cent"], 8000)

    def test_schlussrechnung_verrechnet_je_satz(self):
        s = auftrag()
        anz = A.anzahlung_aufteilen(s["aufteilung"], prozent=40)
        for a in anz:
            a["anzahlungsrechnung"] = "RE-2026-00001"
        v = A.verrechnen(s["aufteilung"], anz)
        self.assertEqual(v["anzahlung_brutto_cent"], 568000)
        self.assertEqual(v["anzahlung_ust_cent"], 88000)
        self.assertEqual(v["zahlbar_cent"], 1420000 - 568000)
        rest20 = next(r for r in v["rest"] if r["ust_satz_promille"] == 2000)
        self.assertEqual(rest20["netto_cent"], 600000)
        self.assertEqual(rest20["ust_cent"], 120000)
        # USt gesamt der Schlussrechnung = Gesamt-USt minus bereits fällige USt der Anzahlung
        self.assertEqual(sum(r["ust_cent"] for r in v["rest"]), s["ust_cent"] - 88000)

    def test_teilrechnung_anteilig(self):
        s = auftrag()
        anz = A.anzahlung_aufteilen(s["aufteilung"], prozent=50)
        for a in anz:
            a["anzahlungsrechnung"] = "RE-2026-00002"
        teil = S.summen([{"art": "Produkt", "menge": 1, "einzel_netto_cent": 500000, "ust_satz_promille": 2000}])  # halbe 20 %-Position
        anteil = A.wertanteil(teil["netto_cent"], s["netto_cent"])
        self.assertEqual(anteil, Decimal(500000) / Decimal(1200000))
        v = A.verrechnen(teil["aufteilung"], anz, anteil)
        # 50 % Anzahlung = 7.100 €; anteilig 500000/1200000 → 2.958,33 €, davon 20 %-Teil gekappt auf Leistungsbetrag
        self.assertLessEqual(v["anzahlung_brutto_cent"], teil["brutto_cent"])
        self.assertGreater(v["anzahlung_brutto_cent"], 0)
        self.assertEqual(v["zahlbar_cent"], teil["brutto_cent"] - v["anzahlung_brutto_cent"])

    def test_offene_anzahlungen_nach_teilverrechnung(self):
        ar = [{"name": "RE-2026-00001", "datum": None, "aufteilung": [{"ust_satz_promille": 2000, "netto_cent": 100000, "ust_cent": 20000, "brutto_cent": 120000}]}]
        bereits = [{"anzahlungsrechnung": "RE-2026-00001", "ust_satz_promille": 2000, "netto_cent": 40000, "ust_cent": 8000, "brutto_cent": 48000}]
        offen = A.offene_anzahlungen(ar, bereits)
        self.assertEqual(offen[0]["brutto_cent"], 72000)
        self.assertEqual(A.offene_anzahlungen(ar, bereits + bereits + [{"anzahlungsrechnung": "RE-2026-00001", "ust_satz_promille": 2000, "netto_cent": 20000, "ust_cent": 4000, "brutto_cent": 24000}]), [])

    def test_zahlungsplan_rundungsrest(self):
        plan = [{"prozent": 40}, {"prozent": 50}, {"prozent": 10}]
        A.zahlungsplan_betraege(100001, plan)
        self.assertEqual(sum(p["betrag_cent"] for p in plan), 100001)
        self.assertEqual(plan[0]["betrag_cent"], 40000)


if __name__ == "__main__":
    unittest.main()
