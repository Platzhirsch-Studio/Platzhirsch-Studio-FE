"""Beträge, Steuersätze, Positionssummen, Rückgeld – ohne Frappe.

Quellen: PLAN.md WP10a (RKSV-Satzgruppen Normal 20 / Ermäßigt-1 10 / Ermäßigt-2 13 / Null 0 /
Besonders 19 / Steuerfrei), CONVENTIONS.md 2 (Geld immer Cent als Int, Promille als Int).
Alle Funktionen sind frei von Nebenwirkungen; Eingaben sind einfache dicts/Listen, damit die
Desk-Page, die Controller und die Unit-Tests dieselbe Rechnung nutzen.
"""

from __future__ import annotations

# Steuersatz-Bezeichnung (Select-Wert in PH Kassenbeleg Position, WP10a) → Satz als Int ×100 (2000 = 20,00 %),
# gleiche Skala wie `ust_satz_promille` in ph_shop/ph_faktura (CONVENTIONS 2).
STEUERSAETZE = {
    "Normal 20": 2000,
    "Ermaessigt-1 10": 1000,
    "Ermaessigt-2 13": 1300,
    "Null 0": 0,
    "Besonders 19": 1900,
    "Steuerfrei": 0,
}

# Steuersatz → Betragsfeld des Kassenbelegs (Pflichtbestandteil der RKSV-Signatur, WP10a)
RKSV_BETRAGSFELD = {
    "Normal 20": "betrag_normal_cent",
    "Ermaessigt-1 10": "betrag_ermaessigt1_cent",
    "Ermaessigt-2 13": "betrag_ermaessigt2_cent",
    "Null 0": "betrag_null_cent",
    "Steuerfrei": "betrag_null_cent",
    "Besonders 19": "betrag_besonders_cent",
}

STEUERSATZ_KURZ = {
    "Normal 20": "A 20 %",
    "Ermaessigt-1 10": "B 10 %",
    "Ermaessigt-2 13": "C 13 %",
    "Null 0": "D 0 %",
    "Besonders 19": "E 19 %",
    "Steuerfrei": "F 0 %",
}

ZAHLARTEN = ("Bar", "Karte Stripe Terminal", "Karte extern", "Gutschein", "Ueberweisung")
BARUMSATZ_ZAHLARTEN = ("Bar", "Karte Stripe Terminal", "Karte extern", "Gutschein")  # RKSV: Karte = Barumsatz

POSITIONSARTEN = ("Artikel", "Freitext", "Anzahlung", "Teilzahlung", "Schlusszahlung", "Gutschein Verkauf", "Gutschein Einloesung", "Storno")

# Euro-Stückelung für Zählprotokoll und Rückgeld-Vorschlag (Cent, absteigend)
STUECKELUNG_CENT = (50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1)


class KassenFehler(ValueError):
    """Fachlicher Fehler der Kassenlogik (Controller übersetzt ihn in frappe.throw)."""


def promille(steuersatz: str) -> int:
    if steuersatz not in STEUERSAETZE:
        raise KassenFehler(f"Unbekannter Steuersatz: {steuersatz!r}")
    return STEUERSAETZE[steuersatz]


def netto_aus_brutto(brutto_cent: int, steuersatz: str) -> tuple[int, int]:
    """(netto_cent, ust_cent) aus Bruttobetrag; kaufmännisch gerundet, Summe stimmt immer."""
    p = promille(steuersatz)  # Int ×100: 2000 = 20,00 % (CONVENTIONS 2, Feld ust_satz_promille)
    brutto = int(brutto_cent)
    if p == 0:
        return brutto, 0
    netto = _runde(brutto * 10000 / (10000 + p))
    return netto, brutto - netto


def _runde(x: float) -> int:
    """Kaufmännisch runden (0,5 → auf), auch für negative Beträge symmetrisch."""
    if x < 0:
        return -_runde(-x)
    return int(x + 0.5)


