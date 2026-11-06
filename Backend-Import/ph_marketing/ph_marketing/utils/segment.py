"""Segment-Builder: Regeln über Empfänger-Profile auswerten – ohne Frappe-Import (Tests ohne Site).

Ein Profil ist ein dict je E-Mail-Adresse, gebaut in ph_marketing/segmente.py aus PH Newsletter Abo, PH Einwilligung,
PH Kontakt (ph_crm), PH Kundenkarte (falls installiert), Aufträgen/Bestellungen (falls installiert), Event-Anmeldungen:

    email, kontakt, sprache, plz, land, kontaktart, kontakt_status, interessen (set), kundenkarte_stufe,
    letzter_kauf (date|None), umsatz_12m_cent, umsatz_gesamt_cent, kaeufe_anzahl, events (set),
    abo_status, abo_quelle, altbestand_ohne_doi, nicht_kontaktieren, einwilligungen {zweck: status}

Rechtsrahmen (TKG 2021 § 174, DSGVO Art. 6/7): Segmente dienen ausschließlich werblicher E-Mail mit Einwilligung (E).
Die Bestandskunden-Ausnahme (B, § 174 Abs. 4 TKG) läuft nur über Kundenreisen mit Kanzlei-Schalter, nie über Segmente.
Deshalb ist die Einwilligungsprüfung hier zwingend und nicht abschaltbar.
"""

from __future__ import annotations

from collections import Counter
from datetime import date, datetime, timedelta

KRITERIEN = {
    "interesse": "Interesse (Newsletter-Abo)",
    "sprache": "Sprache",
    "plz": "PLZ (Bereich/Präfix)",
    "land": "Land",
    "kontaktart": "Kontaktart (Privat, Architekt …)",
    "kontakt_status": "Kontaktstatus (Interessent, Kunde …)",
    "kundenkarte_stufe": "Kundenkarte-Stufe",
    "kauf_in_tagen": "Kauf in den letzten N Tagen",
    "kein_kauf_seit_tagen": "Kein Kauf seit N Tagen",
    "umsatz_12m_cent": "Umsatz 12 Monate (Cent)",
    "umsatz_gesamt_cent": "Umsatz gesamt (Cent)",
    "kaeufe_anzahl": "Anzahl Käufe",
    "event": "Event-Teilnahme (Kennung)",
    "abo_quelle": "Abo-Quelle",
}
OPERATOREN = ("ist", "ist nicht", "beginnt mit", "zwischen", "mindestens", "hoechstens", "enthaelt", "vorhanden", "fehlt")
VERKNUEPFUNG = ("UND", "ODER")

# Zwecke, die eine bestätigte Einwilligung brauchen (regeln.DOI_ZWECKE + Kanäle mit eigenem Nachweis)
EMAIL_ZWECKE = ("newsletter", "einladungen", "merkliste_erinnerung", "planer_erinnerung", "rueckmeldung", "pflege_nachkauf")


class RegelFehler(ValueError):
    pass


def _liste(wert):
    if wert is None:
        return []
    if isinstance(wert, (list, tuple, set)):
        return [str(x).strip().lower() for x in wert if str(x).strip()]
    return [x.strip().lower() for x in str(wert).replace(";", ",").split(",") if x.strip()]


def _int(wert):
    try:
        return int(str(wert).strip())
    except (TypeError, ValueError):
        raise RegelFehler(f"Zahl erwartet: {wert!r}") from None


def _datum(wert):
    if wert is None or wert == "":
        return None
    if isinstance(wert, datetime):
        return wert.date()
    if isinstance(wert, date):
        return wert
    return date.fromisoformat(str(wert)[:10])


def regel_pruefen_syntax(kriterium, operator, wert, wert_bis=None):
    """→ Fehlertext oder None (für validate der DocType)."""
    if kriterium not in KRITERIEN:
        return f"Unbekanntes Kriterium {kriterium!r}"
    if operator not in OPERATOREN:
        return f"Unbekannter Operator {operator!r}"
    zahl = kriterium in ("kauf_in_tagen", "kein_kauf_seit_tagen", "umsatz_12m_cent", "umsatz_gesamt_cent", "kaeufe_anzahl")
    if operator in ("vorhanden", "fehlt"):
        return None
    if wert in (None, ""):
        return "Wert fehlt"
    try:
        if zahl or operator in ("mindestens", "hoechstens", "zwischen"):
            _int(wert)
            if operator == "zwischen":
                if wert_bis in (None, ""):
                    return "„zwischen“ braucht „Wert bis“"
                if _int(wert_bis) < _int(wert):
                    return "„Wert bis“ ist kleiner als „Wert“"
    except RegelFehler as e:
        if kriterium == "plz" and operator == "zwischen":
            return None if str(wert).isdigit() and str(wert_bis or "").isdigit() else "PLZ-Bereich nur mit Ziffern"
        return str(e)
    if kriterium in ("kauf_in_tagen", "kein_kauf_seit_tagen") and operator not in ("ist", "mindestens", "hoechstens"):
        return "Tage-Kriterien nur mit ist/mindestens/hoechstens"
    return None


