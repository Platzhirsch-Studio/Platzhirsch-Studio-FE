"""Adapter „google_drive“: Google Drive v3 (REST) mit Dienstkonto, ein versteckter Stammordner.

site_config: ph_ablage_gdrive_service_account (JSON des Dienstkontos als Text oder Objekt),
ph_ablage_gdrive_root_id (ID des Stammordners, mit dem Dienstkonto geteilt bzw. in einer geteilten Ablage).
Signatur des JWT (RS256) über `cryptography` – nur wenn installiert, sonst „nicht konfiguriert“.

Objekte liegen flach im Stammordner; der Drive-Dateiname ist der Speicher-Schlüssel (z. B.
"2026/PH-DAT-2026-000001/1-ab12cd34.pdf"), appProperties.ph_ablage = "1". Echte Dateinamen stehen nur in der
Datenbank – im Drive sieht niemand Kunden- oder Projektnamen. Kein presign (Drive kennt keine vorsignierten
Links) → Download über den Server-Proxy.
"""

import base64
import json
import time

from ph_ablage.speicher.basis import NichtGefunden, NichtKonfiguriert, Speicher, SpeicherFehler, als_stream

API = "https://www.googleapis.com/drive/v3"
UPLOAD = "https://www.googleapis.com/upload/drive/v3"
SCOPE = "https://www.googleapis.com/auth/drive"
TOKEN_URI = "https://oauth2.googleapis.com/token"
TEIL = 8 * 1024 * 1024  # Vielfaches von 256 KiB (Drive-Vorgabe für resumable Uploads)
TIMEOUT = (10, 300)


def _b64url(daten):
    return base64.urlsafe_b64encode(daten).rstrip(b"=").decode()


def jwt_erzeugen(dienstkonto, jetzt, signierer):
    """Assertion für den OAuth-JWT-Bearer-Flow (RFC 7523). signierer(bytes) → RS256-Signatur."""
    kopf = {"alg": "RS256", "typ": "JWT"}
    if dienstkonto.get("private_key_id"):
        kopf["kid"] = dienstkonto["private_key_id"]
    claims = {"iss": dienstkonto["client_email"], "scope": SCOPE, "aud": dienstkonto.get("token_uri") or TOKEN_URI, "iat": int(jetzt), "exp": int(jetzt) + 3600}
    eingabe = f"{_b64url(json.dumps(kopf, separators=(',', ':')).encode())}.{_b64url(json.dumps(claims, separators=(',', ':')).encode())}"
    return f"{eingabe}.{_b64url(signierer(eingabe.encode()))}"


def rs256_signierer(pem):
    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
    except Exception:  # noqa: BLE001 – optionale Abhängigkeit
        raise NichtKonfiguriert("google_drive", ["Python-Paket cryptography"])
    schluessel = serialization.load_pem_private_key(pem.encode() if isinstance(pem, str) else pem, password=None)

    def signiere(daten):
        return schluessel.sign(daten, padding.PKCS1v15(), hashes.SHA256())

    return signiere


def _q_text(s):
    return str(s).replace("\\", "\\\\").replace("'", "\\'")


