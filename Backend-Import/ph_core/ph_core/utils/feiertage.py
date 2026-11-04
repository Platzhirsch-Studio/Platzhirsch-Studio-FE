"""Gemeinsamer Feiertagskalender Österreich/Vorarlberg mit Arbeitstagsberechnung – reines Python.

Verwendung (ohne Frappe, testbar per unittest):
    from ph_core.utils.feiertage import feiertage, ist_feiertag, ist_arbeitstag, arbeitstage, arbeitstage_addieren
    feiertage(2026)                      → {date: "Bezeichnung"} inkl. Vorarlberg (Josefstag) und Betriebsruhe 24./31.12.
    ist_arbeitstag(date(2026, 11, 3))    → True (Mo–Fr, kein Feiertag)
    arbeitstage(von, bis)                → Anzahl Arbeitstage (beide Tage inklusive)
    arbeitstage_addieren(datum, 5)       → Datum nach 5 Arbeitstagen (Liefertermine, Fristen)

Mit Frappe (Site): feiertage_site(jahr) ergänzt die Tabelle „Betriebsruhe“ aus PH Einstellungen
(Betriebsurlaub, Inventurtage) und liest das Bundesland dort; ist_geschlossen(datum) ist die
Kurzform für Terminbuchung (ph_crm), Soll-Stunden (ph_personal) und Liefertermine (ph_logistik).

Quellen: Feiertagsruhegesetz (ARG § 7) für die 13 gesetzlichen Feiertage; Josefstag 19.3. ist in
Vorarlberg Landesfeiertag (Ämter/Schulen frei, Handel offen – hier als geschlossen geführt, weil der
Showroom am Landesfeiertag nicht besetzt wird, vgl. Website src/lib/booking/holidays.js); 24./31.12.
sind keine gesetzlichen Feiertage, aber Betriebsruhe (Website: Studio geschlossen).
"""

from datetime import date, timedelta

BUNDESLAENDER = ("Vorarlberg", "Tirol", "Salzburg", "Oberösterreich", "Niederösterreich", "Wien", "Burgenland", "Steiermark", "Kärnten")

# Gesetzliche Feiertage bundesweit (feste Daten).
FESTE_FEIERTAGE = (
    ((1, 1), "Neujahr"),
    ((1, 6), "Heilige Drei Könige"),
    ((5, 1), "Staatsfeiertag"),
    ((8, 15), "Mariä Himmelfahrt"),
    ((10, 26), "Nationalfeiertag"),
    ((11, 1), "Allerheiligen"),
    ((12, 8), "Mariä Empfängnis"),
    ((12, 25), "Christtag"),
    ((12, 26), "Stefanitag"),
)

# Landesfeiertage (kein gesetzlicher Feiertag nach ARG, aber regional arbeitsfrei).
LANDESFEIERTAGE = {
    "Vorarlberg": (((3, 19), "Josefstag"),),
    "Tirol": (((3, 19), "Josefstag"),),
    "Steiermark": (((3, 19), "Josefstag"),),
    "Kärnten": (((3, 19), "Josefstag"), ((10, 10), "Tag der Volksabstimmung")),
    "Salzburg": (((9, 24), "Rupertitag"),),
    "Oberösterreich": (((5, 4), "Florianitag"),),
    "Niederösterreich": (((11, 15), "Leopolditag"),),
    "Wien": (((11, 15), "Leopolditag"),),
    "Burgenland": (((11, 11), "Martinitag"),),
}

# Betriebsruhe ohne Feiertagscharakter (Website: Studio geschlossen).
BETRIEBSRUHE = (
    ((12, 24), "Heiliger Abend"),
    ((12, 31), "Silvester"),
)


def ostersonntag(jahr):
    """Gregorianischer Ostersonntag (Gauß/Anonymus), identisch zu holidays.js easterSunday und ph_crm."""
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


def feiertage(jahr, bundesland="Vorarlberg", mit_betriebsruhe=True, zusaetzlich=None):
    """dict date → Bezeichnung für ein Jahr.

    bundesland: Landesfeiertag dazu (None = nur bundesweit). mit_betriebsruhe: 24./31.12. dazu.
    zusaetzlich: iterable von date oder (date, Bezeichnung) – z. B. Betriebsurlaub aus PH Einstellungen.
    """
    out = {date(jahr, m, t): name for (m, t), name in FESTE_FEIERTAGE}
    o = ostersonntag(jahr)
    out[o + timedelta(days=1)] = "Ostermontag"
    out[o + timedelta(days=39)] = "Christi Himmelfahrt"
    out[o + timedelta(days=50)] = "Pfingstmontag"
    out[o + timedelta(days=60)] = "Fronleichnam"
    for (m, t), name in LANDESFEIERTAGE.get(bundesland or "", ()):
        out.setdefault(date(jahr, m, t), name)
    if mit_betriebsruhe:
        for (m, t), name in BETRIEBSRUHE:
            out.setdefault(date(jahr, m, t), name)
    for eintrag in zusaetzlich or ():
        if isinstance(eintrag, tuple):
            d, name = eintrag
        else:
            d, name = eintrag, "Betriebsruhe"
        d = _datum(d)
        if d and d.year == jahr:
            out.setdefault(d, name or "Betriebsruhe")
    return out


