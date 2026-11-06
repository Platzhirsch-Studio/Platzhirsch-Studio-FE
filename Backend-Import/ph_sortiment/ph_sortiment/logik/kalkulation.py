"""Kalkulation: Einkaufspreis mit Gültigkeit, Kalkulationsfaktor je Marke, VK-Rundung, Varianten-/Preisgruppenmatrix.

Reine Logik ohne Frappe (Tests: ph_sortiment/tests/test_kalkulation.py).

Begriffe (Möbelhandel):
  - Listen-EK: Preis aus der Herstellerliste (DataNorm Preiskennzeichen 1 oder Hersteller-EK-Liste).
  - Netto-EK: Listen-EK minus Rabatt(e) des Lieferanten (echte Promille: 400 = 40 %), Kette multiplikativ.
  - Kalkulationsfaktor: VK brutto = Netto-EK × Faktor. Gespeichert als `*_promille` (1000 = ×1,0;
    2200 = ×2,2). Faktor je Marke, Override je Kategorie (PH Marke Kalkulation).
  - VK-Vorschläge aus dem Faktor sind **Vorschläge** (freigegeben = 0) – die Leitung gibt frei
    (Inhaber-Regel „nie schätzen“: ein angezeigter Preis braucht Quelle + Stand + Freigabe).
"""

from datetime import date
from decimal import ROUND_HALF_UP, Decimal

RUNDUNGEN = ("keine", "auf 1 Euro", "auf 5 Euro", "auf 10 Euro", "auf 9er-Endung")


def _d(v):
    if isinstance(v, date):
        return v
    return date.fromisoformat(str(v)[:10]) if v else None


