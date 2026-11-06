"""Import von Küchen-/Möbelplanungen (CSV/XML-Export eines Planungsprogramms) → Planungspositionen.

Reine Logik ohne Frappe (Tests: tests/test_kuechenplanung.py). Aufrufer: PH Planung.import_vorschau/import_uebernehmen.

Adapter-Schnittstelle:
    class MeinAdapter(Adapter):
        key = "mein_format"; label = "…"; verifiziert = False
        def lesen(self, inhalt, mapping=None) -> Ergebnis
    registrieren(MeinAdapter)

Normalisierte Position (alle Schlüssel immer vorhanden):
    pos_nr, hersteller_artikelnr, bezeichnung, menge (Int ≥ 1), breite_mm, hoehe_mm, tiefe_mm (Int),
    marke, lieferant, kategorie, raum, ausfuehrung_text, ek_cent, vk_cent (Int oder None)

WICHTIG: Die Vorlagen für CARAT, KPS und Winner sind **unverifiziert** – sie bestehen nur aus Spalten-/Tag-Synonymen,
die in solchen Exporten üblich sind. Vor dem ersten echten Import mit einer Exportdatei des Studios abgleichen
und das Mapping (mapping_json) anpassen. Es werden keine proprietären Binärformate gelesen.
"""

import csv
import io
import json
import re
import xml.etree.ElementTree as ET

ZIELFELDER = (
    "pos_nr", "hersteller_artikelnr", "bezeichnung", "menge", "breite_mm", "hoehe_mm", "tiefe_mm",
    "marke", "lieferant", "kategorie", "raum", "ausfuehrung_text", "ek_cent", "vk_cent",
)
GELD = ("ek_cent", "vk_cent")
MASSE = ("breite_mm", "hoehe_mm", "tiefe_mm")

# Header-Synonyme (klein, ohne Sonderzeichen verglichen). Erweiterbar über mapping_json {"synonyme": {...}}.
SYNONYME = {
    "pos_nr": ["pos", "posnr", "position", "positionsnummer", "nr", "lfdnr"],
    "hersteller_artikelnr": ["artikelnr", "artikelnummer", "artnr", "typ", "typnr", "typennummer", "typenbezeichnung", "bestellnummer", "bestellnr", "modell", "herstellerartikelnr", "sku"],
    "bezeichnung": ["bezeichnung", "beschreibung", "text", "artikeltext", "kurztext", "artikel", "name", "langtext"],
    "menge": ["menge", "anzahl", "stk", "stueck", "stuck", "qty", "quantity"],
    "breite_mm": ["breite", "b", "breitemm", "width"],
    "hoehe_mm": ["hoehe", "hohe", "h", "hoehemm", "height"],
    "tiefe_mm": ["tiefe", "t", "tiefemm", "depth"],
    "marke": ["marke", "hersteller", "fabrikat", "manufacturer", "brand"],
    "lieferant": ["lieferant", "supplier", "lieferer"],
    "kategorie": ["kategorie", "warengruppe", "gruppe", "art", "category"],
    "raum": ["raum", "zimmer", "room", "bereich"],
    "ausfuehrung_text": ["ausfuehrung", "ausfuhrung", "front", "farbe", "dekor", "korpus", "variante", "option", "optionen"],
    "ek_cent": ["ek", "einkauf", "einkaufspreis", "ekpreis", "netto", "nettopreis", "einkaufnetto"],
    "vk_cent": ["vk", "verkauf", "verkaufspreis", "vkpreis", "preis", "brutto", "listenpreis", "einzelpreis", "price"],
}

REGISTRY = {}


class ImportFehler(ValueError):
    pass


class Ergebnis:
    def __init__(self, positionen=None, warnungen=None, spalten=None, zuordnung=None):
        self.positionen = positionen or []
        self.warnungen = warnungen or []
        self.spalten = spalten or []
        self.zuordnung = zuordnung or {}

    def als_dict(self):
        return {"positionen": self.positionen, "warnungen": self.warnungen, "spalten": self.spalten, "zuordnung": self.zuordnung, "anzahl": len(self.positionen)}


