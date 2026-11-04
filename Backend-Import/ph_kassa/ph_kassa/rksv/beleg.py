"""Maschinenlesbarer Code, Verkettung und JWS-Zusammenbau nach RKSV Detailspezifikation (Abschnitt 4–6).

Aufbau des Codes (Trennzeichen `_`, Kassen-ID und Belegnummer dürfen kein `_` enthalten):

    _R1-AT1_<KassenID>_<Belegnr>_<JJJJ-MM-TTThh:mm:ss>_<Normal>_<Ermäßigt1>_<Ermäßigt2>_<Null>_<Besonders>
      _<Umsatzzähler AES-256-CTR Base64 | TRA | STO>_<Zertifikat-Seriennummer hex>_<Sig Vorbeleg Base64>
      [_<Signatur Base64>]

- Beträge in Euro mit Komma und zwei Dezimalstellen („12,50“, Storno negativ „-12,50“).
- Sig Vorbeleg = Base64(SHA-256(JWS-Compact des Vorbelegs)[:8]); beim Startbeleg wird statt des
  Vorbelegs die Kassen-ID gehasht (Detailspezifikation, Abschnitt „Signatur des vorherigen Belegs“).
- JWS Compact Serialization: Base64url('{"alg":"ES256"}') . Base64url(Code ohne Signatur) . Base64url(Sig R‖S).
- QR-Inhalt = Code mit Signatur (Base64 standard). OCR-Variante: Base64-Felder als Base32.
- Ausfall der SEE: Signatur = Base64("Sicherheitseinrichtung ausgefallen"), Verkettung läuft weiter.

Kein Frappe-Import.
"""

import base64
import hashlib
import json
import re
from dataclasses import dataclass, field
from datetime import datetime

from . import AUSFALL_TEXT, NULLBELEGARTEN, PRAEFIX
from .counter import KENNWORT_STORNO, KENNWORT_TRAINING, kennwort_b64, verschluessele

JWS_HEADER = {"alg": "ES256"}
JWS_HEADER_B64URL = "eyJhbGciOiJFUzI1NiJ9"  # base64url('{"alg":"ES256"}') – Pflichtwert der Spezifikation
STEUERSAETZE = ("normal", "ermaessigt1", "ermaessigt2", "null", "besonders")
STEUERSATZ_PROZENT = {"normal": 20, "ermaessigt1": 10, "ermaessigt2": 13, "null": 0, "besonders": 19}

# Regex laut BMF-Prüfwerkzeug (Code ohne/mit Signatur); Kassen-ID und Belegnummer: alles außer `_`.
CODE_RE = re.compile(
    r"^_R1-AT[0-9]+_[^_]+_[^_]+_[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}"
    r"(?:_-?[0-9]+,[0-9]{2}){5}_[A-Za-z0-9+/=]+_[^_]+_[A-Za-z0-9+/=]+(?:_[A-Za-z0-9+/=]+)?$"
)


class BelegFehler(ValueError):
    """Unzulässige Belegdaten (Format, Verkettung, Betrag)."""


def b64url(data):
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def b64url_decode(text):
    pad = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + pad)


def b64_zu_b64url(text):
    return b64url(base64.b64decode(text))


def b64url_zu_b64(text):
    return base64.b64encode(b64url_decode(text)).decode("ascii")


def betrag_text(cent):
    """Cent (int, auch negativ) → „12,50“ / „-0,05“."""
    cent = int(cent)
    vorzeichen = "-" if cent < 0 else ""
    cent = abs(cent)
    return f"{vorzeichen}{cent // 100},{cent % 100:02d}"


def betrag_cent(text):
    """„12,50“ → 1250 (Umkehrung von betrag_text)."""
    m = re.fullmatch(r"(-?)([0-9]+),([0-9]{2})", text)
    if not m:
        raise BelegFehler(f"Betrag „{text}“ hat nicht das Format 0,00.")
    wert = int(m.group(2)) * 100 + int(m.group(3))
    return -wert if m.group(1) else wert


def datum_text(dt):
    """datetime → „JJJJ-MM-TTThh:mm:ss“ (Ortszeit Europe/Vienna, ohne Offset)."""
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def kassen_id_pruefen(kassen_id):
    if not kassen_id or "_" in kassen_id or any(ch.isspace() for ch in kassen_id):
        raise BelegFehler("Kassen-ID darf weder Unterstrich noch Leerzeichen enthalten.")
    return kassen_id


def hash_vorbeleg(jws_compact_vorbeleg):
    """Base64(SHA-256(JWS des Vorbelegs)[:8])."""
    return base64.b64encode(hashlib.sha256(jws_compact_vorbeleg.encode("utf-8")).digest()[:8]).decode("ascii")


