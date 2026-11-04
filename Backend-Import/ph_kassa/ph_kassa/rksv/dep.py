"""DEP7-Export nach RKSV § 7 Abs 3 / Detailspezifikation Abschnitt 7 („Datenerfassungsprotokoll“).

Struktur (JSON, UTF-8):
{
  "Belege-Gruppe": [
    {
      "Signaturzertifikat": "<Base64 DER>",
      "Zertifizierungsstellen": ["<Base64 DER>", …],
      "Belege-kompakt": ["<JWS Compact>", …]
    }
  ]
}
Je Signaturzertifikat eine Gruppe; Belege chronologisch. Die Datei ist unveränderlich zu archivieren
(7 Jahre, § 132 BAO) – Prüfsumme SHA-256 wird im PH DEP Export gespeichert.

Kein Frappe-Import.
"""

import hashlib
import json
import re
from collections import OrderedDict

from .beleg import JWS_HEADER_B64URL

JWS_RE = re.compile(r"^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$")


class DepFehler(ValueError):
    pass


def baue(belege, zertifikat_b64, zertifizierungsstellen=None):
    """belege: Liste von dicts {jws, zertifikat_seriennummer?, zertifikat_b64?} oder reine JWS-Strings.

    Belege werden nach ihrem Zertifikat gruppiert (Zertifikatswechsel → neue Gruppe); ohne Angabe
    gilt das übergebene Zertifikat.
    """
    gruppen = OrderedDict()
    for b in belege:
        if isinstance(b, str):
            jws, zert, kette = b, zertifikat_b64, zertifizierungsstellen or []
        else:
            jws = b["jws"]
            zert = b.get("zertifikat_b64") or zertifikat_b64
            kette = b.get("zertifizierungsstellen") or zertifizierungsstellen or []
        if not JWS_RE.match(jws) or not jws.startswith(JWS_HEADER_B64URL + "."):
            raise DepFehler("Beleg ist keine JWS Compact Serialization mit ES256-Header.")
        if zert not in gruppen:
            gruppen[zert] = {"Signaturzertifikat": zert or "", "Zertifizierungsstellen": list(kette), "Belege-kompakt": []}
        gruppen[zert]["Belege-kompakt"].append(jws)
    return {"Belege-Gruppe": list(gruppen.values())}


def als_json(dep):
    """Kanonische Serialisierung (stabile Prüfsumme)."""
    return json.dumps(dep, ensure_ascii=False, indent=1)


def pruefsumme(text_oder_bytes):
    data = text_oder_bytes.encode("utf-8") if isinstance(text_oder_bytes, str) else text_oder_bytes
    return hashlib.sha256(data).hexdigest()


def dateiname(kassen_id, von, bis):
    """DEP7_<kassen_id>_<von>_<bis>.json (Datumswerte als JJJJ-MM-TT oder Datetime → Datum)."""

    def d(x):
        return str(x)[:10].replace(":", "-")

    return f"DEP7_{kassen_id}_{d(von)}_{d(bis)}.json"


def pruefe_struktur(dep):
    """Strukturprüfung; liefert Liste von Fehlertexten (leer = ok)."""
    fehler = []
    if not isinstance(dep, dict) or "Belege-Gruppe" not in dep:
        return ["Wurzel muss ein Objekt mit „Belege-Gruppe“ sein."]
    if not isinstance(dep["Belege-Gruppe"], list) or not dep["Belege-Gruppe"]:
        fehler.append("„Belege-Gruppe“ muss eine nicht leere Liste sein.")
        return fehler
    for i, g in enumerate(dep["Belege-Gruppe"]):
        for k in ("Signaturzertifikat", "Zertifizierungsstellen", "Belege-kompakt"):
            if k not in g:
                fehler.append(f"Gruppe {i}: Feld „{k}“ fehlt.")
        if not isinstance(g.get("Zertifizierungsstellen", []), list):
            fehler.append(f"Gruppe {i}: „Zertifizierungsstellen“ muss eine Liste sein.")
        belege = g.get("Belege-kompakt", [])
        if not isinstance(belege, list) or not belege:
            fehler.append(f"Gruppe {i}: „Belege-kompakt“ muss eine nicht leere Liste sein.")
            continue
        for j, jws in enumerate(belege):
            if not isinstance(jws, str) or not JWS_RE.match(jws):
                fehler.append(f"Gruppe {i}, Beleg {j}: keine JWS Compact Serialization.")
    return fehler


def anzahl_belege(dep):
    return sum(len(g.get("Belege-kompakt", [])) for g in dep.get("Belege-Gruppe", []))
