"""Adapter „onedrive“: OneDrive/SharePoint über Microsoft Graph, App-Only (Client Credentials).

site_config: ph_ablage_ms_tenant, ph_ablage_ms_client_id, ph_ablage_ms_client_secret, ph_ablage_ms_drive_id;
optional ph_ablage_ms_root_path (Stammordner im Drive, Standard "ph-ablage"). App-Berechtigung: Files.ReadWrite.All
bzw. Sites.Selected (nur dieses Drive) – Administrator-Zustimmung im Entra-Portal.

Pfad-Adressierung /drives/{drive}/root:/{stamm}/{schluessel}: Ordner entstehen automatisch, Kunden-/Projektnamen
erscheinen nie im Drive. presign_get liefert die kurzlebige @microsoft.graph.downloadUrl (ca. 1 h, Graph legt die
Dauer fest). Uploads > 4 MB über eine Upload-Session (Teile = Vielfache von 320 KiB).
"""

import time
from urllib.parse import quote

from ph_ablage.speicher.basis import NichtGefunden, NichtKonfiguriert, Speicher, SpeicherFehler, als_stream

GRAPH = "https://graph.microsoft.com/v1.0"
TEIL = 320 * 1024 * 25  # 8 000 KiB
KLEIN = 4 * 1024 * 1024
TIMEOUT = (10, 300)


