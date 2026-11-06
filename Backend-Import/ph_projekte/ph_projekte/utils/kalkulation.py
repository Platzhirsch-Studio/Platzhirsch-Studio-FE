"""Projekt-Kalkulation Soll/Ist (Einkauf, Verkauf, Montagestunden). Reine Logik (tests/test_kalkulation.py).

Soll  = Planwerte im Projekt: Positionen (Menge × EK/VK) + freigegebene Nachträge + geplante Montagestunden × Kostensatz.
Ist   = Belege: Herstellerbestellungen (AB-EK, sonst Bestell-EK; ohne Storno), Rechnungen (ph_faktura, falls installiert),
        gebuchte Projektzeiten (Montage/Fahrt) × Kostensatz.
Deckungsbeitrag = VK − EK − Montagekosten; Marge in Promille vom VK (1000 = 100 %).
"""


def _int(v):
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def _g(z, k):
    return z.get(k) if isinstance(z, dict) else getattr(z, k, None)


def marge_promille(db_cent, vk_cent):
    vk = _int(vk_cent)
    return int(round(_int(db_cent) * 1000 / vk)) if vk else None


def kosten_stunden(stunden, kostensatz_cent):
    return int(round(float(stunden or 0) * _int(kostensatz_cent)))


def soll(positionen, nachtraege=(), montagestunden=0.0, kostensatz_cent=0):
    pos = [p for p in positionen if (_g(p, "lieferstatus") or "") != "storniert"]
    ek = sum(_int(_g(p, "ek_cent")) * max(_int(_g(p, "menge")), 1) for p in pos)
    vk = sum(_int(_g(p, "preis_cent")) * max(_int(_g(p, "menge")), 1) for p in pos)
    # Freigegebene Nachträge: „neu“ steht schon als Position im Projekt, „entfall“ ist storniert → nur Änderungsbeträge zählen
    vk += sum(_int(_g(n, "summe_aenderung_cent")) for n in nachtraege)
    montage = kosten_stunden(montagestunden, kostensatz_cent)
    db = vk - ek - montage
    return {"ek_cent": ek, "vk_cent": vk, "montage_h": round(float(montagestunden or 0), 2), "montage_cent": montage, "db_cent": db, "marge_promille": marge_promille(db, vk)}


def ist(bestellpositionen, rechnungen=(), montagestunden=0.0, kostensatz_cent=0):
    """bestellpositionen: [{menge, ab_menge, ek_cent, ab_ek_cent, status_hb}] · rechnungen: [{netto_cent|brutto_cent, art}]"""
    ek = 0
    for b in bestellpositionen:
        if (_g(b, "status_hb") or "") == "Storniert":
            continue
        menge = _int(_g(b, "ab_menge")) or _int(_g(b, "menge"))
        preis = _int(_g(b, "ab_ek_cent")) or _int(_g(b, "ek_cent"))
        ek += menge * preis
    # Anzahlungsrechnungen werden in der Schlussrechnung verrechnet → nicht doppelt zählen
    vk = sum(_int(_g(r, "betrag_cent")) for r in rechnungen if (_g(r, "art") or "") not in ("Anzahlung", "Anzahlungsrechnung", "Storno"))
    montage = kosten_stunden(montagestunden, kostensatz_cent)
    db = vk - ek - montage
    return {"ek_cent": ek, "vk_cent": vk, "montage_h": round(float(montagestunden or 0), 2), "montage_cent": montage, "db_cent": db, "marge_promille": marge_promille(db, vk)}


def vergleich(s, i):
    """Soll/Ist-Abweichung je Kennzahl (Ist − Soll)."""
    return {k: (i[k] - s[k]) if isinstance(s.get(k), (int, float)) and isinstance(i.get(k), (int, float)) else None for k in ("ek_cent", "vk_cent", "montage_h", "montage_cent", "db_cent")}


def kalkulation(positionen, nachtraege=(), bestellpositionen=(), rechnungen=(), stunden_soll=0.0, stunden_ist=0.0, kostensatz_cent=0):
    s = soll(positionen, nachtraege, stunden_soll, kostensatz_cent)
    i = ist(bestellpositionen, rechnungen, stunden_ist, kostensatz_cent)
    return {"soll": s, "ist": i, "abweichung": vergleich(s, i), "kostensatz_cent": _int(kostensatz_cent)}


# ════════════════════════════════════════════════════════════════════════════════════════════════
# Kalkulation v2 – Projektnachkalkulation (Inhaber-Wunsch 04.11.2026). Reine Logik ohne Frappe,
# Tests: tests/test_kalkulation_v2.py · Daten: ph_projekte/ph_projekte/nachkalkulation.py
#
# Kostenquellen Ist   = zugeordnete Eingangsrechnungen (maßgeblich), Lagerentnahmen zum Einstandswert,
#                       Projektzeiten × Kostensatz (zum Leistungsdatum gültig), Kassa-Barausgaben mit
#                       Projektnummer, Servicefall-Kosten (nach Übergabe = Nachlauf) − Regress-Gutschriften.
# Obligo              = bestellt/beauftragt, noch nicht berechnet: je Bezug (Herstellerbestellung,
#                       Speditionsauftrag, Fremdgewerk) max(Bestellwert − bereits zugeordnete ER, 0).
# Stufen              DB1 = Erlös − Wareneinsatz · DB2 = DB1 − Montage/Fremdleistung/Material
#                     DB3 = DB2 − Planung/Beratung/Projektleitung − Nachlauf · DB4 = DB3 − Gemeinkosten (nur wenn an)
# Alle Parameter (Sätze, Ziel-DB, Schwellen, Gemeinkosten) kommen aus PH Projekte Einstellungen.
# ════════════════════════════════════════════════════════════════════════════════════════════════

