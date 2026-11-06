"""Packtisch nach JTL (Frappe): erster Scan, Mengen, Handbestätigung, Paketinhalt/Gewicht, Packhinweise, Dokumentregeln,
Abschluss „Verpacken“, Zurückstellen, Teillieferung aus gescannten Positionen, Einartikel-Schnellversand, Packmittel.

Regeln ohne Frappe: packtisch_regeln.py (Tests tests/test_packtisch_jtl.py). Quelle: Marktresearch/digital/backoffice/
33-referenz-jtl-packtisch.md Abschnitt 4. Packplatz-Profil: PH Packplatz (Gerätename als Text).
"""

import json

import frappe
from frappe import _
from frappe.utils import now_datetime

from ph_logistik.ph_logistik import packtisch_logik as pl
from ph_logistik.ph_logistik import packtisch_regeln as R
from ph_logistik.ph_logistik.doctype.ph_packplatz.ph_packplatz import profil as packplatz_profil
from ph_logistik.ph_logistik.helfer import einstellungen, produkt_info
from ph_logistik.ph_logistik.packtisch import _pruefen

LEITUNG_ROLLEN = {"PH Logistik Leitung", "System Manager", "PH Backoffice-Admin"}

FELDER_KOPF = ("kontakt", "kunde_name", "kunde_email", "kunde_telefon", "sprache", "bestellung", "auftrag", "projekt", "kommission", "wunschtermin", "liefer_name", "liefer_firma", "liefer_strasse", "liefer_hausnr", "liefer_zusatz", "liefer_plz", "liefer_ort", "liefer_land", "liefer_telefon", "liefer_email", "lieferhinweis", "abholcode", "lieferart", "packplatz", "geschenk")
POSITION_KOPIE_OHNE = ("name", "parent", "parenttype", "parentfield", "idx", "creation", "modified", "owner", "modified_by", "doctype")


def _ls(lieferschein, recht="write"):
    doc = frappe.get_doc("PH Lieferschein", lieferschein)
    doc.check_permission(recht)
    return doc


def _profile():
    from ph_logistik.ph_logistik.doctype.ph_paketprofil.ph_paketprofil import profile_map

    profile = profile_map(nur_aktiv=False)
    for key, pm in frappe.get_all("PH Paketprofil", {"packmittel_produkt": ("is", "set")}, ["name", "packmittel_produkt"], as_list=True):
        if key in profile:
            profile[key]["packmittel_produkt"] = pm
    for key, g in frappe.get_all("PH Paketprofil", {"gewicht_max_g": (">", 0)}, ["name", "gewicht_max_g"], as_list=True):
        if key in profile:
            profile[key]["gewicht_max_g"] = g
    return profile


# ── M1 Erster Scan ────────────────────────────────────────────────────────

def _offene_vorgaenge():
    ls = frappe.get_all("PH Lieferschein", {"status": "Entwurf"}, ["name", "bestellung", "auftrag", "kommission", "datum", "zurueckgestellt", "lieferart"], order_by="datum asc", limit=500)
    if not ls:
        return []
    pos = frappe.get_all("PH Lieferschein Position", {"parenttype": "PH Lieferschein", "parent": ("in", [x.name for x in ls])}, ["parent", "name", "ean", "seriennummer", "slug", "menge", "menge_gepackt", "paketprofil"])
    je = {}
    for p in pos:
        je.setdefault(p.parent, []).append(dict(p))
    return [dict(x, positionen=je.get(x.name, [])) for x in ls]


