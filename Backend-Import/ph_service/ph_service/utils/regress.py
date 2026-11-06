"""Gutschrift-Abgleich beim Lieferantenregress (Soll = anerkannt, Ist = Gutschrift/Zahlung) – reine Logik.

Herstellerreklamation mit Regress § 933b ABGB: Der Lieferant erkennt einen Betrag an (Soll); später kommt eine
Gutschrift/Verrechnung (Ist). Differenzen bis zur Toleranz gelten als ausgeglichen (Rundung, Spesen),
größere Abweichungen bleiben offen (Unterdeckung) bzw. werden geprüft (Überdeckung); eine Unterdeckung kann die
Leitung mit Grund ausbuchen.
"""

OFFEN = "Offen"
AUSGEGLICHEN = "Ausgeglichen"
UNTERDECKUNG = "Unterdeckung"
UEBERDECKUNG = "Ueberdeckung"
AUSGEBUCHT = "Ausgebucht"


def abgleich(gefordert_cent, anerkannt_cent, erhalten_cent, toleranz_cent=100, ausgebucht=False):
    """→ dict(soll_cent, ist_cent, differenz_cent, status, quote_promille, nicht_anerkannt_cent).

    soll = anerkannt (sonst gefordert); differenz = soll − ist (positiv = fehlt noch)."""
    gefordert = int(gefordert_cent or 0)
    anerkannt = int(anerkannt_cent or 0)
    ist = int(erhalten_cent or 0)
    soll = anerkannt or gefordert
    diff = soll - ist
    if ist == 0 and soll > 0:
        status = AUSGEBUCHT if ausgebucht else OFFEN
    elif abs(diff) <= int(toleranz_cent or 0):
        status = AUSGEGLICHEN
    elif diff > 0:
        status = AUSGEBUCHT if ausgebucht else UNTERDECKUNG
    else:
        status = UEBERDECKUNG
    quote = int(round(ist * 1000 / gefordert)) if gefordert else None
    return {
        "soll_cent": soll,
        "ist_cent": ist,
        "differenz_cent": diff,
        "status": status,
        "quote_promille": quote,
        "nicht_anerkannt_cent": max(0, gefordert - anerkannt) if anerkannt else 0,
    }


def zeilenbetrag(menge, satz_cent):
    """Menge (Stunden/km/Stück, Float) × Satz in Cent → ganze Cent (kaufmännisch gerundet)."""
    from decimal import ROUND_HALF_UP, Decimal

    return int((Decimal(str(menge or 0)) * Decimal(int(satz_cent or 0))).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def mahnung_faellig(heute, frist_bis, letzte_mahnung=None, stufe=0, abstand_tage=14, max_stufe=3):
    """Anmahnung beim Hersteller: nach Fristablauf Stufe 1, danach je `abstand_tage` eine Stufe weiter, höchstens max_stufe.
    → nächste Stufe (int) oder 0, wenn nichts fällig ist. Gilt für Gutschrift- und Abholfristen."""
    from datetime import timedelta

    if not frist_bis or heute <= frist_bis or int(stufe or 0) >= int(max_stufe):
        return 0
    if letzte_mahnung and heute < letzte_mahnung + timedelta(days=int(abstand_tage)):
        return 0
    return int(stufe or 0) + 1


KOSTENART = {
    "Intern Arbeitszeit": "Arbeitszeit",
    "Intern Anfahrt": "Anfahrt",
    "Ersatzteil": "Ersatzteil",
    "Extern Fremdleistung": "Fremdleistung",
    "Extern Transport": "Transport",
    "Sonstiges": "Pauschale",
}


def belastungszeilen(kosten, einsaetze=None):
    """Regressfähige Kosten des Servicefalls → Zeilen der Belastungsanzeige.

    kosten = [dict(name, art, beschreibung, betrag_cent, regressfaehig, einsatz)], einsaetze = {name: dict(zeit_arbeit_min,
    zeit_anfahrt_min, stundensatz_cent, anfahrt_km)}. Arbeitszeit/Anfahrt mit Einsatz → Stunden × Stundensatz (Betrag bleibt
    der gebuchte); Kulanz/Preisminderung werden nie weiterbelastet."""
    einsaetze = einsaetze or {}
    out = []
    for k in kosten or []:
        art = KOSTENART.get(k.get("art"))
        if not art or not int(k.get("regressfaehig") or 0) or int(k.get("betrag_cent") or 0) <= 0:
            continue
        zeile = {"kostenart": art, "beschreibung": (k.get("beschreibung") or art)[:140], "menge": 1, "einheit": "pauschal", "satz_cent": int(k["betrag_cent"]), "betrag_cent": int(k["betrag_cent"]), "quelle_zeile": k.get("name"), "einsatz": k.get("einsatz")}
        e = einsaetze.get(k.get("einsatz") or "")
        if e and art in ("Arbeitszeit", "Anfahrt") and int(e.get("stundensatz_cent") or 0):
            minuten = int(e.get("zeit_arbeit_min" if art == "Arbeitszeit" else "zeit_anfahrt_min") or 0)
            if minuten:
                zeile.update(menge=round(minuten / 60, 2), einheit="h", satz_cent=int(e["stundensatz_cent"]))
        out.append(zeile)
    return out
