"""Teilstorno / Teilerstattung einer Shop-Bestellung – reine Logik (ohne Frappe, testbar per unittest).

Regeln (Entwurf, Steuerberater-Durchsicht offen – wie ust.py):
  1. Positionsweise: je Zeile eine Menge zurück. Betrag = anteiliger Zeilenbetrag; die letzte offene Menge einer
     Zeile bekommt den Rest (keine Rundungsreste, Summe aller Teilerstattungen = Zeilenbetrag).
  2. Versand: optional ganz oder teilweise; Aufteilung auf die Steuersätze wie in der Bestellung
     (Versand folgt der Ware, ust.py Regel 4) – aus den noch offenen Versandanteilen je Satz.
  3. Kulanz/Preisminderung (freier Betrag ohne Rücknahme): Aufteilung im Verhältnis der noch offenen
     Bruttowarenwerte je Satz (Minderung der Bemessungsgrundlage, § 16 UStG).
  4. Nie mehr als bezahlt − bereits erstattet; nie mehr Menge als bestellt − bereits zurück.
  5. USt je Satz aus dem Bruttobetrag (ust.ust_aus_brutto, kaufmännisch gerundet).
Beträge Cent (int), Sätze Int ×100 (2000 = 20 %).
"""

from ph_shop import ust


class ErstattungFehler(ValueError):
    """Fachfehler (Menge/Betrag) – der Controller übersetzt ihn in frappe.throw."""


def zeilenbetrag(summe_cent, menge, zurueck_menge, erstattet_cent, rueck_menge):
    """Anteil einer Zeile für `rueck_menge` Stück. Letzte offene Menge → genauer Rest."""
    summe_cent, menge, zurueck_menge, erstattet_cent, rueck_menge = (int(x or 0) for x in (summe_cent, menge, zurueck_menge, erstattet_cent, rueck_menge))
    offen_menge = menge - zurueck_menge
    if rueck_menge <= 0:
        return 0
    if rueck_menge > offen_menge:
        raise ErstattungFehler(f"Menge {rueck_menge} übersteigt die offene Menge {offen_menge}.")
    offen_betrag = summe_cent - erstattet_cent
    if rueck_menge == offen_menge:
        return max(offen_betrag, 0)
    anteil = ust._round_half_up(summe_cent * rueck_menge / menge) if menge else 0
    return max(min(anteil, offen_betrag), 0)


def _posten(pro_satz):
    out = []
    for satz in sorted(pro_satz, reverse=True):
        brutto = int(pro_satz[satz])
        if not brutto:
            continue
        u = ust.ust_aus_brutto(brutto, satz)
        out.append({"satz_promille": satz, "brutto_cent": brutto, "ust_cent": u, "netto_cent": brutto - u})
    return out


def berechne(positionen, auswahl=None, versand_cent=0, versand_posten=None, kulanz_cent=0, bezahlt_cent=0, erstattet_cent=0, nur_storno=False):
    """Erstattungsvorschlag.

    positionen: [{key, menge, summe_cent, ust_satz_promille, zurueck_menge=0, erstattet_cent=0}]
    auswahl:    {key: menge}
    versand_cent: zu erstattender Versandanteil; versand_posten: [{satz_promille, versand_cent (noch offen)}]
    kulanz_cent: freier Betrag (Preisminderung) ohne Rücknahme
    nur_storno: Bestellung unbezahlt → keine Geldprüfung (Betrag mindert nur die Forderung)
    → {"betrag_cent", "ust_cent", "posten": [{satz_promille, brutto_cent, ust_cent, netto_cent}],
       "zeilen": [{key, menge, betrag_cent, satz_promille}], "versand": [{satz_promille, versand_cent}]}
    """
    auswahl = {str(k): int(v or 0) for k, v in (auswahl or {}).items() if int(v or 0) > 0}
    nach_key = {str(p["key"]): p for p in positionen}
    unbekannt = set(auswahl) - set(nach_key)
    if unbekannt:
        raise ErstattungFehler(f"Unbekannte Position(en): {', '.join(sorted(unbekannt))}")
    pro_satz = {}
    zeilen = []
    for key, m in auswahl.items():
        p = nach_key[key]
        b = zeilenbetrag(p.get("summe_cent"), p.get("menge"), p.get("zurueck_menge"), p.get("erstattet_cent"), m)
        satz = int(p.get("ust_satz_promille") or 0)
        zeilen.append({"key": key, "menge": m, "betrag_cent": b, "satz_promille": satz})
        pro_satz[satz] = pro_satz.get(satz, 0) + b

    versand_cent = int(versand_cent or 0)
    versand = []
    if versand_cent:
        vp = [v for v in (versand_posten or []) if int(v.get("versand_cent") or 0) > 0]
        offen = sum(int(v["versand_cent"]) for v in vp)
        if versand_cent < 0 or versand_cent > offen:
            raise ErstattungFehler(f"Versand {versand_cent} Cent übersteigt den offenen Versandanteil {offen} Cent.")
        teile = ust.anteilig(versand_cent, [int(v["versand_cent"]) for v in vp])
        for v, t in zip(vp, teile):
            s = int(v["satz_promille"])
            versand.append({"satz_promille": s, "versand_cent": t})
            pro_satz[s] = pro_satz.get(s, 0) + t

    kulanz_cent = int(kulanz_cent or 0)
    if kulanz_cent < 0:
        raise ErstattungFehler("Kulanzbetrag darf nicht negativ sein.")
    if kulanz_cent:
        gewichte = {}
        for p in positionen:
            s = int(p.get("ust_satz_promille") or 0)
            gewichte[s] = gewichte.get(s, 0) + max(int(p.get("summe_cent") or 0) - int(p.get("erstattet_cent") or 0), 0)
        saetze = sorted(gewichte, reverse=True) or [2000]
        teile = ust.anteilig(kulanz_cent, [gewichte.get(s, 0) for s in saetze] or [1])
        for s, t in zip(saetze, teile):
            pro_satz[s] = pro_satz.get(s, 0) + t

    posten = _posten(pro_satz)
    betrag = sum(p["brutto_cent"] for p in posten)
    if betrag <= 0:
        raise ErstattungFehler("Nichts ausgewählt – Betrag ist 0.")
    if not nur_storno:
        verfuegbar = int(bezahlt_cent or 0) - int(erstattet_cent or 0)
        if betrag > verfuegbar:
            raise ErstattungFehler(f"Erstattung {betrag} Cent übersteigt den erstattbaren Betrag {verfuegbar} Cent.")
    return {"betrag_cent": betrag, "ust_cent": sum(p["ust_cent"] for p in posten), "posten": posten, "zeilen": zeilen, "versand": versand}


