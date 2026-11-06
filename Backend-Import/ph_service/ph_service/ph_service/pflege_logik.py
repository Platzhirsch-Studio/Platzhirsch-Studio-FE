"""Reine Logik Pflege-/Wartungsvertrag (ohne Frappe), übernommen aus ../platzhirsch-frappe-service/pflege/logik.py
und um Wartungsintervalle (Whirlpool/Sauna) ergänzt."""

from datetime import date, timedelta

from ph_service.ph_service.fristen import monate_dazu


def naechster_termin_nach(letzter, intervall_monate=12):
    return monate_dazu(letzter, max(1, int(intervall_monate or 12)))


def erinnerung_faellig(heute, naechster, tage_vorher, letzte_erinnerung):
    """Erinnerung vormerken, wenn das Fenster offen ist und für diesen Termin noch keine vorgemerkt wurde."""
    if not naechster:
        return False
    fenster = naechster - timedelta(days=max(0, int(tage_vorher or 0)))
    if heute < fenster or heute > naechster:
        return False
    return not (letzte_erinnerung and letzte_erinnerung >= fenster)


def ueberfaellig(heute, naechster, karenz_tage=14):
    """Wartung überfällig: Termin + Karenz überschritten, kein Protokoll danach."""
    return bool(naechster) and heute > naechster + timedelta(days=int(karenz_tage))


def nachkauf_faellig(heute, letztes_protokoll, empfohlen, einwilligung, widerrufen, letzter_hinweis, tage_nach=14):
    """Nachkauf-Hinweis: nur mit Einwilligung, ohne Widerruf, mit Empfehlung, einmal je Protokoll."""
    if not einwilligung or widerrufen or not letztes_protokoll or not (empfohlen or "").strip():
        return False
    if heute < letztes_protokoll + timedelta(days=tage_nach):
        return False
    return not (letzter_hinweis and letzter_hinweis >= letztes_protokoll)


def schluessel(abo, art, datum):
    """Eindeutiger Schlüssel je Vertrag, Art und Termin (doppelte Vormerkung ausgeschlossen)."""
    return f"pflege_abo:{abo}:{art}:{datum.isoformat()}"


def wartungen_im_zeitraum(start, ende, intervall_monate):
    """Geplante Wartungstermine zwischen start und ende (für Vorschau und Kalender)."""
    if not start or int(intervall_monate or 0) <= 0:
        return []
    out, d = [], start
    while ende is None or d <= ende:
        out.append(d)
        d = monate_dazu(d, int(intervall_monate))
        if len(out) > 120:
            break
    return out


def standard_intervall(bereich):
    """Vorschlag je Bereich (Monate): Whirlpool/Sauna technisch jährlich, Polster/Holz jährlich, Pool halbjährlich."""
    return {"Whirlpool": 12, "Sauna": 12, "Pool-Technik": 6, "Leder": 12, "Stoff": 12, "Holz": 12, "Stein": 12}.get(bereich, 12)


def einsatz_faellig(heute, naechster, vorlauf_tage=28, schon_geplant=False, automatisch=True):
    """Automatische Terminerzeugung (Wartungsvertrag): Einsatz anlegen, sobald der nächste Termin im Vorlauf liegt
    (auch überfällige), noch keiner für diesen Termin existiert und der Vertrag es erlaubt."""
    if not automatisch or schon_geplant or not naechster:
        return False
    return heute >= naechster - timedelta(days=max(0, int(vorlauf_tage or 0)))


def plantag(naechster, feiertage=()):
    """Geplanter Einsatztag = nächster Werktag ab Fälligkeit (Wochenende/Feiertag → verschoben)."""
    from ph_service.utils.sla import naechster_werktag

    return naechster_werktag(naechster, feiertage)


def planschluessel(abo, termin):
    """Idempotenz-Schlüssel des automatisch erzeugten Einsatzes (je Vertrag und Fälligkeit genau einer)."""
    return f"wartung:{abo}:{termin.isoformat()}"