def _vergleich(ist, operator, wert, wert_bis):
    """Vergleich eines Einzelwerts (Text oder Zahl)."""
    if operator == "vorhanden":
        return ist not in (None, "", 0, set(), [])
    if operator == "fehlt":
        return ist in (None, "", 0, set(), [])
    if isinstance(ist, (set, list, tuple)):
        werte = set(_liste(wert))
        menge = {str(x).lower() for x in ist}
        if operator in ("ist", "enthaelt"):
            return bool(menge & werte)
        if operator == "ist nicht":
            return not (menge & werte)
        return False
    if operator in ("mindestens", "hoechstens", "zwischen"):
        try:
            n = int(ist or 0)
        except (TypeError, ValueError):
            return False
        if operator == "mindestens":
            return n >= _int(wert)
        if operator == "hoechstens":
            return n <= _int(wert)
        return _int(wert) <= n <= _int(wert_bis)
    text = str(ist or "").strip().lower()
    werte = _liste(wert)
    if operator == "ist":
        return text in werte
    if operator == "ist nicht":
        return text not in werte
    if operator == "beginnt mit":
        return any(text.startswith(w) for w in werte)
    if operator == "enthaelt":
        return any(w in text for w in werte)
    return False


def regel_pruefen(regel, profil, heute=None):
    """regel: dict(kriterium, operator, wert, wert_bis, negieren). → bool."""
    heute = _datum(heute) or date.today()
    k, op = regel.get("kriterium"), regel.get("operator") or "ist"
    wert, bis = regel.get("wert"), regel.get("wert_bis")
    if k == "plz" and op == "zwischen":
        plz = str(profil.get("plz") or "").strip()
        ergebnis = plz.isdigit() and _int(wert) <= int(plz) <= _int(bis)
    elif k == "kauf_in_tagen":
        lk = _datum(profil.get("letzter_kauf"))
        ergebnis = bool(lk) and lk >= heute - timedelta(days=_int(wert))
    elif k == "kein_kauf_seit_tagen":
        lk = _datum(profil.get("letzter_kauf"))
        # nie gekauft zählt nicht als „kein Kauf seit“ – dafür kaeufe_anzahl hoechstens 0
        ergebnis = bool(lk) and lk < heute - timedelta(days=_int(wert))
    elif k == "interesse":
        ergebnis = _vergleich(profil.get("interessen") or set(), op, wert, bis)
    elif k == "event":
        ergebnis = _vergleich(profil.get("events") or set(), op, wert, bis)
    else:
        ergebnis = _vergleich(profil.get(k), op, wert, bis)
    return (not ergebnis) if regel.get("negieren") else bool(ergebnis)


def passt(regeln, profil, verknuepfung="UND", heute=None):
    aktive = [r for r in regeln or [] if not r.get("deaktiviert")]
    if not aktive:
        return True
    treffer = (regel_pruefen(r, profil, heute) for r in aktive)
    return all(treffer) if verknuepfung != "ODER" else any(treffer)


def einwilligung_pruefen(profil, zweck="newsletter"):
    """Zwingende Prüfung vor jedem Versand an ein Segment. → (ok, grund)."""
    if zweck not in EMAIL_ZWECKE:
        return False, "zweck_unzulaessig"
    if not profil.get("email") or str(profil.get("email")).endswith(".invalid"):
        return False, "keine_email"
    if profil.get("nicht_kontaktieren"):
        return False, "nicht_kontaktieren"
    if profil.get("abo_status") in ("Bounce", "Beschwerde"):
        return False, "abo_" + profil["abo_status"].lower()
    if profil.get("widerspruch"):
        return False, "widerspruch"
    if profil.get("ecg_liste"):
        return False, "ecg_liste"
    status = (profil.get("einwilligungen") or {}).get(zweck)
    if zweck == "newsletter":
        if profil.get("altbestand_ohne_doi"):
            return False, "altbestand_ohne_doi"
        if profil.get("abo_status") != "Aktiv":
            return False, "kein_aktives_abo"
        if status not in (None, "Bestaetigt"):
            # Abo aktiv, aber Einwilligung widerrufen → Widerruf hat Vorrang
            return False, "einwilligung_" + str(status).lower()
        return True, None
    if status != "Bestaetigt":
        return False, "keine_einwilligung" if not status else "einwilligung_" + str(status).lower()
    return True, None


def auswerten(regeln, profile, zweck="newsletter", verknuepfung="UND", heute=None):
    """→ (empfaenger: list[profil], ausgeschlossen: Counter{grund: n}, treffer_ohne_pruefung: int)."""
    empfaenger, ausgeschlossen, treffer = [], Counter(), 0
    gesehen = set()
    for p in profile:
        email = str(p.get("email") or "").strip().lower()
        if email in gesehen:
            ausgeschlossen["dublette"] += 1
            continue
        gesehen.add(email)
        if not passt(regeln, p, verknuepfung, heute):
            continue
        treffer += 1
        ok, grund = einwilligung_pruefen(p, zweck)
        if ok:
            empfaenger.append(p)
        else:
            ausgeschlossen[grund] += 1
    return empfaenger, ausgeschlossen, treffer


GRUND_TEXT = {
    "dublette": "gleiche Adresse mehrfach",
    "keine_email": "keine E-Mail-Adresse",
    "nicht_kontaktieren": "Kontakt „nicht kontaktieren“",
    "abo_bounce": "Adresse nicht zustellbar (Bounce)",
    "abo_beschwerde": "Beschwerde (Spam-Meldung)",
    "ecg_liste": "ECG-Liste (RTR)",
    "widerspruch": "genereller Widerspruch (Email Unsubscribe)",
    "altbestand_ohne_doi": "Altbestand ohne Double-Opt-in",
    "kein_aktives_abo": "kein bestätigtes Newsletter-Abo",
    "keine_einwilligung": "keine Einwilligung für diesen Zweck",
    "einwilligung_widerrufen": "Einwilligung widerrufen",
    "einwilligung_offen": "Einwilligung noch nicht bestätigt",
    "einwilligung_abgelaufen": "Einwilligung abgelaufen",
    "zweck_unzulaessig": "Zweck nicht für E-Mail-Werbung",
}