class GoogleDriveSpeicher(Speicher):
    name = "google_drive"

    def __init__(self, dienstkonto, root_id, session=None, signierer=None, uhr=time.time):
        if isinstance(dienstkonto, str) and dienstkonto.strip():
            try:
                dienstkonto = json.loads(dienstkonto)
            except ValueError:
                raise NichtKonfiguriert("google_drive", ["ph_ablage_gdrive_service_account (kein gültiges JSON)"])
        fehlend = []
        if not isinstance(dienstkonto, dict) or not dienstkonto.get("client_email") or not (dienstkonto.get("private_key") or signierer):
            fehlend.append("ph_ablage_gdrive_service_account")
        if not root_id:
            fehlend.append("ph_ablage_gdrive_root_id")
        if fehlend:
            raise NichtKonfiguriert("google_drive", fehlend)
        self.konto = dienstkonto
        self.root_id = str(root_id)
        self._session = session
        self._signierer = signierer
        self._uhr = uhr
        self._token = None
        self._token_bis = 0

    @property
    def session(self):
        if self._session is None:
            import requests

            self._session = requests.Session()
        return self._session

    def _zugriff(self):
        jetzt = self._uhr()
        if self._token and jetzt < self._token_bis - 60:
            return self._token
        signierer = self._signierer or rs256_signierer(self.konto["private_key"])
        assertion = jwt_erzeugen(self.konto, jetzt, signierer)
        resp = self.session.request("POST", self.konto.get("token_uri") or TOKEN_URI, data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion}, timeout=TIMEOUT)
        if resp.status_code != 200:
            raise SpeicherFehler(f"Google-Token {resp.status_code}", resp.status_code)
        d = resp.json()
        self._token = d["access_token"]
        self._token_bis = jetzt + int(d.get("expires_in") or 3600)
        return self._token

    def _anfrage(self, methode, url, headers=None, **kw):
        h = {"Authorization": f"Bearer {self._zugriff()}", **(headers or {})}
        return self.session.request(methode, url, headers=h, timeout=TIMEOUT, **kw)

    def _suchen(self, q, felder="files(id,name,size),nextPageToken", token=None):
        params = {"q": q, "fields": felder, "pageSize": 1000, "supportsAllDrives": "true", "includeItemsFromAllDrives": "true", "spaces": "drive"}
        if token:
            params["pageToken"] = token
        resp = self._anfrage("GET", f"{API}/files", params=params)
        if resp.status_code != 200:
            raise SpeicherFehler(f"Drive-Suche {resp.status_code}", resp.status_code)
        return resp.json()

    def _datei(self, schluessel):
        q = f"name = '{_q_text(schluessel)}' and '{_q_text(self.root_id)}' in parents and trashed = false"
        treffer = self._suchen(q).get("files") or []
        return treffer[0] if treffer else None

    def put(self, schluessel, stream, mime="application/octet-stream"):
        vorhanden = self._datei(schluessel)
        meta = {"name": schluessel, "mimeType": mime, "appProperties": {"ph_ablage": "1"}}
        if vorhanden:
            url, methode, meta = f"{UPLOAD}/files/{vorhanden['id']}?uploadType=resumable&supportsAllDrives=true", "PATCH", {"mimeType": mime}
        else:
            url, methode = f"{UPLOAD}/files?uploadType=resumable&supportsAllDrives=true", "POST"
            meta["parents"] = [self.root_id]
        resp = self._anfrage(methode, url, headers={"Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": mime}, data=json.dumps(meta))
        if resp.status_code != 200 or not resp.headers.get("Location"):
            raise SpeicherFehler(f"Drive-Upload-Start {resp.status_code}", resp.status_code)
        ziel = resp.headers["Location"]
        quelle = als_stream(stream)
        start = 0
        teil = quelle.read(TEIL)
        while True:
            naechster = quelle.read(TEIL) if teil else b""
            ende = start + len(teil) - 1
            gesamt = str(start + len(teil)) if not naechster else "*"
            bereich = f"bytes {start}-{ende}/{gesamt}" if teil else f"bytes */{start}"
            r = self.session.request("PUT", ziel, headers={"Content-Range": bereich, "Content-Length": str(len(teil))}, data=teil, timeout=TIMEOUT)
            if not naechster:
                if r.status_code not in (200, 201):
                    raise SpeicherFehler(f"Drive-Upload {r.status_code}", r.status_code)
                return {"groesse": start + len(teil), "etag": (r.json() or {}).get("id")}
            if r.status_code != 308:
                raise SpeicherFehler(f"Drive-Upload-Teil {r.status_code}", r.status_code)
            start += len(teil)
            teil = naechster

    def get(self, schluessel):
        d = self._datei(schluessel)
        if not d:
            raise NichtGefunden(schluessel)
        resp = self._anfrage("GET", f"{API}/files/{d['id']}", params={"alt": "media", "supportsAllDrives": "true"}, stream=True)
        if resp.status_code != 200:
            raise SpeicherFehler(f"Drive-Download {resp.status_code}", resp.status_code)
        from ph_ablage.speicher.s3 import _Antwortstrom

        return _Antwortstrom(resp)

    def delete(self, schluessel):
        d = self._datei(schluessel)
        if not d:
            return
        resp = self._anfrage("DELETE", f"{API}/files/{d['id']}", params={"supportsAllDrives": "true"})
        if resp.status_code not in (200, 204, 404):
            raise SpeicherFehler(f"Drive-Löschen {resp.status_code}", resp.status_code)

    def head(self, schluessel):
        d = self._datei(schluessel)
        if not d:
            return None
        return {"groesse": int(d["size"]) if str(d.get("size") or "").isdigit() else None, "id": d.get("id")}

    def exists(self, schluessel):
        return self._datei(schluessel) is not None

    def list(self, prefix=""):
        q = f"'{_q_text(self.root_id)}' in parents and trashed = false"
        if prefix:
            q += f" and name contains '{_q_text(prefix)}'"
        out, token = [], None
        for _ in range(1000):
            d = self._suchen(q, token=token)
            out += [f["name"] for f in d.get("files") or [] if str(f.get("name", "")).startswith(prefix or "")]
            token = d.get("nextPageToken")
            if not token:
                break
        return sorted(out)