import datetime as _dt  # noqa: E402

STUFEN = ("DB1", "DB2", "DB3")
STUFE_LABEL = {"DB1": "Wareneinsatz", "DB2": "Montage, Fremdleistung, Material", "DB3": "Planung, Beratung, Nachlauf"}
AMPEL_RANG = {"": 0, "gruen": 1, "gelb": 2, "rot": 3}
ZUSCHLAG_ARTEN = ("Aus", "Prozent auf Wareneinsatz", "Prozent auf Gesamtkosten", "Prozent auf Erloes", "Betrag je Projektstunde")
# Projektzeit-Tätigkeit → Kostensatz-Tätigkeit (Rückfall), damit „Koordination“ den Satz „Projektleitung“ bekommt
TAETIGKEIT_ALIAS = {"Koordination": "Projektleitung", "Buero": "Projektleitung", "Aufmaß": "Aufmass"}
# Projektzeit-Tätigkeit → Kostenart (PH Kostenart, install.py)
TAETIGKEIT_KOSTENART = {"Montage": "Montage eigen", "Fahrt": "Montage eigen", "Service": "Montage eigen"}
TAETIGKEIT_KOSTENART_STANDARD = "Planung intern"
# Fertigstellungsgrad: Grundwert je Phase (Prozent) und Gewichte der Komponenten
PHASE_GRAD = {"Anfrage": 0, "Planung": 5, "Angebot": 5, "Auftrag": 10, "Bestellung": 20, "Lieferung": 40, "Montage": 60, "Uebergabe": 95, "Abgeschlossen": 100, "Abgebrochen": 0}
GEWICHT_FERTIG = {"phase": 20, "lieferung": 40, "montage": 40}
# Spezifität bei Gültigkeitszeilen: Mitarbeiter schlägt Rolle schlägt allgemein
GEWICHT_SCHLUESSEL = {"mitarbeiter": 100, "rolle": 10, "projektart": 5, "taetigkeit": 1}


def _f(v):
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def _datum(d):
    return str(d or "")[:10]


def prozent(teil_cent, basis_cent, stellen=1):
    """Anteil in Prozent (eine Nachkommastelle) oder None ohne Basis."""
    b = _int(basis_cent)
    return round(_int(teil_cent) * 100.0 / b, stellen) if b else None


# ── Gültigkeit (Kostensätze, Ziel-DB, Gemeinkosten) ─────────────────────────────────────────────

def gueltige_zeile(zeilen, datum=None, **schluessel):
    """Zeile, die am `datum` gilt: gueltig_ab ≤ datum, alle gesetzten Schlüsselfelder passen (leer/„Alle“ = gilt
    für alle). Spezifisch vor allgemein (GEWICHT_SCHLUESSEL), bei gleicher Spezifität das jüngste gueltig_ab.
    Ein Schlüsselwert darf eine Liste sein (z. B. alle Rollen eines Benutzers)."""
    tag = _datum(datum) or "9999-12-31"
    beste = None
    for z in zeilen or ():
        if _int(_g(z, "inaktiv")):
            continue
        ab = _datum(_g(z, "gueltig_ab")) or "0000-00-00"
        if ab > tag:
            continue
        spez, passt = 0, True
        for k, wert in schluessel.items():
            v = _g(z, k)
            if v in (None, "", "Alle"):
                continue
            if isinstance(wert, (list, tuple, set, frozenset)):
                passt = v in wert
            else:
                passt = v == wert
            if not passt:
                break
            spez += GEWICHT_SCHLUESSEL.get(k, 1)
        if passt and (beste is None or (spez, ab) > beste[:2]):
            beste = (spez, ab, z)
    return beste[2] if beste else None


def kostensatz(saetze, taetigkeit, datum=None, mitarbeiter=None, rollen=()):
    """Kostensatz (Cent je Stunde) für eine Tätigkeit zum Leistungsdatum; spezifisch (Mitarbeiter > Rolle) vor
    allgemein; Rückfall über TAETIGKEIT_ALIAS, dann Tätigkeit „Alle“. → (satz_cent, zeile|None)"""
    for t in (taetigkeit, TAETIGKEIT_ALIAS.get(taetigkeit)):
        if not t:
            continue
        kandidaten = [z for z in saetze or () if (_g(z, "taetigkeit") or "") == t]
        z = gueltige_zeile(kandidaten, datum, mitarbeiter=mitarbeiter or "", rolle=tuple(rollen or ()))
        if z:
            return _int(_g(z, "satz_cent")), z
    z = gueltige_zeile([z for z in saetze or () if (_g(z, "taetigkeit") or "") in ("", "Alle")], datum, mitarbeiter=mitarbeiter or "", rolle=tuple(rollen or ()))
    return (_int(_g(z, "satz_cent")), z) if z else (0, None)


