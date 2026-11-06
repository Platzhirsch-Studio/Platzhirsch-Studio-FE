"""Arbeitszeit Österreich – reine Logik, ohne Frappe.

Quellen: AZG (§ 3 Normalarbeitszeit 40 h, § 9 Höchstgrenzen 12 h/Tag 60 h/Woche, § 10 Überstundenzuschlag
50 % bzw. Zeitausgleich 1 : 1,5, § 11 Ruhepause 30 min ab mehr als 6 h, § 12 tägliche Ruhezeit 11 h,
§ 19d Abs 3a Mehrarbeitszuschlag Teilzeit 25 %, § 26 Aufzeichnungspflicht), ARG § 3 (Wochenendruhe 36 h),
ARG § 7/§ 9 (Feiertag: Entgelt ohne Arbeit, kein Urlaubsverbrauch), KJBG § 11 (Jugendliche 8 h/Tag,
40 h/Woche), KJBG § 15 (Pause 30 min ab mehr als 4,5 h). Fachkritik 21-kritik-fach-personal.md P5/P7/R5/R6.

Begriffe:
  Modell      Wochenraster der Person in Minuten je Wochentag [mo..so] mit Gültigkeit (PH Mitarbeiter Arbeitszeit).
  Soll        Minuten laut Modell am Tag; 0 an gesetzlichen Feiertagen und bezahlt freier Betriebsruhe.
  Gutschrift  bezahlte Abwesenheit (Urlaub, Krankenstand, Pflegefreistellung, …) = Tagessoll.
  Zeitausgleich: Soll bleibt, keine Gutschrift → Saldo sinkt um das Soll (Fehler F14 behoben).
  Unbezahlt/Karenz: Soll 0, keine Gutschrift.
Das System berechnet **keine Zuschläge in Geld** (Lohnverrechnung, Kanzlei); es teilt nur Stunden auf.
"""

from datetime import date, datetime, timedelta

WOCHENTAGE = ("mo", "di", "mi", "do", "fr", "sa", "so")
GESETZ_NORMAL_WOCHE_MIN = 40 * 60
TAG_HINWEIS_MIN = 10 * 60
TAG_HOECHST_MIN = 12 * 60
WOCHE_HOECHST_MIN = 60 * 60
JUGEND_TAG_MIN = 8 * 60
JUGEND_WOCHE_MIN = 40 * 60
RUHEZEIT_STD = 11
WOCHENRUHE_STD = 36

# Gutschrift-Matrix (P7). Schlüssel = PH Abwesenheit.art bzw. „Krankenstand“ (PH Krankmeldung).
REGEL_BEZAHLT = "bezahlt"
REGEL_ZA = "zeitausgleich"
REGEL_UNBEZAHLT = "unbezahlt"
REGEL_RUHEND = "ruhend"
ART_REGEL = {
    "Urlaub": REGEL_BEZAHLT,
    "Krankenstand": REGEL_BEZAHLT,
    "Pflegefreistellung": REGEL_BEZAHLT,
    "Sonderurlaub": REGEL_BEZAHLT,
    "Fortbildung": REGEL_BEZAHLT,
    "Berufsschule": REGEL_BEZAHLT,
    "Zeitausgleich": REGEL_ZA,
    "Unbezahlt": REGEL_UNBEZAHLT,
    "Karenz": REGEL_RUHEND,
    "Mutterschutz": REGEL_RUHEND,
    "Zivil-/Praesenzdienst": REGEL_RUHEND,
}

# Freie Tage: Art aus dem Feiertagskalender
FREI_GESETZLICH = "gesetzlich"
FREI_LAND = "land"
FREI_BETRIEBSRUHE = "betriebsruhe"


def _datum(d):
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    return date.fromisoformat(str(d)[:10])


def modell_minuten(modell):
    """dict mit mo_min … so_min → Liste [mo..so]."""
    return [int((modell or {}).get(f"{t}_min") or 0) for t in WOCHENTAGE]


def wochenminuten(modell):
    return sum(modell_minuten(modell))


def modell_am(modelle, datum):
    """Das am Tag gültige Modell (größtes gueltig_ab ≤ Tag) oder None."""
    datum = _datum(datum)
    kandidaten = [m for m in (modelle or []) if m.get("gueltig_ab") and _datum(m["gueltig_ab"]) <= datum]
    if not kandidaten:
        return None
    return max(kandidaten, key=lambda m: _datum(m["gueltig_ab"]))


