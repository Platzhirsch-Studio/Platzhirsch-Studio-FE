"""Mock-Client für LetMeShip (kein Netz, kein Frappe-Import). Quelle: src/lib/commerce/shipping/mock.js.

Tarife sind feste BEISPIELWERTE, klar als MOCK benannt – keine echten Versandkosten.
Die Schnittstelle ist dieselbe wie bei client.LetMeShipClient:
  verfuegbar(absender, ziel, pakete, versichern, warenwert_cent, datum) → serviceList-ähnliche Rohantwort
  sendung_anlegen(...)                                                  → {"shipmentId": …}
  sendung_details(shipment_id)                                          → {"trackingData": {"awbNumber": …}}
  etikett(shipment_id)                                                  → bytes (PDF)
  tracking(shipment_id)                                                 → {"awbNumber", "lmsTrackingStatus", "carrier", "events"}
  stornieren(shipment_id)                                               → True
"""

import time

from . import ShippingError

MOCK_TARIFE = {
    "AT": [
        {"id": "mock-at-standard", "carrier": "MOCK-Carrier", "name": "MOCK Standard (kein echter Tarif)", "net": 4.17, "total": 5.00, "tage": 3},
        {"id": "mock-at-express", "carrier": "MOCK-Express", "name": "MOCK Express (kein echter Tarif)", "net": 9.17, "total": 11.00, "tage": 1},
    ],
    "DE": [
        {"id": "mock-de-standard", "carrier": "MOCK-Carrier", "name": "MOCK Standard DE (kein echter Tarif)", "net": 7.50, "total": 9.00, "tage": 4},
    ],
}
MOCK_VERSICHERUNG_EUR = 2.00


def mock_label_pdf(text):
    """Minimal gültiges PDF (eine Seite, Text) als bytes – als Etikett-Anhang in Tests/Testmodus."""
    t = str(text).replace("(", "").replace(")", "").replace("\\", "")
    stream = f"BT /F1 18 Tf 40 200 Td ({t}) Tj ET"
    objs = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 420 298] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    pdf = "%PDF-1.4\n"
    offsets = []
    for i, o in enumerate(objs, start=1):
        offsets.append(len(pdf))
        pdf += f"{i} 0 obj\n{o}\nendobj\n"
    xref = len(pdf)
    pdf += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n" + "".join(f"{o:010d} 00000 n \n" for o in offsets)
    pdf += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n"
    return pdf.encode("latin-1")


class MockClient:
    """fail=True simuliert „API antwortet nicht“ (timeout). status_folge steuert die Tracking-Antworten."""

    umgebung = "mock"
    mock = True

    def __init__(self, fail=False, now=None, status_folge=None):
        self.fail = fail
        self._now = now or (lambda: int(time.time()))
        self._n = 0
        self._sendungen = {}
        self._status_folge = list(status_folge or ["REGISTERED", "IN_TRANSIT", "DELIVERED"])
        self.aufrufe = []

    def _pruefen(self):
        if self.fail:
            raise ShippingError("timeout")

    def verfuegbar(self, absender, ziel, pakete, versichern, warenwert_cent, datum):
        self.aufrufe.append(("available", ziel.get("land")))
        self._pruefen()
        land = str(ziel.get("land") or "").upper()
        tarife = MOCK_TARIFE.get(land)
        if not tarife:
            raise ShippingError("keine_tarife")
        zuschlag = MOCK_VERSICHERUNG_EUR if versichern else 0
        return {
            "status": {"code": "0"},
            "serviceList": [
                {
                    "baseServiceDetails": {
                        "id": t["id"],
                        "carrier": t["carrier"],
                        "name": t["name"] + (" + Versicherung" if versichern else ""),
                        "transferTime": t["tage"],
                        "priceInfo": {"netPrice": round(t["net"] + zuschlag / 1.2, 2), "totalPrice": round(t["total"] + zuschlag, 2)},
                    }
                }
                for t in tarife
            ],
        }

    def sendung_anlegen(self, absender, ziel, pakete, versichern, warenwert_cent, datum, service, referenz):
        self.aufrufe.append(("shipments", referenz))
        self._pruefen()
        self._n += 1
        stamp = str(self._now())[-8:]
        sid = f"mock-shp-{stamp}-{self._n}"
        awb = f"MOCK{stamp}{self._n}"
        carrier = ((service or {}).get("baseServiceDetails") or {}).get("carrier") or "MOCK-Carrier"
        self._sendungen[sid] = {"awb": awb, "carrier": carrier, "referenz": referenz, "schritt": 0, "storniert": False}
        return {"status": {"code": "0"}, "shipmentId": sid, "service": {"baseServiceDetails": {"carrier": carrier}}}

    def sendung_details(self, shipment_id):
        self._pruefen()
        s = self._kennt(shipment_id)
        return {"status": {"code": "0"}, "shipmentId": shipment_id, "trackingData": {"awbNumber": s["awb"], "carrier": s["carrier"]}}

    def etikett(self, shipment_id):
        self.aufrufe.append(("documents", shipment_id))
        self._pruefen()
        s = self._kennt(shipment_id)
        return mock_label_pdf(f"MOCK-ETIKETT {s['referenz']} {s['awb']}")

    def tracking(self, shipment_id):
        self.aufrufe.append(("tracking", shipment_id))
        self._pruefen()
        s = self._kennt(shipment_id)
        if s["storniert"]:
            code = "CANCELLED"
        else:
            code = self._status_folge[min(s["schritt"], len(self._status_folge) - 1)]
            s["schritt"] += 1
        return {
            "status": {"code": "0"},
            "awbNumber": s["awb"],
            "carrier": s["carrier"],
            "lmsTrackingStatus": code,
            "events": [{"status": code, "location": "MOCK", "text": f"MOCK {code}", "time": None}],
        }

    def stornieren(self, shipment_id):
        self.aufrufe.append(("delete", shipment_id))
        self._pruefen()
        s = self._kennt(shipment_id)
        if s["schritt"] >= 2:
            raise ShippingError("storno", "bereits unterwegs")
        s["storniert"] = True
        return True

    def _kennt(self, shipment_id):
        s = self._sendungen.get(shipment_id)
        if not s:
            raise ShippingError("api", "unknown shipment")
        return s
