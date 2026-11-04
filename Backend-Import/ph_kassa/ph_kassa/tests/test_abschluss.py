import unittest

from ph_kassa.logik.abschluss import bargeld_soll, bewegung_cent, buchung_gesperrt, differenz, differenz_grund_pflichtig, naechster_status, soll_aus_belegen, zaehlprotokoll_leer, zaehlprotokoll_summe
from ph_kassa.logik.betraege import KassenFehler

BELEGE = [
    {"belegart": "Standard", "trainings": 0, "gesamt_cent": 12000, "bediener": "a@x", "zahlarten": [{"zahlart": "Bar", "betrag_cent": 12000}], "positionen": [{"art": "Artikel", "steuersatz": "Normal 20", "netto_cent": 10000, "ust_cent": 2000, "brutto_cent": 12000}]},
    {"belegart": "Standard", "trainings": 0, "gesamt_cent": 300000, "bediener": "a@x", "zahlarten": [{"zahlart": "Karte Stripe Terminal", "betrag_cent": 300000}], "positionen": [{"art": "Anzahlung", "steuersatz": "Normal 20", "netto_cent": 250000, "ust_cent": 50000, "brutto_cent": 300000}]},
    {"belegart": "Standard", "trainings": 0, "gesamt_cent": 10000, "bediener": "b@x", "zahlarten": [{"zahlart": "Gutschein", "betrag_cent": 4000}, {"zahlart": "Bar", "betrag_cent": 6000}], "positionen": [{"art": "Gutschein Verkauf", "steuersatz": "Null 0", "netto_cent": 10000, "ust_cent": 0, "brutto_cent": 10000}]},
    {"belegart": "Stornobeleg", "trainings": 0, "gesamt_cent": -12000, "bediener": "b@x", "zahlarten": [{"zahlart": "Bar", "betrag_cent": -12000}], "positionen": [{"art": "Storno", "steuersatz": "Normal 20", "netto_cent": -10000, "ust_cent": -2000, "brutto_cent": -12000}]},
    {"belegart": "Trainingsbeleg", "trainings": 1, "gesamt_cent": 99999, "bediener": "b@x", "zahlarten": [{"zahlart": "Bar", "betrag_cent": 99999}], "positionen": []},
    {"belegart": "Nullbeleg", "trainings": 0, "gesamt_cent": 0, "bediener": "a@x", "zahlarten": [], "positionen": []},
]


class TestAbschluss(unittest.TestCase):
    def test_soll_aus_belegen(self):
        s = soll_aus_belegen(BELEGE)
        self.assertEqual(s["belege_anzahl"], 5)
        self.assertEqual(s["trainings_anzahl"], 1)
        self.assertEqual(s["stornos_anzahl"], 1)
        self.assertEqual(s["nullbelege_anzahl"], 1)
        self.assertEqual(s["bar_einnahmen_cent"], 18000)
        self.assertEqual(s["bar_ausgaben_cent"], 12000)
        self.assertEqual(s["karten_cent"], 300000)
        self.assertEqual(s["gutschein_cent"], 4000)
        self.assertEqual(s["umsatz_cent"], 310000)
        self.assertEqual(s["anzahlungen_cent"], 300000)
        self.assertEqual(s["gutschein_verkauf_cent"], 10000)
        self.assertEqual(s["je_satz"]["Normal 20"]["ust_cent"], 50000)
        self.assertEqual(s["je_bediener"]["b@x"]["stornos"], 1)

    def test_differenz_tagesabschluss(self):
        s = soll_aus_belegen(BELEGE)
        soll = bargeld_soll(bargeld_anfang_cent=20000, bar_einnahmen_cent=s["bar_einnahmen_cent"], bar_ausgaben_cent=s["bar_ausgaben_cent"], einlagen_cent=5000, entnahmen_cent=10000)
        self.assertEqual(soll, 20000 + 18000 - 12000 + 5000 - 10000)
        ist = zaehlprotokoll_summe([{"stueckelung_cent": 10000, "anzahl": 2}, {"stueckelung_cent": 50, "anzahl": 3}])
        self.assertEqual(ist, 20150)
        self.assertEqual(differenz(ist, soll), -850)
        self.assertTrue(differenz_grund_pflichtig(-850, 0))
        self.assertFalse(differenz_grund_pflichtig(0, 0))
        self.assertFalse(differenz_grund_pflichtig(-50, 100))

    def test_zaehlprotokoll(self):
        self.assertEqual(len(zaehlprotokoll_leer()), 15)
        self.assertEqual(zaehlprotokoll_summe(zaehlprotokoll_leer()), 0)
        with self.assertRaises(KassenFehler):
            zaehlprotokoll_summe([{"stueckelung_cent": 300, "anzahl": 1}])
        with self.assertRaises(KassenFehler):
            zaehlprotokoll_summe([{"stueckelung_cent": 100, "anzahl": -1}])

    def test_sperre_nach_abschluss(self):
        self.assertFalse(buchung_gesperrt([]))
        self.assertFalse(buchung_gesperrt([{"status": "Offen"}]))
        self.assertFalse(buchung_gesperrt([{"status": "Gezaehlt"}]))
        self.assertTrue(buchung_gesperrt([{"status": "Abgeschlossen"}]))
        self.assertFalse(buchung_gesperrt([{"status": "Korrigiert"}]), "Öffnen durch Leitung hebt die Sperre auf")

    def test_statusmaschine(self):
        self.assertEqual(naechster_status("Offen", "zaehlen"), "Gezaehlt")
        self.assertEqual(naechster_status("Gezaehlt", "abschliessen"), "Abgeschlossen")
        self.assertEqual(naechster_status("Abgeschlossen", "oeffnen"), "Korrigiert")
        self.assertEqual(naechster_status("Korrigiert", "zaehlen"), "Gezaehlt")
        with self.assertRaises(KassenFehler):
            naechster_status("Offen", "abschliessen")
        with self.assertRaises(KassenFehler):
            naechster_status("Abgeschlossen", "zaehlen")

    def test_kassenbuch_vorzeichen(self):
        self.assertEqual(bewegung_cent("Einlage", 500), 500)
        self.assertEqual(bewegung_cent("Entnahme", 500), -500)
        self.assertEqual(bewegung_cent("Differenz", -850), -850)
        with self.assertRaises(KassenFehler):
            bewegung_cent("Einlage", -1)
        with self.assertRaises(KassenFehler):
            bewegung_cent("Unsinn", 1)


if __name__ == "__main__":
    unittest.main()
