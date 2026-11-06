"""Tests ohne Site: Medienprüfung, Regress-Abgleich, Kulanzfreigabe, Einsatzzeiten, freie Fenster, nächster Schritt,
Aufbewahrung (DSGVO)."""

import unittest
from datetime import date

from ph_service.utils import aufbewahrung as auf
from ph_service.utils import einsatz, kulanz, medien, regress, schritte


class TestMedien(unittest.TestCase):
    def test_erkennen(self):
        self.assertEqual(medien.erkennen(b"\xff\xd8\xff\xe0" + b"0" * 20), "jpg")
        self.assertEqual(medien.erkennen(b"\x89PNG\r\n\x1a\n" + b"0" * 10), "png")
        self.assertEqual(medien.erkennen(b"RIFF\x00\x00\x00\x00WEBPVP8 "), "webp")
        self.assertEqual(medien.erkennen(b"%PDF-1.7\n" + b"0" * 10), "pdf")
        self.assertEqual(medien.erkennen(b"\x00\x00\x00\x18ftypmp42" + b"0" * 8), "mp4")
        self.assertEqual(medien.erkennen(b"\x00\x00\x00\x14ftypqt  " + b"0" * 8), "mov")
        self.assertEqual(medien.erkennen(b"\x00\x00\x00\x18ftypheic" + b"0" * 8), "heic")
        self.assertEqual(medien.erkennen(b"\x1a\x45\xdf\xa3" + b"0" * 10), "webm")
        self.assertIsNone(medien.erkennen(b"<html><script>"))

    def test_pruefen_grenzen(self):
        self.assertEqual(medien.pruefen(b"\xff\xd8\xff" + b"0" * 20), ("jpg", medien.BILD))
        with self.assertRaises(ValueError):
            medien.pruefen(b"MZ\x90\x00" + b"0" * 20)  # exe trotz .jpg
        with self.assertRaises(ValueError):
            medien.pruefen(b"\xff\xd8\xff" + b"0" * (2 * 1024 * 1024), bild_max_mb=1)
        video = b"\x00\x00\x00\x18ftypisom" + b"0" * (2 * 1024 * 1024)
        self.assertEqual(medien.pruefen(video, bild_max_mb=1, video_max_mb=5)[1], medien.VIDEO)
        with self.assertRaises(ValueError):
            medien.pruefen(video, erlaubt=(medien.BILD,))
        with self.assertRaises(ValueError):
            medien.pruefen(b"")


class TestRegressKulanz(unittest.TestCase):
    def test_abgleich(self):
        self.assertEqual(regress.abgleich(50000, 40000, 0)["status"], regress.OFFEN)
        a = regress.abgleich(50000, 40000, 39950)
        self.assertEqual(a["status"], regress.AUSGEGLICHEN)
        self.assertEqual(a["differenz_cent"], 50)
        self.assertEqual(a["nicht_anerkannt_cent"], 10000)
        self.assertEqual(regress.abgleich(50000, 40000, 30000)["status"], regress.UNTERDECKUNG)
        self.assertEqual(regress.abgleich(50000, 40000, 30000, ausgebucht=True)["status"], regress.AUSGEBUCHT)
        self.assertEqual(regress.abgleich(50000, 40000, 45000)["status"], regress.UEBERDECKUNG)
        self.assertEqual(regress.abgleich(50000, 0, 50000)["quote_promille"], 1000)

    def test_belastungsanzeige_und_mahnung(self):
        zeilen = regress.belastungszeilen(
            [
                {"name": "k1", "art": "Intern Arbeitszeit", "betrag_cent": 11700, "regressfaehig": 1, "einsatz": "E1"},
                {"name": "k2", "art": "Ersatzteil", "beschreibung": "Scharnier", "betrag_cent": 2500, "regressfaehig": 1},
                {"name": "k3", "art": "Kulanz", "betrag_cent": 5000, "regressfaehig": 1},
                {"name": "k4", "art": "Intern Anfahrt", "betrag_cent": 3000, "regressfaehig": 0},
            ],
            {"E1": {"zeit_arbeit_min": 90, "stundensatz_cent": 7800}},
        )
        self.assertEqual([z["kostenart"] for z in zeilen], ["Arbeitszeit", "Ersatzteil"])
        self.assertEqual((zeilen[0]["menge"], zeilen[0]["einheit"], zeilen[0]["satz_cent"]), (1.5, "h", 7800))
        self.assertEqual(regress.zeilenbetrag(1.5, 7800), 11700)
        self.assertEqual(regress.zeilenbetrag(0.33, 1001), 330)
        h = date(2026, 12, 1)
        self.assertEqual(regress.mahnung_faellig(h, date(2026, 11, 30)), 1)
        self.assertEqual(regress.mahnung_faellig(h, date(2026, 12, 1)), 0)
        self.assertEqual(regress.mahnung_faellig(h, date(2026, 11, 1), letzte_mahnung=date(2026, 11, 20), stufe=1), 0)
        self.assertEqual(regress.mahnung_faellig(h, date(2026, 11, 1), letzte_mahnung=date(2026, 11, 15), stufe=1), 2)
        self.assertEqual(regress.mahnung_faellig(h, date(2026, 11, 1), letzte_mahnung=date(2026, 11, 1), stufe=3), 0)

    def test_kulanz(self):
        self.assertEqual(kulanz.freigabe_status(40000, 50000), kulanz.NICHT_NOETIG)
        self.assertEqual(kulanz.freigabe_status(62000, 50000), kulanz.ANGEFORDERT)
        self.assertEqual(kulanz.freigabe_status(62000, 50000, freigegeben_cent=62000), kulanz.FREIGEGEBEN)
        self.assertEqual(kulanz.freigabe_status(70000, 50000, freigegeben_cent=62000), kulanz.ANGEFORDERT)  # Erhöhung
        self.assertEqual(kulanz.freigabe_status(62000, 50000, abgelehnt_cent=62000), kulanz.ABGELEHNT)


