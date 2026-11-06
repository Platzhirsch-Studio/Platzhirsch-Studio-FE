"""Stufen- und Umsatzlogik der Kundenkarte – ohne Frappe-Import (Tests ohne Site).

Stufe 1 der Kundenkarte kennt kein Guthaben: Umsätze dienen nur der Einstufung. Alle Beträge in Cent (Int).

  stufe_fuer_umsatz(stufen, umsatz_cent)        höchste Stufe, deren Schwelle erreicht ist
  naechste_stufe(stufen, aktuelle)              nächsthöhere Stufe (oder None)
  fehlt_noch_cent(stufen, aktuelle, umsatz)      Differenz bis zur nächsten Schwelle (0 = erreicht)
  zielstufe(...)                                 Auf-/Herabstufung mit Bewertungszeitraum
  summe_im_zeitraum(belege, von, bis)            Umsatzsumme einer Belegliste im Fenster
  zeitraum_beginn(heute, monate)                 rollierender Beginn des Bewertungszeitraums

`stufen` ist eine Liste von dicts {"name", "reihenfolge", "schwelle_jahresumsatz_cent"}; die Reihenfolge
(aufsteigend) ist maßgeblich, die Schwellen müssen mit ihr steigen (validiert in PH Kundenkarte Stufe).
"""

from datetime import date, datetime, timedelta


def _sortiert(stufen):
    return sorted((dict(s) for s in stufen or []), key=lambda s: (int(s.get("reihenfolge") or 0), int(s.get("schwelle_jahresumsatz_cent") or 0)))


def stufe_fuer_umsatz(stufen, umsatz_cent):
    """Name der höchsten Stufe, deren Schwelle (<=) erreicht ist; None ohne Stufen.

    Eine Stufe mit Schwelle 0 ist die Einstiegsstufe. Ist keine Schwelle erreicht (alle > Umsatz),
    gilt die niedrigste Stufe (Startstufe) – eine Karte ohne Stufe gibt es nicht.
    """
    liste = _sortiert(stufen)
    if not liste:
        return None
    umsatz = int(umsatz_cent or 0)
    treffer = liste[0]["name"]
    for s in liste:
        if umsatz >= int(s.get("schwelle_jahresumsatz_cent") or 0):
            treffer = s["name"]
    return treffer


def reihenfolge_von(stufen, name):
    for s in stufen or []:
        if s.get("name") == name:
            return int(s.get("reihenfolge") or 0)
    return None


def naechste_stufe(stufen, aktuelle):
    """Nächsthöhere Stufe als dict oder None (höchste Stufe erreicht / unbekannt)."""
    liste = _sortiert(stufen)
    r = reihenfolge_von(liste, aktuelle)
    if r is None:
        return liste[0] if liste else None
    for s in liste:
        if int(s.get("reihenfolge") or 0) > r:
            return s
    return None


def fehlt_noch_cent(stufen, aktuelle, umsatz_cent):
    """Cent bis zur Schwelle der nächsten Stufe (0, wenn erreicht); None ohne nächste Stufe."""
    n = naechste_stufe(stufen, aktuelle)
    if not n:
        return None
    return max(0, int(n.get("schwelle_jahresumsatz_cent") or 0) - int(umsatz_cent or 0))


def zielstufe(stufen, aktuelle, jahresumsatz_cent, stufe_seit, heute, zeitraum_monate=12, herabstufung_erlaubt=False):
    """Stufe, die die Karte ab heute haben soll.

    Aufstufung sofort, sobald der Jahresumsatz die Schwelle erreicht.
    Herabstufung nur, wenn erlaubt UND die aktuelle Stufe mindestens einen vollen Bewertungszeitraum
    gehalten wurde (stufe_seit + zeitraum_monate <= heute). Dann auf die berechnete Stufe, nie tiefer
    als die Startstufe. Ohne aktuelle Stufe → berechnete Stufe.
    """
    berechnet = stufe_fuer_umsatz(stufen, jahresumsatz_cent)
    if berechnet is None:
        return None
    if not aktuelle or reihenfolge_von(stufen, aktuelle) is None:
        return berechnet
    r_akt = reihenfolge_von(stufen, aktuelle)
    r_neu = reihenfolge_von(stufen, berechnet)
    if r_neu > r_akt:
        return berechnet
    if r_neu < r_akt and herabstufung_erlaubt:
        if stufe_seit is None or monate_addieren(stufe_seit, int(zeitraum_monate or 12)) <= heute:
            return berechnet
    return aktuelle


def monate_addieren(d, monate):
    """Datum + Monate (Monatsende wird gekappt, 31.01. + 1 → 28./29.02.)."""
    jahr = d.year + (d.month - 1 + monate) // 12
    monat = (d.month - 1 + monate) % 12 + 1
    tag = min(d.day, _tage_im_monat(jahr, monat))
    return date(jahr, monat, tag)


def _tage_im_monat(jahr, monat):
    naechster = date(jahr + (monat == 12), monat % 12 + 1, 1)
    return (naechster - timedelta(days=1)).day


def zeitraum_beginn(heute, monate=12):
    """Beginn des rollierenden Bewertungszeitraums: heute minus `monate` Monate."""
    return monate_addieren(heute, -int(monate or 12))


def summe_im_zeitraum(belege, von=None, bis=None):
    """Summe der `betrag_cent` aller Belege mit `datum` in [von, bis]; Belege ohne Datum zählen nicht.

    belege: Iterable von dicts {"datum": date, "betrag_cent": int}. Stornos kommen als negative Beträge.
    """
    summe = 0
    for b in belege or []:
        d = b.get("datum")
        if d is None:
            continue
        if isinstance(d, datetime):
            d = d.date()
        if von and d < von:
            continue
        if bis and d > bis:
            continue
        summe += int(b.get("betrag_cent") or 0)
    return summe


def letzter_einkauf(belege):
    """Jüngstes Datum eines Belegs mit positivem Betrag oder None."""
    daten = []
    for b in belege or []:
        d = b.get("datum")
        if d is None or int(b.get("betrag_cent") or 0) <= 0:
            continue
        if isinstance(d, datetime):
            d = d.date()
        daten.append(d)
    return max(daten) if daten else None
