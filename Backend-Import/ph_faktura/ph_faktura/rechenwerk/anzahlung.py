"""Anzahlungsverrechnung (Vorbild SHD marahrw7, PLAN.md WP6 „Anzahlungsfluss“).

Prinzip:
  - Anzahlungsrechnung: eine Position „Anzahlung gemäß AB … %“ je USt-Satz des Auftrags (anteilig),
    USt wird mit Vereinnahmung fällig (Ist).
  - Schlussrechnung: alle Positionen, dann je USt-Satz die bereits abgerechneten Anzahlungen offen
    ausgewiesen (netto + USt) und abgezogen → Restbetrag. Die USt der Anzahlungen wird nicht doppelt
    geschuldet (Gesamt-USt minus bereits fällige).
  - Teilrechnung (Teillieferung): nur die gelieferten Mengen; Anzahlungen werden anteilig nach Wert
    (Teil-Netto / Auftrags-Netto) verrechnet, höchstens der noch nicht verrechnete Rest.
"""

from decimal import Decimal

from .steuer import rund, ust_betrag


def anzahlung_aufteilen(auftrag_aufteilung, prozent=None, betrag_brutto_cent=None):
    """Teilt eine Anzahlung (Prozent des Auftrags oder fester Bruttobetrag) auf die USt-Sätze des
    Auftrags auf – proportional zum Brutto je Satz. → Liste [{ust_satz_promille, netto_cent, ust_cent, brutto_cent}].
    Rundungsrest landet auf dem größten Satzblock, damit die Summe exakt stimmt."""
    gesamt_brutto = sum(int(a["brutto_cent"]) for a in auftrag_aufteilung)
    if gesamt_brutto <= 0:
        return []
    if betrag_brutto_cent is None:
        betrag_brutto_cent = rund(Decimal(gesamt_brutto) * Decimal(int(prozent or 0)) / Decimal(100))
    betrag_brutto_cent = int(betrag_brutto_cent)
    zeilen = []
    verteilt = 0
    for a in auftrag_aufteilung:
        anteil = rund(Decimal(betrag_brutto_cent) * Decimal(int(a["brutto_cent"])) / Decimal(gesamt_brutto))
        zeilen.append({"ust_satz_promille": int(a["ust_satz_promille"]), "brutto_cent": anteil})
        verteilt += anteil
    if zeilen:
        groesste = max(zeilen, key=lambda z: z["brutto_cent"])
        groesste["brutto_cent"] += betrag_brutto_cent - verteilt
    for z in zeilen:
        satz = z["ust_satz_promille"]
        netto = rund(Decimal(z["brutto_cent"]) * Decimal(10000) / Decimal(10000 + satz))
        z["netto_cent"] = netto
        z["ust_cent"] = z["brutto_cent"] - netto
    return [z for z in zeilen if z["brutto_cent"] != 0]


def verrechnen(leistung_aufteilung, anzahlungen, anteil=Decimal(1)):
    """Verrechnet Anzahlungen gegen die Leistungssummen je USt-Satz.

    leistung_aufteilung: [{ust_satz_promille, netto_cent, ust_cent, brutto_cent}] der (Teil-)Rechnung
    anzahlungen: [{anzahlungsrechnung, ust_satz_promille, netto_cent, ust_cent, brutto_cent}] noch nicht
                 verrechnete Anzahlungsbeträge (je Anzahlungsrechnung und Satz)
    anteil: Decimal 0..1 – bei Teilrechnung der Wertanteil der Teillieferung am Auftrag

    → {verrechnet: [...Zeilen wie anzahlungen mit anteiligen Beträgen...],
       rest: [{ust_satz_promille, netto_cent, ust_cent, brutto_cent}] (Leistung minus Anzahlung je Satz),
       anzahlung_netto_cent, anzahlung_ust_cent, anzahlung_brutto_cent, zahlbar_cent}
    Verrechnet wird höchstens die Leistungssumme je Satz (keine negative Schlussrechnung je Satz; ein
    Überhang bleibt als Guthaben-Hinweis offen → Gutschrift)."""
    anteil = Decimal(str(anteil))
    rest_je_satz = {int(l["ust_satz_promille"]): {"netto_cent": int(l["netto_cent"]), "ust_cent": int(l["ust_cent"]), "brutto_cent": int(l["brutto_cent"])} for l in leistung_aufteilung}
    verrechnet = []
    for a in anzahlungen:
        satz = int(a["ust_satz_promille"])
        if satz not in rest_je_satz:
            # Anzahlung zu einem Satz, der in dieser Rechnung nicht vorkommt → mit erstem Satz verrechnen
            if not rest_je_satz:
                continue
            satz_ziel = next(iter(rest_je_satz))
        else:
            satz_ziel = satz
        netto_soll = rund(Decimal(int(a["netto_cent"])) * anteil)
        brutto_soll = rund(Decimal(int(a["brutto_cent"])) * anteil)
        ziel = rest_je_satz[satz_ziel]
        brutto = min(brutto_soll, ziel["brutto_cent"])
        if brutto <= 0:
            continue
        netto = min(netto_soll, ziel["netto_cent"]) if brutto == brutto_soll else rund(Decimal(brutto) * Decimal(10000) / Decimal(10000 + satz))
        ust = brutto - netto
        ziel["netto_cent"] -= netto
        ziel["ust_cent"] -= ust
        ziel["brutto_cent"] -= brutto
        verrechnet.append({**a, "ust_satz_promille": satz, "netto_cent": netto, "ust_cent": ust, "brutto_cent": brutto})

    rest = [{"ust_satz_promille": s, **v} for s, v in rest_je_satz.items()]
    an = sum(v["netto_cent"] for v in verrechnet)
    au = sum(v["ust_cent"] for v in verrechnet)
    ab = sum(v["brutto_cent"] for v in verrechnet)
    return {
        "verrechnet": verrechnet,
        "rest": rest,
        "anzahlung_netto_cent": an,
        "anzahlung_ust_cent": au,
        "anzahlung_brutto_cent": ab,
        "zahlbar_cent": sum(v["brutto_cent"] for v in rest),
    }


