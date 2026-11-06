"""Geräte-Token und Bediener-PIN – reine Logik ohne Frappe (testbar per unittest).

Verwendung (Backoffice-Fundament, Entscheidungen Nr. 48/49, PLAN-NEXT-BACKOFFICE.md §3):
  * Geräte-Token: 32 Byte Zufall (base64url, 43 Zeichen), in `PH Geraet.token_hash` liegt nur
    SHA-256 (hex). Der Klartext wird einmalig an den Registrierenden zurückgegeben und wandert in das
    HttpOnly-Cookie `ph_bo_geraet` des Backoffice (backoffice/src/lib/backoffice/auth/geraet.js).
  * Bediener-PIN: 4–6 Ziffern, Speicherung als PBKDF2-HMAC-SHA256 mit Salz
    (`pbkdf2_sha256$<iterationen>$<salz_hex>$<hash_hex>`) im Custom Field `User.ph_core_pin_hash`.
    Kein Klartext, kein ungesalzener Hash.
"""

import hashlib
import hmac
import re
import secrets

TOKEN_BYTES = 32
TOKEN_MIN_LAENGE = 20
TOKEN_MAX_LAENGE = 128
TOKEN_RE = re.compile(r"^[A-Za-z0-9_\-]+$")

PIN_RE = re.compile(r"^\d{4,6}$")
PIN_ITERATIONEN = 200_000
PIN_SALZ_BYTES = 16
PIN_PRAEFIX = "pbkdf2_sha256"

# Arbeitsplatz je Gerätetyp (backoffice/src/lib/backoffice/auth/geraet.js GERAET_TYPEN).
ARBEITSPLATZ_JE_TYP = {"Kassa": "kassa", "Packtisch": "packtisch", "Mobil": "montage", "Backoffice": "backoffice"}
ARBEITSPLAETZE = ("kassa", "packtisch", "montage", "technik", "backoffice")
GERAETE_TYPEN = tuple(ARBEITSPLATZ_JE_TYP)
DRUCKER_TYPEN = ("Bon 80 mm", "A4", "Etikett")


# ── Geräte-Token ───────────────────────────────────────────────────────────────────────────────────


def neues_token():
    """Zufälliges Geräte-Token (base64url ohne Padding, 43 Zeichen)."""
    return secrets.token_urlsafe(TOKEN_BYTES)


def normalisiere_token(wert):
    """Nutzer-/Cookie-Eingabe bereinigen: trimmen, Präfix „Bearer “ und Anführungszeichen entfernen.

    Rückgabe '' bei Leer, falscher Länge oder fremden Zeichen – der Aufrufer behandelt '' als ungültig.
    """
    s = str(wert or "").strip().strip('"').strip("'")
    if s.lower().startswith("bearer "):
        s = s[7:].strip()
    if not (TOKEN_MIN_LAENGE <= len(s) <= TOKEN_MAX_LAENGE) or not TOKEN_RE.match(s):
        return ""
    return s


def token_hash(token):
    """SHA-256 (hex, 64 Zeichen) des normalisierten Tokens; '' bei ungültigem Token."""
    t = normalisiere_token(token)
    return hashlib.sha256(t.encode()).hexdigest() if t else ""


def token_passt(token, gespeicherter_hash):
    """Konstantzeit-Vergleich Token ↔ gespeicherter Hash."""
    h = token_hash(token)
    return bool(h) and bool(gespeicherter_hash) and hmac.compare_digest(h, str(gespeicherter_hash))


# ── Bediener-PIN ───────────────────────────────────────────────────────────────────────────────────


def pin_pruefen(pin):
    """Formatprüfung: 4–6 Ziffern, nicht alle gleich, keine auf-/absteigende Folge. Rückgabe: Fehlertext oder None."""
    s = str(pin or "").strip()
    if not PIN_RE.match(s):
        return "PIN muss aus 4 bis 6 Ziffern bestehen."
    if len(set(s)) == 1:
        return "PIN darf nicht aus lauter gleichen Ziffern bestehen."
    schritte = {int(b) - int(a) for a, b in zip(s, s[1:])}
    if schritte in ({1}, {-1}):
        return "PIN darf keine einfache Zahlenfolge sein."
    return None


def pin_hash(pin, salz=None, iterationen=PIN_ITERATIONEN):
    """PBKDF2-HMAC-SHA256 der PIN: 'pbkdf2_sha256$<iter>$<salz_hex>$<hash_hex>'."""
    s = str(pin or "").strip()
    if not PIN_RE.match(s):
        raise ValueError("PIN muss aus 4 bis 6 Ziffern bestehen.")
    salz = salz if salz is not None else secrets.token_bytes(PIN_SALZ_BYTES)
    if isinstance(salz, str):
        salz = bytes.fromhex(salz)
    dk = hashlib.pbkdf2_hmac("sha256", s.encode(), salz, int(iterationen))
    return f"{PIN_PRAEFIX}${int(iterationen)}${salz.hex()}${dk.hex()}"


def pin_passt(pin, gespeichert):
    """Konstantzeit-Prüfung einer PIN gegen den gespeicherten Hash. Fremde/ungültige Formate → False."""
    s = str(pin or "").strip()
    if not PIN_RE.match(s) or not gespeichert:
        return False
    teile = str(gespeichert).split("$")
    if len(teile) != 4 or teile[0] != PIN_PRAEFIX:
        return False
    try:
        iterationen = int(teile[1])
        salz = bytes.fromhex(teile[2])
        erwartet = bytes.fromhex(teile[3])
    except ValueError:
        return False
    if iterationen < 1000 or iterationen > 5_000_000 or not salz:
        return False
    dk = hashlib.pbkdf2_hmac("sha256", s.encode(), salz, iterationen)
    return hmac.compare_digest(dk, erwartet)


def arbeitsplatz_fuer_typ(typ, arbeitsplatz=None):
    """Arbeitsplatz aus Gerätetyp ableiten, wenn keiner (oder ein ungültiger) übergeben wurde."""
    a = str(arbeitsplatz or "").strip().lower()
    if a in ARBEITSPLAETZE:
        return a
    return ARBEITSPLATZ_JE_TYP.get(str(typ or "").strip(), "backoffice")
