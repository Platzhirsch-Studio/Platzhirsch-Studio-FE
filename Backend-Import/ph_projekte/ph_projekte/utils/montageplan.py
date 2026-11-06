"""Montage-Terminplanung: Ressourcen (Monteure, Fahrzeug), Kollisionen, Abhängigkeiten der Fremdgewerke.

Reine Logik ohne Frappe (Tests: tests/test_montageplan.py). Aufrufer: PH Montageauftrag.validate,
ph_projekte.api.montage_kollisionen / montage_plantafel, PH Fremdgewerk.validate.
"""

from datetime import date, datetime, time, timedelta

STANDARD_DAUER_H = 8


def _dt(v):
    if v in (None, ""):
        return None
    if isinstance(v, datetime):
        return v
    if isinstance(v, date):
        return datetime.combine(v, time(0, 0))
    s = str(v).strip().replace("T", " ")
    for fmt in ("%Y-%m-%d %H:%M:%S.%f", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(s[:26], fmt)
        except ValueError:
            continue
    return None


def zeitraum(start, ende=None, stunden=None, tagesende_bei_datum=True):
    """(start, ende) als datetime. Ohne Ende: start + stunden (Standard 8 h). Reines Datum als Ende = Tagesende."""
    s = _dt(start)
    if not s:
        return None, None
    e = _dt(ende)
    if e and tagesende_bei_datum and isinstance(ende, date) and not isinstance(ende, datetime):
        e = e + timedelta(days=1)
    if not e:
        e = s + timedelta(hours=float(stunden or STANDARD_DAUER_H))
    return s, e


def ueberlappt(a_start, a_ende, b_start, b_ende):
    """Halboffene Intervalle [start, ende): Ende 12:00 und Beginn 12:00 kollidieren nicht."""
    if not (a_start and a_ende and b_start and b_ende):
        return False
    return a_start < b_ende and b_start < a_ende


def _menge(v):
    if not v:
        return set()
    if isinstance(v, str):
        return {x.strip() for x in v.replace(";", ",").split(",") if x.strip()}
    return {x for x in v if x}


def kollisionen(neu, belegungen):
    """neu: {start, ende, monteure, fahrzeug, name?}; belegungen: [{art, name, titel, start, ende, monteure, fahrzeug}]
    → [{art, name, titel, ressource, typ (monteur|fahrzeug), start, ende}] (eigener Datensatz ausgenommen)."""
    s, e = zeitraum(neu.get("start"), neu.get("ende"), neu.get("stunden"))
    if not s:
        return []
    monteure = _menge(neu.get("monteure"))
    fahrzeug = (neu.get("fahrzeug") or "").strip().upper()
    out = []
    for b in belegungen:
        if neu.get("name") and b.get("name") == neu.get("name") and b.get("art", "Montageauftrag") == neu.get("art", "Montageauftrag"):
            continue
        bs, be = zeitraum(b.get("start"), b.get("ende"), b.get("stunden"))
        if not ueberlappt(s, e, bs, be):
            continue
        basis = {"art": b.get("art") or "Montageauftrag", "name": b.get("name"), "titel": b.get("titel") or b.get("name"), "start": bs, "ende": be}
        for m in sorted(monteure & _menge(b.get("monteure"))):
            out.append({**basis, "ressource": m, "typ": "monteur"})
        bf = (b.get("fahrzeug") or "").strip().upper()
        if fahrzeug and bf and bf == fahrzeug:
            out.append({**basis, "ressource": fahrzeug, "typ": "fahrzeug"})
    return out


def kollisionstext(k):
    was = "Monteur" if k["typ"] == "monteur" else "Fahrzeug"
    zeit = f"{k['start']:%d.%m. %H:%M}–{k['ende']:%H:%M}" if k.get("start") and k.get("ende") else ""
    return f"{was} {k['ressource']} ist bereits eingeplant: {k['art']} {k['titel']} {zeit}".strip()


def tagesauslastung(belegungen, tagesstunden=8.0):
    """{datum: {ressource: stunden}} – für die Plantafel (Ressource = Monteur)."""
    out = {}
    for b in belegungen:
        s, e = zeitraum(b.get("start"), b.get("ende"), b.get("stunden"))
        if not s:
            continue
        tag = s.date()
        stunden = min((e - s).total_seconds() / 3600, 24.0)
        for m in _menge(b.get("monteure")) or {"(ohne Team)"}:
            out.setdefault(str(tag), {}).setdefault(m, 0.0)
            out[str(tag)][m] = round(out[str(tag)][m] + stunden, 2)
    return out


def ueberbucht(auslastung, tagesstunden=8.0):
    return [(tag, m, h) for tag, ms in sorted(auslastung.items()) for m, h in sorted(ms.items()) if h > float(tagesstunden or 8)]


def abhaengigkeit_konflikt(vorgaenger_status, vorgaenger_bis, eigen_von):
    """Fremdgewerk B hängt von A ab: Warnung, wenn A nicht erledigt ist und A später endet, als B beginnt."""
    if not vorgaenger_status or vorgaenger_status in ("Erledigt", "Abgesagt"):
        return None
    vb, ev = _dt(vorgaenger_bis), _dt(eigen_von)
    if vb and ev and vb > ev:
        return "Vorgänger-Gewerk endet erst nach dem geplanten Beginn."
    if not vb and ev:
        return "Vorgänger-Gewerk hat noch keinen Termin."
    return None


def termine_spanne(termine):
    """Kindtabelle Termine → (frühester von, spätester bis) der nicht abgesagten Termine."""
    vs = [_dt(t.get("von")) for t in termine if t.get("status") != "abgesagt" and t.get("von")]
    bs = [_dt(t.get("bis") or t.get("von")) for t in termine if t.get("status") != "abgesagt" and (t.get("bis") or t.get("von"))]
    vs, bs = [v for v in vs if v], [b for b in bs if b]
    return (min(vs) if vs else None, max(bs) if bs else None)


# ── Montagezeit aus Positionen (Richtwerte je Kategorie, S10) ───────────────

def _klein(v):
    return (v or "").strip().lower()


def montagezeit(positionen, richtwerte, standard_min_je_stueck=0, grundzeit_min=0):
    """positionen: [{kategorie, bezeichnung, menge, montage_art, lieferstatus}];
    richtwerte: [{kategorie, minuten_je_stueck}] – Treffer über Kategorie, sonst Kategorie-Wort in der Bezeichnung.
    → {minuten, stunden, details:[{bezeichnung, kategorie, menge, minuten}], ohne_richtwert:[bezeichnung]}"""
    werte = [(_klein(r.get("kategorie")), int(r.get("minuten_je_stueck") or 0)) for r in richtwerte if r.get("kategorie")]
    nach_laenge = sorted(werte, key=lambda x: -len(x[0]))
    details, ohne = [], []
    summe = int(grundzeit_min or 0)
    for p in positionen:
        if (p.get("montage_art") or "") in ("ohne", "Fremdgewerk") or (p.get("lieferstatus") or "") == "storniert":
            continue
        menge = max(int(p.get("menge") or 1), 1)
        kat, bez = _klein(p.get("kategorie")), _klein(p.get("bezeichnung"))
        treffer = next((m for k, m in werte if k == kat), None) if kat else None
        if treffer is None:
            treffer = next((m for k, m in nach_laenge if k and (k in bez or k in kat)), None)
        if treffer is None:
            ohne.append(p.get("bezeichnung") or "")
            treffer = int(standard_min_je_stueck or 0)
        minuten = treffer * menge
        summe += minuten
        details.append({"bezeichnung": p.get("bezeichnung"), "kategorie": p.get("kategorie"), "menge": menge, "minuten": minuten})
    return {"minuten": summe, "stunden": round(summe / 60, 2), "details": details, "ohne_richtwert": ohne}


TEXTE_VERSCHIEBUNG = {
    "de": "Guten Tag,\n\nIhr Montagetermin für „{projekt}“ wurde verschoben: {alt} → {neu}.\nBitte geben Sie uns kurz Bescheid, falls der neue Termin nicht passt.\n\nIhr Platzhirsch-Team",
    "en": "Hello,\n\nyour installation appointment for “{projekt}” has been moved: {alt} → {neu}.\nPlease let us know if the new date does not suit you.\n\nYour Platzhirsch team",
}


def kundentext_verschiebung(projekt_titel, alt, neu, sprache="de"):
    a, n = _dt(alt), _dt(neu)
    f = "%d/%m/%Y %H:%M" if sprache == "en" else "%d.%m.%Y %H:%M"
    vorlage = TEXTE_VERSCHIEBUNG.get(sprache) or TEXTE_VERSCHIEBUNG["de"]
    return vorlage.format(projekt=projekt_titel, alt=a.strftime(f) if a else "–", neu=n.strftime(f) if n else "–")


def verschiebung_relevant(alt, neu, toleranz_min=30):
    """Kunde nur informieren, wenn sich der Beginn um mehr als `toleranz_min` Minuten ändert."""
    a, n = _dt(alt), _dt(neu)
    if not a or not n:
        return False
    return abs((n - a).total_seconds()) > int(toleranz_min) * 60


# ── Qualifikationen (Nr. 21) ────────────────────────────────────────────────

QUALIFIKATIONEN = ("Kueche", "Bad", "Elektro-Anschluss", "Wasser-Anschluss", "Gas-Anschluss", "Naturstein", "Polster", "Outdoor", "Moebelmontage", "Leuchten", "Yacht")


def qualifikationen_je_monteur(zeilen):
    """[{user, qualifikation}] → {user: {qualifikationen}}"""
    out = {}
    for z in zeilen:
        if z.get("user") and z.get("qualifikation"):
            out.setdefault(z["user"], set()).add(z["qualifikation"])
    return out


def fehlende_qualifikationen(benoetigt, team, quali_map):
    """Jede benötigte Qualifikation muss mindestens ein Teammitglied haben. → sortierte Liste der fehlenden."""
    vorhanden = set()
    for u in team or []:
        vorhanden |= quali_map.get(u, set())
    return sorted({q for q in benoetigt or [] if q} - vorhanden)


def geeignete_monteure(benoetigt, quali_map):
    """Monteure, die allein alle benötigten Qualifikationen haben (Vorschlag in der Plantafel)."""
    b = {q for q in benoetigt or [] if q}
    return sorted(u for u, qs in quali_map.items() if b <= qs)


def qualifikationen_vorschlagen(projektart=None, anschluss_arten=(), kategorien=()):
    """Benötigte Qualifikationen aus Projektart, Aufmaß-Anschlüssen und Positionskategorien."""
    q = set({"Kueche": {"Kueche"}, "Bad": {"Bad"}, "Outdoor": {"Outdoor"}, "Yacht": {"Yacht"}}.get((projektart or "").strip(), set()))
    for a in anschluss_arten or []:
        if a in ("Wasser kalt", "Wasser warm", "Abfluss"):
            q.add("Wasser-Anschluss")
        elif a in ("Strom 230 V", "Starkstrom 400 V"):
            q.add("Elektro-Anschluss")
        elif a == "Gas":
            q.add("Gas-Anschluss")
    for k in kategorien or []:
        k = _klein(k)
        if any(w in k for w in ("stein", "granit", "marmor", "keramik")):
            q.add("Naturstein")
        if any(w in k for w in ("sofa", "polster", "sessel")):
            q.add("Polster")
        if "leuchte" in k or "lampe" in k:
            q.add("Leuchten")
    return sorted(q)


# ── E-Geräte aus der Stückliste (Montageprotokoll S11) ──────────────────────

GERAETE_WOERTER = ("geschirrsp", "backofen", "herd", "kochfeld", "induktion", "dunstabzug", "kühl", "kuehl", "gefrier", "mikrowelle", "dampfgar", "kaffeevoll", "weinkl", "wärmeschub", "waermeschub", "spülmaschine", "waschmaschine", "trockner", "gerät", "geraet")


def ist_geraet(pos):
    text = _klein(pos.get("kategorie")) + " " + _klein(pos.get("bezeichnung"))
    return any(w in text for w in GERAETE_WOERTER)