def verteile_auf_zahlungen(betrag_cent, zahlungen):
    """Erstattungsbetrag auf die Eingangszahlungen verteilen (jüngste zuerst, Gutschein zuletzt).

    zahlungen: [{name, kanal, offen_cent (betrag − erstattet), zeit (sortierbar)}]
    → [{name, kanal, betrag_cent}] ; Rest > 0 → ErstattungFehler.
    Begründung: Rückzahlung über das ursprüngliche Zahlungsmittel (§ 14 FAGG); Gutscheinanteile werden auf den
    Gutschein zurückgebucht, nicht ausbezahlt.
    """
    rest = int(betrag_cent or 0)
    # Nicht-Gutschein zuerst, darin die jüngste zuerst
    nicht_gs = sorted([z for z in zahlungen if z.get("kanal") != "Gutschein"], key=lambda z: str(z.get("zeit") or ""), reverse=True)
    gs = sorted([z for z in zahlungen if z.get("kanal") == "Gutschein"], key=lambda z: str(z.get("zeit") or ""), reverse=True)
    out = []
    for z in nicht_gs + gs:
        if rest <= 0:
            break
        teil = min(rest, int(z.get("offen_cent") or 0))
        if teil > 0:
            out.append({"name": z["name"], "kanal": z.get("kanal"), "betrag_cent": teil})
            rest -= teil
    if rest > 0:
        raise ErstattungFehler(f"{rest} Cent können keiner Zahlung zugeordnet werden.")
    return out


def ersatz_zeilen(positionen, auswahl):
    """Positionen für eine Ersatzlieferung (0 €): je gewählter Zeile die Menge, höchstens die bestellte Menge.
    → [{key, menge}] ; leer oder zu viel → ErstattungFehler."""
    nach_key = {str(p["key"]): p for p in positionen}
    out = []
    for key, m in (auswahl or {}).items():
        m = int(m or 0)
        if m <= 0:
            continue
        if str(key) not in nach_key:
            raise ErstattungFehler(f"Unbekannte Position {key}.")
        if m > int(nach_key[str(key)].get("menge") or 0):
            raise ErstattungFehler(f"Ersatzmenge {m} übersteigt die bestellte Menge.")
        out.append({"key": str(key), "menge": m})
    if not out:
        raise ErstattungFehler("Keine Position für die Ersatzlieferung gewählt.")
    return out


def status_nach_erstattung(gesamt_cent, bezahlt_cent, erstattet_cent):
    """'erstattet' wenn alles Bezahlte zurück ist, sonst 'teilerstattet' (bei erstattet > 0)."""
    if int(erstattet_cent or 0) <= 0:
        return None
    return "erstattet" if int(erstattet_cent) >= int(bezahlt_cent or gesamt_cent or 0) else "teilerstattet"


def zahlungsstand(gesamt_cent, bezahlt_vorher_cent, neu_cent):
    """Teilzahlungen addieren (Fehler in zahlung_erfassen, 10-konzept-shop §10). → (bezahlt_cent, voll: bool)."""
    bezahlt = int(bezahlt_vorher_cent or 0) + int(neu_cent or 0)
    return bezahlt, bezahlt >= int(gesamt_cent or 0)
