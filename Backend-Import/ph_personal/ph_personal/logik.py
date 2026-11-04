"""Reine Fachlogik von ph_personal – ohne Frappe-Import, testbar per `python -m unittest`.

Quellen der Regeln:
  - src/lib/karriere/stellen.js (entgeltVollstaendig, Slug, Feldnamen der Website)
  - src/lib/karriere/texte.js (Entgelt-Satz je Sprache, § 9 Abs 2 GlBG)
  - src/lib/karriere/stellen.<sprache>.js (AUSMASS/START-Übersetzungen)
  - src/lib/slugify.js generateSlug (Slug muss identisch sein, sonst mergeStellen der Website
    zeigt eine Stelle doppelt)
  - PLAN.md WP8: Löschfrist 7 Monate nach Absage (DSGVO/GlBG § 15 Fristenlauf 6 Monate + Puffer)
"""

import calendar
import re
import unicodedata
from datetime import date, timedelta

SPRACHEN = ("de", "en", "fr", "it")

# Beschreibungsfeld je Sprache – Feldnamen der heutigen Doctype „Karriere“ (Website liest sie so).
BESCHREIBUNG_FELD = {"de": "stellenbeschreibung", "en": "job_description_en", "fr": "description_de_lemploi", "it": "jobs_description_it"}

STATUS_STELLE = ("Entwurf", "Aktiv", "Pausiert", "Besetzt", "Archiviert")
STATUS_BEWERBUNG = ("Eingegangen", "Gesichtet", "Gespraech", "Angebot", "Eingestellt", "Abgesagt", "Zurueckgezogen")
BEWERBUNG_ENDE = ("Eingestellt", "Abgesagt", "Zurueckgezogen")
STATUS_ABWESENHEIT = ("Beantragt", "Genehmigt", "Abgelehnt", "Storniert")

LOESCHFRIST_MONATE = 7

# Übersetzungen für Ausmaß, Beginn und Bereich (Website: stellen.<l>.js AUSMASS/START, bereich).
AUSMASS = {
    "Vollzeit": {"de": "Vollzeit", "en": "Full-time", "fr": "Temps plein", "it": "Tempo pieno"},
    "Teilzeit": {"de": "Teilzeit", "en": "Part-time", "fr": "Temps partiel", "it": "Part-time"},
    "Vollzeit oder Teilzeit": {"de": "Vollzeit oder Teilzeit", "en": "Full-time or part-time", "fr": "Temps plein ou partiel", "it": "Tempo pieno o part-time"},
    "Lehre": {"de": "Lehre", "en": "Apprenticeship", "fr": "Apprentissage", "it": "Apprendistato"},
    "Praktikum": {"de": "Praktikum", "en": "Internship", "fr": "Stage", "it": "Tirocinio"},
    "Geringfuegig": {"de": "Geringfügig", "en": "Marginal employment", "fr": "Emploi marginal", "it": "Impiego marginale"},
}
START = {"ab sofort": {"de": "ab sofort", "en": "immediately", "fr": "dès que possible", "it": "da subito"}}
KATEGORIE = {
    "Planung": {"de": "Planung", "en": "Planning", "fr": "Conception", "it": "Progettazione"},
    "Verkauf": {"de": "Verkauf", "en": "Sales", "fr": "Vente", "it": "Vendita"},
    "Montage": {"de": "Montage", "en": "Installation", "fr": "Montage", "it": "Montaggio"},
    "Verwaltung": {"de": "Verwaltung", "en": "Administration", "fr": "Administration", "it": "Amministrazione"},
    "Lehre": {"de": "Lehre", "en": "Apprenticeship", "fr": "Apprentissage", "it": "Apprendistato"},
}
ZEITRAUM = {
    "Monat": {"de": "Monat", "en": "month", "fr": "mois", "it": "mese"},
    "Jahr": {"de": "Jahr", "en": "year", "fr": "an", "it": "anno"},
}
UEBERZAHLUNG_TEXT = {
    "de": "Bereitschaft zur Überzahlung je nach Qualifikation und Erfahrung.",
    "en": "We are willing to pay above this, depending on qualifications and experience.",
    "fr": "Rémunération supérieure possible selon qualification et expérience.",
    "it": "Disponibilità a una retribuzione superiore in base a qualifica ed esperienza.",
}
ENTGELT_SATZ = {
    "de": "Das kollektivvertragliche Mindestentgelt beträgt {betrag} brutto pro {zeitraum} ({kv}).",
    "en": "The minimum salary under the collective agreement is {betrag} gross per {zeitraum} ({kv}).",
    "fr": "Le salaire minimum conventionnel s'élève à {betrag} brut par {zeitraum} ({kv}).",
    "it": "La retribuzione minima prevista dal contratto collettivo è di {betrag} lordi al {zeitraum} ({kv}).",
}


