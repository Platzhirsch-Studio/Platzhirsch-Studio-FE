"""SLA-Fristen (Reaktion/Lösung) je Priorität in Werktagen, Feiertage als Menge – reine Logik ohne Frappe.

Vorbild Odoo Helpdesk „SLA-Richtlinien je Priorität“ (Marktresearch/digital/backoffice/30-marktfunktionen.md, service).
Werktage = Mo–Fr ohne Feiertage/Betriebsurlaub (Feiertage aus ph_crm PH Termin Einstellungen bzw.
ph_crm/utils/feiertage.py, übergeben als Menge von date). Samstag zählt bewusst nicht: Service-Team arbeitet Mo–Fr.
"""

from datetime import date, datetime, timedelta

PRIORITAETEN = ("Niedrig", "Normal", "Hoch", "Dringend")

# Voreinstellung (PH Service Einstellungen überschreibt): Werktage bis Erstreaktion / bis Lösung.
STANDARD_REAKTION = {"Niedrig": 3, "Normal": 2, "Hoch": 1, "Dringend": 0}
STANDARD_LOESUNG = {"Niedrig": 30, "Normal": 20, "Hoch": 10, "Dringend": 3}

STATUS_IM_PLAN = "Im Plan"
STATUS_GEFAEHRDET = "Gefaehrdet"
STATUS_VERLETZT = "Verletzt"
STATUS_ERFUELLT = "Erfuellt"


def _tag(wert):
    if wert is None or wert == "":
        return None
    if isinstance(wert, datetime):
        return wert.date()
    if isinstance(wert, date):
        return wert
    return date.fromisoformat(str(wert)[:10])


def ist_werktag(d, feiertage=()):
    return d.weekday() < 5 and d not in set(feiertage or ())


def naechster_werktag(d, feiertage=()):
    """d selbst, wenn Werktag, sonst der nächste (für Termine, die auf Wochenende/Feiertag fallen)."""
    d = _tag(d)
    feiertage = set(feiertage or ())
    while not ist_werktag(d, feiertage):
        d += timedelta(days=1)
    return d


def plus_werktage(start, werktage, feiertage=()):
    """start + n Werktage. n = 0 → derselbe Tag, wenn Werktag, sonst nächster Werktag (Dringend = heute)."""
    d = _tag(start)
    if d is None:
        return None
    feiertage = set(feiertage or ())
    rest = max(0, int(werktage or 0))
    if rest == 0:
        return naechster_werktag(d, feiertage)
    while rest > 0:
        d += timedelta(days=1)
        if ist_werktag(d, feiertage):
            rest -= 1
    return d


def werktage_zwischen(von, bis, feiertage=()):
    """Anzahl Werktage in (von, bis] – negativ, wenn bis vor von liegt."""
    a, b = _tag(von), _tag(bis)
    if a is None or b is None:
        return None
    vorzeichen = 1
    if b < a:
        a, b, vorzeichen = b, a, -1
    feiertage = set(feiertage or ())
    n, d = 0, a
    while d < b:
        d += timedelta(days=1)
        if ist_werktag(d, feiertage):
            n += 1
    return n * vorzeichen


def fristen(gemeldet_am, prioritaet="Normal", reaktion=None, loesung=None, feiertage=()):
    """→ dict(frist_reaktion, frist_loesung) als date; reaktion/loesung = dict Priorität → Werktage."""
    prioritaet = prioritaet if prioritaet in PRIORITAETEN else "Normal"
    r = dict(STANDARD_REAKTION, **(reaktion or {}))
    lo = dict(STANDARD_LOESUNG, **(loesung or {}))
    return {
        "frist_reaktion": plus_werktage(gemeldet_am, r[prioritaet], feiertage),
        "frist_loesung": plus_werktage(gemeldet_am, lo[prioritaet], feiertage),
    }


STATUS_PAUSIERT = "Pausiert"


def pause_werktage(seit, bis, feiertage=()):
    """Werktage einer SLA-Pause („wartet auf Hersteller/Ersatzteil/Kunde“), die der Lösungsfrist hinzugerechnet werden.
    Pause am selben Tag begonnen und beendet = 0; jeder angebrochene Werktag nach dem Starttag zählt."""
    n = werktage_zwischen(seit, bis, feiertage)
    return max(0, n or 0)


def frist_verschieben(frist, werktage, feiertage=()):
    """Lösungsfrist um pausierte Werktage verschieben."""
    if not frist or not int(werktage or 0):
        return _tag(frist)
    return plus_werktage(frist, int(werktage), feiertage)


def status(heute, frist_reaktion, frist_loesung, erstreaktion_am=None, erledigt_am=None, warn_werktage=2, feiertage=(), pausiert_seit=None):
    """SLA-Zustand: Verletzt (eine Frist gerissen), Erfuellt (erledigt in Frist), Gefaehrdet (Lösung in ≤ warn
    Werktagen oder Reaktion heute fällig), sonst Im Plan.
    Rückgabe dict(status, reaktion_verletzt, loesung_verletzt, werktage_rest)."""
    heute = _tag(heute)
    fr, fl = _tag(frist_reaktion), _tag(frist_loesung)
    reakt, erl = _tag(erstreaktion_am), _tag(erledigt_am)
    reaktion_verletzt = bool(fr and ((reakt and reakt > fr) or (not reakt and not erl and heute > fr)))
    loesung_verletzt = bool(fl and ((erl and erl > fl) or (not erl and heute > fl)))
    if pausiert_seit and not erl:
        # Während der Pause läuft die Lösungsfrist nicht: Frist um die bisherige Pause verschieben, nicht verletzt.
        fl = frist_verschieben(fl, pause_werktage(pausiert_seit, heute, feiertage), feiertage)
        loesung_verletzt = bool(fl and heute > fl)
    rest = werktage_zwischen(heute, fl, feiertage) if fl and not erl else None
    if pausiert_seit and not erl and not reaktion_verletzt and not loesung_verletzt:
        st = STATUS_PAUSIERT
    elif reaktion_verletzt or loesung_verletzt:
        st = STATUS_VERLETZT
    elif erl:
        st = STATUS_ERFUELLT
    elif (rest is not None and rest <= int(warn_werktage)) or (fr and not reakt and heute == fr):
        st = STATUS_GEFAEHRDET
    else:
        st = STATUS_IM_PLAN
    return {"status": st, "reaktion_verletzt": reaktion_verletzt, "loesung_verletzt": loesung_verletzt, "werktage_rest": rest}


def eskalationsstufe(heute, frist_loesung, erledigt_am=None, stufen_werktage=(0, 3, 10), feiertage=()):
    """Eskalationsstufe aus der Lösungsfrist: 0 = in Frist; 1 = Frist überschritten; 2 = > 3 Werktage drüber
    (Geschäftsführung informieren); 3 = > 10 Werktage drüber. Unabhängig von „ohne Bewegung“ (tasks.eskalation)."""
    fl = _tag(frist_loesung)
    if not fl or _tag(erledigt_am):
        return 0
    drueber = werktage_zwischen(fl, heute, feiertage)
    if drueber is None or drueber <= stufen_werktage[0]:
        return 0
    stufe = 1
    for i, grenze in enumerate(stufen_werktage[1:], start=2):
        if drueber > grenze:
            stufe = i
    return stufe
