// src/components/MarkenItems/brandData.js
// Data shaping for the brand pages (server only, pure functions): localized
// CMS fields, country names, product chapters per category, showroom pieces.
import { generateSlug } from "@/lib/slugify";
import { productsPath } from "@/utils/routing";
import { cleanProductName } from "@/lib/content/brands";
import { NEW_API_SERVER } from "@/lib/apiBaseUrl";
import { probeImageSize } from "./imageSize";
import { cleanProse, isVerifiedDealer, leadProse as legalLeadProse } from "@/lib/legal/manufacturerText";

const cmx = (path) => (path ? `/cmx${path}` : null);

const germanField = (obj, key) => String(obj?.[`${key}_de`] || obj?.[key] || "").trim();

/**
 * Localized CMS field. German is `<key>_de` for most fields but the
 * unsuffixed `<key>` for beschreibung/produkte.
 * Prose (default): ONLY the current language – a missing translation returns
 * "" and the block is left out (QA Runde 1, P1-1, WCAG 3.1.2: no German text
 * on /en, /fr, /it). Names and facts may pass { fallback: true }.
 */
export const localized = (obj, key, locale, { fallback = false } = {}) => {
  if (locale === "de") return germanField(obj, key);
  const own = String(obj?.[`${key}_${locale}`] || "").trim();
  return own || (fallback ? germanField(obj, key) : "");
};

/**
 * Founder field ("Aldo Spinelli, Alberto Spinelli und Giovanni Anzani") as a
 * list in the page language via Intl.ListFormat – the German "und" never
 * reaches /en, /fr, /it.
 * @returns {{ text: string, count: number }}
 */
export function formatFounders(raw, locale = "de") {
  const names = String(raw || "")
    .split(/\s*(?:,|;|\/|&|\s+und\s+|\s+and\s+|\s+et\s+|\s+e\s+)\s*/i)
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.length) return { text: "", count: 0 };
  try {
    return { text: new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(names), count: names.length };
  } catch {
    return { text: names.join(", "), count: names.length };
  }
}

/** Craft disciplines with title AND text in the current language only. */
export const localizedCraft = (items = [], locale = "de") =>
  (items || [])
    .map((item) => ({
      eyeline: localized(item, "eyeline", locale),
      title: localized(item, "title", locale),
      text: localized(item, "text", locale),
      // Quelle/Freigabe bleibt am Eintrag: ohne sie blendet cleanCraftEntries
      // den Abschnitt aus (Inhaber-offen Nr. 28).
      source: String(item?.source || item?.quelle || item?.source_url || "").trim(),
      approved: item?.approved,
    }))
    .filter((c) => c.title && c.text);

// The backoffice stores the country in German ("Italien"). Map to ISO and let
// Intl name it in the page language.
const COUNTRY_ISO = {
  italien: "IT",
  deutschland: "DE",
  österreich: "AT",
  oesterreich: "AT",
  schweiz: "CH",
  liechtenstein: "LI",
  frankreich: "FR",
  belgien: "BE",
  niederlande: "NL",
  dänemark: "DK",
  daenemark: "DK",
  schweden: "SE",
  norwegen: "NO",
  finnland: "FI",
  spanien: "ES",
  portugal: "PT",
  griechenland: "GR",
  großbritannien: "GB",
  grossbritannien: "GB",
  "vereinigtes königreich": "GB",
  england: "GB",
  usa: "US",
  "vereinigte staaten": "US",
  japan: "JP",
};
export function localizedCountry(name, locale = "de") {
  const raw = String(name || "").trim();
  if (!raw || locale === "de") return raw;
  const iso = COUNTRY_ISO[raw.toLowerCase()];
  if (!iso) return raw;
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(iso) || raw;
  } catch {
    return raw;
  }
}