@frappe.whitelist()
def vorgang_scannen(code, packplatz=None):
    """Erster Scan am Packtisch: Lieferscheinnummer, Bestellnummer (legt bei bezahlter Shop-Bestellung den Lieferschein an),
    Auftrag, Kommissions-Etikett oder Artikel-EAN (Lieferschein mit den wenigsten offenen Positionen).
    → {lieferschein, art, kandidaten, schnellversand}"""
    _pruefen()
    vorgaenge = _offene_vorgaenge()
    r = R.vorgang_aus_scan(code, vorgaenge)
    if not r["lieferschein"]:
        c = str(code or "").strip()
        if c and frappe.db.exists("DocType", "PH Bestellung") and frappe.db.exists("PH Bestellung", c):
            vorhanden = frappe.db.get_value("PH Lieferschein", {"bestellung": c, "status": ("!=", "Storniert")}, "name")
            if vorhanden:
                return {"lieferschein": vorhanden, "art": "bestellung", "kandidaten": [vorhanden], "schnellversand": False}
            from ph_logistik.ph_logistik.doctype.ph_lieferschein.ph_lieferschein import lieferschein_aus_bestellung

            neu = lieferschein_aus_bestellung(c)
            return {"lieferschein": neu.name, "art": "bestellung_neu", "kandidaten": [neu.name], "schnellversand": False}
        r["schnellversand"] = False
        return r
    v = next((x for x in vorgaenge if x["name"] == r["lieferschein"]), None)
    pp = packplatz_profil(packplatz)
    r["schnellversand"] = bool(v and R.schnellversand_moeglich(v, _profile(), bool(pp.get("schnellversand")))[0])
    return r


# ── Pack-Ansicht: Packplatz, Hinweise, Dokumente ──────────────────────────

def _kontext(ls):
    kategorien, marken = set(), set()
    for p in ls.positionen:
        if p.produkt:
            info = produkt_info(p.produkt)
            if info.get("kategorie"):
                kategorien.add(info["kategorie"])
            if info.get("marke"):
                marken.add(info["marke"])
        if p.marke:
            marken.add(p.marke)
    return {"kategorien": kategorien, "marken": marken, "land": ls.liefer_land, "warenwert_cent": int(ls.warenwert_cent or 0), "lieferart": ls.lieferart, "zerbrechlich": bool(ls.zerbrechlich)}


def packhinweise_fuer(ls):
    regeln = frappe.get_all("PH Packhinweis Regel", {"aktiv": 1}, ["bezeichnung", "aktiv", "prioritaet", "kategorie", "marke", "laender", "wert_ab_cent", "wert_bis_cent", "lieferart", "nur_zerbrechlich", "hinweis", "bestaetigen"]) if frappe.db.exists("DocType", "PH Packhinweis Regel") else []
    hinweise = R.packhinweise(regeln, _kontext(ls))
    # S2: Hinweise aus Auftrag/Kunde (Lieferhinweis, Geschenk, Kommission)
    if ls.geschenk:
        hinweise.append({"bezeichnung": _("Geschenk"), "hinweis": _("Geschenk – keine Preise, keine Rechnung ins Paket."), "bestaetigen": 1})
    if ls.kommission:
        hinweise.append({"bezeichnung": _("Kommission"), "hinweis": _("Kommission {0}").format(ls.kommission), "bestaetigen": 0})
    return hinweise


def _teillieferung_art(ls):
    if not ls.teillieferung:
        return "Komplettlieferung"
    bezug = {"bestellung": ls.bestellung} if ls.bestellung else ({"auftrag": ls.auftrag} if ls.auftrag else None)
    if not bezug:
        return R.teillieferung_art(True, True, False)
    andere = frappe.get_all("PH Lieferschein", {**bezug, "name": ("!=", ls.name), "status": ("!=", "Storniert")}, ["status"])
    erste = not any(a.status in ("Gepackt", "Uebergeben", "Zugestellt") for a in andere)
    rest = any(a.status == "Entwurf" for a in andere)
    return R.teillieferung_art(True, erste, rest)


def _norm(x):
    return "".join(ch for ch in str(x or "").lower() if ch.isalnum())


