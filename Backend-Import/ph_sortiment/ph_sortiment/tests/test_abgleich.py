import unittest

from ph_sortiment.logik.abgleich import abgleich, abweichung_kennzeichen, abweichungen_position, bestellstatus_aus_mengen, offen, wareneingang_status


class TestAbgleich(unittest.TestCase):
    def pos(self, **kw):
        base = {"produkt": "soleum-lagoon", "bezeichnung": "Lagoon", "menge": 2, "ek_cent": 100000, "wunschtermin": "2026-12-01", "hersteller_artikelnr": "LAG-1"}
        base.update(kw)
        return base

    def test_keine_abweichung(self):
        z = abweichungen_position(self.pos(ab_menge=2, ab_ek_cent=100000, bestaetigter_termin="2026-12-01", ab_artikelnr="lag-1"), 1)
        self.assertEqual(z, [])
        self.assertEqual(abweichung_kennzeichen(z), "keine")

    def test_erkennt_preis_menge_termin(self):
        z = abweichungen_position(self.pos(ab_menge=1, ab_ek_cent=105000, bestaetigter_termin="2026-12-15"), 3)
        self.assertEqual({x["feld"] for x in z}, {"Preis", "Menge", "Termin"})
        self.assertEqual(abweichung_kennzeichen(z), "Mehrfach")
        preis = next(x for x in z if x["feld"] == "Preis")
        self.assertEqual(preis["position"], 3)
        self.assertIn("+5.0 %", preis["abweichung_text"])
        termin = next(x for x in z if x["feld"] == "Termin")
        self.assertEqual(termin["abweichung_text"], "+14 Tage")

    def test_toleranzen(self):
        z = abweichungen_position(self.pos(ab_ek_cent=101000, bestaetigter_termin="2026-12-03"), 1, toleranz_preis_prozent=2, toleranz_termin_tage=3)
        self.assertEqual(z, [])
        # Frühere Lieferung ist keine Abweichung
        z = abweichungen_position(self.pos(bestaetigter_termin="2026-11-20"), 1)
        self.assertEqual(z, [])

    def test_leere_ab_felder_werden_nicht_verglichen(self):
        self.assertEqual(abweichungen_position(self.pos(), 1), [])
        self.assertEqual(abweichung_kennzeichen(abweichungen_position(self.pos(ab_menge=0), 1)), "Menge")

    def test_gesamtprotokoll_und_termin(self):
        protokoll, kennzeichen, spaetester = abgleich([self.pos(ab_menge=2, bestaetigter_termin="2026-12-01"), self.pos(ab_menge=3, bestaetigter_termin="2027-01-10")])
        self.assertEqual(len(protokoll), 2)  # Menge + Termin der 2. Position
        self.assertEqual(kennzeichen, {1: "keine", 2: "Mehrfach"})
        self.assertEqual(str(spaetester), "2027-01-10")
        self.assertEqual(offen(protokoll), 2)
        protokoll[0]["bewertung"] = "ok"
        self.assertEqual(offen(protokoll), 1)

    def test_bestellstatus_und_wareneingang(self):
        self.assertIsNone(bestellstatus_aus_mengen([{"menge": 2, "menge_erhalten": 0}]))
        self.assertEqual(bestellstatus_aus_mengen([{"menge": 2, "menge_erhalten": 1}]), "Teilgeliefert")
        self.assertEqual(bestellstatus_aus_mengen([{"menge": 2, "menge_erhalten": 2}, {"menge": 5, "menge_erhalten": 0, "status": "Storniert"}]), "Geliefert")
        self.assertEqual(wareneingang_status([{"menge_erwartet": 2, "menge_erhalten": 2, "zustand": "ok"}]), "Vollstaendig")
        self.assertEqual(wareneingang_status([{"menge_erwartet": 2, "menge_erhalten": 1, "zustand": "ok"}]), "Teilweise")
        self.assertEqual(wareneingang_status([{"menge_erwartet": 2, "menge_erhalten": 2, "zustand": "Transportschaden"}]), "Reklamiert")
        self.assertEqual(wareneingang_status([{"menge_erwartet": 2, "menge_erhalten": 0, "zustand": "fehlt"}]), "Offen")


if __name__ == "__main__":
    unittest.main()
