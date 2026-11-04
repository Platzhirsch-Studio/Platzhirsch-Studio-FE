"""Abbildung des statischen Herstellerkatalogs (src/lib/katalog/marken/*.js) auf PH Marke / PH Produkt.

Eingabe ist das JSON aus `tools/export_katalog.mjs` (liegt in dieser App; liest die Website-Dateien
unverändert ein und schreibt sie 1:1 als JSON). Struktur je Produkt wie schema.js KatalogProdukt:
slug, marke, bereich, welt, kategorie, name, serie, designer, kurz{de,en,fr,it}, merkmale[],
masse[{key,wert}], bilder[{src,width,height,alt,quelleUrl,abgerufen,typ}], herstellerUrl, quellen[],
stand, verwandt[], preis{art,uvpAb|betrag|varianten,stand,quelle,bezeichnung,zusatz}, ausfuehrungen[],
zubehoer[]. Die Marke: slug, name, welt, herstellerUrl, dealer, stand, querverweise, looks.

Minotti-Daten werden hier NICHT verarbeitet (nicht Teil des statischen Katalogs; Arbeitsregel).
Keine Frappe-Importe – testbar ohne Site (tests/test_katalog_mapping.py).
"""

from .preise import to_cent
from .slug import slug as mk_slug

LOCALES = ("de", "en", "fr", "it")
WELT_MAP = {"bad-wellness": "Bad-Wellness", "kuechengeraete": "Kueche", "accessoires": "Accessoires", "wohnen": "Wohnen", "outdoor": "Outdoor", "licht": "Licht"}
# Marken, deren Katalogdateien Verkaufspreise haben dürfen (schema.js PREIS_ARTEN.verkaufspreis.nurMarken)
VERKAUFSPREIS_MARKEN = ("baobab-collection", "riedel", "cire-trudon", "zalto", "assouline", "kahler", "lyngby-porcelaen", "flos", "tom-dixon", "spiegelau", "nachtmann")
# Marken ohne Preisanzeige trotz Daten (schema.js PREISE_PAUSIERT)
PREISE_PAUSIERT = {
    "assouline": "eu.assouline.com: kein MwSt.-Hinweis; Bücher in AT 10 % statt 20 %",
    "tom-dixon": "tomdixon.net/eu: kein ausdrücklicher MwSt.-Hinweis",
}
ERMAESSIGT_KATEGORIEN = ("bildband",)
GRUNDPREIS_KATEGORIEN = ("raumduft", "diffuser", "parfum")
ZERBRECHLICH_KATEGORIEN = ("glas", "karaffe", "vase", "geschirr", "wohnaccessoire", "geschenkset", "duftkerze", "tragbare-leuchte")


def text(v, locale="de"):
    if isinstance(v, str):
        return v
    if isinstance(v, dict):
        return v.get(locale) or v.get("de") or ""
    return ""


def _text4(prefix, v):
    return {f"{prefix}_{loc}": text(v, loc) for loc in LOCALES}


def bild_url(src, basis="https://platzhirsch.studio"):
    """Relativer Website-Pfad → absolute URL (Import lädt sie als File oder verweist darauf)."""
    if not src:
        return ""
    return src if src.startswith("http") else f"{basis.rstrip('/')}{src}"


def marke_doc(m, basis="https://platzhirsch.studio"):
    """KatalogMarke → PH Marke (ohne Händlervertrag; Händlerstatus nur aus dealer-Flag als „Haendler“)."""
    return {
        "doctype": "PH Marke",
        "marke": m["name"],
        "slug": m["slug"],
        "status": "Aktiv",
        "welt": WELT_MAP.get(m.get("welt"), ""),
        "website": m.get("herstellerUrl") or "",
        "stand": m.get("stand") or None,
        # Händlerstatus laut Website-Claim-Guard (claims.js VERIFIED_DEALER_BRANDS); Beleg trägt der Inhaber nach.
        "haendlerstatus": "Haendler" if m.get("dealer") else "Keiner",
        "haendler_wortlaut": "dealer" if m.get("dealer") else "",
        "preisart": "Verkaufspreis" if m["slug"] in VERKAUFSPREIS_MARKEN else ("UVP" if m.get("welt") == "kuechengeraete" else "Auf Anfrage"),
        "preise_pausiert_grund": PREISE_PAUSIERT.get(m["slug"], ""),
        "querverweise": "\n".join(f"{q.get('welt')}/{q.get('kategorie')}" for q in m.get("querverweise") or []),
        "website_sichtbar": 1,
        "import_quelle": "katalog",
    }


