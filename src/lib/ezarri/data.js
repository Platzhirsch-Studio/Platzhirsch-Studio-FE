// src/lib/ezarri/data.js – Lese-API für die Ezarri-Daten (alle Teams lesen nur hierüber).
//
// Quellen (Stand 28.10.2026, erfasst von https://www.ezarri.com/de, siehe
// Herstellermaterial/Ezarri/00-INDEX.md):
//   collections.json   21 Kollektionen + 3 Programme (Safe-Steps, Corner, Cove)
//   references.json    402 Referenzen (= Produktseiten bei Ezarri), 1,6 MB
//   gallery.json       1010 Galerie-Einträge (997 Bilder, 13 Videos)
//   configurator.json  201 Konfigurator-Mosaike, 7 Fugen, 20 Patterns
//   kombinationen.json 57 Rezepte („Übersicht · Kombination“) der Mix-, Cocktail-,
//                      Gold-, Fosfo- und Iridescent-Mosaike (QM Runde 2 P2-2)
//
// SERVER-ONLY: Die JSON-Dateien sind zusammen ca. 2,5 MB. Client-Komponenten
// bekommen nur schlanke Projektionen als Props (toReferenceCard,
// toGalleryCard, getConfiguratorPalette) – nie die Rohdaten.
//
// Regeln:
// - Jede Projektion trägt `quelle` (Ezarri-URL) bzw. `credit` mit; die
//   Oberfläche zeigt die Quellenangabe (config.js → ezarriCredit()).
// - `text_ezarri` / `beschreibung_en` sind Herstellertexte (meist englisch),
//   nur als Quelle für EIGENE Texte in copy.js, nie 1:1 ausgeben.
// - Keine Preise: Ezarri-Preisstufen (€/€€/€€€) sind bewusst nicht erfasst.
//
// Schreibrecht: Team A (Konzept §5). Teams B und C importieren nur.
import "server-only";
import COLLECTIONS from "./collections.json" with { type: "json" };
import REFERENCES from "./references.json" with { type: "json" };
import GALLERY from "./gallery.json" with { type: "json" };
import CONFIGURATOR from "./configurator.json" with { type: "json" };
import KOMBINATIONEN from "./kombinationen.json" with { type: "json" };
import MEASURED from "./konfigurator/measured-colors.json" with { type: "json" };
import { isSafe, matchesGallery, matchesReference } from "./facets.js";
import { compactImage, imageSources } from "./images.js";
import { EZARRI_LOCALES, EZARRI_WELT_LOCALES, ezarriInSitemap } from "./config.js";
import { TOOL_LOCALES } from "./konfigurator/intl.js";
import { EIGENE_TEXTE, computeMosaikIndex } from "./indexierung.js";

export const DATA_STAND = REFERENCES.stand;

// ---------------------------------------------------------------------------
// Indizes (einmal pro Server-Prozess)

const REF_BY_ID = new Map(REFERENCES.referenzen.map((r) => [r.id, r]));
const COL_BY_ID = new Map(COLLECTIONS.kollektionen.map((c) => [c.id, c]));
const KONF_BY_ID = new Map(CONFIGURATOR.mosaike.map((m) => [m.id, m]));
const GALLERY_BY_REF = new Map();
for (const g of GALLERY.projekte) {
  if (!g.referenz) continue;
  if (!GALLERY_BY_REF.has(g.referenz)) GALLERY_BY_REF.set(g.referenz, []);
  GALLERY_BY_REF.get(g.referenz).push(g);
}

/** Ezarri-Varianten-Slug ("dune?as-25") → eigene Referenz-ID oder null. */
function variantRefId(slug) {
  if (!slug) return null;
  const base = String(slug).split("?")[0];
  return REF_BY_ID.has(base) ? base : null;
}

// Bilder: images.js (rein). Karten tragen nur compactImage(), Komponenten rufen imageSources().
export { imageSources, compactImage };

// ---------------------------------------------------------------------------
// Kollektionen

/** Alle Kollektionen, optional nach Linie (Premium, Classic, Custom). */
export function getCollections({ linie } = {}) {
  return COLLECTIONS.kollektionen.filter((c) => !linie || c.linie === linie);
}

/** Eine Kollektion oder null. */
export function getCollection(id) {
  return COL_BY_ID.get(id) ?? null;
}

/** IDs aller Kollektionen (generateStaticParams, parseFilters known.kollektionen). */
export function getCollectionIds() {
  return COLLECTIONS.kollektionen.map((c) => c.id);
}

/** Programme Safe-Steps, Corner, Cove. */
export function getProgrammes() {
  return COLLECTIONS.programme;
}

/** Kollektionen, die nur noch im Datenblatt stehen (Topping, Vulcano) – nicht als bestellbar zeigen. */
export function getDiscontinuedCollections() {
  return COLLECTIONS.nicht_mehr_online;
}

/** Schlanke Kollektions-Karte für Übersichten. */
const FORMAT_REIHE = ["25mm", "50mm", "hexa"];

export function toCollectionCard(c) {
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    linie: c.linie,
    anzahl: c.anzahl_referenzen,
    // Anzeige-Reihenfolge einheitlich 25 → 50 → Hexa (Ezarri-Daten mischen die Reihenfolge)
    formate: [...(c.formate || [])].sort((a, b) => (FORMAT_REIHE.indexOf(a) + 1 || 9) - (FORMAT_REIHE.indexOf(b) + 1 || 9)),
    farbfamilien: c.farbfamilien || [],
    bild: compactImage(c.titelbild),
    quelle: c.quelle,
  };
}

