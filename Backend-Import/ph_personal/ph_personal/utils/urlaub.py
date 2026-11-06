"""Urlaubsrecht Österreich (UrlG) – reine Logik, ohne Frappe.

Regeln (Quelle: Urlaubsgesetz BGBl 390/1976 idgF; Fachkritik 21-kritik-fach-personal.md P8/B4):
  - § 2 Abs 1: 30 Werktage (6-Tage-Woche) = 5 Wochen; nach Vollendung des 25. Dienstjahres 36 Werktage
    = 6 Wochen. Bei anderer Verteilung wird in Arbeitstagen gerechnet: Wochen × Arbeitstage je Woche
    (5-Tage-Woche → 25 bzw. 30 Arbeitstage; 4-Tage-Teilzeit → 20 bzw. 24).
  - § 2 Abs 2: In den ersten 6 Monaten des ersten Arbeitsjahres entsteht der Anspruch aliquot im
    Verhältnis zur zurückgelegten Dienstzeit; ab Beginn des 7. Monats voll.
  - § 2 Abs 4: Urlaubsjahr = Arbeitsjahr; Kalenderjahr nur durch KV/Betriebsvereinbarung (Rumpfjahr aliquot).
  - § 3: Anrechnung von Vordienstzeiten für den 6-Wochen-Anspruch (Feld vordienstzeiten_jahre, max. 5 Jahre
    lt. § 3 Abs 3 für Zeiten bei anderen Arbeitgebern – Prüfung durch Leitung/AR).
  - § 4 Abs 5: Verjährung 2 Jahre nach Ende des Urlaubsjahres, in dem der Anspruch entstanden ist.
  - § 5: Erkrankung > 3 Kalendertage während des Urlaubs wird nicht angerechnet (s. arbeitszeit/Krankmeldung).
  - § 10: Ersatzleistung bei Ende des Arbeitsverhältnisses: aliquoter Anspruch des laufenden Urlaubsjahres
    minus Verbrauch, zuzüglich unverjährter Reste voller Vorjahre.
Verbrauch: FIFO auf den ältesten nicht verjährten Anspruch (übliche Praxis, AR bestätigen).
"""

import calendar
from datetime import date, timedelta

WOCHEN_ANSPRUCH = 5
WOCHEN_ANSPRUCH_LANG = 6
DIENSTJAHRE_LANG = 25
VORDIENSTZEIT_MAX_JAHRE = 5  # § 3 Abs 3 UrlG (Zeiten bei anderen Arbeitgebern)
VERJAEHRUNG_JAHRE = 2
ALIQUOT_MONATE = 6


def _jahre_addieren(d, jahre):
    try:
        return d.replace(year=d.year + jahre)
    except ValueError:  # 29.02.
        return d.replace(year=d.year + jahre, day=28)


def _monate_addieren(d, monate):
    m0 = d.month - 1 + monate
    j = d.year + m0 // 12
    m = m0 % 12 + 1
    return date(j, m, min(d.day, calendar.monthrange(j, m)[1]))


def tage_pro_woche(modell_minuten):
    """Arbeitstage je Woche aus einem Wochenraster [mo, di, mi, do, fr, sa, so] in Minuten (> 0 = Arbeitstag)."""
    return sum(1 for m in (modell_minuten or ()) if (m or 0) > 0)


def werktage_zu_arbeitstage(werktage, arbeitstage_pro_woche=5):
    """§ 2 UrlG: Werktage (6-Tage-Woche) → Arbeitstage der individuellen Verteilung."""
    if not arbeitstage_pro_woche:
        return 0.0
    return round(float(werktage) * arbeitstage_pro_woche / 6, 2)


def arbeitstage_zu_werktage(arbeitstage, arbeitstage_pro_woche=5):
    if not arbeitstage_pro_woche:
        return 0.0
    return round(float(arbeitstage) * 6 / arbeitstage_pro_woche, 2)


def dienstjahre(eintritt, stichtag, vordienstzeiten_jahre=0):
    """Vollendete Dienstjahre am Stichtag (+ angerechnete Vordienstzeiten, max. 5 Jahre)."""
    if not eintritt or stichtag < eintritt:
        return 0
    jahre = stichtag.year - eintritt.year - ((stichtag.month, stichtag.day) < (eintritt.month, eintritt.day))
    return max(0, jahre) + min(int(vordienstzeiten_jahre or 0), VORDIENSTZEIT_MAX_JAHRE)


