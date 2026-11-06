"""Bewertungen und direkte Rückmeldungen – reine Logik ohne Frappe-Import (Tests: tests/test_bewertung.py).

Website: src/app/[locale]/bewerten/page.js (Kurz-URL der QR-Karte bei Lieferung, Montage, Abholung) mit Link zu
Google und dem Weg „Lieber direkt an uns?“; src/components/Legal/ReviewNotice.js (Hinweis zur Herkunft der
Bewertungen, UWG/Omnibus). Regeln (Google-Richtlinie, UWG Anh. Nr. 23b/c, rechtsgrundlagen.js „bewertung“):
  - kein Review-Gating: Jede Rückmeldung wird gleich behandelt; es gibt keine Weiche nach Sternen, und die
    öffentliche Liste filtert nie nach Sternen. Ausblenden nur aus festen Gründen (AUSBLENDEN_GRUENDE).
  - kein Anreiz: Bewertungen hängen nie an Gutschein oder Empfehlung.
  - an den Browser nur maskierte Namen; E-Mail-Adressen und Telefonnummern im Text werden entfernt.
"""

import re

QUELLEN = {"direkt": "Direkt", "qr": "QR-Karte", "google": "Google", "mail": "Mail"}
QUELLE_ZU_WEBSITE = {v: k for k, v in QUELLEN.items()}
ANLAESSE = {"lieferung": "Lieferung", "montage": "Montage", "abholung": "Abholung", "beratung": "Beratung", "service": "Service", "sonstiges": "Sonstiges"}
AUSBLENDEN_GRUENDE = ("Rechtsverletzung", "Spam", "Kein Kundenbezug", "Widerruf der Einwilligung")
TEXT_MAX = 4000
NAME_MAX = 140

_STEUER_RE = re.compile(r"[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]")
_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
# Telefonnummern: + oder 0, dann mindestens 7 Ziffern mit Trennzeichen (keine Jahreszahlen, keine Preise)
_TEL_RE = re.compile(r"(?<![\w])(?:\+|00|0)\d[\d\s/().\-]{6,}\d")


def text_bereinigen(wert, laenge=TEXT_MAX):
    if not isinstance(wert, str):
        return ""
    return _STEUER_RE.sub("", wert).replace("<", "").replace(">", "").strip()[:laenge]


def text_oeffentlich(wert):
    """Für die öffentliche Liste: E-Mail-Adressen und Telefonnummern im Freitext ersetzen."""
    s = _EMAIL_RE.sub("[E-Mail entfernt]", wert or "")
    return _TEL_RE.sub("[Telefon entfernt]", s)


def sterne_pruefen(wert):
    """1–5 → int; leer/0 → None (Rückmeldung ohne Sterne); sonst ValueError."""
    if wert in (None, "", 0, "0"):
        return None
    try:
        n = int(str(wert).strip())
    except ValueError:
        raise ValueError("sterne")
    if not 1 <= n <= 5:
        raise ValueError("sterne")
    return n


def autor_maskieren(name):
    """„Anna Maria Müller“ → „Anna M.“; ein Wort bleibt; leer → „Kundin/Kunde“."""
    teile = [t for t in re.split(r"\s+", text_bereinigen(name, NAME_MAX)) if t]
    if not teile:
        return "Kundin/Kunde"
    if len(teile) == 1:
        return teile[0][:40]
    return f"{teile[0][:40]} {teile[-1][0].upper()}."


def quelle_normalisieren(wert, standard="direkt"):
    """„qr“ oder „QR-Karte“ → „QR-Karte“; unbekannt → Standard."""
    s = str(wert or "").strip().lower()
    anzeige = {v.lower(): v for v in QUELLEN.values()}
    return QUELLEN.get(s) or anzeige.get(s) or QUELLEN[standard]


def anlass_normalisieren(wert):
    s = str(wert or "").strip().lower()
    return ANLAESSE.get(s) or ("Sonstiges" if s else "")


def durchschnitt(sterne):
    """Mittel über alle Sterne-Werte (None zählt nicht), eine Nachkommastelle; keine Werte → None."""
    werte = [int(s) for s in sterne if s]
    return round(sum(werte) / len(werte), 1) if werte else None


def titel(sterne, autor_anzeige, anlass):
    teile = [f"{sterne} ★" if sterne else "ohne Sterne", autor_anzeige or "", anlass or ""]
    return " · ".join(t for t in teile if t)[:140]