def zeit_kostenart(taetigkeit, datum=None, uebergabe_am=None):
    if taetigkeit == "Service" and uebergabe_am and _datum(datum) > _datum(uebergabe_am):
        return "Nachlauf"
    return TAETIGKEIT_KOSTENART.get(taetigkeit or "", TAETIGKEIT_KOSTENART_STANDARD)


def zeiten_bewerten(zeiten, saetze, rollen_je_user=None, uebergabe_am=None):
    """zeiten [{name, taetigkeit, datum, dauer_min, user}] → Ist-Zeilen mit Kostenart, Satz und Betrag.
    Jede Zeit mit dem Satz, der an ihrem Datum gültig war (Satzänderungen wirken nicht rückwirkend)."""
    rollen_je_user = rollen_je_user or {}
    out = []
    for z in zeiten or ():
        user = _g(z, "user")
        satz, zeile = kostensatz(saetze, _g(z, "taetigkeit"), _g(z, "datum"), user, rollen_je_user.get(user, ()))
        stunden = _int(_g(z, "dauer_min")) / 60.0
        out.append({
            "kostenart": zeit_kostenart(_g(z, "taetigkeit"), _g(z, "datum"), uebergabe_am),
            "betrag_cent": kosten_stunden(stunden, satz), "datum": _datum(_g(z, "datum")), "stunden": round(stunden, 2),
            "taetigkeit": _g(z, "taetigkeit"), "satz_cent": satz, "ohne_satz": zeile is None,
            "quelle_doctype": "PH Projektzeit", "quelle_name": _g(z, "name"),
            "text": f"{_g(z, 'taetigkeit') or ''} {round(stunden, 2)} h × {satz / 100:.2f} €",
        })
    return out


def gemeinkosten(regel, wareneinsatz_cent=0, gesamtkosten_cent=0, erloes_cent=0, stunden=0.0):
    """Gemeinkostenzuschlag nach Art (ZUSCHLAG_ARTEN). regel {art, prozent, betrag_je_stunde_cent} → Cent oder None (aus)."""
    if not regel:
        return None
    art = _g(regel, "art") or "Aus"
    p = _f(_g(regel, "prozent"))
    if art == "Prozent auf Wareneinsatz":
        return int(round(_int(wareneinsatz_cent) * p / 100))
    if art == "Prozent auf Gesamtkosten":
        return int(round(_int(gesamtkosten_cent) * p / 100))
    if art == "Prozent auf Erloes":
        return int(round(_f(erloes_cent) * p / 100))
    if art == "Betrag je Projektstunde":
        return int(round(_f(stunden) * _int(_g(regel, "betrag_je_stunde_cent"))))
    return None


def einstellungen_pruefen(kostensaetze=(), ziel_db=(), gemeinkosten_regeln=(), projektarten=None):
    """Validierung der Kalkulationseinstellungen → Liste von Fehlertexten (leer = ok).
    Keine überlappenden Gültigkeiten = kein zweiter Eintrag mit gleichem Schlüssel und gleichem gueltig_ab
    (jede Zeile gilt bis zum nächsten gueltig_ab desselben Schlüssels). Prozente 0–100, gelb ≤ rot."""
    fehler = []

    def doppelt(zeilen, felder, name):
        gesehen = set()
        for i, z in enumerate(zeilen or (), 1):
            k = tuple((_g(z, f) or "") for f in felder) + (_datum(_g(z, "gueltig_ab")),)
            if k in gesehen:
                fehler.append(f"{name} Zeile {i}: gleicher Schlüssel und gleiches „gültig ab“ ({', '.join(x for x in k if x)}) doppelt")
            gesehen.add(k)

    def bereich(wert, name, i, hoch=100.0):
        if wert in (None, ""):
            return
        if not 0 <= _f(wert) <= hoch:
            fehler.append(f"{name} Zeile {i}: {wert} liegt nicht zwischen 0 und {hoch:g}")

    for i, z in enumerate(kostensaetze or (), 1):
        if not _g(z, "taetigkeit"):
            fehler.append(f"Kostensatz Zeile {i}: Tätigkeit fehlt")
        if _int(_g(z, "satz_cent")) < 0:
            fehler.append(f"Kostensatz Zeile {i}: Satz negativ")
        if _g(z, "mitarbeiter") and _g(z, "rolle"):
            fehler.append(f"Kostensatz Zeile {i}: entweder Rolle oder Mitarbeiter angeben")
    doppelt(kostensaetze, ("taetigkeit", "rolle", "mitarbeiter"), "Kostensatz")
    for i, z in enumerate(ziel_db or (), 1):
        if projektarten is not None and (_g(z, "projektart") or "Alle") not in set(projektarten) | {"Alle"}:
            fehler.append(f"Ziel-DB Zeile {i}: unbekannte Projektart {_g(z, 'projektart')}")
        for f in ("ziel_db1", "ziel_db2", "ziel_db3", "ampel_gelb_unter", "ampel_rot_unter"):
            bereich(_g(z, f), "Ziel-DB", i)
        for f in ("budget_gelb", "budget_rot"):
            bereich(_g(z, f), "Ziel-DB", i, 200.0)
        gu, ru = _g(z, "ampel_gelb_unter"), _g(z, "ampel_rot_unter")
        if gu not in (None, "") and ru not in (None, "") and _f(gu) > _f(ru):
            fehler.append(f"Ziel-DB Zeile {i}: Gelb-Schwelle größer als Rot-Schwelle")
        if _f(_g(z, "budget_gelb")) and _f(_g(z, "budget_rot")) and _f(_g(z, "budget_gelb")) > _f(_g(z, "budget_rot")):
            fehler.append(f"Ziel-DB Zeile {i}: Budget-Gelb größer als Budget-Rot")
    doppelt(ziel_db, ("projektart",), "Ziel-DB")
    for i, z in enumerate(gemeinkosten_regeln or (), 1):
        if (_g(z, "art") or "Aus") not in ZUSCHLAG_ARTEN:
            fehler.append(f"Gemeinkosten Zeile {i}: unbekannte Art {_g(z, 'art')}")
        if projektarten is not None and (_g(z, "projektart") or "Alle") not in set(projektarten) | {"Alle"}:
            fehler.append(f"Gemeinkosten Zeile {i}: unbekannte Projektart {_g(z, 'projektart')}")
        bereich(_g(z, "prozent"), "Gemeinkosten", i)
        if _int(_g(z, "betrag_je_stunde_cent")) < 0:
            fehler.append(f"Gemeinkosten Zeile {i}: Betrag negativ")
    doppelt(gemeinkosten_regeln, ("projektart",), "Gemeinkosten")
    return fehler


