"""Kartennummer: Format, Normalisierung, Prüfung – ohne Frappe-Import (Tests ohne Site).

Format: "KK-" + 6 Zeichen aus dem Referenz-Alphabet von ph_core.utils.naming (ohne 0/O/1/I),
z. B. KK-7K3QX9. Eingaben an Kassa/Packtisch kommen per Scanner oder Tastatur: Kleinbuchstaben,
Leerzeichen, fehlender Bindestrich, O statt 0 werden toleriert.
"""

import re

PRAEFIX = "KK"
ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
LAENGE = 6
_MUSTER = re.compile(rf"^{PRAEFIX}-[{ALPHABET}]{{{LAENGE}}}$")


def normalisiere_kartennummer(wert):
    """'kk 7k3qx9' / 'KK7K3QX9' / ' kk-7k3qx9 ' → 'KK-7K3QX9'; leer → ''.

    Toleriert O→0, I/L→1 wie ph_core.utils.naming.normalisiere_code (diese Zeichen kommen im
    Alphabet nicht vor, 0 und 1 ebenfalls nicht – sie werden danach als ungültig erkannt, aber
    ein versehentlich eingetipptes 'O' statt 'Q' lässt sich so nicht raten; wir ändern nur das Format).
    """
    s = "".join(ch for ch in str(wert or "").upper() if ch.isalnum())
    if not s:
        return ""
    if s.startswith(PRAEFIX):
        s = s[len(PRAEFIX):]
    return f"{PRAEFIX}-{s}"


def kartennummer_gueltig(wert):
    """True, wenn der Wert nach Normalisierung dem Format entspricht."""
    return bool(_MUSTER.match(normalisiere_kartennummer(wert)))


def kartennummer_maskiert(wert):
    """Für Browser-nahe Antworten: 'KK-7K3QX9' → 'KK-••••X9'."""
    n = normalisiere_kartennummer(wert)
    if len(n) < 5:
        return ""
    return n[:3] + "•" * (len(n) - 5) + n[-2:]
