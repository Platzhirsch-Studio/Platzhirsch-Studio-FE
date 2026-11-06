"""Lieferstatus je Projektposition, Abgleich mit Herstellerbestellung (ph_sortiment) und Wareneingang.

Reine Logik ohne Frappe (Tests: tests/test_lieferung.py). Aufrufer: ph_projekte/ph_projekte/lieferung.py (doc_events),
PH Projekt.herstellerbestellungen_erzeugen / lieferung_buchen / nachlieferung_anlegen.
"""

from datetime import date, datetime

LIEFERSTATUS = ("offen", "bestellt", "bestaetigt", "teilgeliefert", "geliefert", "montiert", "storniert")
# Projekt-Position.status (Website-Steps) aus dem Lieferstatus
STATUS_AUS_LIEFERSTATUS = {"bestellt": "bestellt", "bestaetigt": "bestellt", "teilgeliefert": "bestellt", "geliefert": "geliefert", "montiert": "montiert"}
SCHADEN = ("Transportschaden", "beschaedigt", "falsch", "fehlt")


def _g(z, k, standard=None):
    v = z.get(k) if isinstance(z, dict) else getattr(z, k, None)
    return standard if v is None else v


def _int(v):
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def _datum(v):
    if not v:
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    try:
        return date.fromisoformat(str(v)[:10])
    except ValueError:
        return None


def lieferstatus(menge, bestellt=0, geliefert=0, montiert=0, bestaetigt=False, storniert=False):
    menge = max(_int(menge), 1)
    if storniert:
        return "storniert"
    if _int(montiert) >= menge:
        return "montiert"
    if _int(geliefert) >= menge:
        return "geliefert"
    if _int(geliefert) > 0:
        return "teilgeliefert"
    if bestaetigt:
        return "bestaetigt"
    if _int(bestellt) > 0:
        return "bestellt"
    return "offen"


def offene_menge(menge, geliefert):
    return max(_int(menge) - _int(geliefert), 0)


def bestellbar(pos):
    """Projektposition darf in eine Herstellerbestellung (noch nicht bestellt, nicht storniert, nicht Fremdgewerk-Leistung)."""
    if _g(pos, "herstellerbestellung") and not _int(_g(pos, "nachlieferung_noetig")):
        return False
    if (_g(pos, "lieferstatus") or "offen") not in ("offen",) and not _int(_g(pos, "nachlieferung_noetig")):
        return False
    if (_g(pos, "montage_art") or "") == "Fremdgewerk" and not _g(pos, "produkt") and not _g(pos, "hersteller_artikelnr"):
        return False
    return bool(_g(pos, "bezeichnung") or _g(pos, "produkt"))


def bestellzeile(pos, kommission=None, wunschtermin=None, nachlieferung=False):
    """Projektposition → Zeile für ph_sortiment.api.bestellungen_sammeln."""
    menge = _int(_g(pos, "nachlieferung_menge")) if nachlieferung else _int(_g(pos, "menge"))
    return {
        "produkt": _g(pos, "produkt"),
        "ausfuehrung": _g(pos, "ausfuehrung"),
        "ausfuehrung_text": _g(pos, "ausfuehrung_text"),
        "bezeichnung": (("Nachlieferung: " if nachlieferung else "") + (_g(pos, "bezeichnung") or ""))[:140],
        "hersteller_artikelnr": _g(pos, "hersteller_artikelnr"),
        "lieferant": _g(pos, "lieferant"),
        "menge": max(menge, 1),
        "vk_cent": _int(_g(pos, "preis_cent")),
        "wunschtermin": str(_g(pos, "nachlieferung_termin") if nachlieferung and _g(pos, "nachlieferung_termin") else (wunschtermin or "")) or None,
        "kommission": kommission,
        "raum": _g(pos, "raum"),
        "bezug_zeile": _g(pos, "name"),
    }


def abgleich_herstellerbestellung(projekt_positionen, hb_name, hb_status, hb_positionen):
    """Änderungen je Projektposition aus einer Herstellerbestellung.

    hb_positionen: [{bezug_zeile, menge, ab_menge, menge_erhalten, bestaetigter_termin, status}]
    → {zeilenname: {feld: wert}} nur für tatsächlich geänderte Felder.
    """
    nach_name = {_g(p, "name"): p for p in projekt_positionen}
    aenderungen = {}
    storniert = hb_status == "Storniert"
    for hp in hb_positionen:
        zeile = _g(hp, "bezug_zeile")
        p = nach_name.get(zeile)
        if not p:
            continue
        bestellt = 0 if hb_status == "Entwurf" else _int(_g(hp, "ab_menge")) or _int(_g(hp, "menge"))
        geliefert = max(_int(_g(hp, "menge_erhalten")), 0)
        bestaetigt = hb_status in ("AB erhalten", "AB geprueft", "Teilgeliefert", "Geliefert", "Abgeschlossen") or (_g(hp, "status") == "Bestaetigt")
        ziel = {
            "herstellerbestellung": hb_name,
            "menge_bestellt": bestellt,
            "lieferstatus": lieferstatus(_g(p, "menge"), bestellt, max(geliefert, _int(_g(p, "menge_geliefert"))), _g(p, "menge_montiert"), bestaetigt, storniert),
        }
        if geliefert > _int(_g(p, "menge_geliefert")):
            ziel["menge_geliefert"] = geliefert
        termin = _datum(_g(hp, "bestaetigter_termin"))
        if termin and termin != _datum(_g(p, "liefertermin")):
            ziel["liefertermin"] = termin
        if ziel["lieferstatus"] in STATUS_AUS_LIEFERSTATUS and _g(p, "status") not in ("montiert",):
            ziel["status"] = STATUS_AUS_LIEFERSTATUS[ziel["lieferstatus"]]
        if hb_status == "Entwurf" and (_g(p, "lieferstatus") or "offen") != "offen":
            ziel.pop("lieferstatus")
        diff = {k: v for k, v in ziel.items() if _vergleich(_g(p, k)) != _vergleich(v)}
        if diff:
            aenderungen[zeile] = diff
    return aenderungen