// ---------------------------------------------------------------------------
// Referenzen (Mosaike, Safe-Steps, Corner, Cove)

/** Eine Referenz (voller Datensatz) oder null. Nur auf dem Server verwenden. */
export function getReference(id) {
  return REF_BY_ID.get(id) ?? null;
}

/** IDs aller Referenzen (generateStaticParams der Mosaik-Detailseiten). */
export function getReferenceIds() {
  return REFERENCES.referenzen.map((r) => r.id);
}

/** Varianten einer Referenz, aufgelöst auf eigene IDs (Format, Anti-Rutsch, Spezialteile). */
export function getVariants(ref) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  if (!r) return [];
  return (r.varianten || []).map((v) => ({
    gruppe: v.gruppe === "Anti-slip" ? "Anti-Rutsch" : v.gruppe,
    label: v.label,
    id: variantRefId(v.slug),
    safe: /safe|\?as-/i.test(`${v.label} ${v.slug}`),
    aktiv: Boolean(v.aktiv),
  }));
}

/** Corner/Cove-Teile zu einer Referenz (volle Datensätze). */
export function getSpecialPieces(ref) {
  return getVariants(ref)
    .filter((v) => v.gruppe === "Special Pieces" && v.id)
    .map((v) => getReference(v.id))
    .filter(Boolean);
}

/** Ähnliche Referenzen (Ezarri-Verknüpfung „aehnlich“, nur existierende). */
export function getSimilar(ref, limit = 4) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  return (r?.aehnlich || []).map(getReference).filter(Boolean).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Eignung und Projektbild (QM Runde 1, P1-3): zwei verschiedene Dinge.
//   Eignung   = laut Datenblatt (Cladding / Paving / Pools & Wellness) bzw.
//               Produktseiten-Reiter. Wand innen/außen schließt Bad- und
//               Küchenwand ein; „Wand innen“ fällt weg, wenn „Wand innen und
//               außen“ da ist. Privatpool/Öffentliches Bad sind keine Eignung,
//               sondern stammen aus Ezarris Galerie-Filter → Projektbild.
//   Projektbild = Ezarri zeigt die Referenz in einem Galerie-Projekt dieser Art.

/** Galerie-Einsätze, die als „Projektbild aus …“ gelten (Reihenfolge = Anzeige). */
export const PROJEKT_EINSAETZE = Object.freeze(["pool-privat", "pool-oeffentlich", "wellness", "bad", "kueche"]);
const NUR_GALERIE = new Set(["pool-privat", "pool-oeffentlich", "bad", "kueche"]);
const EIGNUNG_ORDER = ["wand-innen-aussen", "innenraum-deko", "boden", "boden-rutschhemmend", "stufen-kanten", "pool", "wellness", "bad", "kueche"];

/** Eignung einer Referenz (Einsatz-IDs aus facets.EINSATZ), dedupliziert. */
export function getEignung(ref) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  if (!r) return [];
  const s = new Set((r.einsatz || []).filter((e) => !NUR_GALERIE.has(e)));
  const wand = s.has("wand-innen-aussen") || s.has("innenraum-deko");
  if (s.has("wand-innen-aussen")) s.delete("innenraum-deko");
  if (wand) {
    s.add("bad");
    s.add("kueche");
  }
  return EIGNUNG_ORDER.filter((e) => s.has(e));
}

/** Arten der Ezarri-Projektbilder, in denen die Referenz zu sehen ist. */
export function getProjektEinsaetze(ref) {
  const id = typeof ref === "string" ? ref : ref?.id;
  const have = new Set((GALLERY_BY_REF.get(id) || []).flatMap((g) => g.einsatz || []));
  return PROJEKT_EINSAETZE.filter((e) => have.has(e));
}

/** Formatlabel der Referenz selbst (nicht der Familie), z. B. "50 mm" für Basalt 50. */
const OWN_FORMAT = { "25mm": { id: "25mm", label: "25mm" }, "50mm": { id: "50mm", label: "50 mm" }, Hexa: { id: "hexa", label: "Hexa" } };

/** Format-IDs dieser Referenz (25mm/50mm/hexa); ohne eigenes Format (Corner, Cove, Motive) leer. */
export function ownFormatIds(ref) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  const own = OWN_FORMAT[r?.format];
  return own ? [own.id] : [];
}

/** Verpackung im Format dieser Referenz (Basalt 50 → 50-mm-Werte, nicht die ersten der Familie). */
export function getOwnPackaging(ref) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  if (!r) return null;
  const own = OWN_FORMAT[r.format];
  const list = r.formate_verfuegbar || [];
  const hit = own && list.find((x) => x.label === own.label || x.label.replace(/\s/g, "") === own.label.replace(/\s/g, ""));
  return getPackaging(r, hit?.label);
}

/**
 * Schlanke Karte einer Referenz für Listen und Client-Inseln (ca. 0,6 KB, Bild als compactImage).
 * Enthält alles, was facets.matchesReference braucht.
 * `formate` = Format DIESER Referenz (QM P2-3/P2-4), `einsatz` = Eignung (getEignung),
 * `projekte` = Projektbild-Arten (getProjektEinsaetze), `n` = benannt (kein reiner Code).
 */
