"""Umsatzzähler nach RKSV § 9 und Detailspezifikation (Abschnitt „Umsatzzähler“).

- Zähler in Cent als vorzeichenbehaftete 8-Byte-Big-Endian-Zahl (Spezifikation: mind. 5 Byte, 8 empfohlen).
- Verschlüsselung AES-256 im CTR-Modus (ICM) ohne Padding.
- IV = SHA-256(Kassen-ID + Belegnummer), erste 16 Byte (UTF-8, ohne Trennzeichen).
- Schlüssel 256 Bit, nur als Base64 in site_config (`ph_kassa_aes_key_<kassen_id>`), nie im DocType.
- Trainings- und Stornobuchungen tragen statt des Zählers die Kennworte „TRA“ bzw. „STO“ (Base64).

Kein Frappe-Import: testbar ohne Site.
"""

import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

SCHLUESSEL_BYTES = 32
ZAEHLER_BYTES = 8
KENNWORT_TRAINING = "TRA"
KENNWORT_STORNO = "STO"


class ZaehlerFehler(ValueError):
    """Ungültiger Schlüssel oder nicht entschlüsselbarer Zählerwert."""


def neuer_schluessel_b64():
    """Erzeugt einen zufälligen 256-Bit-Schlüssel (Base64) – nur zum Eintragen in site_config."""
    return base64.b64encode(os.urandom(SCHLUESSEL_BYTES)).decode("ascii")


def schluessel_aus_b64(wert):
    """Base64 → 32 Byte; wirft ZaehlerFehler bei falscher Länge."""
    try:
        key = base64.b64decode(str(wert or "").strip(), validate=True)
    except Exception as e:  # noqa: BLE001
        raise ZaehlerFehler("AES-Schlüssel ist kein gültiges Base64.") from e
    if len(key) != SCHLUESSEL_BYTES:
        raise ZaehlerFehler(f"AES-Schlüssel muss {SCHLUESSEL_BYTES} Byte (256 Bit) lang sein, ist {len(key)}.")
    return key


def iv(kassen_id, belegnummer):
    """IV für AES-CTR: SHA-256(KassenID ‖ Belegnummer)[:16]."""
    h = hashlib.sha256(f"{kassen_id}{belegnummer}".encode("utf-8")).digest()
    return h[:16]


def verschluessele(zaehler_cent, key, kassen_id, belegnummer):
    """Zähler (Cent, int) → Base64 des AES-256-CTR-Chiffrats (8 Byte)."""
    if not isinstance(zaehler_cent, int):
        raise ZaehlerFehler("Umsatzzähler muss eine ganze Zahl in Cent sein.")
    klar = zaehler_cent.to_bytes(ZAEHLER_BYTES, "big", signed=True)
    cipher = Cipher(algorithms.AES(key), modes.CTR(iv(kassen_id, belegnummer)))
    enc = cipher.encryptor()
    return base64.b64encode(enc.update(klar) + enc.finalize()).decode("ascii")


def entschluessele(wert_b64, key, kassen_id, belegnummer):
    """Base64-Chiffrat → Zähler in Cent (int). Für TRA/STO-Belege nicht anwendbar (ZaehlerFehler)."""
    if ist_kennwort(wert_b64):
        raise ZaehlerFehler("Trainings-/Stornobeleg trägt keinen Zählerstand.")
    try:
        chiff = base64.b64decode(wert_b64, validate=True)
    except Exception as e:  # noqa: BLE001
        raise ZaehlerFehler("Zählerwert ist kein gültiges Base64.") from e
    if not 5 <= len(chiff) <= 16:
        raise ZaehlerFehler("Zählerwert hat eine unzulässige Länge.")
    cipher = Cipher(algorithms.AES(key), modes.CTR(iv(kassen_id, belegnummer)))
    dec = cipher.decryptor()
    klar = dec.update(chiff) + dec.finalize()
    return int.from_bytes(klar, "big", signed=True)


def kennwort_b64(kennwort):
    """„TRA“/„STO“ → Base64 (steht an Stelle des verschlüsselten Zählers)."""
    if kennwort not in (KENNWORT_TRAINING, KENNWORT_STORNO):
        raise ZaehlerFehler("Nur TRA oder STO sind als Kennwort erlaubt.")
    return base64.b64encode(kennwort.encode("ascii")).decode("ascii")


def ist_kennwort(wert_b64):
    """True, wenn der Zählerwert das Base64 von TRA oder STO ist."""
    return wert_b64 in (kennwort_b64(KENNWORT_TRAINING), kennwort_b64(KENNWORT_STORNO))


def pruefwert_schluessel(key):
    """Prüfwert des AES-Schlüssels für die FinanzOnline-Registrierung: Base64(SHA-256(key)[:3])."""
    return base64.b64encode(hashlib.sha256(key).digest()[:3]).decode("ascii")
