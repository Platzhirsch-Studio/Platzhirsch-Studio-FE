"""Echter Client gegen eine Fake-Session (kein Netz): Nutzlast, Auth-Fehler, status.code, Label-Decode, Storno-Pfad."""

import base64
import unittest

from ph_logistik.letmeship import ShippingError
from ph_logistik.letmeship.client import LetMeShipClient


class FakeResponse:
    def __init__(self, status_code=200, data=None):
        self.status_code = status_code
        self._data = data

    def json(self):
        if self._data is None:
            raise ValueError("kein JSON")
        return self._data


class FakeSession:
    def __init__(self, antworten):
        self.antworten = antworten
        self.aufrufe = []

    def request(self, method, url, **kw):
        self.aufrufe.append((method, url, kw))
        a = self.antworten.pop(0)
        if isinstance(a, Exception):
            raise a
        return a


ABS = {"name": "Platzhirsch", "land": "AT", "plz": "6911", "ort": "Lochau", "telefon": "+4355744625"}
ZIEL = {"name": "Anna Muster", "land": "DE", "plz": "88131", "ort": "Lindau"}
PAKETE = [{"laenge_cm": 30, "breite_cm": 20, "hoehe_cm": 15, "gewicht_g": 1000, "menge": 1}]


class TestClient(unittest.TestCase):
    def test_ohne_zugang(self):
        with self.assertRaises(ShippingError) as cm:
            LetMeShipClient("", "", "test")
        self.assertEqual(cm.exception.code, "nicht_konfiguriert")

    def test_umgebung_und_basis(self):
        self.assertEqual(LetMeShipClient("id", "pw", "live").base, "https://api.letmeship.com/v1")
        self.assertEqual(LetMeShipClient("id", "pw", "irgendwas").base, "https://api.test.letmeship.com/v1")

    def test_available_nutzlast(self):
        s = FakeSession([FakeResponse(200, {"status": {"code": "0"}, "serviceList": []})])
        c = LetMeShipClient("id", "pw", "test", session=s)
        c.verfuegbar(ABS, ZIEL, PAKETE, True, 5000, "2026-11-05")
        method, url, kw = s.aufrufe[0]
        self.assertEqual((method, url), ("POST", "https://api.test.letmeship.com/v1/available"))
        self.assertEqual(kw["auth"], ("id", "pw"))
        self.assertEqual(kw["json"]["deliveryInfo"]["address"]["countryCode"], "DE")
        self.assertTrue(kw["json"]["shipmentDetails"]["shipmentSettings"]["insurance"])
        self.assertEqual(kw["json"]["shipmentDetails"]["goodsValue"], 50.0)

    def test_auth_und_api_fehler(self):
        c = LetMeShipClient("id", "pw", "test", session=FakeSession([FakeResponse(401)]))
        with self.assertRaises(ShippingError) as cm:
            c.tracking("x")
        self.assertEqual(cm.exception.code, "auth")
        c = LetMeShipClient("id", "pw", "test", session=FakeSession([FakeResponse(200, {"status": {"code": "9", "message": "geheim"}})]))
        with self.assertRaises(ShippingError) as cm:
            c.tracking("x")
        self.assertEqual(cm.exception.code, "api")
        self.assertNotIn("geheim", str(cm.exception))
        c = LetMeShipClient("id", "pw", "test", session=FakeSession([TimeoutError("timeout")]))
        with self.assertRaises(ShippingError) as cm:
            c.tracking("x")
        self.assertEqual(cm.exception.code, "timeout")

    def test_buchung_label_storno(self):
        pdf = b"%PDF-1.4 fake"
        s = FakeSession([
            FakeResponse(200, {"status": {"code": "0"}, "shipmentId": "SHP1"}),
            FakeResponse(200, {"status": {"code": "0"}, "trackingData": {"awbNumber": "AWB1"}}),
            FakeResponse(200, {"status": {"code": "0"}, "documents": [{"data": base64.b64encode(pdf).decode()}]}),
            FakeResponse(200, {"status": {"code": "0"}}),
        ])
        c = LetMeShipClient("id", "pw", "test", session=s)
        r = c.sendung_anlegen(ABS, ZIEL, PAKETE, False, 0, "2026-11-05", {"baseServiceDetails": {"id": "s1"}}, "LS-2026-00001-sehr-lange-referenz-ueber-35-zeichen")
        self.assertEqual(r["shipmentId"], "SHP1")
        self.assertEqual(len(s.aufrufe[0][2]["json"]["shipmentDetails"]["reference"]), 35)
        self.assertEqual(c.sendung_details("SHP1")["trackingData"]["awbNumber"], "AWB1")
        self.assertEqual(c.etikett("SHP1"), pdf)
        self.assertTrue(c.stornieren("SHP1"))
        self.assertEqual(s.aufrufe[2][1], "https://api.test.letmeship.com/v1/shipments/SHP1/documents?types=LABEL")
        self.assertEqual(s.aufrufe[3][0], "DELETE")

    def test_buchung_ohne_id(self):
        c = LetMeShipClient("id", "pw", "test", session=FakeSession([FakeResponse(200, {"status": {"code": "0"}})]))
        with self.assertRaises(ShippingError) as cm:
            c.sendung_anlegen(ABS, ZIEL, PAKETE, False, 0, "2026-11-05", {}, "x")
        self.assertEqual(cm.exception.detail, "no_id")


if __name__ == "__main__":
    unittest.main()
