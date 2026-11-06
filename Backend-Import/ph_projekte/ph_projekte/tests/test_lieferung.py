import unittest
from datetime import date

from ph_projekte.utils import lieferung as l


class TestLieferung(unittest.TestCase):
    def test_lieferstatus(self):
        self.assertEqual(l.lieferstatus(2), "offen")
        self.assertEqual(l.lieferstatus(2, bestellt=2), "bestellt")
        self.assertEqual(l.lieferstatus(2, bestellt=2, bestaetigt=True), "bestaetigt")
        self.assertEqual(l.lieferstatus(2, 2, 1), "teilgeliefert")
        self.assertEqual(l.lieferstatus(2, 2, 2), "geliefert")
        self.assertEqual(l.lieferstatus(2, 2, 2, 2), "montiert")
        self.assertEqual(l.lieferstatus(2, storniert=True), "storniert")
        self.assertEqual(l.offene_menge(3, 1), 2)

    def test_bestellbar_und_zeile(self):
        p = {"name": "z1", "bezeichnung": "Sofa", "menge": 1, "lieferstatus": "offen", "preis_cent": 500000, "raum": "Wohnen"}
        self.assertTrue(l.bestellbar(p))
        self.assertFalse(l.bestellbar({**p, "herstellerbestellung": "HB-1", "lieferstatus": "bestellt"}))
        self.assertTrue(l.bestellbar({**p, "herstellerbestellung": "HB-1", "lieferstatus": "teilgeliefert", "nachlieferung_noetig": 1}))
        z = l.bestellzeile({**p, "nachlieferung_menge": 1, "nachlieferung_termin": "2026-12-01"}, kommission="PH-PRJ-1", nachlieferung=True)
        self.assertEqual((z["bezug_zeile"], z["menge"], z["kommission"], z["wunschtermin"]), ("z1", 1, "PH-PRJ-1", "2026-12-01"))
        self.assertTrue(z["bezeichnung"].startswith("Nachlieferung"))

    def test_abgleich(self):
        proj = [{"name": "z1", "menge": 2, "lieferstatus": "offen", "status": "geplant", "menge_geliefert": 0}, {"name": "z2", "menge": 1}]
        hb = [{"bezug_zeile": "z1", "menge": 2, "menge_erhalten": 1, "bestaetigter_termin": "2026-12-10"}, {"bezug_zeile": "fremd", "menge": 1}]
        a = l.abgleich_herstellerbestellung(proj, "HB-1", "Teilgeliefert", hb)
        self.assertEqual(set(a), {"z1"})
        self.assertEqual(a["z1"]["lieferstatus"], "teilgeliefert")
        self.assertEqual(a["z1"]["menge_geliefert"], 1)
        self.assertEqual(a["z1"]["liefertermin"], date(2026, 12, 10))
        self.assertEqual(a["z1"]["status"], "bestellt")
        proj2 = [{**proj[0], **a["z1"]}]
        self.assertEqual(l.abgleich_herstellerbestellung(proj2, "HB-1", "Teilgeliefert", hb), {})

    def test_abgleich_entwurf_storno(self):
        proj = [{"name": "z1", "menge": 1, "lieferstatus": "offen"}]
        a = l.abgleich_herstellerbestellung(proj, "HB-2", "Entwurf", [{"bezug_zeile": "z1", "menge": 1}])
        self.assertEqual(a["z1"], {"herstellerbestellung": "HB-2", "menge_bestellt": 0})
        s = l.abgleich_herstellerbestellung(proj, "HB-2", "Storniert", [{"bezug_zeile": "z1", "menge": 1}])
        self.assertEqual(s["z1"]["lieferstatus"], "storniert")

    def test_schaeden(self):
        hb = [{"idx": 1, "bezug_zeile": "z1"}, {"idx": 2, "bezug_zeile": "z2"}]
        we = [{"position": 1, "zustand": "Transportschaden", "menge_erhalten": 1, "hinweis": "Ecke"}, {"position": 2, "zustand": "fehlt", "menge_erwartet": 3, "menge_erhalten": 1}, {"position": 2, "zustand": "ok"}]
        s = l.schaeden_aus_wareneingang(we, hb)
        self.assertEqual(s["z1"], {"menge": 1, "grund": "Transportschaden: Ecke"})
        self.assertEqual(s["z2"]["menge"], 2)

    def test_termine_und_text(self):
        self.assertEqual(l.spaetester_termin([{"liefertermin": "2026-12-01"}, {"liefertermin": "2026-12-20", "lieferstatus": "storniert"}, {"liefertermin": None}]), date(2026, 12, 1))
        self.assertEqual(l.offene_terminaenderungen([{"projekt_informiert": 1}, {"projekt_informiert": 0}]), [{"projekt_informiert": 0}])
        t = l.kundentext_liefertermin("Küche Muster", [{"bezeichnung": "Fronten", "termin_alt": "2026-12-01", "termin_neu": "2026-12-15"}])
        self.assertIn("01.12.2026 → 15.12.2026", t)
        self.assertIn("Küche Muster", t)
        self.assertEqual(l.verschiebung_tage("2026-12-01", "2026-12-15"), 14)


if __name__ == "__main__":
    unittest.main()
