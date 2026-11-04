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


def gebuehr(stufe, einst):
    return int(einst.get({1: "gebuehr1_cent", 2: "gebuehr2_cent", 3: "gebuehr3_cent"}.get(int(stufe or 1), "gebuehr1_cent")) or 0)


def mahnbetrag(offen_cent, stufe, tage, einst, unternehmer=False):
    """→ dict mahngebuehr_cent, verzugszinsen_cent, zinssatz_promille, gesamt_cent."""
    satz = int(einst.get("zinssatz_unternehmer_promille" if unternehmer else "zinssatz_verbraucher_promille") or 0)
    zinsen = verzugszinsen(offen_cent, tage, satz) if int(stufe) >= int(einst.get("zinsen_ab_stufe") or 2) else 0
    geb = gebuehr(stufe, einst)
    return {"mahngebuehr_cent": geb, "verzugszinsen_cent": zinsen, "zinssatz_promille": satz if zinsen else 0, "gesamt_cent": int(offen_cent or 0) + geb + zinsen}
