"""Tests ohne Site: Rechtsgrundlagen-Regeln (Spiegel von rechtsgrundlagen.js pruefeReise) und Newsletter-Blöcke."""

import unittest
from datetime import date

from ph_marketing.utils import regeln


def reise(**k):
    base = {"reise_id": "test", "werbung": 0, "grundlage_v": 1, "grundlage_b": 0, "grundlage_e": 0, "zweck": "", "aehnliche_produkte": "", "trigger": [1]}
    base.update(k)
    return base


class TestRegeln(unittest.TestCase):
    def test_service_reise_ok(self):
        self.assertEqual(regeln.pruefe_reise(reise(), "<p>Danke</p>"), [])

    def test_werbung_ohne_grundlage(self):
        f = regeln.pruefe_reise(reise(werbung=1, grundlage_v=0), "")
        self.assertIn("keine Rechtsgrundlage", f)

    def test_werbung_auf_v_verboten(self):
        f = regeln.pruefe_reise(reise(werbung=1), "")
        self.assertTrue(any("Vertrag/Service" in x for x in f))

    def test_b_ohne_begruendung(self):
        f = regeln.pruefe_reise(reise(werbung=1, grundlage_v=0, grundlage_b=1), "{{ abmelde_url }}")
        self.assertTrue(any("ähnliche Produkte" in x for x in f))

    def test_e_ohne_zweck(self):
        f = regeln.pruefe_reise(reise(werbung=1, grundlage_v=0, grundlage_e=1), "{{ abmelde_url }}")
        self.assertIn("E ohne gültigen Zweck", f)

    def test_werbung_ohne_abmeldelink(self):
        f = regeln.pruefe_reise(reise(werbung=1, grundlage_v=0, grundlage_e=1, zweck="newsletter"), "<p>ohne link</p>")
        self.assertTrue(any("Abmeldelink" in x for x in f))

    def test_service_mit_werbewort(self):
        f = regeln.pruefe_reise(reise(), "<p>Wir haben ein Angebot</p>")
        self.assertTrue(any("Werbewörter" in x for x in f))

    def test_bewertung_nur_e(self):
        f = regeln.pruefe_reise(reise(reise_id="bewertung", werbung=1, grundlage_v=0, grundlage_b=1, grundlage_e=1, zweck="rueckmeldung", aehnliche_produkte="x"), "{{ abmelde_url }}")
        self.assertTrue(any("Kanzlei" in x for x in f))
        f2 = regeln.pruefe_reise(reise(reise_id="bewertung", werbung=1, grundlage_v=0, grundlage_e=1, zweck="rueckmeldung"), "{{ abmelde_url }} Gutschein")
        self.assertTrue(any("Anreiz" in x for x in f2))

    def test_versandfenster(self):
        self.assertTrue(regeln.werbung_heute_erlaubt(date(2026, 11, 5)))  # Donnerstag
        self.assertFalse(regeln.werbung_heute_erlaubt(date(2026, 11, 6)))  # Freitag
        self.assertFalse(regeln.werbung_heute_erlaubt(date(2026, 12, 24)))  # Sperrtag (Donnerstag)
        self.assertTrue(regeln.sperrtag(date(2027, 1, 1)))
        self.assertEqual(regeln.liste_aus_text(" 2, 3 ,4 "), ["2", "3", "4"])
        self.assertEqual(regeln.liste_aus_text("", ("x",)), ["x"])


class TestNewsletterBloecke(unittest.TestCase):
    def bloecke(self, mit_slot=True):
        b = [
            {"typ": "brief", "titel": "Brief", "text": "Hallo"},
            {"typ": "neueStuecke", "titel": "Neu", "text": "Sofa" if mit_slot else "", "bild": "/files/sofa.jpg" if mit_slot else "", "bild_alt": "Sofa", "bildquelle": "eigen"},
            {"typ": "skizze", "titel": "Skizze", "text": "", "bild": "", "bildquelle": ""},
            {"typ": "termine", "titel": "Termine", "event": "adventsabend-2026"},
            {"typ": "gutZuWissen", "titel": "Tipp", "text": "Outdoor"},
        ]
        return b

    def test_sichtbar_und_versandbereit(self):
        b = self.bloecke()
        self.assertTrue(regeln.block_sichtbar(b[0]))
        self.assertTrue(regeln.block_sichtbar(b[1]))
        self.assertFalse(regeln.block_sichtbar(b[2]))
        self.assertTrue(regeln.versandbereit(b))
        self.assertEqual(regeln.offene_slots(b), ["skizze"])
        self.assertEqual(regeln.inhalt_zeile(b), "In diesem Brief: neue Stücke in der Ausstellung, Termine und ein Tipp.")
        self.assertTrue(regeln.preheader(b).startswith("Neue Stücke"))

    def test_herstellerbild_im_slot_nicht_sichtbar(self):
        b = {"typ": "neueStuecke", "text": "x", "bild": "/files/a.jpg", "bild_alt": "a", "bildquelle": "Hersteller freigegeben"}
        self.assertFalse(regeln.block_sichtbar(b))

    def test_ohne_slot_nicht_versandbereit(self):
        self.assertFalse(regeln.versandbereit(self.bloecke(mit_slot=False)))


if __name__ == "__main__":
    unittest.main()
