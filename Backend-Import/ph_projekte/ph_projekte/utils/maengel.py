"""Mängel mit Fristen – Überfälligkeit, Verantwortliche. Reine Logik (tests/test_maengel.py)."""

from datetime import date, datetime

VERANTWORTLICH = ("Studio", "Lieferant", "Fremdgewerk")
ERLEDIGT = ("behoben", "erledigt")


def _datum(v):
    if not v:
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    try:
        return date.fromisoformat(str(v)[:10])
    except ValueError:
        return None


def ist_erledigt(status=None, behoben_am=None, erledigt=0):
    """Montage-Mangel: status 'behoben' (klein, Optionen der Kindtabelle) oder behoben_am; Abnahme-Position: erledigt=1.
    Groß-/Kleinschreibung egal (Bugfix: früher Vergleich auf 'Behoben'/'Erledigt')."""
    if erledigt and int(erledigt):
        return True
    if behoben_am:
        return True
    return (status or "").strip().lower() in ERLEDIGT


def ueberfaellig(frist, heute=None, status=None, behoben_am=None, erledigt=0):
    f = _datum(frist)
    if not f or ist_erledigt(status, behoben_am, erledigt):
        return False
    return f < (_datum(heute) or date.today())


def tage_ueberfaellig(frist, heute=None):
    f = _datum(frist)
    if not f:
        return 0
    return max(((_datum(heute) or date.today()) - f).days, 0)


def erinnerung_faellig(frist, erinnert_am, heute=None, intervall_tage=3):
    """Überfällig und seit `intervall_tage` nicht erinnert."""
    h = _datum(heute) or date.today()
    if not _datum(frist) or _datum(frist) >= h:
        return False
    e = _datum(erinnert_am)
    return not e or (h - e).days >= int(intervall_tage or 3)
