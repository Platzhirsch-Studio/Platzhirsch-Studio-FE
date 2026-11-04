"""Umsatzsteuer des Shops – reine Logik, Regeln 1:1 aus src/lib/shop/ust.js (Stand 31.10.2026, Entwurf,
Steuerberater-Durchsicht offen). Beträge in Cent (int), Sätze als Int ×100 (CONVENTIONS 2: 2000 = 20,00 %;
Feldname „promille“ historisch).

Regeln (Quellen in ust.js):
  1. Bruttopreise; enthaltene USt = Brutto − round(Brutto / (1 + Satz)).
  2./3. AT 20 % normal, 10 % ermäßigt (Bücher/Bildbände, § 10 Abs 2 Z 1 lit a UStG).
  4. Versand folgt der Ware; gemischter Warenkorb → Versand im Verhältnis der Bruttowarenwerte je Satz.
  5. Abholung im Showroom → immer AT.
  6. Versand DE → AT, solange OSS nicht aktiv; mit OSS DE 19 % / 7 %.
  7. CH: kein Versand (nur Abholung).
"""

UST_SAETZE_PROMILLE = {"AT": {"normal": 2000, "ermaessigt": 1000}, "DE": {"normal": 1900, "ermaessigt": 700}}
ERMAESSIGT_KATEGORIEN = ("bildband",)


def ust_klasse(kategorie, ermaessigt=ERMAESSIGT_KATEGORIEN):
    return "ermaessigt" if (kategorie or "") in ermaessigt else "normal"


def steuerland(lieferart="abholung", land=None, oss_aktiv=False):
    """'AT' | 'DE' | None (None = Lieferung nicht unterstützt, z. B. CH-Versand)."""
    if lieferart != "versand":
        return "AT"
    if land == "AT":
        return "AT"
    if land == "DE":
        return "DE" if oss_aktiv else "AT"
    return None


def ust_satz_promille(klasse=None, kategorie=None, land="AT"):
    k = klasse or ust_klasse(kategorie)
    saetze = UST_SAETZE_PROMILLE.get(land)
    if not saetze or k not in saetze:
        raise ValueError(f"ust: unbekanntes Steuerland/Klasse {land}/{k}")
    return saetze[k]


def ust_aus_brutto(brutto_cent, satz_promille):
    """Enthaltene USt eines Bruttobetrags (kaufmännisch gerundet wie Math.round in JS)."""
    netto = _round_half_up(brutto_cent * 10000 / (10000 + satz_promille))
    return int(brutto_cent) - netto


def _round_half_up(x):
    # Math.round in JavaScript rundet .5 immer auf (nicht banker's rounding).
    import math

    return int(math.floor(x + 0.5))


def anteilig(gesamt, gewichte):
    """`gesamt` im Verhältnis `gewichte` aufteilen, Cent genau, Rest an die größten Bruchteile (ust.js anteilig)."""
    summe = sum(gewichte)
    if not summe > 0 or not gesamt:
        return [(gesamt or 0) if i == 0 else 0 for i in range(len(gewichte))]
    teile = [int((gesamt * g) // summe) for g in gewichte]
    rest = gesamt - sum(teile)
    reihenfolge = sorted(range(len(gewichte)), key=lambda i: (-((gesamt * gewichte[i]) / summe - teile[i]), -gewichte[i]))
    j = 0
    while rest > 0:
        teile[reihenfolge[j % len(reihenfolge)]] += 1
        j += 1
        rest -= 1
    return teile


def aufteilung(zeilen, versand_cent=0, lieferart="abholung", land=None, oss_aktiv=False):
    """Aufteilung der enthaltenen USt einer Bestellung.

    zeilen: [{summe_cent, kategorie?, ust_klasse?}]
    → {"steuerland", "posten": [{satz_promille, brutto_cent, waren_cent, versand_cent, ust_cent, netto_cent}],
       "ust_cent", "zeilen_saetze": [promille je Zeile]}
    """
    sl = steuerland(lieferart, land, oss_aktiv)
    if not sl:
        return {"steuerland": None, "posten": [], "ust_cent": 0, "zeilen_saetze": [None for _ in zeilen]}
    zeilen_saetze = [ust_satz_promille(z.get("ust_klasse"), z.get("kategorie"), sl) for z in zeilen]
    pro_satz = {}
    for z, s in zip(zeilen, zeilen_saetze):
        pro_satz[s] = pro_satz.get(s, 0) + int(z.get("summe_cent") or 0)
    if not pro_satz and versand_cent:
        pro_satz[UST_SAETZE_PROMILLE[sl]["normal"]] = 0
    saetze = sorted(pro_satz.keys(), reverse=True)
    waren = [pro_satz[s] for s in saetze]
    gewichte = waren if any(w for w in waren) else [1 if i == 0 else 0 for i in range(len(waren))]
    versand = anteilig(int(versand_cent or 0), gewichte) if saetze else []
    posten = []
    for i, satz in enumerate(saetze):
        brutto = waren[i] + versand[i]
        ust = ust_aus_brutto(brutto, satz)
        posten.append({"satz_promille": satz, "brutto_cent": brutto, "waren_cent": waren[i], "versand_cent": versand[i], "ust_cent": ust, "netto_cent": brutto - ust})
    return {"steuerland": sl, "posten": posten, "ust_cent": sum(p["ust_cent"] for p in posten), "zeilen_saetze": zeilen_saetze}
