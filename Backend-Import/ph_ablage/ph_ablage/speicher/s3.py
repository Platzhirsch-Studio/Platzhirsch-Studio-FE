"""Adapter „s3“: S3-kompatibler Objektspeicher (EU-Anbieter, z. B. Hetzner Object Storage, IONOS, Scaleway, OVH,
Wasabi eu-central, AWS eu-central-1). Signatur AWS SigV4 aus sigv4.py, HTTP nur über `requests` (Frappe-Abhängigkeit).

site_config: ph_ablage_s3_endpoint (https://…, Pfad-Stil; Platzhalter {bucket} für virtuellen Host-Stil),
ph_ablage_s3_region, ph_ablage_s3_bucket, ph_ablage_s3_key, ph_ablage_s3_secret.
Optional ph_ablage_s3_boto3 = 1: Uploads über boto3 (Multipart > 5 GB), nur wenn boto3 installiert ist.

Uploads aus dem Browser gehen per vorsignierter PUT-URL direkt zum Anbieter (presign_put) – der Server sieht die
Bytes nicht; mit x-amz-checksum-sha256 prüft der Anbieter die Prüfsumme selbst.
"""

import hashlib
import html
import re
from urllib.parse import quote

from ph_ablage.speicher import sigv4
from ph_ablage.speicher.basis import NichtGefunden, NichtKonfiguriert, Speicher, SpeicherFehler, als_stream, content_disposition

TIMEOUT = (10, 300)


class _Antwortstrom:
    """read(n) über einen requests-Response (stream=True); schließt die Verbindung bei close()."""

    def __init__(self, resp):
        self._resp = resp
        self._raw = getattr(resp, "raw", None)

    def read(self, n=-1):
        if self._raw is not None:
            return self._raw.read(n if n and n > 0 else None)
        return self._resp.content if n in (-1, None) else self._resp.content[:n]

    def close(self):
        try:
            self._resp.close()
        except Exception:  # noqa: BLE001
            pass

    def __enter__(self):
        return self

    def __exit__(self, *a):
        self.close()


