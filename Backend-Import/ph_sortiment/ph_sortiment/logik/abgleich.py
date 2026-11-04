"""AB-Abgleich: Auftragsbestätigung des Lieferanten gegen die Bestellung prüfen.

Vorbild SHD „kiwi“ (referenz/VORBILD-SHD-sauter-held-2026-11-03.md): je Position werden Preis,
Menge, Termin und Artikelnummer verglichen; jede Abweichung wird als Protokollzeile mit
Bewertung (offen/ok/pruefen/abgelehnt) festgehalten. Toleranzen kommen aus
PH Sortiment Einstellungen (ab_toleranz_preis_prozent, ab_toleranz_termin_tage).

Reine Logik: Positionen sind dicts, Rückgabe sind dicts für die Kindtabelle PH AB Abgleich.
"""

from datetime import date

FELDER = ("Preis", "Menge", "Termin", "Artikel")


def _d(v):
    if isinstance(v, date):
        return v
    return date.fromisoformat(str(v)[:10]) if v else None


def _cent(v):
    return f"{int(v) / 100:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + " €" if v is not None else "–"


def _datum(v):
    d = _d(v)
    return d.strftime("%d.%m.%Y") if d else "–"


def abweichungen_position(pos, idx, toleranz_preis_prozent=0, toleranz_termin_tage=0):
    """Abweichungen einer Position: Liste von Protokollzeilen (leer = keine Abweichung).

    pos: dict mit menge, ek_cent, wunschtermin, hersteller_artikelnr, bezeichnung, produkt und den
    AB-Feldern ab_menge, ab_ek_cent, bestaetigter_termin, ab_artikelnr. AB-Felder, die leer sind,
    gelten als „nicht bestätigt“ und werden nicht verglichen (außer ab_menge = 0 → Menge 0).
    """
    zeilen = []
    basis = {"position": idx, "produkt": pos.get("produkt"), "bezeichnung": pos.get("bezeichnung"), "bewertung": "offen"}

    # Menge
    if pos.get("ab_menge") is not None and pos.get("ab_menge") != "":
        soll, ist = int(pos.get("menge") or 0), int(pos.get("ab_menge") or 0)
        if soll != ist:
            zeilen.append({**basis, "feld": "Menge", "bestellt": str(soll), "bestaetigt": str(ist), "abweichung_text": f"{ist - soll:+d} Stk"})

    # Preis (EK netto)
    if pos.get("ab_ek_cent") not in (None, "") and pos.get("ek_cent") not in (None, ""):
        soll, ist = int(pos["ek_cent"]), int(pos["ab_ek_cent"])
        if soll != ist:
            prozent = (ist - soll) * 100.0 / soll if soll else 100.0
            if abs(prozent) > toleranz_preis_prozent:
                zeilen.append({**basis, "feld": "Preis", "bestellt": _cent(soll), "bestaetigt": _cent(ist), "abweichung_text": f"{(ist - soll) / 100:+.2f} € ({prozent:+.1f} %)"})

    # Termin
    if pos.get("bestaetigter_termin") and pos.get("wunschtermin"):
        soll, ist = _d(pos["wunschtermin"]), _d(pos["bestaetigter_termin"])
        tage = (ist - soll).days
        if tage > toleranz_termin_tage:
            zeilen.append({**basis, "feld": "Termin", "bestellt": _datum(soll), "bestaetigt": _datum(ist), "abweichung_text": f"{tage:+d} Tage"})

    # Artikelnummer
    if pos.get("ab_artikelnr") and pos.get("hersteller_artikelnr"):
        a, b = str(pos["hersteller_artikelnr"]).strip().upper(), str(pos["ab_artikelnr"]).strip().upper()
        if a != b:
            zeilen.append({**basis, "feld": "Artikel", "bestellt": a, "bestaetigt": b, "abweichung_text": "Artikelnummer weicht ab"})

    return zeilen


def abweichung_kennzeichen(zeilen):
    """'keine' | 'Preis' | 'Menge' | 'Termin' | 'Artikel' | 'Mehrfach' für das Positionsfeld abweichung."""
    felder = {z["feld"] for z in zeilen}
    if not felder:
        return "keine"
    return felder.pop() if len(felder) == 1 else "Mehrfach"


def abgleich(positionen, toleranz_preis_prozent=0, toleranz_termin_tage=0):
    """Gesamtes Protokoll: (protokollzeilen, kennzeichen_je_position[idx], spaetester_termin)."""
    protokoll, kennzeichen, termine = [], {}, []
    for i, pos in enumerate(positionen, start=1):
        z = abweichungen_position(pos, i, toleranz_preis_prozent, toleranz_termin_tage)
        protokoll.extend(z)
        kennzeichen[i] = abweichung_kennzeichen(z)
        if pos.get("bestaetigter_termin"):
            termine.append(_d(pos["bestaetigter_termin"]))
    return protokoll, kennzeichen, (max(termine) if termine else None)


def offen(protokoll):
    """Anzahl Zeilen, die noch nicht mit ok/abgelehnt bewertet sind."""
    return sum(1 for z in protokoll if (z.get("bewertung") or "offen") in ("offen", "pruefen"))


def bestellstatus_aus_mengen(positionen):
    """'Geliefert' | 'Teilgeliefert' | None aus menge/menge_erhalten der Positionen (ohne stornierte)."""
    aktiv = [p for p in positionen if p.get("status") != "Storniert"]
    if not aktiv:
        return None
    soll = sum(int(p.get("menge") or 0) for p in aktiv)
    ist = sum(int(p.get("menge_erhalten") or 0) for p in aktiv)
    if soll and ist >= soll:
        return "Geliefert"
    if ist > 0:
        return "Teilgeliefert"
    return None


def wareneingang_status(positionen):
    """Status eines Wareneingangs aus seinen Positionen: Reklamiert > Vollstaendig > Teilweise > Offen."""
    if any(p.get("zustand") in ("Transportschaden", "beschaedigt", "falsch") for p in positionen):
        return "Reklamiert"
    erwartet = sum(int(p.get("menge_erwartet") or 0) for p in positionen)
    erhalten = sum(int(p.get("menge_erhalten") or 0) for p in positionen)
    if erhalten <= 0:
        return "Offen"
    if erwartet and erhalten < erwartet:
        return "Teilweise"
    return "Vollstaendig"