def standardmodell(wochenstunden, tage=5):
    """Ersatzmodell, wenn keine Arbeitszeit-Zeile existiert: Wochenstunden gleich auf Mo–Fr (bzw. tage) verteilt."""
    tagesmin = int(round(float(wochenstunden or 0) * 60 / tage)) if tage else 0
    return {f"{t}_min": (tagesmin if i < tage else 0) for i, t in enumerate(WOCHENTAGE)} | {"gueltig_ab": date(1900, 1, 1)}


def ist_frei(art_frei, landesfeiertag_frei=True, betriebsruhe_behandlung="Bezahlt frei"):
    """Ist ein Kalendertag für Soll-Zwecke arbeitsfrei (Soll 0, keine Urlaubsanrechnung)?"""
    if art_frei == FREI_GESETZLICH:
        return True
    if art_frei == FREI_LAND:
        return bool(landesfeiertag_frei)
    if art_frei == FREI_BETRIEBSRUHE:
        return betriebsruhe_behandlung == "Bezahlt frei"
    return False


def soll_tag(modelle, datum, freie_tage=None, landesfeiertag_frei=True, betriebsruhe_behandlung="Bezahlt frei", ersatz=None):
    """(soll_min, modell_min, frei_art): Soll am Tag nach Modell und Feiertagskalender.
    freie_tage: dict date → art (gesetzlich/land/betriebsruhe)."""
    datum = _datum(datum)
    m = modell_am(modelle, datum) or ersatz
    modell_min = modell_minuten(m)[datum.weekday()] if m else 0
    frei = (freie_tage or {}).get(datum)
    if frei and ist_frei(frei, landesfeiertag_frei, betriebsruhe_behandlung):
        return 0, modell_min, frei
    return modell_min, modell_min, frei


def urlaubstage(von, bis, modelle, freie_tage=None, halbtags=False, landesfeiertag_frei=True, betriebsruhe_behandlung="Bezahlt frei", ersatz=None):
    """Liste (datum, menge) der Urlaubs-/Abwesenheitstage: nur Tage, an denen die Person laut Modell
    arbeiten würde und die kein freier Tag sind (R4: Samstagskraft zählt Sa, nicht den freien Mi;
    Feiertage verbrauchen keinen Urlaub)."""
    von, bis = _datum(von), _datum(bis)
    out = []
    d = von
    while d <= bis:
        soll, _, _ = soll_tag(modelle, d, freie_tage, landesfeiertag_frei, betriebsruhe_behandlung, ersatz)
        if soll > 0:
            out.append((d, 0.5 if halbtags else 1.0))
        d += timedelta(days=1)
    if halbtags:
        out = out[:1]
    return out


def tag_bewerten(soll_min, art=None, halbtags=False):
    """Gutschrift-Matrix je Tag → dict {soll, gutschrift, za_verbrauch, unbezahlt}.
    soll_min ist das Soll nach Feiertagskalender. Halber Tag: halbe Wirkung."""
    anteil = 0.5 if halbtags else 1.0
    regel = ART_REGEL.get(art) if art else None
    out = {"soll": soll_min, "gutschrift": 0, "za_verbrauch": 0, "unbezahlt": 0}
    if not regel or soll_min <= 0:
        return out
    teil = int(round(soll_min * anteil))
    if regel == REGEL_BEZAHLT:
        out["gutschrift"] = teil
    elif regel == REGEL_ZA:
        out["za_verbrauch"] = teil  # Soll bleibt, keine Gutschrift
    elif regel in (REGEL_UNBEZAHLT, REGEL_RUHEND):
        out["soll"] = soll_min - teil
        out["unbezahlt"] = teil
    return out


