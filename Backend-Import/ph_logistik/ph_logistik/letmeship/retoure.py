"""Retourenlabel (LetMeShip) – reine Logik ohne Frappe (Integration Runde 3; 52-…: „Retourenlabel → ph_logistik“).

Retourensendung zu einem Lieferschein bzw. einer Warenrücknahme: Abholung beim Kunden (Lieferadresse), Zustellung an
den Absender (Showroom/Lager). Pakete: aus dem Lieferschein; bei einer Teil-Rücknahme anteilig nach Menge (mindestens
ein Paket); ohne Pakete ein Standardpaket mit Gewicht aus den Positionen bzw. 1 kg.
"""

from __future__ import annotations

from . import ShippingError

PFLICHT_ADRESSE = ("strasse", "plz", "ort", "land")
STANDARD_PAKET = {"laenge_cm": 40, "breite_cm": 30, "hoehe_cm": 20, "gewicht_g": 1000, "menge": 1, "inhalt": "Retoure"}


def adresse_fehlt(a: dict) -> list[str]:
    return [k for k in PFLICHT_ADRESSE if not str(a.get(k) or "").strip()]


def retoure_pakete(pakete: list[dict], menge_gesamt: int | None = None, menge_zurueck: int | None = None) -> list[dict]:
    """Pakete für die Rücksendung. Teil-Rücknahme (menge_zurueck < menge_gesamt): die ersten n Pakete, n = anteilig
    aufgerundet (mindestens 1). Ohne Pakete: Standardpaket."""
    pakete = [dict(p) for p in (pakete or []) if int(p.get("gewicht_g") or 0) > 0]
    if not pakete:
        return [dict(STANDARD_PAKET)]
    if menge_gesamt and menge_zurueck is not None and 0 < int(menge_zurueck) < int(menge_gesamt):
        n = max(1, -(-len(pakete) * int(menge_zurueck) // int(menge_gesamt)))
        pakete = pakete[:n]
    for p in pakete:
        p["inhalt"] = f"Retoure: {p.get('inhalt') or 'Ware'}"[:35]
    return pakete


def retoure_plan(kunde: dict, absender: dict, pakete: list[dict], laender: list[str] | None = None, referenz: str | None = None) -> dict:
    """→ {von (Kunde), nach (Absender), pakete, referenz}. Fehler: ShippingError("adresse", fehlende Felder) bzw. ("land")."""
    fehlt = adresse_fehlt(kunde)
    if fehlt:
        raise ShippingError("adresse", "Abholadresse unvollständig: " + ", ".join(fehlt))
    fehlt = adresse_fehlt(absender)
    if fehlt:
        raise ShippingError("adresse", "Absender (Einstellungen) unvollständig: " + ", ".join(fehlt))
    land = str(kunde.get("land") or "").upper()
    if laender and land not in [x.upper() for x in laender]:
        raise ShippingError("land", land)
    if not pakete:
        raise ShippingError("keine_pakete")
    return {"von": dict(kunde, land=land), "nach": dict(absender), "pakete": pakete, "referenz": (f"RET {referenz}" if referenz else "RETOURE")[:35]}
