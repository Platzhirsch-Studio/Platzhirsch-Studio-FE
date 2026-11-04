"""Steuer- und Summenberechnung in Cent (ohne Frappe).

Regeln (Österreich, § 11 UStG; Marktresearch/digital und PLAN.md WP6):
  - Beträge immer Int in Cent, Steuersätze als Int ×100 (2000 = 20 %, Feldname *_promille laut CONVENTIONS). Rundung kaufmännisch (half up).
  - USt wird je Steuersatz auf die Summe der Netto-Bemessung gerechnet (nicht je Zeile summiert),
    die Zeilenwerte dienen nur der Anzeige. So stimmt der Summenblock mit der UVA überein.
  - USt-Fall aus Empfängerland und UID:
      AT                         → Steuerpflichtig AT (20/10/13 %)
      EU + UID (B2B), Waren      → Innergemeinschaftlich steuerfrei (Art 6 Abs 1 UStG), 0 %
      EU + UID (B2B), nur Leistung → Reverse Charge (Art 196 MwStSystRL), 0 %
      EU ohne UID (B2C), OSS an  → OSS: Satz des Bestimmungslandes (z. B. DE 19 %)
      EU ohne UID, OSS aus       → Steuerpflichtig AT (bis zur EU-Lieferschwelle 10.000 €)
      Drittland (CH, LI, GB, …)  → Ausfuhr (§ 6 Abs 1 Z 1 UStG), 0 %
  - Kleinbetragsrechnung: Gesamtbetrag ≤ 400 € (§ 11 Abs 6 UStG) → vereinfachte Angaben erlaubt.
"""

from decimal import ROUND_HALF_UP, Decimal

SATZ_NORMAL = 2000
SATZ_ERMAESSIGT = 1000
SATZ_ZWISCHEN = 1300
SAETZE_AT = (2000, 1300, 1000, 0)

FALL_AT = "Steuerpflichtig AT"
FALL_OSS = "OSS"
FALL_IG = "Innergemeinschaftlich steuerfrei"
FALL_RC = "Reverse Charge"
FALL_AUSFUHR = "Ausfuhr"
FALL_KLEINUNTERNEHMER = "Kleinunternehmer"

EU_LAENDER = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
    "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
}

# Normalsätze der EU-Staaten in Promille (Stand 2026, für OSS; ermäßigte Sätze nur dort, wo Möbel/
# Einrichtung relevant sein können – im Zweifel gilt der Normalsatz, Steuerberater bestätigt).
OSS_SAETZE = {
    "DE": {"normal": 1900, "ermaessigt": 700},
    "IT": {"normal": 2200, "ermaessigt": 1000},
    "FR": {"normal": 2000, "ermaessigt": 550},
    "BE": {"normal": 2100, "ermaessigt": 600},
    "NL": {"normal": 2100, "ermaessigt": 900},
    "LU": {"normal": 1700, "ermaessigt": 800},
    "ES": {"normal": 2100, "ermaessigt": 1000},
    "PT": {"normal": 2300, "ermaessigt": 600},
    "IE": {"normal": 2300, "ermaessigt": 1350},
    "DK": {"normal": 2500, "ermaessigt": 2500},
    "SE": {"normal": 2500, "ermaessigt": 1200},
    "FI": {"normal": 2550, "ermaessigt": 1400},
    "PL": {"normal": 2300, "ermaessigt": 800},
    "CZ": {"normal": 2100, "ermaessigt": 1200},
    "SK": {"normal": 2300, "ermaessigt": 1900},
    "HU": {"normal": 2700, "ermaessigt": 1800},
    "SI": {"normal": 2200, "ermaessigt": 950},
    "HR": {"normal": 2500, "ermaessigt": 1300},
    "RO": {"normal": 2100, "ermaessigt": 1100},
    "BG": {"normal": 2000, "ermaessigt": 900},
    "GR": {"normal": 2400, "ermaessigt": 1300},
    "CY": {"normal": 1900, "ermaessigt": 900},
    "MT": {"normal": 1800, "ermaessigt": 700},
    "EE": {"normal": 2400, "ermaessigt": 1300},
    "LV": {"normal": 2100, "ermaessigt": 1200},
    "LT": {"normal": 2100, "ermaessigt": 900},
}

LAND_ALIAS = {
    "ÖSTERREICH": "AT", "OESTERREICH": "AT", "AUSTRIA": "AT", "DEUTSCHLAND": "DE", "GERMANY": "DE",
    "SCHWEIZ": "CH", "SWITZERLAND": "CH", "ITALIEN": "IT", "ITALY": "IT", "FRANKREICH": "FR", "FRANCE": "FR",
    "LIECHTENSTEIN": "LI", "NIEDERLANDE": "NL", "BELGIEN": "BE", "LUXEMBURG": "LU", "SPANIEN": "ES",
}


