"""Preislisten-Formate: Hersteller-CSV, DataNorm 4, XML (IDM-Preset) → einheitliche Zeilen mit Cent.

Reine Logik ohne Frappe (Tests: ph_sortiment/tests/test_preislisten_format.py). Der Controller
PH Preisliste Import ruft `lesen(...)`, ordnet über `zuordnen(...)` Produkte zu und zeigt die
Vorschau. Einheitliche Zeile:

    {"zeile": 3, "artikelnr": "4711", "bezeichnung": "…", "preis_cent": 129000, "ean": "…",
     "ausfuehrung": "…", "preiseinheit": 1, "einheit": "Stk", "preiskennzeichen": "brutto|netto|",
     "rabattgruppe": "…", "warengruppe": "…"}

Grenzen (ehrlich markiert):
  - DataNorm 4.0: A-Satz (Artikel) und P-Satz (Preisänderung) nach der veröffentlichten
    Satzbeschreibung umgesetzt. **Mit echter Lieferantendatei verifizieren**, bevor Preise
    übernommen werden (Feldpositionen variieren je Erzeuger, v. a. im P-Satz).
  - IDM (DCC, Küche/Wohnen) ist ein umfangreiches XML-Format; hier gibt es nur einen
    konfigurierbaren XML-Mapping-Adapter mit Preset `IDM_PRESET` (**unverifiziert** – Tags mit
    einer echten IDM-Datei des Herstellers abgleichen und als Mapping beim Lieferanten speichern).
"""

import csv
import io
import re
import xml.etree.ElementTree as ET
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

FORMATE = ("Auto", "CSV", "DataNorm", "IDM-XML", "XML")
ZIELFELDER = ("artikelnr", "bezeichnung", "preis", "ean", "ausfuehrung", "preiseinheit", "einheit", "rabattgruppe", "warengruppe")

# Spaltenkopf (klein, ohne Sonderzeichen) → Zielfeld. Erste passende Spalte gewinnt.
SYNONYME = {
    "artikelnr": ["hersteller_artikelnr", "artikelnr", "artikelnummer", "artnr", "art_nr", "sku", "typenummer", "typ_nr", "type_no", "item_no", "itemno", "bestellnummer", "bestellnr", "modellnr", "referenz", "ref"],
    "bezeichnung": ["bezeichnung", "name", "artikelbezeichnung", "beschreibung", "kurztext", "description", "text", "modell"],
    "preis": ["neu_cent", "neu", "preis", "vk", "uvp", "listenpreis", "bruttopreis", "brutto", "ek", "einkaufspreis", "nettopreis", "netto", "price", "preis_eur"],
    "ean": ["ean", "gtin", "ean13", "barcode"],
    "ausfuehrung": ["ausfuehrung", "ausführung", "variante", "farbe", "stoff", "bezug", "oberflaeche", "option", "option_id"],
    "preiseinheit": ["preiseinheit", "pe", "price_unit"],
    "einheit": ["einheit", "mengeneinheit", "me", "unit"],
    "rabattgruppe": ["rabattgruppe", "rg", "discount_group"],
    "warengruppe": ["warengruppe", "wg", "hauptwarengruppe", "kategorie"],
}

# DataNorm Preiseinheit-Schlüssel → Stückzahl, auf die sich der Preis bezieht
DATANORM_PREISEINHEIT = {"0": 1, "1": 10, "2": 100, "3": 1000, "": 1}
# DataNorm Preiskennzeichen: 1 = Bruttopreis (Listenpreis), 2 = Nettopreis (Einkauf)
DATANORM_PREISKZ = {"1": "brutto", "2": "netto"}

# Unverifiziert: Platzhalter-Tags nach öffentlich bekannten IDM-Strukturen; vor Nutzung prüfen.
IDM_PRESET = {
    "verifiziert": False,
    "artikel": "ITEM",
    "artikelnr": "@TYPE_NO",
    "bezeichnung": "ITEM_TEXT/SHORT_TEXT",
    "preis": "PRICE/@VALUE",
    "ausfuehrung": "@FEATURE",
    "ean": "@EAN",
    "dezimal": ".",
}

