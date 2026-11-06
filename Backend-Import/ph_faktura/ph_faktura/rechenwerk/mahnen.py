"""Mahnwesen: Stufe aus Verzugstagen, Verzugszinsen (§ 1000 ABGB Verbraucher 4 % p. a.,
§ 456 UGB Unternehmer 9,2 Prozentpunkte über Basiszins) – Sätze kommen aus PH Mahnwesen Einstellungen."""

from decimal import Decimal

from .steuer import rund


def verzugstage(faellig, stichtag, karenz_tage=0):
    """Tage zwischen Fälligkeit (+ Karenz) und Stichtag, nie negativ."""
    if not faellig or not stichtag:
        return 0
    tage = (stichtag - faellig).days - int(karenz_tage or 0)
    return max(tage, 0)


def stufe_bestimmen(tage, einst, letzte_stufe=0, tage_seit_letzter=None):
    """Nächste Mahnstufe (1–3) oder 0, wenn (noch) nicht zu mahnen.
    einst: dict mit stufe1_tage, stufe2_tage, stufe3_tage, abstand_tage."""
    if tage_seit_letzter is not None and letzte_stufe and tage_seit_letzter < int(einst.get("abstand_tage") or 0):
        return 0
    stufe = 0
    if tage >= int(einst.get("stufe1_tage") or 7):
        stufe = 1
    if tage >= int(einst.get("stufe2_tage") or 14):
        stufe = 2
    if tage >= int(einst.get("stufe3_tage") or 21):
        stufe = 3
    if stufe <= letzte_stufe:
        # Nächste Stufe frühestens nach Abstand, aber höchstens Stufe 3 und nur, wenn Tage für sie reichen
        if letzte_stufe < 3 and tage_seit_letzter is not None and tage_seit_letzter >= int(einst.get("abstand_tage") or 0):
            return letzte_stufe + 1
        return 0
    return stufe


def verzugszinsen(betrag_cent, tage, zinssatz_promille):
    """Einfache Zinsen: Betrag × Satz × Tage / 365."""
    if int(betrag_cent or 0) <= 0 or int(tage or 0) <= 0 or int(zinssatz_promille or 0) <= 0:
        return 0
    return rund(Decimal(int(betrag_cent)) * Decimal(int(zinssatz_promille)) / Decimal(1000) * Decimal(int(tage)) / Decimal(365))


def zinssatz_unternehmer_bp(basiszinssatz_bp):
    """§ 456 UGB: 9,2 Prozentpunkte über dem Basiszinssatz (OeNB, halbjährlich 1.1./1.7.) – in Basispunkten (×100)."""
    return int(basiszinssatz_bp) + 920


def verzugszinsen_bp(betrag_cent, tage, zinssatz_bp):
    """Einfache Zinsen mit Satz in Basispunkten (1073 = 10,73 % p. a.), Tage/365."""
    if int(betrag_cent or 0) <= 0 or int(tage or 0) <= 0 or int(zinssatz_bp or 0) <= 0:
        return 0
    return rund(Decimal(int(betrag_cent)) * Decimal(int(zinssatz_bp)) / Decimal(10000) * Decimal(int(tage)) / Decimal(365))


def gebuehr(stufe, einst):
    return int(einst.get({1: "gebuehr1_cent", 2: "gebuehr2_cent", 3: "gebuehr3_cent"}.get(int(stufe or 1), "gebuehr1_cent")) or 0)


def mahnbetrag(offen_cent, stufe, tage, einst, unternehmer=False, pauschale_bereits=False):
    """→ dict mahngebuehr_cent, verzugszinsen_cent, zinssatz_promille, zinssatz_bp, pauschale_cent, gesamt_cent.

    Österreich: Verbraucher 4 % p. a. (§ 1000 Abs 1 ABGB), Mahnspesen nur angemessen und bei verschuldetem
    Verzug (§ 1333 Abs 2 ABGB) – Gebühr je Stufe aus den Einstellungen. Unternehmer: 9,2 Prozentpunkte über
    Basiszinssatz (§ 456 UGB), sobald `basiszinssatz_bp` gepflegt ist (sonst fester Satz
    zinssatz_unternehmer_promille), plus einmalig 40 € Betreibungspauschale (§ 458 UGB, `pauschale_unternehmer_cent`)
    – anstelle der Stufen-Gebühr der ersten Mahnung, nie doppelt (pauschale_bereits).
    """
    zinsen_ab = int(einst.get("zinsen_ab_stufe") or 2)
    basis = einst.get("basiszinssatz_bp")
    satz_bp = 0
    if unternehmer and basis not in (None, ""):
        satz_bp = zinssatz_unternehmer_bp(int(basis))
        zinsen = verzugszinsen_bp(offen_cent, tage, satz_bp) if int(stufe) >= zinsen_ab else 0
        satz = rund(Decimal(satz_bp) / Decimal(10)) if zinsen else 0
    else:
        satz = int(einst.get("zinssatz_unternehmer_promille" if unternehmer else "zinssatz_verbraucher_promille") or 0)
        zinsen = verzugszinsen(offen_cent, tage, satz) if int(stufe) >= zinsen_ab else 0
        satz_bp = satz * 10 if zinsen else 0
        satz = satz if zinsen else 0
    geb = gebuehr(stufe, einst)
    pauschale = 0
    if unternehmer and int(einst.get("pauschale_unternehmer_cent") or 0) and not pauschale_bereits:
        pauschale = int(einst["pauschale_unternehmer_cent"])
        geb = 0  # § 458 UGB: Pauschale deckt die Betreibungskosten der Mahnung ab
    return {"mahngebuehr_cent": geb + pauschale, "pauschale_cent": pauschale, "verzugszinsen_cent": zinsen, "zinssatz_promille": satz, "zinssatz_bp": satz_bp if zinsen else 0, "gesamt_cent": int(offen_cent or 0) + geb + pauschale + zinsen}
