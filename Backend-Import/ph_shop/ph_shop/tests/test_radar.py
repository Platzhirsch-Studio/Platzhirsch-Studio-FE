"""Tests ohne Site: Stripe-Radar-Auswertung (nur Anzeige)."""

import unittest

from ph_shop import radar


class TestRadar(unittest.TestCase):
    def test_aus_charge(self):
        r = radar.aus_charge({"outcome": {"risk_level": "elevated", "risk_score": 72, "type": "authorized", "seller_message": "Payment complete."}})
        self.assertEqual(r, {"radar_risk_level": "elevated", "radar_risk_score": 72, "radar_outcome": "authorized", "radar_hinweis": "Payment complete."})
        self.assertEqual(radar.aus_charge({}), {})
        self.assertEqual(radar.aus_charge({"outcome": {"risk_level": "komisch", "risk_score": "x"}}), {"radar_risk_level": "unknown"})

    def test_markiert_und_stufe(self):
        self.assertFalse(radar.markiert("normal", 12, "authorized"))
        self.assertTrue(radar.markiert("normal", 70))
        self.assertTrue(radar.markiert(outcome="manual_review"))
        self.assertTrue(radar.markiert(warnung=True))
        self.assertEqual(radar.stufe("highest", 90), "hoch")
        self.assertEqual(radar.stufe("elevated", 66), "erhoeht")
        self.assertEqual(radar.stufe("normal", 5), "normal")
        self.assertIsNone(radar.stufe())


if __name__ == "__main__":
    unittest.main()
