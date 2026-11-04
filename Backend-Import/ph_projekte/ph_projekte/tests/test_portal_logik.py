"""Tests ohne Site (CONVENTIONS 15):
cd Backend-Import/ph_projekte && PYTHONPATH=. python -m unittest discover -s ph_projekte/tests -t .
"""

import datetime
import unittest

from ph_projekte.utils import portal as p
from ph_projekte.utils.texte import SPRACHEN, TEXTE, montage_text


class TestSteps(unittest.TestCase):
    def test_immer_acht_schritte_in_reihenfolge(self):
        steps = p.steps_fuer_phase("Bestellung", {"Anfrage": "2026-09-01", "Planung": "2026-09-10"}, {"lieferung": "2026-11-20"})
        self.assertEqual([s["key"] for s in steps], p.STEP_KEYS)
        self.assertEqual([s["state"] for s in steps], ["erledigt"] * 4 + ["aktiv"] + ["offen"] * 3)
        self.assertEqual(steps[0]["date"], "2026-09-01")
        self.assertEqual(steps[5]["date"], "2026-11-20")

    def test_abgeschlossen_alles_erledigt(self):
        steps = p.steps_fuer_phase("Abgeschlossen")
        self.assertTrue(all(s["state"] == "erledigt" for s in steps))

    def test_abgebrochen_faellt_auf_anfrage(self):
        self.assertEqual(p.steps_fuer_phase("Abgebrochen")[0]["state"], "aktiv")


class TestFeedback(unittest.TestCase):
    def test_pin_grenzen(self):
        self.assertTrue(p.pin_gueltig(0, 100))
        self.assertTrue(p.pin_gueltig("12.5", 40))
        self.assertFalse(p.pin_gueltig(-1, 10))
        self.assertFalse(p.pin_gueltig(10, 100.1))
        self.assertFalse(p.pin_gueltig(None, 1))

    def test_annotation_braucht_rendering_und_pin(self):
        ok, feld = p.feedback_pruefen({"kind": "annotation", "projectId": "PRJ-1", "body": "Hier", "point": {"x": 10, "y": 20}})
        self.assertEqual((ok, feld), (False, "renderingId"))
        ok, feld = p.feedback_pruefen({"kind": "annotation", "projectId": "PRJ-1", "renderingId": "R1", "body": "Hier", "point": {"x": 101, "y": 20}})
        self.assertEqual((ok, feld), (False, "point"))
        ok, _ = p.feedback_pruefen({"kind": "annotation", "projectId": "PRJ-1", "renderingId": "R1", "body": "Hier", "point": {"x": 50, "y": 50}})
        self.assertTrue(ok)

    def test_vote_und_freigabe(self):
        self.assertFalse(p.feedback_pruefen({"kind": "vote", "projectId": "P", "renderingId": "R", "vote": "maybe"})[0])
        self.assertTrue(p.feedback_pruefen({"kind": "vote", "projectId": "P", "renderingId": "R", "vote": "none"})[0])
        self.assertEqual(p.feedback_pruefen({"kind": "freigabe", "projectId": "P", "renderingId": "R"})[1], "confirm")
        self.assertTrue(p.feedback_pruefen({"kind": "freigabe", "projectId": "P", "renderingId": "R", "confirm": True})[0])

    def test_kommentar_laenge_und_pflicht(self):
        self.assertEqual(p.feedback_pruefen({"kind": "kommentar", "projectId": "P", "body": "  "})[1], "body")
        self.assertEqual(p.feedback_pruefen({"kind": "kommentar", "projectId": "P", "body": "x" * 2001})[1], "body")
        self.assertTrue(p.feedback_pruefen({"kind": "kommentar", "projectId": "P", "body": "x" * 2000})[0])

    def test_sprachnachricht(self):
        self.assertEqual(p.feedback_pruefen({"kind": "sprachnachricht", "projectId": "P", "durationSec": 0.1, "consent": "ja"})[1], "durationSec")
        self.assertEqual(p.feedback_pruefen({"kind": "sprachnachricht", "projectId": "P", "durationSec": 12, "consent": "nein"})[1], "consent")
        self.assertTrue(p.feedback_pruefen({"kind": "sprachnachricht", "projectId": "P", "durationSec": 12, "consent": "ja"})[0])

    def test_audio_pruefung_und_signatur(self):
        self.assertEqual(p.audio_pruefen("audio/webm;codecs=opus", 4096), "webm")
        self.assertIsNone(p.audio_pruefen("audio/flac", 4096))
        self.assertIsNone(p.audio_pruefen("audio/webm", 100))
        self.assertIsNone(p.audio_pruefen("audio/webm", p.VOICE_MAX_BYTES + 1))
        self.assertTrue(p.audio_signatur_ok(b"\x1a\x45\xdf\xa3" + b"\0" * 12, "webm"))
        self.assertTrue(p.audio_signatur_ok(b"OggS" + b"\0" * 12, "ogg"))
        self.assertTrue(p.audio_signatur_ok(b"RIFF\0\0\0\0WAVE\0\0\0\0", "wav"))
        self.assertTrue(p.audio_signatur_ok(b"\0\0\0\x18ftypM4A \0\0\0\0", "m4a"))
        self.assertTrue(p.audio_signatur_ok(b"ID3\x04\0\0\0\0\0\0\0\0", "mp3"))
        self.assertFalse(p.audio_signatur_ok(b"GIF89a" + b"\0" * 12, "webm"))