def stunden_aufteilen(ist_min, vertrag_min, kv_normal_min, gesetz_normal_min=GESETZ_NORMAL_WOCHE_MIN):
    """Wochenstunden (Ist inkl. bezahlter Abwesenheit, Ausfallprinzip) aufteilen:
      normal          bis Vertragsstunden
      mehrarbeit      Teilzeit: über Vertrag bis KV-Normalarbeitszeit (§ 19d Abs 3a AZG, 25 % sofern nicht
                      im Quartal/Durchrechnung ausgeglichen)
      kv_mehrstunden  über KV-Normalarbeitszeit bis 40 h (Behandlung nach KV – Lohnverrechnung)
      ueberstunden    über 40 h (§ 10 AZG, 50 % bzw. 1 : 1,5)
      fehl            unter Vertrag (Minusstunden)"""
    ist = max(0, int(ist_min or 0))
    vertrag = max(0, int(vertrag_min or 0))
    kv = max(vertrag, int(kv_normal_min or vertrag))
    gesetz = max(kv, int(gesetz_normal_min or kv))
    return {
        "normal": min(ist, vertrag),
        "mehrarbeit": max(0, min(ist, kv) - vertrag),
        "kv_mehrstunden": max(0, min(ist, gesetz) - kv),
        "ueberstunden": max(0, ist - gesetz),
        "fehl": max(0, vertrag - ist),
    }


def za_wert(aufteilung, abgeltung="Zeitausgleich", faktor_ueberstunden=1.5, faktor_mehrarbeit=1.25, faktor_kv=1.0):
    """Zeitausgleichs-Guthaben (Minuten) aus einer Wochenaufteilung je Abgeltungsart:
    Zeitausgleich → Überstunden × 1,5, Mehrarbeit × 1,25, KV-Mehrstunden × Faktor KV;
    Gleitzeit → 1 : 1 (nur mit Gleitzeitvereinbarung § 4b AZG); Auszahlung → 0 (Rohdaten an Lohnverrechnung)."""
    if abgeltung == "Auszahlung":
        return 0
    if abgeltung == "Gleitzeit":
        return aufteilung["mehrarbeit"] + aufteilung["kv_mehrstunden"] + aufteilung["ueberstunden"]
    return int(round(aufteilung["ueberstunden"] * faktor_ueberstunden + aufteilung["mehrarbeit"] * faktor_mehrarbeit + aufteilung["kv_mehrstunden"] * faktor_kv))


def wochen_auswerten(tage, kv_normal_woche_min, gesetz_normal_woche_min=GESETZ_NORMAL_WOCHE_MIN, abgeltung="Zeitausgleich"):
    """tage: Liste dict {datum, ist, gutschrift, feiertag_min, modell_min, modell_woche_min} (ein Monat).
    Je ISO-Woche (anteilig bei angeschnittenen Wochen) Aufteilung nach stunden_aufteilen und ZA-Wert.
    Rückgabe: (wochen-Liste, Summen-dict)."""
    wochen = {}
    for t in tage:
        k = _datum(t["datum"]).isocalendar()[:2]
        w = wochen.setdefault(k, {"woche": f"{k[0]}-W{k[1]:02d}", "ist": 0, "vertrag": 0, "modell_woche": 0})
        w["ist"] += int(t.get("ist") or 0) + int(t.get("gutschrift") or 0) + int(t.get("feiertag_min") or 0)
        w["vertrag"] += int(t.get("modell_min") or 0)
        w["modell_woche"] = max(w["modell_woche"], int(t.get("modell_woche_min") or 0))
    summe = {"normal": 0, "mehrarbeit": 0, "kv_mehrstunden": 0, "ueberstunden": 0, "fehl": 0, "za_wert": 0}
    out = []
    for k in sorted(wochen):
        w = wochen[k]
        anteil = (w["vertrag"] / w["modell_woche"]) if w["modell_woche"] else 1.0
        kv = int(round(max(kv_normal_woche_min, w["modell_woche"]) * anteil))
        gesetz = int(round(gesetz_normal_woche_min * anteil))
        a = stunden_aufteilen(w["ist"], w["vertrag"], kv, gesetz)
        a["za_wert"] = za_wert(a, abgeltung)
        out.append({**w, **a})
        for s in summe:
            summe[s] += a[s]
    return out, summe


def pause_pflicht_min(brutto_min, jugendlich=False):
    """Mindestruhepause: Erwachsene 30 min bei mehr als 6 h (AZG § 11), Jugendliche 30 min bei mehr als 4,5 h (KJBG § 15)."""
    grenze = 270 if jugendlich else 360
    return 30 if int(brutto_min or 0) > grenze else 0