def rund(wert):
    """Kaufmännisch gerundeter Int (Decimal half up)."""
    return int(Decimal(str(wert)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def land_code(land):
    """'Österreich' / 'AT' / 'at' → 'AT'. Unbekannt → Großbuchstaben der ersten zwei Zeichen."""
    s = str(land or "AT").strip()
    if not s:
        return "AT"
    up = s.upper()
    if up in LAND_ALIAS:
        return LAND_ALIAS[up]
    return up[:2]


def ist_eu(land):
    return land_code(land) in EU_LAENDER


def uid_normalisieren(uid):
    return "".join(ch for ch in str(uid or "").upper() if ch.isalnum())


def uid_gueltig_formal(uid):
    """Formale Prüfung: Länderkürzel + 2–12 alphanumerische Zeichen (ATU12345678, DE123456789, …)."""
    u = uid_normalisieren(uid)
    return len(u) >= 4 and u[:2].isalpha() and u[2:].isalnum() and len(u) <= 14


# ── Positionen ───────────────────────────────────────────────────────────────

def position_netto(menge, einzel_netto_cent, rabatt_promille=0):
    """Netto einer Zeile: Menge × Einzelpreis, abzüglich Zeilenrabatt (Promille)."""
    brutto_zeile = Decimal(str(menge or 0)) * Decimal(int(einzel_netto_cent or 0))
    rabatt = brutto_zeile * Decimal(int(rabatt_promille or 0)) / Decimal(1000)
    return rund(brutto_zeile - rabatt), rund(rabatt)


def ust_betrag(netto_cent, satz_promille):
    return rund(Decimal(int(netto_cent or 0)) * Decimal(int(satz_promille or 0)) / Decimal(10000))


def summen(positionen):
    """Summiert Positionen (Liste von dicts/Objekten mit art, alternativ, menge, einzel_netto_cent,
    rabatt_promille, ust_satz_promille). Setzt in jedem Eintrag netto_cent/ust_cent/brutto_cent/pos.

    Rückgabe: {netto_cent, rabatt_gesamt_cent, ust_cent, brutto_cent, alternativ_cent,
               aufteilung: [{ust_satz_promille, netto_cent, ust_cent, brutto_cent, bezeichnung}]}
    Art 'Text'/'Zwischensumme' zählt nicht; 'Rabatt' ist ein negativer Betrag (Einzelpreis negativ).
    """
    je_satz = {}
    rabatt_gesamt = 0
    alternativ = 0
    pos = 0
    for p in positionen:
        g = _get(p)
        art = g("art") or "Produkt"
        if art in ("Text", "Zwischensumme"):
            _set(p, "netto_cent", 0)
            _set(p, "ust_cent", 0)
            _set(p, "brutto_cent", 0)
            if art == "Zwischensumme":
                _set(p, "netto_cent", sum(v["netto_cent"] for v in je_satz.values()))
            continue
        pos += 1
        _set(p, "pos", pos)
        netto, rabatt = position_netto(g("menge") or 0, g("einzel_netto_cent") or 0, g("rabatt_promille") or 0)
        satz = int(g("ust_satz_promille") or 0)
        ust = ust_betrag(netto, satz)
        _set(p, "netto_cent", netto)
        _set(p, "ust_cent", ust)
        _set(p, "brutto_cent", netto + ust)
        if g("alternativ"):
            alternativ += netto + ust
            continue
        rabatt_gesamt += rabatt
        eintrag = je_satz.setdefault(satz, {"ust_satz_promille": satz, "netto_cent": 0, "ust_cent": 0, "brutto_cent": 0})
        eintrag["netto_cent"] += netto

    aufteilung = []
    for satz in sorted(je_satz, reverse=True):
        e = je_satz[satz]
        e["ust_cent"] = ust_betrag(e["netto_cent"], satz)
        e["brutto_cent"] = e["netto_cent"] + e["ust_cent"]
        e["bezeichnung"] = satz_text(satz)
        aufteilung.append(e)

    netto_cent = sum(e["netto_cent"] for e in aufteilung)
    ust_cent = sum(e["ust_cent"] for e in aufteilung)
    return {
        "netto_cent": netto_cent,
        "rabatt_gesamt_cent": rabatt_gesamt,
        "ust_cent": ust_cent,
        "brutto_cent": netto_cent + ust_cent,
        "alternativ_cent": alternativ,
        "aufteilung": aufteilung,
    }


def satz_text(satz_promille):
    s = int(satz_promille or 0)
    if s == 0:
        return "USt 0 %"
    p = Decimal(s) / Decimal(100)
    txt = f"{p:.2f}".rstrip("0").rstrip(".").replace(".", ",")
    return f"USt {txt} %"


def satz_prozent_text(satz_promille):
    return satz_text(satz_promille).replace("USt ", "")


# ── USt-Fall ─────────────────────────────────────────────────────────────────

def ust_fall_bestimmen(land, uid=None, nur_leistungen=False, oss_aktiv=False, kleinunternehmer=False):
    """→ (fall, oss_land oder None)."""
    if kleinunternehmer:
        return FALL_KLEINUNTERNEHMER, None
    lc = land_code(land)
    if lc == "AT":
        return FALL_AT, None
    if lc in EU_LAENDER:
        if uid and uid_gueltig_formal(uid) and uid_normalisieren(uid)[:2] != "AT":
            return (FALL_RC if nur_leistungen else FALL_IG), None
        if oss_aktiv:
            return FALL_OSS, lc
        return FALL_AT, None
    return FALL_AUSFUHR, None


def satz_fuer_fall(fall, at_satz_promille, oss_land=None):
    """Steuersatz einer Position nach USt-Fall. AT-Satz ist die Steuerklasse der Position."""
    if fall in (FALL_IG, FALL_RC, FALL_AUSFUHR, FALL_KLEINUNTERNEHMER):
        return 0
    if fall == FALL_OSS:
        s = OSS_SAETZE.get(oss_land or "", {"normal": 2000, "ermaessigt": 1000})
        return s["normal"] if int(at_satz_promille or 0) >= SATZ_ZWISCHEN or int(at_satz_promille or 0) == 0 else s["ermaessigt"]
    return int(at_satz_promille or 0)


def hinweistext(fall, texte=None, oss_land=None):
    """Pflichthinweis bei Steuerbefreiung/RC (§ 11 Abs 1 Z 3 lit h / Abs 1a UStG)."""
    t = texte or {}
    if fall == FALL_IG:
        return t.get("ig") or "Steuerfreie innergemeinschaftliche Lieferung (Art 6 Abs 1 UStG)."
    if fall == FALL_RC:
        return t.get("rc") or "Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, Art 196 MwStSystRL)."
    if fall == FALL_AUSFUHR:
        return t.get("ausfuhr") or "Steuerfreie Ausfuhrlieferung (§ 6 Abs 1 Z 1 UStG)."
    if fall == FALL_OSS:
        basis = t.get("oss") or "Umsatzsteuer des Bestimmungslandes (EU-OSS)."
        return f"{basis} Bestimmungsland {oss_land}." if oss_land else basis
    if fall == FALL_KLEINUNTERNEHMER:
        return "Umsatzsteuerbefreit – Kleinunternehmer gemäß § 6 Abs 1 Z 27 UStG."
    return ""


def ist_kleinbetrag(brutto_cent, grenze_cent=40000):
    return 0 <= int(brutto_cent or 0) <= int(grenze_cent or 40000)


def uid_empfaenger_pflicht(brutto_cent, grenze_cent=1000000):
    return int(brutto_cent or 0) > int(grenze_cent or 1000000)


def pflichtangaben_pruefen(beleg):
    """Prüft die Rechnungsmerkmale nach § 11 Abs 1 UStG. beleg: dict mit
    kunde_name, strasse/plz/ort, datum, nummer_vergeben (bool), positionen (Liste), leistungsdatum oder
    leistungszeitraum_von/bis, brutto_cent, uid_empfaenger, ust_fall, kleinbetrag (bool), firma_uid.
    Rückgabe: Liste fehlender Angaben (leer = ok)."""
    fehlt = []
    g = _get(beleg)
    klein = bool(g("kleinbetrag"))
    if not g("kunde_name"):
        fehlt.append("Name des Leistungsempfängers")
    if not klein and not (g("strasse") and g("ort")):
        fehlt.append("Anschrift des Leistungsempfängers")
    if not g("datum"):
        fehlt.append("Ausstellungsdatum")
    if not g("positionen"):
        fehlt.append("Menge und Bezeichnung der Leistung")
    if not (g("leistungsdatum") or (g("leistungszeitraum_von") and g("leistungszeitraum_bis"))):
        fehlt.append("Tag der Lieferung oder Leistungszeitraum")
    if not klein and not g("firma_uid"):
        fehlt.append("UID des Ausstellers")
    if uid_empfaenger_pflicht(g("brutto_cent") or 0, g("uid_grenze_cent") or 1000000) and not g("uid_empfaenger"):
        fehlt.append("UID des Leistungsempfängers (Gesamtbetrag über 10.000 €)")
    if g("ust_fall") in (FALL_IG, FALL_RC) and not g("uid_empfaenger"):
        fehlt.append("UID des Leistungsempfängers (igL / Reverse Charge)")
    if g("ust_fall") in (FALL_IG, FALL_RC, FALL_AUSFUHR, FALL_OSS) and not g("ust_hinweistext"):
        fehlt.append("Hinweis auf Steuerbefreiung / Steuerschuldnerschaft")
    return fehlt


# ── Hilfen ───────────────────────────────────────────────────────────────────

def _get(obj):
    if isinstance(obj, dict):
        return lambda k: obj.get(k)
    return lambda k: getattr(obj, k, None)


def _set(obj, k, v):
    if isinstance(obj, dict):
        obj[k] = v
    else:
        setattr(obj, k, v)