MAX_ZEICHEN = 20_000_000  # 20 MB Text – größere Listen bitte aufteilen


class FormatFehler(ValueError):
    pass


def _norm_kopf(k):
    k = (k or "").strip().lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z0-9]+", "_", k).strip("_")


def dekodieren(roh, kodierung=None):
    """bytes → (text, kodierung). Ohne Vorgabe: UTF-8 (mit BOM), sonst cp1252 (Windows-Export)."""
    if isinstance(roh, str):
        return roh.lstrip("﻿"), kodierung or "utf-8"
    if kodierung and kodierung != "Auto":
        return roh.decode(kodierung, errors="replace").lstrip("﻿"), kodierung
    try:
        return roh.decode("utf-8-sig"), "utf-8"
    except UnicodeDecodeError:
        return roh.decode("cp1252", errors="replace"), "cp1252"


def trennzeichen_erkennen(probe):
    """; , Tab | – das häufigste Zeichen der ersten Zeilen (außerhalb von Anführungszeichen grob)."""
    zeilen = [z for z in probe.splitlines()[:10] if z.strip()]
    if not zeilen:
        return ";"
    kandidaten = [";", "\t", ",", "|"]
    zaehl = {t: sum(z.count(t) for z in zeilen) for t in kandidaten}
    beste = max(kandidaten, key=lambda t: (zaehl[t], -kandidaten.index(t)))
    return beste if zaehl[beste] else ";"


def dezimal_erkennen(werte):
    """',' oder '.' anhand von Beispielwerten ('1.234,56' / '12,5' → ',')."""
    komma = punkt = 0
    for w in werte:
        s = str(w or "").strip().replace("€", "").replace(" ", "")
        if not s:
            continue
        if re.fullmatch(r"-?\d{1,3}(\.\d{3})+(,\d+)?", s) or re.fullmatch(r"-?\d+,\d{1,2}", s):
            komma += 1
        elif re.fullmatch(r"-?\d{1,3}(,\d{3})+(\.\d+)?", s) or re.fullmatch(r"-?\d+\.\d{1,2}", s):
            punkt += 1
    return "," if komma >= punkt and komma else ("." if punkt else ",")