export function toReferenceCard(r) {
  if (!r) return null;
  const hatSpezialteile = (r.varianten || []).some((v) => v.gruppe === "Special Pieces" && variantRefId(v.slug));
  const bild = r.bilder?.mosaik?.[0] ?? r.bilder?.anwendung?.[0] ?? null;
  const projekte = getProjektEinsaetze(r.id);
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    kollektion: r.kollektion,
    kollektionName: COL_BY_ID.get(r.kollektion)?.name ?? r.kollektion,
    linie: r.linie,
    typ: r.typ,
    format: r.format,
    formate: ownFormatIds(r),
    farben: r.farben || [],
    farbfamilien: r.farbfamilien || [],
    einsatz: getEignung(r),
    projekte,
    bilder: GALLERY_BY_REF.get(r.id)?.length || 0,
    wasserfarbe: [].concat(r.wasserfarbe ?? []),
    oberflaeche: r.oberflaeche ?? null,
    safe: isSafe(r),
    hatSpezialteile,
    hex: r.konfigurator?.farbe_hex || null,
    mischbar: Boolean(r.konfigurator?.mischbar),
    imKonfigurator: Boolean(r.konfigurator),
    bild: compactImage(bild),
    quelle: r.quelle,
  };
}

let CARDS = null;
const cards = () => (CARDS ??= REFERENCES.referenzen.map(toReferenceCard));

/** Gefilterte Referenzen (volle Datensätze). Filter aus facets.parseFilters(). */
export function getReferences(filters = {}) {
  const list = cards();
  return REFERENCES.referenzen.filter((r, i) => matchesReference(list[i], filters));
}

/** Schlanker Index aller Referenzen (Karten) für die Filter-Insel (sofortiges Filtern im Browser). */
export function getReferenceIndex() {
  return cards();
}

/** Referenzen einer Kollektion (volle Datensätze, Reihenfolge wie bei Ezarri). */
export function getReferencesByCollection(collectionId) {
  const c = getCollection(collectionId);
  if (!c) return [];
  return (c.referenzen || []).map(getReference).filter(Boolean);
}

/**
 * Facetten mit Trefferzahl für eine Ergebnismenge (Karten).
 * Rückgabe: { farbfamilie: {blau: 12, …}, format: {...}, einsatz, wasser*, typ, linie, kollektion, safe, spezial }
 * (*wasser nach Rohwert, Abbildung auf IDs in facets.WASSERWIRKUNG).
 */
