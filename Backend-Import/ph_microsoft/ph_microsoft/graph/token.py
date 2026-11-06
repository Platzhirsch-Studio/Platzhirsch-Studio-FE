"""App-Only-Token für Microsoft Graph (OAuth 2.0 Client Credentials) – ohne Frappe.

Quelle: https://learn.microsoft.com/entra/identity-platform/v2-oauth2-client-creds-grant-flow und
„Certificate credentials“ (client_assertion, JWT RS256 mit x5t = Base64url des SHA-1-Fingerabdrucks).
Bevorzugt Zertifikat (ph_ms_cert_pem + ph_ms_cert_thumbprint), sonst Client-Secret (ph_ms_client_secret).
Token-Cache: übergebenes Objekt mit get(key) / set(key, wert, sekunden); Standard = Prozess-Speicher.
Der Token wird nie protokolliert; Fehlermeldungen enthalten nur den OAuth-Fehlercode.
"""

import json
import time
import uuid

from ph_microsoft.logik.jwt_pruefung import b64url_encode, ist_guid

TOKEN_URL = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
SCOPE = "https://graph.microsoft.com/.default"
REST_SEKUNDEN = 300


class GraphTokenFehler(Exception):
    def __init__(self, code, meldung=None):
        super().__init__(meldung or code)
        self.code = code


class SpeicherCache:
    def __init__(self):
        self._d = {}

    def get(self, key):
        wert, bis = self._d.get(key, (None, 0))
        return wert if bis > time.time() else None

    def set(self, key, wert, sekunden):
        self._d[key] = (wert, time.time() + sekunden)


def _standard_post(url, data, timeout):
    import requests  # Frappe-Abhängigkeit; erst hier importiert (Tests ohne requests)

    r = requests.post(url, data=data, timeout=timeout)
    try:
        return r.status_code, r.json()
    except ValueError:
        return r.status_code, {}


class TokenQuelle:
    def __init__(self, tenant_id, client_id, client_secret=None, cert_pem=None, cert_thumbprint=None, http_post=None, uhr=time.time, cache=None, timeout=10):
        if not ist_guid(tenant_id) or not str(client_id or "").strip():
            raise GraphTokenFehler("not_configured", "ph_ms_tenant_id/ph_ms_client_id fehlen oder ungültig")
        if not client_secret and not (cert_pem and cert_thumbprint):
            raise GraphTokenFehler("not_configured", "ph_ms_client_secret oder ph_ms_cert_pem + ph_ms_cert_thumbprint fehlen")
        self.tenant_id = str(tenant_id).strip().lower()
        self.client_id = str(client_id).strip()
        self._secret = client_secret
        self._cert_pem = cert_pem
        self._thumbprint = str(cert_thumbprint or "").replace(":", "").replace(" ", "").strip()
        self._post = http_post or _standard_post
        self._uhr = uhr
        self._cache = cache or SpeicherCache()
        self._timeout = timeout
        self.cache_key = f"ph_ms:graph_token:{self.tenant_id}:{self.client_id}"

    @property
    def url(self):
        return TOKEN_URL.format(tenant=self.tenant_id)

    def token(self, erzwingen=False):
        if not erzwingen:
            gespeichert = self._cache.get(self.cache_key)
            if gespeichert:
                return gespeichert
        status, body = self._post(self.url, self._formular(), self._timeout)
        if status != 200 or not isinstance(body, dict) or not body.get("access_token"):
            code = (body or {}).get("error") if isinstance(body, dict) else None
            raise GraphTokenFehler(str(code or f"http_{status}"), f"Token-Abruf fehlgeschlagen ({code or status})")
        dauer = int(body.get("expires_in") or 3599)
        self._cache.set(self.cache_key, body["access_token"], max(60, dauer - REST_SEKUNDEN))
        return body["access_token"]

    def _formular(self):
        f = {"client_id": self.client_id, "scope": SCOPE, "grant_type": "client_credentials"}
        if self._cert_pem and self._thumbprint:
            f["client_assertion_type"] = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
            f["client_assertion"] = self.assertion()
        else:
            f["client_secret"] = self._secret
        return f

    def assertion(self):
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding

        jetzt = int(self._uhr())
        try:
            x5t = b64url_encode(bytes.fromhex(self._thumbprint))
        except ValueError:
            raise GraphTokenFehler("not_configured", "ph_ms_cert_thumbprint ist kein Hex-Fingerabdruck")
        kopf = {"alg": "RS256", "typ": "JWT", "x5t": x5t}
        claims = {"aud": self.url, "iss": self.client_id, "sub": self.client_id, "jti": str(uuid.uuid4()), "nbf": jetzt, "iat": jetzt, "exp": jetzt + 600}
        teil = f"{b64url_encode(json.dumps(kopf, separators=(',', ':')).encode())}.{b64url_encode(json.dumps(claims, separators=(',', ':')).encode())}"
        pem = self._cert_pem.encode() if isinstance(self._cert_pem, str) else self._cert_pem
        schluessel = serialization.load_pem_private_key(pem, password=None)
        signatur = schluessel.sign(teil.encode("ascii"), padding.PKCS1v15(), hashes.SHA256())
        return f"{teil}.{b64url_encode(signatur)}"
