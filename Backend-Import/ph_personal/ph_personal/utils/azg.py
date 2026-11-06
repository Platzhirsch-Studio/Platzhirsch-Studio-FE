"""AZG/ARG-Prüfung der Zeitaufzeichnung (Marktfunktionen-Nachtrag Nr. 57/A16) – reine Logik, ohne Frappe.

Grenzen (AZG idF BGBl I 53/2018, ARG):
  - Tag: Normalarbeitszeit bis 10 h (§ 4/§ 4b Gleitzeit), mit Überstunden bis 12 h (§ 9 Abs 1); > 12 h Verstoß.
  - Woche: über 50 h nur mit Überstunden (Hinweis), > 60 h Verstoß (§ 9 Abs 1);
    Durchschnitt über 17 Wochen höchstens 48 h (§ 9 Abs 4).
  - Ruhepause: mehr als 6 h → mindestens 30 min (§ 11 Abs 1); Jugendliche mehr als 4,5 h (KJBG § 15).
  - Tägliche Ruhezeit 11 h (§ 12 Abs 1), Jugendliche 12 h (KJBG § 16).
  - Wochenend-/Wochenruhe 36 h (ARG § 3/§ 4).
Die Prüfung blockiert nicht, sie liefert Befunde zum Protokollieren (Zeiterfassung, Monatsabschluss).
Wiederverwendet: utils/arbeitszeit (Ruhezeit, Wochenruhe, Pausenpflicht), utils/dienstplan (Uhrzeit → Minuten).
"""

from datetime import date, datetime, time, timedelta

from ph_personal.utils.arbeitszeit import pause_pflicht_min, ruhezeit_verstoesse, wochenruhe_ok
from ph_personal.utils.dienstplan import uhrzeit_min

TAG_NORMAL_MAX = 10 * 60
TAG_MAX = 12 * 60
WOCHE_HINWEIS = 50 * 60
WOCHE_MAX = 60 * 60
SCHNITT_MAX = 48 * 60
SCHNITT_WOCHEN = 17
JUGEND_TAG = 8 * 60
JUGEND_WOCHE = 40 * 60

HINWEIS = "hinweis"
VERSTOSS = "verstoss"


def _intervall(b):
    d = b["datum"]
    k, g = uhrzeit_min(b["kommen"]), uhrzeit_min(b["gehen"])
    if k is None or g is None:
        return None
    start = datetime.combine(d, time()) + timedelta(minutes=k)
    ende = datetime.combine(d, time()) + timedelta(minutes=g)
    if ende <= start:  # über Mitternacht (gehen am Folgetag)
        ende += timedelta(days=1)
    return start, ende


