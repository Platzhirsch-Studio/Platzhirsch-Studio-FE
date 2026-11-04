"""Website-API von ph_sortiment – lesend, guest, **gleiche Antwortform wie heute** (platzhirsch_studio).

Die Website tauscht nur den Methodenpfad (src/lib/api/fetchAllProdukte.js, fetchMarkenData.js,
fetchKategorien.js, fetchSubKategorien.js, fetchFarben.js, fetchMaterialien.js, fetchCollections.js):

  heute  …doctype.produkte_new.api.get_produkte_by_kategorie      → ph_sortiment.api.get_produkte_by_kategorie
         …produkte_new.api.get_produkte_by_marke_api              → ph_sortiment.api.get_produkte_by_marke_api
         …produkte_new.api.search_produkte                        → ph_sortiment.api.search_produkte
         …produkte_new.api.get_all_kategorien                     → ph_sortiment.api.get_all_kategorien
         …produkte_new.api.get_kategorien_by_marke                → ph_sortiment.api.get_kategorien_by_marke
         …produkte_new.api.get_collections                        → ph_sortiment.api.get_collections
         …produkte_new.api.get_produkt_by_path_field_api          → ph_sortiment.api.get_produkt_by_path_field_api
         …produkte_new.api.get_produkte_paths                     → ph_sortiment.api.get_produkte_paths
         …produkte_new.api.related_products                       → ph_sortiment.api.related_products
         …marken.api.marken_data                                  → ph_sortiment.api.marken_data
         …produkte_kategorie.api.get_all_kategorien_api           → ph_sortiment.api.get_all_kategorien_api
         …sub_kategorie.api.get_all_sub_kategorien_api            → ph_sortiment.api.get_all_sub_kategorien_api
         …produkte_farbe.api.get_all_farben_api                   → ph_sortiment.api.get_all_farben_api
         …produkte_material.api.get_all_materialien_api           → ph_sortiment.api.get_all_materialien_api
  neu    get_preise(slugs) (Shop: Preise mit Stand, nur freigegeben/aktuell), get_katalog_version()

Feldnamen der Antworten sind die alten: name, produkt_name, path_field, url_slug, marken, kategories,
status ("Aktiv"), collection, designer, modified, bild_anhangen[{bild_anhangen}], pdf_produkte[{pdf}],
additional_information[{dimensions, gewicht}], beschreibung/_en/_fr/_it, mehr_beschreibung/…,
metadata_title_<l>, metadata_description_<l>; Marken: name, name1, logo, status, produkte/_en/…,
bild_anhagen, es_gibt_produkte, grundungsjahr, herkunftsland, website; Kategorie: name, category_key,
image, name_de…, alt_text_de…, produkt_count; Sub Kategorie: category_key, kategorie, name_*;
Farbe: color_key, name_*, hex_code; Material: material_key, name_*.

Nur Aktiv + website_sichtbar. Cache 1 h (frappe.cache, Schlüssel ph_sortiment:api:*), wird bei jeder
Änderung geleert (ereignisse.api_cache_leeren). Versionierung: jede Antwort setzt ETag und
X-PH-Katalog-Version; If-None-Match → 304. Nur GET, keine personenbezogenen Daten.
"""

import hashlib
import json

import frappe
from frappe.utils import cint, nowdate

from ph_sortiment.logik.preise import ab_preis_cent, gueltiger_preis

L = ("de", "en", "fr", "it")
SUFFIX = {"de": "", "en": "_en", "fr": "_fr", "it": "_it"}
MASS_LABEL = {"laenge": "Länge", "breite": "Breite", "hoehe": "Höhe", "tiefe": "Tiefe", "sitzhoehe": "Sitzhöhe", "lehnenhoehe": "Lehnenhöhe", "sitztiefe": "Sitztiefe", "durchmesser": "Durchmesser", "gewicht": "Gewicht", "abmessung": "Abmessung", "nische": "Nische"}
PRODUKT_FELDER = ["name", "name_herstellerbezeichnung", "slug", "marke", "kategorie", "status", "collection", "designer", "modified", "bild_hauptbild", "welt", "bereich", "aktueller_preis_cent", "aktueller_preis_stand", "preisart", "verkauf_online"]
AKTIV = {"status": "Aktiv", "website_sichtbar": 1}