def dokumente_fuer(ls, pp=None):
    regeln = frappe.get_all("PH Dokument Regel", {"aktiv": 1}, ["bezeichnung", "aktiv", "dokument", "print_format", "aktion", "anzahl", "laender", "laender_ausser", "wert_ab_cent", "wert_bis_cent", "lieferart", "teillieferung", "abweichende_lieferadresse", "geschenk"]) if frappe.db.exists("DocType", "PH Dokument Regel") else []
    kontext = {
        "land": ls.liefer_land, "warenwert_cent": int(ls.warenwert_cent or 0), "lieferart": ls.lieferart, "teillieferung_art": _teillieferung_art(ls),
        "abweichende_lieferadresse": bool(ls.liefer_name and ls.kunde_name and _norm(ls.liefer_name) != _norm(ls.kunde_name)), "geschenk": bool(ls.geschenk),
    }
    pp = pp or packplatz_profil(ls.packplatz)
    drucker = {"Lieferschein": "drucker_lieferschein", "Packliste": "drucker_packliste", "Rechnung": "drucker_rechnung", "Proforma-Rechnung": "drucker_rechnung"}
    out = []
    for d in R.dokumente(regeln, kontext):
        d["drucker"] = pp.get(drucker.get(d["dokument"], "drucker_sonstige")) or pp.get("drucker_sonstige")
        if d["print_format"] and d["dokument"] in ("Lieferschein", "Packliste"):
            d["url"] = f"/printview?doctype=PH%20Lieferschein&name={ls.name}&format={d['print_format']}&lang={ls.sprache or 'de'}"
        out.append(d)
    return out, kontext["teillieferung_art"]


@frappe.whitelist()
def packansicht_zusatz(lieferschein, packplatz=None):
    """Ergänzung zur Pack-Ansicht: Packplatz-Profil, Packhinweise, Dokumente, Positionen ohne Barcode, Gewichtsvorschläge."""
    _pruefen()
    ls = _ls(lieferschein, "read")
    pp = packplatz_profil(packplatz or ls.packplatz)
    doks, tl = dokumente_fuer(ls, pp)
    return {
        "packplatz": pp, "packhinweise": packhinweise_fuer(ls), "packhinweise_bestaetigt": int(ls.packhinweise_bestaetigt or 0),
        "dokumente": doks, "teillieferung_art": tl, "ohne_barcode": [p.name for p in ls.positionen if p.ohne_barcode],
        "zurueckgestellt": int(ls.zurueckgestellt or 0), "zurueckgestellt_grund": ls.zurueckgestellt_grund, "gruende": list(R.ZURUECKSTELLEN_GRUENDE),
        "pakete": _gewichte(ls, pp, bool(pp.get("gewicht_pflicht"))),
    }


# ── M3/M4 Mengen und Handbestätigung ──────────────────────────────────────

@frappe.whitelist()
def scan_menge(lieferschein, code, anzahl=1, bestaetigt=0, packplatz=None):
    """Scan mit vorgewählter Menge. Menge > 1 braucht (Packplatz-Schalter) eine Bestätigung → {bestaetigen: 1} ohne zu buchen."""
    _pruefen()
    ls = _ls(lieferschein)
    if ls.zurueckgestellt:
        frappe.throw(_("Lieferschein ist zurückgestellt – zuerst fortsetzen."))
    pp = packplatz_profil(packplatz or ls.packplatz)
    p = pl.scan_treffer(code, [x.as_dict() for x in ls.positionen])
    if not p:
        return {"treffer": None, "ton": "fehler" if pp.get("ton_fehler") else None}
    m = R.menge_pruefen(p, anzahl, bool(pp.get("mengen_bestaetigen")), bool(int(bestaetigt or 0)))
    if not m["ok"]:
        return {"treffer": p["name"], "beschreibung": p.get("beschreibung"), **m, "ton": None if m["bestaetigen"] else ("fehler" if pp.get("ton_fehler") else None)}
    r = ls.position_packen(p["name"], m["anzahl"])
    r.update(treffer=p["name"], beschreibung=p.get("beschreibung"), ton="ok" if pp.get("ton_erfolg") else None)
    return r


