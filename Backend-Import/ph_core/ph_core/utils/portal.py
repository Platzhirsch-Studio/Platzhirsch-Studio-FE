"""Zustand einer Kunden-Portal-Sitzung – reine Logik ohne Frappe (Tests: ph_core/tests/test_portal.py).

ph_projekte führt mehrere gültige Kunden-Tokens je Kontakt (DocType `PH Portal Sitzung`, max. 5, Logout
widerruft nur die eigene; ph_projekte/api/basis.py). ph_core.api.portal_kontakt_pruefen prüft deshalb zuerst
die Sitzung und fällt nur ohne Sitzung auf das Altfeld `PH Kontakt.portal_token_hash` zurück.
"""

GUELTIG = ("Angefordert", "Aktiv")


def sitzung_zustand(sitzung, kontakt, jetzt):
    """sitzung: dict mit kontakt, status, ablauf_am (datetime oder None).
    → "ok" | "fremd" (anderer Kontakt) | "widerrufen" (Status nicht gültig) | "abgelaufen"."""
    if (sitzung.get("kontakt") or "") != (kontakt or ""):
        return "fremd"
    if sitzung.get("status") not in GUELTIG:
        return "abgelaufen" if sitzung.get("status") == "Abgelaufen" else "widerrufen"
    ablauf = sitzung.get("ablauf_am")
    if ablauf and ablauf < jetzt:
        return "abgelaufen"
    return "ok"