def kategorie_doc(key, label_de=None, bereiche=None, welt=None):
    return {
        "doctype": "PH Kategorie",
        "key": key,
        "label_de": label_de or key.replace("-", " ").capitalize(),
        "bereiche": ",".join(bereiche or []),
        "welt": welt or "",
        "ust_klasse": "ermaessigt" if key in ERMAESSIGT_KATEGORIEN else "normal",
        "grundpreis_pflicht": 1 if key in GRUNDPREIS_KATEGORIEN else 0,
        "zerbrechlich_standard": 1 if key in ZERBRECHLICH_KATEGORIEN else 0,
        "status": "Aktiv",
        "website_sichtbar": 1,
    }


def _bild_zeile(b, basis, reihenfolge, ausfuehrung=None):
    return {
        "bild": bild_url(b.get("src"), basis),
        "typ": b.get("typ") or "freisteller",
        **_text4("alt", b.get("alt")),
        "breite": b.get("width") or 0,
        "hoehe": b.get("height") or 0,
        "quelle_url": b.get("quelleUrl") or "",
        "abgerufen": b.get("abgerufen") or None,
        # Herstellerbilder der Katalogmarken: Bildfreigabe laut Inhaber (claims.js) – Beleg nachreichen,
        # daher „offen“; der Inhaber erteilt im Desk je Marke oder je Bild.
        "freigabe": "offen",
        "reihenfolge": reihenfolge,
        "ausfuehrung": ausfuehrung,
    }


def preis_zeilen(p):
    """KatalogPreis → Zeilen PH Produkt Preis (freigegeben = 1, weil Quelle und Stand belegt sind)."""
    pr = p.get("preis")
    if not pr:
        return []
    quelle = "Inhaber-Preisliste" if pr.get("quelle") == "Inhaber-Preisliste" else ("Herstellershop" if pr.get("art") == "verkaufspreis" else "Herstellerliste")
    basis = {"ab": pr.get("stand"), "stand": pr.get("stand"), "waehrung": "EUR", "quelle": quelle, "quelle_url": pr.get("quelle") if str(pr.get("quelle", "")).startswith("http") else "", "freigegeben": 1}
    if pr.get("art") == "uvp-ab":
        art = "Herstellerpreis" if pr.get("bezeichnung") == "herstellerpreis" else "UVP"
        return [{**basis, "preisart": art, "brutto_cent": to_cent(pr.get("uvpAb")), **_text4("zusatz", pr.get("zusatz"))}]
    out = []
    if pr.get("betrag") is not None:
        out.append({**basis, "preisart": "Verkaufspreis", "brutto_cent": to_cent(pr["betrag"])})
    for v in pr.get("varianten") or []:
        out.append({**basis, "preisart": "Verkaufspreis", "brutto_cent": to_cent(v.get("betrag")), "variante_name": text(v.get("name")), "sku": v.get("sku") or "", "ausfuehrung": None, "_variante_id": v.get("id")})
    return out


def ausfuehrung_docs(p):
    """KatalogAusfuehrung[] → (Gruppenzeilen, Optionsdokumente PH Produkt Ausfuehrung)."""
    gruppen, optionen = [], []
    for gi, g in enumerate(p.get("ausfuehrungen") or []):
        gk = mk_slug(text(g.get("gruppe")))
        gruppen.append({"gruppe_key": gk, "gruppe_de": text(g.get("gruppe"), "de"), "gruppe_en": text(g.get("gruppe"), "en"), "gruppe_fr": text(g.get("gruppe"), "fr"), "gruppe_it": text(g.get("gruppe"), "it"), "pflicht": 1, "reihenfolge": gi})
        for oi, o in enumerate(g.get("optionen") or []):
            bilder = [b for b in o.get("bilder") or [] if isinstance(b, dict)]
            optionen.append({
                "doctype": "PH Produkt Ausfuehrung",
                "produkt": p["slug"],
                "gruppe_key": gk,
                "option_id": o.get("id"),
                **_text4("name", o.get("name")),
                "code": o.get("code") or "",
                "farbe_hex": o.get("farbe") or "",
                "standard": 1 if o.get("standard") else 0,
                "reihenfolge": oi,
                "preis_cent": to_cent(o.get("betrag")) if o.get("betrag") is not None else None,
                "bild": bild_url(bilder[0]["src"]) if bilder else (bild_url(o["bilder"][0]) if o.get("bilder") and isinstance(o["bilder"][0], str) else ""),
                "status": "Aktiv",
            })
    return gruppen, optionen