def position_berechnen(pos: dict) -> dict:
    """Ergänzt eine Position um brutto_cent, netto_cent, ust_cent.

    Erwartet: menge (Zahl, Standard 1), einzel_brutto_cent (Int), steuersatz (Select-Wert).
    Bei Storno-/Einlösungspositionen dürfen Beträge negativ sein.
    """
    menge = float(pos.get("menge") or 1)
    einzel = int(pos.get("einzel_brutto_cent") or 0)
    steuersatz = pos.get("steuersatz") or "Normal 20"
    brutto = _runde(menge * einzel)
    if pos.get("art") == "Gutschein Einloesung" and brutto > 0:
        brutto = -brutto  # Einlösung mindert die Summe
    netto, ust = netto_aus_brutto(brutto, steuersatz)
    out = dict(pos)
    out.update(menge=menge, einzel_brutto_cent=einzel, steuersatz=steuersatz, brutto_cent=brutto, netto_cent=netto, ust_cent=ust)
    return out


def summen(positionen: list[dict]) -> dict:
    """Summen eines Belegs: je Steuersatz (netto/ust/brutto), RKSV-Betragsfelder, gesamt.

    Rückgabe:
      {"gesamt_cent": int, "netto_cent": int, "ust_cent": int,
       "je_satz": {steuersatz: {"netto_cent", "ust_cent", "brutto_cent", "anzahl"}},
       "rksv": {"betrag_normal_cent": …, "betrag_ermaessigt1_cent": …, …},
       "positionen": [berechnete Positionen]}
    """
    berechnet = [position_berechnen(p) for p in positionen]
    je_satz: dict[str, dict] = {}
    rksv = {feld: 0 for feld in sorted(set(RKSV_BETRAGSFELD.values()))}
    for p in berechnet:
        s = je_satz.setdefault(p["steuersatz"], {"netto_cent": 0, "ust_cent": 0, "brutto_cent": 0, "anzahl": 0})
        s["netto_cent"] += p["netto_cent"]
        s["ust_cent"] += p["ust_cent"]
        s["brutto_cent"] += p["brutto_cent"]
        s["anzahl"] += 1
        rksv[RKSV_BETRAGSFELD[p["steuersatz"]]] += p["brutto_cent"]
    gesamt = sum(p["brutto_cent"] for p in berechnet)
    return {
        "gesamt_cent": gesamt,
        "netto_cent": sum(p["netto_cent"] for p in berechnet),
        "ust_cent": sum(p["ust_cent"] for p in berechnet),
        "je_satz": je_satz,
        "rksv": rksv,
        "positionen": berechnet,
    }


def rueckgeld(gesamt_cent: int, gegeben_cent: int) -> int:
    """Rückgeld bei Barzahlung; negativ = es fehlt noch Geld."""
    return int(gegeben_cent) - int(gesamt_cent)


def stueckelung(betrag_cent: int) -> list[tuple[int, int]]:
    """Zerlegt einen Cent-Betrag in Scheine/Münzen: [(stueck_cent, anzahl), …] (nur verwendete)."""
    rest = int(betrag_cent)
    if rest < 0:
        raise KassenFehler("Stückelung nur für positive Beträge.")
    out = []
    for s in STUECKELUNG_CENT:
        n, rest = divmod(rest, s)
        if n:
            out.append((s, n))
    return out


