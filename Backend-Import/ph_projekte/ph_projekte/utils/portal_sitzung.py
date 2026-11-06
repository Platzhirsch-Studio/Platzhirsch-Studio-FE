"""Kundenportal-Sitzungen (mehrere gültige Tokens je Kontakt) – reine Logik ohne Frappe.

Quelle: Marktresearch/digital/backoffice/60-website-backend-umstellung.md, Backend-Lücken ph_projekte 1:
„portal_login_token überschreibt den Token-Hash bei jedem Login-Wunsch – ein Dritter, der nur die E-Mail kennt,
meldet offene Sitzungen ab.“ Lösung:
- Jede Login-Anfrage legt eine Sitzung „Angefordert“ an; bestehende aktive Sitzungen bleiben gültig.
- Erst die erste Nutzung des Tokens (Klick auf den Magic Link) aktiviert die Sitzung. Höchstens MAX_AKTIV aktive
  Sitzungen je Kontakt – bei Aktivierung fällt die älteste heraus. Offene Anforderungen höchstens MAX_OFFEN (älteste
  fällt heraus) – Login-Spam verdrängt so nie eine echte Sitzung.
- Logout widerruft nur die eigene Sitzung.
"""

from __future__ import annotations

from datetime import datetime, timedelta

MAX_AKTIV = 5
MAX_OFFEN = 3
ANFORDERUNG_GUELTIG_STUNDEN = 24  # Magic Link muss binnen 24 h eingelöst werden


def ablauf(start: datetime, tage: int) -> datetime:
    return start + timedelta(days=int(tage or 30))


def zustand(sitzung: dict, jetzt: datetime) -> str:
    """→ ok | expired | revoked. sitzung: {status, ablauf_am, angefordert_am, aktiviert_am}."""
    if sitzung.get("status") == "Widerrufen":
        return "revoked"
    if sitzung.get("status") == "Abgelaufen":
        return "expired"
    if not sitzung.get("aktiviert_am") and sitzung.get("angefordert_am") and _dt(sitzung["angefordert_am"]) + timedelta(hours=ANFORDERUNG_GUELTIG_STUNDEN) < jetzt:
        return "expired"
    if sitzung.get("ablauf_am") and _dt(sitzung["ablauf_am"]) < jetzt:
        return "expired"
    return "ok"


def _dt(x):
    return x if isinstance(x, datetime) else datetime.fromisoformat(str(x))


def ueberzaehlig(sitzungen: list[dict], max_aktiv: int = MAX_AKTIV, max_offen: int = MAX_OFFEN) -> list[str]:
    """Namen der Sitzungen, die widerrufen werden (älteste zuerst über dem Limit). sitzungen: [{name, status,
    angefordert_am, aktiviert_am}] – nur nicht widerrufene/abgelaufene zählen."""
    aktiv = sorted((s for s in sitzungen if s.get("status") == "Aktiv"), key=lambda s: _dt(s.get("aktiviert_am") or s.get("angefordert_am")), reverse=True)
    offen = sorted((s for s in sitzungen if s.get("status") == "Angefordert"), key=lambda s: _dt(s.get("angefordert_am")), reverse=True)
    return [s["name"] for s in aktiv[max_aktiv:]] + [s["name"] for s in offen[max_offen:]]


def nachfolger_hash(sitzungen: list[dict], ausser: str | None = None) -> str | None:
    """Token-Hash der jüngsten aktiven Sitzung (für PH Kontakt.portal_token_hash, den ph_core.portal_kontakt_pruefen
    für ph_faktura/ph_service/ph_kundenkarte liest) – nach Logout/Verdrängung der bisher eingetragenen."""
    aktiv = [s for s in sitzungen if s.get("status") == "Aktiv" and s.get("token_hash") and s.get("name") != ausser]
    if not aktiv:
        return None
    return max(aktiv, key=lambda s: _dt(s.get("aktiviert_am") or s.get("angefordert_am")))["token_hash"]


def seite(nummer, groesse, max_groesse: int = 100) -> tuple[int, int]:
    """Paginierung (1-basiert) → (start, limit)."""
    try:
        n = max(1, int(nummer or 1))
    except (TypeError, ValueError):
        n = 1
    try:
        g = min(max(1, int(groesse or 20)), max_groesse)
    except (TypeError, ValueError):
        g = 20
    return (n - 1) * g, g


# ── PH Projekt.planer (Integration Runde 3) ──────────────────────────────────

TEAM_ROLLEN_PLANER = ("PH Projekte Mitarbeiter", "PH Projekte Leitung", "System Manager", "PH Backoffice-Admin", "PH Geschäftsführung")


def planer_standard(user: str | None, rollen) -> str | None:
    """Standard-Planer = Ersteller, aber nur Team-Benutzer (nicht Guest/Website-Integration/Administrator)."""
    if not user or user in ("Guest", "Administrator"):
        return None
    return user if set(rollen or ()) & set(TEAM_ROLLEN_PLANER) else None
