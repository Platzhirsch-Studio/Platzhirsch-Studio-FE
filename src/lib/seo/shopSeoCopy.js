// src/lib/seo/shopSeoCopy.js
// Localized <title>/meta-description templates for the /produkte hub,
// category and product pages. CMS text (metadata_description_*/beschreibung_*)
// always wins where it exists; these are the fallbacks.

import { META_DESCRIPTION_MAX, META_TITLE_MAX, clampDescription, cutTitle } from "./pageMetadata.js";

const SUFFIX = " | Platzhirsch Home Living";

// F6 (28.10.2026): titles ≤ 65, descriptions ≤ 165 characters (SERP width).
// Rat 9,5 A15 (T6): ≤ 60 / ≤ 150, descriptions as whole sentences and titles
// without "…" (pageMetadata.js). No "Premium" (voice rule).
export const MAX_TITLE = META_TITLE_MAX;
export const MAX_DESCRIPTION = META_DESCRIPTION_MAX;
const clamp = (text, max) => clampDescription(text, max);
/**
 * Title with suffix, ≤ 60: full suffix, short suffix, no suffix, then only the
 * part before " – " (+ suffix), and only then a cut at a separator or word.
 */
function withSuffix(title) {
  const head = title.split(" – ")[0];
  const candidates = [`${title}${SUFFIX}`, `${title} | Platzhirsch`, title, `${head}${SUFFIX}`, `${head} | Platzhirsch`, head];
  return candidates.find((c) => c.length <= MAX_TITLE) || cutTitle(title, MAX_TITLE);
}

const HUB = {
  de: {
    title: `Designermöbel & Produktkatalog${SUFFIX}`,
    description: "Designermöbel von Minotti, Rimadesio und weiteren Marken, nach Kategorie sortiert. Erleben Sie die Auswahl in der Ausstellung in Lochau am Bodensee.",
  },
  en: {
    title: `Designer furniture catalogue${SUFFIX}`,
    description: "Designer furniture from Minotti, Rimadesio and other brands, sorted by category. See the collection in our showroom in Lochau on Lake Constance.",
  },
  fr: {
    title: `Catalogue de mobilier design${SUFFIX}`,
    description: "Mobilier design de Minotti, Rimadesio et d'autres marques, par catégorie. Découvrez la sélection dans notre showroom de Lochau, lac de Constance.",
  },
  it: {
    title: `Catalogo di mobili di design${SUFFIX}`,
    description: "Mobili di design di Minotti, Rimadesio e altri marchi, ordinati per categoria. Scoprite la selezione nel nostro showroom di Lochau, Lago di Costanza.",
  },
};

export function hubSeo(locale) {
  return HUB[locale] || HUB.de;
}

// German search terms per category key (SISTRIX, DE monthly clicks 2026-10:
// "designer sofa" 1,350, "esstisch design" 500, "design gartenmöbel" 400,
// "designerleuchten" 250, "designerbetten" 150, "designerküchen" 150). Used in
// the German <title>/description of the category page; the visible H1 keeps
// the CMS label. Keys = ProductsMenu/category slugs.
const CATEGORY_KEYWORD_DE = {
  "sofas-couches": "Designer Sofas",
  "corner-sofas": "Design Ecksofas",
  "leather-sofas": "Designer Ledersofas",
  "armchairs-stools": "Designer Sessel",
  "chaise-longues-daybeds": "Design Chaiselongues & Daybeds",
  "dining-tables": "Design Esstische",
  "dining-chairs": "Designer Stühle",
  "coffee-tables": "Design Couchtische",
  "side-tables": "Design Beistelltische",
  "beds": "Designerbetten",
  "wardrobes": "Design Kleiderschränke",
  "sideboards-chests": "Design Sideboards",
  "shelves": "Design Regale",
  "kitchen": "Designerküchen",
  "lamps": "Designerleuchten",
  "rugs": "Designer Teppiche",
  "garden-tables": "Design Gartentische",
  "garden-chairs": "Design Gartenstühle",
  "lounge-furniture-daybeds": "Design Gartenmöbel & Loungemöbel",
  "sun-loungers": "Design Sonnenliegen",
  "parasols": "Design Sonnenschirme",
};