def _netto(b):
    iv = _intervall(b)
    if not iv:
        return 0
    return max(0, int((iv[1] - iv[0]).total_seconds() // 60) - int(b.get("pause_min") or 0))


def befund(datum, art, stufe, text):
    return {"datum": datum, "art": art, "stufe": stufe, "text": text}


def pruefen(buchungen, jugendlich=False, ueberstunden_erlaubt=True, von=None, bis=None):
    """buchungen: Liste dict {datum (date), kommen, gehen, pause_min} einer Person (mit Vorlauf für 17 Wochen).
    von/bis: nur Befunde in diesem Zeitraum melden (Vorlauf wird für Ruhezeit/Durchschnitt mitgerechnet).
    ueberstunden_erlaubt=False: schon > 10 h ist ein Verstoß (keine Überstundenanordnung/Gleitzeit).
    → Liste Befunde, sortiert nach Datum."""
    gueltig = [b for b in buchungen if b.get("datum") and b.get("kommen") and b.get("gehen")]
    von = von or min((b["datum"] for b in gueltig), default=date.today())
    bis = bis or max((b["datum"] for b in gueltig), default=date.today())
    out = []
    je_tag = {}
    brutto_tag = {}
    pause_tag = {}
    for b in gueltig:
        je_tag[b["datum"]] = je_tag.get(b["datum"], 0) + _netto(b)
        iv = _intervall(b)
        brutto_tag[b["datum"]] = brutto_tag.get(b["datum"], 0) + int((iv[1] - iv[0]).total_seconds() // 60)
        pause_tag[b["datum"]] = pause_tag.get(b["datum"], 0) + int(b.get("pause_min") or 0)
    for d in sorted(je_tag):
        if not von <= d <= bis:
            continue
        n = je_tag[d]
        h = f"{n // 60}:{n % 60:02d} h"
        if jugendlich and n > JUGEND_TAG:
            out.append(befund(d, "tag", VERSTOSS, f"Jugendliche: {h} am Tag – höchstens 8 h (KJBG § 11)"))
        if n > TAG_MAX:
            out.append(befund(d, "tag", VERSTOSS, f"{h} am Tag – höchstens 12 h (AZG § 9 Abs 1)"))
        elif n > TAG_NORMAL_MAX:
            out.append(befund(d, "tag", HINWEIS if ueberstunden_erlaubt else VERSTOSS, f"{h} am Tag – über 10 h nur mit Überstunden bzw. Gleitzeit (AZG § 4b/§ 7/§ 9)"))
        pflicht = pause_pflicht_min(brutto_tag[d], jugendlich)
        if pflicht and pause_tag[d] < pflicht:
            out.append(befund(d, "pause", VERSTOSS, f"Ruhepause {pause_tag[d]} min – mindestens {pflicht} min ({'KJBG § 15' if jugendlich else 'AZG § 11'})"))
    intervalle = [iv for iv in (_intervall(b) for b in gueltig) if iv]
    for v in ruhezeit_verstoesse(intervalle, 12 if jugendlich else 11):
        if von <= v["beginn"].date() <= bis:
            out.append(befund(v["beginn"].date(), "ruhezeit", VERSTOSS, f"Ruhezeit nur {v['stunden']} h – mindestens {12 if jugendlich else 11} h ({'KJBG § 16' if jugendlich else 'AZG § 12'})"))
    # Wochen (ISO, Montag)
    wochen = {}
    for d, n in je_tag.items():
        montag = d - timedelta(days=d.weekday())
        wochen[montag] = wochen.get(montag, 0) + n
    for montag in sorted(wochen):
        sonntag = montag + timedelta(days=6)
        if sonntag < von or montag > bis:
            continue
        n = wochen[montag]
        h = f"{n // 60}:{n % 60:02d} h"
        if jugendlich and n > JUGEND_WOCHE:
            out.append(befund(montag, "woche", VERSTOSS, f"Jugendliche: {h} in KW {montag.isocalendar()[1]} – höchstens 40 h (KJBG § 11)"))
        if n > WOCHE_MAX:
            out.append(befund(montag, "woche", VERSTOSS, f"{h} in KW {montag.isocalendar()[1]} – höchstens 60 h (AZG § 9 Abs 1)"))
        elif n > WOCHE_HINWEIS:
            out.append(befund(montag, "woche", HINWEIS, f"{h} in KW {montag.isocalendar()[1]} – über 50 h nur mit Überstunden"))
        schnitt = durchschnitt_17_wochen(wochen, montag)
        if schnitt > SCHNITT_MAX:
            out.append(befund(montag, "durchschnitt", VERSTOSS, f"Durchschnitt {round(schnitt / 60, 1)} h über 17 Wochen bis KW {montag.isocalendar()[1]} – höchstens 48 h (AZG § 9 Abs 4)"))
        woche_iv = [iv for iv in intervalle if montag <= iv[0].date() <= sonntag]
        if woche_iv and sonntag <= bis:
            ok, std = wochenruhe_ok(woche_iv, montag)
            if not ok:
                out.append(befund(montag, "wochenruhe", VERSTOSS, f"keine 36 h Wochenruhe in KW {montag.isocalendar()[1]} (längste Ruhe {std} h, ARG § 3/§ 4)"))
    return sorted(out, key=lambda x: (x["datum"], x["art"]))


def durchschnitt_17_wochen(wochen_minuten, montag):
    """Durchschnitt der Wochenarbeitszeit über die 17 Wochen bis einschließlich `montag` (fehlende Wochen = 0,
    erst ab 17 erfassten Wochen aussagekräftig – vorher Durchschnitt über die vorhandenen Wochen ab der ersten)."""
    erste = min(wochen_minuten) if wochen_minuten else montag
    fenster = [montag - timedelta(weeks=i) for i in range(SCHNITT_WOCHEN)]
    fenster = [w for w in fenster if w >= erste]
    if not fenster:
        return 0
    return sum(wochen_minuten.get(w, 0) for w in fenster) / len(fenster)


def zusammenfassung(befunde):
    """Kurztext für Felder/Protokoll: 'n Verstöße, m Hinweise' + Zeilen."""
    v = [b for b in befunde if b["stufe"] == VERSTOSS]
    h = [b for b in befunde if b["stufe"] == HINWEIS]
    zeilen = [f"{'⚠' if b['stufe'] == VERSTOSS else 'ℹ'} {b['datum'].strftime('%d.%m.%Y')}: {b['text']}" for b in befunde]
    return {"verstoesse": len(v), "hinweise": len(h), "text": "\n".join(zeilen)}