class TestToken(unittest.TestCase):
    def test_token_hash_und_vergleich(self):
        t = p.neuer_token()
        self.assertGreaterEqual(len(t), 32)
        h = p.token_hash(t)
        self.assertEqual(len(h), 64)
        self.assertTrue(p.token_passt(t, h))
        self.assertFalse(p.token_passt(t + "x", h))
        self.assertFalse(p.token_passt("", h))
        self.assertFalse(p.token_passt(t, None))


class TestTagebuchReferenz(unittest.TestCase):
    def test_ids(self):
        self.assertRegex(p.neue_foto_id(), p.FOTO_ID_RE)
        self.assertRegex(p.neue_freigabe_id(), p.FREIGABE_ID_RE)

    def test_upload_regeln(self):
        self.assertEqual(p.tagebuch_upload_erlaubt("skizze", "kunde", False), (False, "nur_team"))
        self.assertEqual(p.tagebuch_upload_erlaubt("skizze", "team", False), (False, "echt"))
        self.assertEqual(p.tagebuch_upload_erlaubt("skizze", "team", True), (True, ""))
        self.assertEqual(p.tagebuch_upload_erlaubt("nachher", "kunde", False), (True, ""))
        self.assertEqual(p.tagebuch_upload_erlaubt("egal", "team", True), (False, "phase"))

    def test_adresse_erkennung(self):
        self.assertTrue(p.ist_adresse("Landstraße 11"))
        self.assertTrue(p.ist_adresse("6911 Lochau"))
        self.assertTrue(p.ist_adresse("Seegasse"))
        self.assertFalse(p.ist_adresse("Lochau"))
        self.assertFalse(p.ist_adresse("am Bodensee"))

    def test_veroeffentlichbar(self):
        ref = {
            "beispiel": 0, "slug": "kueche-lochau-0001", "titel": "Küche mit Blick auf den See", "typologie": "Küche", "zeitraum_von": "2026-03", "zeitraum_bis": "2026-09",
            "ausgangslage": "Alte Küche …", "anzeige_ort": "Lochau", "loesung": [{"raum": "Küche", "text": "…"}], "leistungen": ["planung"],
            "bilder": [{"alt": "Küche", "phase": "nachher"}],
        }
        self.assertEqual(p.referenz_veroeffentlichbar(ref), [])
        kaputt = dict(ref, beispiel=1, slug="Küche Lochau", titel="Landstraße 11", bilder=[{"alt": "", "phase": "skizze"}], loesung=[])
        fehlt = p.referenz_veroeffentlichbar(kaputt)
        for f in ("beispiel", "slug_format", "adresse", "alt", "phase", "loesung"):
            self.assertIn(f, fehlt)

    def test_oeffentlicher_ort(self):
        self.assertEqual(p.oeffentlicher_ort("anonym", "Bregenz"), "am Bodensee")
        self.assertEqual(p.oeffentlicher_ort("vorname_ort", "Bregenz"), "Bregenz")


class TestZeitenUndGarantie(unittest.TestCase):
    def test_dauer_minuten(self):
        self.assertEqual(p.dauer_minuten("08:15:00", "10:45:00"), 150)
        self.assertEqual(p.dauer_minuten("23:30:00", "00:30:00"), 60)
        self.assertIsNone(p.dauer_minuten(None, "10:00:00"))

    def test_betrag(self):
        self.assertEqual(p.betrag_cent(90, 8000), 12000)
        self.assertEqual(p.betrag_cent(0, 8000), 0)

    def test_garantie_bis(self):
        self.assertEqual(p.garantie_bis("2026-01-31", 1), datetime.date(2026, 2, 28))
        self.assertEqual(p.garantie_bis(datetime.date(2026, 11, 4), 24), datetime.date(2028, 11, 4))
        self.assertIsNone(p.garantie_bis(None, 24))

    def test_uebergaenge(self):
        self.assertTrue(p.montage_uebergang_erlaubt("Geplant", "Unterwegs"))
        self.assertTrue(p.montage_uebergang_erlaubt("Erledigt", "Abgenommen"))
        self.assertFalse(p.montage_uebergang_erlaubt("Abgenommen", "Geplant"))
        self.assertTrue(p.gewerk_uebergang_erlaubt("Offen", "Angefragt"))
        self.assertFalse(p.gewerk_uebergang_erlaubt("Offen", "Erledigt"))

    def test_maskiere_email(self):
        self.assertEqual(p.maskiere_email("anna@example.com"), "a…@example.com")
        self.assertEqual(p.maskiere_email("x"), "")


class TestTexte(unittest.TestCase):
    def test_alle_schluessel_in_allen_sprachen(self):
        for key, werte in TEXTE.items():
            for s in SPRACHEN:
                self.assertTrue(werte.get(s), f"{key}/{s} fehlt")

    def test_rueckfall(self):
        self.assertEqual(montage_text("xx", "montagebericht"), "Montagebericht")
        self.assertEqual(montage_text("fr", "montagebericht"), "Rapport de montage")
        self.assertEqual(montage_text("it", "unbekannt"), "unbekannt")


if __name__ == "__main__":
    unittest.main()
