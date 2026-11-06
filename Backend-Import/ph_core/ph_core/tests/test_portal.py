"""Tests ohne Site: Zustand einer PH Portal Sitzung (ph_core/utils/portal.py).

cd Backend-Import/ph_core && PYTHONPATH=. python -I -m unittest discover -s ph_core/tests -t .
"""

import unittest
from datetime import datetime, timedelta

from ph_core.utils.portal import sitzung_zustand

JETZT = datetime(2026, 11, 4, 12, 0)


class TestSitzung(unittest.TestCase):
    def s(self, **kw):
        return {"kontakt": "PH-KON-00001", "status": "Aktiv", "ablauf_am": JETZT + timedelta(days=3), **kw}

    def test_aktiv_und_angefordert_gueltig(self):
        self.assertEqual(sitzung_zustand(self.s(), "PH-KON-00001", JETZT), "ok")
        self.assertEqual(sitzung_zustand(self.s(status="Angefordert"), "PH-KON-00001", JETZT), "ok")
        self.assertEqual(sitzung_zustand(self.s(ablauf_am=None), "PH-KON-00001", JETZT), "ok")

    def test_fremder_kontakt(self):
        self.assertEqual(sitzung_zustand(self.s(), "PH-KON-00002", JETZT), "fremd")

    def test_widerrufen_abgelaufen(self):
        self.assertEqual(sitzung_zustand(self.s(status="Widerrufen"), "PH-KON-00001", JETZT), "widerrufen")
        self.assertEqual(sitzung_zustand(self.s(status="Abgelaufen"), "PH-KON-00001", JETZT), "abgelaufen")
        self.assertEqual(sitzung_zustand(self.s(ablauf_am=JETZT - timedelta(seconds=1)), "PH-KON-00001", JETZT), "abgelaufen")


if __name__ == "__main__":
    unittest.main()