def betrag_cent(wert, dezimal=","):
    """'1.234,56' (dezimal ',') → 123456; '1234.56' (dezimal '.') → 123456; leer → None."""
    s = str(wert or "").strip().replace("€", "").replace("EUR", "").replace(" ", "").replace(" ", "")
    if not s:
        return None
    if dezimal == ",":
        s = s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", "")
    try:
        return int((Decimal(s) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    except InvalidOperation:
        return None


def _int(v, standard=1):
    try:
        return int(str(v).strip())
    except (TypeError, ValueError):
        return standard


def mapping_aus_kopf(kopf, mapping=None):
    """Spaltenkopf → {zielfeld: spaltenname}. Ein Mapping-JSON ({zielfeld: spalte}) hat Vorrang."""
    ergebnis = {}
    norm = {_norm_kopf(k): k for k in kopf if k is not None}
    for ziel, spalte in (mapping or {}).items():
        if ziel in ZIELFELDER and spalte:
            treffer = spalte if spalte in kopf else norm.get(_norm_kopf(spalte))
            if treffer:
                ergebnis[ziel] = treffer
    for ziel in ZIELFELDER:
        if ziel in ergebnis:
            continue
        for syn in SYNONYME[ziel]:
            if syn in norm and norm[syn] not in ergebnis.values():
                ergebnis[ziel] = norm[syn]
                break
    return ergebnis


def _zeile(nr, artikelnr, preis_cent, **extra):
    z = {"zeile": nr, "artikelnr": (artikelnr or "").strip(), "preis_cent": preis_cent, "bezeichnung": "", "ean": "", "ausfuehrung": "", "preiseinheit": 1, "einheit": "", "preiskennzeichen": "", "rabattgruppe": "", "warengruppe": ""}
    z.update({k: (v.strip() if isinstance(v, str) else v) for k, v in extra.items() if v not in (None,)})
    return z


def csv_lesen(text, mapping=None, trennzeichen=None, dezimal=None):
    """Hersteller-CSV → {zeilen, fehler, mapping, trennzeichen, dezimal}. Preis je Stück (Preiseinheit geteilt).

    Spalte `neu_cent` (Altformat der Vorlage) wird als Cent gelesen, alle anderen Preisspalten als Euro.
    """
    trennzeichen = trennzeichen if trennzeichen and trennzeichen != "Auto" else trennzeichen_erkennen(text[:4000])
    if trennzeichen == "\\t":
        trennzeichen = "\t"
    reader = csv.DictReader(io.StringIO(text), delimiter=trennzeichen)
    kopf = reader.fieldnames or []
    zuordnung = mapping_aus_kopf(kopf, mapping)
    if "artikelnr" not in zuordnung or "preis" not in zuordnung:
        raise FormatFehler("Spalten für Artikelnummer und Preis nicht gefunden (Kopf: {0}). Mapping angeben.".format(", ".join(k for k in kopf if k)))
    roh = list(reader)
    preis_spalte = zuordnung["preis"]
    in_cent = _norm_kopf(preis_spalte) == "neu_cent"
    if not dezimal or dezimal == "Auto":
        dezimal = dezimal_erkennen([r.get(preis_spalte) for r in roh[:200]])
    zeilen, fehler = [], []
    for i, r in enumerate(roh, start=2):
        def wert(feld):
            sp = zuordnung.get(feld)
            return (r.get(sp) or "").strip() if sp else ""

        nr = wert("artikelnr")
        if not nr:
            continue
        p = wert("preis")
        cent = _int(p, None) if in_cent else betrag_cent(p, dezimal)
        if cent is None:
            fehler.append((i, "Preis „{0}“ nicht lesbar".format(p)))
            continue
        pe = _int(wert("preiseinheit") or 1, 1) or 1
        zeilen.append(_zeile(i, nr, int(round(cent / pe)), bezeichnung=wert("bezeichnung"), ean=wert("ean"), ausfuehrung=wert("ausfuehrung"), preiseinheit=pe, einheit=wert("einheit"), rabattgruppe=wert("rabattgruppe"), warengruppe=wert("warengruppe")))
    return {"zeilen": zeilen, "fehler": fehler, "mapping": zuordnung, "trennzeichen": trennzeichen, "dezimal": dezimal}


def datanorm_lesen(text):
    """DataNorm 4.0 (Semikolon-Format) → {zeilen, fehler, waehrung, kopf}.

    A-Satz: A;Kennz;Artikelnr;Textkennz;Kurztext1;Kurztext2;Preiskennz;Preiseinheit;Mengeneinheit;Preis;Rabattgruppe;Warengruppe;Langtextschluessel
    P-Satz: P;A;{Artikelnr;Preiskennz;Preis;Rabattkennz;Rabatt1;Rabatt2;Rabatt3}×bis zu 3
    Preis ohne Komma in Cent; Preiseinheit 0=1, 1=10, 2=100, 3=1000 Stück.
    Spätere P-Sätze überschreiben A-Preise derselben Artikelnummer.
    MIT ECHTER LIEFERANTENDATEI VERIFIZIEREN (Feldfolge je Erzeuger prüfen).
    """
    zeilen, fehler, kopf, waehrung = {}, [], {}, "EUR"
    pe_je_art = {}
    for nr, roh in enumerate(text.splitlines(), start=1):
        if not roh.strip():
            continue
        f = roh.rstrip("\r\n").split(";")
        art = f[0].strip().upper()
        if art == "V":
            kopf = {"datum": f[1].strip() if len(f) > 1 else "", "info": ";".join(x.strip() for x in f[2:5] if x.strip())}
            if any(x.strip().upper() in ("EUR", "CHF") for x in f):
                waehrung = next(x.strip().upper() for x in f if x.strip().upper() in ("EUR", "CHF"))
        elif art == "A":
            if len(f) < 10:
                fehler.append((nr, "A-Satz zu kurz ({0} Felder)".format(len(f))))
                continue
            if f[1].strip().upper() == "L":  # Löschsatz
                continue
            artnr = f[2].strip()
            preis = _int(f[9], None)
            if not artnr or preis is None:
                fehler.append((nr, "A-Satz ohne Artikelnummer oder Preis"))
                continue
            pe = DATANORM_PREISEINHEIT.get(f[7].strip(), 1)
            pe_je_art[artnr] = pe
            zeilen[artnr] = _zeile(nr, artnr, int(round(preis / pe)), bezeichnung=" ".join(x.strip() for x in f[4:6] if x.strip()), preiseinheit=pe, einheit=f[8].strip(), preiskennzeichen=DATANORM_PREISKZ.get(f[6].strip(), ""), rabattgruppe=f[10].strip() if len(f) > 10 else "", warengruppe=f[11].strip() if len(f) > 11 else "")
        elif art == "P":
            rest = f[2:]
            for i in range(0, len(rest), 7):
                gruppe = rest[i:i + 7]
                if len(gruppe) < 3 or not gruppe[0].strip():
                    continue
                artnr, kz, preis = gruppe[0].strip(), gruppe[1].strip(), _int(gruppe[2], None)
                if preis is None:
                    fehler.append((nr, "P-Satz {0}: Preis nicht lesbar".format(artnr)))
                    continue
                pe = pe_je_art.get(artnr, 1)
                alt = zeilen.get(artnr)
                if alt:
                    alt.update(preis_cent=int(round(preis / pe)), preiskennzeichen=DATANORM_PREISKZ.get(kz, alt["preiskennzeichen"]), zeile=nr)
                else:
                    zeilen[artnr] = _zeile(nr, artnr, preis, preiskennzeichen=DATANORM_PREISKZ.get(kz, ""))
        # B (Rabatt), T (Text), D (Dimension) u. a. werden für Preise nicht gebraucht
    return {"zeilen": list(zeilen.values()), "fehler": fehler, "waehrung": waehrung, "kopf": kopf}


def _ohne_ns(tag):
    return tag.split("}", 1)[-1] if isinstance(tag, str) else tag


def _xml_wert(el, pfad):
    """'@ATTR' | 'KIND/ENKEL' | 'KIND/@ATTR' | '.' (Text) relativ zum Artikel-Element, ohne Namespaces."""
    if not pfad:
        return ""
    teile = pfad.split("/")
    knoten = [el]
    for t in teile:
        if t.startswith("@"):
            for k in knoten:
                v = k.attrib.get(t[1:])
                if v is not None:
                    return v.strip()
            return ""
        if t == ".":
            continue
        knoten = [c for k in knoten for c in k if _ohne_ns(c.tag) == t]
        if not knoten:
            return ""
    return (knoten[0].text or "").strip()


def xml_lesen(text, mapping=None):
    """Konfigurierbarer XML-Adapter. mapping: {artikel: Tag der Artikel-Elemente, artikelnr/bezeichnung/
    preis/ean/ausfuehrung: Pfad, dezimal: ',' | '.'}. DTD/Entitäten sind aus Sicherheitsgründen verboten."""
    mapping = dict(mapping or IDM_PRESET)
    if re.search(r"<!(DOCTYPE|ENTITY)", text[:5000], re.I):
        raise FormatFehler("XML mit DOCTYPE/ENTITY wird nicht verarbeitet (Sicherheit).")
    try:
        wurzel = ET.fromstring(text)
    except ET.ParseError as e:
        raise FormatFehler("XML nicht lesbar: {0}".format(e)) from e
    tag = mapping.get("artikel") or "ITEM"
    dezimal = mapping.get("dezimal") or "."
    zeilen, fehler = [], []
    for i, el in enumerate((e for e in wurzel.iter() if _ohne_ns(e.tag) == tag), start=1):
        nr = _xml_wert(el, mapping.get("artikelnr"))
        if not nr:
            continue
        p = _xml_wert(el, mapping.get("preis"))
        cent = betrag_cent(p, dezimal)
        if cent is None:
            fehler.append((i, "Artikel {0}: Preis „{1}“ nicht lesbar".format(nr, p)))
            continue
        zeilen.append(_zeile(i, nr, cent, bezeichnung=_xml_wert(el, mapping.get("bezeichnung")), ean=_xml_wert(el, mapping.get("ean")), ausfuehrung=_xml_wert(el, mapping.get("ausfuehrung"))))
    return {"zeilen": zeilen, "fehler": fehler, "verifiziert": bool(mapping.get("verifiziert", True)), "mapping": mapping}


def format_erkennen(text):
    s = text.lstrip()[:200]
    if s.startswith("<"):
        return "XML"
    erste = s.split("\n", 1)[0].upper()
    if erste.startswith("V;") or erste.startswith("A;N;") or erste.startswith("A;A;"):
        return "DataNorm"
    return "CSV"


def lesen(inhalt, format="Auto", mapping=None, trennzeichen=None, kodierung=None, dezimal=None):
    """Einstieg: bytes/str → {format, kodierung, zeilen, fehler, hinweise[]}."""
    text, kod = dekodieren(inhalt, kodierung)
    if len(text) > MAX_ZEICHEN:
        raise FormatFehler("Datei zu groß – bitte aufteilen.")
    fmt = format if format and format != "Auto" else format_erkennen(text)
    hinweise = []
    if fmt == "CSV":
        e = csv_lesen(text, mapping, trennzeichen, dezimal)
    elif fmt == "DataNorm":
        e = datanorm_lesen(text)
        hinweise.append("DataNorm-Parser: Feldfolge mit echter Lieferantendatei verifizieren.")
    elif fmt in ("XML", "IDM-XML"):
        e = xml_lesen(text, mapping if mapping else (IDM_PRESET if fmt == "IDM-XML" else None))
        if not e.get("verifiziert"):
            hinweise.append("XML-Mapping unverifiziert (IDM-Preset) – Tags mit echter Herstellerdatei prüfen.")
    else:
        raise FormatFehler("Unbekanntes Format {0}".format(fmt))
    e.update({"format": fmt, "kodierung": kod, "hinweise": hinweise})
    return e


def _key(v):
    return re.sub(r"\s+", "", str(v or "")).upper()


def zuordnen(zeilen, nach_artikelnr, nach_ean=None, nach_sku=None):
    """Produkt je Zeile: Artikelnr. → EAN → Ausführungs-SKU. nach_*: {schluessel: produkt} bzw. SKU →
    (produkt, ausfuehrung). Setzt produkt, ausfuehrung, zuordnung ('artikelnr'|'ean'|'sku'|'')."""
    nach_artikelnr = {_key(k): v for k, v in (nach_artikelnr or {}).items()}
    nach_ean = {_key(k): v for k, v in (nach_ean or {}).items()}
    nach_sku = {_key(k): v for k, v in (nach_sku or {}).items()}
    for z in zeilen:
        z.setdefault("produkt", None)
        z.setdefault("ausfuehrung_name", None)
        z["zuordnung"] = ""
        if _key(z["artikelnr"]) in nach_sku:
            z["produkt"], z["ausfuehrung_name"] = nach_sku[_key(z["artikelnr"])]
            z["zuordnung"] = "sku"
        elif _key(z["artikelnr"]) in nach_artikelnr:
            z["produkt"], z["zuordnung"] = nach_artikelnr[_key(z["artikelnr"])], "artikelnr"
        elif z.get("ean") and _key(z["ean"]) in nach_ean:
            z["produkt"], z["zuordnung"] = nach_ean[_key(z["ean"])], "ean"
    return {"zugeordnet": sum(1 for z in zeilen if z["zuordnung"]), "ohne": sum(1 for z in zeilen if not z["zuordnung"])}
