"""Schlanker Microsoft-Graph-Client (nur `requests`, ohne SDK, ohne Frappe).

* Bearer-Token aus TokenQuelle; bei 401 einmal neuen Token holen.
* Retry bei 429/503/504 (Drosselung) mit Retry-After (Sekunden), sonst exponentiell; Obergrenze je Wartezeit.
* Paging über @odata.nextLink (`seiten`), Delta-Abfragen bis @odata.deltaLink (`delta`).
* nextLink/deltaLink werden nur akzeptiert, wenn sie auf https://graph.microsoft.com zeigen.
* Fehler als GraphFehler(status, code, meldung) – nie mit Nachrichteninhalten oder Token.
Transport: transport(methode, url, headers, json_body, params, timeout) → (status, headers, body);
Standard nutzt requests.Session (erst beim ersten Aufruf importiert).
"""

import time
from urllib.parse import urlparse

GRAPH = "https://graph.microsoft.com/v1.0"
ERLAUBTER_HOST = "graph.microsoft.com"
WIEDERHOLEN = {429, 503, 504}


class GraphFehler(Exception):
    def __init__(self, status, code=None, meldung=None):
        super().__init__(f"Graph {status} {code or ''}".strip())
        self.status = status
        self.code = code or f"http_{status}"
        self.meldung = (meldung or "")[:200]


class DeltaAbgelaufen(GraphFehler):
    """410 Gone / syncStateNotFound: Delta-Token ungültig → vollständig neu synchronisieren."""


def _standard_transport():
    import requests

    sitzung = requests.Session()

    def senden(methode, url, headers, json_body, params, timeout):
        r = sitzung.request(methode, url, headers=headers, json=json_body, params=params, timeout=timeout)
        body = None
        if r.content:
            try:
                body = r.json()
            except ValueError:
                body = r.text[:500]
        return r.status_code, dict(r.headers), body

    return senden


def _url(pfad):
    if str(pfad).startswith("https://"):
        if urlparse(pfad).hostname != ERLAUBTER_HOST:
            raise GraphFehler(0, "foreign_host", "Link zeigt nicht auf graph.microsoft.com")
        return pfad
    return GRAPH + ("" if str(pfad).startswith("/") else "/") + str(pfad)


def _retry_after(headers, versuch, max_warten):
    for k, v in (headers or {}).items():
        if str(k).lower() == "retry-after":
            try:
                return min(max_warten, max(1.0, float(v)))
            except (TypeError, ValueError):
                break
    return min(max_warten, 2.0 ** versuch)


class GraphClient:
    def __init__(self, token_quelle, transport=None, schlafen=time.sleep, max_versuche=5, max_warten=60, timeout=25):
        self.token_quelle = token_quelle
        self._transport = transport
        self._schlafen = schlafen
        self.max_versuche = max_versuche
        self.max_warten = max_warten
        self.timeout = timeout
        self.aufrufe = 0

    @property
    def transport(self):
        if self._transport is None:
            self._transport = _standard_transport()
        return self._transport

    def anfrage(self, methode, pfad, params=None, json=None, headers=None):
        url = _url(pfad)
        neuer_token = False
        for versuch in range(self.max_versuche):
            kopf = {"Authorization": f"Bearer {self.token_quelle.token(erzwingen=neuer_token)}", "Accept": "application/json"}
            kopf.update(headers or {})
            self.aufrufe += 1
            status, antwort_kopf, body = self.transport(methode, url, kopf, json, params, self.timeout)
            if 200 <= status < 300:
                return body if body not in (None, "") else {}
            if status == 401 and not neuer_token:
                neuer_token = True
                continue
            if status in WIEDERHOLEN and versuch < self.max_versuche - 1:
                self._schlafen(_retry_after(antwort_kopf, versuch, self.max_warten))
                continue
            code, meldung = None, None
            if isinstance(body, dict):
                err = body.get("error") or {}
                code, meldung = err.get("code"), err.get("message")
            if status == 410 or code in ("syncStateNotFound", "resyncRequired", "SyncStateNotFound"):
                raise DeltaAbgelaufen(status, code, meldung)
            raise GraphFehler(status, code, meldung)
        raise GraphFehler(429, "throttled", "Zu viele Wiederholungen")

    def get(self, pfad, params=None, headers=None):
        return self.anfrage("GET", pfad, params=params, headers=headers)

    def post(self, pfad, json=None, headers=None):
        return self.anfrage("POST", pfad, json=json, headers=headers)

    def patch(self, pfad, json=None, headers=None):
        return self.anfrage("PATCH", pfad, json=json, headers=headers)

    def delete(self, pfad, headers=None):
        return self.anfrage("DELETE", pfad, headers=headers)

    def seiten(self, pfad, params=None, headers=None, max_seiten=50):
        """Alle Elemente über @odata.nextLink (höchstens max_seiten Seiten)."""
        link, p = pfad, params
        for _ in range(max_seiten):
            body = self.get(link, params=p, headers=headers) or {}
            for x in body.get("value", []) or []:
                yield x
            link, p = body.get("@odata.nextLink"), None
            if not link:
                return

    def delta(self, pfad_oder_link, params=None, headers=None, max_seiten=100):
        """→ (elemente, delta_link). Folgt nextLink bis deltaLink. DeltaAbgelaufen → Aufrufer startet neu."""
        elemente, link, p = [], pfad_oder_link, params
        for _ in range(max_seiten):
            body = self.get(link, params=p, headers=headers) or {}
            elemente.extend(body.get("value", []) or [])
            if body.get("@odata.deltaLink"):
                return elemente, body["@odata.deltaLink"]
            link, p = body.get("@odata.nextLink"), None
            if not link:
                return elemente, None
        # Zu viele Seiten in einem Lauf: Zwischenstand als nextLink zurückgeben (nächster Lauf macht weiter)
        return elemente, link
