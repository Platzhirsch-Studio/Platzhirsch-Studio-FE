"""Reine Logik Inventurbewertung und Inventur-Abdeckung (kein Frappe-Import, getestet in tests/test_lager_inventur_logik.py).

Bewertung zum Stichtag (Jahresabschluss; Rechtsgrundlage vom Steuerberater zu bestätigen – 91-steuerberater-fragen.md):
- Menge zum Stichtag = heutige Menge je Bestandszeile minus Wirkung aller Bewegungen nach dem Stichtag (Rückrechnung aus
  dem Bewegungsjournal; stornierte Bewegungen und ihre Gegenbuchungen zählen beide, weil beide gewirkt haben).
- Einstandspreis (Anschaffungskosten, UGB § 203 Abs 2; Durchschnittsverfahren § 209 Abs 2) je Produkt/Ausführung:
  * „Gleitender Durchschnitt“: chronologisch über alle Zu-/Abgänge bis zum Stichtag; jeder Wareneingang mit EK mischt
    (Bestand vorher × Ø + Menge × EK) / (Bestand vorher + Menge); Abgänge ändern den Ø nicht; Zugänge ohne EK (Retoure,
    Inventurplus) zum aktuellen Ø; ist der Bestand vor einem Eingang ≤ 0, beginnt der Ø neu mit dem EK.
  * „Letzter EK“: EK des letzten Wareneingangs bis zum Stichtag.
  * Rückfall ohne Wareneingang mit EK: EK der Bestandszeile, sonst gültiger EK des Produkts (+ Ausführungsaufpreis), sonst 0
    mit Hinweis „ohne EK“.
- Niederstwert (UGB § 207, strenges Niederstwertprinzip im Umlaufvermögen): Einzelwert = min(Einstandspreis × (1 − Abwertung),
  Nettoerlös), Nettoerlös nur wenn ein Verkaufspreis bekannt ist (VK Ausstellung/Abverkauf, brutto → netto − Vertriebskosten).
- Abwertung je Bewertungsart (Lagerware, Ausstellungsstueck, B-Ware) nach Altersstaffel (Monate seit Eingang, Regel mit dem
  höchsten „ab Monate“ ≤ Alter gilt). Standardsätze sind Platzhalter, bis der Steuerberater sie bestätigt.
Beträge in Cent (Int), Abwertung in echten Promille (300 = 30 %), USt in Basispunkten (2000 = 20 %, CONVENTIONS 2).
"""

import math
from datetime import date, datetime
from decimal import ROUND_HALF_UP, Decimal

METHODEN = ("Gleitender Durchschnitt", "Letzter EK")
BEWERTUNGSARTEN = ("Lagerware", "Ausstellungsstueck", "B-Ware")

# Platzhalter-Staffel (Inhaber/Steuerberater bestätigen; Einstellungen „Abwertungsstaffel“)
STANDARD_STAFFEL = [
    {"art": "Ausstellungsstueck", "ab_monate": 0, "abwertung_promille": 200},
    {"art": "Ausstellungsstueck", "ab_monate": 12, "abwertung_promille": 400},
    {"art": "Ausstellungsstueck", "ab_monate": 24, "abwertung_promille": 600},
    {"art": "Ausstellungsstueck", "ab_monate": 36, "abwertung_promille": 800},
    {"art": "B-Ware", "ab_monate": 0, "abwertung_promille": 300},
    {"art": "Lagerware", "ab_monate": 24, "abwertung_promille": 500},
]

ZUGANG = {"Wareneingang", "Retoure"}
ABGANG = {"Verkauf", "Ausbuchung"}


def _rund(x):
    return int(Decimal(x).quantize(Decimal(1), rounding=ROUND_HALF_UP))


def _d(x):
    if x is None or x == "":
        return None
    if isinstance(x, datetime):
        return x.date()
    if isinstance(x, date):
        return x
    return date.fromisoformat(str(x)[:10])


# ── Menge zum Stichtag ────────────────────────────────────────────────────

def zeilen_wirkung(b):
    """Bewegung → [(lagerbestand, delta_menge)]. Felder: art, menge, lagerbestand (Ziel- bzw. einzige Zeile),
    lagerbestand_von (Quellzeile bei Umlagerung; ältere Bewegungen ohne dieses Feld → 'quelle_unbekannt')."""
    art, menge, ziel = b.get("art"), int(b.get("menge") or 0), b.get("lagerbestand")
    if art in ZUGANG:
        return [(ziel, abs(menge))]
    if art in ABGANG:
        return [(ziel, -abs(menge))]
    if art == "Inventur":
        return [(ziel, menge)]
    if art == "Umlagerung":
        von = b.get("lagerbestand_von")
        if von and von == ziel:
            return []
        return [(von or "quelle_unbekannt", -abs(menge)), (ziel, abs(menge))]
    return []  # Reservierung/Freigabe ändern die Menge nicht