class Adapter:
    key = ""
    label = ""
    verifiziert = False
    hinweis = ""

    def lesen(self, inhalt, mapping=None):  # pragma: no cover – Schnittstelle
        raise NotImplementedError


def registrieren(cls):
    if not cls.key:
        raise ValueError("Adapter ohne key")
    REGISTRY[cls.key] = cls
    return cls


def adapter(key):
    cls = REGISTRY.get((key or "").strip().lower())
    if not cls:
        raise ImportFehler(f"Unbekanntes Importformat „{key}“. Verfügbar: {', '.join(sorted(REGISTRY))}")
    return cls()


def formate():
    return [{"key": k, "label": c.label, "verifiziert": bool(c.verifiziert), "hinweis": c.hinweis} for k, c in sorted(REGISTRY.items())]


# ── Hilfen ───────────────────────────────────────────────────────────────────

def _schluessel(text):
    t = (text or "").strip().lower()
    t = t.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z0-9]", "", t)


def text_dekodieren(inhalt):
    if isinstance(inhalt, str):
        return inhalt.lstrip("﻿")
    for kod in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            return inhalt.decode(kod)
        except UnicodeDecodeError:
            continue
    raise ImportFehler("Datei ist nicht als Text lesbar.")


def zahl(wert):
    """'1.234,56' / '1,234.56' / '1234,5' / '1 234' / '60 cm' → float oder None."""
    if wert is None:
        return None
    if isinstance(wert, (int, float)):
        return float(wert)
    s = str(wert).strip().replace(" ", "").replace(" ", "")
    s = re.sub(r"(€|eur|chf|mm|cm|m|stk\.?|x)$", "", s, flags=re.I)
    if not s or not re.search(r"\d", s):
        return None
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    elif "," in s:
        teile = s.split(",")
        s = s.replace(",", ".") if len(teile) == 2 and len(teile[1]) != 3 else s.replace(",", "")
    elif s.count(".") > 1:
        s = s.replace(".", "")
    try:
        return float(s)
    except ValueError:
        return None


def mass_mm(wert, einheit="mm"):
    """Maß in mm; Einheit aus Wert ('60 cm') oder Mapping (einheit_masse)."""
    if wert in (None, ""):
        return 0
    roh = str(wert).strip().lower()
    if roh.endswith("cm"):
        einheit = "cm"
    elif roh.endswith("mm"):
        einheit = "mm"
    elif re.search(r"\dm$", roh):
        einheit = "m"
    z = zahl(wert)
    if z is None:
        return 0
    faktor = {"mm": 1, "cm": 10, "m": 1000}.get(einheit, 1)
    return int(round(z * faktor))


def geld_cent(wert, einheit="euro"):
    z = zahl(wert)
    if z is None:
        return None
    return int(round(z)) if einheit == "cent" else int(round(z * 100))


def normalisieren(roh, mapping=None):
    """Rohzeile {zielfeld: wert} → normalisierte Position oder None (leere Zeile)."""
    mapping = mapping or {}
    einheit_masse = mapping.get("einheit_masse", "mm")
    einheit_geld = mapping.get("einheit_geld", "euro")
    p = {k: None for k in ZIELFELDER}
    for k in ZIELFELDER:
        v = roh.get(k)
        if isinstance(v, str):
            v = v.strip()
        p[k] = v if v not in ("",) else None
    if not (p["bezeichnung"] or p["hersteller_artikelnr"]):
        return None
    for k in MASSE:
        p[k] = mass_mm(p[k], einheit_masse)
    for k in GELD:
        p[k] = geld_cent(p[k], einheit_geld) if p[k] is not None else None
    menge = zahl(p["menge"])
    p["menge"] = max(1, int(round(menge))) if menge else 1
    for k in ("pos_nr", "hersteller_artikelnr", "bezeichnung", "marke", "lieferant", "kategorie", "raum", "ausfuehrung_text"):
        p[k] = (str(p[k]).strip()[:140] if p[k] is not None else "") if k != "ausfuehrung_text" else (str(p[k]).strip()[:1000] if p[k] is not None else "")
    if not p["bezeichnung"]:
        p["bezeichnung"] = p["hersteller_artikelnr"]
    if mapping.get("raum_standard") and not p["raum"]:
        p["raum"] = mapping["raum_standard"]
    if mapping.get("marke_standard") and not p["marke"]:
        p["marke"] = mapping["marke_standard"]
    return p


