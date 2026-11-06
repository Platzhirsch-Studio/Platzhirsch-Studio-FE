"""Event-Logik ohne Frappe: Plätze mit Kontingent, Warteliste/Nachrücken, Check-in-Code.

Kontingent: `kontingent_einladung` Plätze bleiben bis `kontingent_bis` für Eingeladene (PH Event Einladung) reserviert;
danach gilt die volle Kapazität für alle. Begleitpersonen zählen über `personen` (Anmeldende + Begleitung).
Nachrücken: Warteliste in Anmeldereihenfolge; wer nicht in die freien Plätze passt (zu große Gruppe), blockiert
die Nachfolgenden nicht – er bleibt auf der Warteliste und wird beim nächsten freien Platz wieder zuerst geprüft.
"""

from __future__ import annotations

from datetime import date, datetime

from ph_marketing.utils.token import signatur_gueltig, signieren

BELEGT = ("angemeldet", "bestaetigt", "erschienen")
CODE_PRAEFIX = "PHE1"


def _d(x):
    if isinstance(x, datetime):
        return x.date()
    if isinstance(x, date):
        return x
    return date.fromisoformat(str(x)[:10]) if x else None


def personen(zeile):
    try:
        return max(int(zeile.get("personen") or 1), 1)
    except (TypeError, ValueError):
        return 1


def belegt(anmeldungen, nur_eingeladene=None):
    s = 0
    for a in anmeldungen:
        if a.get("status") not in BELEGT:
            continue
        if nur_eingeladene is True and not a.get("eingeladen"):
            continue
        if nur_eingeladene is False and a.get("eingeladen"):
            continue
        s += personen(a)
    return s


def kontingent_aktiv(kontingent, kontingent_bis, heute=None):
    heute = _d(heute) or date.today()
    return bool(int(kontingent or 0)) and (not kontingent_bis or heute <= _d(kontingent_bis))


def frei(kapazitaet, anmeldungen, eingeladen=False, kontingent=0, kontingent_bis=None, heute=None):
    """Freie Plätze für eine neue Anmeldung. kapazitaet 0/None = unbegrenzt (→ None)."""
    kap = int(kapazitaet or 0)
    if not kap:
        return None
    gesamt_frei = max(kap - belegt(anmeldungen), 0)
    if eingeladen or not kontingent_aktiv(kontingent, kontingent_bis, heute):
        return gesamt_frei
    # Nicht Eingeladene: Kapazität minus noch nicht ausgeschöpftes Kontingent
    reserviert_rest = max(int(kontingent) - belegt(anmeldungen, nur_eingeladene=True), 0)
    return max(gesamt_frei - reserviert_rest, 0)


def nachruecker(anmeldungen, kapazitaet, kontingent=0, kontingent_bis=None, heute=None):
    """→ Liste der Wartelisten-Zeilen (Kopien als dict), die jetzt nachrücken dürfen, in Reihenfolge."""
    zeilen = [dict(a) for a in anmeldungen]
    warte = sorted([z for z in zeilen if z.get("status") == "warteliste"], key=lambda z: str(z.get("angemeldet_am") or ""))
    if not int(kapazitaet or 0):
        return warte
    raus = []
    for a in warte:
        f = frei(kapazitaet, zeilen, eingeladen=bool(a.get("eingeladen")), kontingent=kontingent, kontingent_bis=kontingent_bis, heute=heute)
        if f is not None and personen(a) <= f:
            a["status"] = "angemeldet"
            raus.append(a)
    return raus


def checkin_code(event, zeile, schluessel):
    """QR-Inhalt: PHE1.<event>.<zeile>.<signatur>. Kein Name, keine E-Mail im Code."""
    basis = f"{event}.{zeile}"
    return f"{CODE_PRAEFIX}.{basis}.{signieren(basis, schluessel)}"


def checkin_lesen(code, schluessel):
    """→ (event, zeile) oder ValueError (ungültig/manipuliert)."""
    teile = str(code or "").strip().split(".")
    if len(teile) != 4 or teile[0] != CODE_PRAEFIX:
        raise ValueError("kein Event-Code")
    _, event, zeile, sig = teile
    if not signatur_gueltig(f"{event}.{zeile}", sig, schluessel):
        raise ValueError("Signatur ungültig")
    return event, zeile


def checkin_entscheiden(zeile_status, schon_erschienen_am=None):
    """→ 'ok' | 'bereits' | 'abgesagt' | 'warteliste'. Doppel-Check-in wird nicht gezählt."""
    if zeile_status == "erschienen" or schon_erschienen_am:
        return "bereits"
    if zeile_status == "abgesagt":
        return "abgesagt"
    if zeile_status == "warteliste":
        return "warteliste"
    return "ok"
