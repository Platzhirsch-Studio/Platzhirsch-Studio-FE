"""Kampagnen-Attribution ohne Frappe: UTM lesen, Kampagne wählen, Abschlüsse auf Kontaktpunkte verteilen.

Kontaktpunkt = (zeit, kampagne) einer Person (Anfrage, Newsletter-Anmeldung, Event-Anmeldung mit UTM).
Modelle: last (letzter Kontaktpunkt vor Abschluss, Standard), first (erster), linear (gleich verteilt).
Fenster: nur Kontaktpunkte innerhalb `fenster_tage` vor dem Abschluss zählen (Standard 180 – Küchen/Einrichtung haben
lange Entscheidungswege). Beträge bleiben Cent-Int; Rundungsrest bei linear geht an den letzten Kontaktpunkt.
"""

from __future__ import annotations

import re
from datetime import date, datetime, timedelta
from urllib.parse import parse_qs, urlparse

MODELLE = ("last", "first", "linear")
UTM_FELDER = ("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term")
_TEXT_RE = re.compile(r"\b(utm_(?:source|medium|campaign|content|term))\s*[:=]\s*([^\s&,;]+)", re.I)


def _norm(v):
    v = str(v or "").strip().lower()
    return v[:140] or None


def utm_aus_text(text):
    """UTM aus URL (Query) und/oder Freitext „utm_campaign: x“ (Herkunftsblock der Website). → dict."""
    erg = {}
    text = str(text or "")
    for wort in text.split():
        if "utm_" in wort and "?" in wort:
            try:
                q = parse_qs(urlparse(wort).query)
            except ValueError:
                continue
            for f in UTM_FELDER:
                if q.get(f) and f not in erg:
                    erg[f] = _norm(q[f][0])
    for m in _TEXT_RE.finditer(text):
        f = m.group(1).lower()
        if f not in erg:
            erg[f] = _norm(m.group(2))
    return {k: v for k, v in erg.items() if v}


def utm_bereinigen(d):
    """dict mit utm_* (z. B. aus API-Parametern) → nur bekannte, normalisierte Felder."""
    return {f: _norm((d or {}).get(f)) for f in UTM_FELDER if _norm((d or {}).get(f))}


def _d(x):
    if isinstance(x, datetime):
        return x.date()
    if isinstance(x, date):
        return x
    return date.fromisoformat(str(x)[:10]) if x else None


def kampagne_waehlen(kampagnen, utm, datum=None, nachlauf_tage=30):
    """kampagnen: [dict(name, utm_campaign, utm_source, utm_medium, status, zeitraum_von, zeitraum_bis)].
    Treffer über utm_campaign; bei mehreren gewinnt die mit passender source/medium, dann die laufende.
    Beendete Kampagnen nehmen nur innerhalb `nachlauf_tage` nach zeitraum_bis noch Kontaktpunkte an (Konzept L21);
    Entwürfe nie."""
    c = _norm((utm or {}).get("utm_campaign"))
    if not c:
        return None
    datum = _d(datum) or date.today()
    kandidaten = []
    for k in kampagnen:
        if _norm(k.get("utm_campaign")) != c or k.get("status") == "Entwurf":
            continue
        von, bis = _d(k.get("zeitraum_von")), _d(k.get("zeitraum_bis"))
        if von and datum < von - timedelta(days=7):
            continue
        if bis and datum > bis + timedelta(days=int(nachlauf_tage or 0)):
            continue
        punkte = sum(1 for f in ("utm_source", "utm_medium") if _norm(k.get(f)) and _norm(k.get(f)) == _norm((utm or {}).get(f)))
        laufend = int(k.get("status") in ("Aktiv", "Pausiert"))
        kandidaten.append((punkte, laufend, str(k.get("zeitraum_von") or ""), k["name"]))
    if not kandidaten:
        return None
    return sorted(kandidaten, reverse=True)[0][3]


def verteilen(kontaktpunkte, abschluss_zeit, betrag_cent, modell="last", fenster_tage=180):
    """kontaktpunkte: [dict(zeit, kampagne)] einer Person. → {kampagne: cent} (Summe = betrag_cent oder {})."""
    if modell not in MODELLE:
        raise ValueError(f"Modell {modell!r} unbekannt")
    ende = _d(abschluss_zeit)
    start = ende - timedelta(days=int(fenster_tage or 180)) if ende else None
    pk = sorted(
        [p for p in kontaktpunkte if p.get("kampagne") and (not ende or (start <= _d(p["zeit"]) <= ende))],
        key=lambda p: str(p["zeit"]),
    )
    if not pk:
        return {}
    betrag = int(betrag_cent or 0)
    if modell == "last":
        return {pk[-1]["kampagne"]: betrag}
    if modell == "first":
        return {pk[0]["kampagne"]: betrag}
    anteil, rest = divmod(betrag, len(pk))
    erg = {}
    for p in pk:
        erg[p["kampagne"]] = erg.get(p["kampagne"], 0) + anteil
    erg[pk[-1]["kampagne"]] += rest
    return erg


def auswerten(personen, modell="last", fenster_tage=180):
    """personen: [dict(kontaktpunkte=[…], abschluesse=[dict(zeit, betrag_cent)])].
    → {kampagne: dict(umsatz_cent, abschluesse)} – ein Abschluss zählt je Kampagne höchstens einmal."""
    erg = {}
    for p in personen:
        for a in p.get("abschluesse") or []:
            for kam, cent in verteilen(p.get("kontaktpunkte") or [], a.get("zeit"), a.get("betrag_cent"), modell, fenster_tage).items():
                e = erg.setdefault(kam, {"umsatz_cent": 0, "abschluesse": 0})
                e["umsatz_cent"] += cent
                e["abschluesse"] += 1
    return erg


def roi_promille(umsatz_cent, kosten_cent):
    """(Umsatz − Kosten) / Kosten in Promille; ohne Kosten None."""
    k = int(kosten_cent or 0)
    if k <= 0:
        return None
    return round(1000 * (int(umsatz_cent or 0) - k) / k)