# ── Cache und Versionierung ────────────────────────────────────────────────

def katalog_version():
    v = frappe.cache().get_value("ph_sortiment:api:version")
    if not v:
        v = (frappe.db.get_value("PH Produkt", {}, "max(modified)") or nowdate()).__str__().replace("-", "").replace(":", "").replace(" ", "")[:14]
        frappe.cache().set_value("ph_sortiment:api:version", v)
    return str(v)


def _gecacht(schluessel, fn):
    from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import einstellungen

    key = f"ph_sortiment:api:{schluessel}"
    cache = frappe.cache()
    wert = cache.get_value(key)
    if wert is None:
        wert = fn()
        cache.set_value(key, wert, expires_in_sec=int(einstellungen()["api_cache_sekunden"] or 3600))
    return _mit_etag(wert)


def _mit_etag(wert):
    """ETag/Version-Header setzen; bei passendem If-None-Match 304 ohne Body."""
    try:
        etag = '"' + hashlib.sha1((katalog_version() + json.dumps(wert, default=str, sort_keys=True)).encode()).hexdigest()[:20] + '"'
        anfrage_etag = (getattr(frappe.local, "request", None) and frappe.local.request.headers.get("If-None-Match")) or ""
        frappe.local.response["headers"] = {**(frappe.local.response.get("headers") or {}), "ETag": etag, "X-PH-Katalog-Version": katalog_version(), "Cache-Control": "public, max-age=300"}
        if anfrage_etag and anfrage_etag == etag:
            frappe.local.response["http_status_code"] = 304
            return None
    except Exception:  # noqa: BLE001 – Header sind Komfort, nie Fehlerquelle
        pass
    return wert


# ── Abbildung PH Produkt → „Produkte New“-Form ─────────────────────────────

def _bild(url):
    return url or ""


def _karte(p):
    """Kartenform (Listen): wie get_produkte_by_kategorie heute (erstes Bild als bild_anhangen[0])."""
    return {
        "name": p["name"],
        "produkt_name": p["name_herstellerbezeichnung"],
        "path_field": p["slug"],
        "url_slug": p["slug"],
        "marken": p["marke"],
        "kategories": p["kategorie"],
        "status": p["status"],
        "collection": p.get("collection") or "",
        "designer": p.get("designer") or "",
        "modified": str(p["modified"]),
        "bild_anhangen": [{"bild_anhangen": _bild(p["bild_hauptbild"])}] if p.get("bild_hauptbild") else [],
        "preis": _preis_kurz(p),
    }


def _preis_kurz(p):
    if not p.get("aktueller_preis_cent"):
        return None
    return {"ab_cent": cint(p["aktueller_preis_cent"]), "stand": str(p.get("aktueller_preis_stand") or ""), "art": p.get("preisart"), "online": cint(p.get("verkauf_online"))}


