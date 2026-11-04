"""Fristenberechnung Gewährleistung/Garantie/Regress – reine Logik ohne Frappe (testbar mit unittest).

Rechtsrahmen Österreich (Stand 2026, vom Rechtsanwalt bestätigen lassen, bevor Kundentexte darauf verweisen):
  Verbraucher (VGG, Verträge ab 1.1.2022):
    § 10 Abs 1 VGG  Gewährleistungsfrist 2 Jahre ab Übergabe (bewegliche Sachen).
    § 10 Abs 2 VGG  Verjährung 3 Monate nach Ablauf der Gewährleistungsfrist.
    § 11 VGG        Vermutung der Mangelhaftigkeit bei Übergabe: 1 Jahr (Beweislast beim Unternehmer),
                    danach Beweislast beim Verbraucher.
    § 12 ff VGG     Vorrang Verbesserung/Austausch vor Preisminderung/Vertragsauflösung.
  Unternehmer (ABGB):
    § 933 Abs 1 ABGB  2 Jahre ab Übergabe; Abs 3: Verjährung 3 Monate nach Fristende.
    § 924 ABGB        Vermutung 6 Monate. § 377 UGB: Mängelrüge unverzüglich.
  Regress gegen den Vormann (Hersteller/Lieferant):
    § 933b ABGB  Rückersatz der eigenen Gewährleistungsleistung; Frist 2 Monate ab Erfüllung der eigenen
                 Gewährleistungspflicht, absolut 5 Jahre ab Lieferung an den Händler.
  Garantie: freiwillige Zusage des Herstellers (§ 9b KSchG), läuft getrennt ab Übergabe/Kaufdatum.
"""

from datetime import date, timedelta

GEWAEHRLEISTUNG_MONATE = 24
VERJAEHRUNG_MONATE = 3
VERMUTUNG_MONATE = {"Verbraucher": 12, "Unternehmer": 6}
REGRESS_MONATE = 2
REGRESS_ABSOLUT_JAHRE = 5

STATUS_VERMUTUNG = "Gewaehrleistung (Vermutung)"
STATUS_GEWAEHRLEISTUNG = "Gewaehrleistung"
STATUS_VERJAEHRUNG = "Verjaehrungsfrist"
STATUS_GARANTIE = "Nur Garantie"
STATUS_ABGELAUFEN = "Abgelaufen"
STATUS_UNBEKANNT = "Unbekannt"

AMPEL = {
    STATUS_VERMUTUNG: "gruen",
    STATUS_GEWAEHRLEISTUNG: "gelb",
    STATUS_VERJAEHRUNG: "orange",
    STATUS_GARANTIE: "orange",
    STATUS_ABGELAUFEN: "rot",
    STATUS_UNBEKANNT: "grau",
}

HINWEIS = {
    STATUS_VERMUTUNG: "Gewährleistung läuft; Mangel gilt als bei Übergabe vorhanden (Beweislast beim Unternehmer). Vorrang Verbesserung/Austausch.",
    STATUS_GEWAEHRLEISTUNG: "Gewährleistung läuft; Vermutungsfrist abgelaufen – Kunde muss beweisen, dass der Mangel bei Übergabe vorlag.",
    STATUS_VERJAEHRUNG: "Gewährleistungsfrist abgelaufen; Ansprüche für bereits hervorgekommene Mängel sind noch nicht verjährt (3 Monate).",
    STATUS_GARANTIE: "Gewährleistung abgelaufen; nur Herstellergarantie – Abwicklung nach Garantiebedingungen des Herstellers.",
    STATUS_ABGELAUFEN: "Alle Fristen abgelaufen – nur Kulanz oder kostenpflichtige Reparatur.",
    STATUS_UNBEKANNT: "Kauf- oder Übergabedatum fehlt – Fristen können nicht berechnet werden.",
}


def _schaltjahr(jahr):
    return jahr % 4 == 0 and (jahr % 100 != 0 or jahr % 400 == 0)


