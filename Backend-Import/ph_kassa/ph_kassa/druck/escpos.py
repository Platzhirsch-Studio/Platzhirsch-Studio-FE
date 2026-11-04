"""ESC/POS-Generator für 80-mm-Bondrucker (Epson TM-T20/T88, Star mit ESC/POS-Emulation u. a.) – ohne Frappe.

Erzeugt nur Bytes; der Transport (Druckserver per HTTP, QZ Tray im Browser, Datei) liegt in drucker.py.
Befehle laut Epson ESC/POS Application Programming Guide:
  ESC @  Init · ESC a n  Ausrichtung · ESC E n  Fett · GS ! n  Zeichengröße · ESC - n  Unterstrich
  GS ( k  QR-Code (Modell, Modulgröße, Fehlerkorrektur, Daten speichern, drucken)
  GS V m  Schnitt · ESC p m t1 t2  Schublade · ESC t n  Codepage (19 = PC858 mit Euro)
Zeichensatz: cp858 (Euro-Zeichen 0xD5). Nicht darstellbare Zeichen werden durch „?“ ersetzt.
"""

from __future__ import annotations

ESC = b"\x1b"
GS = b"\x1d"
LF = b"\n"

AUSRICHTUNG = {"links": 0, "mitte": 1, "rechts": 2}
CODEPAGE_BEFEHL = {"cp858": 19, "cp437": 0, "cp850": 2, "cp1252": 16}

QR_MODELL = 2
QR_EC = {"L": 48, "M": 49, "Q": 50, "H": 51}


