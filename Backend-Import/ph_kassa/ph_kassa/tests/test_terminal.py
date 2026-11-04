import unittest

from ph_kassa.terminal import SCHLUESSEL_LIVEMODE, SCHLUESSEL_SECRET, SCHLUESSEL_STANDORT, TerminalFehler, TerminalMock, dienst


class TestTerminalMock(unittest.TestCase):
    def setUp(self):
        self.t = TerminalMock(["tmr_test_1"])

    def test_ablauf_erfolgreich(self):
        st = self.t.zahlung_starten("tmr_test_1", 4990, "Kassa", {"kasse": "K1"})
        self.assertEqual(st["status"], "processing")
        self.assertFalse(st["fertig"])
        self.assertTrue(st["payment_intent"].startswith("pi_"))
        self.assertEqual(self.t.reader_status("tmr_test_1")["action"]["status"], "in_progress")
        with self.assertRaises(TerminalFehler) as cm:
            self.t.zahlung_starten("tmr_test_1", 100)
        self.assertEqual(cm.exception.code, "reader_busy")
        st2 = self.t.simuliere_zahlung("tmr_test_1")
        self.assertEqual(st2["status"], "succeeded")
        self.assertTrue(st2["bezahlt"] and st2["fertig"])
        self.assertEqual(st2["betrag_cent"], 4990)
        self.assertTrue(st2["charge"].startswith("ch_"))
        with self.assertRaises(TerminalFehler) as cm2:
            self.t.abbrechen(st["payment_intent"])
        self.assertEqual(cm2.exception.code, "conflict")

    def test_abbruch(self):
        st = self.t.zahlung_starten("tmr_test_1", 1000)
        st2 = self.t.abbrechen(st["payment_intent"])
        self.assertEqual(st2["status"], "canceled")
        self.assertTrue(st2["fertig"] and not st2["bezahlt"])
        # Reader wieder frei
        self.assertEqual(self.t.zahlung_starten("tmr_test_1", 1000)["status"], "processing")

    def test_abgelehnt(self):
        self.t.zahlung_starten("tmr_test_1", 1000)
        st = self.t.simuliere_zahlung("tmr_test_1", erfolgreich=False)
        self.assertEqual(st["status"], "failed")

    def test_fehler(self):
        with self.assertRaises(TerminalFehler):
            self.t.zahlung_starten("tmr_test_1", 0)
        with self.assertRaises(TerminalFehler):
            self.t.zahlung_starten("tmr_nix", 100)
        with self.assertRaises(TerminalFehler):
            self.t.status("pi_nix")
        self.t.reader_offline_setzen("tmr_test_1")
        with self.assertRaises(TerminalFehler) as cm:
            self.t.zahlung_starten("tmr_test_1", 100)
        self.assertEqual(cm.exception.code, "reader_offline")

    def test_dienst_ohne_frappe_ist_mock(self):
        d = dienst()
        self.assertIsInstance(d, TerminalMock)
        self.assertIsInstance(dienst(erzwinge_mock=True), TerminalMock)

    def test_nur_schluesselnamen(self):
        for name in (SCHLUESSEL_SECRET, SCHLUESSEL_LIVEMODE, SCHLUESSEL_STANDORT):
            self.assertTrue(name.startswith("ph_stripe_"))


if __name__ == "__main__":
    unittest.main()