// `brands` = up to 3 brand names that have products in the category;
// `key` = category slug for the German keyword map.
// Lieferung/Montage nur „auf Wunsch“ (Inhaber-Entscheidung Nr. 3): kein
// pauschales Länderversprechen wie „in ganz Österreich“ (F6, 28.10.2026).
export function categorySeo(locale, args) {
  const { title, description } = categorySeoRaw(locale, args);
  const bare = title.endsWith(SUFFIX) ? title.slice(0, -SUFFIX.length) : title;
  return { title: withSuffix(bare), description: clamp(description, MAX_DESCRIPTION) };
}

function categorySeoRaw(locale, { label, count, brands, key }) {
  const brandList = (brands || []).filter(Boolean).slice(0, 3).join(", ");
  const keywordDe = CATEGORY_KEYWORD_DE[key];
  switch (locale) {
    case "en":
      return {
        title: `${label} – Designer Furniture in Vorarlberg${SUFFIX}`,
        description: `${count ? `${count} ` : ""}${label}${brandList ? ` by ${brandList}` : ""} – discover them in our showroom in Lochau on Lake Constance, with personal consulting; delivery and assembly on request.`,
      };
    case "fr":
      return {
        title: `${label} – Mobilier design au Vorarlberg${SUFFIX}`,
        description: `${count ? `${count} ` : ""}${label}${brandList ? ` de ${brandList}` : ""} – à découvrir dans notre showroom à Lochau, au bord du lac de Constance, avec conseil personnalisé ; livraison et montage sur demande.`,
      };
    case "it":
      return {
        title: `${label} – Mobili di design in Vorarlberg${SUFFIX}`,
        description: `${count ? `${count} ` : ""}${label}${brandList ? ` di ${brandList}` : ""} – da scoprire nel nostro showroom a Lochau, sul Lago di Costanza, con consulenza personale; consegna e montaggio su richiesta.`,
      };
    default:
      return {
        title: keywordDe
          ? `${keywordDe} in Vorarlberg – ${label}${SUFFIX}`
          : `${label} – Designermöbel in Vorarlberg${SUFFIX}`,
        description: `${count ? `${count} ` : ""}${keywordDe || label}${brandList ? ` von ${brandList}` : ""} – im Showroom in Lochau am Bodensee erleben. Persönliche Beratung, Lieferung und Montage auf Wunsch.`,
      };
  }
}

export function productTitle({ name, brand }) {
  return withSuffix(`${name}${brand ? ` – ${brand}` : ""}`);
}

// ---------------------------------------------------------------------------
// Rat 9,5 B17 (T6): one brand, several products with the same display name
// ("Torii" = coffee table, swivel armchair, armchair … – the import suffixes
// "(Sofas 2)" are stripped by cleanProductName). Without a qualifier they had
// the same <title> and H1. The qualifier is the product type the backoffice
// text itself names ("Couchtisch Minotti Torii: …"), else the category label;
// if two twins still collide, a neutral "Variante n" in path order. Nothing is
// invented: the words come from the data.

const TYPE_PREFIX = /^(?:designer|design)[\s-]+/iu;
const VARIANT = { de: "Variante", en: "variant", fr: "variante", it: "variante" };
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Product type named at the start of a backoffice text, or null:
 * "Couchtisch Minotti Torii: …" → "Couchtisch", "Designer-Sessel Minotti
 * Torii …" → "Sessel", "Coffee table by Minotti Torii" → "Coffee table".
 */
