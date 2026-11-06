"""Packtisch nach JTL (reine Logik, kein Frappe-Import).

Quelle: Marktresearch/digital/backoffice/33-referenz-jtl-packtisch.md Abschnitt 4 (Muss M1–M12, Soll S1–S6).
Bausteine: Vorgang aus dem ersten Scan (M1), Mengen vor dem Scan + Bestätigung (M3), Positionen ohne Barcode (M4),
Inhalt je Paket + Gewichtsvorschlag + Plausibilität (M6/M7/S4), Packmittel-Abbuchung (S3), Packhinweise (S1),
Dokumentregeln (S5/M11), Prüfung „Verpacken“ (M8), „Versendet“ erst mit Tracking aller Pakete (M9),
Zurückstellen/Teillieferung aus gescannten Positionen (M10/M11), Einartikel-Schnellversand (S6).
"""

from .packtisch_logik import normalisiere_code

ZURUECKSTELLEN_GRUENDE = ("Fehlt", "Beschaedigt", "Falscher Artikel", "Kunde Rueckfrage", "Sonstiges")
DOKUMENTE = ("Lieferschein", "Packliste", "Rechnung", "Proforma-Rechnung", "Retourenschein", "Pflegehinweis", "Produktpass", "Sonstiges")
STANDARD_DRUCKFORMAT = {"Lieferschein": "PH Lieferschein Standard", "Packliste": "PH Lieferschein Packliste", "Retourenschein": "PH Sendung Retourenschein"}
EU = {"AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"}


def _offen(p):
    return max(int(p.get("menge") or 0) - int(p.get("menge_gepackt") or 0), 0)


def _laender(text):
    """'AT, DE' / 'AT\\nDE' / 'EU' → Menge; leer → leere Menge (= alle)."""
    out = set()
    for teil in str(text or "").replace(";", ",").replace("\n", ",").split(","):
        t = teil.strip().upper()
        if t == "EU":
            out |= EU
        elif t == "DRITTLAND":
            out.add("!EU")
        elif t:
            out.add(t)
    return out


def _land_passt(land, menge):
    if not menge:
        return True
    land = str(land or "").upper()
    if land in menge:
        return True
    return "!EU" in menge and bool(land) and land not in EU


# ── M1 Erster Scan erkennt den Vorgang ────────────────────────────────────

def vorgang_aus_scan(code, vorgaenge):
    """vorgaenge: [{name, bestellung, auftrag, kommission, datum, zurueckgestellt, positionen:[{ean, seriennummer, slug, menge, menge_gepackt}]}]
    (nur offene Lieferscheine). Reihenfolge: Lieferscheinnummer → Bestellnummer → Auftrag → Kommissions-Etikett
    („KOM:<kommission>“ oder Kommission direkt) → Artikel-EAN/Seriennummer/Slug: Lieferschein mit den **wenigsten offenen
    Positionen** zuerst (JTL „wenigste Positionen“), bei Gleichstand ältester. Zurückgestellte nur bei direkter Nummer.
    → {lieferschein, art, kandidaten} oder {lieferschein: None, art: None, kandidaten: []}."""
    c = normalisiere_code(code)
    leer = {"lieferschein": None, "art": None, "kandidaten": []}
    if not c:
        return leer
    if c.startswith("kom:"):
        c_kom = c[4:]
    else:
        c_kom = c
    for feld, art in (("name", "lieferschein"), ("bestellung", "bestellung"), ("auftrag", "auftrag")):
        treffer = [v for v in vorgaenge if normalisiere_code(v.get(feld)) == c]
        if art != "lieferschein":
            treffer = [v for v in treffer if not v.get("zurueckgestellt")] or treffer
        if treffer:
            treffer.sort(key=lambda v: (_offene_positionen(v) == 0, str(v.get("datum") or ""), v.get("name")))
            return {"lieferschein": treffer[0]["name"], "art": art, "kandidaten": [t["name"] for t in treffer]}
    kom = [v for v in vorgaenge if v.get("kommission") and normalisiere_code(v.get("kommission")) == c_kom and not v.get("zurueckgestellt")]
    if kom:
        kom.sort(key=lambda v: (_offene_positionen(v), str(v.get("datum") or ""), v.get("name")))
        return {"lieferschein": kom[0]["name"], "art": "kommission", "kandidaten": [k["name"] for k in kom]}
    artikel = []
    for v in vorgaenge:
        if v.get("zurueckgestellt"):
            continue
        for p in v.get("positionen") or []:
            if _offen(p) and c in {normalisiere_code(p.get(f)) for f in ("ean", "seriennummer", "slug") if p.get(f)}:
                artikel.append(v)
                break
    if artikel:
        artikel.sort(key=lambda v: (_offene_positionen(v), str(v.get("datum") or ""), v.get("name")))
        return {"lieferschein": artikel[0]["name"], "art": "artikel", "kandidaten": [a["name"] for a in artikel]}
    return leer


