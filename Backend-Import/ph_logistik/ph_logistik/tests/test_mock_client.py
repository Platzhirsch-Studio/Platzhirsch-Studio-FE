"""Mock-LetMeShip ohne Site: Tarife, Buchung, Etikett (PDF), Tracking-Folge, Storno."""

import unittest

from ph_logistik.letmeship import ShippingError
from ph_logistik.letmeship.mock import MockClient, mock_label_pdf
from ph_logistik.letmeship.status import laufzeit_tage, naechster_status, status_aus_tracking
from ph_logistik.letmeship.tarife import tarife_normalisieren, waehle_dienst

ABS = {"name": "Platzhirsch", "land": "AT", "plz": "6911", "ort": "Lochau"}
ZIEL = {"name": "Anna Muster", "land": "AT", "plz": "6900", "ort": "Bregenz"}
PAKETE = [{"laenge_cm": 30, "breite_cm": 20, "hoehe_cm": 15, "gewicht_g": 1000, "menge": 1, "inhalt": "Glas"}]


class TestMockClient(unittest.TestCase):
    def setUp(self):
        self.c = MockClient(now=lambda: 1762243200)

    def test_tarife_mit_versicherung_teurer(self):
        ohne = tarife_normalisieren(self.c.verfuegbar(ABS, ZIEL, PAKETE, False, 10000, "2026-11-05")["serviceList"])
        mit = tarife_normalisieren(self.c.verfuegbar(ABS, ZIEL, PAKETE, True, 10000, "2026-11-05")["serviceList"])
        self.assertEqual(waehle_dienst(ohne)["cent"], 500)
        self.assertEqual(waehle_dienst(mit)["cent"], 700)
        self.assertIn("Versicherung", waehle_dienst(mit)["name"])
        self.assertEqual(waehle_dienst(mit, "schnellster")["id"], "mock-at-express")

    def test_land_ohne_tarif(self):
        with self.assertRaises(ShippingError) as cm:
            self.c.verfuegbar(ABS, {**ZIEL, "land": "CH"}, PAKETE, False, 0, "2026-11-05")
        self.assertEqual(cm.exception.code, "keine_tarife")

    def test_buchung_etikett_tracking_storno(self):
        r = self.c.sendung_anlegen(ABS, ZIEL, PAKETE, False, 10000, "2026-11-05", {"baseServiceDetails": {"id": "mock-at-standard", "carrier": "MOCK-Carrier"}}, "PH-S-261104-00001")
        sid = r["shipmentId"]
        self.assertTrue(sid.startswith("mock-shp-"))
        awb = self.c.sendung_details(sid)["trackingData"]["awbNumber"]
        self.assertTrue(awb.startswith("MOCK"))
        pdf = self.c.etikett(sid)
        self.assertTrue(pdf.startswith(b"%PDF-1.4"))
        self.assertIn(b"MOCK-ETIKETT PH-S-261104-00001", pdf)
        self.assertEqual(status_aus_tracking(self.c.tracking(sid)["lmsTrackingStatus"]), "Etikett")
        self.assertEqual(status_aus_tracking(self.c.tracking(sid)["lmsTrackingStatus"]), "Unterwegs")
        with self.assertRaises(ShippingError):
            self.c.stornieren(sid)  # bereits unterwegs
        self.assertEqual(status_aus_tracking(self.c.tracking(sid)["lmsTrackingStatus"]), "Zugestellt")

    def test_storno_vor_abholung(self):
        sid = self.c.sendung_anlegen(ABS, ZIEL, PAKETE, False, 0, "2026-11-05", {}, "X")["shipmentId"]
        self.assertTrue(self.c.stornieren(sid))
        self.assertEqual(self.c.tracking(sid)["lmsTrackingStatus"], "CANCELLED")

    def test_fail_simuliert_timeout(self):
        c = MockClient(fail=True)
        with self.assertRaises(ShippingError) as cm:
            c.verfuegbar(ABS, ZIEL, PAKETE, False, 0, "2026-11-05")
        self.assertEqual(cm.exception.code, "timeout")

    def test_mock_pdf_gueltig(self):
        pdf = mock_label_pdf("Test (x)")
        self.assertIn(b"%%EOF", pdf)
        self.assertNotIn(b"(x)", pdf.split(b"Tj")[0].split(b"(")[-1])


class TestStatus(unittest.TestCase):
    def test_mapping(self):
        self.assertEqual(status_aus_tracking("DELIVERED"), "Zugestellt")
        self.assertEqual(status_aus_tracking("delivered_to_neighbour"), "Zugestellt")
        self.assertEqual(status_aus_tracking("IN_TRANSIT"), "Unterwegs")
        self.assertEqual(status_aus_tracking("Out for delivery"), "Unterwegs")
        self.assertEqual(status_aus_tracking("EXCEPTION"), "Problem")
        self.assertEqual(status_aus_tracking("RETURN_TO_SENDER"), "Problem")
        self.assertEqual(status_aus_tracking("REGISTERED"), "Etikett")
        self.assertIsNone(status_aus_tracking("WHATEVER_UNKNOWN"))
        self.assertIsNone(status_aus_tracking(""))

    def test_nur_vorwaerts(self):
        self.assertEqual(naechster_status("Etikett", "Unterwegs"), "Unterwegs")
        self.assertEqual(naechster_status("Unterwegs", "Etikett"), "Unterwegs")
        self.assertEqual(naechster_status("Zugestellt", "Problem"), "Zugestellt")
        self.assertEqual(naechster_status("Problem", "Unterwegs"), "Problem")
        self.assertEqual(naechster_status("Problem", "Zugestellt"), "Zugestellt")
        self.assertEqual(naechster_status("Storniert", "Unterwegs"), "Storniert")
        self.assertEqual(naechster_status("Etikett", None), "Etikett")

    def test_laufzeit(self):
        from datetime import datetime

        self.assertEqual(laufzeit_tage(datetime(2026, 11, 2, 8), datetime(2026, 11, 4, 20)), 2.5)
        self.assertIsNone(laufzeit_tage(None, datetime(2026, 11, 4)))


if __name__ == "__main__":
    unittest.main()
