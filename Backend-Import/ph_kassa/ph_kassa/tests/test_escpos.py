import unittest

from ph_kassa.druck.bon import bon_bytes, bon_text, bon_zeilen
from ph_kassa.druck.escpos import EscPos, links_rechts_text, umbrechen

FIRMA = {"firmenname": "MW Immobilienverwaltungs GmbH", "kurzname": "Platzhirsch Home Living", "strasse": "Landstraße 11", "plz": "6911", "ort": "Lochau", "uid": "ATU12345678", "website": "https://platzhirsch.studio"}
QR = "_R1-AT1_KASSA-1_42_2026-11-04T10:15:00_1272,00_22,00_0,00_100,00_0,00_dGVzdA==_3f2a1b_MOCKSIG_U0lHTkFUVVI="
BELEG = {
    "belegnummer": 42,
    "kassen_id": "KASSA-1",
    "datum_uhrzeit": "2026-11-04 10:15:00",
    "belegart": "Standard",
    "positionen": [
        {"art": "Artikel", "bezeichnung": "Sofa Lawrence Stoff Leinen", "menge": 1, "einzel_brutto_cent": 120000, "brutto_cent": 120000, "netto_cent": 100000, "ust_cent": 20000, "steuersatz": "Normal 20"},
        {"art": "Artikel", "bezeichnung": "Kissen", "menge": 3, "einzel_brutto_cent": 2400, "brutto_cent": 7200, "netto_cent": 6000, "ust_cent": 1200, "steuersatz": "Normal 20"},
        {"art": "Freitext", "bezeichnung": "Buch Wohnen am See", "menge": 1, "einzel_brutto_cent": 2200, "brutto_cent": 2200, "netto_cent": 2000, "ust_cent": 200, "steuersatz": "Ermaessigt-1 10"},
        {"art": "Gutschein Verkauf", "bezeichnung": "Wertgutschein", "menge": 1, "einzel_brutto_cent": 10000, "brutto_cent": 10000, "netto_cent": 10000, "ust_cent": 0, "steuersatz": "Null 0"},
    ],
    "gesamt_cent": 139400,
    "zahlarten": [{"zahlart": "Bar", "betrag_cent": 139400, "gegeben_cent": 140000, "retour_cent": 600}],
    "maschinenlesbarer_code": QR,
    "bediener_name": "Anna Muster",
}


class TestEscPos(unittest.TestCase):
    def test_qr_befehl(self):
        p = EscPos(42).init().qr("HALLO", modulgroesse=5, fehlerkorrektur="M")
        b = p.bytes()
        self.assertTrue(b.startswith(b"\x1b@"))
        self.assertIn(b"\x1d(k\x04\x001A", b, "QR-Modell")
        self.assertIn(b"\x1d(k\x03\x001C\x05", b, "Modulgröße 5")
        self.assertIn(b"\x1d(k\x03\x001E1", b, "Fehlerkorrektur M")
        n = len(b"HALLO") + 3
        self.assertIn(b"\x1d(k" + bytes([n, 0]) + b"1P0HALLO", b, "Daten speichern")
        self.assertIn(b"\x1d(k\x03\x001Q0", b, "QR drucken")

    def test_bon_bytes_pflichtangaben_und_qr(self):
        b = bon_bytes(BELEG, FIRMA, {"bon_breite_zeichen": 42})
        self.assertIn(b"PLATZHIRSCH", b)
        self.assertIn(b"MW Immobilienverwaltungs GmbH", b)
        self.assertIn(b"ATU12345678", b)
        self.assertIn(b"KASSA-1", b)
        self.assertIn(b"42", b)
        self.assertIn(b"04.11.2026 10:15", b)
        self.assertIn(b"Sofa Lawrence", b)
        self.assertIn(b"3 x 24,00", b)
        self.assertIn(QR.encode(), b, "QR-Inhalt = Payload + Signatur")
        self.assertIn(b"\x1d(k\x03\x001Q0", b, "QR-Druckbefehl enthalten")
        self.assertIn(b"\x1dV\x42\x00", b, "Teilschnitt")
        self.assertIn("€".encode("cp858"), b, "Euro in cp858")
        self.assertNotIn(b"\x1bp\x00", b, "Schublade nur auf Wunsch")
        self.assertIn(b"\x1bp\x00", bon_bytes(BELEG, FIRMA, {}, schublade=True))

    def test_bon_text_vorschau(self):
        t = bon_text(BELEG, FIRMA, {"bon_breite_zeichen": 42})
        zeilen = t.splitlines()
        self.assertTrue(all(len(z) <= 42 for z in zeilen if not z.startswith("_R1")), "Zeilen passen auf 42 Zeichen")
        self.assertIn("SUMME", t)
        self.assertIn("1.394,00 €", t)
        self.assertIn("Rückgeld", t)
        self.assertIn("6,00 €", t)
        self.assertIn("A 20 %", t)
        self.assertIn("B 10 %", t)
        self.assertIn("D 0 %", t)
        self.assertIn("[QR-Code]", t)

    def test_training_und_storno_kennzeichen(self):
        arten = [z[0] for z in bon_zeilen({**BELEG, "trainings": 1}, FIRMA)]
        self.assertIn("hinweis", arten)
        t = bon_text({**BELEG, "belegart": "Stornobeleg", "storno_von": "KB-1"}, FIRMA)
        self.assertIn("STORNO", t)
        self.assertIn("STORNOBELEG", t)
        t2 = bon_text({**BELEG, "maschinenlesbarer_code": None}, FIRMA)
        self.assertIn("ohne Signatur", t2)
        t3 = bon_text({**BELEG, "see_ausgefallen": 1}, FIRMA)
        self.assertIn("Sicherheitseinrichtung ausgefallen", t3)

    def test_textfunktionen(self):
        self.assertEqual(len(links_rechts_text("Sofa", "1,00 €", 20)), 20)
        self.assertEqual(links_rechts_text("x" * 50, "9,99", 20)[-4:], "9,99")
        self.assertEqual(umbrechen("ein zwei drei vier", 9), ["ein zwei", "drei vier"])


if __name__ == "__main__":
    unittest.main()