def spalten_zuordnen(header, mapping=None):
    """Header-Liste → {zielfeld: spaltenindex}. Explizites mapping["spalten"] = {zielfeld: Spaltenname} hat Vorrang."""
    mapping = mapping or {}
    norm = [_schluessel(h) for h in header]
    zuordnung = {}
    for ziel, quelle in (mapping.get("spalten") or {}).items():
        if ziel not in ZIELFELDER:
            continue
        s = _schluessel(quelle)
        if s in norm:
            zuordnung[ziel] = norm.index(s)
    synonyme = {k: list(v) for k, v in SYNONYME.items()}
    for ziel, extra in (mapping.get("synonyme") or {}).items():
        synonyme.setdefault(ziel, []).extend(_schluessel(e) for e in extra)
    belegt = set(zuordnung.values())
    for ziel in ZIELFELDER:
        if ziel in zuordnung:
            continue
        for syn in synonyme.get(ziel, []):
            if syn in norm and norm.index(syn) not in belegt:
                zuordnung[ziel] = norm.index(syn)
                belegt.add(zuordnung[ziel])
                break
    return zuordnung


def trennzeichen(text):
    probe = "\n".join(text.splitlines()[:20])
    try:
        return csv.Sniffer().sniff(probe, delimiters=";,\t|").delimiter
    except csv.Error:
        zaehler = {d: probe.count(d) for d in ";,\t|"}
        return max(zaehler, key=zaehler.get) if any(zaehler.values()) else ";"


# ── Adapter ──────────────────────────────────────────────────────────────────

@registrieren
class CsvAdapter(Adapter):
    key = "csv"
    label = "CSV generisch (Spalten per Kopfzeile oder Mapping)"
    verifiziert = True
    hinweis = "Kopfzeile erforderlich; Trennzeichen ; , Tab | werden erkannt; Dezimalkomma und -punkt."
    extra_mapping = {}

    def lesen(self, inhalt, mapping=None):
        eigene = mapping or {}
        syn = {k: list(v) for k, v in (self.extra_mapping.get("synonyme") or {}).items()}
        for k, v in (eigene.get("synonyme") or {}).items():
            syn.setdefault(k, []).extend(v)
        mapping = {**self.extra_mapping, **eigene, "synonyme": syn}
        text = text_dekodieren(inhalt)
        if not text.strip():
            raise ImportFehler("Datei ist leer.")
        d = mapping.get("trennzeichen") or trennzeichen(text)
        zeilen = list(csv.reader(io.StringIO(text), delimiter=d))
        ueberspringen = int(mapping.get("kopf_zeile", 0) or 0)
        zeilen = zeilen[ueberspringen:]
        while zeilen and not any(c.strip() for c in zeilen[0]):
            zeilen.pop(0)
        if not zeilen:
            raise ImportFehler("Keine Kopfzeile gefunden.")
        header = [h.strip() for h in zeilen[0]]
        zuordnung = spalten_zuordnen(header, mapping)
        if "bezeichnung" not in zuordnung and "hersteller_artikelnr" not in zuordnung:
            raise ImportFehler("Spalte für Bezeichnung oder Artikelnummer nicht gefunden – bitte Mapping angeben.")
        erg = Ergebnis(spalten=header, zuordnung={k: header[i] for k, i in zuordnung.items()})
        for nr, z in enumerate(zeilen[1:], start=2):
            if not any(c.strip() for c in z):
                continue
            roh = {k: (z[i] if i < len(z) else None) for k, i in zuordnung.items()}
            p = normalisieren(roh, mapping)
            if p is None:
                erg.warnungen.append(f"Zeile {nr}: ohne Bezeichnung/Artikelnummer übersprungen.")
                continue
            erg.positionen.append(p)
        return erg


