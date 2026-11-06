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

POSITIONSARTEN = ("Artikel", "Freitext", "Anzahlung", "Teilzahlung", "Schlusszahlung", "Gutschein Verkauf", "Gutschein Einloesung", "Storno", "Retoure", "Rabatt")
# Positionsarten, die die Belegsumme immer mindern (Betrag wird negativ gespeichert, egal wie eingegeben)
NEGATIVE_ARTEN = ("Gutschein Einloesung", "Retoure", "Rabatt")  # Rabatt: Rabattgutschein ph_shop (mindert Entgelt)
# Fremdwährung an der Kassa (Fachkritik 21 §5 CHF): nur Bar, Rückgeld immer EUR, Kurs als Int ×1 000 000 (EUR je 1 Einheit)
FREMDWAEHRUNGEN = ("CHF",)
KURS_SKALA = 1_000_000
CHF_KLEINSTE_EINHEIT_CENT = 5  # 5 Rappen

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
    menge = 1.0 if pos.get("menge") in (None, "") else float(pos["menge"])
    if menge <= 0:
        raise KassenFehler("Menge muss größer 0 sein (Rücknahme über Positionsart „Retoure“).")
    steuersatz = pos.get("steuersatz") or "Normal 20"
    out = dict(pos)
    if pos.get("listenpreis_cent") not in (None, "", 0) and (pos.get("rabatt_promille") or pos.get("rabatt_cent")):
        r = rabatt_berechnen(int(pos["listenpreis_cent"]), int(pos.get("rabatt_promille") or 0), int(pos.get("rabatt_cent") or 0))
        einzel = r["einzel_brutto_cent"]
        out.update(rabatt_promille=r["rabatt_promille"], rabatt_cent=r["rabatt_cent"], rabatt_gesamt_cent=_runde(menge * r["rabatt_cent"]))
        if (pos.get("rabatt_grund") or "").strip() == "":
            raise KassenFehler("Rabatt braucht einen Grund (z. B. Ausstellungsstück, Kundenkarte).")
    else:
        einzel = int(pos.get("einzel_brutto_cent") or 0)
    brutto = _runde(menge * einzel)
    if pos.get("art") in NEGATIVE_ARTEN and brutto > 0:
        brutto = -brutto  # Einlösung (Einzweck) / Rücknahme mindert die Summe
        einzel = -abs(einzel)
    netto, ust = netto_aus_brutto(brutto, steuersatz)
    out.update(menge=menge, einzel_brutto_cent=einzel, steuersatz=steuersatz, brutto_cent=brutto, netto_cent=netto, ust_cent=ust)
    return out


def rabatt_berechnen(listenpreis_cent: int, rabatt_promille: int = 0, rabatt_cent: int = 0) -> dict:
    """Rabatt je Stück auf den Brutto-Listenpreis: entweder echte Promille (100 = 10 %) oder fester Betrag.

    Rückgabe {einzel_brutto_cent, rabatt_cent (je Stück), rabatt_promille (tatsächlich, gerundet)}.
    Preis darf nicht negativ werden; Rabatt > 100 % ist ein Eingabefehler.
    """
    listen = int(listenpreis_cent)
    if listen <= 0:
        raise KassenFehler("Listenpreis muss größer 0 sein, wenn ein Rabatt gegeben wird.")
    if rabatt_promille and rabatt_cent:
        raise KassenFehler("Rabatt entweder in Prozent oder als Betrag angeben, nicht beides.")
    if rabatt_promille:
        if not 0 < int(rabatt_promille) <= 1000:
            raise KassenFehler("Rabatt in Prozent muss zwischen 0,1 % und 100 % liegen.")
        r = _runde(listen * int(rabatt_promille) / 1000)
    else:
        r = int(rabatt_cent)
    if r < 0 or r > listen:
        raise KassenFehler("Rabatt darf weder negativ noch höher als der Listenpreis sein.")
    return {"einzel_brutto_cent": listen - r, "rabatt_cent": r, "rabatt_promille": _runde(r * 1000 / listen)}


def rabatt_freigabe_noetig(positionen: list[dict], grenze_promille: int) -> list[int]:
    """Indizes der Positionen, deren Rabatt die Freigabegrenze (echte Promille) übersteigt; Grenze 0 = nie."""
    if not int(grenze_promille or 0):
        return []
    out = []
    for i, p in enumerate(positionen):
        listen = int(p.get("listenpreis_cent") or 0)
        if not listen:
            continue
        if p.get("rabatt_promille"):
            pm = int(p["rabatt_promille"])
        elif p.get("rabatt_cent"):
            pm = _runde(int(p["rabatt_cent"]) * 1000 / listen)
        else:
            continue
        if pm > int(grenze_promille):
            out.append(i)
    return out


