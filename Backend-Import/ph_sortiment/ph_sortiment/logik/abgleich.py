"""AB-Abgleich: Auftragsbestätigung des Lieferanten gegen die Bestellung prüfen.

Vorbild SHD „kiwi“ (referenz/VORBILD-SHD-sauter-held-2026-11-03.md): je Position werden Preis,
Menge, Termin und Artikelnummer verglichen; jede Abweichung wird als Protokollzeile mit
Bewertung (offen/ok/pruefen/abgelehnt) festgehalten. Toleranzen kommen aus
PH Sortiment Einstellungen (ab_toleranz_preis_prozent, ab_toleranz_termin_tage).

Reine Logik: Positionen sind dicts, Rückgabe sind dicts für die Kindtabelle PH AB Abgleich.
"""

from datetime import date

FELDER = ("Preis", "Menge", "Termin", "Artikel", "Ausfuehrung")

# Klärung einer Abweichung (Methode PH Herstellerbestellung.abweichung_klaeren) → Bewertung + Klärungsvermerk
KLAERUNG = {
    "akzeptieren": ("ok", "akzeptiert"),
    "lieferant_reklamieren": ("pruefen", "beim Lieferanten reklamiert"),
    "kunde_rueckfragen": ("pruefen", "Kundenrueckfrage"),
}


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

    # Ausführung (Stoff/Farbe/Maß laut AB gegen bestellte Ausführung, Groß-/Kleinschreibung und Leerraum egal)
    if pos.get("ab_ausfuehrung_text") and pos.get("ausfuehrung_text"):
        a, b = _text(pos["ausfuehrung_text"]), _text(pos["ab_ausfuehrung_text"])
        if a != b:
            zeilen.append({**basis, "feld": "Ausfuehrung", "bestellt": str(pos["ausfuehrung_text"])[:140], "bestaetigt": str(pos["ab_ausfuehrung_text"])[:140], "abweichung_text": "Ausführung weicht ab"})

    return zeilen


def _text(v):
    return " ".join(str(v or "").replace(",", " ").split()).casefold()


def klaerung(aktion):
    """(bewertung, vermerk) für eine Klärungsaktion; unbekannt → ValueError."""
    if aktion not in KLAERUNG:
        raise ValueError("Unbekannte Klärung {0}".format(aktion))
    return KLAERUNG[aktion]


def reklamation_text(zeilen, bestellung, ab_nummer=None, zusatz=None):
    """Mailtext an den Lieferanten zu Abweichungen der AB (Liste Protokollzeilen)."""
    punkte = "\n".join("- Pos. {0} {1}: {2} bestellt {3}, bestätigt {4}".format(z.get("position"), z.get("bezeichnung") or "", z.get("feld"), z.get("bestellt"), z.get("bestaetigt")) for z in zeilen)
    return ("Sehr geehrte Damen und Herren,\n\nIhre Auftragsbestätigung {0} zu unserer Bestellung {1} weicht von unserer Bestellung ab:\n{2}\n\n{3}"
            "Bitte korrigieren Sie die Auftragsbestätigung oder nehmen Sie kurz Stellung.\n\nMit freundlichen Grüßen\nPlatzhirsch Home Living").format(ab_nummer or "", bestellung, punkte, (zusatz + "\n\n") if zusatz else "")


def mengen_abgleich(menge_erwartet, menge_erhalten):
    """Wareneingang je Position: (differenz, 'keine'|'Unterlieferung'|'Ueberlieferung')."""
    d = int(menge_erhalten or 0) - int(menge_erwartet or 0)
    return d, ("keine" if d == 0 else ("Ueberlieferung" if d > 0 else "Unterlieferung"))


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
