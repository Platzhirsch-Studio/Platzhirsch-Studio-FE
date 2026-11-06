"""Aufmaß – reine Logik ohne Frappe (Fläche, Plausibilität). Tests: tests/test_aufmass.py.

Maße immer in Millimeter (Int). Grenzwerte sind Plausibilitätsgrenzen für Wohn-/Objektbau, keine Normwerte:
Hinweise blockieren nicht, sie erscheinen im Feld `plausibilitaet` und im Protokoll.
"""

MAX_MASS_MM = 30000  # 30 m – längere Einzelmaße sind fast immer Tippfehler (cm/mm verwechselt)
RAUMHOEHE_MIN_MM = 1800
RAUMHOEHE_MAX_MM = 6000

ANSCHLUSS_ARTEN = ("Wasser kalt", "Wasser warm", "Abfluss", "Strom 230 V", "Starkstrom 400 V", "Abluft", "Gas", "Netzwerk", "Sonstiges")


def _int(v):
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return 0


def flaeche_m2(laenge_mm, breite_mm):
    """Grundfläche in m² (2 Nachkommastellen); 0, wenn ein Maß fehlt."""
    l, b = _int(laenge_mm), _int(breite_mm)
    if l <= 0 or b <= 0:
        return 0.0
    return round(l * b / 1_000_000, 2)


def _g(z, k):
    return z.get(k) if isinstance(z, dict) else getattr(z, k, None)


def plausibilitaet(raeume, masse=(), anschluesse=()):
    """Liste deutscher Hinweise (leer = plausibel)."""
    hinweise = []
    namen = set()
    hoehen = {}
    for r in raeume or []:
        name = (_g(r, "raum") or "").strip()
        if not name:
            hinweise.append("Raum ohne Bezeichnung.")
            continue
        if name in namen:
            hinweise.append(f"Raum „{name}“ ist doppelt erfasst.")
        namen.add(name)
        for feld, label in (("laenge_mm", "Länge"), ("breite_mm", "Breite"), ("hoehe_mm", "Höhe")):
            w = _g(r, feld)
            if w in (None, "", 0):
                continue
            w = _int(w)
            if w < 0:
                hinweise.append(f"{name}: {label} ist negativ.")
            elif w > MAX_MASS_MM:
                hinweise.append(f"{name}: {label} {w} mm ist unplausibel groß (cm/mm verwechselt?).")
        h = _int(_g(r, "hoehe_mm"))
        if h:
            hoehen[name] = h
            if h < RAUMHOEHE_MIN_MM or h > RAUMHOEHE_MAX_MM:
                hinweise.append(f"{name}: Raumhöhe {h} mm außerhalb {RAUMHOEHE_MIN_MM}–{RAUMHOEHE_MAX_MM} mm.")
    for m in masse or []:
        raum = (_g(m, "raum") or "").strip()
        w = _int(_g(m, "wert_mm"))
        bez = _g(m, "bezeichnung") or "Maß"
        if raum and namen and raum not in namen:
            hinweise.append(f"Maß „{bez}“: Raum „{raum}“ ist nicht erfasst.")
        if w <= 0:
            hinweise.append(f"Maß „{bez}“ hat keinen Wert.")
        elif w > MAX_MASS_MM:
            hinweise.append(f"Maß „{bez}“ {w} mm ist unplausibel groß.")
    for a in anschluesse or []:
        raum = (_g(a, "raum") or "").strip()
        art = _g(a, "art") or "Anschluss"
        if art not in ANSCHLUSS_ARTEN:
            hinweise.append(f"Unbekannte Anschlussart „{art}“.")
        if raum and namen and raum not in namen:
            hinweise.append(f"{art}: Raum „{raum}“ ist nicht erfasst.")
        hoehe = _int(_g(a, "hoehe_mm"))
        if raum in hoehen and hoehe > hoehen[raum]:
            hinweise.append(f"{art} in {raum}: Höhe {hoehe} mm liegt über der Raumhöhe.")
        for feld in ("x_mm", "y_mm", "hoehe_mm"):
            if _int(_g(a, feld)) < 0:
                hinweise.append(f"{art} in {raum or '?'}: negative Position.")
                break
    return hinweise


def raeume_fuer_projekt(raeume, vorhandene):
    """Räume, die im Projekt noch fehlen → [{raum, flaeche_m2}]."""
    vorhanden = {(v or "").strip().lower() for v in vorhandene or []}
    out = []
    for r in raeume or []:
        name = (_g(r, "raum") or "").strip()
        if name and name.lower() not in vorhanden:
            out.append({"raum": name, "flaeche_m2": flaeche_m2(_g(r, "laenge_mm"), _g(r, "breite_mm"))})
            vorhanden.add(name.lower())
    return out
