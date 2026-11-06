"""Kulanzfreigabe: Schwelle aus PH Service Einstellungen; eine Freigabe deckt nur den freigegebenen Betrag
(Erhöhung → neue Freigabe nötig) – reine Logik ohne Frappe."""

NICHT_NOETIG = "Nicht noetig"
ANGEFORDERT = "Angefordert"
FREIGEGEBEN = "Freigegeben"
ABGELEHNT = "Abgelehnt"


def freigabe_status(kulanz_cent, schwelle_cent, freigegeben_cent=None, abgelehnt_cent=None):
    """→ Status. Kulanz ≤ Schwelle braucht keine Freigabe; Freigabe deckt Beträge ≤ freigegebener Betrag;
    eine Ablehnung gilt für den abgelehnten Betrag (geänderter Betrag → erneut angefordert)."""
    betrag = int(kulanz_cent or 0)
    if betrag <= int(schwelle_cent or 0):
        return NICHT_NOETIG
    if freigegeben_cent and int(freigegeben_cent) >= betrag:
        return FREIGEGEBEN
    if abgelehnt_cent and int(abgelehnt_cent) == betrag:
        return ABGELEHNT
    return ANGEFORDERT