@frappe.whitelist()
def hand_bestaetigen(lieferschein, position, anzahl=None, packplatz=None):
    """Position ohne Barcode per Hand bestätigen (Kennzeichnung bleibt sichtbar). Positionen mit Barcode nur Leitung."""
    _pruefen()
    ls = _ls(lieferschein)
    pp = packplatz_profil(packplatz or ls.packplatz)
    p = next((x for x in ls.positionen if x.name == position), None)
    if not p:
        frappe.throw(_("Position nicht gefunden."))
    leitung = bool(LEITUNG_ROLLEN & set(frappe.get_roles()))
    if not R.ohne_barcode(p.as_dict()) and not leitung:
        frappe.throw(_("Position hat einen Barcode – bitte scannen (Handbestätigung nur Leitung)."))
    if not pp.get("hand_bestaetigung_erlaubt") and not leitung:
        frappe.throw(_("Handbestätigung ist an diesem Packplatz abgeschaltet."))
    rest = int(p.menge or 0) - int(p.menge_gepackt or 0)
    n = rest if anzahl in (None, "", 0, "0") else int(anzahl)
    m = R.menge_pruefen(p.as_dict(), n, False)
    if not m["ok"]:
        frappe.throw(_("Menge nicht möglich ({0}).").format(m["fehler"]))
    p.hand_bestaetigt = 1
    p.hand_bestaetigt_von = frappe.session.user
    return ls.position_packen(p.name, n)


# ── M6/M7/S4 Pakete: Inhalt, Gewicht, Plausibilität ───────────────────────

def _artikelgewichte(ls):
    out = {}
    for p in ls.positionen:
        if p.produkt:
            g = produkt_info(p.produkt).get("gewicht_g")
            if g:
                out[p.name] = int(g)
    return out


def _inhalt_map(pk):
    try:
        return {k: int(v) for k, v in (json.loads(pk.inhalt_json) if pk.get("inhalt_json") else {}).items()}
    except (TypeError, ValueError):
        return {}


def _gewichte(ls, pp, pflicht=False):
    profile = _profile()
    gewichte = _artikelgewichte(ls)
    pos = [p.as_dict() for p in ls.positionen]
    out = []
    for pk in ls.pakete:
        pr = profile.get(pk.paketprofil) or {}
        vorschlag, fehlend = R.gewicht_vorschlag(_inhalt_map(pk), pos, gewichte, pr)
        ok, grund = R.gewicht_plausibel(pk.gewicht_g, vorschlag if not fehlend else None, pp.get("gewicht_toleranz_promille"), pp.get("gewicht_toleranz_min_g"), pr.get("gewicht_max_g"))
        if ok and pflicht and not pk.gewicht_manuell:
            ok, grund = False, "gewicht_manuell_fehlt"  # M7: keine Waage → manuelles Gewicht Pflicht vor dem Label
        out.append({"paket_nr": pk.paket_nr, "vorschlag_g": vorschlag, "fehlende_artikelgewichte": fehlend, "gewicht_g": pk.gewicht_g, "plausibel": ok, "grund": grund})
    return out