def zahlarten_pruefen(gesamt_cent: int, zahlarten: list[dict]) -> dict:
    """Prüft die Zahlartenaufteilung und berechnet Rückgeld.

    zahlarten: [{"zahlart": "Bar", "betrag_cent": 5000, "gegeben_cent": 10000}, {"zahlart": "Gutschein", "betrag_cent": 2000, "rest_cent": 2500}, …]
    Regeln (PLAN.md WP10b): nur Bar darf über dem offenen Betrag liegen (Rückgeld); Karte/Gutschein/
    Überweisung nie; Gutschein nie über seinem Restwert; Summe aller Zahlarten = gesamt.
    Rückgabe: {"zahlarten": [bereinigt mit betrag/gegeben/retour/barumsatz], "rueckgeld_cent": int, "barumsatz_cent": int}
    """
    gesamt = int(gesamt_cent)
    if not zahlarten:
        raise KassenFehler("Keine Zahlart gewählt.")
    bereinigt = []
    summe_ohne_bar = 0
    bar = None
    for z in zahlarten:
        art = z.get("zahlart")
        if art not in ZAHLARTEN:
            raise KassenFehler(f"Unbekannte Zahlart: {art!r}")
        betrag = int(z.get("betrag_cent") or 0)
        if betrag < 0:
            raise KassenFehler("Zahlbetrag darf nicht negativ sein.")
        eintrag = {"zahlart": art, "betrag_cent": betrag, "gegeben_cent": betrag, "retour_cent": 0, "barumsatz": 1 if art in BARUMSATZ_ZAHLARTEN else 0}
        for k in ("gutschein", "zahlung", "terminal_payment_intent", "terminal", "rest_cent"):
            if z.get(k) is not None:
                eintrag[k] = z[k]
        if art == "Gutschein" and z.get("rest_cent") is not None and betrag > int(z["rest_cent"]):
            raise KassenFehler("Gutschein-Betrag übersteigt den Restwert.")
        if art == "Bar":
            if bar is not None:
                raise KassenFehler("Nur eine Bar-Zahlart je Beleg.")
            bar = eintrag
            bar["gegeben_cent"] = int(z.get("gegeben_cent") or betrag)
        else:
            summe_ohne_bar += betrag
        bereinigt.append(eintrag)

    if gesamt >= 0 and summe_ohne_bar > gesamt:
        raise KassenFehler("Karte, Gutschein oder Überweisung übersteigen den Belegbetrag.")
    offen = gesamt - summe_ohne_bar
    retour = 0
    if bar is not None:
        if gesamt >= 0:
            bar["betrag_cent"] = offen
            if bar["gegeben_cent"] < offen:
                raise KassenFehler("Gegebener Barbetrag reicht nicht aus.")
            retour = bar["gegeben_cent"] - offen
            bar["retour_cent"] = retour
        else:  # Storno/Rückzahlung bar: Betrag negativ, kein Rückgeld-Begriff
            bar["betrag_cent"] = offen
            bar["gegeben_cent"] = offen
    elif offen != 0:
        raise KassenFehler("Zahlarten decken den Belegbetrag nicht ab.")

    barumsatz = sum(e["betrag_cent"] for e in bereinigt if e["barumsatz"])
    return {"zahlarten": bereinigt, "rueckgeld_cent": retour, "barumsatz_cent": barumsatz}


def beleg_pruefen(positionen: list[dict], zahlarten: list[dict]) -> dict:
    """Komplettprüfung eines Belegentwurfs (Page → Server): Summen + Zahlarten + Rückgeld."""
    if not positionen:
        raise KassenFehler("Beleg ohne Positionen.")
    s = summen(positionen)
    z = zahlarten_pruefen(s["gesamt_cent"], zahlarten)
    return {**s, **z}


def format_betrag(cent: int, waehrung: str = "EUR") -> str:
    """1234567 → '12.345,67 €' (wie ph_core.utils.druck.ph_betrag, hier ohne Frappe)."""
    if cent is None:
        return ""
    euro = int(cent) / 100
    s = f"{euro:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{s} €" if waehrung == "EUR" else f"{s} {waehrung}"


def format_rksv(cent: int) -> str:
    """Betragsformat der RKSV-Payload: Komma, zwei Dezimalen, Minus vorn (z. B. '-12,50')."""
    c = int(cent)
    vz = "-" if c < 0 else ""
    c = abs(c)
    return f"{vz}{c // 100},{c % 100:02d}"