def parameter(einst, projektart, datum=None, projekt_abweichung=None):
    """Wirksame Parameter für ein Projekt: Ziel-DB/Schwellen/Gemeinkosten aus den Einstellungen (zum Datum,
    Projektart vor „Alle“), darüber die Projekt-Abweichung (Leitung, begründet). einst {ziel_db, gemeinkosten,
    budget_gelb, budget_rot, ampel_gelb_unter, ampel_rot_unter}."""
    einst = einst or {}
    z = gueltige_zeile(einst.get("ziel_db"), datum, projektart=projektart) or {}
    g = gueltige_zeile(einst.get("gemeinkosten"), datum, projektart=projektart) or {}

    def wahl(*werte, standard=None):
        for w in werte:
            if w not in (None, ""):
                return _f(w)
        return standard

    p = {
        "ziel": {k: wahl(_g(z, k)) for k in ("ziel_db1", "ziel_db2", "ziel_db3")},
        "ampel_gelb_unter": wahl(_g(z, "ampel_gelb_unter"), einst.get("ampel_gelb_unter"), standard=0.0),
        "ampel_rot_unter": wahl(_g(z, "ampel_rot_unter"), einst.get("ampel_rot_unter"), standard=5.0),
        "budget_gelb": wahl(_g(z, "budget_gelb"), einst.get("budget_gelb"), standard=90.0),
        "budget_rot": wahl(_g(z, "budget_rot"), einst.get("budget_rot"), standard=100.0),
        "gemeinkosten": {"art": _g(g, "art") or "Aus", "prozent": _f(_g(g, "prozent")), "betrag_je_stunde_cent": _int(_g(g, "betrag_je_stunde_cent"))},
        "abweichung": False,
    }
    a = projekt_abweichung or {}
    if a.get("aktiv"):
        p["abweichung"] = True
        for k in ("ziel_db1", "ziel_db2", "ziel_db3"):
            if a.get(k) not in (None, ""):
                p["ziel"][k] = _f(a[k])
        if a.get("gemeinkosten_art"):
            p["gemeinkosten"] = {"art": a["gemeinkosten_art"], "prozent": _f(a.get("gemeinkosten_prozent")), "betrag_je_stunde_cent": _int(a.get("gemeinkosten_je_h_cent"))}
    return p


# ── Erlös, Obligo, Stufen, Prognose, Ampel, Fertigstellung ──────────────────────────────────────