@frappe.whitelist()
def pakete_mit_inhalt(lieferschein, pakete, packplatz=None, versicherungswert_cent=None, versichern=None):
    """Mehrere Packstücke mit Inhalt je Paket: [{paket_nr, paketprofil, art, laenge_cm, breite_cm, hoehe_cm, gewicht_g (manuell),
    zerbrechlich, inhalt_map {position: menge}}]. Gewichtsvorschlag = Artikelgewichte + Packmittel-Tara; ohne manuelles Gewicht
    wird der Vorschlag übernommen (gewicht_manuell = 0). Plausibilität je Paket laut Packplatz-Toleranz. → {pakete, fehler, ohne_paket}"""
    _pruefen()
    ls = _ls(lieferschein)
    if ls.status != "Entwurf":
        frappe.throw(_("Pakete nur im Status Entwurf ändern."))
    if isinstance(pakete, str):
        pakete = frappe.parse_json(pakete)
    pp = packplatz_profil(packplatz or ls.packplatz)
    profile = _profile()
    pos = [p.as_dict() for p in ls.positionen]
    pruef = R.inhalt_pruefen([{"paket_nr": pk.get("paket_nr"), "inhalt_map": pk.get("inhalt_map") or {}} for pk in pakete or []], pos)
    if pruef["fehler"]:
        frappe.throw(_("Inhalt passt nicht zu den gepackten Mengen: {0}").format(", ".join(f"{a}: {b} > {c}" for a, b, c in pruef["fehler"])))
    gewichte = _artikelgewichte(ls)
    alt = {pk.paket_nr: pk for pk in ls.pakete}
    ls.set("pakete", [])
    for i, pk in enumerate(pakete or [], start=1):
        nr = int(pk.get("paket_nr") or i)
        pr = profile.get(pk.get("paketprofil")) or {}
        inhalt = {k: int(v) for k, v in (pk.get("inhalt_map") or {}).items() if int(v or 0) > 0}
        vorschlag, fehlend = R.gewicht_vorschlag(inhalt, pos, gewichte, pr)
        manuell = int(pk.get("gewicht_g") or 0)
        gewicht = manuell or vorschlag or None
        ok, _g = R.gewicht_plausibel(gewicht, vorschlag if not fehlend else None, pp.get("gewicht_toleranz_promille"), pp.get("gewicht_toleranz_min_g"), pr.get("gewicht_max_g"))
        vorher = alt.get(nr)
        ls.append("pakete", {
            "paket_nr": nr, "paketprofil": pk.get("paketprofil") or None, "art": pk.get("art") or "Paket",
            "laenge_cm": pk.get("laenge_cm") or pr.get("laenge_cm"), "breite_cm": pk.get("breite_cm") or pr.get("breite_cm"), "hoehe_cm": pk.get("hoehe_cm") or pr.get("hoehe_cm"),
            "gewicht_g": gewicht, "gewicht_vorschlag_g": vorschlag or None, "gewicht_manuell": int(bool(manuell)), "gewicht_plausibel": int(ok),
            "zerbrechlich": int(bool(pk.get("zerbrechlich") or pr.get("zerbrechlich") or pr.get("glas"))),
            "inhalt": pk.get("inhalt") or R.inhalt_text(inhalt, pos) or None, "inhalt_json": json.dumps(inhalt) if inhalt else None,
            "sendung": vorher.sendung if vorher else None, "packmittel_gebucht": int(vorher.packmittel_gebucht or 0) if vorher else 0,
        })
        for posname in inhalt:
            for p in ls.positionen:
                if p.name == posname and not p.paket_nr:
                    p.paket_nr = nr
    if versichern is not None:
        ls.versichern = int(bool(int(versichern)))
    if versicherungswert_cent is not None:
        ls.versicherungswert_cent = int(versicherungswert_cent or 0)
    ls.save()
    return {"pakete": _gewichte(ls, pp, bool(pp.get("gewicht_pflicht"))), "ohne_paket": pruef["ohne_paket"], "gesamtgewicht_g": ls.gesamtgewicht_g}


# ── S3 Packmittel ─────────────────────────────────────────────────────────