class TestEinsatz(unittest.TestCase):
    def test_zeiten_mit_pause_und_takt(self):
        z = einsatz.zeiten("2026-11-04 09:00:00", "2026-11-04 11:10:00", pause_min=20, anfahrt_einfach_min=25)
        self.assertEqual(z, {"arbeit_min": 110, "anfahrt_min": 50, "pause_min": 20, "abrechenbar_min": 165})
        self.assertEqual(einsatz.kosten_cent(165, 7800, 3500), 24950)
        with self.assertRaises(ValueError):
            einsatz.zeiten("2026-11-04 09:00:00", "2026-11-04 09:10:00", pause_min=30)

    def test_freie_fenster(self):
        f = einsatz.freie_fenster([("09:00", "11:00"), ("14:00", "15:00")], "08:00", "17:00", dauer_min=60, raster_min=60, puffer_min=0)
        self.assertEqual([a for a, _ in f], ["08:00", "11:00", "12:00", "13:00", "15:00", "16:00"])
        f = einsatz.freie_fenster([("09:00", "11:00")], "08:00", "12:00", dauer_min=60, raster_min=30, puffer_min=30)
        self.assertEqual([a for a, _ in f], [])


class TestSchritte(unittest.TestCase):
    def test_reihenfolge(self):
        h = date(2026, 11, 4)
        s = schritte.naechster_schritt({"status": "Gemeldet", "frist_reaktion": "2026-11-05"}, h)
        self.assertEqual(s["aktion"], "erstreaktion_erfassen")
        self.assertEqual(s["rang"], 1001)
        self.assertEqual(schritte.naechster_schritt({"status": "Entscheidung", "kulanz_freigabe_status": "Angefordert"}, h)["aktion"], "kulanz_freigeben")
        self.assertEqual(schritte.naechster_schritt({"status": "In Bearbeitung", "ersatzteile_benoetigt": 2}, h)["aktion"], "ersatzteile_bestellen")
        self.assertEqual(schritte.naechster_schritt({"status": "Entscheidung", "entscheidung": "Verbesserung"}, h)["aktion"], "einsatz_anlegen")
        self.assertEqual(schritte.naechster_schritt({"status": "Erledigt", "lieferantenrelevant": 1}, h)["aktion"], "lieferant_informieren")
        self.assertEqual(schritte.naechster_schritt({"status": "Geschlossen"}, h)["rang"], 99999)


class TestAufbewahrung(unittest.TestCase):
    def test_servicefall(self):
        h = date(2026, 11, 4)
        self.assertEqual(auf.servicefall("In Bearbeitung", heute=h)[0], auf.AUFBEWAHREN)
        self.assertEqual(auf.servicefall("Geschlossen", regress_offen=True, heute=h)[0], auf.AUFBEWAHREN)
        aktion, grund, frist = auf.servicefall("Geschlossen", verjaehrung_bis=date(2028, 6, 15), garantie_bis=date(2029, 1, 1), heute=h)
        self.assertEqual((aktion, frist), (auf.AUFBEWAHREN, date(2029, 4, 1)))
        self.assertIn("garantie", grund)
        self.assertEqual(auf.servicefall("Geschlossen", verjaehrung_bis=date(2025, 1, 1), heute=h)[0], auf.ANONYMISIEREN)

    def test_vertrag_einsatz(self):
        self.assertEqual(auf.vertrag("Aktiv")[0], auf.AUFBEWAHREN)
        self.assertEqual(auf.vertrag("Beendet")[0], auf.ANONYMISIEREN)
        self.assertEqual(auf.einsatz("Erledigt", auf.AUFBEWAHREN)[0], auf.AUFBEWAHREN)
        self.assertEqual(auf.einsatz("Erledigt", auf.ANONYMISIEREN)[0], auf.ANONYMISIEREN)


if __name__ == "__main__":
    unittest.main()
