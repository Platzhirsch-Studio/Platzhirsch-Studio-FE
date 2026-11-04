"""Ohne Site: cd Backend-Import/ph_faktura && python -m unittest discover -s ph_faktura/tests -t ."""

import unittest

from ph_faktura.rechenwerk import steuer as S


class TestSummen(unittest.TestCase):
    def test_position_und_ust_je_satz(self):
        pos = [
            {"art": "Produkt", "menge": 2, "einzel_netto_cent": 100000, "rabatt_promille": 100, "ust_satz_promille": 2000},
            {"art": "Leistung", "menge": 1.5, "einzel_netto_cent": 9000, "ust_satz_promille": 2000},
            {"art": "Produkt", "menge": 1, "einzel_netto_cent": 3333, "ust_satz_promille": 1000},
            {"art": "Text", "bezeichnung": "Hinweis"},
            {"art": "Produkt", "alternativ": 1, "menge": 1, "einzel_netto_cent": 50000, "ust_satz_promille": 2000},
        ]
        s = S.summen(pos)
        self.assertEqual(pos[0]["netto_cent"], 180000)  # 2 × 1000 € − 10 %
        self.assertEqual(pos[0]["pos"], 1)
        self.assertEqual(pos[1]["netto_cent"], 13500)
        self.assertEqual(s["rabatt_gesamt_cent"], 20000)
        self.assertEqual(s["alternativ_cent"], 60000)
        self.assertEqual(s["netto_cent"], 180000 + 13500 + 3333)
        a20 = next(a for a in s["aufteilung"] if a["ust_satz_promille"] == 2000)
        a10 = next(a for a in s["aufteilung"] if a["ust_satz_promille"] == 1000)
        self.assertEqual(a20["ust_cent"], 38700)
        self.assertEqual(a10["ust_cent"], 333)  # 333,3 → 333
        self.assertEqual(s["ust_cent"], 39033)
        self.assertEqual(s["brutto_cent"], s["netto_cent"] + s["ust_cent"])
        self.assertEqual(a20["bezeichnung"], "USt 20 %")

    def test_rundung_half_up(self):
        self.assertEqual(S.ust_betrag(1, 2000), 0)  # 0,2 → 0
        self.assertEqual(S.ust_betrag(3, 2000), 1)  # 0,6 → 1
        self.assertEqual(S.ust_betrag(25, 1000), 3)  # 2,5 → 3 (half up)

    def test_kleinbetrag_und_uid_grenze(self):
        self.assertTrue(S.ist_kleinbetrag(40000))
        self.assertFalse(S.ist_kleinbetrag(40001))
        self.assertFalse(S.uid_empfaenger_pflicht(1000000))
        self.assertTrue(S.uid_empfaenger_pflicht(1000001))


class TestUstFall(unittest.TestCase):
    def test_at(self):
        self.assertEqual(S.ust_fall_bestimmen("Österreich"), (S.FALL_AT, None))
        self.assertEqual(S.satz_fuer_fall(S.FALL_AT, 2000), 2000)

    def test_oss_de_privat(self):
        fall, land = S.ust_fall_bestimmen("DE", oss_aktiv=True)
        self.assertEqual((fall, land), (S.FALL_OSS, "DE"))
        self.assertEqual(S.satz_fuer_fall(fall, 2000, land), 1900)
        self.assertEqual(S.satz_fuer_fall(fall, 1000, land), 700)
        self.assertIn("DE", S.hinweistext(fall, oss_land=land))

    def test_de_privat_ohne_oss_bleibt_at(self):
        self.assertEqual(S.ust_fall_bestimmen("DE", oss_aktiv=False), (S.FALL_AT, None))

    def test_eu_b2b_igl_und_rc(self):
        self.assertEqual(S.ust_fall_bestimmen("DE", uid="DE123456789")[0], S.FALL_IG)
        self.assertEqual(S.ust_fall_bestimmen("IT", uid="IT12345678901", nur_leistungen=True)[0], S.FALL_RC)
        self.assertEqual(S.satz_fuer_fall(S.FALL_IG, 2000), 0)
        self.assertIn("Steuerschuldnerschaft", S.hinweistext(S.FALL_RC))
        self.assertIn("innergemeinschaftliche", S.hinweistext(S.FALL_IG))

    def test_ch_ausfuhr(self):
        self.assertEqual(S.ust_fall_bestimmen("Schweiz"), (S.FALL_AUSFUHR, None))
        self.assertEqual(S.ust_fall_bestimmen("CH", uid="CHE123456789")[0], S.FALL_AUSFUHR)
        self.assertIn("Ausfuhr", S.hinweistext(S.FALL_AUSFUHR))


class TestPflichtangaben(unittest.TestCase):
    def basis(self, **o):
        b = {"kunde_name": "Anna Muster", "strasse": "Weg 1", "ort": "Bregenz", "datum": "2026-11-04", "positionen": [1], "leistungsdatum": "2026-11-04",
             "brutto_cent": 120000, "firma_uid": "ATU70035339", "ust_fall": S.FALL_AT, "ust_hinweistext": "", "kleinbetrag": False}
        b.update(o)
        return b

    def test_vollstaendig(self):
        self.assertEqual(S.pflichtangaben_pruefen(self.basis()), [])

    def test_fehlende(self):
        fehlt = S.pflichtangaben_pruefen(self.basis(leistungsdatum=None, brutto_cent=1200000, uid_empfaenger=None))
        self.assertIn("Tag der Lieferung oder Leistungszeitraum", fehlt)
        self.assertTrue(any("10.000" in f for f in fehlt))

    def test_kleinbetrag_ohne_anschrift(self):
        self.assertEqual(S.pflichtangaben_pruefen(self.basis(strasse=None, firma_uid=None, brutto_cent=30000, kleinbetrag=True)), [])

    def test_rc_braucht_uid_und_hinweis(self):
        fehlt = S.pflichtangaben_pruefen(self.basis(ust_fall=S.FALL_RC, uid_empfaenger=None, ust_hinweistext=""))
        self.assertEqual(len(fehlt), 2)


if __name__ == "__main__":
    unittest.main()
