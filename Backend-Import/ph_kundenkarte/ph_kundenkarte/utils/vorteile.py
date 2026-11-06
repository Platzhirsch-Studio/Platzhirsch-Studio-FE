"""Einlösbarkeit von Leistungsvorteilen – ohne Frappe-Import (Tests ohne Site).

Vorteile haben keinen Geldwert (Stufe 1). Geprüft wird nur: Karte aktiv, Vorteil aktiv, Stufe passt,
Limit je Kalenderjahr nicht erreicht. Rückgabe immer (ok: bool, code: str) mit Codes, die die API
1:1 als ApiFehler-Code weitergibt.
"""

CODE_OK = "ok"
CODE_KARTE_INAKTIV = "card_inactive"
CODE_VORTEIL_INAKTIV = "benefit_inactive"
CODE_STUFE = "tier_too_low"
CODE_LIMIT = "limit_reached"
CODE_NICHT_IN_STUFE = "benefit_not_in_tier"


def einloesung_erlaubt(karte_status, vorteil_aktiv, einloesbar_pro_jahr, bereits_im_jahr, stufe_reihenfolge=None, gilt_ab_reihenfolge=None, in_stufe_enthalten=True):
    """Prüft eine Einlösung.

    karte_status          "Aktiv" | "Gesperrt" | "Gekuendigt" | "Beantragt"
    vorteil_aktiv         bool
    einloesbar_pro_jahr   int, 0 = unbegrenzt
    bereits_im_jahr       Anzahl nicht stornierter Einlösungen dieses Vorteils im laufenden Kalenderjahr
    stufe_reihenfolge     Reihenfolge der Kartenstufe (None = unbekannt → keine Stufenprüfung)
    gilt_ab_reihenfolge   Reihenfolge der Mindeststufe des Vorteils (None = keine Mindeststufe)
    in_stufe_enthalten    Vorteil ist der Stufe (oder einer darunter) zugeordnet
    """
    if karte_status != "Aktiv":
        return False, CODE_KARTE_INAKTIV
    if not vorteil_aktiv:
        return False, CODE_VORTEIL_INAKTIV
    if gilt_ab_reihenfolge is not None and stufe_reihenfolge is not None and int(stufe_reihenfolge) < int(gilt_ab_reihenfolge):
        return False, CODE_STUFE
    if not in_stufe_enthalten:
        return False, CODE_NICHT_IN_STUFE
    limit = int(einloesbar_pro_jahr or 0)
    if limit > 0 and int(bereits_im_jahr or 0) >= limit:
        return False, CODE_LIMIT
    return True, CODE_OK


def verbleibend(einloesbar_pro_jahr, bereits_im_jahr):
    """Verbleibende Einlösungen im Jahr; None = unbegrenzt."""
    limit = int(einloesbar_pro_jahr or 0)
    if limit <= 0:
        return None
    return max(0, limit - int(bereits_im_jahr or 0))


def vorteile_fuer_stufe(stufen_vorteile, stufen, aktuelle_stufe):
    """Vorteile, die einer Karte zustehen: alle Zuordnungen der aktuellen Stufe und der Stufen darunter
    (eine höhere Stufe schließt die Leistungen der niedrigeren ein). Reihenfolge stabil, ohne Doppelte.

    stufen_vorteile: Liste von dicts {"stufe", "vorteil", "hinweis"}; stufen: wie in utils.stufen.
    """
    rang = {s["name"]: int(s.get("reihenfolge") or 0) for s in stufen or []}
    r_akt = rang.get(aktuelle_stufe)
    if r_akt is None:
        return []
    gesehen = set()
    ergebnis = []
    for zeile in sorted(stufen_vorteile or [], key=lambda z: rang.get(z.get("stufe"), 0)):
        r = rang.get(zeile.get("stufe"))
        if r is None or r > r_akt:
            continue
        if zeile.get("vorteil") in gesehen:
            continue
        gesehen.add(zeile.get("vorteil"))
        ergebnis.append(dict(zeile))
    return ergebnis
