"""Gesetzliche Feiertage Österreich (bundesweit) plus 24./31. Dezember – reines Python ohne Frappe.

Quelle der Regel: Website src/lib/booking/holidays.js (Studio geschlossen; Mariä Empfängnis zählt als
geschlossen, auch wenn der Handel öffnen dürfte). Wird von install.py in PH Termin Einstellungen
(Tabelle Feiertage) eingetragen und von der Slot-Berechnung als Rückfall genutzt.
"""

from datetime import date, timedelta

FESTE_FEIERTAGE = (
    ((1, 1), "Neujahr"),
    ((1, 6), "Heilige Drei Könige"),
    ((5, 1), "Staatsfeiertag"),
    ((8, 15), "Mariä Himmelfahrt"),
    ((10, 26), "Nationalfeiertag"),
    ((11, 1), "Allerheiligen"),
    ((12, 8), "Mariä Empfängnis"),
    ((12, 24), "Heiliger Abend"),
    ((12, 25), "Christtag"),
    ((12, 26), "Stefanitag"),
    ((12, 31), "Silvester"),
)


def ostersonntag(jahr):
    """Gregorianischer Ostersonntag (Gauß/Anonymus), identisch zu holidays.js easterSunday."""
    a = jahr % 19
    b = jahr // 100
    c = jahr % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7  # noqa: E741 – Formelbuchstabe
    m = (a + 11 * h + 22 * l) // 451
    monat = (h + l - 7 * m + 114) // 31
    tag = ((h + l - 7 * m + 114) % 31) + 1
    return date(jahr, monat, tag)


def feiertage_at(jahr):
    """dict date → Bezeichnung für ein Jahr."""
    out = {date(jahr, m, t): name for (m, t), name in FESTE_FEIERTAGE}
    o = ostersonntag(jahr)
    out[o + timedelta(days=1)] = "Ostermontag"
    out[o + timedelta(days=39)] = "Christi Himmelfahrt"
    out[o + timedelta(days=50)] = "Pfingstmontag"
    out[o + timedelta(days=60)] = "Fronleichnam"
    return out


def ist_feiertag(tag):
    return tag in feiertage_at(tag.year)
