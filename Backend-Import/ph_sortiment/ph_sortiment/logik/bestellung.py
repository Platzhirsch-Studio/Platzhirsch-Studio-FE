"""Herstellerbestellung: Lieferzeit/Liefertermin schätzen, Projektpositionen je Lieferant sammeln,
Liefertermin-Änderungen protokollieren.

Reine Logik ohne Frappe (Tests: ph_sortiment/tests/test_bestellung.py). Aufrufer:
  - ph_sortiment.api.bestellungen_sammeln (Projekte-Fork: Positionen aus PH Projekt)
  - PH Herstellerbestellung.validate (Terminänderungen, Wunschtermin aus Lieferzeit)
"""

from datetime import date, timedelta

POSITIONSFELDER = ("produkt", "ausfuehrung", "ausfuehrung_text", "bezeichnung", "hersteller_artikelnr", "lieferant", "menge", "vk_cent", "wunschtermin", "kommission", "raum", "bezug_zeile")


def _d(v):
    if isinstance(v, date):
        return v
    return date.fromisoformat(str(v)[:10]) if v else None


# ── Lieferzeit ───────────────────────────────────────────────────────────


def lieferzeit_fuer(regeln, marke=None, kategorie=None, standard_wochen=None):
    """(wochen_von, wochen_bis) – spezifischste Regel: Marke+Kategorie > Kategorie > Marke > Standard.
    regeln: [{marke, kategorie, wochen_von, wochen_bis}] (PH Lieferant Lieferzeit)."""
    def rang(r):
        m, k = r.get("marke"), r.get("kategorie")
        if m and k:
            return 3 if m == marke and k == kategorie else -1
        if k:
            return 2 if k == kategorie else -1
        if m:
            return 1 if m == marke else -1
        return 0

    beste = None
    for r in regeln or []:
        g = rang(r)
        if g < 0 or not (r.get("wochen_von") or r.get("wochen_bis")):
            continue
        if beste is None or g > beste[0]:
            beste = (g, r)
    if beste:
        r = beste[1]
        von = int(r.get("wochen_von") or r.get("wochen_bis") or 0)
        bis = int(r.get("wochen_bis") or von)
        return von, max(von, bis)
    if standard_wochen:
        return int(standard_wochen), int(standard_wochen)
    return None, None


def liefertermin_schaetzen(bestelldatum, wochen, urlaube=()):
    """Bestelldatum + Wochen; jeder Betriebsurlaubstag im Zeitraum verlängert um einen Tag;
    fällt der Termin in einen Urlaub → Tag danach; Wochenende → Montag. Ohne Wochen → None."""
    start = _d(bestelldatum)
    if not start or wochen in (None, ""):
        return None
    termin = start + timedelta(weeks=int(wochen))
    perioden = sorted((_d(u.get("von")), _d(u.get("bis") or u.get("von"))) for u in urlaube or [] if u.get("von"))
    gezaehlt = set()
    for _ in range(10):  # verlängern, bis stabil
        neu = 0
        for von, bis in perioden:
            a, b = max(von, start), min(bis, termin)
            tag = a
            while tag <= b:
                if tag not in gezaehlt:
                    gezaehlt.add(tag)
                    neu += 1
                tag += timedelta(days=1)
        if not neu:
            break
        termin += timedelta(days=neu)
    for von, bis in perioden:
        if von <= termin <= bis:
            termin = bis + timedelta(days=1)
    while termin.weekday() >= 5:
        termin += timedelta(days=1)
    return termin


# ── Sammeln aus Projektpositionen ────────────────────────────────────────


def normalisieren(pos):
    p = {k: pos.get(k) for k in POSITIONSFELDER}
    try:
        p["menge"] = int(p.get("menge") or 0)
    except (TypeError, ValueError):
        p["menge"] = 0
    if p.get("vk_cent") not in (None, ""):
        p["vk_cent"] = int(p["vk_cent"])
    for k in ("bezeichnung", "ausfuehrung_text", "hersteller_artikelnr", "kommission", "raum", "bezug_zeile"):
        if isinstance(p.get(k), str):
            p[k] = p[k].strip()
    return p


def gruppieren(positionen, lieferant_von, schon_bestellt=()):
    """Positionen je Lieferant. lieferant_von(pos) → Lieferant|None (Position, sonst Produkt→Marke).
    schon_bestellt: bezug_zeilen, die bereits in einer HB stehen (Idempotenz je Zeile) → übersprungen.
    Rückgabe (gruppen {lieferant: [pos]}, ohne_lieferant [kennung], uebersprungen [kennung], ungueltig [kennung])."""
    gruppen, ohne, ueber, ungueltig = {}, [], [], []
    bekannt = set(schon_bestellt or ())
    for roh in positionen or []:
        p = normalisieren(roh)
        kennung = p.get("bezug_zeile") or p.get("bezeichnung") or p.get("produkt") or "?"
        if p["menge"] <= 0 or not (p.get("produkt") or p.get("bezeichnung")):
            ungueltig.append(kennung)
            continue
        if p.get("bezug_zeile") and p["bezug_zeile"] in bekannt:
            ueber.append(kennung)
            continue
        lief = p.get("lieferant") or lieferant_von(p)
        if not lief:
            ohne.append(kennung)
            continue
        p["lieferant"] = lief
        gruppen.setdefault(lief, []).append(p)
        if p.get("bezug_zeile"):
            bekannt.add(p["bezug_zeile"])
    return gruppen, ohne, ueber, ungueltig


def fruehester_wunschtermin(positionen):
    termine = [_d(p.get("wunschtermin")) for p in positionen if p.get("wunschtermin")]
    return min(termine) if termine else None


# ── Liefertermin-Änderungen ──────────────────────────────────────────────


def terminaenderungen(alt_kopf, neu_kopf, alt_positionen, neu_positionen):
    """Änderungen des bestätigten Termins: Kopf (position 0) und je Position (Schlüssel = Zeilen-name).
    *_positionen: [{name, idx, bezug_zeile, bestaetigter_termin}]. Erstmaliges Setzen (alt leer) ist
    keine Änderung (das ist die AB); Entfernen eines Termins schon."""
    out = []
    a, n = _d(alt_kopf), _d(neu_kopf)
    if a and a != n:
        out.append({"position": 0, "bezug_zeile": None, "termin_alt": a, "termin_neu": n})
    alt = {p.get("name"): _d(p.get("bestaetigter_termin")) for p in alt_positionen or [] if p.get("name")}
    for p in neu_positionen or []:
        vorher = alt.get(p.get("name"))
        jetzt = _d(p.get("bestaetigter_termin"))
        if vorher and vorher != jetzt:
            out.append({"position": int(p.get("idx") or 0), "bezug_zeile": p.get("bezug_zeile"), "termin_alt": vorher, "termin_neu": jetzt})
    return out


def verschiebung_tage(aenderung):
    a, n = _d(aenderung.get("termin_alt")), _d(aenderung.get("termin_neu"))
    return (n - a).days if a and n else None


def aenderung_text(aenderung, bezeichnung=None):
    a, n = _d(aenderung.get("termin_alt")), _d(aenderung.get("termin_neu"))
    was = bezeichnung or ("Bestellung" if not aenderung.get("position") else "Position {0}".format(aenderung["position"]))
    if not n:
        return "{0}: bestätigter Termin {1} entfernt".format(was, a.strftime("%d.%m.%Y"))
    tage = (n - a).days
    return "{0}: Liefertermin {1} → {2} ({3:+d} Tage)".format(was, a.strftime("%d.%m.%Y"), n.strftime("%d.%m.%Y"), tage)