def anspruch_wochen(eintritt, stichtag, vordienstzeiten_jahre=0):
    """5 oder 6 Wochen: 6 ab dem Urlaubsjahr, das nach Vollendung des 25. Dienstjahres beginnt."""
    return WOCHEN_ANSPRUCH_LANG if dienstjahre(eintritt, stichtag, vordienstzeiten_jahre) >= DIENSTJAHRE_LANG else WOCHEN_ANSPRUCH


def anspruch_arbeitstage(arbeitstage_pro_woche, wochen=WOCHEN_ANSPRUCH):
    """Jahresanspruch in Arbeitstagen = Wochen × Arbeitstage je Woche (5-Tage-Woche: 25/30)."""
    return float(wochen * (arbeitstage_pro_woche or 0))


def urlaubsjahr(eintritt, stichtag, modus="Arbeitsjahr"):
    """(von, bis) des Urlaubsjahres, in das der Stichtag fällt.
    Arbeitsjahr: ab Eintrittstag (Jahrestag); Kalenderjahr: 01.01.–31.12. (im Eintrittsjahr ab Eintritt)."""
    if modus == "Kalenderjahr" or not eintritt:
        von = date(stichtag.year, 1, 1)
        if eintritt and eintritt.year == stichtag.year and eintritt > von:
            von = eintritt
        return von, date(stichtag.year, 12, 31)
    if stichtag < eintritt:
        return eintritt, _jahre_addieren(eintritt, 1) - timedelta(days=1)
    n = stichtag.year - eintritt.year
    beginn = _jahre_addieren(eintritt, n)
    if beginn > stichtag:
        beginn = _jahre_addieren(eintritt, n - 1)
    return beginn, _jahre_addieren(beginn, 1) - timedelta(days=1)


def urlaubsjahre(eintritt, von, bis, modus="Arbeitsjahr"):
    """Alle Urlaubsjahre (von, bis), die den Zeitraum von–bis berühren (aufsteigend)."""
    out = []
    tag = von
    while tag <= bis:
        j = urlaubsjahr(eintritt, tag, modus)
        out.append(j)
        tag = j[1] + timedelta(days=1)
    return out


def verjaehrt_am(urlaubsjahr_bis):
    """§ 4 Abs 5 UrlG: Ablauf von 2 Jahren ab Ende des Urlaubsjahres."""
    return _jahre_addieren(urlaubsjahr_bis, VERJAEHRUNG_JAHRE)


def anspruch_urlaubsjahr(eintritt, jahr_von, jahr_bis, arbeitstage_pro_woche, vordienstzeiten_jahre=0, modus="Arbeitsjahr"):
    """Voller Jahresanspruch eines Urlaubsjahres in Arbeitstagen und ob er aliquot entsteht.

    Rückgabe {anspruch, wochen, aliquot_bis, rumpfjahr_faktor}:
      - aliquot_bis: Datum, bis zu dem der Anspruch nur aliquot verfügbar ist (erstes Arbeitsjahr, § 2 Abs 2)
      - rumpfjahr_faktor: < 1 im Kalenderjahr-Modus für das Eintrittsjahr (anteilig nach Kalendertagen)
    """
    wochen = anspruch_wochen(eintritt, jahr_von, vordienstzeiten_jahre) if modus == "Arbeitsjahr" else anspruch_wochen(eintritt, jahr_bis, vordienstzeiten_jahre)
    voll = anspruch_arbeitstage(arbeitstage_pro_woche, wochen)
    faktor = 1.0
    if modus == "Kalenderjahr" and eintritt and jahr_von <= eintritt <= jahr_bis:
        tage_jahr = (date(jahr_bis.year, 12, 31) - date(jahr_bis.year, 1, 1)).days + 1
        faktor = ((jahr_bis - eintritt).days + 1) / tage_jahr
    erstes = bool(eintritt) and jahr_von <= eintritt <= jahr_bis
    return {
        "anspruch": round(voll * faktor, 2),
        "wochen": wochen,
        "aliquot_bis": _monate_addieren(eintritt, ALIQUOT_MONATE) - timedelta(days=1) if erstes else None,
        "rumpfjahr_faktor": round(faktor, 4),
    }


def verfuegbar_am(anspruch, eintritt, aliquot_bis, stichtag):
    """In den ersten 6 Monaten: aliquot nach zurückgelegter Dienstzeit (Tage/365 × Jahresanspruch)."""
    if not aliquot_bis or stichtag > aliquot_bis:
        return float(anspruch)
    if stichtag < eintritt:
        return 0.0
    tage = (stichtag - eintritt).days + 1
    return round(float(anspruch) * tage / 365, 2)


