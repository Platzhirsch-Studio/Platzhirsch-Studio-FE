"""Techniker-Einsatz: Zeiten (Anfahrt/Arbeit/Pause, Abrechnungstakt) und freie Zeitfenster – reine Logik ohne Frappe."""

from datetime import datetime


def _min(wert):
    """'08:30' | '08:30:00' | datetime.time | timedelta → Minuten seit Mitternacht."""
    if wert is None or wert == "":
        return None
    if hasattr(wert, "total_seconds"):
        return int(wert.total_seconds() // 60)
    if hasattr(wert, "hour"):
        return wert.hour * 60 + wert.minute
    teile = str(wert).split(":")
    return int(teile[0]) * 60 + int(teile[1] if len(teile) > 1 else 0)


def zeiten(ankunft=None, abfahrt=None, pause_min=0, anfahrt_einfach_min=0, takt_min=15, arbeit_min=None):
    """→ dict(arbeit_min, anfahrt_min, pause_min, abrechenbar_min).

    arbeit = Abfahrt − Ankunft − Pause (oder vorgegeben); Anfahrt = Hin + Rück (2 × einfach);
    abrechenbar = Arbeit + Anfahrt, aufgerundet auf den Takt (15 min üblich im Handwerk)."""
    pause = max(0, int(pause_min or 0))
    if arbeit_min in (None, "", 0) and ankunft and abfahrt:
        a = ankunft if isinstance(ankunft, datetime) else datetime.fromisoformat(str(ankunft))
        b = abfahrt if isinstance(abfahrt, datetime) else datetime.fromisoformat(str(abfahrt))
        if b < a:
            raise ValueError("Abfahrt liegt vor Ankunft.")
        brutto = int((b - a).total_seconds() // 60)
        if pause > brutto:
            raise ValueError("Pause ist länger als die Zeit vor Ort.")
        arbeit = brutto - pause
    else:
        arbeit = max(0, int(arbeit_min or 0))
    anfahrt = max(0, int(anfahrt_einfach_min or 0)) * 2
    summe = arbeit + anfahrt
    takt = max(1, int(takt_min or 1))
    abrechenbar = -(-summe // takt) * takt if summe else 0
    return {"arbeit_min": arbeit, "anfahrt_min": anfahrt, "pause_min": pause, "abrechenbar_min": abrechenbar}


def kosten_cent(abrechenbar_min, stundensatz_cent, pauschale_cent=0):
    return int(round(int(abrechenbar_min or 0) / 60 * int(stundensatz_cent or 0))) + int(pauschale_cent or 0)


def freie_fenster(belegt, tag_von="08:00", tag_bis="17:00", dauer_min=60, raster_min=30, puffer_min=0):
    """Freie Startzeiten eines Technikers an einem Tag.

    belegt = [(von, bis), …] (Zeiten als 'HH:MM' oder time); Puffer wird um jede Belegung gelegt.
    → [('08:00', '09:00'), …] Startzeit/Ende je möglichem Fenster im Raster."""
    start, ende = _min(tag_von), _min(tag_bis)
    dauer, raster, puffer = int(dauer_min), max(5, int(raster_min)), max(0, int(puffer_min or 0))
    blockiert = []
    for von, bis in belegt or []:
        v, b = _min(von), _min(bis)
        if v is None:
            continue
        b = b if b is not None else v + 60
        blockiert.append((v - puffer, b + puffer))
    out = []
    t = start
    while t + dauer <= ende:
        if all(t + dauer <= v or t >= b for v, b in blockiert):
            out.append((f"{t // 60:02d}:{t % 60:02d}", f"{(t + dauer) // 60:02d}:{(t + dauer) % 60:02d}"))
        t += raster
    return out