def bestand_zum_stichtag(mengen_jetzt, bewegungen_danach):
    """mengen_jetzt: {lagerbestand: menge heute}; bewegungen_danach: Bewegungen mit datum > Stichtag.
    → ({lagerbestand: menge am Stichtag}, unbekannt) – unbekannt = Stück aus Umlagerungen ohne Quellzeile (Hinweis)."""
    erg = {k: int(v or 0) for k, v in (mengen_jetzt or {}).items()}
    unbekannt = 0
    for b in bewegungen_danach or []:
        for zeile, delta in zeilen_wirkung(b):
            if zeile == "quelle_unbekannt" or zeile is None:
                unbekannt += abs(delta)
                continue
            erg[zeile] = erg.get(zeile, 0) - delta
    return erg, unbekannt


# ── Einstandspreis ────────────────────────────────────────────────────────

def gleitender_durchschnitt(ereignisse):
    """ereignisse chronologisch [{delta (Stück, ±), ek_cent (nur Wareneingang mit bekanntem EK)}] → (Ø in Cent oder None, Bestand)."""
    bestand = 0
    avg = None
    for e in ereignisse or []:
        d = int(e.get("delta") or 0)
        ek = e.get("ek_cent")
        if d > 0 and ek is not None and int(ek) >= 0:
            ek = Decimal(int(ek))
            if bestand <= 0 or avg is None:
                avg = ek
            else:
                avg = (Decimal(bestand) * avg + Decimal(d) * ek) / Decimal(bestand + d)
        bestand += d
    return (_rund(avg) if avg is not None else None), bestand


def letzter_ek(ereignisse):
    ek = None
    for e in ereignisse or []:
        if int(e.get("delta") or 0) > 0 and e.get("ek_cent") is not None:
            ek = int(e["ek_cent"])
    return ek


def einstandspreis(methode, ereignisse, rueckfall_cent=None):
    """→ (cent, quelle). quelle: 'Gleitender Durchschnitt' | 'Letzter EK' | 'Rückfall EK' | 'ohne EK'."""
    if methode not in METHODEN:
        raise ValueError(f"Unbekannte Bewertungsmethode: {methode}")
    wert = gleitender_durchschnitt(ereignisse)[0] if methode == "Gleitender Durchschnitt" else letzter_ek(ereignisse)
    if wert is not None:
        return wert, methode
    if rueckfall_cent:
        return int(rueckfall_cent), "Rückfall EK"
    return 0, "ohne EK"


# ── Abwertung / Niederstwert ──────────────────────────────────────────────

def bewertungsart(zeile):
    if zeile.get("ausstellungsstueck") or zeile.get("zustand") == "Ausstellung":
        return "Ausstellungsstueck"
    if zeile.get("zustand") == "B-Ware":
        return "B-Ware"
    return "Lagerware"


def alter_monate(eingang, stichtag):
    e, s = _d(eingang), _d(stichtag)
    if not e or not s or e > s:
        return 0
    m = (s.year - e.year) * 12 + (s.month - e.month)
    if s.day < e.day:
        m -= 1
    return max(m, 0)


def abwertung_promille(art, monate, staffel=None):
    """Regel mit dem höchsten ab_monate ≤ monate für diese Art; keine Regel → 0. Werte auf 0…1000 begrenzt."""
    beste = None
    for r in staffel if staffel is not None else STANDARD_STAFFEL:
        if r.get("art") != art:
            continue
        ab = int(r.get("ab_monate") or 0)
        if ab <= int(monate or 0) and (beste is None or ab >= int(beste.get("ab_monate") or 0)):
            beste = r
    return min(max(int(beste.get("abwertung_promille") or 0), 0), 1000) if beste else 0


def nettoerloes(vk_brutto_cent, ust_basispunkte=2000, kosten_promille=0):
    """Brutto-VK → netto − Vertriebskosten (Promille vom Netto). Ohne VK → None."""
    if not vk_brutto_cent or int(vk_brutto_cent) <= 0:
        return None
    netto = Decimal(int(vk_brutto_cent)) * 10000 / (10000 + int(ust_basispunkte or 0))
    netto = netto * (1000 - int(kosten_promille or 0)) / 1000
    return max(_rund(netto), 0)


def bewerte(menge, einstandspreis_cent, abwertung=0, nettoerloes_cent=None):
    """→ {einzelwert_cent, wert_ak_cent, abwertung_cent, wert_cent, niederstwert} (niederstwert: Nettoerlös war maßgeblich)."""
    m = max(int(menge or 0), 0)
    ek = max(int(einstandspreis_cent or 0), 0)
    einzel = _rund(Decimal(ek) * (1000 - int(abwertung or 0)) / 1000)
    nw = False
    if nettoerloes_cent is not None and int(nettoerloes_cent) < einzel:
        einzel, nw = max(int(nettoerloes_cent), 0), True
    ak = m * ek
    wert = m * einzel
    return {"einzelwert_cent": einzel, "wert_ak_cent": ak, "abwertung_cent": ak - wert, "wert_cent": wert, "niederstwert": nw}