def _sicheres_xml(text):
    if re.search(r"<!DOCTYPE|<!ENTITY", text, flags=re.I):
        raise ImportFehler("XML mit DOCTYPE/ENTITY wird aus Sicherheitsgründen nicht gelesen.")
    try:
        return ET.fromstring(text.encode("utf-8") if isinstance(text, str) else text)
    except ET.ParseError as e:
        raise ImportFehler(f"XML nicht lesbar: {e}") from e


def _lokal(tag):
    return tag.split("}", 1)[-1] if isinstance(tag, str) else tag


def _wert(el, pfad):
    """pfad: 'Tag', 'Tag/Untertag', '@attr' oder 'Tag/@attr' (Namespaces werden ignoriert)."""
    if not pfad:
        return None
    teile = pfad.split("/")
    knoten = el
    for i, t in enumerate(teile):
        if t.startswith("@"):
            name = t[1:].lower()
            for k, v in knoten.attrib.items():
                if _lokal(k).lower() == name:
                    return v
            return None
        treffer = next((c for c in knoten if _lokal(c.tag).lower() == t.lower()), None)
        if treffer is None:
            return None
        knoten = treffer
    return (knoten.text or "").strip() if knoten is not None else None


@registrieren
class XmlAdapter(Adapter):
    key = "xml"
    label = "XML generisch (Positions-Tag und Feldpfade per Mapping)"
    verifiziert = True
    hinweis = "mapping_json: {\"position\": \"Artikel\", \"felder\": {\"bezeichnung\": \"Text\", \"menge\": \"@Menge\"}}"
    extra_mapping = {}

    def lesen(self, inhalt, mapping=None):
        mapping = {**self.extra_mapping, **(mapping or {})}
        wurzel = _sicheres_xml(text_dekodieren(inhalt))
        pos_tag = (mapping.get("position") or "").lower()
        felder = mapping.get("felder") or {}
        if not pos_tag:
            raise ImportFehler("Mapping fehlt: Name des Positions-Tags („position“).")
        knoten = [e for e in wurzel.iter() if _lokal(e.tag).lower() == pos_tag]
        erg = Ergebnis(spalten=sorted({_lokal(c.tag) for k in knoten[:5] for c in k} | {"@" + _lokal(a) for k in knoten[:5] for a in k.attrib}), zuordnung=dict(felder))
        if not knoten:
            erg.warnungen.append(f"Kein Element <{mapping.get('position')}> gefunden.")
        for nr, el in enumerate(knoten, start=1):
            roh = {}
            for ziel in ZIELFELDER:
                pfade = felder.get(ziel)
                if isinstance(pfade, str):
                    pfade = [pfade]
                for pf in pfade or []:
                    w = _wert(el, pf)
                    if w not in (None, ""):
                        roh[ziel] = w
                        break
            p = normalisieren(roh, mapping)
            if p is None:
                erg.warnungen.append(f"Element {nr}: ohne Bezeichnung/Artikelnummer übersprungen.")
                continue
            erg.positionen.append(p)
        return erg


UNVERIFIZIERT = "UNVERIFIZIERT – Vorlage aus üblichen Spaltennamen; vor dem ersten Import mit einer echten Exportdatei abgleichen und Mapping anpassen."