def _offene_positionen(v):
    return sum(1 for p in v.get("positionen") or [] if _offen(p))


# ── M3 Menge vor dem Scan, Bestätigung bei Menge > 1 ─────────────────────

def menge_pruefen(position, anzahl=1, mengen_bestaetigen=True, bestaetigt=False):
    """→ {ok, anzahl, bestaetigen, fehler}. anzahl > offen → Fehler „zu_viel“; Menge > 1 (vorgewählt oder Zeile mit Menge > 1)
    braucht mit Schalter `mengen_bestaetigen` eine Bestätigung (JTL „Mengen > 1 bestätigen“)."""
    try:
        n = 1 if anzahl is None or anzahl == "" else int(anzahl)
    except (TypeError, ValueError):
        return {"ok": False, "anzahl": 0, "bestaetigen": False, "fehler": "ungueltig"}
    offen = _offen(position)
    if n <= 0:
        return {"ok": False, "anzahl": n, "bestaetigen": False, "fehler": "ungueltig"}
    if offen <= 0:
        return {"ok": False, "anzahl": n, "bestaetigen": False, "fehler": "vollstaendig"}
    if n > offen:
        return {"ok": False, "anzahl": n, "bestaetigen": False, "fehler": "zu_viel", "offen": offen}
    if mengen_bestaetigen and n > 1 and not bestaetigt:
        return {"ok": False, "anzahl": n, "bestaetigen": True, "fehler": None, "offen": offen}
    return {"ok": True, "anzahl": n, "bestaetigen": False, "fehler": None, "offen": offen}


# ── M4 Positionen ohne Barcode ────────────────────────────────────────────

def ohne_barcode(position):
    """Keine EAN und keine Seriennummer → Handbestätigung (Möbel-/Herstellerware ohne EAN, Dienstleistung)."""
    return not (str(position.get("ean") or "").strip() or str(position.get("seriennummer") or "").strip())


# ── M6/M7/S4 Pakete: Inhalt, Gewichtsvorschlag, Plausibilität ────────────

def inhalt_pruefen(pakete, positionen):
    """pakete: [{paket_nr, inhalt_map {position: menge}}]. Je Position: Summe in Paketen ≤ menge_gepackt.
    → {fehler: [(position, zugeordnet, gepackt)], ohne_paket: {position: rest}}"""
    summe = {}
    for pk in pakete:
        for pos, m in (pk.get("inhalt_map") or {}).items():
            summe[pos] = summe.get(pos, 0) + int(m or 0)
    fehler, rest = [], {}
    for p in positionen:
        g = int(p.get("menge_gepackt") or 0)
        z = summe.get(p.get("name"), 0)
        if z > g:
            fehler.append((p.get("name"), z, g))
        elif g - z > 0:
            rest[p.get("name")] = g - z
    bekannte = {p.get("name") for p in positionen}
    for pos in summe:
        if pos not in bekannte:
            fehler.append((pos, summe[pos], 0))
    return {"fehler": fehler, "ohne_paket": rest}