def _detail(doc, lang="de"):
    """Detailform: wie get_produkt_by_path_field_api heute (Kindtabellen + Sprachfelder)."""
    d = _karte(doc.as_dict())
    bilder = sorted([b for b in doc.bilder if b.freigabe == "erteilt"], key=lambda b: (b.reihenfolge or 0, b.idx))
    d["bild_anhangen"] = [{"bild_anhangen": b.bild, "alt": b.get(f"alt_{lang}") or b.alt_de or "", "typ": b.typ, "width": b.breite, "height": b.hoehe} for b in bilder]
    d["pdf_produkte"] = [{"pdf": x.datei, "art": x.art, "sprache": x.sprache, "bezeichnung": x.bezeichnung} for x in doc.dokumente]
    masse = [m for m in doc.masse if m.key != "gewicht"]
    gewicht = next((m.wert for m in doc.masse if m.key == "gewicht"), "")
    d["additional_information"] = [{"dimensions": ", ".join(f"{MASS_LABEL.get(m.key, m.key)}: {m.wert}" for m in masse), "gewicht": gewicht}] if masse or gewicht else []
    for loc in L:
        s = SUFFIX[loc]
        d[f"beschreibung{s}"] = f"<p>{frappe.utils.escape_html(doc.get(f'kurz_{loc}') or doc.kurz_de or '')}</p>" if (doc.get(f"kurz_{loc}") or doc.kurz_de) else ""
        d[f"mehr_beschreibung{s}"] = doc.get(f"beschreibung_{loc}") or doc.beschreibung_de or ""
        d[f"metadata_title_{loc}"] = doc.get(f"seo_title_{loc}") or f"{doc.marke} {doc.name_herstellerbezeichnung}"
        d[f"metadata_description_{loc}"] = doc.get(f"seo_description_{loc}") or doc.get(f"kurz_{loc}") or ""
    d["merkmale"] = [{"de": m.text_de, "en": m.text_en or m.text_de, "fr": m.text_fr or m.text_de, "it": m.text_it or m.text_de, "gruppe": m.gruppe} for m in doc.merkmale]
    d["masse"] = [{"key": m.key, "wert": m.wert} for m in doc.masse]
    d["serie"], d["hersteller_url"], d["welt"], d["bereich"], d["stand"] = doc.serie, doc.hersteller_url, doc.welt, doc.bereich, str(doc.stand or "")
    d["kategorien_weitere"] = [k.kategorie for k in doc.kategorien_weitere]
    d["zubehoer"] = [{"slug": z.produkt, "hinweis": z.get(f"hinweis_{lang}") or z.hinweis_de} for z in doc.zubehoer]
    d["verwandt"] = [v.produkt for v in doc.verwandt]
    d["ausfuehrungen"] = _ausfuehrungen(doc, lang)
    d["modell_3d"] = [{"glb": m.glb, "usdz": m.usdz, "massstab": m.massstab} for m in doc.modell_3d]
    d["lieferzeit"] = _lieferzeit(doc, lang)
    d["preise"] = _preise(doc)
    d["shop"] = {"verkauf_online": cint(doc.verkauf_online), "reservierung_online": cint(doc.reservierung_online), "ust_klasse": doc.ust_klasse, "zerbrechlich": cint(doc.zerbrechlich), "gewicht_g": doc.gewicht_g, "pakettyp": doc.pakettyp, "grundpreis": {"menge": doc.grundpreis_menge, "einheit": doc.grundpreis_einheit} if doc.grundpreis_menge else None, "versand_gesperrt_grund": doc.versand_gesperrt_grund or None}
    return d


def _ausfuehrungen(doc, lang):
    optionen = frappe.get_all("PH Produkt Ausfuehrung", filters={"produkt": doc.name, "status": "Aktiv"}, fields=["name", "gruppe_key", "option_id", f"name_{lang} as bezeichnung", "name_de", "code", "farbe_hex", "bild", "standard", "aufpreis_cent", "preis_cent", "sku", "reihenfolge"], order_by="reihenfolge asc, name asc")
    out = []
    for g in sorted(doc.ausfuehrungen, key=lambda x: (x.reihenfolge or 0, x.idx)):
        out.append({
            "gruppe": g.gruppe_key,
            "name": g.get(f"gruppe_{lang}") or g.gruppe_de,
            "pflicht": cint(g.pflicht),
            "optionen": [{"id": o.option_id, "name": o.bezeichnung or o.name_de, "code": o.code, "farbe": o.farbe_hex, "bild": o.bild, "standard": cint(o.standard), "aufpreis_cent": cint(o.aufpreis_cent), "preis_cent": cint(o.preis_cent) or None, "sku": o.sku, "ref": o.name} for o in optionen if o.gruppe_key == g.gruppe_key],
        })
    return out