@registrieren
class CaratCsvAdapter(CsvAdapter):
    key = "carat_csv"
    label = "CARAT – Positions-/Bestellliste als CSV (Vorlage)"
    verifiziert = False
    hinweis = UNVERIFIZIERT
    extra_mapping = {"synonyme": {"hersteller_artikelnr": ["typ", "typnummer", "typenbez"], "bezeichnung": ["artikeltext", "typentext"], "vk_cent": ["vkpreis", "summe"]}}


@registrieren
class KpsCsvAdapter(CsvAdapter):
    key = "kps_csv"
    label = "KPS – Stückliste als CSV (Vorlage)"
    verifiziert = False
    hinweis = UNVERIFIZIERT
    extra_mapping = {"synonyme": {"hersteller_artikelnr": ["artikelcode", "code"], "bezeichnung": ["artikelbezeichnung"]}}


@registrieren
class WinnerXmlAdapter(XmlAdapter):
    key = "winner_xml"
    label = "Winner – Auftrags-/Artikelexport als XML (Vorlage)"
    verifiziert = False
    hinweis = UNVERIFIZIERT
    extra_mapping = {
        "position": "Article",
        "felder": {
            "pos_nr": ["@Position", "Position"],
            "hersteller_artikelnr": ["@Code", "Code", "ArticleNumber"],
            "bezeichnung": ["Description", "@Description", "Name"],
            "menge": ["@Quantity", "Quantity"],
            "breite_mm": ["@Width", "Width"],
            "hoehe_mm": ["@Height", "Height"],
            "tiefe_mm": ["@Depth", "Depth"],
            "marke": ["Manufacturer", "@Manufacturer"],
            "vk_cent": ["Price", "@Price"],
        },
    }


def mapping_lesen(mapping_json):
    if not mapping_json:
        return {}
    if isinstance(mapping_json, dict):
        return mapping_json
    try:
        m = json.loads(mapping_json)
    except ValueError as e:
        raise ImportFehler("Mapping ist kein gültiges JSON.") from e
    if not isinstance(m, dict):
        raise ImportFehler("Mapping muss ein JSON-Objekt sein.")
    return m


def vorschau(format_key, inhalt, mapping_json=None, limit=200):
    a = adapter(format_key)
    erg = a.lesen(inhalt, mapping_lesen(mapping_json))
    out = erg.als_dict()
    out["positionen"] = out["positionen"][:limit]
    out.update(format=a.key, label=a.label, verifiziert=bool(a.verifiziert), hinweis=a.hinweis)
    if not a.verifiziert:
        out["warnungen"].insert(0, a.hinweis)
    out["summe_vk_cent"] = sum((p["vk_cent"] or 0) * p["menge"] for p in erg.positionen)
    return out


@registrieren
class PconCsvAdapter(CsvAdapter):
    key = "pcon_csv"
    label = "pCon.basket – Artikelliste als CSV (Vorlage)"
    verifiziert = False
    hinweis = UNVERIFIZIERT
    extra_mapping = {"synonyme": {
        "hersteller_artikelnr": ["articlenumber", "basearticlenumber", "artnr"],
        "bezeichnung": ["kurztext", "shorttext", "shortdescription"],
        "ausfuehrung_text": ["variantentext", "varianttext", "variantcode", "merkmale"],
        "marke": ["manufacturer", "manufacturerid"],
        "vk_cent": ["salesprice"],
        "ek_cent": ["purchaseprice"],
    }}


@registrieren
class PconObxAdapter(XmlAdapter):
    key = "pcon_obx"
    label = "pCon.basket – OBX-Export (XML, Vorlage)"
    verifiziert = False
    hinweis = UNVERIFIZIERT
    extra_mapping = {
        "position": "artItem",
        "felder": {
            "pos_nr": ["@itemNo", "itemNo"],
            "hersteller_artikelnr": ["artNr", "@artNr", "baseArtNr"],
            "bezeichnung": ["shortText", "artText", "text"],
            "ausfuehrung_text": ["varText", "variantText"],
            "menge": ["@quantity", "quantity", "qty"],
            "marke": ["@manufacturer", "manufacturer", "mfr"],
            "vk_cent": ["salesPrice", "price"],
            "ek_cent": ["purchasePrice"],
        },
    }