def inhalt_text(inhalt_map, positionen):
    namen = {p.get("name"): p.get("beschreibung") or p.get("produkt") or p.get("name") for p in positionen}
    return ", ".join(f"{int(m)}× {namen.get(pos, pos)}" for pos, m in (inhalt_map or {}).items() if int(m or 0) > 0)[:140]


def gewicht_vorschlag(inhalt_map, positionen, artikelgewicht_g, profil=None):
    """Summe Artikelgewicht × Menge + Packmittel (Profil-Tara, sonst Profilgewicht ohne Artikel = 0).
    artikelgewicht_g: {position: g je Stück} (aus PH Produkt.gewicht_g). Unbekannte Artikelgewichte → None in `fehlend`.
    → (gramm, fehlende_positionen)"""
    profil = profil or {}
    tara = int(profil.get("tara_g") or 0)
    summe, fehlend = 0, []
    for pos, m in (inhalt_map or {}).items():
        g = artikelgewicht_g.get(pos)
        if not g:
            fehlend.append(pos)
            continue
        summe += int(g) * int(m or 0)
    if not inhalt_map and profil.get("gewicht_g"):
        return int(profil["gewicht_g"]), fehlend
    return summe + tara, fehlend


def gewicht_plausibel(manuell_g, vorschlag_g, toleranz_promille=250, toleranz_min_g=300, max_g=None):
    """Manuelles Gewicht (Pflicht vor Label, keine Waage) gegen Vorschlag: Abweichung ≤ max(Vorschlag × Toleranz, Mindesttoleranz);
    über Profilgrenze (max_g) oder ≤ 0 → nicht plausibel. Ohne Vorschlag nur Grenzen. → (ok, grund)"""
    m = int(manuell_g or 0)
    if m <= 0:
        return False, "gewicht_fehlt"
    if max_g and m > int(max_g):
        return False, "ueber_profilgrenze"
    if not vorschlag_g:
        return True, None
    v = int(vorschlag_g)
    tol = max(v * int(toleranz_promille or 0) // 1000, int(toleranz_min_g or 0))
    if abs(m - v) > tol:
        return False, "abweichung"
    return True, None


# ── S3 Packmittel als Lagerartikel ────────────────────────────────────────

def packmittel_buchungen(pakete, profile_by_key):
    """Je Paket mit Profil, dessen `packmittel_produkt` gesetzt ist, ein Stück Abgang. → [{produkt, menge, paket_nr, profil}]
    zusammengefasst je Produkt bleibt Aufgabe des Aufrufers (Idempotenzschlüssel je Paket)."""
    out = []
    for pk in pakete:
        pr = profile_by_key.get(pk.get("paketprofil")) or {}
        if pr.get("packmittel_produkt") and not pk.get("packmittel_gebucht"):
            out.append({"produkt": pr["packmittel_produkt"], "menge": 1, "paket_nr": pk.get("paket_nr"), "profil": pr.get("key") or pk.get("paketprofil")})
    return out


# ── S1 Packhinweise nach Regeln ───────────────────────────────────────────

def packhinweise(regeln, kontext):
    """regeln: [{bezeichnung, aktiv, prioritaet, kategorie, marke, laender, wert_ab_cent, wert_bis_cent, lieferart, nur_zerbrechlich,
    hinweis, bestaetigen}]; kontext: {kategorien set, marken set, land, warenwert_cent, lieferart, zerbrechlich}.
    Alle gesetzten Bedingungen müssen passen. → [{bezeichnung, hinweis, bestaetigen}] nach Priorität (hoch zuerst)."""
    kat = {str(k).lower() for k in kontext.get("kategorien") or () if k}
    mar = {str(m).lower() for m in kontext.get("marken") or () if m}
    wert = int(kontext.get("warenwert_cent") or 0)
    treffer = []
    for r in regeln:
        if not int(r.get("aktiv", 1) or 0):
            continue
        if r.get("kategorie") and str(r["kategorie"]).lower() not in kat:
            continue
        if r.get("marke") and str(r["marke"]).lower() not in mar:
            continue
        if not _land_passt(kontext.get("land"), _laender(r.get("laender"))):
            continue
        if r.get("wert_ab_cent") and wert < int(r["wert_ab_cent"]):
            continue
        if r.get("wert_bis_cent") and wert > int(r["wert_bis_cent"]):
            continue
        if r.get("lieferart") and r["lieferart"] != kontext.get("lieferart"):
            continue
        if int(r.get("nur_zerbrechlich") or 0) and not kontext.get("zerbrechlich"):
            continue
        treffer.append(r)
    treffer.sort(key=lambda r: (-int(r.get("prioritaet") or 0), str(r.get("bezeichnung") or "")))
    return [{"bezeichnung": r.get("bezeichnung"), "hinweis": r.get("hinweis"), "bestaetigen": int(bool(int(r.get("bestaetigen") or 0)))} for r in treffer]


# ── S5/M11 Dokumentregeln ─────────────────────────────────────────────────

def teillieferung_art(teillieferung, erste, rest_offen):
    """→ 'Komplettlieferung' | 'Erste Teillieferung' | 'Teillieferung' | 'Letzte Teillieferung'."""
    if not teillieferung:
        return "Komplettlieferung"
    if erste and rest_offen:
        return "Erste Teillieferung"
    if not rest_offen:
        return "Letzte Teillieferung"
    return "Teillieferung"


def _ja_nein(regelwert, ist):
    if not regelwert or regelwert == "egal":
        return True
    return (regelwert == "ja") == bool(ist)


def dokumente(regeln, kontext):
    """regeln: [{bezeichnung, aktiv, dokument, print_format, aktion Beilegen|Nicht beilegen, anzahl, laender, laender_ausser,
    wert_ab_cent, wert_bis_cent, lieferart, teillieferung Alle|Komplettlieferung|Teillieferung|Erste Teillieferung|Letzte Teillieferung,
    abweichende_lieferadresse egal|ja|nein, geschenk egal|ja|nein}]; kontext: {land, warenwert_cent, lieferart, teillieferung_art,
    abweichende_lieferadresse, geschenk}. Ohne passende Regel: Lieferschein (Standardformat). „Nicht beilegen“ schlägt „Beilegen“.
    „Teillieferung“ passt zu jeder Teillieferung (erste/mittlere/letzte). → [{dokument, print_format, anzahl, regel}]"""
    tl = kontext.get("teillieferung_art") or "Komplettlieferung"
    wert = int(kontext.get("warenwert_cent") or 0)
    beilegen, sperre = {}, set()
    for r in regeln:
        if not int(r.get("aktiv", 1) or 0) or not r.get("dokument"):
            continue
        if not _land_passt(kontext.get("land"), _laender(r.get("laender"))):
            continue
        aus = _laender(r.get("laender_ausser"))
        if aus and _land_passt(kontext.get("land"), aus):
            continue
        if r.get("wert_ab_cent") and wert < int(r["wert_ab_cent"]):
            continue
        if r.get("wert_bis_cent") and wert > int(r["wert_bis_cent"]):
            continue
        if r.get("lieferart") and r["lieferart"] != kontext.get("lieferart"):
            continue
        rt = r.get("teillieferung") or "Alle"
        if rt != "Alle" and not (rt == tl or (rt == "Teillieferung" and tl != "Komplettlieferung")):
            continue
        if not _ja_nein(r.get("abweichende_lieferadresse"), kontext.get("abweichende_lieferadresse")):
            continue
        if not _ja_nein(r.get("geschenk"), kontext.get("geschenk")):
            continue
        if (r.get("aktion") or "Beilegen") == "Nicht beilegen":
            sperre.add(r["dokument"])
            continue
        alt = beilegen.get(r["dokument"])
        anz = max(int(r.get("anzahl") or 1), 1)
        if not alt or anz > alt["anzahl"]:
            beilegen[r["dokument"]] = {"dokument": r["dokument"], "print_format": r.get("print_format") or STANDARD_DRUCKFORMAT.get(r["dokument"]), "anzahl": anz, "regel": r.get("bezeichnung")}
    if not beilegen and "Lieferschein" not in sperre:
        beilegen["Lieferschein"] = {"dokument": "Lieferschein", "print_format": STANDARD_DRUCKFORMAT["Lieferschein"], "anzahl": 1, "regel": None}
    return [v for k, v in sorted(beilegen.items(), key=lambda kv: DOKUMENTE.index(kv[0]) if kv[0] in DOKUMENTE else 99) if k not in sperre]


# ── M8 Abschluss „Verpacken“ ──────────────────────────────────────────────

def verpacken_pruefen(positionen, pakete, lieferart, gewicht_pflicht=True, hinweise_offen=0, zurueckgestellt=False, teillieferung=False, gewicht_ergebnisse=None):
    """→ Liste der Sperrgründe (leer = darf verpacken). teillieferung=True: es reicht, wenn mindestens eine Position gepackt ist
    (der Rest geht über teillieferung_aufteilen). gewicht_ergebnisse: {paket_nr: (ok, grund)}."""
    gruende = []
    if zurueckgestellt:
        gruende.append("zurueckgestellt")
    gepackt = sum(int(p.get("menge_gepackt") or 0) for p in positionen)
    if teillieferung:
        if gepackt <= 0:
            gruende.append("nichts_gepackt")
    elif not positionen or any(_offen(p) for p in positionen):
        gruende.append("nicht_alles_gepackt")
    if lieferart in ("Versand", "Spedition"):
        if not pakete:
            gruende.append("keine_pakete")
        elif gewicht_pflicht:
            for pk in pakete:
                ok, _g = (gewicht_ergebnisse or {}).get(pk.get("paket_nr"), (int(pk.get("gewicht_g") or 0) > 0, None))
                if not ok:
                    gruende.append(f"gewicht_paket_{pk.get('paket_nr')}")
    if hinweise_offen:
        gruende.append("packhinweise_bestaetigen")
    return gruende


# ── M9 „Versendet“ erst mit Tracking für alle Pakete ─────────────────────

def alle_pakete_mit_tracking(pakete, tracking_je_sendung):
    """pakete: [{paket_nr, sendung}]; tracking_je_sendung: {sendung: tracking_nr}. → (ok, pakete_ohne_tracking)"""
    ohne = [pk.get("paket_nr") for pk in pakete if not (pk.get("sendung") and tracking_je_sendung.get(pk.get("sendung")))]
    return (bool(pakete) and not ohne), ohne


# ── M10/M11 Teillieferung nur aus gescannten Positionen ──────────────────

def teillieferung_aufteilen(positionen):
    """→ (bleibt {position: menge_gepackt}, rest [{position, menge}]) – nur gescannte/gepackte Mengen bleiben im Lieferschein,
    der Rest geht in einen neuen Entwurf. Ohne gepackte Menge → ValueError."""
    bleibt, rest = {}, []
    for p in positionen:
        g = int(p.get("menge_gepackt") or 0)
        m = int(p.get("menge") or 0)
        if g > 0:
            bleibt[p.get("name")] = g
        if m - g > 0:
            rest.append({"position": p.get("name"), "menge": m - g})
    if not bleibt:
        raise ValueError("Keine Position gescannt – Teillieferung nicht möglich.")
    return bleibt, rest


# ── S6 Einartikel-Schnellversand ──────────────────────────────────────────

def schnellversand_moeglich(vorgang, profile_by_key, aktiv=True):
    """Shop-Paket mit genau einer Position und Menge 1, Lieferart Versand, festes Paketprofil (nicht gesperrt), nicht zurückgestellt.
    → (ok, grund)"""
    if not aktiv:
        return False, "aus"
    if vorgang.get("lieferart") != "Versand":
        return False, "lieferart"
    if vorgang.get("zurueckgestellt"):
        return False, "zurueckgestellt"
    pos = vorgang.get("positionen") or []
    if len(pos) != 1 or int(pos[0].get("menge") or 0) != 1:
        return False, "mehrere_artikel"
    pr = profile_by_key.get(pos[0].get("paketprofil"))
    if not pr:
        return False, "kein_profil"
    if pr.get("versand_gesperrt"):
        return False, "gesperrt"
    return True, None
