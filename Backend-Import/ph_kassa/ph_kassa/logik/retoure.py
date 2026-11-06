"""Retoure / Rücknahme an der Kassa (Fachkritik 21 P-B, P7) – ohne Frappe.

Eine Retoure ist ein **neuer Standardbeleg** mit Position(en) der Art „Retoure“ (negativ, Steuersatz der
Originalzeile, Bezug auf Originalbeleg + Zeile). Anders als der Stornobeleg (Fehlbuchung, gleicher Betrag,
Kennwort STO) erhöht die Retoure den Umsatzzähler um einen negativen Betrag – die Rücknahme ist ein eigener
Geschäftsvorfall (Entgeltsminderung § 16 UStG im Monat der Rücknahme).

Auszahlung: Bar (Leitung), Rückerstattung auf die Originalkarte (Terminal), Rücküberweisung, oder Gutschein
(Position „Gutschein Verkauf“ +X → Beleg 0,00 €).
"""

from __future__ import annotations

from .betraege import KassenFehler, _runde

RUECKNEHMBAR = ("Artikel", "Freitext")


def ruecknehmbar(original_positionen: list[dict], bisherige_retouren: list[dict]) -> list[dict]:
    """Je Originalzeile die noch rücknehmbare Menge.

    original_positionen: [{"name", "art", "bezeichnung", "menge", "einzel_brutto_cent", "steuersatz", "produkt"}]
    bisherige_retouren: [{"bezug_zeile": <name der Originalzeile>, "menge"}] aus früheren Retoure-Belegen.
    """
    zurueck: dict[str, float] = {}
    for r in bisherige_retouren or []:
        zurueck[r.get("bezug_zeile")] = zurueck.get(r.get("bezug_zeile"), 0.0) + float(r.get("menge") or 0)
    out = []
    for p in original_positionen or []:
        if p.get("art") not in RUECKNEHMBAR:
            continue
        menge = float(p.get("menge") or 0)
        rest = round(menge - zurueck.get(p.get("name"), 0.0), 6)
        out.append({**p, "bereits_zurueck": zurueck.get(p.get("name"), 0.0), "ruecknehmbar": max(rest, 0.0)})
    return out


def retoure_positionen(original_beleg: str, auswahl: dict, zeilen: list[dict], grund: str) -> list[dict]:
    """Retoure-Positionen aus der Auswahl {zeilenname: menge}; prüft Mengen gegen `ruecknehmbar`-Ergebnis `zeilen`.

    Einzelpreis = tatsächlich bezahlter Preis der Originalzeile (nach Rabatt), Steuersatz der Originalzeile.
    """
    grund = (grund or "").strip()
    if not grund:
        raise KassenFehler("Grund der Rücknahme angeben (Umtausch, Mangel, Kulanz …).")
    nach_name = {z.get("name"): z for z in zeilen}
    out = []
    for name, menge in (auswahl or {}).items():
        menge = float(menge or 0)
        if menge <= 0:
            continue
        z = nach_name.get(name)
        if z is None:
            raise KassenFehler(f"Zeile {name} gehört nicht zum Beleg {original_beleg} oder ist nicht rücknehmbar.")
        if menge > float(z["ruecknehmbar"]) + 1e-9:
            raise KassenFehler(f"„{z.get('bezeichnung')}“: höchstens {z['ruecknehmbar']:g} Stück rücknehmbar.")
        out.append({
            "art": "Retoure",
            "produkt": z.get("produkt"),
            "bezeichnung": z.get("bezeichnung"),
            "zusatz": grund[:140],
            "menge": menge,
            "einzel_brutto_cent": -abs(int(z.get("einzel_brutto_cent") or 0)),
            "steuersatz": z.get("steuersatz") or "Normal 20",
            "bezug_doctype": "PH Kassenbeleg",
            "bezug": original_beleg,
            "bezug_zeile": name,
        })
    if not out:
        raise KassenFehler("Keine Menge zur Rücknahme gewählt.")
    return out


def erstattungsweg_vorschlag(original_zahlarten: list[dict], betrag_cent: int) -> list[dict]:
    """Vorschlag, wie ein (positiver) Rückzahlungsbetrag auf die Original-Zahlarten verteilt wird:
    zuerst Karte (Terminal, Refund auf die Originalkarte), dann Überweisung, Rest bar. Gutschein-Anteile werden
    nicht ausgezahlt, sondern als neuer Gutschein (Position) vorgeschlagen."""
    rest = abs(int(betrag_cent))
    out = []
    reihenfolge = ("Karte Stripe Terminal", "Karte extern", "Ueberweisung", "Gutschein", "Bar")
    for art in reihenfolge:
        for z in original_zahlarten or []:
            if z.get("zahlart") != art or rest <= 0:
                continue
            anteil = min(rest, int(z.get("betrag_cent") or 0))
            if anteil <= 0:
                continue
            eintrag = {"zahlart": art, "betrag_cent": anteil}
            if art == "Karte Stripe Terminal":
                eintrag["terminal_payment_intent"] = z.get("terminal_payment_intent")
                eintrag["erstattung_von_zahlung"] = z.get("zahlung")
            if art == "Gutschein":
                eintrag = {"als_gutschein": True, "betrag_cent": anteil}
            out.append(eintrag)
            rest -= anteil
    if rest > 0:
        out.append({"zahlart": "Bar", "betrag_cent": rest})
    return out


def anteil(betrag_cent: int, menge: float, menge_gesamt: float) -> int:
    """Anteiliger Betrag bei Teilrücknahme (kaufmännisch gerundet)."""
    if not menge_gesamt:
        return 0
    return _runde(int(betrag_cent) * float(menge) / float(menge_gesamt))
