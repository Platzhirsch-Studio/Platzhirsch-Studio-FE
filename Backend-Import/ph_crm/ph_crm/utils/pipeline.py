"""Pipeline-Werte, Abschlusswahrscheinlichkeit, ruhende Anfragen, Terminserien, UTM – ohne Frappe.

Quelle: 10-konzept-crm.md §8.2 (R1/R2 Schwellen 1/7/14/21 Tage, Inhaber-Entscheidung offen),
30-marktfunktionen.md (Pipeline mit gewichtetem Wert), src/lib/forms/leadPayload.js (Herkunftsblock).
"""

import calendar
from datetime import date, datetime, timedelta

WAHRSCHEINLICHKEIT = {"Neu": 10, "Qualifiziert": 25, "Termin vereinbart": 40, "Angebot": 60, "Gewonnen": 100, "Verloren": 0, "Spam": 0}
RUHE_SCHWELLEN = {"Neu": 1, "Qualifiziert": 7, "Termin vereinbart": 14, "Angebot": 21}
OFFEN = ("Neu", "Qualifiziert", "Termin vereinbart", "Angebot")
INTERVALLE = {"woechentlich": 7, "zweiwoechentlich": 14, "vierwoechentlich": 28}
SERIE_MAX = 52


def wahrscheinlichkeit(status, manuell=None):
    """Endzustände erzwingen 100/0; sonst manueller Wert (0–100) oder Standard je Status."""
    if status in ("Gewonnen", "Verloren", "Spam"):
        return WAHRSCHEINLICHKEIT[status]
    if manuell is not None and str(manuell) != "":
        return max(0, min(100, int(manuell)))
    return WAHRSCHEINLICHKEIT.get(status, 0)


def gewichtet_cent(wert_cent, prozent):
    """Gewichteter Wert in Cent, kaufmännisch gerundet (Int, nie Float für Geld)."""
    w, p = int(wert_cent or 0), int(prozent or 0)
    return (w * p + 50) // 100


def ruhend(status, tage_seit_aenderung, schwellen=None):
    s = (schwellen or RUHE_SCHWELLEN).get(status)
    return s is not None and int(tage_seit_aenderung) >= int(s)


def pipeline_summe(zeilen):
    """zeilen: [{status, wert_cent, gewichtet_cent}] → {status: {anzahl, wert_cent, gewichtet_cent}} (nur offen)."""
    erg = {s: {"anzahl": 0, "wert_cent": 0, "gewichtet_cent": 0} for s in OFFEN}
    for z in zeilen:
        if z.get("status") in erg:
            e = erg[z["status"]]
            e["anzahl"] += 1
            e["wert_cent"] += int(z.get("wert_cent") or 0)
            e["gewichtet_cent"] += int(z.get("gewichtet_cent") or 0)
    return erg


# ── Terminserien ────────────────────────────────────────────────────────────


def _plus_monate(d, n):
    m = d.month - 1 + n
    j, m = d.year + m // 12, m % 12 + 1
    tag = min(d.day, calendar.monthrange(j, m)[1])
    return d.replace(year=j, month=m, day=tag)


def serien_starts(start, intervall, anzahl=None, bis=None, maximum=SERIE_MAX):
    """Startzeitpunkte einer Serie inkl. erstem Termin. intervall: woechentlich | zweiwoechentlich |
    vierwoechentlich | monatlich. Ende über anzahl (≥ 2) oder bis (Datum, inklusiv)."""
    if not isinstance(start, datetime):
        raise ValueError("start muss datetime sein")
    if intervall not in INTERVALLE and intervall != "monatlich":
        raise ValueError(f"unbekanntes Intervall {intervall!r}")
    if not anzahl and not bis:
        raise ValueError("anzahl oder bis angeben")
    if bis and not isinstance(bis, date):
        bis = date.fromisoformat(str(bis)[:10])
    grenze = min(int(anzahl), maximum) if anzahl else maximum
    starts, i = [], 0
    while len(starts) < grenze:
        t = _plus_monate(start, i) if intervall == "monatlich" else start + timedelta(days=INTERVALLE[intervall] * i)
        if bis and t.date() > bis:
            break
        starts.append(t)
        i += 1
    return starts


# ── Herkunft / UTM ──────────────────────────────────────────────────────────


def utm_aus_herkunft(werte=None, payload=None):
    """Herkunftsblock-Werte (Schlüssel klein, s. api._herkunft_trennen) + direkte Payload-Felder →
    utm_source, utm_medium, utm_campaign, utm_term, utm_content, klick_id. Payload hat Vorrang."""
    werte, payload = werte or {}, payload or {}
    quelle = str(werte.get("quelle") or "")
    src, med = (quelle.split("/", 1) + [""])[:2] if "/" in quelle else (quelle, "")
    erg = {
        "utm_source": src.strip(),
        "utm_medium": med.strip(),
        "utm_campaign": str(werte.get("kampagne") or "").strip(),
        "utm_term": str(werte.get("suchbegriff") or "").strip(),
        "utm_content": str(werte.get("anzeige") or "").strip(),
        "klick_id": str(werte.get("klick-id") or "").strip(),
    }
    for k in ("utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "klick_id"):
        if payload.get(k):
            erg[k] = str(payload[k]).strip()
    return {k: v[:140] for k, v in erg.items()}
