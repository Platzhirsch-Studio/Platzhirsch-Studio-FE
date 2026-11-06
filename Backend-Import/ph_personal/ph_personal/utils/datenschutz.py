"""Fristen für Löschung und Aufbewahrung von Bewerber- und Beschäftigtendaten – reine Logik.

Bewerbungen (GlBG § 15 Abs 1 iVm § 29 Abs 1: Geltendmachung binnen 6 Monaten ab Ablehnung): Frist läuft ab
dem **Zugang** der Ablehnung – belegt durch absage_versand_am (E-Mail/Post/Telefon/persönlich), sonst ab der
Entscheidung. Mindestens 6 Monate; Standard 7 Monate (Puffer für Zustellung/Postlauf). Längere Evidenz nur
mit Einwilligung (Art. 6 Abs 1 lit a DSGVO) bis zum eingewilligten Datum.
Beschäftigte: Lohn-/Zeitunterlagen 7 Jahre ab Ende des Kalenderjahres (BAO § 132, StB bestätigen);
Notfallkontakt (Daten Dritter) und vertrauliche Hinweise 30 Tage nach Austritt löschen.
"""

import calendar
import re
from datetime import date, timedelta

MIN_MONATE_BEWERBUNG = 6


def _monate_addieren(d, monate):
    m0 = d.month - 1 + monate
    j = d.year + m0 // 12
    m = m0 % 12 + 1
    return date(j, m, min(d.day, calendar.monthrange(j, m)[1]))


def loeschfrist_bewerbung(entschieden_am=None, absage_versand_am=None, monate=7, evidenz_bis=None):
    """Löschdatum: max(Entscheidung, Absage-Zugang) + Monate (mind. 6); Evidenz-Einwilligung verlängert."""
    basis = [d for d in (entschieden_am, absage_versand_am) if d]
    if not basis:
        return evidenz_bis
    frist = _monate_addieren(max(basis), max(int(monate or 0), MIN_MONATE_BEWERBUNG))
    if evidenz_bis and evidenz_bis > frist:
        return evidenz_bis
    return frist


def offene_bewerbung_zu_alt(eingang, heute, tage=90):
    """Bewerbung ohne Entscheidung länger als n Tage (Datenminimierung, Fachkritik B16)."""
    return bool(eingang) and (heute - eingang).days > int(tage or 0)


def aufbewahrung_bis(datum, jahre=7):
    """Ende der Aufbewahrung: 31.12. des Jahres (Belegjahr + n) – BAO § 132 Abs 1."""
    if not datum:
        return None
    return date(datum.year + int(jahre), 12, 31)


def notfallkontakt_loeschen_ab(austritt, tage=30):
    if not austritt:
        return None
    return austritt + timedelta(days=int(tage))


NEUTRAL_MUSTER = re.compile(r"(\(\s*[mwdx]\s*/\s*[mwdx](\s*/\s*[mwdx])?\s*\)|:in\b|\*in\b|/-?in\b|_in\b|Innen\b|\(in\))", re.IGNORECASE)
NEUTRALE_BEGRIFFE = ("lehrling", "lehre", "praktikum", "kraft", "aushilfe", "leitung", "assistenz")


def titel_geschlechtsneutral(titel):
    """GlBG § 9 Abs 1: Stellentitel erkennbar geschlechtsneutral (Muster (m/w/d), :in, *in, /in, Binnen-I
    oder neutrale Bezeichnung). Nur Warnung, keine Sperre (Fachkritik P13)."""
    t = str(titel or "")
    if not t.strip():
        return False
    if NEUTRAL_MUSTER.search(t) or re.search(r"[a-zäöü]In(nen)?\b", t):
        return True
    return any(b in t.lower() for b in NEUTRALE_BEGRIFFE)