export function productTypeFromText(text, { brand = "", name = "" } = {}) {
  const plain = String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!plain || !name) return null;
  const who = [brand, name].filter(Boolean).map(escapeRe).join("\\s+");
  const m = plain.match(new RegExp(`^((?:[\\p{L}-]+\\s){0,2}[\\p{L}-]+?)\\s+(?:(?:von|by|de|di|da)\\s+)?${who}(?![\\p{L}])`, "iu"));
  if (!m) return null;
  const type = m[1].replace(TYPE_PREFIX, "").trim();
  if (type.length < 3 || type.length > 30) return null;
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// German type words of the backoffice texts in the other languages (used
// when the localized text names no type). Unknown words → null (category).
const TYPE_I18N = {
  Couchtisch: { en: "Coffee table", fr: "Table basse", it: "Tavolino" },
  Beistelltisch: { en: "Side table", fr: "Table d’appoint", it: "Tavolino" },
  Esstisch: { en: "Dining table", fr: "Table à manger", it: "Tavolo da pranzo" },
  Tisch: { en: "Table", fr: "Table", it: "Tavolo" },
  Sessel: { en: "Armchair", fr: "Fauteuil", it: "Poltrona" },
  Drehsessel: { en: "Swivel armchair", fr: "Fauteuil pivotant", it: "Poltrona girevole" },
  Sofa: { en: "Sofa", fr: "Canapé", it: "Divano" },
  Ecksofa: { en: "Corner sofa", fr: "Canapé d’angle", it: "Divano angolare" },
  Stuhl: { en: "Chair", fr: "Chaise", it: "Sedia" },
  Hocker: { en: "Stool", fr: "Tabouret", it: "Sgabello" },
  Pouf: { en: "Pouf", fr: "Pouf", it: "Pouf" },
  Bett: { en: "Bed", fr: "Lit", it: "Letto" },
  Leuchte: { en: "Lamp", fr: "Luminaire", it: "Lampada" },
  Liege: { en: "Lounger", fr: "Chaise longue", it: "Lettino" },
  Regal: { en: "Shelf", fr: "Étagère", it: "Libreria" },
  Sideboard: { en: "Sideboard", fr: "Buffet", it: "Madia" },
};

/** German type word ("Couchtisch") in `locale`, or null when not known. */
export function translateProductType(type, locale = "de") {
  if (!type) return null;
  if (locale === "de") return type;
  return TYPE_I18N[type]?.[locale] || null;
}

/**
 * Distinct display names for products that share one name.
 * @param {Array<{path:string, name:string, type?:string|null, category?:string|null}>} twins
 * @param {string} [locale]
 * @returns {Map<string,string>} path → "Torii Couchtisch" (the name alone when it is unique)
 */
export function distinctProductNames(twins, locale = "de") {
  const list = [...(twins || [])].filter((t) => t?.path).sort((a, b) => a.path.localeCompare(b.path));
  const out = new Map();
  if (list.length < 2) {
    for (const t of list) out.set(t.path, t.name);
    return out;
  }
  const count = (key) => (v) => list.filter((t) => key(t) === v).length;
  const byType = count((t) => t.type || null);
  const byCategory = count((t) => t.category || null);
  for (const t of list) {
    // A category shared by all twins says nothing ("Jacques Sessel & Hocker"
    // three times) – then only the type or, last, the variant number.
    const q = t.type && byType(t.type) === 1 ? t.type : t.category && byCategory(t.category) === 1 ? t.category : t.type || null;
    out.set(t.path, q ? `${t.name} ${q}` : t.name);
  }
  // Still the same label twice: neutral variant number in path order.
  const totals = new Map();
  for (const label of out.values()) totals.set(label, (totals.get(label) || 0) + 1);
  const seen = new Map();
  for (const t of list) {
    const label = out.get(t.path);
    if (totals.get(label) < 2) continue;
    const n = (seen.get(label) || 0) + 1;
    seen.set(label, n);
    out.set(t.path, `${label} – ${VARIANT[locale] || VARIANT.de} ${n}`);
  }
  return out;
}

