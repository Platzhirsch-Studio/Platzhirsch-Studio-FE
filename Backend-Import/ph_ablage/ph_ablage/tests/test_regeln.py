"""Reine Regeln: Schlüssel-Schema, Endungsfilter, Dateinamen, Rechte-Modus, Aufbewahrung, Ordnervorlagen, Tags."""

import unittest
from datetime import date, datetime

from ph_ablage.utils import regeln as r

SHA = "ab12cd34" + "0" * 56


class TestSchluessel(unittest.TestCase):
    def test_schema(self):
        self.assertEqual(r.schluessel(2026, "PH-DAT-2026-000001", 3, SHA, "DWG"), "2026/PH-DAT-2026-000001/3-ab12cd34.dwg")

    def test_ohne_endung_bin(self):
        self.assertEqual(r.schluessel(2026, "PH-DAT-2026-000001", 1, SHA, ""), "2026/PH-DAT-2026-000001/1-ab12cd34.bin")
        self.assertEqual(r.schluessel(2026, "X1", 1, SHA, "tar.gz"), "2026/X1/1-ab12cd34.bin")

    def test_ungueltig(self):
        for args in ((1999, "X", 1, SHA, "pdf"), (2026, "../x", 1, SHA, "pdf"), (2026, "a/b", 1, SHA, "pdf"), (2026, "X", 0, SHA, "pdf"), (2026, "X", 1, "zz", "pdf")):
            with self.assertRaises(ValueError, msg=args):
                r.schluessel(*args)

    def test_zerlegen_und_vorschau(self):
        s = r.schluessel(2026, "PH-DAT-2026-000001", 2, SHA, "pdf")
        self.assertEqual(r.schluessel_zerlegen(s)["version"], 2)
        v = r.vorschau_schluessel(s, "png")
        self.assertEqual(v, "vorschau/2026/PH-DAT-2026-000001/2-ab12cd34.png")
        self.assertTrue(r.schluessel_zerlegen(v)["vorschau"])
        self.assertIsNone(r.schluessel_zerlegen("2026/../x"))
        with self.assertRaises(ValueError):
            r.vorschau_schluessel(v, "png")

    def test_dateiname_nicht_im_schluessel(self):
        # Umbenennen ändert nur die Datenbank: der Schlüssel enthält keinen Dateinamen
        s = r.schluessel(2026, "PH-DAT-2026-000009", 1, SHA, r.endung("Küche Müller Angebot.pdf"))
        self.assertNotIn("Müller", s)

    def test_praefix_trennen(self):
        self.assertEqual(r.praefix_trennen("platzhirsch/2026/X1/2-ab12cd34.pdf"), ("platzhirsch", "2026/X1/2-ab12cd34.pdf"))
        self.assertEqual(r.praefix_trennen("2026/X1/2-ab12cd34.pdf"), ("", "2026/X1/2-ab12cd34.pdf"))
        self.assertEqual(r.praefix_trennen("a1b2c3d4e5"), (None, None))  # Frappe-File-Name (Bestand)

    def test_praefix(self):
        self.assertEqual(r.mit_praefix("platzhirsch/", "2026/X/1-ab12cd34.pdf"), "platzhirsch/2026/X/1-ab12cd34.pdf")
        self.assertEqual(r.mit_praefix("", "a"), "a")
        with self.assertRaises(ValueError):
            r.mit_praefix("../x", "a")


class TestDateinamen(unittest.TestCase):
    def test_endung(self):
        self.assertEqual(r.endung("Plan.final.DWG"), "dwg")
        self.assertEqual(r.endung("README"), "")
        self.assertEqual(r.endung(".bashrc"), "")
        self.assertEqual(r.endung("C:\\x\\a.PDF"), "pdf")

    def test_bereinigen(self):
        self.assertEqual(r.dateiname_bereinigen("../../etc/pass:wd?.txt"), "pass_wd_.txt")
        self.assertEqual(r.dateiname_bereinigen("  Angebot   Müller .pdf "), "Angebot Müller .pdf")
        self.assertEqual(r.dateiname_bereinigen("CON.txt"), "_CON.txt")
        lang = r.dateiname_bereinigen("a" * 300 + ".xlsx")
        self.assertTrue(lang.endswith(".xlsx"))
        self.assertLessEqual(len(lang), r.MAX_DATEINAME)
        with self.assertRaises(ValueError):
            r.dateiname_bereinigen(" / ")

    def test_endungsfilter(self):
        self.assertEqual(r.endung_erlaubt("exe"), (False, "gesperrt"))
        self.assertEqual(r.endung_erlaubt("dwg"), (True, None))
        self.assertEqual(r.endung_erlaubt("pdf", erlaubt={"dwg"}), (False, "nicht_erlaubt"))
        self.assertEqual(r.endung_erlaubt("exe", erlaubt={"exe"}, gesperrt=set()), (True, None))
        self.assertEqual(r.endungen_liste("pdf, .DOCX\n dwg;;x y"), {"pdf", "docx", "dwg", "x", "y"})

    def test_mime_und_vorschau(self):
        self.assertEqual(r.mime_fuer("a.dwg"), "application/acad")
        self.assertEqual(r.mime_fuer("a.docx"), r.MIME_EXTRA["docx"])
        self.assertEqual(r.mime_fuer("a", "text/plain; charset=utf-8"), "text/plain")
        self.assertEqual(r.mime_fuer("a", "<script>"), "application/octet-stream")
        self.assertEqual(r.vorschau_art("JPG"), "bild")
        self.assertEqual(r.vorschau_art("skp"), "cad")
        self.assertEqual(r.vorschau_art("xlsx"), "office")
        self.assertEqual(r.vorschau_art("zip"), "keine")

    def test_groesse_text(self):
        self.assertEqual(r.groesse_text(512), "512 B")
        self.assertEqual(r.groesse_text(1536), "1,5 KB")
        self.assertEqual(r.groesse_text(5 * 1024 ** 3), "5,0 GB")


