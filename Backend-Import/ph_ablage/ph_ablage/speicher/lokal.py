"""Adapter „lokal“: Objekte als Dateien unter sites/<site>/private/files/<ordner>/ (Standard Entwicklung/Staging).

Kein Frappe-File-Datensatz: die Objekte sind für Mitarbeiter unsichtbar und nur über die Ablage-API erreichbar.
Schreiben atomar (temporäre Datei + os.replace), Schutz gegen Pfad-Ausbruch, presign_get → None (Server-Proxy).
"""

import os
import tempfile

from ph_ablage.speicher.basis import CHUNK, NichtGefunden, Speicher, SpeicherFehler, als_stream, kopieren


class LokalSpeicher(Speicher):
    name = "lokal"

    def __init__(self, basis_pfad):
        if not basis_pfad:
            raise SpeicherFehler("basis_pfad fehlt")
        self.basis = os.path.abspath(basis_pfad)

    def _pfad(self, schluessel):
        s = str(schluessel or "").replace("\\", "/")
        if not s or s.startswith("/") or any(t in ("", ".", "..") for t in s.split("/")):
            raise SpeicherFehler("ungültiger Schlüssel")
        p = os.path.abspath(os.path.join(self.basis, *s.split("/")))
        if os.path.commonpath([p, self.basis]) != self.basis:
            raise SpeicherFehler("Schlüssel außerhalb des Speichers")
        return p

    def put(self, schluessel, stream, mime="application/octet-stream"):
        ziel = self._pfad(schluessel)
        os.makedirs(os.path.dirname(ziel), exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=os.path.dirname(ziel), prefix=".ph-", suffix=".part")
        try:
            with os.fdopen(fd, "wb") as f:
                n = kopieren(als_stream(stream), f.write, CHUNK)
            os.replace(tmp, ziel)
        except BaseException:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise
        return {"groesse": n}

    def get(self, schluessel):
        p = self._pfad(schluessel)
        if not os.path.isfile(p):
            raise NichtGefunden(schluessel)
        return open(p, "rb")  # noqa: SIM115 – Aufrufer schließt

    def delete(self, schluessel):
        p = self._pfad(schluessel)
        try:
            os.unlink(p)
        except FileNotFoundError:
            return
        # leere Ordner bis zur Basis aufräumen
        d = os.path.dirname(p)
        while d != self.basis and os.path.commonpath([d, self.basis]) == self.basis:
            try:
                os.rmdir(d)
            except OSError:
                break
            d = os.path.dirname(d)

    def exists(self, schluessel):
        return os.path.isfile(self._pfad(schluessel))

    def head(self, schluessel):
        p = self._pfad(schluessel)
        return {"groesse": os.path.getsize(p)} if os.path.isfile(p) else None

    def list(self, prefix=""):
        out = []
        if not os.path.isdir(self.basis):
            return out
        for wurzel, _dirs, dateien in os.walk(self.basis):
            for d in dateien:
                if d.startswith(".ph-"):
                    continue
                rel = os.path.relpath(os.path.join(wurzel, d), self.basis).replace(os.sep, "/")
                if rel.startswith(prefix or ""):
                    out.append(rel)
        return sorted(out)

    def pruefen(self):
        try:
            os.makedirs(self.basis, exist_ok=True)
            probe = os.path.join(self.basis, ".ph-schreibtest")
            with open(probe, "wb") as f:
                f.write(b"ok")
            os.unlink(probe)
            return {"ok": True, "meldung": "Ordner beschreibbar"}
        except OSError as e:
            return {"ok": False, "meldung": f"Ordner nicht beschreibbar: {e.strerror}"}
