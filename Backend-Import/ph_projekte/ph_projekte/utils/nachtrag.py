"""Nachträge/Änderungsaufträge – Beträge, Übergänge, Übernahme ins Projekt. Reine Logik (tests/test_nachtrag.py).

Beträge in Cent (Int), Vorzeichen: neu = Mehrpreis (+), entfall = Minderpreis (−), aenderung = Mehr-/Minderpreis je Stück
(einzel_cent darf negativ sein). Preise sind wie in den Projektpositionen Bruttopreise (Endkunde).
"""

ARTEN = ("neu", "entfall", "aenderung")
STATUS = ("Entwurf", "Vorgelegt", "Freigegeben", "Abgelehnt", "Storniert")
UEBERGAENGE = {
    "Entwurf": {"Vorgelegt", "Storniert"},
    "Vorgelegt": {"Freigegeben", "Abgelehnt", "Entwurf"},
    "Abgelehnt": {"Entwurf"},
    "Freigegeben": set(),
    "Storniert": set(),
}


def _int(v):
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def _g(z, k):
    return z.get(k) if isinstance(z, dict) else getattr(z, k, None)


def zeilenbetrag(art, menge, einzel_cent):
    m = max(_int(menge), 0) or 1
    e = _int(einzel_cent)
    if art == "entfall":
        return -abs(e) * m
    if art == "neu":
        return abs(e) * m
    return e * m


def summen(zeilen):
    neu = sum(zeilenbetrag(_g(z, "art"), _g(z, "menge"), _g(z, "einzel_cent")) for z in zeilen if _g(z, "art") == "neu")
    entfall = sum(zeilenbetrag(_g(z, "art"), _g(z, "menge"), _g(z, "einzel_cent")) for z in zeilen if _g(z, "art") == "entfall")
    aenderung = sum(zeilenbetrag(_g(z, "art"), _g(z, "menge"), _g(z, "einzel_cent")) for z in zeilen if _g(z, "art") == "aenderung")
    ek = sum(_int(_g(z, "ek_cent")) * (max(_int(_g(z, "menge")), 0) or 1) * (-1 if _g(z, "art") == "entfall" else 1) for z in zeilen)
    return {"summe_neu_cent": neu, "summe_entfall_cent": entfall, "summe_aenderung_cent": aenderung, "differenz_cent": neu + entfall + aenderung, "ek_differenz_cent": ek}


def uebergang_erlaubt(von, nach):
    return nach in UEBERGAENGE.get(von or "Entwurf", set())


def pruefen(zeilen):
    """Fehlerliste (leer = ok)."""
    fehler = []
    if not zeilen:
        fehler.append("Der Nachtrag hat keine Positionen.")
    for i, z in enumerate(zeilen, start=1):
        art = _g(z, "art")
        if art not in ARTEN:
            fehler.append(f"Zeile {i}: unbekannte Art „{art}“.")
        if not (_g(z, "bezeichnung") or "").strip():
            fehler.append(f"Zeile {i}: Bezeichnung fehlt.")
        if art in ("entfall", "aenderung") and not _g(z, "bezug_zeile"):
            fehler.append(f"Zeile {i}: Entfall/Änderung braucht die betroffene Projektposition.")
        if art == "neu" and _int(_g(z, "einzel_cent")) < 0:
            fehler.append(f"Zeile {i}: neue Position mit negativem Preis – bitte „entfall“ verwenden.")
    return fehler


def projekt_aenderungen(zeilen, nachtrag_name):
    """→ (neue_positionen[], aenderungen{bezug_zeile: {feld: wert}}) für PH Projekt.positionen.
    entfall setzt lieferstatus=storniert, aenderung schreibt Ausführung/Menge fort."""
    neu, aend = [], {}
    for z in zeilen:
        art = _g(z, "art")
        if art == "neu":
            neu.append({
                "bezeichnung": _g(z, "bezeichnung"), "produkt": _g(z, "produkt"), "ausfuehrung_text": _g(z, "ausfuehrung_text"),
                "menge": max(_int(_g(z, "menge")), 1), "raum": _g(z, "raum"), "preis_cent": abs(_int(_g(z, "einzel_cent"))),
                "ek_cent": _int(_g(z, "ek_cent")), "status": "angeboten", "lieferstatus": "offen", "nachtrag": nachtrag_name,
            })
        elif art == "entfall" and _g(z, "bezug_zeile"):
            aend[_g(z, "bezug_zeile")] = {"lieferstatus": "storniert", "nachtrag": nachtrag_name}
        elif art == "aenderung" and _g(z, "bezug_zeile"):
            w = {"nachtrag": nachtrag_name}
            if (_g(z, "ausfuehrung_text") or "").strip():
                w["ausfuehrung_text"] = _g(z, "ausfuehrung_text")
            aend[_g(z, "bezug_zeile")] = w
    return neu, aend


def portal_status(status):
    return {"Vorgelegt": "pending", "Freigegeben": "approved", "Abgelehnt": "rejected"}.get(status, "draft")