def erloes(auftrag_netto_cent=0, nachtraege_cent=0, rechnungen=(), gutschriften_netto_cent=0, skonto_gewaehrt_cent=0, kassa_netto_cent=0):
    """Erlös netto. Auftragswert = AB netto + freigegebene Nachträge (Differenz netto). Gestellt = Rechnungen netto
    ohne Anzahlungsrechnungen (werden in Teil-/Schlussrechnung verrechnet → keine Doppelzählung), ohne Entwurf/Storno,
    − Gutschriften − gewährte Skonti + Kassa-Verkäufe ohne Rechnung. Maßgeblich: gestellt, sobald eine Schluss-
    rechnung (oder eine Rechnung ohne AB) vorliegt, sonst Auftragswert − Skonti."""
    gestellt, schluss = 0, False
    for r in rechnungen or ():
        art, status = _g(r, "art") or "Rechnung", _g(r, "status") or ""
        if art in ("Anzahlungsrechnung", "Anzahlung") or status in ("Entwurf", "Storniert"):
            continue
        gestellt += _int(_g(r, "netto_cent"))
        schluss = schluss or art in ("Schlussrechnung", "Barverkauf") or (art == "Rechnung" and not _int(auftrag_netto_cent))
    gestellt += _int(kassa_netto_cent) - _int(gutschriften_netto_cent) - _int(skonto_gewaehrt_cent)
    auftragswert = _int(auftrag_netto_cent) + _int(nachtraege_cent)
    if schluss:
        wert, basis = gestellt, "gestellt"
    else:
        wert, basis = auftragswert - _int(skonto_gewaehrt_cent) + _int(kassa_netto_cent), "auftrag"
    return {"erloes_cent": wert, "basis": basis, "auftragswert_cent": auftragswert, "gestellt_cent": gestellt,
            "gutschriften_cent": _int(gutschriften_netto_cent), "skonto_cent": _int(skonto_gewaehrt_cent), "kassa_cent": _int(kassa_netto_cent)}


def obligo(bestellungen, verrechnet=None):
    """bestellungen [{bezug_doctype, bezug_name, kostenart, wert_cent, status, vollstaendig_berechnet, datum}],
    verrechnet {(bezug_doctype, bezug_name): Cent aus zugeordneten Eingangsrechnungen}. Keine Doppelzählung:
    Obligo = max(Bestellwert − verrechnet, 0); 0 bei Storno/Entwurf/Abgesagt oder wenn eine ER die Bestellung als
    vollständig berechnet markiert."""
    verrechnet = verrechnet or {}
    out = []
    for b in bestellungen or ():
        key = (_g(b, "bezug_doctype"), _g(b, "bezug_name"))
        wert, schon = _int(_g(b, "wert_cent")), _int(verrechnet.get(key))
        tot = (_g(b, "status") or "") in ("Storniert", "Entwurf", "Abgesagt") or _int(_g(b, "vollstaendig_berechnet"))
        out.append({**(b if isinstance(b, dict) else {}), "bezug_doctype": key[0], "bezug_name": key[1], "kostenart": _g(b, "kostenart"),
                    "wert_cent": wert, "verrechnet_cent": schon, "betrag_cent": 0 if tot else max(wert - schon, 0), "datum": _datum(_g(b, "datum"))})
    return out


def summe_je(zeilen, feld="kostenart"):
    s = {}
    for z in zeilen or ():
        k = _g(z, feld) or "Sonstiges"
        s[k] = s.get(k, 0) + _int(_g(z, "betrag_cent"))
    return s


def stufen(erloes_cent, kosten_je_kostenart, stufe_je_kostenart, gemeinkosten_cent=None):
    """DB1..DB3 (und DB4 nach Gemeinkosten, nur wenn gemeinkosten_cent nicht None) absolut und in % vom Erlös.
    Unbekannte Kostenarten zählen zu DB2."""
    e = _int(erloes_cent)
    kosten = {s: 0 for s in STUFEN}
    for ka, c in (kosten_je_kostenart or {}).items():
        st = (stufe_je_kostenart or {}).get(ka) or "DB2"
        kosten[st if st in kosten else "DB2"] += _int(c)
    out, db = {"erloes_cent": e, "kosten_je_stufe": kosten}, e
    for s in STUFEN:
        db -= kosten[s]
        out[s.lower() + "_cent"] = db
        out[s.lower() + "_prozent"] = prozent(db, e)
    if gemeinkosten_cent is not None:
        out["gemeinkosten_cent"] = _int(gemeinkosten_cent)
        out["db4_cent"] = db - _int(gemeinkosten_cent)
        out["db4_prozent"] = prozent(out["db4_cent"], e)
    out["kosten_gesamt_cent"] = sum(kosten.values()) + (_int(gemeinkosten_cent) if gemeinkosten_cent is not None else 0)
    return out


def prognose_zeile(budget_cent, ist_cent, obligo_cent, manuell_cent=None):
    """Cost-to-Complete je Kostenart: Rest = max(Budget − Ist − Obligo, 0), oder manuell (Leitung, mit Begründung).
    Prognose gesamt = Ist + Obligo + Rest; Abweichung = Prognose − Budget (positiv = Überschreitung)."""
    b, i, o = _int(budget_cent), _int(ist_cent), _int(obligo_cent)
    manuell = manuell_cent not in (None, "")
    rest = max(_int(manuell_cent), 0) if manuell else max(b - i - o, 0)
    gesamt = i + o + rest
    return {"budget_cent": b, "ist_cent": i, "obligo_cent": o, "rest_cent": rest, "rest_manuell": manuell,
            "prognose_cent": gesamt, "abweichung_cent": gesamt - b, "verbrauch_prozent": prozent(i + o, b), "prognose_prozent": prozent(gesamt, b)}