def packmittel_ausbuchen(ls):
    """Je Paket mit Profil-Packmittel 1 Stück „Ausbuchung“ (Grund Packmittel) aus dem Packplatz-Lagerort, sonst
    packtisch_lagerort/standard_lagerort. Idempotent je Paket (Schlüssel pm:<Lieferschein>:<Paket>). Fehlender Bestand → Kommentar."""
    from ph_logistik.ph_logistik.bestand import buche

    buchungen = R.packmittel_buchungen([pk.as_dict() for pk in ls.pakete], _profile())
    if not buchungen:
        return 0
    pp = packplatz_profil(ls.packplatz)
    e = einstellungen()
    lo = pp.get("lagerort") or e.get("packtisch_lagerort") or e.get("standard_lagerort")
    if not lo:
        ls.add_comment("Info", _("Packmittel nicht abgebucht: kein Lagerort am Packplatz/in den Einstellungen."))
        return 0
    n = 0
    for b in buchungen:
        try:
            buche("Ausbuchung", b["produkt"], b["menge"], lagerort_von=lo, bezug_doctype="PH Lieferschein", bezug=ls.name, grund=_("Packmittel {0}").format(b["profil"]), idempotency_key=f"pm:{ls.name}:{b['paket_nr']}", quelle="packtisch")
            for pk in ls.pakete:
                if pk.paket_nr == b["paket_nr"]:
                    pk.db_set("packmittel_gebucht", 1, update_modified=False)
            n += 1
        except Exception:  # noqa: BLE001
            frappe.clear_last_message()
            ls.add_comment("Info", _("Packmittel {0} (Paket {1}) ohne Bestand an {2} – bitte Wareneingang buchen.").format(b["produkt"], b["paket_nr"], lo))
    return n


# ── S1 Packhinweise bestätigen ────────────────────────────────────────────

@frappe.whitelist()
def packhinweise_bestaetigen(lieferschein):
    _pruefen()
    ls = _ls(lieferschein)
    ls.db_set("packhinweise_bestaetigt", 1)
    ls.add_comment("Info", _("Packhinweise bestätigt"))
    return 1


# ── M10 Zurückstellen ─────────────────────────────────────────────────────

@frappe.whitelist()
def zurueckstellen(lieferschein, grund, text=None, fotos=None):
    """Vorgang zurückstellen (Fehlt/Beschaedigt/Falscher Artikel/Kunde Rueckfrage/Sonstiges). Gepackte Mengen bleiben erhalten,
    nichts wird gebucht. Fehlt/Beschädigt/Falscher Artikel laufen zusätzlich über problem_melden (Fotos, Aufgabe, Servicefall)."""
    _pruefen()
    ls = _ls(lieferschein)
    if grund not in R.ZURUECKSTELLEN_GRUENDE:
        frappe.throw(_("Unbekannter Grund: {0}").format(grund))
    if ls.status != "Entwurf":
        frappe.throw(_("Nur Entwürfe werden zurückgestellt."))
    if grund in pl.PROBLEM_GRUENDE:
        ls.problem_melden(grund, text, fotos)
    else:
        from ph_logistik.ph_logistik.tasks import _aufgabe

        ls.add_comment("Comment", _("Zurückgestellt: {0} – {1}").format(_(grund), text or ""))
        _aufgabe(f"Lieferschein {ls.name} zurückgestellt: {grund}" + (f" – {text}" if text else ""), "PH Lieferschein", ls.name)
    ls.db_set({"zurueckgestellt": 1, "zurueckgestellt_grund": grund, "zurueckgestellt_text": text, "zurueckgestellt_am": now_datetime(), "zurueckgestellt_von": frappe.session.user})
    return {"zurueckgestellt": 1, "grund": grund}


@frappe.whitelist()
def fortsetzen(lieferschein):
    _pruefen()
    ls = _ls(lieferschein)
    ls.db_set({"zurueckgestellt": 0})
    ls.add_comment("Info", _("Zurückstellung aufgehoben"))
    return 0


# ── M11 Teillieferung nur aus gescannten Positionen ──────────────────────

