"""Gutscheincodes – reine Logik, byte-gleich zu src/lib/payments/codes.js, damit das Website-Register
und PH Gutschein denselben Hash kennen.

Code: 16 Zeichen aus 32 Zeichen ohne Verwechsler (kein 0/O/1/I) = 80 bit, Anzeige
PH-XXXX-XXXX-XXXX-XXXX; Testcodes beginnen mit TEST- und sind nie einlösbar.
Gespeichert wird nur sha256("ph-voucher:" + Normalform) und die letzten 4 Zeichen.
"""

import hashlib
import secrets

ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"  # 32 Zeichen (= ph_core.utils.naming.ALPHABET)
CODE_LAENGE = 16
PRAEFIX = "PH"
TEST_PRAEFIX = "TEST"


def zufallszeichen(n):
    return "".join(secrets.choice(ALPHABET) for _ in range(n))


def neuer_code(test=False):
    """Neuer Code in Anzeigeform, z. B. PH-7K3Q-X9MA-2BCD-EFGH (Test: TEST-PH-…)."""
    roh = zufallszeichen(CODE_LAENGE)
    gruppen = "-".join(roh[i : i + 4] for i in range(0, CODE_LAENGE, 4))
    return f"{TEST_PRAEFIX}-{PRAEFIX}-{gruppen}" if test else f"{PRAEFIX}-{gruppen}"


def normalisiere(eingabe):
    """Eingabe → Normalform ('TEST' + 16 Zeichen oder 16 Zeichen) oder None.
    Toleriert Kleinbuchstaben, Leerzeichen und Bindestriche; ersetzt KEINE Zeichen (wie codes.js)."""
    s = "".join(ch for ch in str(eingabe or "").upper() if ch not in " -\t\n\r")
    test = False
    if s.startswith(TEST_PRAEFIX):
        test = True
        s = s[len(TEST_PRAEFIX) :]
    if s.startswith(PRAEFIX):
        s = s[len(PRAEFIX) :]
    if len(s) != CODE_LAENGE or any(c not in ALPHABET for c in s):
        return None
    return (TEST_PRAEFIX if test else "") + s


def ist_test(normalform):
    return str(normalform or "").startswith(TEST_PRAEFIX)


def code_hash(normalform):
    """SHA-256-Hex des Registers (codeHash in codes.js)."""
    return hashlib.sha256(f"ph-voucher:{normalform}".encode("utf-8")).hexdigest()


def letzte4(code_oder_normalform):
    return str(code_oder_normalform or "")[-4:]


def bestellnummer(praefix="G"):
    """Website-Bestellnummer, z. B. G-7KQ2-M9XA, AZ-…, WS-… (newOrderId in codes.js)."""
    roh = zufallszeichen(8)
    return f"{praefix}-{roh[:4]}-{roh[4:]}"


def abholcode():
    """Kurzer Abholcode für den Showroom (6 Zeichen, ohne Verwechsler)."""
    return zufallszeichen(6)


def normalisiere_abhol(wert):
    """Abholcode-Eingabe: groß, nur Buchstaben/Ziffern, O→0 und I/L→1 (tippfreundlich)."""
    s = "".join(ch for ch in str(wert or "").upper() if ch.isalnum())
    return s.replace("O", "0").replace("I", "1").replace("L", "1")