def hash_startbeleg(kassen_id):
    """Startbeleg: statt Vorbeleg wird die Kassen-ID gehasht."""
    return hash_vorbeleg(kassen_id)


@dataclass
class Belegdaten:
    """Alles, was den Code eines Belegs bestimmt (vor der Signatur)."""

    kassen_id: str
    belegnummer: str
    datum: datetime
    betraege_cent: dict = field(default_factory=dict)  # Schlüssel: STEUERSAETZE
    belegart: str = "Standard"
    zda_id: str = "AT1"  # Vertrauensdiensteanbieter: A-Trust = AT1; AT0 = geschlossenes Gesamtsystem
    zertifikat_seriennummer: str = ""  # hex
    vorbeleg_jws: str = ""  # JWS Compact des Vorbelegs; leer nur beim Startbeleg

    def __post_init__(self):
        kassen_id_pruefen(self.kassen_id)
        self.belegnummer = str(self.belegnummer)
        if "_" in self.belegnummer:
            raise BelegFehler("Belegnummer darf keinen Unterstrich enthalten.")
        if not re.fullmatch(r"AT[0-9]+", self.zda_id):
            raise BelegFehler("ZDA-ID muss AT gefolgt von Ziffern sein (A-Trust: AT1).")
        if not re.fullmatch(r"[0-9A-Fa-f]+", self.zertifikat_seriennummer or ""):
            raise BelegFehler("Zertifikat-Seriennummer muss hexadezimal sein.")
        self.betraege_cent = {s: int(self.betraege_cent.get(s, 0) or 0) for s in STEUERSAETZE}
        if self.belegart in NULLBELEGARTEN and any(self.betraege_cent.values()):
            raise BelegFehler(f"{self.belegart} muss Betrag 0 in allen Steuersätzen haben.")
        if self.belegart == "Startbeleg" and self.vorbeleg_jws:
            raise BelegFehler("Startbeleg hat keinen Vorbeleg.")
        if self.belegart != "Startbeleg" and not self.vorbeleg_jws:
            raise BelegFehler("Vorbeleg (JWS) fehlt – nur der Startbeleg darf ohne Vorbeleg erzeugt werden.")

    @property
    def gesamt_cent(self):
        return sum(self.betraege_cent.values())

    def sig_vorbeleg(self):
        return hash_startbeleg(self.kassen_id) if self.belegart == "Startbeleg" else hash_vorbeleg(self.vorbeleg_jws)


def zaehler_feld(daten, zaehler_cent_vorher, aes_key):
    """Liefert (Feldwert Base64, neuer Zählerstand).

    Standard: Zähler += Gesamtbetrag des Belegs. Null-/Start-/Monats-/Jahres-/Schluss-/Sammelbeleg:
    Zähler unverändert (Startbeleg: 0). Trainings-/Stornobeleg: Kennwort TRA/STO, Zähler unverändert.
    """
    if daten.belegart == "Trainingsbeleg":
        return kennwort_b64(KENNWORT_TRAINING), zaehler_cent_vorher
    if daten.belegart == "Stornobeleg":
        return kennwort_b64(KENNWORT_STORNO), zaehler_cent_vorher
    if daten.belegart == "Startbeleg":
        neu = 0
    elif daten.belegart in NULLBELEGARTEN:
        neu = zaehler_cent_vorher
    else:
        neu = zaehler_cent_vorher + daten.gesamt_cent
    return verschluessele(neu, aes_key, daten.kassen_id, daten.belegnummer), neu


def code_ohne_signatur(daten, zaehler_feld_b64):
    """Payload des JWS = maschinenlesbarer Code ohne Signaturfeld."""
    teile = [
        f"{PRAEFIX}-{daten.zda_id}",
        daten.kassen_id,
        daten.belegnummer,
        datum_text(daten.datum),
        *[betrag_text(daten.betraege_cent[s]) for s in STEUERSAETZE],
        zaehler_feld_b64,
        daten.zertifikat_seriennummer,
        daten.sig_vorbeleg(),
    ]
    code = "_".join(teile)  # PRAEFIX beginnt bereits mit „_“
    if not CODE_RE.match(code):
        raise BelegFehler(f"Code entspricht nicht der Spezifikation: {code}")
    return code


def signing_input(code):
    """Zu signierende Bytes: Base64url(Header).Base64url(Payload)."""
    return f"{JWS_HEADER_B64URL}.{b64url(code.encode('utf-8'))}".encode("ascii")