// CMS prose → paragraphs (blank lines separate them).
export const splitParagraphs = (text) =>
  String(text || "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

export const brandImages = (marke) =>
  (marke?.bild_anhagen || []).map((r) => cmx(r?.bild_anhagen)).filter(Boolean);

// Image modules of the brand page (QA Runde 1, P2-1/P2-2). Sizes come from
// the file header (imageSize.js), so every box takes the image's own ratio.
const HERO_MIN_RATIO = 1.2; // prefer landscape for the hero
const STORY_RATIO = [0.78, 1.02]; // 4:5 … 1:1 (Bibel §6), otherwise no story image
const ROOM_MIN_WIDTH = 1600; // full-width module only for files that are really wide
const ROOM_MIN_RATIO = 16 / 9;

/**
 * Picks hero, story and room image of a brand with their real sizes.
 * Unknown size (probe failed): hero falls back to a 3:2 box, story and room
 * image are left out. alt: CMS alt_text, else null (caller sets a default).
 * @returns {Promise<{hero, story, room}>} each {src, width, height, ratio, alt} | null
 */
export async function brandImageSet(marke) {
  const rows = (marke?.bild_anhagen || []).filter((r) => r?.bild_anhagen);
  const sized = await Promise.all(
    rows.map(async (r) => {
      const size = await probeImageSize(`${NEW_API_SERVER}${encodeURI(r.bild_anhagen)}`);
      return {
        src: cmx(r.bild_anhagen),
        width: size?.width || null,
        height: size?.height || null,
        ratio: size ? size.width / size.height : null,
        alt: String(r.alt_text || "").trim() || null,
      };
    })
  );
  if (!sized.length) return { hero: null, story: null, room: null };

  const hero = sized.find((i) => i.ratio && i.ratio >= HERO_MIN_RATIO) || sized[0];
  const rest = sized.filter((i) => i !== hero);
  const story = rest.find((i) => i.ratio && i.ratio >= STORY_RATIO[0] && i.ratio <= STORY_RATIO[1]) || null;
  const room =
    rest.find((i) => i !== story && i.width >= ROOM_MIN_WIDTH && i.ratio >= ROOM_MIN_RATIO) || null;
  return { hero, story, room };
}

// Category key of the catalogue URL (same rule as sitemapEntries.js).
const categorySlug = (key) => generateSlug(String(key || "").toLowerCase());

/** Catalogue listing of one category, filtered to the brand (no locale prefix). */
export const catalogHref = (locale, categoryKey, brandName) =>
  `${productsPath(locale, categorySlug(categoryKey))}?marke=${generateSlug(brandName)}`;

const productHref = (locale, row) => productsPath(locale, categorySlug(row.kategories), row.path_field);

function toTile(row, locale, brand) {
  const imgs = (Array.isArray(row.bild_anhangen) ? row.bild_anhangen : []).filter((i) => i?.bild_anhangen);
  const name = cleanProductName(row.produkt_name || row.name);
  return {
    slug: row.path_field,
    name,
    href: productHref(locale, row),
    image: cmx(imgs[0]?.bild_anhangen),
    hoverImage: cmx(imgs[1]?.bild_anhangen),
    alt: imgs[0]?.alt_text || `${brand} ${name}`,
    imageCount: imgs.length,
  };
}

// Living first – the order a visitor of a furniture brand expects.
const CATEGORY_ORDER = [
  "sofas-couches",
  "armchairs-stools",
  "dining-tables",
  "dining-chairs",
  "coffee-tables",
  "side-tables",
  "beds",
  "sideboards-chests",
  "shelves",
  "chaise-longues-daybeds",
  "night-tables",
  "lamps",
  "rugs",
];
const orderOf = (key) => {
  const i = CATEGORY_ORDER.indexOf(key);
  return i === -1 ? CATEGORY_ORDER.length : i;
};

/**
 * Active products of one brand grouped by category.
 * @param {Array} products  "Produkte New" rows (fetchProdukteNewByMarke)
 * @param {Array} kategorien fetchKategorienByMarke rows (localized names)
 * @returns {{ total: number, list: Array<{key, label, count, items}> }}
 *   list sorted: living categories first, then by product count.
 */
export function groupProductsByCategory(products = [], kategorien = [], locale = "de") {
  const names = new Map(
    (kategorien || []).map((k) => [k.category_key || k.name, k[`name_${locale}`] || k.name_de || k.category_key])
  );
  const seenPaths = new Set();
  const groups = new Map();
  for (const row of products || []) {
    if (!row || (row.status && row.status !== "Aktiv") || !row.path_field || !row.kategories) continue;
    if (seenPaths.has(row.path_field)) continue;
    seenPaths.add(row.path_field);
    if (!groups.has(row.kategories)) groups.set(row.kategories, []);
    groups.get(row.kategories).push(row);
  }

  const brand = products?.[0]?.marken || "";
  const list = [...groups.entries()].map(([key, rows]) => {
    // Tiles: products with a gallery first; each model once ("Coupé (Tables)",
    // "Coupé (Tables 2)" are one model).
    const seenNames = new Set();
    const items = rows
      .map((r) => toTile(r, locale, brand))
      .filter((p) => p.image)
      .sort((a, b) => b.imageCount - a.imageCount || a.name.localeCompare(b.name, locale))
      .filter((p) => (seenNames.has(p.name) ? false : seenNames.add(p.name)));
    return {
      key,
      label: names.get(key) || key.replace(/-/g, " ").replace(/^\p{L}/u, (c) => c.toUpperCase()),
      count: rows.length,
      items,
    };
  });
  list.sort((a, b) => orderOf(a.key) - orderOf(b.key) || b.count - a.count);
  return { total: seenPaths.size, list };
}

// Rat 9,5 A8 (T6): H1-Kategorien nach Produktanzahl – reines Modul (Tests).
export { headlineCategories } from "./headline.js";

// Pieces that really stand in the Lochau showroom, by brand slug → path_field.
// Filled by the shop team only from the real exhibition list (Jury open point
// 6); until then the page shows an honest placeholder. Example:
//   minotti: ["sofas-lawrence", "sofas-andersen"],
export const SHOWROOM_PIECES = {};

export function showroomPiecesFor(brandName, products = [], locale = "de") {
  const wanted = SHOWROOM_PIECES[generateSlug(brandName)] || [];
  if (!wanted.length) return [];
  const byPath = new Map((products || []).filter((p) => p?.status !== "Inaktiv").map((p) => [p.path_field, p]));
  return wanted
    .map((path) => byPath.get(path))
    .filter(Boolean)
    .map((row) => toTile(row, locale, brandName))
    .filter((p) => p.image);
}

// ---------------------------------------------------------------------------
// Brand prose in the page language, cleaned for voice and UWG (QA Runde 1,
// P1-1 + P2-5). Used by the page AND by generateMetadata / JSON-LD.
// ---------------------------------------------------------------------------
const DE_COUNTRY_ARTICLE = { USA: "den USA", "Vereinigte Staaten": "den Vereinigten Staaten", Niederlande: "den Niederlanden" };

/** Neutral lead: "{brand} aus {Land}, gegründet {Jahr}. Wir beraten Sie zu {brand} …" */
export function introFallback(tr, { brand, country, founded, locale = "de" }) {
  const place = locale === "de" ? DE_COUNTRY_ARTICLE[country] || country : country;
  const first =
    place && founded
      ? tr("introOriginYear", { brand, country: place, year: founded })
      : place
        ? tr("introOrigin", { brand, country: place })
        : founded
          ? tr("introYear", { brand, year: founded })
          : "";
  return [first, tr("introShowroom", { brand })].filter(Boolean).join(" ");
}

// CMS prose that may lead a text block: "" if its OPENING sentence had to go
// ("Minotti … italienisches Luxusdesign …") – the rest would start
// mid-thought ("Erhältlich bei …", "Beratung und Lieferung …").
// Filter: src/lib/legal/manufacturerText.js (R3: delivery promises too).
const leadProse = (raw, allowDealer) => legalLeadProse(raw, { allowDealer, dropDelivery: true });

/**
 * Hero lead: the CMS intro (`produkte_<locale>`) without voice / dealer
 * sentences; otherwise the neutral fallback.
 */
export function brandIntro(marke, locale, tr, facts) {
  const allowDealer = isVerifiedDealer(marke?.name1);
  return leadProse(localized(marke, "produkte", locale), allowDealer) || introFallback(tr, { ...facts, locale });
}

/**
 * Meta description source: CMS metadata_description_<locale> → CMS intro →
 * neutral fallback. Current language only, cleaned. (Caller trims to length.)
 */
export function brandMetaText(marke, locale, tr, facts) {
  const allowDealer = isVerifiedDealer(marke?.name1);
  return leadProse(localized(marke, "metadata_description", locale), allowDealer) || brandIntro(marke, locale, tr, facts);
}

/** JSON-LD description: current language only, cleaned; "" = leave the field out. */
export function brandSchemaText(marke, locale) {
  const allowDealer = isVerifiedDealer(marke?.name1);
  return (
    leadProse(localized(marke, "metadata_description", locale), allowDealer) ||
    leadProse(localized(marke, "produkte", locale), allowDealer) ||
    brandStory(marke, locale)[0] ||
    ""
  );
}

/** Facts used by the fallbacks (country in the page language, year). */
export const brandFacts = (marke, locale, brand) => ({
  brand,
  country: localizedCountry(marke?.herkunftsland, locale),
  founded: marke?.grundungsjahr ? String(marke.grundungsjahr) : "",
});

/**
 * Story paragraphs: current language, cleaned per paragraph; a first
 * paragraph that is only a CMS sub-heading (< 80 chars, no full stop) is
 * dropped – it repeats the H2 (QA Runde 1, P3-5).
 */
export function brandStory(marke, locale) {
  const allowDealer = isVerifiedDealer(marke?.name1);
  const raw = splitParagraphs(localized(marke, "beschreibung", locale));
  if (raw[0] && raw[0].length < 80 && !/[.!?]$/.test(raw[0])) raw.shift();
  return raw.map((p) => cleanProse(p, { allowDealer })).filter(Boolean);
}