export function facetCounts(cards) {
  const out = { farbfamilie: {}, format: {}, einsatz: {}, wasserfarbe: {}, typ: {}, linie: {}, kollektion: {}, safe: 0, spezial: 0 };
  const inc = (bucket, key) => {
    if (key) bucket[key] = (bucket[key] || 0) + 1;
  };
  for (const c of cards) {
    c.farbfamilien.forEach((v) => inc(out.farbfamilie, v));
    c.formate.forEach((v) => inc(out.format, v));
    c.einsatz.forEach((v) => inc(out.einsatz, v));
    c.wasserfarbe.forEach((v) => inc(out.wasserfarbe, v));
    inc(out.typ, c.typ);
    inc(out.linie, c.linie);
    inc(out.kollektion, c.kollektion);
    if (c.safe) out.safe += 1;
    if (c.hatSpezialteile) out.spezial += 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Galerie

/** Schlanke Galerie-Karte. */
export function toGalleryCard(g) {
  if (!g) return null;
  return {
    id: g.id,
    typ: g.typ,
    video: g.video ?? null,
    referenz: g.referenz && REF_BY_ID.has(g.referenz) ? g.referenz : null,
    referenzName: g.referenz_name ?? null,
    kollektion: g.kollektion,
    einsatz: g.einsatz || [],
    wasserfarbe: [].concat(g.wasserfarbe ?? []),
    farbfamilien: g.farbfamilien || [],
    format: g.format || [],
    antirutsch: Boolean(g.antirutsch),
    special_piece: g.special_piece || [],
    bild: compactImage(g.bild),
    quelle: g.produkt_quelle || g.quelle,
  };
}

const isVideo = (g) => g.typ === "video";
// Produktaufnahmen (freigestellte Bögen, Studio-Details) sind keine Projektbilder:
// Ezarri-Dateinamen dsc…, cam…, mos-… und …-detalle (QM P1-2).
const PRODUKTAUFNAHME = /^anw-(dsc|cam\d|mos-)|detalle/i;
// Galerie-Reihenfolge: Projektbilder vor Produktaufnahmen, sonst wie bei Ezarri.
let GALLERY_PHOTOS = null;
const galleryPhotos = () =>
  (GALLERY_PHOTOS ??= [
    ...GALLERY.projekte.filter((g) => !isVideo(g) && !PRODUKTAUFNAHME.test(g.id)),
    ...GALLERY.projekte.filter((g) => !isVideo(g) && PRODUKTAUFNAHME.test(g.id)),
  ]);

/**
 * Galerie mit Filtern und echter Paginierung (?page=).
 * medien "foto" (Galerie-Seite, QM Runde 2 P2-4): nur Fotos, Projektbilder vor
 * Produktaufnahmen; Ezarris YouTube-Produktvideos sind keine Projekte → getGalleryVideos().
 * medien "alle" (Standard): alle 1010 Einträge in Ezarris Reihenfolge.
 * @returns {{items: object[], total: number, page: number, pages: number}}
 */
export function getGallery(filters = {}, { page = 1, perPage = 24, medien = "alle" } = {}) {
  const all = (medien === "foto" ? galleryPhotos() : GALLERY.projekte).filter((g) => matchesGallery(g, filters));
  const pages = Math.max(1, Math.ceil(all.length / perPage));
  const p = Math.min(Math.max(1, Number.parseInt(page, 10) || 1), pages);
  return { items: all.slice((p - 1) * perPage, p * perPage).map(toGalleryCard), total: all.length, page: p, pages };
}

/**
 * Ezarris Produktvideos (YouTube) als eigene Liste. Sie zeigen das Mosaik, kein
 * Projekt; deshalb zählen sie bei einem Einsatz-Filter nicht als Treffer (→ []).
 * Die übrigen Filter (Wasserfarbe, Kollektion, Farbe, Format …) gelten.
 */
export function getGalleryVideos(filters = {}) {
  if (filters.einsatz?.length) return [];
  return GALLERY.projekte.filter((g) => isVideo(g) && matchesGallery(g, filters)).map(toGalleryCard);
}

/**
 * Trefferzahl (nur Fotos) je Filteroption bei sonst gleichen Filtern, wie auf
 * /ezarri/mosaike: { einsatz: {id: n}, wasser: {…}, kollektion, farbfamilie, format, safe: n, spezial: n }.
 * @param {object} filters
 * @param {Record<string, string[]>} options IDs je Schlüssel
 */
export function galleryFacetCounts(filters = {}, options = {}) {
  const photos = galleryPhotos();
  const count = (probe) => photos.reduce((n, g) => n + (matchesGallery(g, probe) ? 1 : 0), 0);
  const out = {};
  for (const [key, ids] of Object.entries(options)) {
    out[key] = Object.fromEntries(ids.map((id) => [id, count({ ...filters, [key]: [id] })]));
  }
  out.safe = count({ ...filters, safe: true });
  out.spezial = count({ ...filters, spezial: true });
  return out;
}

/** Anwendungsbilder einer Referenz aus der Galerie (für die Detailseite). */
export function getGalleryForReference(refId, limit = 12) {
  return (GALLERY_BY_REF.get(refId) || []).slice(0, limit).map(toGalleryCard);
}

// ---------------------------------------------------------------------------
// Rezepte fertiger Mischungen (QM Runde 2 P2-2). Quelle: Ezarri-Produktseite,
// Block „Übersicht · Kombination“, Stand KOMBINATIONEN.stand; bei 25022-B ist
// die Produktseite unvollständig, dort gilt das Rezept aus Ezarris Konfigurator
// (basis "konfigurator"). Einzelfarben ohne eigene Ezarri-Produktseite (Kilauea,
// Teide, Etna, …) haben ref = null.

export const KOMBINATION_STAND = KOMBINATIONEN.stand;

/** Anzeigefarbe einer Referenz: Konfigurator-Hex, sonst gemessene Hauptfarbe, sonst null. */
function refHex(r) {
  return r?.konfigurator?.farbe_hex || MEASURED.farben?.[r?.id]?.[0]?.[0] || null;
}

/**
 * Rezept einer fertigen Mischung oder null.
 * @returns {null | {teile: Array<{name:string, anteil:number, ref:string|null, refName:string|null, hex:string|null, farbfamilie:string|null, bild:object|null, konfId:string|null, mischbar:boolean}>,
 *   quelle:string, basis:"produktseite"|"konfigurator", stand:string, konfigurierbar:boolean}}
 * konfigurierbar = alle Einzelfarben (max. 4) sind im Konfigurator einzeln mischbar.
 */
export function getKombination(ref) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  const k = r && KOMBINATIONEN.rezepte[r.id];
  if (!k) return null;
  const teile = k.kombination.map((p) => {
    const t = p.ref ? getReference(p.ref) : null;
    return {
      name: t?.code ?? p.name,
      anteil: p.anteil,
      ref: t ? t.id : null,
      refName: t?.name ?? null,
      hex: refHex(t),
      farbfamilie: t?.farbfamilien?.[0] ?? null,
      bild: compactImage(t?.bilder?.mosaik?.[0]),
      konfId: t?.konfigurator?.id ?? null,
      mischbar: Boolean(t?.konfigurator?.mischbar),
    };
  });
  const konfigurierbar = teile.length <= CONFIGURATOR.max_referenzen_je_mischung && teile.every((t) => t.konfId && t.mischbar);
  return { teile, quelle: k.quelle, basis: k.basis, stand: KOMBINATIONEN.stand, konfigurierbar };
}

/** IDs aller Referenzen mit Rezept (Tests, Sitemap-unabhängig). */
export function getKombinationIds() {
  return Object.keys(KOMBINATIONEN.rezepte);
}

// ---------------------------------------------------------------------------
// Konfigurator (Team B liest, Team C für Rechner/Anfrage)

/** Max. Anzahl Referenzen je Mischung (Ezarri: 4). */
export const MAX_MIX = CONFIGURATOR.max_referenzen_je_mischung;

/** Fugenfarben (7, mit Hex). */
export function getGrouts() {
  return CONFIGURATOR.fugen;
}

/** Patterns (20). */
export function getPatterns() {
  return CONFIGURATOR.patterns.map((p) => ({ ...p, bild: compactImage(p.bild), quelle: p.bild?.quelle ?? CONFIGURATOR.quelle }));
}

/**
 * Rezept einer fertigen Ezarri-Mischung: cf_mosaico "66;117;125" + mischanteil
 * "85;10;5" → [{mosaikId:"66", anteil:85}, …]. Ohne Rezept → null.
 * Anteile werden auf Summe 100 normiert (Rundung).
 */
export function parseRecipe(m) {
  if (!m?.cf_mosaico || !m?.mischanteil) return null;
  const ids = String(m.cf_mosaico).split(";").map((s) => s.trim());
  const parts = String(m.mischanteil).split(";").map((s) => Number.parseFloat(s));
  if (ids.length !== parts.length || parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  const sum = parts.reduce((a, b) => a + b, 0) || 1;
  return ids.map((mosaikId, i) => ({ mosaikId, anteil: Math.round((parts[i] / sum) * 100) }));
}

/** Ein Konfigurator-Mosaik oder null. */
export function getConfiguratorMosaic(id) {
  return KONF_BY_ID.get(String(id)) ?? null;
}

/**
 * Schlanke Palette für den Konfigurator-Client (alle 201 Mosaike, ohne Rohtexte).
 * `hex` fehlt bei 57 Mosaiken (Ezarri rendert sie aus Texturen) → Team B
 * ergänzt eine aus dem Vorschaubild gemessene Farbe (src/lib/ezarri/konfigurator/).
 */
export function getConfiguratorPalette() {
  return CONFIGURATOR.mosaike.map((m) => ({
    id: m.id,
    name: m.name,
    serie: m.serie,
    kategorie: m.kategorie,
    formate: m.formate || [],
    mischbar: Boolean(m.mischbar),
    farbfilter: m.farbfilter || [],
    hex: m.farbe_hex || null,
    reflexion: m.reflexion ?? 0,
    glanz: m.glanz ?? 0,
    relief: m.relief ?? 0,
    finish: m.specular_tex ? String(m.specular_tex).replace(/^Gresite|_AON_L1\.png$/g, "").toLowerCase() : null,
    rezept: parseRecipe(m),
    referenz: m.referenz && REF_BY_ID.has(m.referenz) ? m.referenz : null,
    thumbs: m.thumbs || {},
  }));
}

/**
 * Verpackungs- und Maßdaten einer Referenz je Format (für Rechner und Anfrage).
 * Zahlen kommen als Strings mit Komma ("1,45") und werden zu Number.
 */
export function getPackaging(ref, formatLabel) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  if (!r) return null;
  const list = r.formate_verfuegbar || [];
  const f = (formatLabel && list.find((x) => x.label === formatLabel)) || list[0];
  if (!f) return null;
  const num = (s) => {
    const n = Number.parseFloat(String(s ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };
  return {
    label: f.label,
    blattCm: f.blatt_cm ?? null,
    steineProBlatt: f.steine_pro_blatt ?? null,
    dicke: f.dicke ?? null,
    blattProKarton: num(f.blatt_pro_karton),
    m2ProKarton: num(f.m2_pro_karton),
    m2ProPalette: num(f.m2_pro_palette),
    kgProM2: num(f.kg_pro_m2),
    quelle: r.quelle,
  };
}

// ---------------------------------------------------------------------------
// Downloads (Datenblätter, Zertifikate)

/** Datenblätter je Kollektion (Ezarri-URL; lokale Kopie unter Herstellermaterial/, nicht public). */
export function getDatasheets() {
  return COLLECTIONS.kollektionen
    .filter((c) => c.datenblatt?.url)
    .map((c) => ({ kollektion: c.id, name: c.name, url: c.datenblatt.url, sprache: "en" }));
}

// ---------------------------------------------------------------------------
// Rutschhemmung (DIN EN 16165: Anhang A barfuß → Klasse A/B/C, Anhang B
// Schuh → R9–R13, Anhang C Pendel → Klasse/Rd). In 36 Referenzen (Gea,
// Terrazzo, Aquarelle, Custom Printed) sind A und B im Datenblatt vertauscht
// ("barfuß: R11"). Hier wird nach dem Wert, nicht nach dem Feldnamen sortiert.

/** Rutschhemmung einer Referenz, normalisiert; null ohne Angabe. */
export function getSlipResistance(ref) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  const s = r?.rutschhemmung;
  if (!s) return null;
  const vals = [s.barfuss_din_en_16165_a, s.schuh_din_en_16165_b].filter(Boolean);
  const schuh = vals.find((v) => /^R\d/.test(v)) ?? null;
  const barfuss = vals.find((v) => !/^R\d/.test(v)) ?? null;
  return { barfuss, schuh, pendel: s.pendel_une_en_16165_c ?? null, quelle: s.quelle ?? null, korrigiert: /^R\d/.test(s.barfuss_din_en_16165_a || "") };
}

// ---------------------------------------------------------------------------
// Team A „Welt & Sortiment“ (Seiten unter /ezarri, Doku: features/ezarri-welt.md)

/** Kollektionen mit eigener Kollektionsseite (alle 21; Custom = Dienstleistung). */
export function isServiceCollection(c) {
  return c?.linie === "Custom";
}

/**
 * Basis-Mosaik einer Safe-/Corner-/Cove-Referenz (canonical, Konzept §6.3).
 * Erste auflösbare Format-Variante vom Typ „mosaik“; sonst null (dann canonical selbst).
 */
export function getBaseReference(ref) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  if (!r || r.typ === "mosaik") return null;
  const hit = getVariants(r).find((v) => v.gruppe === "Format" && v.id && getReference(v.id)?.typ === "mosaik");
  return hit ? getReference(hit.id) : null;
}

/**
 * Ausführungen gruppiert für die Detailseite: [{gruppe, items:[{label, id, current, sameAsPage}]}].
 * „sameAsPage“: Ezarri führt die Option auf derselben Produktseite (z. B. „25mm Safe“ als Formatoption).
 */
export function getVariantGroups(ref) {
  const r = typeof ref === "string" ? getReference(ref) : ref;
  if (!r) return [];
  const order = ["Format", "Anti-Rutsch", "Special Pieces"];
  const out = new Map(order.map((g) => [g, []]));
  for (const v of getVariants(r)) {
    const g = out.has(v.gruppe) ? v.gruppe : "Anti-Rutsch";
    const current = v.id === r.id && v.aktiv;
    const sameAsPage = v.id === r.id && !v.aktiv;
    if (out.get(g).some((x) => x.label === v.label)) continue;
    out.get(g).push({ label: v.label, id: v.id, current, sameAsPage });
  }
  return order.map((gruppe) => ({ gruppe, items: out.get(gruppe) })).filter((g) => g.items.length);
}

/** Karten zu einer ID-Liste (Reihenfolge bleibt, unbekannte IDs fallen weg). */
export function getReferenceCards(ids = []) {
  return ids.map(getReference).filter(Boolean).map(toReferenceCard);
}

const firstValue = (obj) => (obj ? Object.values(obj).find((v) => v) ?? null : null);

/** Faktenzeile einer Kollektion aus dem Datenblatt (Wasseraufnahme, PEI, Mohs, Chemikalien …); Labels je Sprache (Welle 2). */
export function getCollectionFacts(c, locale = "de") {
  const t = c?.datenblatt?.technik;
  if (!t) return [];
  // 01.11.2026: Labels auch fr/it (Reihenfolge de, en, fr, it).
  const i = { en: 1, fr: 2, it: 3 }[locale] ?? 0;
  const L = (...x) => x[i];
  const rows = [
    [L("Wasseraufnahme", "Water absorption", "Absorption d’eau", "Assorbimento d’acqua"), firstValue(t.wasseraufnahme)],
    [L("Abriebklasse", "Abrasion class", "Classe d’abrasion", "Classe di abrasione"), firstValue(t.pei)],
    [L("Ritzhärte (Mohs)", "Scratch hardness (Mohs)", "Dureté (Mohs)", "Durezza (Mohs)"), firstValue(t.ritzhaerte_mohs)],
    [L("Fleckenbeständigkeit", "Stain resistance", "Résistance aux taches", "Resistenza alle macchie"), firstValue(t.fleckenbestaendigkeit)],
    [L("Chemikalien", "Chemicals", "Produits chimiques", "Prodotti chimici"), firstValue(t.chemikalienbestaendigkeit)],
    [L("Alterung", "Ageing", "Vieillissement", "Invecchiamento"), firstValue(t.alterung)],
  ];
  return rows.filter(([, v]) => v).map(([label, value]) => ({ label, value }));
}

/** Formate einer Kollektion laut Datenblatt: [{format:"25", stein, blatt, dicke, steine, verklebung}]. */
export function getCollectionFormats(c) {
  const f = c?.datenblatt?.formate;
  if (!f) return [];
  return Object.entries(f)
    .filter(([, v]) => v)
    .map(([format, v]) => ({ format, stein: v.stein_mm, blatt: v.blatt_cm, dicke: v.dicke, steine: v.steine_pro_blatt, fuge: v.fuge_mm, verklebung: v.verklebung }));
}

const fileName = (p) => (p ? String(p).split("/").pop() : null);

/** Lokale PDF-Kopie unter public/ezarri/pdf/ (öffentliche Ezarri-PDFs, Quelle in `quelle`). */
export function localPdf(datei) {
  const name = fileName(datei);
  return name ? `/ezarri/pdf/${name}` : null;
}

// Custom Mix hat in collections.json kein datenblatt-Feld; das PDF liegt aber
// öffentlich bei Ezarri (Herstellermaterial/Ezarri/pdf/00-pdf-index.csv).
const EXTRA_SHEETS = { "custom-mix": { datei: "FT2023_CUSTOM_MIX2.pdf", url: "https://www.ezarri.com/media/uploads/fichas/FT2023_CUSTOM_MIX2.pdf" } };
const sheetOf = (c) => (c?.datenblatt?.datei ? c.datenblatt : EXTRA_SHEETS[c?.id] ?? null);

/** Downloads: Datenblätter der 21 Kollektionen (soweit vorhanden) + ältere Kollektionen. */
export function getDownloads() {
  const sheets = COLLECTIONS.kollektionen
    .filter((c) => sheetOf(c))
    .map((c) => ({ id: c.id, name: c.name, href: localPdf(sheetOf(c).datei), quelle: sheetOf(c).url, sprache: "englisch" }));
  const alt = COLLECTIONS.nicht_mehr_online
    .filter((c) => c.datenblatt)
    .map((c) => ({ id: c.id, name: c.name, href: localPdf(c.datenblatt), quelle: null, sprache: "englisch", referenzen: c.referenzen_laut_datenblatt || [] }));
  return { sheets, alt };
}

/** Datenblatt einer Kollektion (lokale Kopie + Ezarri-URL) oder null. */
export function getDatasheet(c) {
  const d = sheetOf(c);
  return d ? { href: localPdf(d.datei), quelle: d.url } : null;
}

const hasImage = (card) => Boolean(card?.bild);

/**
 * Auswahl für eine Einsatz-Welt oder Wasserfarbe: Basis-Mosaike mit Bild,
 * höchstens eines je Kollektion, dann aufgefüllt. Deterministisch (keine Zufallsauswahl).
 * `prefer`: Projektbild-Arten (z. B. ["bad"]), deren Mosaike vorne stehen.
 */
export function pickReferences(filters, limit = 9, { prefer = [] } = {}) {
  // Mosaike mit Projektbildern (passende Art zuerst) und Wasserfarbe zuerst: dort sieht der Kunde die Wirkung.
  // R5 seo P2-5: Hervorgehobene Mosaike (Hub, Wasser, Einsatz-Welten) sind
  // zuerst indexierbare Mosaikseiten – dieselbe Quelle wie Sitemap und
  // llms.txt (isIndexableMosaik). noindex-Mosaike rücken nur nach, wenn ein
  // Filter zu wenige indexierbare hat.
  const score = (c) => (isIndexableMosaik(c.id) ? 1000 : 0) + (prefer.some((p) => c.projekte.includes(p)) ? 100 : 0) + c.bilder + (c.wasserfarbe.length ? 5 : 0);
  const list = cards()
    .filter((c) => c.typ === "mosaik" && hasImage(c) && matchesReference(c, filters))
    .map((c, i) => ({ c, i, s: score(c) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.c);
  const seen = new Set();
  const first = [];
  const rest = [];
  for (const c of list) (seen.has(c.kollektion) ? rest : (seen.add(c.kollektion), first)).push(c);
  // indexierbar: Komponenten verlinken hervorgehobene Mosaike nur, wenn die Seite indexierbar ist.
  return [...first, ...rest].slice(0, limit).map((c) => ({ ...c, indexierbar: isIndexableMosaik(c.id) }));
}

/**
 * Anzahl Mosaike zu einem Filter (Kacheln, Welten). Ohne `typ` im Filter nur
 * Basis-Mosaike (typ "mosaik", 281) – Safe-Steps und Formstücke zählen nicht als
 * eigene Mosaike (QM P2-5).
 */
export function countReferences(filters = {}) {
  const f = filters.typ ? filters : { ...filters, typ: ["mosaik"] };
  return cards().filter((c) => matchesReference(c, f)).length;
}

/** Anzahl Basis-Mosaike, die Ezarri in einem Projektbild dieser Art(en) zeigt. */
export function countWithProjectImage(arten = []) {
  return cards().filter((c) => c.typ === "mosaik" && arten.some((a) => c.projekte.includes(a))).length;
}

/** Sonderanfertigung = Kollektion ohne eigene Mosaike (Custom Mix, Printed, Pixel, Patterns). */
export function isMadeToOrder(c) {
  return !(c?.anzahl_referenzen > 0);
}

/**
 * Sortimentsumfang für Texte (eine Zählweise, QM Runde 2 P2-3):
 * mosaike = Basis-Mosaike, kollektionen = Kollektionen mit eigenen Mosaiken,
 * sonderanfertigungen = Kollektionen ohne Mosaike, weitere = Safe-Steps + Formstücke.
 */
export function getSortimentStats() {
  const all = cards();
  const mosaik = all.filter((c) => c.typ === "mosaik");
  return {
    mosaike: mosaik.length,
    kollektionen: getCollections().filter((c) => !isMadeToOrder(c)).length,
    sonderanfertigungen: getCollections().filter(isMadeToOrder).length,
    weitere: all.length - mosaik.length,
    gesamt: all.length,
  };
}

const GALLERY_BY_ID = new Map(GALLERY.projekte.map((g) => [g.id, g]));

/** Ein Galerie-Eintrag als Karte (für fest kuratierte Bilder, copy.WELTEN[].bild) oder null. */
export function getGalleryImageById(id) {
  const g = GALLERY_BY_ID.get(id);
  return g?.bild ? toGalleryCard(g) : null;
}

/**
 * Galerie-Bilder (keine Videos, keine Produktaufnahmen) zu Einsatz-Werten, querformatig zuerst.
 * `exclude`: Set mit Galerie-IDs, die auf derselben Seite schon zu sehen sind; gewählte IDs
 * werden eingetragen (Dedup über mehrere Aufrufe, QM P1-2).
 */
export function getGalleryImages({ einsatz = [], wasser, kollektion, limit = 6, exclude } = {}) {
  const f = {};
  if (kollektion) f.kollektion = [kollektion];
  if (einsatz.length) f.einsatz = einsatz;
  if (wasser) f.wasser = [wasser];
  const all = GALLERY.projekte.filter((g) => g.bild && !PRODUKTAUFNAHME.test(g.id) && !exclude?.has(g.id) && matchesGallery(g, f));
  const wide = all.filter((g) => g.bild.breite > g.bild.hoehe);
  const seen = new Set();
  const out = [];
  for (const g of [...wide, ...all]) {
    const key = g.referenz || g.id;
    if (seen.has(key)) continue;
    seen.add(key);
    exclude?.add(g.id);
    out.push(toGalleryCard(g));
    if (out.length >= limit) break;
  }
  return out;
}

/** Galerie-Facetten (für die Filter-Leiste): Kollektionen, die in der Galerie vorkommen. */
export function getGalleryCollections() {
  const ids = new Set(GALLERY.projekte.map((g) => g.kollektion).filter(Boolean));
  return COLLECTIONS.kollektionen.filter((c) => ids.has(c.id)).map((c) => ({ id: c.id, name: c.name }));
}

/** Anzahl Galerie-Einträge zu einem Filter. */
export function countGallery(filters = {}) {
  return GALLERY.projekte.filter((g) => matchesGallery(g, filters)).length;
}

// ---------------------------------------------------------------------------
// Sitemap-Hook (Konzept §6.3). Liefert [] solange EZARRI_PUBLIC = false.
// Einbindung als sitemap-ezarri.xml macht der Teamleiter (§7.5).


// ---------------------------------------------------------------------------
// Indexierung der Mosaikseiten (Runde 4 P5, ./indexierung.js)

const MOSAIK_INDEX = computeMosaikIndex(REFERENCES.referenzen, KOMBINATIONEN.rezepte, EIGENE_TEXTE);

/** true = Mosaikseite index,follow (eigener Text oder < 50 % Ähnlichkeit in der Kollektion). */
export function isIndexableMosaik(ref) {
  const id = typeof ref === "string" ? ref : ref?.id;
  return Boolean(MOSAIK_INDEX.get(id)?.indexable);
}

/** Eigener Platzhirsch-Text einer Referenz oder null. */
export function getEigenerText(ref) {
  const id = typeof ref === "string" ? ref : ref?.id;
  return String(EIGENE_TEXTE[id] || "").trim() || null;
}

/** Prüfdaten je Mosaik ({ indexable, maxSimilarity, eigenerText }), z. B. für Audits. */
export function getMosaikIndexInfo(ref) {
  const id = typeof ref === "string" ? ref : ref?.id;
  return MOSAIK_INDEX.get(id) ?? null;
}

/** Indexierbare Ezarri-URLs (Pfad ohne Locale) mit lastmod = DATA_STAND. */
export function getEzarriEntries(isPublic) {
  if (!(isPublic === undefined ? ezarriInSitemap() : ezarriInSitemap(isPublic))) return [];
  const lastmod = DATA_STAND;
  const fixed = [
    "", "/pool", "/wellness", "/bad", "/kueche", "/fassade", "/wasser", "/kollektionen", "/mosaike", "/galerie",
    "/technik", "/technik/jointpoint", "/technik/verlegung", "/technik/pflege", "/technik/fragen", "/technik/downloads",
    // Werkzeuge (F6 28.10.2026): index, follow mit Self-Canonical → in die Sitemap.
    "/konfigurator", "/rechner", "/custom-mix",
  ];
  // Alle 21 Kollektionsseiten sind index, follow – auch die 7 Custom-Linien
  // (Dienstleistung, eigene Seite mit Self-Canonical; F6 28.10.2026).
  const kollektionen = COLLECTIONS.kollektionen.map((c) => `/kollektionen/${c.id}`);
  // Runde 4 P5 (seo P1-2): nur Mosaikseiten mit eigenem Text bzw. < 50 %
  // Ähnlichkeit innerhalb der Kollektion (./indexierung.js); die übrigen sind
  // noindex,follow und fehlen hier (Sitemap, llms.txt).
  const mosaike = REFERENCES.referenzen.filter((r) => isIndexableMosaik(r.id)).map((r) => `/mosaike/${r.id}`);
  return [...fixed, ...kollektionen, ...mosaike].map((p) => ({ path: `/ezarri${p}`, locale: "de", lastmod }));
}

/**
 * Welle 2 (Englisch): dieselben indexierbaren Ezarri-URLs je Sprache aus
 * EZARRI_LOCALES – [{ path, locale, lastmod, alternates: {de, en} }]. Die
 * Integration hängt sie in src/lib/seo/sitemapEntries.js ein (dort steht heute
 * nur "/de" + getEzarriEntries()).
 */
export function getEzarriEntriesAllLocales(isPublic, locales = ["de", "en"]) {
  return getEzarriEntries(isPublic).flatMap((e) =>
    locales.map((locale) => ({ ...e, locale, alternates: Object.fromEntries(locales.map((l) => [l, e.path])) }))
  );
}

/**
 * Sprachen einer Ezarri-URL (01.11.2026): Welt-Seiten EZARRI_WELT_LOCALES
 * (de, en, fr, it), Konfigurator/Rechner TOOL_LOCALES ∩ Welt (konfigurator/intl.js),
 * Custom Mix und Anfrage EZARRI_LOCALES (de, en). Gleiche Regel wie hreflang
 * (Welt/meta.js) und Links (deLinks.ezLinkProps).
 */
export function ezarriLocalesFor(path) {
  if (/^\/ezarri\/(konfigurator|rechner)(\/|$)/.test(path)) return EZARRI_WELT_LOCALES.filter((l) => TOOL_LOCALES.includes(l));
  if (/^\/ezarri\/(custom-mix|anfrage)(\/|$)/.test(path)) return [...EZARRI_LOCALES];
  return [...EZARRI_WELT_LOCALES];
}

/**
 * Sitemap-Einträge mit den Sprachen je URL (ezarriLocalesFor) – für die
 * Integration in src/lib/seo/sitemapEntries.js, sobald /fr|it/ezarri/** nicht
 * mehr per 308 umgeleitet wird (deOnlyRedirects.cjs).
 */
export function getEzarriEntriesByLocale(isPublic) {
  return getEzarriEntries(isPublic).flatMap((e) => {
    const locales = ezarriLocalesFor(e.path);
    return locales.map((locale) => ({ ...e, locale, alternates: Object.fromEntries(locales.map((l) => [l, e.path])) }));
  });
}