def _lieferzeit(doc, lang):
    """Nur freigegebene Angaben (src/lib/shop/lieferzeit.js: live nur mit Freigabe), sonst null → „auf Anfrage“."""
    if not doc.lieferzeit_freigegeben:
        return None
    return {"wochen_von": doc.lieferzeit_wochen_von, "wochen_bis": doc.lieferzeit_wochen_bis, "text": doc.get(f"lieferzeit_text_{lang}") or doc.lieferzeit_text_de, "sofort_lieferbar": cint(doc.sofort_lieferbar), "freigabe": {"datum": str(doc.lieferzeit_freigabe_datum or ""), "durch": doc.lieferzeit_freigabe_durch}}


def _preise(doc):
    """Gültige Preise je Ausführung (Cent, Stand, Art, Quelle) – nur freigegeben und nicht veraltet."""
    from ph_sortiment.ph_sortiment.doctype.ph_sortiment_einstellungen.ph_sortiment_einstellungen import max_monate

    mm = max_monate()
    heute = nowdate()
    if frappe.db.get_value("PH Marke", doc.marke, "preise_pausiert_grund"):
        return {"pausiert": True, "ab_cent": None, "varianten": []}
    varianten = []
    for ausf in sorted({(z.ausfuehrung or "") for z in doc.preise}):
        z = gueltiger_preis(doc.preise, heute, ausf or None, mm)
        if z and (z.ausfuehrung or "") == ausf:
            varianten.append({"ausfuehrung": ausf or None, "name": z.variante_name or None, "cent": cint(z.brutto_cent), "art": z.preisart, "stand": str(z.stand), "gueltig_bis": str(z.gueltig_bis or ""), "waehrung": z.waehrung or "EUR", "sku": z.sku or None, "quelle": z.quelle, "zusatz": {loc: z.get(f"zusatz_{loc}") for loc in L} if z.zusatz_de else None})
    return {"pausiert": False, "ab_cent": ab_preis_cent(doc.preise, heute, mm), "varianten": varianten}


def _kategorie(k, count=None):
    d = {"name": k["name"], "category_key": k["key"], "image": k.get("bild") or "", "kategorie": k.get("uebergeordnet") or None, "welt": k.get("welt") or ""}
    for loc in L:
        d[f"name_{loc}"] = k.get(f"label_{loc}") or k.get("label_de")
        d[f"alt_text_{loc}"] = k.get(f"alt_{loc}") or d[f"name_{loc}"]
    if count is not None:
        d["produkt_count"] = count
    return d


# ── Produkte ────────────────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_produkte_by_kategorie(kategories=None, limit=500):
    if not kategories:
        return []

    def laden():
        direkt = frappe.get_all("PH Produkt", filters={**AKTIV, "kategorie": kategories}, fields=PRODUKT_FELDER, order_by="modified desc", limit=cint(limit))
        weitere = frappe.get_all("PH Produkt Kategorie", filters={"kategorie": kategories, "parenttype": "PH Produkt"}, pluck="parent")
        namen = {p["name"] for p in direkt}
        if weitere:
            direkt += frappe.get_all("PH Produkt", filters={**AKTIV, "name": ("in", [w for w in weitere if w not in namen])}, fields=PRODUKT_FELDER)
        return [_karte(p) for p in direkt]

    return _gecacht(f"kat:{kategories}:{limit}", laden)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_produkte_by_marke_api(marken=None, limit=1000):
    if not marken:
        return []
    return _gecacht(f"marke:{marken}:{limit}", lambda: [_karte(p) for p in frappe.get_all("PH Produkt", filters={**AKTIV, "marke": marken}, fields=PRODUKT_FELDER, order_by="modified desc", limit=cint(limit))])


