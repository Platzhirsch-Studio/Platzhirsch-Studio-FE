"""Echter LetMeShip-REST-Client (HTTP Basic Auth, JSON). Kein Frappe-Import; `requests` kommt mit Frappe.

Endpunkte (Basis letmeship.js der Website und erpnext-shipping):
  POST available                               Tarife → serviceList[].baseServiceDetails{id,name,carrier,priceInfo,transferTime}
  POST shipments                               Sendung anlegen → shipmentId
  GET  shipments/{id}                          → trackingData.awbNumber
  GET  shipments/{id}/documents?types=LABEL    → documents[].data (Base64-PDF)
  GET  tracking?shipmentid={id}                → lmsTrackingStatus, awbNumber, carrier
  DELETE shipments/{id}                        Storno  [VOR LIVEGANG gegen offizielle Doku prüfen – README „LetMeShip“]
Antwort status.code != "0" → ShippingError("api"). Zugangsdaten und Antworttexte erscheinen nie in Fehlertexten.
"""

import base64
from urllib.parse import quote

from . import LMS_BASE, LMS_TIMEOUT_S, ShippingError
from .tarife import party, shipment_details


class LetMeShipClient:
    mock = False

    def __init__(self, api_id, passwort, env="test", timeout=LMS_TIMEOUT_S, session=None):
        if not api_id or not passwort:
            raise ShippingError("nicht_konfiguriert")
        self.umgebung = "live" if str(env).lower() == "live" else "test"
        self.base = LMS_BASE[self.umgebung]
        self.timeout = timeout
        self._auth = (str(api_id), str(passwort))
        self._session = session  # Tests: Objekt mit .request(method, url, **kw)

    # ── HTTP ─────────────────────────────────────────────────────────────
    def _call(self, method, pfad, body=None, roh=False):
        if self._session is None:
            import requests

            self._session = requests.Session()
        try:
            res = self._session.request(
                method,
                f"{self.base}/{pfad}",
                json=body,
                auth=self._auth,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                timeout=self.timeout,
            )
        except Exception as e:  # noqa: BLE001 – requests.Timeout/ConnectionError o. Ä.
            name = type(e).__name__.lower()
            raise ShippingError("timeout" if "timeout" in name else "http") from None
        status = getattr(res, "status_code", 0)
        if status in (401, 403):
            raise ShippingError("auth", status)
        if status >= 400:
            raise ShippingError("http", status)
        if roh:
            return res
        try:
            data = res.json()
        except Exception:  # noqa: BLE001
            raise ShippingError("http", "json") from None
        if not isinstance(data, dict):
            raise ShippingError("http", "json")
        st = data.get("status") or {}
        if st and str(st.get("code")) != "0":
            raise ShippingError("api", str(st.get("code")))
        return data

    # ── Fachliche Aufrufe ────────────────────────────────────────────────
    def verfuegbar(self, absender, ziel, pakete, versichern, warenwert_cent, datum):
        return self._call(
            "POST",
            "available",
            {"pickupInfo": party(absender), "deliveryInfo": party(ziel), "shipmentDetails": shipment_details(pakete, versichern, warenwert_cent, datum)},
        )

    def sendung_anlegen(self, absender, ziel, pakete, versichern, warenwert_cent, datum, service, referenz):
        details = shipment_details(pakete, versichern, warenwert_cent, datum)
        details["reference"] = str(referenz or "")[:35]
        data = self._call(
            "POST",
            "shipments",
            {
                "pickupInfo": party(absender),
                "deliveryInfo": party(ziel),
                "shipmentDetails": details,
                "service": service,
                "shipmentNotification": {"trackingNotification": {"deliveryNotification": True, "problemNotification": True}},
                "labelEmail": False,
            },
        )
        if not data.get("shipmentId"):
            raise ShippingError("api", "no_id")
        return data

    def sendung_details(self, shipment_id):
        return self._call("GET", f"shipments/{quote(str(shipment_id))}")

    def etikett(self, shipment_id):
        data = self._call("GET", f"shipments/{quote(str(shipment_id))}/documents?types=LABEL")
        docs = data.get("documents") or []
        b64 = docs[0].get("data") if docs else None
        if not b64:
            raise ShippingError("api", "no_label")
        try:
            return base64.b64decode(b64)
        except Exception:  # noqa: BLE001
            raise ShippingError("api", "label_decode") from None

    def tracking(self, shipment_id):
        return self._call("GET", f"tracking?shipmentid={quote(str(shipment_id))}")

    def stornieren(self, shipment_id):
        self._call("DELETE", f"shipments/{quote(str(shipment_id))}")
        return True