def jws_compact(code, signatur_raw):
    """JWS Compact aus Code und Rohsignatur (R‖S, 64 Byte) bzw. Ausfall-Text."""
    return f"{signing_input(code).decode('ascii')}.{b64url(signatur_raw)}"


def ausfall_signatur_raw():
    return AUSFALL_TEXT.encode("utf-8")


def ist_ausfall_jws(jws):
    try:
        return b64url_decode(jws.split(".")[2]) == ausfall_signatur_raw()
    except Exception:  # noqa: BLE001
        return False


def code_mit_signatur(code, signatur_raw):
    """QR-Inhalt: Code + „_“ + Base64(Signatur) (Standard-Base64, nicht url-safe)."""
    return f"{code}_{base64.b64encode(signatur_raw).decode('ascii')}"


def code_aus_jws(jws):
    """JWS Compact → vollständiger Code mit Signatur (für QR/Prüfung)."""
    teile = jws.split(".")
    if len(teile) != 3 or teile[0] != JWS_HEADER_B64URL:
        raise BelegFehler("JWS hat nicht das Format Header.Payload.Signatur mit ES256-Header.")
    code = b64url_decode(teile[1]).decode("utf-8")
    return code_mit_signatur(code, b64url_decode(teile[2]))


def ocr_code(code_mit_sig):
    """OCR-Variante (Detailspezifikation Abschnitt 12): Base64-Felder (Zähler, Sig Vorbeleg, Signatur) als Base32."""
    teile = code_mit_sig.split("_")  # [0] leer (führender Unterstrich), dann 13 Felder
    if len(teile) != 14:
        raise BelegFehler("OCR-Code braucht den vollständigen Code mit Signatur (13 Felder).")

    def b32(t):
        return base64.b32encode(base64.b64decode(t)).decode("ascii")

    teile[10] = b32(teile[10])  # Umsatzzähler
    teile[12] = b32(teile[12])  # Signatur Vorbeleg
    teile[13] = b32(teile[13])  # Signatur
    return "_".join(teile)


def zerlege_code(code):
    """Code (mit oder ohne Signatur) → dict der Felder; wirft BelegFehler bei falschem Format."""
    if not CODE_RE.match(code):
        raise BelegFehler("Code entspricht nicht der Spezifikation.")
    t = code.split("_")[1:]
    d = {
        "praefix": t[0],
        "zda_id": t[0].split("-")[1],
        "kassen_id": t[1],
        "belegnummer": t[2],
        "datum": datetime.strptime(t[3], "%Y-%m-%dT%H:%M:%S"),
        "betraege_cent": {s: betrag_cent(t[4 + i]) for i, s in enumerate(STEUERSAETZE)},
        "zaehler_feld": t[9],
        "zertifikat_seriennummer": t[10],
        "sig_vorbeleg": t[11],
        "signatur_b64": t[12] if len(t) > 12 else None,
    }
    return d


def erzeuge(daten, zaehler_cent_vorher, aes_key, signer):
    """Vollständiger Beleg ohne Frappe: liefert dict mit code, jws, qr, ocr, zaehler_feld, zaehler_neu, ausfall.

    signer: Objekt mit .sign(signing_input: bytes) -> bytes (R‖S) oder None → Ausfallsignatur.
    """
    feld, zaehler_neu = zaehler_feld(daten, zaehler_cent_vorher, aes_key)
    code = code_ohne_signatur(daten, feld)
    ausfall = signer is None
    sig = ausfall_signatur_raw() if ausfall else signer.sign(signing_input(code))
    jws = jws_compact(code, sig)
    qr = code_mit_signatur(code, sig)
    return {
        "code": code,
        "jws": jws,
        "qr": qr,
        "ocr": ocr_code(qr),
        "zaehler_feld": feld,
        "zaehler_neu": zaehler_neu,
        "sig_vorbeleg": daten.sig_vorbeleg(),
        "ausfall": ausfall,
        "header": json.dumps(JWS_HEADER, separators=(",", ":")),
    }


# ── Frappe-Einstiege (Namen laut ph_kassa/schnittstellen.py, WP10b) ─────────────
# Reine Logik oben bleibt ohne Frappe; die Buchung lebt in buchung.py und wird erst beim Aufruf importiert.

def erzeuge_beleg(*args, **kwargs):
    from .buchung import erzeuge_beleg as f

    return f(*args, **kwargs)


def storniere_beleg(beleg, grund, bediener=None, **kwargs):
    from .buchung import storniere_beleg as f

    return f(beleg, grund, bediener=bediener, **kwargs)


def nullbeleg(kasse, bediener=None, **kwargs):
    from .buchung import nullbeleg as f

    return f(kasse, bediener=bediener, **kwargs)