@frappe.whitelist(allow_guest=True, methods=["GET"])
def search_produkte(q=None, limit=6):
    q = (q or "").strip()
    if len(q) < 2:
        return []
    limit = min(cint(limit) or 6, 50)

    def laden():
        like = f"%{q}%"
        starts = frappe.get_all("PH Produkt", filters={**AKTIV, "name_herstellerbezeichnung": ("like", f"{q}%")}, fields=PRODUKT_FELDER, order_by="modified desc", limit=limit)
        rest = []
        if len(starts) < limit:
            rest = frappe.get_all("PH Produkt", filters=AKTIV, or_filters=[["name_herstellerbezeichnung", "like", like], ["marke", "like", like], ["titel", "like", like], ["collection", "like", like]], fields=PRODUKT_FELDER, order_by="modified desc", limit=limit * 2)
        gesehen, out = set(), []
        for p in starts + rest:
            if p["name"] in gesehen:
                continue
            gesehen.add(p["name"])
            out.append(_karte(p))
            if len(out) >= limit:
                break
        return out

    return _gecacht(f"such:{q.lower()}:{limit}", laden)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_produkt_by_path_field_api(path_field=None, lang="de"):
    if not path_field:
        return {}
    lang = lang if lang in L else "de"

    def laden():
        name = frappe.db.get_value("PH Produkt", {"slug": path_field, **AKTIV}, "name")
        if not name:
            return {}
        return _detail(frappe.get_doc("PH Produkt", name), lang)

    return _gecacht(f"detail:{path_field}:{lang}", laden)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_produkte_paths():
    return _gecacht("paths", lambda: [{"path_field": p["slug"], "kategories": p["kategorie"], "modified": str(p["modified"]), "marken": p["marke"], "welt": p["welt"]} for p in frappe.get_all("PH Produkt", filters={**AKTIV, "kategorie": ("!=", "")}, fields=["slug", "kategorie", "modified", "marke", "welt"], order_by="modified desc", limit=10000)])


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_produkt_paths():
    """Alias (PLAN.md nennt get_produkt_paths)."""
    return get_produkte_paths()


@frappe.whitelist(allow_guest=True, methods=["GET"])
def related_products(marken=None, kategories=None, currentProductPath=None, limit=3):
    if not marken:
        return []
    limit = min(cint(limit) or 3, 24)

    def laden():
        gleiche = frappe.get_all("PH Produkt", filters={**AKTIV, "marke": marken, "kategorie": kategories or "", "slug": ("!=", currentProductPath or "")}, fields=PRODUKT_FELDER, order_by="modified desc", limit=limit)
        if len(gleiche) < limit:
            gleiche += frappe.get_all("PH Produkt", filters={**AKTIV, "marke": marken, "kategorie": ("!=", kategories or ""), "slug": ("!=", currentProductPath or "")}, fields=PRODUKT_FELDER, order_by="modified desc", limit=limit - len(gleiche))
        out = []
        for p in gleiche[:limit]:
            k = _karte(p)
            k["bild_anhangen"] = _bild(p["bild_hauptbild"])  # heute: flacher String (fetchRelatedProdukteNew)
            out.append(k)
        return out

    return _gecacht(f"related:{marken}:{kategories}:{currentProductPath}:{limit}", laden)


# ── Kategorien, Collections ───────────────────────────────────────────────

