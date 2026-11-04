"""LetMeShip-Integration von ph_logistik.

Aufbau (Basis: src/lib/commerce/shipping/letmeship.js, mock.js, config.js der Website):
  tarife.py   reine Logik: Tarifliste normalisieren, Kundenpreis in Cent, Dienstwahl, Nutzlast-Bau (party/shipmentDetails)
  status.py   reine Logik: lmsTrackingStatus → PH-Status (Etikett/Unterwegs/Zugestellt/Problem)
  mock.py     Mock-Client ohne Netz (feste MOCK-Tarife, Mini-PDF als Etikett) – für Tests und Testmodus
  client.py   echter REST-Client (HTTP Basic Auth, requests) – Tarifabfrage, Buchung, Label, Tracking, Storno
  dienst.py   Frappe-Glue: Client wählen, Tarife für Lieferschein, Sendung buchen, Etikett anhängen, Tracking-Abgleich

Zugangsdaten NUR aus site_config.json: ph_letmeship_api_id, ph_letmeship_api_password, ph_letmeship_env.
Solange PH Logistik Einstellungen.letmeship_testmodus = 1 oder keine Zugangsdaten vorhanden sind, läuft der Mock.
"""

LMS_BASE = {"live": "https://api.letmeship.com/v1", "test": "https://api.test.letmeship.com/v1"}
LMS_TIMEOUT_S = 10


class ShippingError(Exception):
    """Fehler des Versanddienstes. code: timeout | http | api | auth | keine_tarife | nicht_konfiguriert | storno"""

    def __init__(self, code, detail=None):
        super().__init__(f"letmeship {code}")
        self.code = code
        self.detail = detail
