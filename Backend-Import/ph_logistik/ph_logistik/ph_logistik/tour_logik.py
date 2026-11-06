"""Reine Tour-Logik ohne Frappe: Zeitfenster, ETA aus Reihenfolge/Dauer, Überschneidungen, Avis-Texte (de/en/fr/it), SMS-Kürzung.

Fahrzeiten werden nicht berechnet (kein Routendienst eingebunden) – je Stopp `fahrt_min` oder Standard aus den Einstellungen.
"""

import re
from datetime import datetime, timedelta

SMS_MAX = 306  # zwei verkettete SMS à 153 Zeichen (GSM-7)


def _minuten(t):
    """'08:30', '8:30:00', datetime.time oder timedelta → Minuten seit 0:00; None bei leer/ungültig."""
    if t in (None, ""):
        return None
    if isinstance(t, timedelta):
        return int(t.total_seconds() // 60)
    if hasattr(t, "hour") and hasattr(t, "minute"):
        return t.hour * 60 + t.minute
    m = re.match(r"^\s*(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*$", str(t))
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    if h > 23 or mi > 59:
        return None
    return h * 60 + mi


def hhmm(minuten):
    if minuten is None:
        return None
    minuten = int(minuten) % (24 * 60)
    return f"{minuten // 60:02d}:{minuten % 60:02d}"


def zeitfenster_ok(von, bis):
    """Zeitfenster gültig? Leer = ok (kein Fenster); nur eine Grenze = ok; von < bis Pflicht."""
    a, b = _minuten(von), _minuten(bis)
    if a is None or b is None:
        return True
    return a < b


def eta(start_zeit, stopps, fahrt_min_standard=30, dauer_min_standard=30):
    """Ankunftszeiten je Stopp in Reihenfolge.
    stopps: [{reihenfolge, fahrt_min?, dauer_min?, zeitfenster_von?, zeitfenster_bis?}]
    Wartezeit: kommt das Fahrzeug vor dem Fenster an, beginnt der Stopp mit dem Fenster.
    → [{reihenfolge, ankunft, beginn, ende, im_fenster, warte_min}] (Zeiten 'HH:MM')."""
    t = _minuten(start_zeit)
    if t is None:
        t = 8 * 60
    aus = []
    for s in sorted(stopps, key=lambda x: int(x.get("reihenfolge") or 0)):
        fahrt = int(s.get("fahrt_min") or fahrt_min_standard or 0)
        dauer = int(s.get("dauer_min") or dauer_min_standard or 0) + int(s.get("montage_min") or 0)
        ankunft = t + fahrt
        von, bis = _minuten(s.get("zeitfenster_von")), _minuten(s.get("zeitfenster_bis"))
        beginn = max(ankunft, von) if von is not None else ankunft
        warte = beginn - ankunft
        im_fenster = (von is None or beginn >= von) and (bis is None or beginn <= bis)
        ende = beginn + dauer
        aus.append({"reihenfolge": s.get("reihenfolge"), "ankunft": hhmm(ankunft), "beginn": hhmm(beginn), "ende": hhmm(ende), "im_fenster": im_fenster, "warte_min": warte})
        t = ende
    return aus


def konflikte(stopps, fahrt_min_standard=30, dauer_min_standard=30, start_zeit=None):
    """Reihenfolgen der Stopps, deren berechneter Beginn außerhalb des Zeitfensters liegt oder deren Fenster ungültig ist."""
    out = [s.get("reihenfolge") for s in stopps if not zeitfenster_ok(s.get("zeitfenster_von"), s.get("zeitfenster_bis"))]
    for e in eta(start_zeit, stopps, fahrt_min_standard, dauer_min_standard):
        if not e["im_fenster"] and e["reihenfolge"] not in out:
            out.append(e["reihenfolge"])
    return out


def ueberschneidungen(belegungen):
    """Doppelbelegung von Ressourcen (Fahrzeug/Fahrer) an einem Tag.
    belegungen: [{ref, ressource, datum, von, bis}] (Zeiten 'HH:MM'; fehlend = ganzer Tag) → [(ref_a, ref_b, ressource)]."""
    out = []
    norm = []
    for b in belegungen:
        if not b.get("ressource"):
            continue
        a = _minuten(b.get("von"))
        e = _minuten(b.get("bis"))
        norm.append((str(b.get("datum")), b["ressource"], 0 if a is None else a, 24 * 60 if e is None else e, b.get("ref")))
    norm.sort()
    for i, x in enumerate(norm):
        for y in norm[i + 1:]:
            if y[0] != x[0] or y[1] != x[1]:
                continue
            if y[2] < x[3] and x[2] < y[3] and x[4] != y[4]:
                out.append((x[4], y[4], x[1]))
    return out


AVIS = {
    "de": {
        "betreff": "Ihre Lieferung am {datum}",
        "anrede": "Guten Tag {name},",
        "text": "wir liefern {was} am {datum} voraussichtlich zwischen {von} und {bis} Uhr.",
        "fahrzeug": "Fahrzeug: {fahrzeug}.",
        "hinweis": "Bitte sorgen Sie für freien Zugang{zugang}. Bei Fragen erreichen Sie uns unter {telefon}.",
        "gruss": "Herzliche Grüße, Ihr Platzhirsch-Team",
        "sms": "Platzhirsch: Lieferung {datum} ca. {von}-{bis} Uhr{ref}. Rückfragen {telefon}",
        "montage": "die Montage",
        "lieferung": "Ihre Bestellung",
        "abholung": "die Abholung",
        "betreff_neu": "Neuer Termin für Ihre Lieferung: {datum}",
        "text_neu": "der Termin hat sich geändert: Wir kommen nun am {datum} voraussichtlich zwischen {von} und {bis} Uhr.",
        "sms_neu": "Platzhirsch: NEUER Termin {datum} ca. {von}-{bis} Uhr{ref}. Rückfragen {telefon}",
    },
    "en": {
        "betreff": "Your delivery on {datum}",
        "anrede": "Dear {name},",
        "text": "we will deliver {was} on {datum}, expected between {von} and {bis}.",
        "fahrzeug": "Vehicle: {fahrzeug}.",
        "hinweis": "Please ensure free access{zugang}. For questions call us at {telefon}.",
        "gruss": "Kind regards, your Platzhirsch team",
        "sms": "Platzhirsch: delivery {datum} approx. {von}-{bis}{ref}. Questions {telefon}",
        "montage": "the installation",
        "lieferung": "your order",
        "abholung": "the collection",
        "betreff_neu": "New date for your delivery: {datum}",
        "text_neu": "your appointment has changed: we will now come on {datum}, expected between {von} and {bis}.",
        "sms_neu": "Platzhirsch: NEW date {datum} approx. {von}-{bis}{ref}. Questions {telefon}",
    },
    "fr": {
        "betreff": "Votre livraison du {datum}",
        "anrede": "Bonjour {name},",
        "text": "nous livrerons {was} le {datum}, prévue entre {von} et {bis}.",
        "fahrzeug": "Véhicule : {fahrzeug}.",
        "hinweis": "Merci d'assurer un accès libre{zugang}. Pour toute question : {telefon}.",
        "gruss": "Cordialement, votre équipe Platzhirsch",
        "sms": "Platzhirsch : livraison {datum} env. {von}-{bis}{ref}. Questions {telefon}",
        "montage": "le montage",
        "lieferung": "votre commande",
        "abholung": "l'enlèvement",
        "betreff_neu": "Nouvelle date pour votre livraison : {datum}",
        "text_neu": "le rendez-vous a changé : nous viendrons le {datum}, prévu entre {von} et {bis}.",
        "sms_neu": "Platzhirsch : NOUVELLE date {datum} env. {von}-{bis}{ref}. Questions {telefon}",
    },
    "it": {
        "betreff": "La sua consegna del {datum}",
        "anrede": "Buongiorno {name},",
        "text": "consegneremo {was} il {datum}, previsto tra le {von} e le {bis}.",
        "fahrzeug": "Veicolo: {fahrzeug}.",
        "hinweis": "La preghiamo di garantire libero accesso{zugang}. Per domande: {telefon}.",
        "gruss": "Cordiali saluti, il team Platzhirsch",
        "sms": "Platzhirsch: consegna {datum} ca. {von}-{bis}{ref}. Domande {telefon}",
        "montage": "il montaggio",
        "lieferung": "il suo ordine",
        "abholung": "il ritiro",
        "betreff_neu": "Nuova data per la sua consegna: {datum}",
        "text_neu": "l'appuntamento è cambiato: verremo il {datum}, previsto tra le {von} e le {bis}.",
        "sms_neu": "Platzhirsch: NUOVA data {datum} ca. {von}-{bis}{ref}. Domande {telefon}",
    },
}


def avis_text(sprache, daten, aenderung=False):
    """Avis-Mail und -SMS. daten: {name, datum (Text), von, bis, art (Lieferung|Montage|Abholung|…), fahrzeug?, telefon?, zugang?, referenz?}
    Fehlendes Zeitfenster → ±1 h um die ETA (`eta`) bzw. „ganztags“. → {betreff, text, html, sms}"""
    t = AVIS.get((sprache or "de")[:2], AVIS["de"])
    von, bis = daten.get("von"), daten.get("bis")
    if not (von and bis) and daten.get("eta"):
        m = _minuten(daten["eta"])
        if m is not None:
            von, bis = hhmm(max(m - 60, 0)), hhmm(min(m + 60, 24 * 60 - 1))
    von = (von or "08:00")[:5]
    bis = (bis or "17:00")[:5]
    art = (daten.get("art") or "Lieferung").lower()
    was = t["montage"] if art == "montage" else t["abholung"] if art in ("abholung", "retoure") else t["lieferung"]
    werte = {
        "name": daten.get("name") or "",
        "datum": daten.get("datum") or "",
        "von": von,
        "bis": bis,
        "was": was,
        "fahrzeug": daten.get("fahrzeug") or "",
        "telefon": daten.get("telefon") or "",
        "zugang": f" ({daten['zugang']})" if daten.get("zugang") else "",
        "ref": f" ({daten['referenz']})" if daten.get("referenz") else "",
    }
    zeilen = [t["anrede"].format(**werte), t["text_neu" if aenderung else "text"].format(**werte)]
    if werte["fahrzeug"]:
        zeilen.append(t["fahrzeug"].format(**werte))
    zeilen.append(t["hinweis"].format(**werte))
    zeilen.append(t["gruss"])
    text = "\n\n".join(zeilen)
    html = "".join(f"<p>{_esc(z)}</p>" for z in zeilen)
    k = "_neu" if aenderung else ""
    return {"betreff": t["betreff" + k].format(**werte), "text": text, "html": html, "sms": sms_kuerzen(t["sms" + k].format(**werte))}


def _esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def sms_kuerzen(text, max_len=SMS_MAX):
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    return text if len(text) <= max_len else text[: max_len - 1].rstrip() + "…"


def telefon_normalisieren(tel, land="AT"):
    """Für SMS-Gateways: '+43…' ohne Leerzeichen. 0664… → +43664…; 0049… → +49…; None bei zu kurz."""
    if not tel:
        return None
    s = re.sub(r"[^\d+]", "", str(tel))
    if s.startswith("00"):
        s = "+" + s[2:]
    elif s.startswith("0"):
        vorwahl = {"AT": "+43", "DE": "+49", "CH": "+41", "IT": "+39", "FR": "+33", "LI": "+423"}.get((land or "AT").upper(), "+43")
        s = vorwahl + s[1:]
    elif not s.startswith("+"):
        s = "+" + s
    return s if len(re.sub(r"\D", "", s)) >= 8 else None


def datum_text(d, sprache="de"):
    """date/ISO → '05.11.2026' (de/it/fr) bzw. '2026-11-05' (en bleibt international lesbar als 05/11/2026)."""
    if not d:
        return ""
    if isinstance(d, str):
        try:
            d = datetime.strptime(d[:10], "%Y-%m-%d").date()
        except ValueError:
            return d
    return d.strftime("%d/%m/%Y") if (sprache or "de")[:2] == "en" else d.strftime("%d.%m.%Y")


def verschoben(alt, neu, alt_datum=None, neu_datum=None):
    """Hat sich der Kundentermin eines Stopps geändert (Tourdatum oder Zeitfenster)? alt/neu: Stopp-dicts."""
    if str(alt_datum or "")[:10] != str(neu_datum or "")[:10]:
        return True
    for k in ("zeitfenster_von", "zeitfenster_bis"):
        if _minuten(alt.get(k)) != _minuten(neu.get(k)):
            return True
    return False


# ── Liefertermin-Generator (mehrere Fahrzeuge, Montagezeit je Tour) ─────────

def _plz_region(plz, stellen=2):
    s = "".join(ch for ch in str(plz or "") if ch.isdigit())
    return s[:stellen] if s else None


def tour_belegung(stopps, fahrt_min_standard=30, dauer_min_standard=30):
    """Belegte Minuten einer Tour: je Stopp Fahrt + Abladen/Liefern (dauer_min) + Montage (montage_min)."""
    return sum(int(s.get("fahrt_min") or fahrt_min_standard or 0) + int(s.get("dauer_min") or dauer_min_standard or 0) + int(s.get("montage_min") or 0) for s in stopps)


def termine_vorschlagen(bedarf_min, ab, fahrzeuge, touren, feiertage=(), tageskapazitaet_min=480, arbeitsbeginn="07:30",
                        plz=None, monteure=1, gewicht_g=0, volumen_m3=0.0, anzahl=5, tage_max=30, samstag=False,
                        fahrt_min_standard=30, dauer_min_standard=30):
    """Terminvorschläge für eine Lieferung (+ Montage) über mehrere Fahrzeuge.

    bedarf_min   Liefer- + Montagezeit am Kunden (Wandzeit bei `monteure` Personen); Anfahrt kommt mit fahrt_min_standard dazu
    ab           frühestes Datum (date), z. B. „Ware komplett“
    fahrzeuge    [{name, zuladung_kg, ladevolumen_m3}] (nur aktive)
    touren       [{name, datum, fahrzeug, status, team_anzahl, gewicht_g, volumen_m3, stopps:[{plz, fahrt_min, dauer_min, montage_min}]}]
    feiertage    Menge von date (Feiertage/Betriebsruhe); Sonntag nie, Samstag nur mit samstag=True
    → [{datum, fahrzeug, tour (None = neue Tour), von, bis, rest_min, region_passt, grund}] – je Tag bestehende Tour
      derselben Region zuerst, dann bestehende Tour, dann neue Tour, bei Gleichstand mehr Restkapazität; höchstens `anzahl`.
    Regeln: Restkapazität ≥ Bedarf; Zuladung/Volumen inkl. bereits geladener Ware; Team einer bestehenden Tour ≥ monteure
    (ohne Angabe passend); laufende/abgeschlossene/abgebrochene Touren sind nicht planbar; je Fahrzeug und Tag eine Tour.
    """
    from datetime import timedelta

    bedarf = int(bedarf_min or 0) + int(fahrt_min_standard or 0)
    feiertage = set(feiertage or ())
    region = _plz_region(plz)
    beginn = _minuten(arbeitsbeginn)
    if beginn is None:
        beginn = 450
    aus = []
    tag = ab
    for _i in range(int(tage_max or 30) + 1):
        if tag.weekday() == 6 or (tag.weekday() == 5 and not samstag) or tag in feiertage:
            tag += timedelta(days=1)
            continue
        tages = []
        for fz in fahrzeuge:
            max_g = int(float(fz.get("zuladung_kg") or 0) * 1000)
            max_v = float(fz.get("ladevolumen_m3") or 0)
            eigene = [t for t in touren if t.get("fahrzeug") == fz.get("name") and str(t.get("datum"))[:10] == tag.isoformat()]
            planbar = [t for t in eigene if t.get("status") not in ("Abgeschlossen", "Abgebrochen", "Unterwegs")]
            kandidaten = planbar or ([] if eigene else [None])
            for t in kandidaten:
                stopps = (t or {}).get("stopps") or []
                belegt = tour_belegung(stopps, fahrt_min_standard, dauer_min_standard)
                rest = int(tageskapazitaet_min) - belegt
                if rest < bedarf:
                    continue
                if max_g and int((t or {}).get("gewicht_g") or 0) + int(gewicht_g or 0) > max_g:
                    continue
                if max_v and float((t or {}).get("volumen_m3") or 0) + float(volumen_m3 or 0) > max_v:
                    continue
                if t and t.get("team_anzahl") and int(t["team_anzahl"]) < int(monteure or 1):
                    continue
                passt = bool(region and any(_plz_region(s.get("plz")) == region for s in stopps))
                start = beginn + belegt
                tages.append({
                    "datum": tag, "fahrzeug": fz.get("name"), "tour": (t or {}).get("name"), "von": hhmm(start), "bis": hhmm(start + bedarf),
                    "rest_min": rest - bedarf, "region_passt": passt,
                    "grund": ("bestehende Tour, gleiche Region" if passt else "bestehende Tour") if t else "neue Tour",
                })
        tages.sort(key=lambda v: (not v["region_passt"], v["tour"] is None, -v["rest_min"]))
        aus.extend(tages)
        if len(aus) >= int(anzahl or 5):
            break
        tag += timedelta(days=1)
    return aus[: int(anzahl or 5)]