// Runde 9, Fix-Team P5 (r5-recht-inhalt P1-1): the backoffice IT texts
// (metadata_description_it, beschreibung_it) still address the visitor with
// "tu" ("Richiedi una consulenza."), the site speaks "voi". Render-time
// normalisation of the frequent tu forms – imperatives at the start of a
// sentence and the possessives; the backoffice data stays untouched.
const IT_TU_IMPERATIVE = {
  Richiedi: "Richiedete", Scopri: "Scoprite", Contattaci: "Contattateci", Scrivici: "Scriveteci", Chiamaci: "Chiamateci",
  Vieni: "Venite", Prenota: "Prenotate", Lasciati: "Lasciatevi", Scegli: "Scegliete", Trova: "Trovate", Guarda: "Guardate",
  Esplora: "Esplorate", Approfitta: "Approfittate", Visitaci: "Visitateci", Richiedici: "Richiedeteci", Chiedi: "Chiedete",
  // Rat 9,5 A9 (T6): further sentence-start imperatives of the news copy.
  Goditi: "Godetevi", Rendi: "Rendete", Festeggia: "Festeggiate", Regalati: "Regalatevi", Concediti: "Concedetevi",
  Immergiti: "Immergetevi", Preparati: "Preparatevi",
};
// Rat 9,5 A9 (T6): forms that are always "tu" wherever they stand (2nd
// person singular only – no 3rd-person forms like "crea", "porta", "visita").
const IT_TU_ANYWHERE = {
  scopri: "scoprite", lasciati: "lasciatevi", goditi: "godetevi", rendi: "rendete", regalati: "regalatevi",
  concediti: "concedetevi", immergiti: "immergetevi", scegli: "scegliete", puoi: "potete", vuoi: "volete",
  devi: "dovete", hai: "avete", sentirti: "sentirvi", aiutarti: "aiutarvi", offrirti: "offrirvi", ispirarti: "ispirarvi",
  consigliarti: "consigliarvi", mostrarti: "mostrarvi", presentarti: "presentarvi", accoglierti: "accogliervi",
  ti: "vi", Ti: "Vi", te: "voi",
};
const IT_TU_POSSESSIVE = [
  [/(?<![\p{L}])Che tu sogni(?![\p{L}])/gu, "Che sogniate"],
  [/(?<![\p{L}])che tu sogni(?![\p{L}])/gu, "che sogniate"],
  [/(?<![\p{L}])casa tua(?![\p{L}])/gu, "casa vostra"],
  [/(?<![\p{L}])per te(?![\p{L}])/gu, "per voi"],
  // The voi possessive takes the same article ("il tuo" → "il vostro", "della
  // tua" → "della vostra", "a tuo agio" → "a vostro agio").
  [/(?<![\p{L}'’])tuoi(?![\p{L}])/gu, "vostri"],
  [/(?<![\p{L}'’])tuo(?![\p{L}])/gu, "vostro"],
  [/(?<![\p{L}'’])tua(?![\p{L}])/gu, "vostra"],
  [/(?<![\p{L}'’])tue(?![\p{L}])/gu, "vostre"],
  [/(?<![\p{L}'’])Tuoi(?![\p{L}])/gu, "Vostri"],
  [/(?<![\p{L}'’])Tuo(?![\p{L}])/gu, "Vostro"],
  [/(?<![\p{L}'’])Tua(?![\p{L}])/gu, "Vostra"],
  [/(?<![\p{L}'’])Tue(?![\p{L}])/gu, "Vostre"],
];
const IT_IMPERATIVE_RE = new RegExp(`(^|[.!?…]\\s+|[«"„]\\s*)(${Object.keys(IT_TU_IMPERATIVE).join("|")})(?![\\p{L}])`, "gu");
const IT_ANYWHERE_RE = new RegExp(`(?<![\\p{L}'’])(${Object.keys(IT_TU_ANYWHERE).join("|")})(?![\\p{L}'’])`, "gu");

/** IT text in the voi form of the site (other locales unchanged). */
export function itVoi(text, locale = "it") {
  if (locale !== "it" || typeof text !== "string" || !text) return text;
  let out = text.replace(IT_IMPERATIVE_RE, (m, lead, verb) => lead + IT_TU_IMPERATIVE[verb]);
  for (const [re, to] of IT_TU_POSSESSIVE) out = out.replace(re, to);
  out = out.replace(IT_ANYWHERE_RE, (m, w) => IT_TU_ANYWHERE[w]);
  return out;
}