def _zaehlung(filters=None):
    rows = frappe.get_all("PH Produkt", filters={**AKTIV, **(filters or {})}, fields=["kategorie", "count(name) as n"], group_by="kategorie")
    return {r.kategorie: r.n for r in rows if r.kategorie}


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_all_kategorien():
    """Kategorien mit mindestens einem aktiven Produkt, inkl. produkt_count (Produkte-Hub)."""

    def laden():
        z = _zaehlung()
        out = []
        for k in frappe.get_all("PH Kategorie", filters={"status": "Aktiv", "website_sichtbar": 1, "name": ("in", list(z) or [""])}, fields=["*"], order_by="sortierung asc, label_de asc"):
            out.append(_kategorie(k, z.get(k["name"], 0)))
        return out

    return _gecacht("kategorien:counts", laden)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_kategorien_by_marke(marken=None):
    if not marken:
        return []

    def laden():
        z = _zaehlung({"marke": marken})
        out = []
        for k in frappe.get_all("PH Kategorie", filters={"status": "Aktiv", "name": ("in", list(z) or [""])}, fields=["*"], order_by="sortierung asc, label_de asc"):
            d = _kategorie(k, z.get(k["name"], 0))
            bild = frappe.db.get_value("PH Produkt", {**AKTIV, "marke": marken, "kategorie": k["name"], "bild_hauptbild": ("!=", "")}, "bild_hauptbild", order_by="modified desc")
            d["image"] = bild or d["image"]
            out.append(d)
        return out

    return _gecacht(f"kategorien:marke:{marken}", laden)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_all_kategorien_api():
    """Alle Hauptkategorien (CMS-Kacheln, auch ohne Produkte) – heute produkte_kategorie.api."""
    return _gecacht("kategorien:alle", lambda: [_kategorie(k) for k in frappe.get_all("PH Kategorie", filters={"status": "Aktiv", "website_sichtbar": 1, "uebergeordnet": ("in", ["", None])}, fields=["*"], order_by="sortierung asc, label_de asc")])


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_all_sub_kategorien_api():
    def laden():
        out = []
        for k in frappe.get_all("PH Kategorie", filters={"status": "Aktiv", "uebergeordnet": ("!=", "")}, fields=["*"], order_by="sortierung asc, label_de asc"):
            d = _kategorie(k)
            d["kategorie"] = frappe.db.get_value("PH Kategorie", k["uebergeordnet"], "key") or k["uebergeordnet"]
            out.append(d)
        return out

    return _gecacht("kategorien:sub", laden)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_collections(marken=None):
    if not marken:
        return []

    def laden():
        rows = frappe.get_all("PH Produkt", filters={**AKTIV, "marke": marken, "collection": ("!=", "")}, fields=["collection", "count(name) as produkt_count", "max(bild_hauptbild) as image"], group_by="collection", order_by="collection asc")
        return [{"name": r.collection, "produkt_count": r.produkt_count, "image": r.image or ""} for r in rows]

    return _gecacht(f"collections:{marken}", laden)


# ── Marken, Merkmale ──────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=True, methods=["GET"])
def marken_data():
    def laden():
        out = []
        for m in frappe.get_all("PH Marke", filters={"website_sichtbar": 1}, fields=["name", "marke", "slug", "logo", "status", "bild_anhagen", "es_gibt_produkte", "produkte_anzahl", "gruendungsjahr", "land", "website", "welt", "haendlerstatus", "haendler_wortlaut", "preisart", "preise_pausiert_grund", "sortierung", "modified", "kurz_de", "kurz_en", "kurz_fr", "kurz_it", "story_de", "story_en", "story_fr", "story_it", "produkte_text_de", "produkte_text_en", "produkte_text_fr", "produkte_text_it"], order_by="sortierung asc, marke asc"):
            d = {
                "name": m.name, "name1": m.marke, "slug": m.slug, "logo": m.logo or "", "status": m.status,
                "bild_anhagen": m.bild_anhagen or "", "es_gibt_produkte": cint(m.es_gibt_produkte), "produkt_count": cint(m.produkte_anzahl),
                "grundungsjahr": m.gruendungsjahr, "herkunftsland": m.land or "", "website": m.website or "", "welt": m.welt or "",
                # Händlerstatus: Website-Claim-Guard entscheidet weiterhin selbst (claims.js); hier nur Information.
                "haendlerstatus": m.haendlerstatus, "haendler_wortlaut": m.haendler_wortlaut or None, "dealer": m.haendlerstatus in ("Haendler", "Vertragshaendler", "Exklusiv", "Partner"),
                "preisart": m.preisart, "preise_pausiert": bool(m.preise_pausiert_grund), "modified": str(m.modified),
                "produkte": m.produkte_text_de or "", "produkte_en": m.produkte_text_en or "", "produkte_fr": m.produkte_text_fr or "", "produkte_it": m.produkte_text_it or "",
            }
            for loc in L:
                d[f"kurz_{loc}"] = m.get(f"kurz_{loc}") or ""
                d[f"story_{loc}"] = m.get(f"story_{loc}") or ""
            out.append(d)
        return out

    return _gecacht("marken", laden)


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_marken():
    return marken_data()


