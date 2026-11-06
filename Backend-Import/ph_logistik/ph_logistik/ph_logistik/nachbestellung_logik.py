"""Reine Logik Meldebestand/Nachbestellvorschlag (kein Frappe-Import, getestet in tests/test_lager_inventur_logik.py).

Disponierbarer (verfügbarer) Bestand je Regel (Produkt/Ausführung/Lagerort):
    verfuegbar = Bestand − Reservierungen − Kommission − Sperrbestand + offene Herstellerbestellungen
- Bestand: Summe `menge` aller Bestandszeilen ohne Ausstellungsstücke (Ausstellungsstücke werden nicht nachbestellt).
- Reservierungen: `reserviert` freier Zeilen (Kommissions-/Sperrzeilen sind ohnehin ganz abgezogen – nie doppelt).
- Kommission: Menge der Zeilen mit `kommission` (gehört einem Projekt/Auftrag).
- Sperrbestand: Menge gesperrter Zeilen ohne Kommission (Schaden, an Lieferant) – zusätzlich zur Vorgabe, weil
  gesperrte Ware nicht verkauft werden kann (wie `bestand_logik.verfuegbar`).
- Offene Herstellerbestellungen: `menge − menge_erhalten` offener Lagerware-Positionen (ohne Kommission) zum Lagerort.

Auslösung: Regel aktiv, Zielbestand > 0 und verfuegbar ≤ Meldebestand (Meldebestand erreicht = bestellen).
Vorschlagsmenge: Zielbestand − verfuegbar, mindestens `bestellmenge_min` (mind. 1), aufgerundet auf die Verpackungseinheit.
"""

import math


def disponierbar(bestaende, offen_bestellt=0):
    """bestaende: [{menge, reserviert, kommission, gesperrt, ausstellungsstueck}] → Kennzahlen-dict."""
    bestand = reserviert = kommission = gesperrt = 0
    for b in bestaende or []:
        if b.get("ausstellungsstueck"):
            continue
        m = max(int(b.get("menge") or 0), 0)
        bestand += m
        if b.get("kommission"):
            kommission += m
        elif b.get("gesperrt"):
            gesperrt += m
        else:
            reserviert += min(max(int(b.get("reserviert") or 0), 0), m)
    offen = max(int(offen_bestellt or 0), 0)
    return {"bestand": bestand, "reserviert": reserviert, "kommission": kommission, "gesperrt": gesperrt, "offen_bestellt": offen,
            "verfuegbar": bestand - reserviert - kommission - gesperrt + offen}


def unter_meldebestand(verfuegbar, meldebestand, zielbestand):
    return int(zielbestand or 0) > 0 and int(verfuegbar) <= int(meldebestand or 0)


def vorschlag_menge(verfuegbar, meldebestand, zielbestand, bestellmenge_min=0, verpackungseinheit=0):
    """0, wenn nicht unter Meldebestand; sonst Auffüllen auf den Zielbestand (≥ Mindestmenge, VPE aufgerundet)."""
    if not unter_meldebestand(verfuegbar, meldebestand, zielbestand):
        return 0
    ziel = max(int(zielbestand or 0), int(meldebestand or 0))
    menge = max(ziel - int(verfuegbar), int(bestellmenge_min or 0), 1)
    vpe = int(verpackungseinheit or 0)
    if vpe > 1:
        menge = int(math.ceil(menge / vpe) * vpe)
    return menge


def pruefe_regel(meldebestand, zielbestand, bestellmenge_min=0, verpackungseinheit=0):
    """Fehlertext oder None."""
    for wert, name in ((meldebestand, "Meldebestand"), (zielbestand, "Zielbestand"), (bestellmenge_min, "Mindestbestellmenge"), (verpackungseinheit, "Verpackungseinheit")):
        if int(wert or 0) < 0:
            return f"{name} darf nicht negativ sein."
    if int(zielbestand or 0) < int(meldebestand or 0):
        return "Zielbestand muss mindestens so hoch wie der Meldebestand sein."
    return None


def wiederbeschaffung_tage(manuell=None, lieferant_wochen_bis=None, produkt_wochen_bis=None, lieferant_standard_wochen=None):
    """(tage, quelle): manuell > Lieferzeit-Regel des Lieferanten > Lieferzeit am Produkt > Standard des Lieferanten > (None, None)."""
    if int(manuell or 0) > 0:
        return int(manuell), "manuell"
    for wochen, quelle in ((lieferant_wochen_bis, "Lieferant Lieferzeit"), (produkt_wochen_bis, "Produkt"), (lieferant_standard_wochen, "Lieferant Standard")):
        if int(wochen or 0) > 0:
            return int(wochen) * 7, quelle
    return None, None


def meldebestand_empfehlung(abgang_stueck, zeitraum_tage, wbz_tage, sicherheit_tage=0):
    """Empfehlung (nicht automatisch übernommen): Tagesbedarf × (Wiederbeschaffungszeit + Sicherheitstage), aufgerundet.
    Ohne Abgang oder ohne WBZ → None."""
    tage = int(zeitraum_tage or 0)
    if tage <= 0 or not wbz_tage or int(abgang_stueck or 0) <= 0:
        return None
    bedarf = int(abgang_stueck) / tage
    return int(math.ceil(bedarf * (int(wbz_tage) + int(sicherheit_tage or 0))))


def ziel_lagerort(lieferadresse, standard_lagerort=None, showroom_lagerort=None):
    """PH Herstellerbestellung.lieferadresse (Showroom|Lager|Kunde direkt) → Lagerort oder None (Kunde direkt/unbekannt)."""
    if lieferadresse == "Showroom":
        return showroom_lagerort or standard_lagerort
    if lieferadresse == "Lager":
        return standard_lagerort
    return None


def offene_menge(positionen, lagerort, regeln_je_produkt=1, standard_lagerort=None, showroom_lagerort=None):
    """Offene Bestellmenge für eine Regel: positionen [{menge, menge_erhalten, lieferadresse, kommission}].
    Hat das Produkt genau eine Regel, zählt jede offene Lagerware-Position (außer „Kunde direkt“); bei mehreren Regeln
    entscheidet die Lieferadresse (Showroom → Showroom-Lagerort, Lager → Standard-Lagerort)."""
    summe = 0
    for p in positionen or []:
        if p.get("kommission"):
            continue
        offen = max(int(p.get("menge") or 0) - int(p.get("menge_erhalten") or 0), 0)
        if not offen:
            continue
        ziel = ziel_lagerort(p.get("lieferadresse"), standard_lagerort, showroom_lagerort)
        if p.get("lieferadresse") == "Kunde direkt":
            continue
        if ziel == lagerort or int(regeln_je_produkt or 0) == 1:
            summe += offen
    return summe