@frappe.whitelist()
def teillieferung_aus_gescannten(lieferschein):
    """Dieser Lieferschein behält nur die gescannten Mengen; der Rest wandert in einen neuen Entwurf (teillieferung_von).
    → {lieferschein, rest}"""
    _pruefen()
    ls = _ls(lieferschein)
    if ls.status != "Entwurf":
        frappe.throw(_("Teillieferung nur aus einem Entwurf."))
    try:
        bleibt, rest = R.teillieferung_aufteilen([p.as_dict() for p in ls.positionen])
    except ValueError as e:
        frappe.throw(_(str(e)))
    if not rest:
        return {"lieferschein": ls.name, "rest": None}
    neu = frappe.get_doc({"doctype": "PH Lieferschein", **{k: ls.get(k) for k in FELDER_KOPF}, "teillieferung": 1, "teillieferung_von": ls.name, "quelle": "packtisch"})
    restmenge = {r["position"]: r["menge"] for r in rest}
    for p in list(ls.positionen):
        if p.name in restmenge:
            d = {k: v for k, v in p.as_dict().items() if k not in POSITION_KOPIE_OHNE}
            d.update(menge=restmenge[p.name], menge_gepackt=0, gepackt=0, paket_nr=None, hand_bestaetigt=0, hand_bestaetigt_von=None)
            neu.append("positionen", d)
        if p.name in bleibt:
            p.menge = bleibt[p.name]
        else:
            ls.remove(p)
    neu.insert()
    ls.teillieferung = 1
    ls.warenwert_cent = pl.warenwert_cent([p.as_dict() for p in ls.positionen])
    ls.save()
    ls.add_comment("Info", _("Teillieferung: Restmengen in {0}").format(neu.name))
    return {"lieferschein": ls.name, "rest": neu.name}


# ── M8/M9/M12 Abschluss „Verpacken“ ───────────────────────────────────────

@frappe.whitelist()
def verpacken(lieferschein, packplatz=None, tarif_id=None, teillieferung=0, gewicht_pflicht=None):
    """Ein Abschluss: (Teillieferung aus gescannten Positionen) → Prüfung (alles gepackt, Pakete, Gewicht plausibel, Packhinweise
    bestätigt, nicht zurückgestellt) → Versand: LetMeShip-Tarif (übergeben oder Empfehlung) + Label → Gepackt mit Bestands- und
    Packmittel-Abbuchung → Dokumente laut Regeln. Spedition/Eigenlieferung: kein Paketlabel (Speditionsauftrag/Tour).
    „Versendet“ (Übergeben) erst, wenn alle Pakete Tracking haben (PH Lieferschein.uebergeben)."""
    _pruefen()
    ls = _ls(lieferschein)
    if ls.status != "Entwurf":
        frappe.throw(_("Nur Entwürfe werden verpackt."))
    pp = packplatz_profil(packplatz or ls.packplatz)
    if packplatz and ls.packplatz != pp.get("name") and pp.get("name"):
        ls.db_set("packplatz", pp["name"], update_modified=False)
    rest = None
    if int(teillieferung or 0):
        rest = teillieferung_aus_gescannten(ls.name)["rest"]
        ls = _ls(lieferschein)
    hinweise = packhinweise_fuer(ls)
    offen = 0 if ls.packhinweise_bestaetigt else sum(1 for h in hinweise if h.get("bestaetigen"))
    pflicht = bool(pp.get("gewicht_pflicht")) if gewicht_pflicht is None else bool(int(gewicht_pflicht))
    gewichte = {g["paket_nr"]: (g["plausibel"], g["grund"]) for g in _gewichte(ls, pp, pflicht and ls.lieferart == "Versand")}
    gruende = R.verpacken_pruefen([p.as_dict() for p in ls.positionen], [pk.as_dict() for pk in ls.pakete], ls.lieferart, pflicht, offen, bool(ls.zurueckgestellt), False, gewichte)
    if gruende:
        frappe.throw(_("Verpacken nicht möglich: {0}").format(", ".join(gruende)), title=_("Packtisch"))
    sendung = None
    if ls.lieferart == "Versand":
        aktiv = frappe.db.get_value("PH Sendung", {"lieferschein": ls.name, "richtung": "Ausgang", "status": ("in", ["Angelegt", "Etikett", "Unterwegs"])}, "name")
        if aktiv:
            sendung = aktiv
        else:
            if not tarif_id:
                if not pp.get("etikett_empfehlung"):
                    frappe.throw(_("Bitte einen Versanddienst wählen."))
                tarif_id = (ls.tarife() or {}).get("empfehlung")
            sendung = ls.etikett_erzeugen(tarif_id)
        ls.reload()
    if ls.status == "Entwurf":
        ls.als_gepackt()
        ls.reload()
    doks, _tl = dokumente_fuer(ls, pp)
    ls.db_set("dokumente_beigelegt", "\n".join(f"{d['anzahl']}× {d['dokument']}" for d in doks) or None, update_modified=False)
    s = frappe.db.get_value("PH Sendung", sendung, ["name", "status", "carrier", "tracking_nr", "tracking_url", "etikett", "env"], as_dict=True) if sendung else None
    return {"status": ls.status, "sendung": s, "dokumente": doks, "rest": rest, "spedition": ls.lieferart == "Spedition", "ton": "ok" if pp.get("ton_erfolg") else None}


