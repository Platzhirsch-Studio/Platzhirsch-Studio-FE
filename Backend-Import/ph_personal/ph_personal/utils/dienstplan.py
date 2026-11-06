"""Dienstplan (Showroom-Öffnungszeiten, Planung, Montage) – reine Logik, ohne Frappe.

Eine Schicht ist dict {datum (date), mitarbeiter, beginn_min, ende_min, pause_min, bereich}; Minuten ab 0:00,
ende > beginn (keine Schicht über Mitternacht – Showroom; Nachtmontage als zwei Einträge).
Mindestbesetzung je Wochentag: dict {wochentag 0–6, von_min, bis_min, anzahl, bereich ('' = alle)}.
Abwesenheiten: dict mitarbeiter → Liste (von date, bis date, art_oeffentlich).
Ruhezeit 11 h zwischen Schichten (AZG § 12) über ph_personal.utils.arbeitszeit.ruhezeit_verstoesse.
"""

from datetime import datetime, time, timedelta

from ph_personal.utils.arbeitszeit import ruhezeit_verstoesse, tag_pruefen, wochenruhe_ok


def uhrzeit_min(wert):
    """'09:30' / '09:30:00' / time / timedelta → Minuten."""
    if wert is None or wert == "":
        return None
    if isinstance(wert, timedelta):
        return int(wert.total_seconds() // 60)
    if isinstance(wert, time):
        return wert.hour * 60 + wert.minute
    teile = str(wert).split(":")
    return int(teile[0]) * 60 + int(teile[1] if len(teile) > 1 else 0)


def min_text(m):
    return f"{int(m) // 60:02d}:{int(m) % 60:02d}"


def schicht_netto(s):
    return max(0, int(s["ende_min"]) - int(s["beginn_min"]) - int(s.get("pause_min") or 0))


def _intervall(s):
    start = datetime.combine(s["datum"], time()) + timedelta(minutes=int(s["beginn_min"]))
    ende = datetime.combine(s["datum"], time()) + timedelta(minutes=int(s["ende_min"]))
    return start, ende


def unterbesetzung(schichten, anforderungen, tage):
    """Lücken der Mindestbesetzung: Liste dict {datum, von_min, bis_min, ist, soll, bereich}.
    tage: Liste der Plantage (date)."""
    out = []
    for tag in tage:
        for a in anforderungen:
            if int(a["wochentag"]) != tag.weekday():
                continue
            bereich = a.get("bereich") or ""
            relevant = [s for s in schichten if s["datum"] == tag and (not bereich or s.get("bereich") == bereich)]
            punkte = {int(a["von_min"]), int(a["bis_min"])}
            for s in relevant:
                for p in (int(s["beginn_min"]), int(s["ende_min"])):
                    if int(a["von_min"]) < p < int(a["bis_min"]):
                        punkte.add(p)
            grenzen = sorted(punkte)
            luecke = None
            for v, b in zip(grenzen, grenzen[1:]):
                ist = sum(1 for s in relevant if int(s["beginn_min"]) <= v and int(s["ende_min"]) >= b)
                if ist < int(a["anzahl"]):
                    if luecke and luecke["bis_min"] == v and luecke["ist"] == ist:
                        luecke["bis_min"] = b
                    else:
                        luecke = {"datum": tag, "von_min": v, "bis_min": b, "ist": ist, "soll": int(a["anzahl"]), "bereich": bereich}
                        out.append(luecke)
                else:
                    luecke = None
    return out


def konflikte(schichten, abwesenheiten=None, ruhezeit_std=11, jugendliche=()):
    """Konflikte je Person: Abwesenheit am Schichttag, Doppelschicht (Überschneidung), Ruhezeit < 11 h,
    Tageshöchstgrenze, fehlende Wochenruhe (36 h). → Liste dict {art, mitarbeiter, datum, text}."""
    out = []
    je_person = {}
    for s in schichten:
        je_person.setdefault(s["mitarbeiter"], []).append(s)
    for ma, liste in je_person.items():
        liste.sort(key=lambda s: (s["datum"], int(s["beginn_min"])))
        for s in liste:
            for von, bis, art in (abwesenheiten or {}).get(ma, ()):
                if von <= s["datum"] <= bis:
                    out.append({"art": "abwesend", "mitarbeiter": ma, "datum": s["datum"], "text": f"{art or 'abwesend'} am Schichttag"})
            for stufe, text in tag_pruefen(schicht_netto(s), jugendlich=ma in jugendliche):
                if stufe == "verstoss":
                    out.append({"art": "hoechstgrenze", "mitarbeiter": ma, "datum": s["datum"], "text": text})
        for a, b in zip(liste, liste[1:]):
            if a["datum"] == b["datum"] and int(b["beginn_min"]) < int(a["ende_min"]):
                out.append({"art": "doppelt", "mitarbeiter": ma, "datum": a["datum"], "text": f"Schichten überschneiden sich ({min_text(a['beginn_min'])}–{min_text(a['ende_min'])} / {min_text(b['beginn_min'])}–{min_text(b['ende_min'])})"})
        for v in ruhezeit_verstoesse([_intervall(s) for s in liste], ruhezeit_std):
            out.append({"art": "ruhezeit", "mitarbeiter": ma, "datum": v["beginn"].date(), "text": f"Ruhezeit nur {v['stunden']} h (mindestens {ruhezeit_std} h, AZG § 12)"})
        wochen = {}
        for s in liste:
            montag = s["datum"] - timedelta(days=s["datum"].weekday())
            wochen.setdefault(montag, []).append(_intervall(s))
        for montag, iv in wochen.items():
            ok, std = wochenruhe_ok(iv, montag)
            if not ok:
                out.append({"art": "wochenruhe", "mitarbeiter": ma, "datum": montag, "text": f"keine 36 h Wochenruhe (längste Ruhe {std} h, ARG § 3/§ 4)"})
    return out


def wochenstunden(schichten):
    """Netto-Minuten je Person."""
    out = {}
    for s in schichten:
        out[s["mitarbeiter"]] = out.get(s["mitarbeiter"], 0) + schicht_netto(s)
    return out


def vorwoche_kopieren(schichten, tage_versatz=7):
    """Schichten um n Tage verschieben (Vorlage aus Vorwoche)."""
    return [{**s, "datum": s["datum"] + timedelta(days=tage_versatz)} for s in schichten]


def kalenderwoche(datum):
    """(jahr, kw, montag, sonntag) nach ISO 8601."""
    j, kw, _ = datum.isocalendar()
    montag = datum - timedelta(days=datum.weekday())
    return j, kw, montag, montag + timedelta(days=6)
