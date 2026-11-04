"""Reine Bestandslogik (kein Frappe-Import): Wirkung einer Lagerbewegung auf Bestandszeilen.

Eine Bewegung hat art, menge (> 0), lagerort_von, lagerort_nach. Wirkung in Stück je (lagerort):
  Wareneingang, Retoure        +menge auf lagerort_nach
  Verkauf, Ausbuchung          −menge von lagerort_von
  Umlagerung                   −menge von lagerort_von, +menge auf lagerort_nach
  Inventur                     setzt den Bestand auf lagerort_nach auf den Ist-Wert (menge = Differenz, Vorzeichen erlaubt)
  Reservierung / Freigabe      ändert nur `reserviert` (+/−), nicht `menge`
"""

ARTEN = ("Wareneingang", "Verkauf", "Umlagerung", "Inventur", "Retoure", "Ausbuchung", "Reservierung", "Freigabe")
ZUGANG = {"Wareneingang", "Retoure"}
ABGANG = {"Verkauf", "Ausbuchung"}


class BestandsFehler(ValueError):
    pass


def pruefe_bewegung(b):
    art = b.get("art")
    if art not in ARTEN:
        raise BestandsFehler(f"Unbekannte Bewegungsart: {art}")
    menge = int(b.get("menge") or 0)
    if art != "Inventur" and menge <= 0:
        raise BestandsFehler("Menge muss größer 0 sein.")
    if art in ZUGANG and not b.get("lagerort_nach"):
        raise BestandsFehler("Zugang braucht einen Ziel-Lagerort.")
    if art in ABGANG and not b.get("lagerort_von"):
        raise BestandsFehler("Abgang braucht einen Quell-Lagerort.")
    if art == "Umlagerung":
        if not (b.get("lagerort_von") and b.get("lagerort_nach")):
            raise BestandsFehler("Umlagerung braucht Quell- und Ziel-Lagerort.")
        if b["lagerort_von"] == b["lagerort_nach"] and (b.get("platz_von") or "") == (b.get("platz_nach") or ""):
            raise BestandsFehler("Umlagerung ohne Ortswechsel.")
    if art in ("Reservierung", "Freigabe") and not b.get("lagerort_von"):
        raise BestandsFehler("Reservierung braucht den Lagerort des Bestands.")
    if art == "Inventur" and not b.get("lagerort_nach"):
        raise BestandsFehler("Inventur braucht den Lagerort.")
    return True


def wirkung(b):
    """→ Liste von (lagerort, delta_menge, delta_reserviert)."""
    pruefe_bewegung(b)
    art, menge = b["art"], int(b.get("menge") or 0)
    if art in ZUGANG:
        return [(b["lagerort_nach"], menge, 0)]
    if art in ABGANG:
        return [(b["lagerort_von"], -menge, 0)]
    if art == "Umlagerung":
        return [(b["lagerort_von"], -menge, 0), (b["lagerort_nach"], menge, 0)]
    if art == "Inventur":
        return [(b["lagerort_nach"], menge, 0)]
    if art == "Reservierung":
        return [(b["lagerort_von"], 0, menge)]
    return [(b["lagerort_von"], 0, -menge)]


def anwenden(bestaende, b, negativ_erlaubt=False):
    """bestaende: dict lagerort → {"menge", "reserviert"}; wird kopiert und zurückgegeben."""
    neu = {k: dict(v) for k, v in bestaende.items()}
    for ort, dm, dr in wirkung(b):
        z = neu.setdefault(ort, {"menge": 0, "reserviert": 0})
        z["menge"] = int(z["menge"]) + dm
        z["reserviert"] = int(z["reserviert"]) + dr
        if z["menge"] < 0 and not negativ_erlaubt:
            raise BestandsFehler(f"Bestand an {ort} würde negativ ({z['menge']}).")
        if z["reserviert"] < 0:
            z["reserviert"] = 0
        if z["reserviert"] > z["menge"] and not negativ_erlaubt:
            raise BestandsFehler(f"Mehr reserviert als vorhanden an {ort}.")
    return neu


def verfuegbar(menge, reserviert):
    return max(int(menge or 0) - int(reserviert or 0), 0)


def status_aus(menge, reserviert, ausgeschieden=False, verkauft=False):
    if ausgeschieden:
        return "Ausgeschieden"
    if verkauft or int(menge or 0) <= 0:
        return "Verkauft" if verkauft or int(menge or 0) <= 0 else "Verfuegbar"
    if int(reserviert or 0) >= int(menge or 0):
        return "Reserviert"
    return "Verfuegbar"


def inventur_differenzen(positionen):
    """positionen: [{soll, ist, gezaehlt}] → (anzahl, gezaehlt, mit_differenz, summe_differenz, [Bewegungen])."""
    bew = []
    mit_diff = 0
    summe = 0
    gez = 0
    for p in positionen:
        if not p.get("gezaehlt"):
            continue
        gez += 1
        d = int(p.get("ist") or 0) - int(p.get("soll") or 0)
        if d:
            mit_diff += 1
            summe += d
            bew.append({"art": "Inventur", "menge": d, "lagerbestand": p.get("lagerbestand"), "produkt": p.get("produkt"), "grund": p.get("grund")})
    return len(positionen), gez, mit_diff, summe, bew
