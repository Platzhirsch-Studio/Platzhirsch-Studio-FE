"""Kostenzuordnung von Eingangsrechnungen auf Projekte/Kostenarten (Projektnachkalkulation, Inhaber 04.11.2026).
Reine Logik ohne Frappe, Tests: tests/test_kostenzuordnung.py · Controller: PH Eingangsrechnung.

Modi
  Ganz einem Projekt  eine Zeile (Kopf-Projekt + Kostenart) über den ganzen Nettobetrag
  Nach Positionen     je Belegposition eine Zeile (Projekt/Kostenart je Position), Betrag = Positions-Netto
  Aliquot             Prozent oder fester Betrag je Projekt; Rundungsdifferenz auf die betragsmäßig größte Zeile
  Gemeinkosten        kein Projekt (Kosten des Studios), keine Zeilen
Lieferanten-Gutschriften: Beträge bleiben positiv wie im Beleg; die Kalkulation rechnet sie negativ.
"""

from decimal import ROUND_HALF_UP, Decimal

MODI = ("Ganz einem Projekt", "Nach Positionen", "Aliquot", "Gemeinkosten")
OHNE_POSITIONSBEZUG = ("Text", "Zwischensumme")


def _i(v):
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def _p(v):
    try:
        return Decimal(str(v or 0))
    except Exception:  # noqa: BLE001
        return Decimal(0)


def _g(z, k):
    return z.get(k) if isinstance(z, dict) else getattr(z, k, None)