class EscPos:
    """Kleiner Builder: Methoden hängen Bytes an, `bytes()` liefert den Druckauftrag."""

    def __init__(self, breite: int = 42, codepage: str = "cp858"):
        self.breite = int(breite)
        self.codepage = codepage
        self._buf = bytearray()

    # ── Grundbefehle ───────────────────────────────────────────────────────

    def init(self) -> "EscPos":
        self._buf += ESC + b"@"
        n = CODEPAGE_BEFEHL.get(self.codepage, 19)
        self._buf += ESC + b"t" + bytes([n])
        return self

    def roh(self, data: bytes) -> "EscPos":
        self._buf += data
        return self

    def ausrichtung(self, wie: str = "links") -> "EscPos":
        self._buf += ESC + b"a" + bytes([AUSRICHTUNG[wie]])
        return self

    def fett(self, an: bool = True) -> "EscPos":
        self._buf += ESC + b"E" + (b"\x01" if an else b"\x00")
        return self

    def unterstrich(self, an: bool = True) -> "EscPos":
        self._buf += ESC + b"-" + (b"\x01" if an else b"\x00")
        return self

    def groesse(self, breite: int = 1, hoehe: int = 1) -> "EscPos":
        """Zeichengröße 1–8 je Richtung (GS ! n: Bits 4–6 Breite, Bits 0–2 Höhe)."""
        b = max(1, min(8, int(breite))) - 1
        h = max(1, min(8, int(hoehe))) - 1
        self._buf += GS + b"!" + bytes([(b << 4) | h])
        return self

    def text(self, s: str, zeilenumbruch: bool = True) -> "EscPos":
        self._buf += self._enc(s)
        if zeilenumbruch:
            self._buf += LF
        return self

    def leer(self, n: int = 1) -> "EscPos":
        self._buf += LF * int(n)
        return self

    def vorschub(self, n: int = 3) -> "EscPos":
        self._buf += ESC + b"d" + bytes([max(0, min(255, int(n)))])
        return self

    def schneiden(self, teilschnitt: bool = True) -> "EscPos":
        self._buf += GS + b"V" + (b"\x42\x00" if teilschnitt else b"\x41\x00")
        return self

    def schublade(self) -> "EscPos":
        self._buf += ESC + b"p" + b"\x00" + b"\x19" + b"\xfa"
        return self

    # ── Zusammengesetzte Zeilen ────────────────────────────────────────────

    def zeile(self, s: str, ausrichtung: str = "links", fett: bool = False, groesse: int = 1) -> "EscPos":
        self.ausrichtung(ausrichtung)
        if fett:
            self.fett(True)
        if groesse != 1:
            self.groesse(groesse, groesse)
        self.text(s)
        if groesse != 1:
            self.groesse(1, 1)
        if fett:
            self.fett(False)
        return self

    def links_rechts(self, links: str, rechts: str, fett: bool = False, breite: int | None = None) -> "EscPos":
        self.ausrichtung("links")
        if fett:
            self.fett(True)
        self.text(links_rechts_text(links, rechts, breite or self.breite))
        if fett:
            self.fett(False)
        return self

    def linie(self, zeichen: str = "-") -> "EscPos":
        self.ausrichtung("links")
        self.text(zeichen * self.breite)
        return self

    def qr(self, daten: str, modulgroesse: int = 6, fehlerkorrektur: str = "M") -> "EscPos":
        """QR-Code über die Druckerfunktion GS ( k (kein Bild nötig). Daten UTF-8 (RKSV: ASCII)."""
        roh = daten.encode("utf-8")
        if len(roh) > 7089:
            raise ValueError("QR-Daten zu lang.")
        self.ausrichtung("mitte")
        # Funktion 165: Modell
        self._buf += GS + b"(k" + b"\x04\x00" + b"\x31\x41" + bytes([48 + QR_MODELL]) + b"\x00"
        # Funktion 167: Modulgröße
        self._buf += GS + b"(k" + b"\x03\x00" + b"\x31\x43" + bytes([max(1, min(16, int(modulgroesse)))])
        # Funktion 169: Fehlerkorrektur
        self._buf += GS + b"(k" + b"\x03\x00" + b"\x31\x45" + bytes([QR_EC.get(fehlerkorrektur, 49)])
        # Funktion 180: Daten speichern (pL pH = len + 3)
        n = len(roh) + 3
        self._buf += GS + b"(k" + bytes([n & 0xFF, (n >> 8) & 0xFF]) + b"\x31\x50\x30" + roh
        # Funktion 181: drucken
        self._buf += GS + b"(k" + b"\x03\x00" + b"\x31\x51\x30"
        self.ausrichtung("links")
        return self

    def bytes(self) -> bytes:
        return bytes(self._buf)

    def _enc(self, s: str) -> bytes:
        return str(s).encode(self.codepage, errors="replace")


# ── Textfunktionen (auch für die Vorschau in der Kassa-Page) ──────────────────

def links_rechts_text(links: str, rechts: str, breite: int) -> str:
    """'Sofa Lawrence' + '1.234,00' → eine Zeile mit Füllung; links wird gekürzt, rechts nie."""
    links = str(links or "")
    rechts = str(rechts or "")
    platz = breite - len(rechts) - 1
    if platz < 1:
        return rechts[:breite]
    if len(links) > platz:
        links = links[: max(0, platz - 1)] + "…" if platz > 1 else links[:platz]
    return links + " " * (breite - len(links) - len(rechts)) + rechts


def umbrechen(s: str, breite: int) -> list[str]:
    """Wortumbruch auf Bonbreite."""
    worte = str(s or "").split()
    zeilen, akt = [], ""
    for w in worte:
        while len(w) > breite:
            if akt:
                zeilen.append(akt)
                akt = ""
            zeilen.append(w[:breite])
            w = w[breite:]
        if not akt:
            akt = w
        elif len(akt) + 1 + len(w) <= breite:
            akt += " " + w
        else:
            zeilen.append(akt)
            akt = w
    if akt:
        zeilen.append(akt)
    return zeilen or [""]


def zentriert(s: str, breite: int) -> str:
    s = str(s or "")[:breite]
    return " " * ((breite - len(s)) // 2) + s
