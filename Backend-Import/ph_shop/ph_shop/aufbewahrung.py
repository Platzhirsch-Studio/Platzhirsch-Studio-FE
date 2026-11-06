"""Aufbewahrung und Anonymisierung von Shop-Daten – reine Logik (ohne Frappe).

Regeln (Recht-Entwurf, Prüfung durch Steuerberater/Kanzlei offen):
  - § 132 Abs 1 BAO: Bücher, Aufzeichnungen und Belege 7 Jahre, Frist beginnt mit Schluss des Kalenderjahres
    → Ende = 31.12. (Jahr des Belegs + 7). Verlängert, solange ein Abgaben-/Gerichtsverfahren anhängig ist.
  - Gutscheine mit Restwert: Forderung des Kunden besteht (allg. Verjährung 30 Jahre, § 1478 ABGB; OGH zu
    Gutscheinbefristungen) → solange Restwert > 0 aufbewahren, nur Käuferdaten minimieren ist nicht möglich.
  - Nach Fristende: Personenbezug entfernen (Art. 17 DSGVO), Beträge/Nummern bleiben für Statistik.
"""

import datetime

BAO_JAHRE = 7

# Felder, die nach Fristende anonymisiert werden (Bestellung); Rechnungsrelevantes bleibt bis Fristende.
BESTELLUNG_PERSON = ("kunde_name", "kunde_email", "kunde_telefon", "adresse_plz", "adresse_ort", "adresse_strasse", "adresse_hausnr", "adresse_zusatz", "rechnung_name", "rechnung_adresse", "rechnung_uid", "notiz_kunde")
# sofort entbehrlich (kein Belegbestandteil): darf auch innerhalb der Frist entfernt werden
BESTELLUNG_SOFORT = ("kunde_telefon", "kunden_token_hash", "ip_hash")
ANONYM = "anonymisiert"


def _datum(wert):
    if wert is None:
        return None
    if isinstance(wert, datetime.datetime):
        return wert.date()
    if isinstance(wert, datetime.date):
        return wert
    return datetime.date.fromisoformat(str(wert)[:10])


def bao_frist_ende(belegdatum, jahre=BAO_JAHRE):
    """31.12. des Jahres Beleg + 7 (§ 132 BAO)."""
    d = _datum(belegdatum)
    return datetime.date(d.year + int(jahre), 12, 31) if d else None


def entscheidung(belegdatum, heute=None, restwert_cent=0, verfahren_offen=False):
    """→ (aktion, grund, frist_bis) mit aktion ∈ {aufbewahren, anonymisieren}."""
    heute = _datum(heute) or datetime.date.today()
    if int(restwert_cent or 0) > 0:
        return "aufbewahren", "Gutschein mit Restwert – Forderung des Kunden (§ 1478 ABGB)", None
    ende = bao_frist_ende(belegdatum)
    if verfahren_offen:
        return "aufbewahren", "anhängiges Verfahren – Frist verlängert (§ 132 Abs 1 BAO)", ende
    if ende and heute <= ende:
        return "aufbewahren", f"Aufbewahrungspflicht § 132 BAO bis {ende.isoformat()}", ende
    return "anonymisieren", "Aufbewahrungsfrist abgelaufen – Personenbezug entfernen (Art. 17 DSGVO)", ende


def anonym_werte(felder, email_feld=None):
    """Ersatzwerte für die genannten Felder (E-Mail bleibt formal gültig, damit validate() nicht scheitert)."""
    out = {}
    for f in felder:
        out[f] = None
    if email_feld:
        out[email_feld] = "anonym@invalid.platzhirsch"
    if "kunde_name" in felder:
        out["kunde_name"] = ANONYM
    return out