def summen(zeilen, schluessel):
    """Gruppensummen je Schlüssel (lagerort|warengruppe|marke|bewertungsart) → [{gruppe, menge, wert_ak_cent, abwertung_cent, wert_cent, positionen}]."""
    g = {}
    for z in zeilen or []:
        k = z.get(schluessel) or "–"
        s = g.setdefault(k, {"gruppe": k, "menge": 0, "wert_ak_cent": 0, "abwertung_cent": 0, "wert_cent": 0, "positionen": 0})
        s["menge"] += int(z.get("menge") or 0)
        for f in ("wert_ak_cent", "abwertung_cent", "wert_cent"):
            s[f] += int(z.get(f) or 0)
        s["positionen"] += 1
    return sorted(g.values(), key=lambda s: str(s["gruppe"]))


def bestandsveraenderung(wert_neu_cent, wert_vorher_cent):
    """→ (betrag_cent ≥ 0, 'Erhoehung'|'Minderung'|None)."""
    d = int(wert_neu_cent or 0) - int(wert_vorher_cent or 0)
    if d > 0:
        return d, "Erhoehung"
    if d < 0:
        return -d, "Minderung"
    return 0, None


# ── Inventur-Abdeckung (permanente/rollierende Teilinventur) ──────────────

def geschaeftsjahr(stichtag, beginn_monat=1):
    """(beginn, ende) des Geschäftsjahrs, in dem der Stichtag liegt."""
    s = _d(stichtag)
    bm = min(max(int(beginn_monat or 1), 1), 12)
    jahr = s.year if s.month >= bm else s.year - 1
    beginn = date(jahr, bm, 1)
    ende = date(jahr + 1, bm, 1) if bm > 1 else date(jahr + 1, 1, 1)
    return beginn, date.fromordinal(ende.toordinal() - 1)


def abdeckung(plaetze, heute, beginn_monat=1):
    """plaetze: [{lagerort, platz, zuletzt}] → {gesamt, gezaehlt, offen, quote_promille, soll_promille, rueckstand, gj_beginn, gj_ende}.
    soll_promille = verstrichener Anteil des Geschäftsjahrs (linearer Plan „jeder Platz 1× je GJ“)."""
    h = _d(heute)
    beginn, ende = geschaeftsjahr(h, beginn_monat)
    gesamt = len(plaetze or [])
    gez = sum(1 for p in plaetze or [] if _d(p.get("zuletzt")) and beginn <= _d(p.get("zuletzt")) <= ende)
    tage = (ende - beginn).days + 1
    soll = _rund(Decimal((h - beginn).days + 1) * 1000 / tage)
    soll_plaetze = _rund(Decimal(gesamt) * soll / 1000)
    return {"gesamt": gesamt, "gezaehlt": gez, "offen": gesamt - gez, "quote_promille": _rund(Decimal(gez) * 1000 / gesamt) if gesamt else 1000,
            "soll_promille": soll, "rueckstand": max(soll_plaetze - gez, 0), "gj_beginn": beginn, "gj_ende": ende}


def im_gj_gezaehlt(zuletzt, heute, beginn_monat=1):
    z = _d(zuletzt)
    if not z:
        return False
    b, e = geschaeftsjahr(heute, beginn_monat)
    return b <= z <= e


def plaetze_vorschlagen(plaetze, heute, beginn_monat=1, anzahl=10):
    """Nächste zu zählende Plätze: im Geschäftsjahr noch nicht gezählte zuerst, dann am längsten nicht gezählte
    (nie gezählt vor alt), danach Lagerort/Platz. → Liste der Platz-dicts (höchstens anzahl)."""
    def rang(p):
        z = _d(p.get("zuletzt"))
        return (1 if im_gj_gezaehlt(z, heute, beginn_monat) else 0, z.toordinal() if z else 0, str(p.get("lagerort") or ""), str(p.get("platz") or ""))

    return sorted(plaetze or [], key=rang)[: max(int(anzahl or 0), 0)]


def plaetze_je_woche(offen, heute, beginn_monat=1):
    """Benötigte Plätze je Woche bis GJ-Ende, damit jeder Platz einmal gezählt wird (aufgerundet, mind. 1 wenn offen)."""
    _b, ende = geschaeftsjahr(heute, beginn_monat)
    wochen = max(((ende - _d(heute)).days + 1) / 7, 1)
    return 0 if not offen else max(math.ceil(int(offen) / wochen), 1)


def platzliste(text):
    """Small-Text-Feld „ein Platz je Zeile“ → Liste (ohne Leerzeilen/Doppelte, Reihenfolge bleibt)."""
    gesehen, erg = set(), []
    for z in str(text or "").replace(",", "\n").splitlines():
        z = z.strip()
        if z and z not in gesehen:
            gesehen.add(z)
            erg.append(z)
    return erg


OHNE_PLATZ = "(ohne Platz)"


def vier_augen_verletzt(gezaehlt_von, freigebend, aktiv=True):
    """Freigabe durch die zählende Person ist gesperrt (Ausnahme: technischer Benutzer Administrator)."""
    return bool(aktiv) and bool(gezaehlt_von) and gezaehlt_von == freigebend and freigebend != "Administrator"