def monate_dazu(d, monate):
    """Datum + Monate, Monatsende-sicher (31.01. + 1 Monat = 28./29.02.)."""
    if d is None:
        return None
    jahr = d.year + (d.month - 1 + int(monate)) // 12
    monat = (d.month - 1 + int(monate)) % 12 + 1
    tage = [31, 29 if _schaltjahr(jahr) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    return date(jahr, monat, min(d.day, tage[monat - 1]))


def _datum(wert):
    if wert is None or wert == "":
        return None
    if isinstance(wert, date):
        return wert
    return date.fromisoformat(str(wert)[:10])


def fristen(
    kaufdatum=None,
    uebergabe=None,
    kundentyp="Verbraucher",
    garantie_monate=0,
    heute=None,
    gewaehrleistung_monate=GEWAEHRLEISTUNG_MONATE,
    vermutung_monate=None,
    erledigt_am=None,
    lieferung_an_haendler=None,
):
    """Alle Fristen eines Servicefalls.

    Basis ist die Übergabe (Lieferung/Montage); fehlt sie, das Kaufdatum.
    Rückgabe: dict mit *_bis-Daten, status, ampel, hinweis, tage_rest (bis Ende Gewährleistung),
    beweislast ("Unternehmer"/"Kunde"/None) und regress_* (nur mit erledigt_am).
    """
    heute = _datum(heute) or date.today()
    kauf = _datum(kaufdatum)
    ueber = _datum(uebergabe)
    basis = ueber or kauf
    kundentyp = kundentyp if kundentyp in VERMUTUNG_MONATE else "Verbraucher"
    if vermutung_monate is None:
        vermutung_monate = VERMUTUNG_MONATE[kundentyp]

    out = {
        "basis": basis,
        "gewaehrleistung_bis": None,
        "beweislast_bis": None,
        "verjaehrung_bis": None,
        "garantie_bis": None,
        "regress_frist_bis": None,
        "regress_absolut_bis": None,
        "status": STATUS_UNBEKANNT,
        "ampel": AMPEL[STATUS_UNBEKANNT],
        "hinweis": HINWEIS[STATUS_UNBEKANNT],
        "tage_rest": None,
        "beweislast": None,
        "garantie_aktiv": False,
    }
    if basis is None:
        return out

    gwl = monate_dazu(basis, gewaehrleistung_monate)
    vermutung = monate_dazu(basis, vermutung_monate)
    verjaehrung = monate_dazu(gwl, VERJAEHRUNG_MONATE)
    garantie = monate_dazu(basis, int(garantie_monate or 0)) if int(garantie_monate or 0) > 0 else None

    out.update(gewaehrleistung_bis=gwl, beweislast_bis=vermutung, verjaehrung_bis=verjaehrung, garantie_bis=garantie)
    out["garantie_aktiv"] = bool(garantie and heute <= garantie)
    out["tage_rest"] = (gwl - heute).days

    if heute <= vermutung:
        status, beweislast = STATUS_VERMUTUNG, "Unternehmer"
    elif heute <= gwl:
        status, beweislast = STATUS_GEWAEHRLEISTUNG, "Kunde"
    elif heute <= verjaehrung:
        status, beweislast = STATUS_VERJAEHRUNG, "Kunde"
    elif out["garantie_aktiv"]:
        status, beweislast = STATUS_GARANTIE, None
    else:
        status, beweislast = STATUS_ABGELAUFEN, None
    out.update(status=status, ampel=AMPEL[status], hinweis=HINWEIS[status], beweislast=beweislast)

    erledigt = _datum(erledigt_am)
    if erledigt:
        out["regress_frist_bis"] = monate_dazu(erledigt, REGRESS_MONATE)
    haendler = _datum(lieferung_an_haendler)
    if haendler:
        out["regress_absolut_bis"] = monate_dazu(haendler, REGRESS_ABSOLUT_JAHRE * 12)
    return out


def regress_moeglich(erledigt_am, lieferung_an_haendler=None, heute=None):
    """§ 933b ABGB: Regress innerhalb 2 Monaten ab eigener Erfüllung und binnen 5 Jahren ab Lieferung an den Händler."""
    heute = _datum(heute) or date.today()
    erledigt = _datum(erledigt_am)
    if not erledigt:
        return False, "Servicefall noch nicht erledigt – Regressfrist beginnt mit der eigenen Gewährleistungsleistung."
    frist = monate_dazu(erledigt, REGRESS_MONATE)
    if heute > frist:
        return False, f"Regressfrist (2 Monate, § 933b ABGB) am {frist.strftime('%d.%m.%Y')} abgelaufen."
    haendler = _datum(lieferung_an_haendler)
    if haendler and heute > monate_dazu(haendler, REGRESS_ABSOLUT_JAHRE * 12):
        return False, "Absolute Regressfrist (5 Jahre ab Lieferung an den Händler) abgelaufen."
    return True, f"Regress möglich bis {frist.strftime('%d.%m.%Y')}."


def tage_bis(datum, heute=None):
    heute = _datum(heute) or date.today()
    d = _datum(datum)
    return (d - heute).days if d else None


def ablaufend(gewaehrleistung_bis, tage=60, heute=None):
    """Läuft die Gewährleistung in den nächsten `tage` Tagen ab (und ist noch nicht vorbei)?"""
    rest = tage_bis(gewaehrleistung_bis, heute)
    return rest is not None and 0 <= rest <= int(tage)


def durchlaufzeit_tage(gemeldet_am, erledigt_am, heute=None):
    start = _datum(gemeldet_am)
    if not start:
        return None
    ende = _datum(erledigt_am) or _datum(heute) or date.today()
    return max(0, (ende - start).days)


def reaktionsfrist(gemeldet_am, werktage=2):
    """Reaktionsfrist = gemeldet + n Werktage (Sa/So übersprungen; Feiertage über Holiday List in Frappe)."""
    d = _datum(gemeldet_am)
    if not d:
        return None
    rest = int(werktage)
    while rest > 0:
        d = d + timedelta(days=1)
        if d.weekday() < 5:
            rest -= 1
    return d