def _rund(x):
    return int(Decimal(str(x)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def netto_ek_cent(listen_cent, rabatt_promille=0, rabatt2_promille=0):
    """Listen-EK minus Rabattkette. 100000, 400, 50 → 100000 × 0,6 × 0,95 = 57000."""
    if listen_cent is None:
        return None
    wert = Decimal(int(listen_cent))
    for r in (rabatt_promille, rabatt2_promille):
        r = int(r or 0)
        if not 0 <= r <= 1000:
            raise ValueError("Rabatt muss zwischen 0 und 1000 Promille liegen")
        wert = wert * (Decimal(1000 - r) / Decimal(1000))
    return _rund(wert)


def gueltiger_ek(zeilen, heute=None, lieferant=None):
    """Gültige EK-Zeile zum Datum: ab ≤ heute ≤ bis (bis leer = offen); jüngstes ab gewinnt.
    zeilen: dicts mit ab, bis, netto_ek_cent, lieferant. Optional nur ein Lieferant."""
    heute = _d(heute) or date.today()
    kandidaten = []
    for z in zeilen or []:
        if lieferant and z.get("lieferant") and z.get("lieferant") != lieferant:
            continue
        ab, bis = _d(z.get("ab")), _d(z.get("bis"))
        if ab and ab > heute:
            continue
        if bis and bis < heute:
            continue
        if z.get("netto_ek_cent") in (None, ""):
            continue
        kandidaten.append((ab or date.min, z))
    if not kandidaten:
        return None
    kandidaten.sort(key=lambda t: t[0])
    return kandidaten[-1][1]


def runden(cent, rundung="keine"):
    """VK-Rundung (immer aufwärts, damit der Faktor nicht unterschritten wird)."""
    cent = int(cent)
    if rundung in (None, "", "keine"):
        return cent
    if rundung == "auf 1 Euro":
        return -(-cent // 100) * 100
    if rundung == "auf 5 Euro":
        return -(-cent // 500) * 500
    if rundung == "auf 10 Euro":
        return -(-cent // 1000) * 1000
    if rundung == "auf 9er-Endung":
        euro = -(-cent // 100)
        rest = euro % 10
        euro += (9 - rest) if rest != 9 else 0
        return euro * 100
    raise ValueError("Unbekannte Rundung {0}".format(rundung))


def faktor_fuer(marke_faktor_promille, kategorie=None, overrides=None):
    """(faktor_promille, rundung|None): Override der Kategorie vor Marke. overrides: [{kategorie, faktor_promille, rundung}]."""
    for o in overrides or []:
        if kategorie and o.get("kategorie") == kategorie and int(o.get("faktor_promille") or 0) > 0:
            return int(o["faktor_promille"]), o.get("rundung") or None
    return int(marke_faktor_promille or 0), None


def vk_aus_ek(ek_cent, faktor_promille, rundung="keine"):
    """VK brutto aus Netto-EK × Faktor (Promille), danach Rundung. Ohne Faktor → None (kein Vorschlag)."""
    if ek_cent in (None, "") or not faktor_promille:
        return None
    if int(faktor_promille) < 1000:
        raise ValueError("Kalkulationsfaktor unter 1,0 – VK läge unter EK")
    return runden(_rund(Decimal(int(ek_cent)) * Decimal(int(faktor_promille)) / Decimal(1000)), rundung)


def rohertrag_promille(ek_cent, vk_brutto_cent, ust_promille=2000):
    """Rohertrag in echten Promille vom Netto-VK (ust_promille in Basispunkten: 2000 = 20 %, CONVENTIONS 2)."""
    if not vk_brutto_cent or ek_cent is None:
        return None
    netto = Decimal(int(vk_brutto_cent)) * Decimal(10000) / Decimal(10000 + int(ust_promille))
    return _rund((netto - Decimal(int(ek_cent))) * 1000 / netto)


# ── Varianten / Preisgruppen ─────────────────────────────────────────────


def kombi_schluessel(auswahl):
    """{'bezug': 'PG3', 'breite': '200'} → 'breite=200|bezug=PG3' (Gruppen alphabetisch)."""
    return "|".join(f"{g}={auswahl[g]}" for g in sorted(auswahl) if auswahl[g] not in (None, ""))


def _teile(schluessel):
    out = {}
    for teil in str(schluessel or "").split("|"):
        if "=" in teil:
            g, w = teil.split("=", 1)
            out[g.strip()] = w.strip()
    return out


def _passt(teile, gewaehlt):
    """Matrix-Teil 'gruppe=wert' passt, wenn die gewählte Option dieser Gruppe option_id oder preisgruppe = wert hat."""
    for g, w in teile.items():
        o = gewaehlt.get(g)
        if not o or w not in (str(o.get("option_id") or ""), str(o.get("preisgruppe") or "")):
            return False
    return True


def ausschluesse(gewaehlt):
    """Fehlertexte für Optionen, die laut `nicht_kombinierbar_mit` (Komma-Liste 'gruppe=option' oder option_id) kollidieren."""
    fehler = []
    ids = {str(o.get("option_id")) for o in gewaehlt.values() if o.get("option_id")}
    paare = {f"{g}={o.get('option_id')}" for g, o in gewaehlt.items() if o.get("option_id")}
    for g, o in gewaehlt.items():
        for x in str(o.get("nicht_kombinierbar_mit") or "").replace(";", ",").split(","):
            x = x.strip()
            if x and (x in paare or x in ids):
                fehler.append(f"{g}={o.get('option_id')} ist nicht kombinierbar mit {x}")
    return fehler


def variante_preis(basis_vk_cent, gewaehlt, matrix=None, basis_ek_cent=None, heute=None, pflicht_gruppen=()):
    """Preis einer Variante.

    gewaehlt: {gruppe_key: {option_id, preisgruppe, aufpreis_cent, ek_aufpreis_cent, nicht_kombinierbar_mit}}
    matrix: [{kombination: 'bezug=PG3|breite=200', vk_cent, ek_cent, ab, bis}] – die passende Zeile mit den
            meisten Teilen gewinnt (bei Gleichstand das jüngste ab). Sie ersetzt Basis + Aufpreise der
            abgedeckten Gruppen; Aufpreise der übrigen Gruppen kommen dazu.
    Rückgabe: {vk_cent, ek_cent, quelle 'matrix'|'aufpreise', matrix_kombination, fehler[]}
    """
    heute = _d(heute) or date.today()
    fehler = [f"Pflichtgruppe {g} ohne Auswahl" for g in pflicht_gruppen if g not in gewaehlt]
    fehler += ausschluesse(gewaehlt)
    beste = None
    for z in matrix or []:
        ab, bis = _d(z.get("ab")), _d(z.get("bis"))
        if (ab and ab > heute) or (bis and bis < heute):
            continue
        teile = _teile(z.get("kombination"))
        if not teile or not _passt(teile, gewaehlt):
            continue
        rang = (len(teile), ab or date.min)
        if beste is None or rang > beste[0]:
            beste = (rang, z, teile)
    vk = basis_vk_cent
    ek = basis_ek_cent
    abgedeckt = set()
    quelle = "aufpreise"
    if beste:
        _, z, teile = beste
        abgedeckt = set(teile)
        quelle = "matrix"
        vk = z.get("vk_cent") if z.get("vk_cent") not in (None, "") else vk
        ek = z.get("ek_cent") if z.get("ek_cent") not in (None, "") else ek
    for g, o in gewaehlt.items():
        if g in abgedeckt:
            continue
        if vk is not None:
            vk = int(vk) + int(o.get("aufpreis_cent") or 0)
        if ek is not None:
            ek = int(ek) + int(o.get("ek_aufpreis_cent") or 0)
    return {"vk_cent": vk, "ek_cent": ek, "quelle": quelle, "matrix_kombination": beste[1].get("kombination") if beste else None, "fehler": fehler}


# ── Lieferantenkonditionen: Rabattstaffel, Zu-/Abschläge, Skonto ─────────


def rabatt_fuer(staffeln, standard_promille=0, marke=None, kategorie=None, bestellwert_cent=0):
    """Rabatt (echte Promille) aus PH Lieferant Rabattstaffel: spezifischste Zeile (Marke+Kategorie > Kategorie > Marke >
    allgemein), darin die höchste Schwelle ab_wert_cent <= Bestellwert. Ohne Treffer: Standardrabatt (Standard 0)."""
    def rang(z):
        m, k = z.get("marke"), z.get("kategorie")
        if m and k:
            return 3 if (m == marke and k == kategorie) else -1
        if k:
            return 2 if k == kategorie else -1
        if m:
            return 1 if m == marke else -1
        return 0

    beste = None
    for z in staffeln or []:
        r = rang(z)
        schwelle = int(z.get("ab_wert_cent") or 0)
        if r < 0 or schwelle > int(bestellwert_cent or 0):
            continue
        schluessel = (r, schwelle)
        if beste is None or schluessel > beste[0]:
            beste = (schluessel, z)
    wert = int(beste[1].get("rabatt_promille") or 0) if beste else int(standard_promille or 0)
    if not 0 <= wert <= 1000:
        raise ValueError("Rabatt muss zwischen 0 und 1000 Promille liegen")
    return wert


def zuschlaege_cent(summe_ek_cent, mindestbestellwert_cent=0, mindermengenzuschlag_cent=0, fracht_pauschale_cent=0, frachtfrei_ab_cent=0):
    """Zu-/Abschläge einer Bestellung: Mindermengenzuschlag unter Mindestbestellwert, Frachtpauschale bis frachtfrei-ab."""
    summe = int(summe_ek_cent or 0)
    z = 0
    if mindestbestellwert_cent and summe < int(mindestbestellwert_cent):
        z += int(mindermengenzuschlag_cent or 0)
    if fracht_pauschale_cent and not (frachtfrei_ab_cent and summe >= int(frachtfrei_ab_cent)):
        z += int(fracht_pauschale_cent)
    return z


def skonto_cent(betrag_cent, skonto_promille=0):
    """Skontobetrag (echte Promille vom Betrag, kaufmännisch gerundet)."""
    return _rund(Decimal(int(betrag_cent or 0)) * Decimal(int(skonto_promille or 0)) / Decimal(1000))