def ampel_budget(budget_cent, ist_cent, obligo_cent, prognose_cent=None, gelb=90.0, rot=100.0):
    """Ampel je Kostenart: gelb, sobald Ist + Obligo `gelb` % des Budgets erreichen; rot, sobald Ist + Obligo oder
    die Prognose `rot` % überschreiten (100 % = Budget genau ausgeschöpft ist noch nicht rot, sonst würde jede exakt
    bestellte Ware rot). Ohne Budget: Kosten > 0 → gelb (ungeplant), sonst keine Ampel."""
    b = _int(budget_cent)
    verbrauch = _int(ist_cent) + _int(obligo_cent)
    if b <= 0:
        return "gelb" if max(verbrauch, _int(prognose_cent)) > 0 else ""
    if max(verbrauch, _int(prognose_cent)) * 100.0 / b > _f(rot):
        return "rot"
    return "gelb" if verbrauch * 100.0 / b >= _f(gelb) else "gruen"


def ampel_db(db_prozent, ziel_prozent, gelb_unter=0.0, rot_unter=5.0):
    """Ampel DB: ohne Ziel keine Ampel. Abstand = Ziel − DB (Prozentpunkte); rot ab `rot_unter` Punkten unter Ziel,
    gelb ab `gelb_unter` (0 = jede Unterschreitung)."""
    if ziel_prozent in (None, "") or db_prozent is None:
        return ""
    abstand = _f(ziel_prozent) - _f(db_prozent)
    if abstand <= 0:
        return "gruen"
    if abstand >= _f(rot_unter):
        return "rot"
    return "gelb" if abstand >= _f(gelb_unter) else "gruen"


def ampel_gesamt(ampeln):
    beste = ""
    for a in ampeln or ():
        if AMPEL_RANG.get(a or "", 0) > AMPEL_RANG[beste]:
            beste = a
    return beste


def fertigstellungsgrad(phase, positionen=(), montage_h_ist=0.0, montage_h_plan=0.0):
    """Fertigstellungsgrad 0–100 (Methode, dokumentiert in 51-…md „Projektnachkalkulation“):
    gewichteter Mittelwert aus Phase (Grundwert PHASE_GRAD, Gewicht 20), Lieferquote der Positionen (gelieferte
    Menge/Menge ohne Stornos, Gewicht 40) und Montagequote (Montagestunden Ist/Plan; ohne Plan montierte Menge/
    Menge, Gewicht 40). Fehlende Komponenten fallen aus der Gewichtung. Nie unter dem Phasen-Grundwert;
    Übergabe ≥ 95, Abgeschlossen = 100."""
    basis = PHASE_GRAD.get(phase or "", 0)
    if phase == "Abgeschlossen":
        return {"grad": 100, "komponenten": {"phase": 100}, "methode": "Phase Abgeschlossen"}
    pos = [p for p in positionen or () if (_g(p, "lieferstatus") or "") != "storniert"]
    menge = sum(max(_int(_g(p, "menge")), 1) for p in pos)
    komp = {"phase": basis}
    if menge:
        komp["lieferung"] = round(sum(min(_int(_g(p, "menge_geliefert")), max(_int(_g(p, "menge")), 1)) for p in pos) * 100.0 / menge, 1)
    if _f(montage_h_plan) > 0:
        komp["montage"] = round(min(_f(montage_h_ist) / _f(montage_h_plan), 1.0) * 100.0, 1)
    elif menge and any(_int(_g(p, "menge_montiert")) for p in pos):
        komp["montage"] = round(sum(min(_int(_g(p, "menge_montiert")), max(_int(_g(p, "menge")), 1)) for p in pos) * 100.0 / menge, 1)
    gew = sum(GEWICHT_FERTIG[k] for k in komp)
    grad = int(round(sum(komp[k] * GEWICHT_FERTIG[k] for k in komp) / gew)) if gew else basis
    grad = max(grad, basis)
    if phase == "Uebergabe":
        grad = max(grad, 95)
    return {"grad": min(grad, 100), "komponenten": komp, "methode": "Phase 20 % · Lieferquote 40 % · Montage Ist/Plan 40 %"}


def woche(datum):
    try:
        j, w, _t = _dt.date.fromisoformat(_datum(datum)).isocalendar()
    except ValueError:
        return ""
    return f"{j}-W{w:02d}"


def zeitreihe(ist_zeilen, obligo_zeilen=()):
    """Je Kalenderwoche: Ist und neues Obligo der Woche plus kumuliertes Ist (aufsteigend)."""
    w = {}
    for feld, zeilen in (("ist_cent", ist_zeilen), ("obligo_cent", obligo_zeilen)):
        for z in zeilen or ():
            k = woche(_g(z, "datum"))
            if k and _int(_g(z, "betrag_cent")):
                w.setdefault(k, {"woche": k, "ist_cent": 0, "obligo_cent": 0})[feld] += _int(_g(z, "betrag_cent"))
    kum, out = 0, []
    for k in sorted(w):
        kum += w[k]["ist_cent"]
        out.append({**w[k], "ist_kumuliert_cent": kum})
    return out