def produkt_doc(p, marke_name, kategorie_key=None, basis="https://platzhirsch.studio"):
    """KatalogProdukt → PH Produkt (Status Entwurf; Freigabe im Desk). Nebenprodukte: Ausführungen (eigene Docs)."""
    gruppen, optionen = ausfuehrung_docs(p)
    masse = p.get("masse") or []
    bilder = [_bild_zeile(b, basis, i) for i, b in enumerate(p.get("bilder") or [])]
    merkmale = []
    for m in p.get("merkmale") or []:
        de = text(m, "de")
        gruppe = de.split(":", 1)[0].strip() if ":" in de and de.split(":", 1)[0].strip() in ("Duftfamilie", "Material") else ""
        merkmale.append({"text_de": de, "text_en": text(m, "en"), "text_fr": text(m, "fr"), "text_it": text(m, "it"), "gruppe": gruppe})
    doc = {
        "doctype": "PH Produkt",
        "slug": p["slug"],
        "url_slug": p["slug"],
        "name_herstellerbezeichnung": p["name"],
        "marke": marke_name,
        "kategorie": kategorie_key or p.get("kategorie"),
        "welt": WELT_MAP.get(p.get("welt"), ""),
        "bereich": p.get("bereich") or "",
        "serie": p.get("serie") or "",
        "designer": p.get("designer") or "",
        "hersteller_url": p.get("herstellerUrl") or "",
        "quellen": "\n".join(p.get("quellen") or []),
        "stand": p.get("stand") or None,
        "ausgewaehlt": 1 if p.get("ausgewaehlt") else 0,
        "status": "Entwurf",
        "typ": "Accessoire" if p.get("bereich") == "accessoires" else "Katalog",
        **_text4("kurz", p.get("kurz")),
        **{f"beschreibung_{loc}": ("<ul>" + "".join(f"<li>{text(m, loc)}</li>" for m in p.get("merkmale") or []) + "</ul>") if p.get("merkmale") else "" for loc in LOCALES},
        "merkmale": merkmale,
        "masse": [{"key": m["key"], "wert": m["wert"]} for m in masse if m.get("key") and m.get("wert")],
        "bilder": bilder,
        "ausfuehrungen": gruppen,
        "zubehoer": [{"produkt": z["slug"], **_text4("hinweis", z.get("hinweis"))} for z in p.get("zubehoer") or [] if z.get("slug")],
        "verwandt": [{"produkt": s} for s in p.get("verwandt") or []],
        "preisart": "Verkaufspreis" if (p.get("preis") or {}).get("art") == "verkaufspreis" else ("UVP" if p.get("preis") else "Auf Anfrage"),
        "preise": [{k: v for k, v in z.items() if not k.startswith("_")} for z in preis_zeilen(p)],
        "ust_klasse": "ermaessigt" if p.get("kategorie") in ERMAESSIGT_KATEGORIEN else "normal",
        "zerbrechlich": 1 if p.get("kategorie") in ZERBRECHLICH_KATEGORIEN or any(v.get("zerbrechlich") for v in (p.get("preis") or {}).get("varianten") or []) else 0,
        "verkauf_online": 1 if (p.get("preis") or {}).get("art") == "verkaufspreis" and p.get("marke") not in PREISE_PAUSIERT else 0,
        "gewicht_g": gewicht_g(p),
        "website_sichtbar": 1,
        "import_quelle": "katalog",
        **{f"seo_description_{loc}": text(p.get("kurz"), loc)[:300] for loc in LOCALES},
    }
    return doc, optionen


def gewicht_g(p):
    """Versandgewicht aus der ersten Preis-Variante mit versandGewichtG (nur Herstellerangaben)."""
    for v in (p.get("preis") or {}).get("varianten") or []:
        if v.get("versandGewichtG"):
            return int(v["versandGewichtG"])
    return 0


def kategorien_aus_katalog(katalog):
    """Alle Kategorien-Schlüssel (mit Bereichen) aus dem Export: {key: {bereiche:set, welten:set}}."""
    out = {}
    for k, bereiche in (katalog.get("kategorien") or {}).items():
        out.setdefault(k, {"bereiche": set(), "welten": set()})["bereiche"].update(bereiche)
    for p in katalog.get("produkte") or []:
        e = out.setdefault(p["kategorie"], {"bereiche": set(), "welten": set()})
        e["bereiche"].add(p.get("bereich"))
        e["welten"].add(WELT_MAP.get(p.get("welt"), ""))
    return out
