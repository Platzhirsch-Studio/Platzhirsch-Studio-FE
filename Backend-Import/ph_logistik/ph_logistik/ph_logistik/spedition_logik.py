"""Reine Logik Speditionsauftrag (Großmöbel) ohne Frappe: Summen, Lademeter, Volumen, Pflichtangaben für die Anfrage.

Lademeter (LDM) = belegte Ladefläche / Ladebreite. Standard-Ladebreite Sattel/Planen-LKW 240 cm (EUR-Palette 120×80 → 0,4 LDM).
Stapelbare Packstücke teilen sich die Fläche bis zur Laderaumhöhe (Standard 240 cm). Werte sind Planungsgrößen – der Spediteur bestätigt.
"""

import math

LADEBREITE_CM = 240
LADEHOEHE_CM = 240
ARTEN = ("Palette", "Kolli", "Moebel lose", "Gitterbox")


def _int(v):
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def summen(packstuecke, ladebreite_cm=LADEBREITE_CM, ladehoehe_cm=LADEHOEHE_CM):
    """packstuecke: [{art, anzahl, laenge_cm, breite_cm, hoehe_cm, gewicht_g (je Stück), stapelbar}]
    → {anzahl, gewicht_g, volumen_m3, lademeter, fehlende_masse}"""
    anzahl = gewicht = 0
    volumen_cm3 = 0
    flaeche_cm2 = 0.0
    fehlend = 0
    for p in packstuecke or []:
        n = max(_int(p.get("anzahl")), 0) or 1
        l, b, h = _int(p.get("laenge_cm")), _int(p.get("breite_cm")), _int(p.get("hoehe_cm"))
        anzahl += n
        gewicht += n * max(_int(p.get("gewicht_g")), 0)
        if not (l and b and h):
            fehlend += 1
            continue
        volumen_cm3 += n * l * b * h
        stapel = max(ladehoehe_cm // h, 1) if p.get("stapelbar") and h else 1
        stellplaetze = math.ceil(n / stapel)
        flaeche_cm2 += stellplaetze * l * b
    return {
        "anzahl": anzahl,
        "gewicht_g": gewicht,
        "volumen_m3": round(volumen_cm3 / 1_000_000, 3),
        "lademeter": round(flaeche_cm2 / ladebreite_cm / 100, 2) if ladebreite_cm else 0.0,
        "fehlende_masse": fehlend,
    }


def pruefen(auftrag, packstuecke):
    """Pflichtangaben vor dem Senden an den Spediteur → Liste von Fehlertexten (leer = ok)."""
    f = []
    if not auftrag.get("spediteur_email"):
        f.append("E-Mail des Spediteurs fehlt")
    for pre, label in (("abhol", "Abholadresse"), ("ziel", "Zieladresse")):
        if not (auftrag.get(f"{pre}_plz") and auftrag.get(f"{pre}_ort")):
            f.append(f"{label} (PLZ, Ort) fehlt")
    if not (auftrag.get("abhol_datum") or auftrag.get("zustell_datum")):
        f.append("Abhol- oder Zustelldatum fehlt")
    if not packstuecke:
        f.append("Mindestens ein Packstück ist nötig")
    for i, p in enumerate(packstuecke or [], start=1):
        if p.get("art") and p["art"] not in ARTEN:
            f.append(f"Packstück {i}: unbekannte Art {p['art']}")
        if _int(p.get("gewicht_g")) <= 0:
            f.append(f"Packstück {i}: Gewicht fehlt")
    if auftrag.get("abhol_von") and auftrag.get("abhol_bis") and str(auftrag["abhol_von"]) >= str(auftrag["abhol_bis"]):
        f.append("Abhol-Zeitfenster: von muss vor bis liegen")
    if auftrag.get("zustell_von") and auftrag.get("zustell_bis") and str(auftrag["zustell_von"]) >= str(auftrag["zustell_bis"]):
        f.append("Zustell-Zeitfenster: von muss vor bis liegen")
    return f


def leistungen_text(auftrag):
    """Zusatzleistungen als lesbare Liste (Druck/Mail)."""
    t = []
    if auftrag.get("avis_noetig"):
        t.append("telefonisches Avis vor Zustellung")
    if _int(auftrag.get("etage")):
        t.append(f"Etage {_int(auftrag['etage'])}" + (" mit Aufzug" if auftrag.get("aufzug") else " ohne Aufzug"))
    if auftrag.get("hebebuehne"):
        t.append("Hebebühne")
    if auftrag.get("trageservice"):
        t.append("Trageservice (2 Personen)")
    if auftrag.get("montage"):
        t.append("Montage")
    if auftrag.get("verpackung_entsorgen"):
        t.append("Verpackung mitnehmen")
    if auftrag.get("zustellart"):
        t.append(f"Zustellung: {auftrag['zustellart']}")
    return t
