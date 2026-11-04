"""A-Trust a.sign RK Online – REST-Client (Signaturerstellungseinheit in der Cloud, ZDA „AT1“).

Zugänge NUR aus site_config (Schlüsselnamen `ph_atrust_user`, `ph_atrust_password`, `ph_atrust_env`);
dieses Modul liest sie nicht selbst – `see.py` übergibt die Werte. Kein Frappe-Import, kein Aufruf in Tests
(Transport ist austauschbar: `transport=` bekommt eine Funktion (methode, url, json_body, timeout) → (status, dict)).

Endpunkte laut A-Trust „a.sign RK Online – Schnittstellenbeschreibung v2“ (vor Produktivbetrieb gegen die
aktuelle Fassung prüfen, s. referenz/QUELLEN.md):
  GET  {basis}/{user}/Certificate            → Signaturzertifikat, Zertifizierungsstellen, ZDA-ID, Seriennummer
  POST {basis}/{user}/Sign/JWS               Body {"password": …, "jws_payload": "<Base64url Payload>"} → {"result": "<JWS>"}
  POST {basis}/Session/{user}                Body {"password": …} → {"sessionkey": …}; danach
  PUT  {basis}/Session/{user}/Sign/JWS       Body {"sessionkey": …, "jws_payload": …}
Basis-URLs: Test  https://hs-abnahme.a-trust.at/asignrkonline/v2
            Produktiv https://www.a-trust.at/asignrkonline/v2
Timeout 10 s; jede Störung → SignaturFehler → Ausfallmodus (RKSV § 17).
"""

import json
import urllib.error
import urllib.request

from .beleg import JWS_HEADER_B64URL, b64url_decode
from .signer import SignaturFehler, zertifikat_aus_der_b64, seriennummer_hex

BASIS = {
    "test": "https://hs-abnahme.a-trust.at/asignrkonline/v2",
    "produktiv": "https://www.a-trust.at/asignrkonline/v2",
}
TIMEOUT_S = 10


def _urllib_transport(methode, url, json_body, timeout):
    daten = json.dumps(json_body).encode("utf-8") if json_body is not None else None
    req = urllib.request.Request(url, data=daten, method=methode, headers={"Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 – feste https-Basis
            return resp.status, json.loads(resp.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8") or "{}")
        except Exception:  # noqa: BLE001
            body = {}
        return e.code, body
    except Exception as e:  # noqa: BLE001 – Timeout, DNS, TLS
        raise SignaturFehler(f"A-Trust nicht erreichbar: {e.__class__.__name__}") from e


class ATrustSigner:
    """Signer-Schnittstelle (siehe signer.py) über a.sign RK Online."""

    zda_id = "AT1"

    def __init__(self, user, password, env="test", transport=None, timeout=TIMEOUT_S):
        if env not in BASIS:
            raise SignaturFehler("ph_atrust_env muss test oder produktiv sein.")
        if not user or not password:
            raise SignaturFehler("A-Trust-Zugang fehlt (site_config ph_atrust_user / ph_atrust_password).")
        self.user = user
        self._password = password
        self.env = env
        self.basis = BASIS[env]
        self.transport = transport or _urllib_transport
        self.timeout = timeout
        self.sessionkey = None
        self._zert = None  # dict aus zertifikat_abrufen()
        self.zertifikat_seriennummer = ""

    # ── Zertifikat ────────────────────────────────────────────────────────────
    def zertifikat_abrufen(self):
        status, body = self.transport("GET", f"{self.basis}/{self.user}/Certificate", None, self.timeout)
        if status != 200 or not body.get("Signaturzertifikat"):
            raise SignaturFehler(f"A-Trust Zertifikat nicht abrufbar (HTTP {status}).")
        zert = zertifikat_aus_der_b64(body["Signaturzertifikat"])
        self._zert = {
            "Signaturzertifikat": body["Signaturzertifikat"],
            "Zertifizierungsstellen": list(body.get("Zertifizierungsstellen") or []),
            "ZDA": body.get("ZDA") or "AT1",
            "Zertifikatsseriennummer": body.get("Zertifikatsseriennummer") or seriennummer_hex(zert),
            "zertifikat": zert,
        }
        self.zda_id = self._zert["ZDA"]
        # Spezifikation verlangt die Seriennummer hexadezimal (A-Trust liefert sie teils dezimal).
        sn = str(self._zert["Zertifikatsseriennummer"])
        self.zertifikat_seriennummer = sn.lower() if all(c in "0123456789abcdefABCDEF" for c in sn) and not sn.isdigit() else seriennummer_hex(zert)
        return self._zert

    def _zertifikat(self):
        if not self._zert:
            self.zertifikat_abrufen()
        return self._zert

    def zertifikat_der_b64(self):
        return self._zertifikat()["Signaturzertifikat"]

    def zertifikatskette_der_b64(self):
        return self._zertifikat()["Zertifizierungsstellen"]

    def zertifikat(self):
        return self._zertifikat()["zertifikat"]

    # ── Signieren ─────────────────────────────────────────────────────────────
    def session_oeffnen(self):
        status, body = self.transport("POST", f"{self.basis}/Session/{self.user}", {"password": self._password}, self.timeout)
        if status != 200 or not body.get("sessionkey"):
            raise SignaturFehler(f"A-Trust Session nicht geöffnet (HTTP {status}).")
        self.sessionkey = body["sessionkey"]
        return self.sessionkey

    def sign(self, signing_input_bytes):
        """Signing-Input (Header.Payload) → Rohsignatur R‖S aus der JWS, die A-Trust zurückgibt."""
        header_b64, payload_b64 = signing_input_bytes.decode("ascii").split(".")
        if header_b64 != JWS_HEADER_B64URL:
            raise SignaturFehler("Header muss {\"alg\":\"ES256\"} sein.")
        if self.sessionkey:
            status, body = self.transport("PUT", f"{self.basis}/Session/{self.user}/Sign/JWS", {"sessionkey": self.sessionkey, "jws_payload": payload_b64}, self.timeout)
            if status in (401, 403):
                self.sessionkey = None  # Session abgelaufen → einmal ohne Session
        if not self.sessionkey:
            status, body = self.transport("POST", f"{self.basis}/{self.user}/Sign/JWS", {"password": self._password, "jws_payload": payload_b64}, self.timeout)
        if status != 200 or not body.get("result"):
            raise SignaturFehler(f"A-Trust Signatur abgelehnt (HTTP {status}).")
        jws = body["result"]
        teile = jws.split(".")
        if len(teile) != 3 or teile[1] != payload_b64:
            raise SignaturFehler("A-Trust hat eine JWS zu einem anderen Payload geliefert.")
        sig = b64url_decode(teile[2])
        if len(sig) != 64:
            raise SignaturFehler("A-Trust-Signatur hat nicht 64 Byte.")
        return sig