def _merkmale(gruppen, key_feld, extra=None):
    rows = frappe.get_all("PH Merkmal", filters={"status": "Aktiv", "gruppe": ("in", gruppen)}, fields=["name", "merkmal", "key", "gruppe", "farbe_hex", "bild", "label_de", "label_en", "label_fr", "label_it"], order_by="label_de asc")
    out = []
    for r in rows:
        d = {"name": r.name, key_feld: r.key or r.name, "gruppe": r.gruppe, "image": r.bild or ""}
        for loc in L:
            d[f"name_{loc}"] = r.get(f"label_{loc}") or r.merkmal
        if extra:
            d.update(extra(r))
        out.append(d)
    return out


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_all_farben_api():
    return _gecacht("farben", lambda: _merkmale(["Farbe"], "color_key", lambda r: {"hex_code": r.farbe_hex or ""}))


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_all_materialien_api():
    return _gecacht("materialien", lambda: _merkmale(["Material", "Oberflaeche", "Stoff", "Leder", "Holz"], "material_key"))


# ── Neu: Preise mit Stand für den Shop, Version ───────────────────────────

@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_preise(slugs=None):
    """Shop (src/lib/shop/catalog.js): gültige Verkaufspreise je Slug – nur freigegeben, nicht veraltet, nicht pausiert."""
    if isinstance(slugs, str):
        try:
            slugs = json.loads(slugs)
        except ValueError:
            slugs = [s for s in slugs.split(",") if s]
    slugs = [str(s)[:140] for s in (slugs or [])][:100]
    if not slugs:
        return {}

    def laden():
        out = {}
        for name in frappe.get_all("PH Produkt", filters={**AKTIV, "slug": ("in", slugs)}, pluck="name"):
            doc = frappe.get_doc("PH Produkt", name)
            out[doc.slug] = {**_preises_fuer_shop(doc), "ust_klasse": doc.ust_klasse, "verkauf_online": cint(doc.verkauf_online), "zerbrechlich": cint(doc.zerbrechlich), "gewicht_g": doc.gewicht_g, "pakettyp": doc.pakettyp, "marke": doc.marke, "kategorie": doc.kategorie, "lieferzeit": _lieferzeit(doc, "de")}
        return out

    return _gecacht("preise:" + hashlib.sha1(",".join(sorted(slugs)).encode()).hexdigest()[:16], laden)


def _preises_fuer_shop(doc):
    p = _preise(doc)
    p["varianten"] = [v for v in p["varianten"] if v["art"] in ("Verkaufspreis", "Angebot")]
    p["ab_cent"] = min([v["cent"] for v in p["varianten"]], default=None)
    return p


@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_katalog_version():
    """Versionsstempel des Katalogs (ändert sich bei jeder Produkt-/Marken-/Kategorieänderung) für Website-Cache und ETag."""
    return _mit_etag({"version": katalog_version(), "produkte_aktiv": frappe.db.count("PH Produkt", AKTIV), "marken_aktiv": frappe.db.count("PH Marke", {"status": "Aktiv", "website_sichtbar": 1})})