def kalkulation_v2(e):
    """Gesamtstruktur der Projektnachkalkulation aus vorbereiteten Daten `e` (nachkalkulation.daten_sammeln):
    e = {erloes: {erloes()-Argumente}, kostenarten: [{name, bezeichnung, db_stufe, reihenfolge}],
         ist: [Zeile], obligo: [Zeile, betrag_cent = offen], budget: [{kostenart, budget_auftrag_cent,
         budget_aktuell_cent, prognose_rest_manuell_cent, prognose_begruendung}], fortschritt: {phase, positionen,
         montage_h_ist, montage_h_plan}, parameter: parameter(), stunden_ist, stunden_prognose, hinweise}
    Zeile = {kostenart, betrag_cent, datum, quelle_doctype, quelle_name, text}."""
    par = e.get("parameter") or parameter({}, None)
    er = erloes(**(e.get("erloes") or {}))
    kas = sorted(e.get("kostenarten") or [], key=lambda k: (_int(_g(k, "reihenfolge")), _g(k, "name") or ""))
    meta = {_g(k, "name"): k for k in kas}
    stufe_je = {n: _g(k, "db_stufe") or "DB2" for n, k in meta.items()}
    ist_je, obl_je = summe_je(e.get("ist")), summe_je(e.get("obligo"))
    budget_je = {_g(b, "kostenart"): b for b in e.get("budget") or ()}
    namen = list(meta) + sorted((set(ist_je) | set(obl_je) | set(budget_je)) - set(meta))
    zeilen = []
    for ka in namen:
        b = budget_je.get(ka) or {}
        aktuell = _g(b, "budget_aktuell_cent")
        budget = _int(aktuell) if aktuell not in (None, "") else _int(_g(b, "budget_auftrag_cent"))
        pz = prognose_zeile(budget, ist_je.get(ka, 0), obl_je.get(ka, 0), _g(b, "prognose_rest_manuell_cent"))
        if not (budget or pz["ist_cent"] or pz["obligo_cent"] or pz["rest_cent"] or _int(_g(b, "budget_auftrag_cent"))):
            continue
        zeilen.append({"kostenart": ka, "bezeichnung": _g(meta.get(ka) or {}, "bezeichnung") or ka, "db_stufe": stufe_je.get(ka, "DB2"),
                       "budget_auftrag_cent": _int(_g(b, "budget_auftrag_cent")), **pz, "prognose_begruendung": _g(b, "prognose_begruendung") or "",
                       "ampel": ampel_budget(budget, pz["ist_cent"], pz["obligo_cent"], pz["prognose_cent"], par["budget_gelb"], par["budget_rot"])})
    summe = {k: sum(z[k] for z in zeilen) for k in ("budget_auftrag_cent", "budget_cent", "ist_cent", "obligo_cent", "rest_cent", "prognose_cent", "abweichung_cent")}
    fort = fertigstellungsgrad(**(e.get("fortschritt") or {}))
    gk = par["gemeinkosten"]
    an = (gk.get("art") or "Aus") != "Aus"
    ware = lambda werte: sum(v for k, v in werte.items() if stufe_je.get(k) == "DB1")  # noqa: E731
    prog_je = {z["kostenart"]: z["prognose_cent"] for z in zeilen}
    gk_ist = gemeinkosten(gk, ware(ist_je), summe["ist_cent"], er["erloes_cent"] * fort["grad"] / 100, e.get("stunden_ist")) if an else None
    gk_prog = gemeinkosten(gk, ware(prog_je), summe["prognose_cent"], er["erloes_cent"], e.get("stunden_prognose") or e.get("stunden_ist")) if an else None
    st_ist = stufen(er["erloes_cent"], ist_je, stufe_je, gk_ist)
    st_prog = stufen(er["erloes_cent"], prog_je, stufe_je, gk_prog)
    st_budget = stufen(er["auftragswert_cent"], {z["kostenart"]: z["budget_cent"] for z in zeilen}, stufe_je)
    # Laufender DB (Ist-basiert): Erlös anteilig nach Fertigstellungsgrad gegen Ist-Kosten (Leistungsfortschritt),
    # damit ein Projekt mit vollem Auftragswert und erst halben Kosten nicht zu gut aussieht.
    erloes_anteilig = int(round(er["erloes_cent"] * fort["grad"] / 100))
    db_lauf = erloes_anteilig - summe["ist_cent"] - (gk_ist or 0)
    letzte = "db4" if an else "db3"
    ziel = par["ziel"]
    ampel_db_wert = ampel_gesamt([ampel_db(st_prog.get(f"db{n}_prozent"), ziel.get(f"ziel_db{n}"), par["ampel_gelb_unter"], par["ampel_rot_unter"]) for n in (1, 2, 3)])
    gesamt_budget = ampel_budget(summe["budget_cent"], summe["ist_cent"], summe["obligo_cent"], summe["prognose_cent"], par["budget_gelb"], par["budget_rot"]) if summe["budget_cent"] else ""
    ampel_kosten = ampel_gesamt([z["ampel"] for z in zeilen if z["budget_cent"]] + [gesamt_budget])
    return {
        "kopf": {
            "erloes_cent": er["erloes_cent"], "erloes_basis": er["basis"], "auftragswert_cent": er["auftragswert_cent"], "gestellt_cent": er["gestellt_cent"],
            "kosten_ist_cent": summe["ist_cent"], "obligo_cent": summe["obligo_cent"], "budget_cent": summe["budget_cent"], "budget_auftrag_cent": summe["budget_auftrag_cent"],
            "prognose_kosten_cent": summe["prognose_cent"], "abweichung_cent": summe["abweichung_cent"], "fertigstellungsgrad": fort["grad"],
            "erloes_anteilig_cent": erloes_anteilig, "db_laufend_cent": db_lauf, "db_laufend_prozent": prozent(db_lauf, erloes_anteilig),
            "db_prognose_cent": st_prog[letzte + "_cent"], "db_prognose_prozent": st_prog[letzte + "_prozent"], "db_prognose_stufe": letzte.upper(),
            "db1_prozent_ist": st_ist["db1_prozent"], "db1_prozent_prognose": st_prog["db1_prozent"],
            "ueber_budget": bool(summe["budget_cent"] and summe["prognose_cent"] > summe["budget_cent"]),
            "ampel_kosten": ampel_kosten, "ampel_db": ampel_db_wert, "ampel": ampel_gesamt([ampel_kosten, ampel_db_wert]),
        },
        "erloes": er, "stufen_ist": st_ist, "stufen_prognose": st_prog, "stufen_budget": st_budget, "kostenarten": zeilen, "summe": summe,
        "fertigstellung": fort, "parameter": par, "gemeinkosten_aktiv": an,
        "zeitreihe": zeitreihe(e.get("ist"), e.get("obligo")),
        "quellen": [dict(z, typ="ist") for z in e.get("ist") or ()] + [dict(z, typ="obligo") for z in e.get("obligo") or () if _int(_g(z, "betrag_cent"))],
        "hinweise": list(e.get("hinweise") or ()),
    }


