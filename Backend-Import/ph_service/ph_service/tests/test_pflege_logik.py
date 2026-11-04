"""Tests ohne Site: python -m unittest ph_service.tests.test_pflege_logik (übernommen aus platzhirsch-frappe-service, erweitert)."""

import unittest
from datetime import date

from ph_service.ph_service import pflege_logik as logik


class TestPflegeLogik(unittest.TestCase):
    def test_naechster_termin_monatsende(self):
        self.assertEqual(logik.naechster_termin_nach(date(2026, 1, 31), 1), date(2026, 2, 28))
        self.assertEqual(logik.naechster_termin_nach(date(2026, 10, 29), 12), date(2027, 10, 29))
        self.assertEqual(logik.naechster_termin_nach(date(2026, 10, 29), 0), date(2027, 10, 29))  # 0 → Standard 12

    def test_erinnerung_fenster_und_einmalig(self):
        t = date(2027, 3, 1)
        self.assertFalse(logik.erinnerung_faellig(date(2027, 1, 1), t, 42, None))
        self.assertTrue(logik.erinnerung_faellig(date(2027, 1, 20), t, 42, None))
        self.assertFalse(logik.erinnerung_faellig(date(2027, 1, 21), t, 42, date(2027, 1, 20)))
        self.assertFalse(logik.erinnerung_faellig(date(2027, 3, 2), t, 42, None))
        self.assertFalse(logik.erinnerung_faellig(date(2027, 3, 2), None, 42, None))

    def test_ueberfaellig_mit_karenz(self):
        self.assertFalse(logik.ueberfaellig(date(2027, 3, 10), date(2027, 3, 1), 14))
        self.assertTrue(logik.ueberfaellig(date(2027, 3, 16), date(2027, 3, 1), 14))
        self.assertFalse(logik.ueberfaellig(date(2027, 3, 16), None, 14))

    def test_nachkauf_nur_mit_einwilligung(self):
        p = date(2026, 11, 1)
        self.assertFalse(logik.nachkauf_faellig(date(2026, 11, 20), p, "Lederpflege", False, False, None))
        self.assertFalse(logik.nachkauf_faellig(date(2026, 11, 20), p, "Lederpflege", True, True, None))
        self.assertFalse(logik.nachkauf_faellig(date(2026, 11, 5), p, "Lederpflege", True, False, None))
        self.assertTrue(logik.nachkauf_faellig(date(2026, 11, 20), p, "Lederpflege", True, False, None))
        self.assertFalse(logik.nachkauf_faellig(date(2026, 11, 21), p, "Lederpflege", True, False, date(2026, 11, 20)))
        self.assertFalse(logik.nachkauf_faellig(date(2026, 11, 20), p, "  ", True, False, None))

    def test_schluessel_und_intervalle(self):
        self.assertEqual(logik.schluessel("PFL-2026-00001", "termin", date(2027, 3, 1)), "pflege_abo:PFL-2026-00001:termin:2027-03-01")
        termine = logik.wartungen_im_zeitraum(date(2026, 4, 1), date(2027, 4, 1), 6)
        self.assertEqual(termine, [date(2026, 4, 1), date(2026, 10, 1), date(2027, 4, 1)])
        self.assertEqual(logik.standard_intervall("Pool-Technik"), 6)
        self.assertEqual(logik.standard_intervall("Whirlpool"), 12)
        self.assertEqual(logik.standard_intervall("Unbekannt"), 12)


if __name__ == "__main__":
    unittest.main()
