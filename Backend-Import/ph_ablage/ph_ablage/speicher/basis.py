"""Gemeinsame Schnittstelle aller Speicher-Adapter (ohne Frappe).

    put(schluessel, stream, mime)            → {"groesse", "etag"?}; stream: bytes oder Datei-Objekt (read())
    get(schluessel)                          → Datei-Objekt mit read(n) (Aufrufer schließt es)
    delete(schluessel)                       → None (fehlendes Objekt ist kein Fehler)
    presign_get(schluessel, sekunden, dateiname=None, inline=False) → URL oder None (dann Server-Proxy)
    presign_put(schluessel, sekunden, mime, sha256_b64=None) → {"url", "methode", "header"} oder None
    exists(schluessel)                       → bool
    head(schluessel)                         → {"groesse", …} oder None
    list(prefix)                             → [schluessel, …]
    pruefen()                                → {"ok", "meldung"} – Verbindungstest (Desk-Button)

Fehler: NichtKonfiguriert (site_config-Schlüssel fehlen / Bibliothek fehlt → API 503 unavailable),
NichtGefunden (→ 404), SpeicherFehler (Anbieter antwortet mit Fehler → 502/503, Text nur im Protokoll).
"""

import io

CHUNK = 8 * 1024 * 1024


class SpeicherFehler(Exception):
    def __init__(self, meldung, status=None):
        super().__init__(meldung)
        self.status = status


class NichtKonfiguriert(SpeicherFehler):
    def __init__(self, adapter, fehlend=()):
        self.adapter = adapter
        self.fehlend = tuple(fehlend)
        super().__init__(f"Speicher '{adapter}' nicht konfiguriert" + (f" (fehlt: {', '.join(self.fehlend)})" if self.fehlend else ""))


class NichtGefunden(SpeicherFehler):
    pass


def als_stream(daten):
    if isinstance(daten, (bytes, bytearray, memoryview)):
        return io.BytesIO(bytes(daten))
    if hasattr(daten, "read"):
        return daten
    raise TypeError("stream muss bytes oder Datei-Objekt sein")


def kopieren(quelle, ziel_write, chunk=CHUNK):
    """Stream in Teilen kopieren → Anzahl Bytes."""
    n = 0
    while True:
        teil = quelle.read(chunk)
        if not teil:
            return n
        ziel_write(teil)
        n += len(teil)


class Speicher:
    name = "basis"
    nur_lesen = False

    def put(self, schluessel, stream, mime="application/octet-stream"):
        raise NotImplementedError

    def get(self, schluessel):
        raise NotImplementedError

    def delete(self, schluessel):
        raise NotImplementedError

    def presign_get(self, schluessel, sekunden=300, dateiname=None, inline=False):
        return None

    def presign_put(self, schluessel, sekunden=900, mime="application/octet-stream", sha256_b64=None):
        return None

    def exists(self, schluessel):
        raise NotImplementedError

    def head(self, schluessel):
        return {"groesse": None} if self.exists(schluessel) else None

    def list(self, prefix=""):
        raise NotImplementedError

    def pruefen(self):
        try:
            self.list("__ph_ablage_verbindungstest__/")
            return {"ok": True, "meldung": "Verbindung in Ordnung"}
        except NichtKonfiguriert as e:
            return {"ok": False, "meldung": str(e)}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "meldung": f"{type(e).__name__}: {str(e)[:200]}"}


def content_disposition(dateiname, inline=False):
    """RFC 6266/5987: ASCII-Rückfall + filename* (UTF-8)."""
    from urllib.parse import quote

    name = str(dateiname or "datei").replace('"', "'").replace("\r", " ").replace("\n", " ")
    ascii_name = name.encode("ascii", "replace").decode().replace("?", "_")
    art = "inline" if inline else "attachment"
    return f"{art}; filename=\"{ascii_name}\"; filename*=UTF-8''{quote(name, safe='')}"