def tag_pruefen(netto_min, jugendlich=False):
    """Hinweise/Verstöße zur Tagesarbeitszeit (Liste (stufe, text)); stufe: hinweis | verstoss."""
    out = []
    n = int(netto_min or 0)
    if jugendlich and n > JUGEND_TAG_MIN:
        out.append(("verstoss", "Jugendliche: mehr als 8 Stunden am Tag (KJBG § 11)"))
    if n > TAG_HOECHST_MIN:
        out.append(("verstoss", "mehr als 12 Stunden am Tag (AZG § 9)"))
    elif n > TAG_HINWEIS_MIN:
        out.append(("hinweis", "mehr als 10 Stunden am Tag – Überstunden (AZG § 7/§ 9)"))
    return out


def woche_pruefen(netto_woche_min, jugendlich=False):
    out = []
    n = int(netto_woche_min or 0)
    if jugendlich and n > JUGEND_WOCHE_MIN:
        out.append(("verstoss", "Jugendliche: mehr als 40 Stunden in der Woche (KJBG § 11)"))
    if n > WOCHE_HOECHST_MIN:
        out.append(("verstoss", "mehr als 60 Stunden in der Woche (AZG § 9)"))
    return out


def ruhezeit_verstoesse(intervalle, min_stunden=RUHEZEIT_STD):
    """intervalle: Liste (start datetime, ende datetime) einer Person. Ruhezeit zwischen Ende und nächstem
    Beginn < min_stunden (AZG § 12: 11 h; Jugendliche KJBG § 16: 12 h) → Liste dict {ende, beginn, stunden}."""
    sortiert = sorted((s, e) for s, e in intervalle if s and e)
    out = []
    for (s1, e1), (s2, e2) in zip(sortiert, sortiert[1:]):
        if s2.date() == e1.date() and s2 >= e1:
            continue  # gleicher Tag: Unterbrechung, keine tägliche Ruhezeit
        luecke = (s2 - e1).total_seconds() / 3600
        if 0 <= luecke < min_stunden:
            out.append({"ende": e1, "beginn": s2, "stunden": round(luecke, 2)})
    return out


def wochenruhe_ok(intervalle, woche_von, min_stunden=WOCHENRUHE_STD):
    """ARG § 3/§ 4: in der Kalenderwoche ab woche_von (Montag 00:00) gibt es eine ununterbrochene Ruhe von
    mindestens 36 h (Wochenend- oder Wochenruhe). Prüft die längste Lücke innerhalb der Woche."""
    beginn = datetime.combine(_datum(woche_von), datetime.min.time())
    ende = beginn + timedelta(days=7)
    belegt = sorted((max(s, beginn), min(e, ende)) for s, e in intervalle if e > beginn and s < ende)
    zeiger = beginn
    laengste = 0.0
    for s, e in belegt:
        laengste = max(laengste, (s - zeiger).total_seconds() / 3600)
        zeiger = max(zeiger, e)
    laengste = max(laengste, (ende - zeiger).total_seconds() / 3600)
    return laengste >= min_stunden, round(laengste, 2)


def zeitfenster_minuten(datum, kommen_min, gehen_min, freie_tage=None):
    """Brutto-Minuten einer Buchung in Fenstern für die Lohnvorbereitung (ohne Pausenzuordnung):
    samstag_ab_13, sonntag, feiertag (gesetzlich), nacht (22–6 Uhr)."""
    d = _datum(datum)
    k, g = int(kommen_min or 0), int(gehen_min or 0)
    out = {"samstag_ab_13": 0, "sonntag": 0, "feiertag": 0, "nacht": 0}
    if g <= k:
        return out
    dauer = g - k
    if (freie_tage or {}).get(d) == FREI_GESETZLICH:
        out["feiertag"] = dauer
    elif d.weekday() == 6:
        out["sonntag"] = dauer
    elif d.weekday() == 5:
        out["samstag_ab_13"] = max(0, g - max(k, 13 * 60))
    out["nacht"] = max(0, min(g, 6 * 60) - k) + max(0, g - max(k, 22 * 60))
    return out


def ist_jugendlich(geburtsdatum, stichtag):
    """Unter 18 Jahre am Stichtag (KJBG)."""
    if not geburtsdatum:
        return False
    g = _datum(geburtsdatum)
    s = _datum(stichtag)
    alter = s.year - g.year - ((s.month, s.day) < (g.month, g.day))
    return alter < 18