def rund(d):
    return int(Decimal(d).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def aufteilen(netto_cent, zeilen):
    """Beträge je Zeile: Zeile mit Prozent → netto × Prozent (kaufmännisch gerundet), sonst fester betrag_cent.
    Ergibt die Prozentsumme genau 100 % (bzw. Prozent + feste Beträge genau den Nettobetrag bis auf Rundung),
    landet die Rundungsdifferenz auf der betragsmäßig größten Prozentzeile. → (beträge, differenz_cent)
    differenz ≠ 0 heißt: Summe der Zuordnung ≠ Netto (Validierungsfehler im Controller)."""
    netto = _i(netto_cent)
    betraege, prozentzeilen = [], []
    for i, z in enumerate(zeilen or ()):
        p = _p(_g(z, "prozent"))
        if p:
            betraege.append(rund(Decimal(netto) * p / Decimal(100)))
            prozentzeilen.append(i)
        else:
            betraege.append(_i(_g(z, "betrag_cent")))
    diff = netto - sum(betraege)
    # Nur echte Rundungsreste ausgleichen (höchstens 1 Cent je Prozentzeile), keine fehlenden Anteile verstecken
    if diff and prozentzeilen and abs(diff) <= len(prozentzeilen):
        ziel = max(prozentzeilen, key=lambda i: (abs(betraege[i]), -i))
        betraege[ziel] += diff
        diff = 0
    return betraege, diff


def aus_positionen(positionen, vorhanden=(), projekt=None, kostenart=None):
    """Modus „Nach Positionen“: je Belegposition (ohne Text/Zwischensumme/Alternativ) eine Zeile mit deren Netto.
    Bereits erfasste Projekt/Kostenart je Position (`vorhanden`, Schlüssel belegposition = pos) bleiben erhalten."""
    alt = {_i(_g(z, "belegposition")): z for z in vorhanden or () if _i(_g(z, "belegposition"))}
    out = []
    for p in positionen or ():
        if (_g(p, "art") or "") in OHNE_POSITIONSBEZUG or _i(_g(p, "alternativ")):
            continue
        pos = _i(_g(p, "pos")) or _i(_g(p, "idx"))
        a = alt.get(pos) or {}
        out.append({"belegposition": pos, "betrag_cent": _i(_g(p, "netto_cent")), "prozent": 0,
                    "projekt": _g(a, "projekt") or projekt, "kostenart": _g(a, "kostenart") or kostenart,
                    "bemerkung": _g(a, "bemerkung") or (_g(p, "bezeichnung") or "")[:140],
                    "bezug_doctype": _g(a, "bezug_doctype"), "bezug_name": _g(a, "bezug_name")})
    return out


def anteilig(netto_cent, vorlage):
    """Vorschlag nach dem Verhältnis einer Vorlage (z. B. Zuordnung der Ursprungsrechnung bei einer Gutschrift oder
    mehrere Speditionsaufträge): vorlage [{projekt, kostenart, betrag_cent, …}] → Zeilen mit Betrag, Summe = netto."""
    vorlage = [v for v in vorlage or () if _i(_g(v, "betrag_cent"))]
    basis = sum(_i(_g(v, "betrag_cent")) for v in vorlage)
    if not basis:
        return []
    zeilen = [{k: _g(v, k) for k in ("projekt", "kostenart", "bezug_doctype", "bezug_name", "bemerkung")} for v in vorlage]
    for z, v in zip(zeilen, vorlage):
        z["betrag_cent"] = rund(Decimal(_i(netto_cent)) * _i(_g(v, "betrag_cent")) / basis)
        z["prozent"] = 0
    diff = _i(netto_cent) - sum(z["betrag_cent"] for z in zeilen)
    if diff:
        max(zeilen, key=lambda z: abs(z["betrag_cent"]))["betrag_cent"] += diff
    return zeilen


def pruefen(modus, netto_cent, zeilen, positionen=()):
    """Fehlertexte (leer = vollständig zugeordnet). Summe der Zeilen muss dem Netto entsprechen."""
    fehler = []
    if modus not in MODI:
        return ["Bitte einen Zuordnungsmodus wählen."]
    if modus == "Gemeinkosten":
        if any(_g(z, "projekt") for z in zeilen or ()):
            fehler.append("Gemeinkosten haben kein Projekt – Zeilen entfernen oder anderen Modus wählen.")
        return fehler
    if not zeilen:
        return ["Keine Zuordnungszeilen."]
    for i, z in enumerate(zeilen, 1):
        if not _g(z, "projekt"):
            fehler.append(f"Zeile {i}: Projekt fehlt.")
        if not _g(z, "kostenart"):
            fehler.append(f"Zeile {i}: Kostenart fehlt.")
        if _p(_g(z, "prozent")) < 0 or _p(_g(z, "prozent")) > 100:
            fehler.append(f"Zeile {i}: Prozent muss zwischen 0 und 100 liegen.")
    if modus == "Ganz einem Projekt" and len(zeilen) != 1:
        fehler.append("„Ganz einem Projekt“ hat genau eine Zeile – sonst „Aliquot“ wählen.")
    if modus == "Nach Positionen":
        pos = [_i(_g(z, "belegposition")) for z in zeilen]
        if not all(pos):
            fehler.append("„Nach Positionen“: jede Zeile braucht den Positionsbezug.")
        if len(pos) != len(set(pos)):
            fehler.append("„Nach Positionen“: eine Position ist mehrfach zugeordnet.")
    summe = sum(_i(_g(z, "betrag_cent")) for z in zeilen)
    if summe != _i(netto_cent):
        fehler.append(f"Summe der Zuordnung {summe / 100:.2f} € ≠ Netto {_i(netto_cent) / 100:.2f} € (Differenz {(_i(netto_cent) - summe) / 100:.2f} €).")
    return fehler


def status(modus, netto_cent, zeilen):
    if modus == "Gemeinkosten" and not pruefen(modus, netto_cent, zeilen):
        return "Gemeinkosten"
    return "Vollstaendig" if modus in MODI and not pruefen(modus, netto_cent, zeilen) else "Offen"


def vorzeichen(belegart):
    return -1 if belegart == "Gutschrift" else 1


def unterschied(alt, neu):
    """Protokolltext einer Umbuchung: alt/neu [{projekt, kostenart, betrag_cent}] → „P1/Ware 100,00 → P2/Ware 100,00“."""
    def text(zeilen):
        return "; ".join(f"{_g(z, 'projekt') or '–'}/{_g(z, 'kostenart') or '–'} {_i(_g(z, 'betrag_cent')) / 100:.2f}" for z in zeilen or ()) or "–"
    return f"{text(alt)} → {text(neu)}"
