import unittest

from ph_microsoft.logik.gruppen import hat_gemappte_gruppe, rollen_abgleich, standort_aus_gruppen, zuordnung_normalisieren

G1, G2, G3 = "aa-1", "BB-2", "cc-3"
ZEILEN = [
    {"gruppe_id": G1, "rolle": "PH CRM Mitarbeiter", "standort": "Lochau"},
    {"gruppe_id": G2, "rolle": "PH CRM Leitung"},
    {"gruppe_id": G2, "rolle": "PH CRM Mitarbeiter"},
    {"gruppe_id": G3, "rolle": "System Manager"},  # geschützt → ignoriert
]


class TestGruppen(unittest.TestCase):
    def setUp(self):
        self.z = zuordnung_normalisieren(ZEILEN)

    def test_geschuetzte_rolle_nie_gemappt(self):
        self.assertNotIn("cc-3", self.z)

    def test_hinzufuegen(self):
        hinzu, weg = rollen_abgleich(["PH Shop Mitarbeiter"], ["AA-1"], self.z)
        self.assertEqual(hinzu, ["PH CRM Mitarbeiter"])
        self.assertEqual(weg, [])

    def test_entfernen_nur_verwaltete(self):
        hinzu, weg = rollen_abgleich(["PH CRM Leitung", "PH CRM Mitarbeiter", "PH Shop Mitarbeiter", "System Manager"], ["aa-1"], self.z)
        self.assertEqual(hinzu, [])
        self.assertEqual(weg, ["PH CRM Leitung"])  # Shop (nicht gemappt) und System Manager bleiben

    def test_ueberlauf_aendert_nichts(self):
        self.assertEqual(rollen_abgleich(["PH CRM Leitung"], None, self.z), ([], []))

    def test_keine_gruppen_entfernt_alle_verwalteten(self):
        self.assertEqual(rollen_abgleich(["PH CRM Leitung", "PH CRM Mitarbeiter"], [], self.z), ([], ["PH CRM Leitung", "PH CRM Mitarbeiter"]))

    def test_hat_gruppe_und_standort(self):
        self.assertTrue(hat_gemappte_gruppe(["bb-2"], self.z))
        self.assertFalse(hat_gemappte_gruppe(["cc-3"], self.z))
        self.assertFalse(hat_gemappte_gruppe(None, self.z))
        self.assertEqual(standort_aus_gruppen(["bb-2", "aa-1"], self.z), "Lochau")


if __name__ == "__main__":
    unittest.main()