# ── S6 Einartikel-Schnellversand ──────────────────────────────────────────

@frappe.whitelist()
def schnellversand(code, packplatz=None):
    """Scan eines Einzelartikel-Auftrags → Position packen, Paket aus festem Profil, Gewicht = Vorschlag, Label, Gepackt.
    Nur mit Packplatz-Schalter „Einartikel-Schnellversand“. → wie verpacken + {lieferschein}"""
    _pruefen()
    pp = packplatz_profil(packplatz)
    r = vorgang_scannen(code, packplatz)
    if not r.get("lieferschein"):
        frappe.throw(_("Kein offener Vorgang zu {0}.").format(code))
    ls = _ls(r["lieferschein"])
    v = {"lieferart": ls.lieferart, "zurueckgestellt": ls.zurueckgestellt, "positionen": [p.as_dict() for p in ls.positionen]}
    ok, grund = R.schnellversand_moeglich(v, _profile(), bool(pp.get("schnellversand")))
    if ok and not ls.packhinweise_bestaetigt and any(h.get("bestaetigen") for h in packhinweise_fuer(ls)):
        ok, grund = False, "packhinweise"  # Hinweis zu bestätigen → normaler Packablauf
    if not ok:
        return {"lieferschein": ls.name, "schnellversand": False, "grund": grund}
    p = ls.positionen[0]
    if int(p.menge_gepackt or 0) < 1:
        ls.position_packen(p.name, 1)
        ls.reload()
    if not ls.pakete:
        pakete_mit_inhalt(ls.name, [{"paket_nr": 1, "paketprofil": p.paketprofil, "inhalt_map": {p.name: 1}}], packplatz)
    out = verpacken(ls.name, packplatz=packplatz, gewicht_pflicht=0)
    out.update(lieferschein=ls.name, schnellversand=True)
    return out


def standardregeln_anlegen():
    """Idempotente Startregeln (Platzhalter, vom Inhaber anpassen): Lieferschein immer, keine Rechnung bei Geschenk,
    Proforma bei Drittland (CH), Packhinweis zerbrechlich."""
    for r in (
        {"doctype": "PH Dokument Regel", "bezeichnung": "Lieferschein immer", "dokument": "Lieferschein", "aktion": "Beilegen", "print_format": None},
        {"doctype": "PH Dokument Regel", "bezeichnung": "Keine Rechnung bei Geschenk", "dokument": "Rechnung", "aktion": "Nicht beilegen", "geschenk": "ja"},
        {"doctype": "PH Dokument Regel", "bezeichnung": "Proforma-Rechnung Drittland", "dokument": "Proforma-Rechnung", "aktion": "Beilegen", "laender": "DRITTLAND", "anzahl": 3},
        {"doctype": "PH Packhinweis Regel", "bezeichnung": "Zerbrechlich polstern", "nur_zerbrechlich": 1, "hinweis": "Glas/Keramik: rundum polstern (mind. 5 cm), Fragile-Aufkleber außen.", "bestaetigen": 1, "prioritaet": 10},
    ):
        if not frappe.db.exists(r["doctype"], r["bezeichnung"]):
            try:
                frappe.get_doc(r).insert(ignore_permissions=True)
            except Exception:  # noqa: BLE001
                frappe.log_error(title=f"ph_logistik: Standardregel {r['bezeichnung']}")