# ── Änderungsabgleich Re-Import ↔ vorhandene Positionen ─────────────────────

VERGLEICHSFELDER = ("bezeichnung", "menge", "ausfuehrung_text", "breite_mm", "hoehe_mm", "tiefe_mm", "raum", "vk_cent", "ek_cent", "marke", "kategorie")


def _wert_alt(p, k):
    """Feld einer vorhandenen Position (dict oder Kindzeile); vk_cent heißt dort preis_cent."""
    get = p.get if isinstance(p, dict) else (lambda f, d=None: getattr(p, f, d))
    if k == "vk_cent":
        v = get("vk_cent")
        return v if v is not None else get("preis_cent")
    return get(k)


def abgleich_schluessel(p):
    """Schlüssel: pos_nr + hersteller_artikelnr; ohne beides die Bezeichnung (klein)."""
    pos = str(_wert_alt(p, "pos_nr") or "").strip()
    art = str(_wert_alt(p, "hersteller_artikelnr") or "").strip().upper()
    if pos or art:
        return f"{pos}|{art}"
    return "txt|" + str(_wert_alt(p, "bezeichnung") or "").strip().lower()


def _norm(v):
    if v in (None, "", 0):
        return None
    return str(v).strip()


def ist_bestellt(p):
    status = _wert_alt(p, "lieferstatus") or "offen"
    return bool(_wert_alt(p, "herstellerbestellung")) or status not in ("offen", "storniert", "")


def abgleich(alt, neu):
    """Vorhandene Planungspositionen (alt; stornierte zählen nicht) gegen Re-Import (neu, normalisiert).
    → {neu:[p], geaendert:[{name, schluessel, felder:{feld:[alt, neu]}, neu:p, bestellt}],
       entfallen:[{name, schluessel, bezeichnung, bestellt, projekt_zeile}], unveraendert:int}"""
    aktiv = [a for a in alt if not int(_wert_alt(a, "storniert") or 0)]
    nach_schluessel = {}
    for a in aktiv:
        nach_schluessel.setdefault(abgleich_schluessel(a), []).append(a)
    erg = {"neu": [], "geaendert": [], "entfallen": [], "unveraendert": 0}
    gesehen = set()
    for p in neu:
        k = abgleich_schluessel(p)
        kandidaten = [a for a in nach_schluessel.get(k, []) if id(a) not in gesehen]
        if not kandidaten:
            erg["neu"].append(p)
            continue
        a = kandidaten[0]
        gesehen.add(id(a))
        felder = {}
        for f in VERGLEICHSFELDER:
            if f in ("ek_cent", "vk_cent") and p.get(f) is None:
                continue
            if _norm(_wert_alt(a, f)) != _norm(p.get(f)):
                felder[f] = [_wert_alt(a, f), p.get(f)]
        if felder:
            erg["geaendert"].append({"name": _wert_alt(a, "name"), "schluessel": k, "felder": felder, "neu": p, "bestellt": ist_bestellt(a), "projekt_zeile": _wert_alt(a, "projekt_zeile")})
        else:
            erg["unveraendert"] += 1
    for a in aktiv:
        if id(a) not in gesehen:
            erg["entfallen"].append({"name": _wert_alt(a, "name"), "schluessel": abgleich_schluessel(a), "bezeichnung": _wert_alt(a, "bezeichnung"), "bestellt": ist_bestellt(a), "projekt_zeile": _wert_alt(a, "projekt_zeile"), "preis_cent": _wert_alt(a, "vk_cent"), "menge": _wert_alt(a, "menge")})
    return erg