class TestRechte(unittest.TestCase):
    def test_strengster_modus(self):
        self.assertEqual(r.effektiver_modus(["intern", "", "team"]), "team")
        self.assertEqual(r.effektiver_modus(["leitung", "intern"]), "leitung")
        self.assertEqual(r.effektiver_modus([None, "unsinn"]), "intern")

    def test_lockerer(self):
        self.assertTrue(r.lockerer("leitung", "team"))
        self.assertTrue(r.lockerer("team", ""))
        self.assertFalse(r.lockerer("intern", "leitung"))
        self.assertFalse(r.lockerer("", "intern"))

    def test_darf(self):
        self.assertTrue(r.darf_zugreifen("intern", False, False))
        self.assertFalse(r.darf_zugreifen("intern", False, False, bezug_lesbar=False))
        self.assertTrue(r.darf_zugreifen("team", False, True))
        self.assertFalse(r.darf_zugreifen("team", False, False))
        self.assertFalse(r.darf_zugreifen("leitung", False, True))
        self.assertTrue(r.darf_zugreifen("leitung", True, False))

    def test_personal_nur_leitung(self):
        self.assertFalse(r.darf_zugreifen("intern", False, True, bezug_doctype="PH Mitarbeiter"))
        self.assertFalse(r.ist_leitung({"PH Ablage Leitung", "PH Backoffice-Admin"}, "PH Mitarbeiter"))
        self.assertTrue(r.ist_leitung({"PH Personal Leitung"}, "PH Mitarbeiter"))
        self.assertTrue(r.ist_leitung({"PH Ablage Leitung"}, "PH Projekt"))
        self.assertTrue(r.ist_leitung({"PH Projekte Leitung"}, "PH Projekt"))
        self.assertFalse(r.ist_leitung({"PH Projekte Leitung"}, "PH Kontakt"))
        self.assertTrue(r.ist_leitung(set(), "PH Mitarbeiter", benutzer="Administrator"))

    def test_team(self):
        self.assertEqual(r.team_aus_werten({"berater": "a@x", "planer": None}, {"team": ["b@x", "", "Guest"]}), {"a@x", "b@x"})


class TestAufbewahrung(unittest.TestCase):
    def test_beleg_bao(self):
        self.assertEqual(r.aufbewahren_bis("Beleg", date(2026, 3, 1)), date(2033, 12, 31))
        self.assertEqual(r.aufbewahren_bis("Beleg", "2026-12-31"), date(2033, 12, 31))
        self.assertIsNone(r.aufbewahren_bis("Allgemein", date(2026, 3, 1)))
        self.assertIsNone(r.aufbewahren_bis("Beleg", None))

    def test_loeschsperre(self):
        bis = date(2033, 12, 31)
        self.assertEqual(r.loeschen_erlaubt("Beleg", bis, date(2033, 12, 31), ist_leitung_=True), (False, "aufbewahrung"))
        self.assertEqual(r.loeschen_erlaubt("Beleg", bis, date(2034, 1, 1), ist_leitung_=True), (True, None))
        self.assertEqual(r.loeschen_erlaubt("Beleg", bis, date(2034, 1, 1)), (False, "nur_leitung"))
        self.assertEqual(r.loeschen_erlaubt("Personal", None, date(2026, 1, 1)), (False, "nur_leitung"))
        self.assertEqual(r.loeschen_erlaubt("Marketing", None, date(2026, 1, 1)), (True, None))
        self.assertEqual(r.loeschen_erlaubt(None, None, datetime(2026, 1, 1)), (True, None))

    def test_papierkorb(self):
        self.assertEqual(r.papierkorb_bis(datetime(2026, 11, 4, 10), 30), date(2026, 12, 4))
        self.assertFalse(r.papierkorb_faellig(datetime(2026, 11, 4), 30, date(2026, 12, 3)))
        self.assertTrue(r.papierkorb_faellig(datetime(2026, 11, 4), 30, date(2026, 12, 4)))
        self.assertFalse(r.papierkorb_faellig(None, 30, date(2026, 12, 4)))


