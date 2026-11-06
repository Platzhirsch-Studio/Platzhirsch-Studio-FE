"""UVA-Abgrenzung der Kassenumsätze (ph_kassa) gegenüber Faktura-Belegen – ohne Frappe.

Problem (Fachkritik 21 F5/P6, 50-backend-luecken): Kassenbelege enthalten echte Umsätze (Artikel, Freitext,
Retoure, Einzweck-Gutschein), aber auch reine **Zahlungseingänge** (Teil-/Schlusszahlung auf eine gestellte
Rechnung – USt entstand mit der Rechnung, § 19 Abs 2 Z 1 lit a UStG Soll) und **Anzahlungen** (USt mit
Vereinnahmung, Mindest-Ist). Eine Anzahlung, die in ph_faktura auf einer Anzahlungsrechnung als Zahlung
verbucht ist, erfasst die UVA bereits dort (Ist) – sie darf aus der Kassa nicht noch einmal kommen.
Mehrzweck-Gutscheine sind beim Verkauf kein Umsatz (§ 4 Abs 4 lit c UStG i. V. m. RL 2016/1065), erst die
Einlösung (Zahlart „Gutschein“) ist Umsatz der verkauften Ware.

Gleiche Regel für den Kassa-Report „PH Kassenumsatz nach Steuersatz“ (ph_kassa importiert diese Funktion) und für
PH UVA Auswertung (ph_faktura) – eine Quelle der Wahrheit.
"""

from __future__ import annotations

KASSA_SATZ = {"Normal 20": 2000, "Ermaessigt-1 10": 1000, "Ermaessigt-2 13": 1300, "Null 0": 0, "Besonders 19": 1900, "Steuerfrei": 0}
NULLBELEGE = ("Startbeleg", "Nullbeleg", "Monatsbeleg", "Jahresbeleg", "Schlussbeleg", "Sammelbeleg")

GRUENDE = {
    "zahlung_auf_rechnung": "Zahlung auf gestellte Rechnung (USt mit der Rechnung)",
    "anzahlung_ueber_faktura": "Anzahlung auf Anzahlungsrechnung (UVA über Faktura, Ist)",
    "gutschein_mehrzweck": "Verkauf Mehrzweck-Gutschein (kein Umsatz)",
    "barverkauf_rechnung": "Kassenbeleg mit Barverkaufsrechnung – Umsatz aus der Kassa, Rechnung nicht doppelt",
}


def wirksame_art(pos: dict) -> str:
    """Storno-Positionen tragen die Ursprungsart (Feld ursprungsart, ph_kassa) – sonst die eigene Art."""
    art = pos.get("art") or "Artikel"
    if art == "Storno" and pos.get("ursprungsart"):
        return pos["ursprungsart"]
    return art


def klassifiziere_position(beleg: dict, pos: dict, ar_belege: set | frozenset = frozenset()) -> str | None:
    """None = steuerbarer Kassenumsatz; sonst Schlüssel aus GRUENDE (nicht aus der Kassa in die UVA)."""
    art = wirksame_art(pos)
    name = beleg.get("storno_von") or beleg.get("name")
    if art in ("Teilzahlung", "Schlusszahlung"):
        return "zahlung_auf_rechnung"
    if art == "Anzahlung":
        if beleg.get("rechnung") or name in ar_belege or beleg.get("name") in ar_belege:
            return "anzahlung_ueber_faktura"
        return None  # Anzahlung ohne Anzahlungsrechnung: Mindest-Ist aus der Kassa
    if art == "Gutschein Verkauf" and KASSA_SATZ.get(pos.get("steuersatz") or "", 0) == 0:
        return "gutschein_mehrzweck"
    return None


def kassa_umsaetze(belege: list[dict], ar_belege: set | frozenset = frozenset()) -> dict:
    """Aggregation signierter Kassenbelege für die UVA.

    beleg: {name, belegart, trainings, rechnung, storno_von, positionen: [{art, ursprungsart, steuersatz, netto_cent, ust_cent, brutto_cent}]}
    ar_belege: Namen der Kassenbelege, deren Anzahlung auf einer Anzahlungsrechnung verbucht ist.
    → {"je_satz": {satz_promille: {"netto_cent", "ust_cent", "brutto_cent", "anzahl"}},
       "nicht_umsatz": {grund: brutto_cent}, "anzahlungen_ist": {"brutto_cent", "ust_cent"}, "belege": n}
    """
    je_satz: dict[int, dict] = {}
    nicht: dict[str, int] = {}
    anz = {"brutto_cent": 0, "ust_cent": 0}
    n = 0
    for b in belege or []:
        if int(b.get("trainings") or 0) or b.get("belegart") in ("Trainingsbeleg",) + NULLBELEGE:
            continue
        n += 1
        for p in b.get("positionen") or []:
            grund = klassifiziere_position(b, p, ar_belege)
            brutto = int(p.get("brutto_cent") or 0)
            if grund:
                nicht[grund] = nicht.get(grund, 0) + brutto
                continue
            satz = KASSA_SATZ.get(p.get("steuersatz") or "Normal 20", 2000)
            e = je_satz.setdefault(satz, {"netto_cent": 0, "ust_cent": 0, "brutto_cent": 0, "anzahl": 0})
            e["netto_cent"] += int(p.get("netto_cent") or 0)
            e["ust_cent"] += int(p.get("ust_cent") or 0)
            e["brutto_cent"] += brutto
            e["anzahl"] += 1
            if wirksame_art(p) == "Anzahlung":
                anz["brutto_cent"] += brutto
                anz["ust_cent"] += int(p.get("ust_cent") or 0)
    return {"je_satz": je_satz, "nicht_umsatz": nicht, "anzahlungen_ist": anz, "belege": n}


def skonto_aufteilen(skonto_cent: int, aufteilung: list[dict]) -> list[dict]:
    """Skonto (Entgeltsminderung § 16 UStG) im Verhältnis der Bruttobeträge je Satz auf netto/ust aufteilen.
    aufteilung: [{"ust_satz_promille", "brutto_cent"}] → [{"ust_satz_promille", "netto_cent", "ust_cent", "brutto_cent"}]
    Rundungsrest auf die größte Zeile, Summe stimmt exakt."""
    from decimal import ROUND_HALF_UP, Decimal

    s = int(skonto_cent)
    gesamt = sum(int(a.get("brutto_cent") or 0) for a in aufteilung or [])
    if not s or not gesamt:
        return []
    out = []
    for a in aufteilung:
        b = int(a.get("brutto_cent") or 0)
        anteil = int((Decimal(s) * Decimal(b) / Decimal(gesamt)).quantize(Decimal(1), ROUND_HALF_UP))
        out.append({"ust_satz_promille": int(a.get("ust_satz_promille") or 0), "brutto_cent": anteil})
    diff = s - sum(o["brutto_cent"] for o in out)
    if diff and out:
        max(out, key=lambda o: abs(o["brutto_cent"]))["brutto_cent"] += diff
    for o in out:
        p = o["ust_satz_promille"]
        netto = int((Decimal(o["brutto_cent"]) * Decimal(10000) / Decimal(10000 + p)).quantize(Decimal(1), ROUND_HALF_UP)) if p else o["brutto_cent"]
        o["netto_cent"] = netto
        o["ust_cent"] = o["brutto_cent"] - netto
    return out