def uebersetze(tabelle, schluessel, sprache):
    """Wert aus einer Übersetzungstabelle; unbekannter Schlüssel → unverändert."""
    eintrag = tabelle.get(schluessel or "")
    if not eintrag:
        return schluessel or ""
    return eintrag.get(sprache) or eintrag["de"]


def slug(titel):
    """Entspricht src/lib/slugify.js generateSlug (die Website verschmilzt Stellen über den Slug)."""
    if not titel:
        return ""
    s = str(titel).lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r"[\s–—]+", "-", s)
    s = s.replace("/", "-")
    s = re.sub(r"[^a-z0-9-]", "", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def entgelt_vollstaendig(kv_mindest_brutto_cent, zeitraum, kollektivvertrag, ueberzahlung, ueberzahlung_text=""):
    """§ 9 Abs 2 GlBG (Website: stellen.js entgeltVollstaendig): Betrag > 0, Zeitraum Monat/Jahr,
    Kollektivvertrag benannt, Überzahlungsbereitschaft entschieden (ja/nein oder eigener Wortlaut)."""
    try:
        betrag = int(kv_mindest_brutto_cent or 0)
    except (TypeError, ValueError):
        return False
    if betrag <= 0:
        return False
    if zeitraum not in ("Monat", "Jahr"):
        return False
    if not str(kollektivvertrag or "").strip():
        return False
    if ueberzahlung in ("ja", "nein"):
        return True
    return bool(str(ueberzahlung_text or "").strip())


def euro(cent, sprache="de"):
    """Cent → Währungstext wie Intl.NumberFormat: de-AT „€ 2.535,00“, en „€2,535.00“, fr „2 535,00 €“, it „2.535,00 €“."""
    wert = int(cent or 0) / 100
    ganz, bruch = f"{wert:,.2f}".split(".")
    punkt = ganz.replace(",", ".")
    schmal = ganz.replace(",", " ")  # geschütztes schmales Leerzeichen (fr-FR)
    if sprache == "de":
        return f"€ {punkt},{bruch}"
    if sprache == "fr":
        return f"{schmal},{bruch} €"
    if sprache == "it":
        return f"{punkt},{bruch} €"
    return f"€{ganz}.{bruch}"


def entgelt_text(kv_mindest_brutto_cent, zeitraum, kollektivvertrag, ueberzahlung, ueberzahlung_text="", sprache="de"):
    """Entgelt-Satz für Anzeige/Druck (Website: texte.js entgeltText). Leer, wenn unvollständig."""
    if not entgelt_vollstaendig(kv_mindest_brutto_cent, zeitraum, kollektivvertrag, ueberzahlung, ueberzahlung_text):
        return ""
    satz = ENTGELT_SATZ.get(sprache, ENTGELT_SATZ["de"]).format(
        betrag=euro(kv_mindest_brutto_cent, sprache), zeitraum=uebersetze(ZEITRAUM, zeitraum, sprache), kv=str(kollektivvertrag).strip()
    )
    zusatz = str(ueberzahlung_text or "").strip()
    if not zusatz and ueberzahlung == "ja":
        zusatz = UEBERZAHLUNG_TEXT.get(sprache, UEBERZAHLUNG_TEXT["de"])
    return f"{satz} {zusatz}".strip()


def ueberzahlung_fuer_website(ueberzahlung, ueberzahlung_text=""):
    """Wert von `entgelt.ueberzahlung` im Website-Format: true/false oder eigener Wortlaut."""
    text = str(ueberzahlung_text or "").strip()
    if text:
        return text
    return ueberzahlung == "ja"


def veroeffentlichbar(status, entgelt_ok, veroeffentlicht=None, gueltig_bis=None, heute=None):
    """Erscheint die Stelle in der Website-API? Aktiv, Entgelt vollständig, im Zeitfenster."""
    heute = heute or date.today()
    if status != "Aktiv" or not entgelt_ok:
        return False
    if veroeffentlicht and veroeffentlicht > heute:
        return False
    if gueltig_bis and gueltig_bis < heute:
        return False
    return True


def monate_addieren(d, monate):
    """Datum + n Monate (Monatsende wird gekappt, z. B. 31.08. + 7 → 31.03.; 30.11. + 3 → 28./29.02.)."""
    monat0 = d.month - 1 + monate
    jahr = d.year + monat0 // 12
    monat = monat0 % 12 + 1
    tag = min(d.day, calendar.monthrange(jahr, monat)[1])
    return date(jahr, monat, tag)


def loeschfrist(absage_datum, monate=LOESCHFRIST_MONATE):
    """Löschfrist der Bewerbungsunterlagen: Absage + 7 Monate (GlBG § 15: 6 Monate Klagefrist + Puffer)."""
    if not absage_datum:
        return None
    return monate_addieren(absage_datum, monate)


def arbeitstage(von, bis, halbtags=False, feiertage=()):
    """Werktage Mo–Fr zwischen zwei Daten (inklusive), optional Feiertage abgezogen; halbtags → 0,5."""
    if not von or not bis or bis < von:
        return 0.0
    if halbtags:
        return 0.5 if von.weekday() < 5 and von not in feiertage else 0.0
    tage = 0
    d = von
    while d <= bis:
        if d.weekday() < 5 and d not in feiertage:
            tage += 1
        d += timedelta(days=1)
    return float(tage)


def dauer_minuten(kommen, gehen, pause_min=0):
    """Nettoarbeitszeit in Minuten aus zwei Uhrzeiten (als timedelta oder time) und Pause."""
    if kommen is None or gehen is None:
        return 0

    def _min(t):
        if hasattr(t, "total_seconds"):
            return int(t.total_seconds() // 60)
        return t.hour * 60 + t.minute

    brutto = _min(gehen) - _min(kommen)
    if brutto <= 0:
        return 0
    return max(0, brutto - int(pause_min or 0))


def soll_minuten_monat(wochenstunden, jahr, monat, feiertage=()):
    """Sollzeit eines Monats: Werktage × (Wochenstunden / 5) in Minuten (ohne Arbeitszeitgesetz-Prüfung)."""
    tage = arbeitstage(date(jahr, monat, 1), date(jahr, monat, calendar.monthrange(jahr, monat)[1]), feiertage=feiertage)
    return int(round(tage * float(wochenstunden or 0) / 5 * 60))


def minuten_text(minuten):
    """Minuten → „38:30“."""
    m = int(minuten or 0)
    vorzeichen = "-" if m < 0 else ""
    m = abs(m)
    return f"{vorzeichen}{m // 60}:{m % 60:02d}"


def ueberschneidung(a_von, a_bis, b_von, b_bis):
    """Überschneiden sich zwei Zeiträume (inklusive Grenzen)?"""
    return a_von <= b_bis and b_von <= a_bis
