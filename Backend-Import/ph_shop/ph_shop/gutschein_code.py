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
    """Abholcode-Eingabe: groß, nur Buchstaben/Ziffern. O→0 und I→1 nur als Tipp-Toleranz (beide liegen außerhalb
    des Alphabets); L gehört zum Alphabet und wird NICHT ersetzt (Fehler aus 10-konzept-shop §10: Codes mit L)."""
    s = "".join(ch for ch in str(wert or "").upper() if ch.isalnum())
    return s.replace("O", "0").replace("I", "1")


# ── Gutschein-Steuer und Sperrgründe (für ph_kassa: gutschein_pruefen liefert art + steuersatz) ──
# Mehrzweckgutschein: Verkauf ist kein Umsatz (§ 4 Abs 3a UStG idF Gutschein-RL 2016/1065); RKSV: Betrag-Satz-Null.
# Einzweckgutschein: USt entsteht beim Verkauf mit dem Satz der Leistung (Feld ust_satz_promille).
KASSA_SATZ = {2000: "Normal 20", 1000: "Ermaessigt-1 10", 1300: "Ermaessigt-2 13", 1900: "Besonders 19", 0: "Null 0"}

SPERRGRUENDE = (
    "Verlust gemeldet",
    "Betrugsverdacht",
    "Zahlung storniert/Rückbuchung",
    "Ersetzt",
    "Verkauf storniert",
    "Fehlausgabe",
    "Sonstiges",
)


ARTEN = ("Mehrzweck", "Einzweck", "Rabatt")


class GutscheinSteuerFehler(ValueError):
    """Einzweck ohne gültigen Satz – der Controller übersetzt in frappe.throw."""


def steuer(art, ust_satz_promille=None):
    """→ {"steuersatz_promille", "steuersatz" (Kassa-Satzname), "umsatz_bei_verkauf", "mindert_entgelt", "zahlungsmittel"}.

    Mehrzweck: Zahlungsmittel, Verkauf kein Umsatz (Kassa: Satz Null).
    Einzweck:  USt beim Verkauf mit dem gespeicherten Satz – Pflicht, KEIN stiller Standard (GutscheinSteuerFehler).
    Rabatt:    kein Zahlungsmittel; beim Einlösen Minderung des Entgelts (Bemessungsgrundlage je Satz der Ware),
               nicht verkäuflich (steuersatz None).
    """
    art = art or "Mehrzweck"
    if art == "Einzweck":
        try:
            satz = int(ust_satz_promille)
        except (TypeError, ValueError):
            satz = None
        if satz not in KASSA_SATZ or satz == 0:
            raise GutscheinSteuerFehler("Einzweckgutschein braucht einen USt-Satz (z. B. 2000 = 20 %).")
        return {"steuersatz_promille": satz, "steuersatz": KASSA_SATZ[satz], "umsatz_bei_verkauf": True, "mindert_entgelt": False, "zahlungsmittel": True}
    if art == "Rabatt":
        return {"steuersatz_promille": None, "steuersatz": None, "umsatz_bei_verkauf": False, "mindert_entgelt": True, "zahlungsmittel": False}
    return {"steuersatz_promille": 0, "steuersatz": KASSA_SATZ[0], "umsatz_bei_verkauf": False, "mindert_entgelt": False, "zahlungsmittel": True}


def sperrgrund_gueltig(art):
    return art in SPERRGRUENDE