class S3Speicher(Speicher):
    name = "s3"
    presign_mit_dateiname = True  # response-content-disposition: Browser erhält den echten Dateinamen aus der DB

    def __init__(self, endpoint, region, bucket, key_id, secret, session=None, zeit=None, boto3_client=None):
        fehlend = [n for n, v in (("ph_ablage_s3_endpoint", endpoint), ("ph_ablage_s3_region", region), ("ph_ablage_s3_bucket", bucket), ("ph_ablage_s3_key", key_id), ("ph_ablage_s3_secret", secret)) if not v]
        if fehlend:
            raise NichtKonfiguriert("s3", fehlend)
        endpoint = str(endpoint).rstrip("/")
        if not endpoint.startswith("https://") and not re.match(r"^http://(localhost|127\.0\.0\.1)(:\d+)?", endpoint):
            raise NichtKonfiguriert("s3", ["ph_ablage_s3_endpoint (https erforderlich)"])
        if not re.fullmatch(r"[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]", str(bucket)):
            raise NichtKonfiguriert("s3", ["ph_ablage_s3_bucket (ungültiger Name)"])
        self.endpoint, self.region, self.bucket = endpoint, region, bucket
        self.key_id, self.secret = key_id, secret
        self._session = session
        self._zeit = zeit  # Tests: feste Zeit
        self._boto3 = boto3_client

    # ── Hilfen
    @property
    def session(self):
        if self._session is None:
            import requests

            self._session = requests.Session()
        return self._session

    def _basis(self):
        if "{bucket}" in self.endpoint:
            return self.endpoint.replace("{bucket}", self.bucket)
        return f"{self.endpoint}/{self.bucket}"

    def url(self, schluessel=""):
        return f"{self._basis()}/{quote(str(schluessel), safe='/-_.~')}" if schluessel else f"{self._basis()}/"

    def _anfrage(self, methode, url, headers=None, data=None, payload_hash=sigv4.LEER_SHA256, stream=False, query=None):
        h = sigv4.signiere_header(methode, url, self.region, "s3", self.key_id, self.secret, headers=headers or {}, payload_hash=payload_hash, zeit=self._zeit() if callable(self._zeit) else self._zeit, query=query)
        resp = self.session.request(methode, url, headers=h, data=data, stream=stream, timeout=TIMEOUT)
        return resp

    @staticmethod
    def _fehler(resp, schluessel=None):
        code = re.search(r"<Code>([^<]+)</Code>", getattr(resp, "text", "") or "")
        if resp.status_code == 404:
            raise NichtGefunden(schluessel or "objekt", 404)
        raise SpeicherFehler(f"S3 {resp.status_code} {code.group(1) if code else ''}".strip(), resp.status_code)

    # ── Schnittstelle
    def put(self, schluessel, stream, mime="application/octet-stream"):
        if self._boto3 is not None:
            self._boto3.upload_fileobj(als_stream(stream), self.bucket, schluessel, ExtraArgs={"ContentType": mime})
            return {"groesse": None}
        if isinstance(stream, (bytes, bytearray)):
            daten = bytes(stream)
            payload = hashlib.sha256(daten).hexdigest()
            laenge = len(daten)
        else:
            daten = als_stream(stream)
            payload = sigv4.UNSIGNED
            laenge = _laenge(daten)
        headers = {"content-type": mime or "application/octet-stream"}
        if laenge is not None:
            headers["content-length"] = str(laenge)
        resp = self._anfrage("PUT", self.url(schluessel), headers=headers, data=daten, payload_hash=payload)
        if resp.status_code not in (200, 201):
            self._fehler(resp, schluessel)
        return {"groesse": laenge, "etag": (resp.headers.get("ETag") or "").strip('"') or None}

    def get(self, schluessel):
        resp = self._anfrage("GET", self.url(schluessel), stream=True)
        if resp.status_code != 200:
            self._fehler(resp, schluessel)
        return _Antwortstrom(resp)

    def delete(self, schluessel):
        resp = self._anfrage("DELETE", self.url(schluessel))
        if resp.status_code not in (200, 204, 404):
            self._fehler(resp, schluessel)

    def head(self, schluessel):
        resp = self._anfrage("HEAD", self.url(schluessel), headers={"x-amz-checksum-mode": "ENABLED"})
        if resp.status_code == 404:
            return None
        if resp.status_code != 200:
            self._fehler(resp, schluessel)
        laenge = resp.headers.get("Content-Length")
        return {"groesse": int(laenge) if laenge and str(laenge).isdigit() else None, "etag": (resp.headers.get("ETag") or "").strip('"') or None, "sha256_b64": resp.headers.get("x-amz-checksum-sha256")}

    def exists(self, schluessel):
        return self.head(schluessel) is not None

    def list(self, prefix=""):
        out, token = [], None
        for _ in range(1000):  # Schutz gegen Endlosschleifen
            query = [("list-type", "2"), ("prefix", prefix or "")]
            if token:
                query.append(("continuation-token", token))
            url = self.url() + "?" + sigv4.kanonische_query(query)
            resp = self._anfrage("GET", url, query=query)
            if resp.status_code != 200:
                self._fehler(resp)
            text = resp.text or ""
            out += [html.unescape(k) for k in re.findall(r"<Key>([^<]*)</Key>", text)]
            if "<IsTruncated>true</IsTruncated>" not in text:
                break
            m = re.search(r"<NextContinuationToken>([^<]+)</NextContinuationToken>", text)
            if not m:
                break
            token = html.unescape(m.group(1))
        return out

    def presign_get(self, schluessel, sekunden=300, dateiname=None, inline=False):
        extra = {}
        if dateiname:
            extra["response-content-disposition"] = content_disposition(dateiname, inline)
        return sigv4.presign("GET", self.url(schluessel), self.region, self.key_id, self.secret, sekunden=sekunden, zeit=self._zeit() if callable(self._zeit) else self._zeit, extra_query=extra)

    def presign_put(self, schluessel, sekunden=900, mime="application/octet-stream", sha256_b64=None):
        header = {"content-type": mime or "application/octet-stream"}
        if sha256_b64:
            header["x-amz-checksum-sha256"] = sha256_b64
        url = sigv4.presign("PUT", self.url(schluessel), self.region, self.key_id, self.secret, sekunden=sekunden, zeit=self._zeit() if callable(self._zeit) else self._zeit, signierte_header=header)
        return {"url": url, "methode": "PUT", "header": {"Content-Type": header["content-type"], **({"x-amz-checksum-sha256": sha256_b64} if sha256_b64 else {})}}


def _laenge(f):
    try:
        pos = f.tell()
        f.seek(0, 2)
        ende = f.tell()
        f.seek(pos)
        return ende - pos
    except (AttributeError, OSError, ValueError):
        return None