class OneDriveSpeicher(Speicher):
    name = "onedrive"

    def __init__(self, tenant, client_id, client_secret, drive_id, root_pfad="ph-ablage", session=None, uhr=time.time, token_quelle=None):
        # token_quelle: optionaler Callable → App-Only-Token (ph_microsoft.graph.graph_token); dann entfallen
        # tenant/client_id/client_secret der Ablage.
        pflicht = (("ph_ablage_ms_drive_id", drive_id),) if token_quelle else (("ph_ablage_ms_tenant", tenant), ("ph_ablage_ms_client_id", client_id), ("ph_ablage_ms_client_secret", client_secret), ("ph_ablage_ms_drive_id", drive_id))
        fehlend = [n for n, v in pflicht if not v]
        if fehlend:
            raise NichtKonfiguriert("onedrive", fehlend)
        self.tenant, self.client_id, self.client_secret, self.drive_id = tenant, client_id, client_secret, drive_id
        self.root = str(root_pfad or "ph-ablage").strip("/")
        self._session = session
        self._uhr = uhr
        self._token_quelle = token_quelle
        self._token = None
        self._token_bis = 0

    @property
    def session(self):
        if self._session is None:
            import requests

            self._session = requests.Session()
        return self._session

    def _zugriff(self):
        if self._token_quelle is not None:
            return self._token_quelle()
        jetzt = self._uhr()
        if self._token and jetzt < self._token_bis - 60:
            return self._token
        resp = self.session.request(
            "POST", f"https://login.microsoftonline.com/{quote(self.tenant, safe='')}/oauth2/v2.0/token",
            data={"grant_type": "client_credentials", "client_id": self.client_id, "client_secret": self.client_secret, "scope": "https://graph.microsoft.com/.default"},
            timeout=TIMEOUT,
        )
        if resp.status_code != 200:
            raise SpeicherFehler(f"Graph-Token {resp.status_code}", resp.status_code)
        d = resp.json()
        self._token = d["access_token"]
        self._token_bis = jetzt + int(d.get("expires_in") or 3600)
        return self._token

    def _pfad(self, schluessel):
        return quote(f"{self.root}/{schluessel}".strip("/"), safe="/-_.~")

    def _item_url(self, schluessel, suffix=""):
        return f"{GRAPH}/drives/{quote(self.drive_id, safe='!')}/root:/{self._pfad(schluessel)}:{suffix}"

    def _anfrage(self, methode, url, headers=None, **kw):
        h = {"Authorization": f"Bearer {self._zugriff()}", **(headers or {})}
        return self.session.request(methode, url, headers=h, timeout=TIMEOUT, **kw)

    def put(self, schluessel, stream, mime="application/octet-stream"):
        quelle = als_stream(stream)
        erster = quelle.read(KLEIN + 1)
        if len(erster) <= KLEIN:
            r = self._anfrage("PUT", self._item_url(schluessel, "/content"), headers={"Content-Type": mime}, data=erster)
            if r.status_code not in (200, 201):
                raise SpeicherFehler(f"Graph-Upload {r.status_code}", r.status_code)
            return {"groesse": len(erster), "etag": (r.json() or {}).get("eTag")}
        r = self._anfrage("POST", self._item_url(schluessel, "/createUploadSession"), json={"item": {"@microsoft.graph.conflictBehavior": "replace"}})
        if r.status_code != 200:
            raise SpeicherFehler(f"Graph-Upload-Session {r.status_code}", r.status_code)
        ziel = r.json()["uploadUrl"]
        # Gesamtgröße wird für Content-Range gebraucht → Datei-Objekt mit seek/tell oder vollständig gelesen
        rest = _restlaenge(quelle)
        if rest is None:
            daten = erster + quelle.read()
            import io

            quelle, erster, rest = io.BytesIO(daten), b"", len(daten)
        gesamt = len(erster) + rest
        puffer = erster
        start = 0
        while start < gesamt:
            while len(puffer) < TEIL and start + len(puffer) < gesamt:
                mehr = quelle.read(TEIL - len(puffer))
                if not mehr:
                    break
                puffer += mehr
            teil, puffer = puffer[:TEIL], puffer[TEIL:]
            ende = start + len(teil) - 1
            # Upload-URL ist vorsigniert: ohne Authorization-Header senden (Graph-Vorgabe)
            rr = self.session.request("PUT", ziel, headers={"Content-Length": str(len(teil)), "Content-Range": f"bytes {start}-{ende}/{gesamt}"}, data=teil, timeout=TIMEOUT)
            if rr.status_code not in (200, 201, 202):
                raise SpeicherFehler(f"Graph-Upload-Teil {rr.status_code}", rr.status_code)
            start = ende + 1
        return {"groesse": gesamt}

    def _item(self, schluessel):
        r = self._anfrage("GET", self._item_url(schluessel))
        if r.status_code == 404:
            return None
        if r.status_code != 200:
            raise SpeicherFehler(f"Graph-Item {r.status_code}", r.status_code)
        return r.json()

    def get(self, schluessel):
        r = self._anfrage("GET", self._item_url(schluessel, "/content"), stream=True, allow_redirects=True)
        if r.status_code == 404:
            raise NichtGefunden(schluessel)
        if r.status_code != 200:
            raise SpeicherFehler(f"Graph-Download {r.status_code}", r.status_code)
        from ph_ablage.speicher.s3 import _Antwortstrom

        return _Antwortstrom(r)

    def delete(self, schluessel):
        r = self._anfrage("DELETE", self._item_url(schluessel))
        if r.status_code not in (200, 204, 404):
            raise SpeicherFehler(f"Graph-Löschen {r.status_code}", r.status_code)

    def head(self, schluessel):
        d = self._item(schluessel)
        return {"groesse": d.get("size"), "etag": d.get("eTag")} if d else None

    def exists(self, schluessel):
        return self._item(schluessel) is not None

    def presign_get(self, schluessel, sekunden=300, dateiname=None, inline=False):
        d = self._item(schluessel)
        if not d:
            raise NichtGefunden(schluessel)
        return d.get("@microsoft.graph.downloadUrl")

    def list(self, prefix=""):
        """Rekursiv unter dem Verzeichnis-Anteil des Präfixes (Schlüssel enthalten '/')."""
        ordner = prefix.rsplit("/", 1)[0] if "/" in (prefix or "") else ""
        out = []
        stapel = [ordner]
        while stapel:
            pfad = stapel.pop()
            url = f"{GRAPH}/drives/{quote(self.drive_id, safe='!')}/root:/{quote(f'{self.root}/{pfad}'.strip('/'), safe='/-_.~')}:/children?$select=name,folder,size"
            for _ in range(1000):
                r = self._anfrage("GET", url)
                if r.status_code == 404:
                    break
                if r.status_code != 200:
                    raise SpeicherFehler(f"Graph-Liste {r.status_code}", r.status_code)
                d = r.json()
                for it in d.get("value") or []:
                    voll = f"{pfad}/{it['name']}".strip("/")
                    if it.get("folder") is not None:
                        if voll.startswith(prefix or "") or (prefix or "").startswith(voll + "/"):
                            stapel.append(voll)
                    elif voll.startswith(prefix or ""):
                        out.append(voll)
                url = d.get("@odata.nextLink")
                if not url:
                    break
        return sorted(out)


def _restlaenge(f):
    try:
        pos = f.tell()
        f.seek(0, 2)
        ende = f.tell()
        f.seek(pos)
        return ende - pos
    except (AttributeError, OSError, ValueError):
        return None
