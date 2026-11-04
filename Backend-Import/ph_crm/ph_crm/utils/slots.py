"""Freie Terminzeiten berechnen – reines Python (ohne Frappe), testbar per unittest.

Regeln wie die Website (src/lib/booking/slots.js, constants.js), damit Mock und Backoffice gleich
rechnen:
  - Raster der Startzeiten 30 min (oder feste Startzeiten der Terminart, z. B. Vor Ort 10:00/14:00).
  - Ein Termin blockiert [start − anfahrt_vor, ende + puffer_nach].
  - Vorlauf: frühester Start = jetzt + vorlauf_stunden; Horizont = heute + max_tage_voraus.
  - Unbestätigte Buchungen (Double-Opt-in) blockieren nur bis reserviert_bis.
Alle Zeiten sind naive datetimes in der Site-Zeitzone (Europe/Vienna); die Umrechnung in ISO 8601
mit Offset macht ph_crm.utils.zeit.
"""

from dataclasses import dataclass, field
from datetime import datetime, time, timedelta

RASTER_MIN = 30


@dataclass
class Terminregel:
    dauer_min: int = 60
    puffer_min: int = 15
    anfahrt_min: int = 0
    vorlauf_stunden: int = 24
    max_tage_voraus: int = 60
    feste_startzeiten: list = field(default_factory=list)  # ["10:00", "14:00"]
    wochentage: list = field(default_factory=list)  # [1..6] zusätzlich zur Verfügbarkeit, 0 = Mo … 6 = So

    @property
    def dauer(self):
        return timedelta(minutes=int(self.dauer_min or 0))

    def block(self, start):
        """Zeitraum, den ein Termin mit diesem Start belegt."""
        return (start - timedelta(minutes=int(self.anfahrt_min or 0)), start + self.dauer + timedelta(minutes=int(self.puffer_min or 0)))


def _minuten(hhmm):
    if isinstance(hhmm, time):
        return hhmm.hour * 60 + hhmm.minute
    if isinstance(hhmm, timedelta):
        return int(hhmm.total_seconds() // 60)
    h, m = str(hhmm).split(":")[:2]
    return int(h) * 60 + int(m)


def ueberlappt(a, b):
    return a[0] < b[1] and b[0] < a[1]


def kandidaten(tag, fenster, regel):
    """Startzeiten (datetime) eines Tages innerhalb der Fenster [(von, bis)], ohne Belegung."""
    if regel.wochentage and tag.weekday() not in [int(w) for w in regel.wochentage]:
        return []
    out = []
    for von, bis in fenster:
        o, s = _minuten(von), _minuten(bis)
        if regel.feste_startzeiten:
            starts = [_minuten(x) for x in regel.feste_startzeiten if o <= _minuten(x) and _minuten(x) + regel.dauer_min <= s]
        else:
            starts = list(range(o, s - regel.dauer_min + 1, RASTER_MIN))
        for m in starts:
            out.append(datetime.combine(tag, time(m // 60, m % 60)))
    return sorted(set(out))


def freie_starts(tag, fenster, regel, belegt, jetzt):
    """Freie Startzeiten eines Tages: Kandidaten minus Vorlauf minus Kollision mit `belegt` [(von, bis)]."""
    fruehestens = jetzt + timedelta(hours=int(regel.vorlauf_stunden or 0))
    out = []
    for start in kandidaten(tag, fenster, regel):
        if start < fruehestens:
            continue
        block = regel.block(start)
        if any(ueberlappt(block, b) for b in belegt):
            continue
        out.append(start)
    return out


def start_erlaubt(start, fenster, regel, jetzt):
    """Liegt `start` im Raster/Fenster und nach dem Vorlauf? (Website: outside_window)"""
    return start in freie_starts(start.date(), fenster, regel, [], jetzt)


def blockiert(status, email_verifiziert, reserviert_bis, jetzt):
    """Blockiert ein PH Termin den Kalender? (Website: isBlocking)"""
    if status in ("Bestaetigt", "Erledigt", "Nicht erschienen"):
        return True
    if status == "Unbestaetigt":
        if email_verifiziert:
            return True  # Vor-Ort-Anfrage, E-Mail bestätigt, Team entscheidet
        return bool(reserviert_bis) and reserviert_bis > jetzt
    return False