def fremd_in_eur(fremd_cent: int, kurs_mikro: int) -> int:
    """Fremdwährungsbetrag (Rappen) → Euro-Cent zum Kurs (EUR je 1 CHF ×1 000 000), kaufmännisch gerundet."""
    if int(kurs_mikro or 0) <= 0:
        raise KassenFehler("Kurs fehlt oder ist ungültig.")
    if int(fremd_cent) < 0:
        raise KassenFehler("Fremdwährung nur für Einnahmen (Rückgeld immer in Euro).")
    return _runde(int(fremd_cent) * int(kurs_mikro) / KURS_SKALA)


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
    Fremdwährung (nur Bar): {"zahlart": "Bar", "fremdwaehrung": "CHF", "fremd_gegeben_cent": 10000, "kurs_mikro": 1045000}
    → gegeben_cent = Euro-Gegenwert, Rückgeld in Euro.
    Negativer Beleg (Storno/Retoure): siehe rueckzahlung_pruefen. Beleg 0,00 € (Retoure gegen Gutschein) braucht keine Zahlart.
    Rückgabe: {"zahlarten": [bereinigt mit betrag/gegeben/retour/barumsatz], "rueckgeld_cent": int, "barumsatz_cent": int}
    """
    gesamt = int(gesamt_cent)
    if not zahlarten:
        if gesamt == 0:
            return {"zahlarten": [], "rueckgeld_cent": 0, "barumsatz_cent": 0}
        raise KassenFehler("Keine Zahlart gewählt.")
    if gesamt < 0:
        return rueckzahlung_pruefen(gesamt, zahlarten)
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
        if z.get("fremdwaehrung") and art != "Bar":
            raise KassenFehler("Fremdwährung nur als Barzahlung.")
        if art == "Bar":
            if bar is not None:
                raise KassenFehler("Nur eine Bar-Zahlart je Beleg.")
            bar = eintrag
            if z.get("fremdwaehrung"):
                fw = z["fremdwaehrung"]
                if fw not in FREMDWAEHRUNGEN:
                    raise KassenFehler(f"Fremdwährung {fw!r} wird nicht angenommen.")
                fremd = int(z.get("fremd_gegeben_cent") or 0)
                if fremd <= 0:
                    raise KassenFehler("Gegebenen Fremdwährungsbetrag angeben.")
                if fw == "CHF" and fremd % CHF_KLEINSTE_EINHEIT_CENT:
                    raise KassenFehler("CHF-Bargeld nur in 5-Rappen-Schritten.")
                kurs = int(z.get("kurs_mikro") or 0)
                bar.update(fremdwaehrung=fw, fremd_gegeben_cent=fremd, kurs_mikro=kurs)
                bar["gegeben_cent"] = fremd_in_eur(fremd, kurs)
            else:
                bar["gegeben_cent"] = int(z.get("gegeben_cent") or betrag)
        else:
            summe_ohne_bar += betrag
        bereinigt.append(eintrag)

    if summe_ohne_bar > gesamt:
        raise KassenFehler("Karte, Gutschein oder Überweisung übersteigen den Belegbetrag.")
    offen = gesamt - summe_ohne_bar
    retour = 0
    if bar is not None:
        bar["betrag_cent"] = offen
        if bar["gegeben_cent"] < offen:
            raise KassenFehler("Gegebener Barbetrag reicht nicht aus.")
        retour = bar["gegeben_cent"] - offen
        bar["retour_cent"] = retour
    elif offen != 0:
        raise KassenFehler("Zahlarten decken den Belegbetrag nicht ab.")

    barumsatz = sum(e["betrag_cent"] for e in bereinigt if e["barumsatz"])
    return {"zahlarten": bereinigt, "rueckgeld_cent": retour, "barumsatz_cent": barumsatz}


# Rückzahlungswege bei negativem Beleg (Retoure/Storno): Bar aus der Lade, Rückerstattung auf die Karte
# (nur Terminal mit Original-PaymentIntent), Karte extern (manuell am Fremdterminal), Rücküberweisung.
# Auszahlung „als Gutschein“ ist keine Zahlart, sondern eine Position „Gutschein Verkauf“ (Beleg wird ≥ 0).
RUECKZAHLUNG_ZAHLARTEN = ("Bar", "Karte Stripe Terminal", "Karte extern", "Ueberweisung")


def rueckzahlung_pruefen(gesamt_cent: int, zahlarten: list[dict]) -> dict:
    """Negativer Beleg: alle Zahlarten ≤ 0 (Eingabe positiv oder negativ, wird negativ gespeichert), Summe = gesamt.
    Bar übernimmt den Rest, wenn ohne Betrag angegeben. Gutschein als Zahlart ist hier unzulässig."""
    gesamt = int(gesamt_cent)
    bereinigt, bar, summe = [], None, 0
    for z in zahlarten:
        art = z.get("zahlart")
        if art not in ZAHLARTEN:
            raise KassenFehler(f"Unbekannte Zahlart: {art!r}")
        if art not in RUECKZAHLUNG_ZAHLARTEN:
            raise KassenFehler("Rückzahlung als Gutschein: bitte Position „Gutschein Verkauf“ statt Zahlart verwenden.")
        if z.get("fremdwaehrung"):
            raise KassenFehler("Rückzahlungen nur in Euro.")
        betrag = -abs(int(z.get("betrag_cent") or 0))
        eintrag = {"zahlart": art, "betrag_cent": betrag, "gegeben_cent": betrag, "retour_cent": 0, "barumsatz": 1 if art in BARUMSATZ_ZAHLARTEN else 0}
        for k in ("zahlung", "terminal_payment_intent", "terminal", "erstattung_von_zahlung"):
            if z.get(k) is not None:
                eintrag[k] = z[k]
        if art == "Bar":
            if bar is not None:
                raise KassenFehler("Nur eine Bar-Zahlart je Beleg.")
            bar = eintrag
        else:
            summe += betrag
        bereinigt.append(eintrag)
    if summe < gesamt:
        raise KassenFehler("Rückzahlung übersteigt den Belegbetrag.")
    if bar is not None:
        bar["betrag_cent"] = bar["gegeben_cent"] = gesamt - summe
    elif summe != gesamt:
        raise KassenFehler("Rückzahlungswege decken den Belegbetrag nicht ab.")
    barumsatz = sum(e["betrag_cent"] for e in bereinigt if e["barumsatz"])
    return {"zahlarten": bereinigt, "rueckgeld_cent": 0, "barumsatz_cent": barumsatz}


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