def _vergleich(v):
    if isinstance(v, (date, datetime)):
        return str(_datum(v))
    if v in (None, ""):
        return None
    return str(v)


def schaeden_aus_wareneingang(we_positionen, hb_positionen):
    """Wareneingangszeilen mit Schaden → {bezug_zeile: {menge, grund}}. WE-Position.position = idx der HB-Position (1-basiert)."""
    nach_idx = {_int(_g(h, "idx")): h for h in hb_positionen}
    out = {}
    for w in we_positionen:
        zustand = _g(w, "zustand") or "ok"
        if zustand not in SCHADEN:
            continue
        hp = nach_idx.get(_int(_g(w, "position")))
        if not hp or not _g(hp, "bezug_zeile"):
            continue
        menge = _int(_g(w, "menge_erwartet")) - _int(_g(w, "menge_erhalten")) if zustand == "fehlt" else (_int(_g(w, "menge_erhalten")) or _int(_g(w, "menge_erwartet")))
        eintrag = out.setdefault(_g(hp, "bezug_zeile"), {"menge": 0, "grund": []})
        eintrag["menge"] += max(menge, 1)
        text = zustand + (f": {_g(w, 'hinweis')}" if _g(w, "hinweis") else "")
        eintrag["grund"].append(text)
    for v in out.values():
        v["grund"] = "; ".join(v["grund"])[:140]
    return out


def spaetester_termin(positionen):
    """Projekt-Liefertermin = spätester bestätigter Positionstermin (nicht stornierter Positionen)."""
    termine = [_datum(_g(p, "liefertermin")) for p in positionen if (_g(p, "lieferstatus") or "") != "storniert"]
    termine = [t for t in termine if t]
    return max(termine) if termine else None


def offene_terminaenderungen(zeilen):
    return [z for z in zeilen if not _int(_g(z, "projekt_informiert"))]


TEXTE = {
    "de": ("Guten Tag,\n\nfür Ihr Projekt „{projekt}“ hat uns der Hersteller einen neuen Liefertermin mitgeteilt:\n{zeilen}\n\n"
           "Wir melden uns zur Abstimmung des Montagetermins. Bei Fragen antworten Sie einfach auf diese Nachricht.\n\nIhr Platzhirsch-Team"),
    "en": ("Hello,\n\nthe manufacturer has informed us of a new delivery date for your project “{projekt}”:\n{zeilen}\n\n"
           "We will contact you to agree the installation date. If you have any questions, simply reply to this message.\n\nYour Platzhirsch team"),
}


def _fmt(d, sprache):
    d = _datum(d)
    if not d:
        return "–"
    return d.strftime("%d.%m.%Y") if sprache != "en" else d.strftime("%d/%m/%Y")


def kundentext_liefertermin(projekt_titel, aenderungen, sprache="de"):
    """aenderungen: [{bezeichnung, termin_alt, termin_neu}] → Kundentext (ohne Preise, ohne Herstellername-Pflicht)."""
    vorlage = TEXTE.get(sprache) or TEXTE["de"]
    pfeil = "→"
    zeilen = "\n".join(f"– {a.get('bezeichnung') or 'Position'}: {_fmt(a.get('termin_alt'), sprache)} {pfeil} {_fmt(a.get('termin_neu'), sprache)}" for a in aenderungen)
    return vorlage.format(projekt=projekt_titel, zeilen=zeilen)


def verschiebung_tage(alt, neu):
    a, n = _datum(alt), _datum(neu)
    if not a or not n:
        return None
    return (n - a).days


def bestellpflichtig(pos):
    """Position, die vom Lieferanten kommt (nicht storniert, keine reine Dienstleistung)."""
    if (_g(pos, "lieferstatus") or "") == "storniert":
        return False
    return bool(_g(pos, "lieferant") or _g(pos, "produkt") or _g(pos, "herstellerbestellung") or _g(pos, "hersteller_artikelnr"))


def ware_komplett(positionen):
    """„Küche komplett“ (S6): alle bestellpflichtigen Positionen vollständig geliefert, keine offene Nachlieferung.
    → (komplett, fehlend [{name, bezeichnung, offen}]). Ohne bestellpflichtige Positionen: nicht komplett."""
    relevant = [p for p in positionen if bestellpflichtig(p)]
    fehlend = []
    for p in relevant:
        offen = offene_menge(max(_int(_g(p, "menge")), 1), _g(p, "menge_geliefert"))
        if offen or _int(_g(p, "nachlieferung_noetig")):
            fehlend.append({"name": _g(p, "name"), "bezeichnung": _g(p, "bezeichnung"), "offen": offen or _int(_g(p, "nachlieferung_menge")) or 1})
    return (bool(relevant) and not fehlend), fehlend