def wertanteil(teil_netto_cent, auftrag_netto_cent):
    """Anteil einer Teillieferung am Auftrag (Decimal 0..1)."""
    if int(auftrag_netto_cent or 0) <= 0:
        return Decimal(1)
    a = Decimal(int(teil_netto_cent)) / Decimal(int(auftrag_netto_cent))
    return min(max(a, Decimal(0)), Decimal(1))


def offene_anzahlungen(anzahlungsrechnungen, bereits_verrechnet):
    """Noch nicht verrechnete Anzahlungsbeträge je Anzahlungsrechnung und Satz.
    anzahlungsrechnungen: [{name, datum, aufteilung: [{ust_satz_promille, netto_cent, ust_cent, brutto_cent}]}]
    bereits_verrechnet: [{anzahlungsrechnung, ust_satz_promille, netto_cent, ust_cent, brutto_cent}]"""
    verbraucht = {}
    for v in bereits_verrechnet:
        k = (v["anzahlungsrechnung"], int(v["ust_satz_promille"]))
        e = verbraucht.setdefault(k, {"netto_cent": 0, "ust_cent": 0, "brutto_cent": 0})
        for f in e:
            e[f] += int(v[f])
    offen = []
    for ar in anzahlungsrechnungen:
        for a in ar["aufteilung"]:
            k = (ar["name"], int(a["ust_satz_promille"]))
            v = verbraucht.get(k, {"netto_cent": 0, "ust_cent": 0, "brutto_cent": 0})
            rest = {f: int(a[f]) - v[f] for f in ("netto_cent", "ust_cent", "brutto_cent")}
            if rest["brutto_cent"] > 0:
                offen.append({"anzahlungsrechnung": ar["name"], "datum": ar.get("datum"), "ust_satz_promille": int(a["ust_satz_promille"]), **rest})
    return offen


def zahlungsplan_betraege(brutto_cent, plan):
    """Setzt betrag_cent je Zahlungsplan-Zeile aus Prozent (letzte Zeile nimmt den Rundungsrest).
    plan: Liste von dicts/Objekten mit prozent, betrag_cent. Zeilen ohne Prozent behalten ihren Betrag."""
    brutto_cent = int(brutto_cent or 0)
    summe = 0
    mit_prozent = []
    for z in plan:
        prozent = int(_g(z, "prozent") or 0)
        if prozent:
            betrag = rund(Decimal(brutto_cent) * Decimal(prozent) / Decimal(100))
            _s(z, "betrag_cent", betrag)
            mit_prozent.append(z)
        summe += int(_g(z, "betrag_cent") or 0)
    gesamt_prozent = sum(int(_g(z, "prozent") or 0) for z in plan)
    if mit_prozent and gesamt_prozent == 100 and summe != brutto_cent:
        letzte = mit_prozent[-1]
        _s(letzte, "betrag_cent", int(_g(letzte, "betrag_cent")) + (brutto_cent - summe))
    return plan


def _g(o, k):
    return o.get(k) if isinstance(o, dict) else getattr(o, k, None)


def _s(o, k, v):
    if isinstance(o, dict):
        o[k] = v
    else:
        setattr(o, k, v)


__all__ = ["anzahlung_aufteilen", "verrechnen", "wertanteil", "offene_anzahlungen", "zahlungsplan_betraege", "ust_betrag"]
