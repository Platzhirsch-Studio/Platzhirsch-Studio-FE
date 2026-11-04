"""Zeit-Hilfen: ISO 8601 (Website) ↔ naive Site-Zeit (Europe/Vienna). Reines Python."""

from datetime import datetime, timedelta, timezone

SITE_ZEITZONE = "Europe/Vienna"


def zone(name=SITE_ZEITZONE):
    try:
        from zoneinfo import ZoneInfo

        return ZoneInfo(name)
    except Exception:  # noqa: BLE001 – ohne tzdata (Windows-Entwicklung): feste MEZ
        return timezone(timedelta(hours=1), "MEZ")


def parse_iso(wert):
    """ISO-String der Website ('2026-11-10T09:00:00.000Z' oder mit Offset) → aware datetime; None bei Fehler."""
    if isinstance(wert, datetime):
        return wert if wert.tzinfo else wert.replace(tzinfo=zone())
    s = str(wert or "").strip()
    if not s:
        return None
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    if "." in s and "+" in s:  # Millisekunden abschneiden, damit 3.10 fromisoformat sie versteht
        kopf, rest = s.split(".", 1)
        s = kopf + "+" + rest.split("+", 1)[1]
    try:
        dt = datetime.fromisoformat(s.replace(" ", "T"))
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=zone())


def nach_site(dt):
    """aware datetime → naive Site-Zeit (so speichert Frappe Datetime-Felder)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt
    return dt.astimezone(zone()).replace(tzinfo=None, microsecond=0)


def iso(dt_naiv):
    """naive Site-Zeit → ISO 8601 mit Offset (Antwortformat der API)."""
    if not dt_naiv:
        return None
    if isinstance(dt_naiv, str):
        dt_naiv = datetime.fromisoformat(dt_naiv)
    return dt_naiv.replace(tzinfo=zone()).isoformat()