class TestOrdnervorlagen(unittest.TestCase):
    def test_projekt_vorlage(self):
        plan = r.ordner_plan(r.STANDARD_VORLAGEN["PH Projekt"])
        titel = [p["titel"] for p in plan]
        self.assertEqual(titel[0], "01 Aufmaß")
        self.assertEqual(titel[-1], "08 Service")
        self.assertEqual(len(plan), 8)
        self.assertEqual([p for p in plan if p["titel"] == "04 Angebote & Verträge"][0]["aufbewahrung"], "Beleg")

    def test_zwischenordner_und_idempotenz(self):
        zeilen = [{"pfad": "07 Fotos > Baustelle", "modus": "team"}, {"pfad": "07 Fotos > Vorher", "reihenfolge": 1}]
        plan = r.ordner_plan(zeilen)
        self.assertEqual([p["pfad"] for p in plan], [("07 Fotos",), ("07 Fotos", "Baustelle"), ("07 Fotos", "Vorher")])
        self.assertEqual(plan[0]["modus"], "")
        self.assertEqual(plan[1]["modus"], "team")
        self.assertEqual(plan[1]["eltern"], ("07 Fotos",))
        nochmal = r.ordner_plan(zeilen, vorhandene=[p["pfad"] for p in plan])
        self.assertEqual(nochmal, [])

    def test_personal_modus_leitung(self):
        self.assertTrue(all(p["modus"] == "leitung" for p in r.ordner_plan(r.STANDARD_VORLAGEN["PH Mitarbeiter"])))

    def test_ungueltige_zeilen_ignoriert(self):
        self.assertEqual(r.ordner_plan([{"pfad": " > "}, {"pfad": ""}]), [])


class TestTagsSucheToken(unittest.TestCase):
    def test_tags(self):
        self.assertEqual(r.tags_normalisieren("Küche, küche, #Plan ;  Final  Version"), ["Küche", "Plan", "Final Version"])
        self.assertEqual(len(r.tags_normalisieren([str(i) for i in range(50)])), r.MAX_TAGS)
        self.assertEqual(r.tags_text(["a", "b"]), "a, b")

    def test_suche_und_sortierung(self):
        self.assertEqual(r.suchbegriffe("  a Küche   Plan "), ["Küche", "Plan"])
        self.assertEqual(r.sortierung("-groesse"), "groesse desc")
        self.assertEqual(r.sortierung("; drop table"), "dateiname asc")
        self.assertEqual(r.seite_und_groesse("x", 9999), (1, 200, 0))
        self.assertEqual(r.seite_und_groesse(3, 20), (3, 20, 40))

    def test_passwort(self):
        h = r.passwort_hash("geheim", iterationen=1000)
        self.assertTrue(h.startswith("pbkdf2_sha256$1000$"))
        self.assertTrue(r.passwort_passt("geheim", h))
        self.assertFalse(r.passwort_passt("falsch", h))
        self.assertFalse(r.passwort_passt("geheim", "kaputt"))

    def test_freigabe_zustand(self):
        jetzt = datetime(2026, 11, 4, 12)
        self.assertEqual(r.freigabe_zustand("Aktiv", datetime(2026, 11, 5), jetzt), "ok")
        self.assertEqual(r.freigabe_zustand("Aktiv", datetime(2026, 11, 4, 12), jetzt), "abgelaufen")
        self.assertEqual(r.freigabe_zustand("Widerrufen", None, jetzt), "widerrufen")
        self.assertEqual(r.freigabe_zustand("Aktiv", None, jetzt, 5, 5), "aufgebraucht")

    def test_chunk(self):
        self.assertEqual(r.chunk_pruefen(0, 10, 0, 100, 50), (True, None))
        self.assertEqual(r.chunk_pruefen(10, 10, 0, 100, 50), (False, "offset"))
        self.assertEqual(r.chunk_pruefen(95, 10, 95, 100, 50), (False, "ueber_groesse"))
        self.assertEqual(r.chunk_pruefen(0, 60, 0, 100, 50), (False, "zu_gross"))
        self.assertEqual(r.chunk_pruefen(0, 0, 0, 100, 50), (False, "leer"))

    def test_sha(self):
        self.assertTrue(r.sha256_hex_gueltig(SHA))
        self.assertFalse(r.sha256_hex_gueltig("xyz"))
        self.assertEqual(len(r.sha256_b64(SHA)), 44)


if __name__ == "__main__":
    unittest.main()