# ── Nachkalkulation bei Abschluss ───────────────────────────────────────────────────────────────

def abweichungen(zeilen, schwelle_prozent=10.0):
    """Abweichungsanalyse je Kostenart (Ist gegen Budget bei Auftrag, Rückfall aktuelles Budget). Kommentarpflicht,
    wenn |Abweichung| > Schwelle % (ohne Budget: sobald Kosten anfallen)."""
    out = []
    for z in zeilen or ():
        basis = _int(_g(z, "budget_auftrag_cent")) or _int(_g(z, "budget_cent"))
        ist_c = _int(_g(z, "ist_cent"))
        abw = ist_c - basis
        p = prozent(abw, basis)
        pflicht = (abs(p) > _f(schwelle_prozent)) if p is not None else ist_c != 0
        out.append({"kostenart": _g(z, "kostenart"), "budget_auftrag_cent": _int(_g(z, "budget_auftrag_cent")), "budget_aktuell_cent": _int(_g(z, "budget_cent")),
                    "ist_cent": ist_c, "abweichung_cent": abw, "abweichung_prozent": p, "kommentar_pflicht": int(pflicht)})
    return out


def lernwerte(positionen, richtwerte=None, montage_min_ist=0, standard_min=0):
    """Ø Montageminuten je Kategorie aus einem abgeschlossenen Projekt: Ist-Minuten werden nach Planminuten
    (Richtwert × Menge; ohne Richtwert `standard_min`; ohne beides gleich je Stück) auf die Kategorien verteilt.
    Fremdgewerk-/„ohne“-Montage und Stornos zählen nicht. → [{kategorie, menge, plan_min, ist_min, min_je_stueck, richtwert_min}]"""
    richtwerte = richtwerte or {}
    je = {}
    for p in positionen or ():
        if (_g(p, "lieferstatus") or "") == "storniert" or (_g(p, "montage_art") or "") in ("Fremdgewerk", "ohne"):
            continue
        kat = _g(p, "kategorie") or "Ohne Kategorie"
        m = max(_int(_g(p, "menge")), 1)
        z = je.setdefault(kat, {"kategorie": kat, "menge": 0, "plan_min": 0})
        z["menge"] += m
        z["plan_min"] += m * (_int(richtwerte.get(kat)) or _int(standard_min))
    if not je:
        return []
    plan = sum(z["plan_min"] for z in je.values())
    stueck = sum(z["menge"] for z in je.values())
    out = []
    for z in je.values():
        anteil = (z["plan_min"] / plan) if plan else (z["menge"] / stueck)
        out.append({**z, "ist_min": int(round(_int(montage_min_ist) * anteil)), "richtwert_min": _int(richtwerte.get(z["kategorie"]))})
    rest = _int(montage_min_ist) - sum(z["ist_min"] for z in out)
    if rest:
        max(out, key=lambda z: z["ist_min"])["ist_min"] += rest
    for z in out:
        z["min_je_stueck"] = int(round(z["ist_min"] / z["menge"])) if z["menge"] else 0
    return sorted(out, key=lambda z: z["kategorie"])