def aliquot_bis_austritt(anspruch, jahr_von, jahr_bis, austritt):
    """§ 10 UrlG: aliquoter Anspruch des laufenden Urlaubsjahres bis zum Austritt (Kalendertage)."""
    if austritt < jahr_von:
        return 0.0
    tage_jahr = (jahr_bis - jahr_von).days + 1
    tage = (min(austritt, jahr_bis) - jahr_von).days + 1
    return round(float(anspruch) * tage / tage_jahr, 2)


def verbrauch_fifo(konten, buchungen):
    """Verbrauch auf Ansprüche verteilen.

    konten: Liste dict {schluessel, von, bis, anspruch, uebertrag=0, verjaehrt_am}
            (aufsteigend nach von; anspruch inkl. Korrekturen).
    buchungen: Liste (datum, tage) – genehmigter Urlaub tageweise (halbe Tage 0,5).
    Regel: je Urlaubstag zuerst der älteste Anspruch, der am Tag schon entstanden (von ≤ Tag) und
    noch nicht verjährt (Tag < verjaehrt_am) ist und Rest hat; reicht nichts, geht der Tag als
    Vorgriff auf das Urlaubsjahr des Tages (negativer Rest).
    Rückgabe: {schluessel: {verbraucht, rest, vorgriff}}.
    """
    stand = {k["schluessel"]: {"verbraucht": 0.0, "rest": float(k.get("anspruch") or 0) + float(k.get("uebertrag") or 0), "vorgriff": 0.0} for k in konten}
    reihen = sorted(konten, key=lambda k: k["von"])
    for tag, menge in sorted(buchungen, key=lambda b: b[0]):
        offen = float(menge)
        for k in reihen:
            if offen <= 0:
                break
            if k["von"] > tag or (k.get("verjaehrt_am") and tag >= k["verjaehrt_am"]):
                continue
            s = stand[k["schluessel"]]
            nimm = min(offen, max(0.0, s["rest"]))
            if nimm > 0:
                s["rest"] -= nimm
                s["verbraucht"] += nimm
                offen -= nimm
        if offen > 0:
            ziel = next((k for k in reihen if k["von"] <= tag <= k["bis"]), reihen[-1] if reihen else None)
            if ziel is None:
                continue
            s = stand[ziel["schluessel"]]
            s["rest"] -= offen
            s["verbraucht"] += offen
            s["vorgriff"] += offen
    for s in stand.values():
        s["verbraucht"] = round(s["verbraucht"], 2)
        s["rest"] = round(s["rest"], 2)
        s["vorgriff"] = round(s["vorgriff"], 2)
    return stand


def tage_aufteilen(tage, jahre):
    """Urlaubstage tageweise dem Urlaubsjahr zuordnen (Urlaub über den Jahreswechsel).
    tage: Liste (datum, menge); jahre: Liste (von, bis). → {(von, bis): summe}."""
    out = {j: 0.0 for j in jahre}
    for d, menge in tage:
        for j in jahre:
            if j[0] <= d <= j[1]:
                out[j] += float(menge)
                break
    return out


def ersatzleistung_tage(konten_stand, laufend_anspruch, laufend_von, laufend_bis, austritt, laufend_verbraucht):
    """§ 10 UrlG: Tage, für die bei Austritt Ersatzleistung gebührt (negativ = Vorgriff/zu viel verbraucht).

    konten_stand: Reste unverjährter **früherer** Urlaubsjahre (Liste float, Stand am Austritt).
    Laufendes Jahr: aliquot(laufend_anspruch) − laufend_verbraucht.
    Rückforderung von Urlaubsentgelt bei negativem Wert nur in den Fällen des § 10 Abs 1 letzter Satz
    (unberechtigter vorzeitiger Austritt) – Entscheidung Lohnverrechnung/AR, das System rechnet nur.
    """
    aliquot = aliquot_bis_austritt(laufend_anspruch, laufend_von, laufend_bis, austritt)
    return round(sum(max(0.0, float(r)) for r in konten_stand) + aliquot - float(laufend_verbraucht or 0), 2)


def rest_umrechnen(rest_tage, alt_tage_pro_woche, neu_tage_pro_woche):
    """Wechsel der Arbeitstage je Woche (z. B. Vollzeit 5 → Teilzeit 3): Resturlaub in Wochen bleibt gleich.
    (Wertgleichheit des bereits erworbenen Urlaubs – EuGH C-486/08 Zentralbetriebsrat LKH Tirol; AR bestätigen.)"""
    if not alt_tage_pro_woche:
        return float(rest_tage)
    return round(float(rest_tage) * neu_tage_pro_woche / alt_tage_pro_woche, 2)