def gesetzliche_feiertage(jahr):
    """Nur die 13 gesetzlichen Feiertage nach ARG (für Zuschläge/Soll-Stunden in ph_personal)."""
    return feiertage(jahr, bundesland=None, mit_betriebsruhe=False)


def ist_feiertag(tag, **kw):
    tag = _datum(tag)
    return tag in feiertage(tag.year, **kw)


def ist_arbeitstag(tag, samstag=False, **kw):
    """Mo–Fr (optional Sa) und kein Feiertag/Betriebsruhe."""
    tag = _datum(tag)
    grenze = 6 if samstag else 5
    return tag.weekday() < grenze and not ist_feiertag(tag, **kw)


def arbeitstage(von, bis, samstag=False, **kw):
    """Anzahl Arbeitstage von..bis (beide inklusive). bis < von → 0."""
    von, bis = _datum(von), _datum(bis)
    if not von or not bis or bis < von:
        return 0
    n = 0
    d = von
    while d <= bis:
        if ist_arbeitstag(d, samstag=samstag, **kw):
            n += 1
        d += timedelta(days=1)
    return n


def arbeitstage_addieren(tag, anzahl, samstag=False, **kw):
    """Datum, das `anzahl` Arbeitstage nach `tag` liegt (anzahl 0 → nächster Arbeitstag ab tag inkl.)."""
    d = _datum(tag)
    if anzahl <= 0:
        return naechster_arbeitstag(d, samstag=samstag, **kw)
    rest = anzahl
    while rest > 0:
        d += timedelta(days=1)
        if ist_arbeitstag(d, samstag=samstag, **kw):
            rest -= 1
    return d


def naechster_arbeitstag(tag, samstag=False, **kw):
    """Erster Arbeitstag ab `tag` (inklusive)."""
    d = _datum(tag)
    while not ist_arbeitstag(d, samstag=samstag, **kw):
        d += timedelta(days=1)
    return d


def feiertage_liste(jahr, **kw):
    """Sortierte Liste [(date, Bezeichnung)] – für Tabellen und API-Antworten."""
    return sorted(feiertage(jahr, **kw).items())


def _datum(wert):
    if wert is None or isinstance(wert, date):
        return wert
    if hasattr(wert, "date"):  # datetime
        return wert.date()
    s = str(wert)[:10]
    y, m, d = s.split("-")
    return date(int(y), int(m), int(d))


# ── Mit Frappe-Site: Bundesland und Betriebsruhe aus PH Einstellungen ───────────────────────────────

def _site_konfiguration():
    """(bundesland, [(date, bezeichnung)]) aus PH Einstellungen; ohne Frappe/Site → ("Vorarlberg", [])."""
    try:
        import frappe

        if not getattr(frappe.local, "site", None):
            return "Vorarlberg", []
        doc = frappe.get_cached_doc("PH Einstellungen")
        extra = [(_datum(z.datum), z.bezeichnung) for z in (doc.get("betriebsruhe") or []) if z.datum]
        return doc.get("feiertage_bundesland") or "Vorarlberg", extra
    except Exception:  # noqa: BLE001 – ohne Site oder vor Migration
        return "Vorarlberg", []


def feiertage_site(jahr):
    """Feiertage + Betriebsruhe der Site (PH Einstellungen) für ein Jahr."""
    bundesland, extra = _site_konfiguration()
    return feiertage(jahr, bundesland=bundesland, zusaetzlich=extra)


def ist_geschlossen(tag):
    """True, wenn der Showroom an diesem Tag geschlossen ist (Sonntag, Feiertag, Betriebsruhe)."""
    tag = _datum(tag)
    return tag.weekday() == 6 or tag in feiertage_site(tag.year)


def arbeitstage_site(von, bis, samstag=False):
    bundesland, extra = _site_konfiguration()
    return arbeitstage(von, bis, samstag=samstag, bundesland=bundesland, zusaetzlich=extra)


def arbeitstage_addieren_site(tag, anzahl, samstag=False):
    bundesland, extra = _site_konfiguration()
    return arbeitstage_addieren(tag, anzahl, samstag=samstag, bundesland=bundesland, zusaetzlich=extra)
