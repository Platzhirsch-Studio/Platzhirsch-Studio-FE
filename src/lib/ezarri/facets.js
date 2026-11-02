// src/lib/ezarri/facets.js – Filter der Ezarri-Welt: Labels, URL-Zustand, Treffer-Logik.
//
// Rein (keine Pakete, kein "server-only", keine JSON-Imports): darf in Server-
// und Client-Komponenten (Filter-Insel), im Sitemap-Code und in node --test
// laufen. Die Daten selbst liest nur data.js (server-only).
//
// Filter (Konzept §3.4, Marktresearch/digital/features/ezarri-konzept.md):
//   kollektion, linie, farbfamilie, farbe (Hex, Nähe per ΔE), format, einsatz,
//   typ (mosaik/safe-step/corner/cove), safe (rutschhemmend), spezial
//   (Corner/Cove vorhanden), wasser (Wasserwirkung), oberflaeche, q (Suche)
// URL: mehrwertige Filter kommagetrennt (?farbfamilie=blau,gruen&format=25mm).
// Unbekannte Werte werden verworfen, damit jede URL eine gültige Ansicht ergibt.

/** Farbfamilien (Schlüssel wie in references.json). Hex nur als Muster-Punkt, nie als Text. */
export const FARBFAMILIEN = Object.freeze([
  { id: "weiss", label: "Weiß", en: "White", fr: "Blanc", it: "Bianco", swatch: "#f2f0ea" },
  { id: "grau", label: "Grau", en: "Grey", fr: "Gris", it: "Grigio", swatch: "#9a9c9e" },
  { id: "schwarz", label: "Schwarz", en: "Black", fr: "Noir", it: "Nero", swatch: "#26282a" },
  { id: "blau", label: "Blau", en: "Blue", fr: "Bleu", it: "Blu", swatch: "#3d79a8" },
  { id: "gruen", label: "Grün", en: "Green", fr: "Vert", it: "Verde", swatch: "#4f8a6a" },
  { id: "gelb", label: "Gelb", en: "Yellow", fr: "Jaune", it: "Giallo", swatch: "#d8b54a" },
  { id: "braun", label: "Braun", en: "Brown", fr: "Brun", it: "Marrone", swatch: "#8a6a4a" },
  { id: "rosa", label: "Rosa", en: "Pink", fr: "Rose", it: "Rosa", swatch: "#d9a3a8" },
  { id: "rot", label: "Rot", en: "Red", fr: "Rouge", it: "Rosso", swatch: "#a83a32" },
]);

/** Formate. `match` = Werte in references.format / gallery.format / formate_verfuegbar.label. */
export const FORMATE = Object.freeze([
  { id: "25mm", label: "25 mm", match: ["25mm", "25mm Safe"] },
  { id: "50mm", label: "50 mm", match: ["50mm", "50 mm", "50 mm Safe"] },
  { id: "hexa", label: "Hexa", match: ["Hexa"] },
]);

/** Einsatzbereiche (Schlüssel wie in references.einsatz / gallery.einsatz). */
export const EINSATZ = Object.freeze([
  { id: "pool-privat", label: "Privatpool", en: "Private pool", fr: "Piscine privée", it: "Piscina privata" },
  { id: "pool-oeffentlich", label: "Öffentliches Bad und Hotel", en: "Public pool and hotel", fr: "Piscine publique et hôtel", it: "Piscina pubblica e hotel" },
  { id: "wellness", label: "Wellness und Spa", en: "Wellness and spa", fr: "Bien-être et spa", it: "Wellness e spa" },
  { id: "bad", label: "Bad und Dusche", en: "Bathroom and shower", fr: "Salle de bains et douche", it: "Bagno e doccia" },
  { id: "kueche", label: "Küche", en: "Kitchen", fr: "Cuisine", it: "Cucina" },
  { id: "innenraum-deko", label: "Wand innen", en: "Interior wall", fr: "Mur intérieur", it: "Parete interna" },
  { id: "wand-innen-aussen", label: "Wand innen und außen, Fassade", en: "Interior and exterior wall, façade", fr: "Mur intérieur et extérieur, façade", it: "Parete interna ed esterna, facciata" },
  { id: "boden", label: "Boden", en: "Floor", fr: "Sol", it: "Pavimento" },
  { id: "boden-rutschhemmend", label: "Boden rutschhemmend", en: "Slip-resistant floor", fr: "Sol antidérapant", it: "Pavimento antiscivolo" },
  { id: "stufen-kanten", label: "Stufen und Kanten", en: "Steps and edges", fr: "Marches et bords", it: "Gradini e bordi" },
  { id: "pool", label: "Pool allgemein", en: "Pools in general", fr: "Piscine en général", it: "Piscina in generale" },
]);

/** Wasserwirkung (Werte wie in references.wasserfarbe / gallery.wasserfarbe; dort String ODER Liste). */
export const WASSERWIRKUNG = Object.freeze([
  { id: "himmelblau", label: "Himmelblau", en: "Sky blue", fr: "Bleu ciel", it: "Azzurro cielo", value: "himmelblau" },
  { id: "tuerkisblau", label: "Türkisblau", en: "Turquoise", fr: "Turquoise", it: "Turchese", value: "türkisblau" },
  { id: "blau", label: "Tiefblau", en: "Deep blue", fr: "Bleu profond", it: "Blu profondo", value: "blau" },
  { id: "gruen", label: "Grün", en: "Green", fr: "Vert", it: "Verde", value: "grün" },
  { id: "graugruen", label: "Graugrün", en: "Grey-green", fr: "Gris-vert", it: "Grigio-verde", value: "graugrün" },
  { id: "natur", label: "Natürlich wie ein Bergsee", en: "Natural, like a mountain lake", fr: "Naturel, comme un lac de montagne", it: "Naturale, come un lago di montagna", value: "natürlich, wie ein Bergsee/Fluss" },
]);

/** Produkttypen. */
export const TYPEN = Object.freeze([
  { id: "mosaik", label: "Mosaik", en: "Mosaic", fr: "Mosaïque", it: "Mosaico" },
  { id: "safe-step", label: "Safe-Step (rutschhemmend)", en: "Safe-Step (slip-resistant)", fr: "Safe-Step (antidérapant)", it: "Safe-Step (antiscivolo)" },
  { id: "corner", label: "Corner (Außenecke)", en: "Corner (outside edge)", fr: "Corner (angle extérieur)", it: "Corner (spigolo esterno)" },
  { id: "cove", label: "Cove (Hohlkehle)", en: "Cove (inside cove)", fr: "Cove (gorge intérieure)", it: "Cove (sguscia)" },
]);

export const LINIEN = Object.freeze([
  { id: "Premium", label: "Premium" },
  { id: "Classic", label: "Classic" },
  { id: "Custom", label: "Individuell", en: "Custom", fr: "Custom", it: "Custom" },
]);

export const OBERFLAECHEN = Object.freeze([
  { id: "glaenzend", label: "Glänzend", en: "Gloss", fr: "Brillant", it: "Lucido", match: ["glänzend", "glänzend, matt"] },
  { id: "matt", label: "Matt", en: "Matt", fr: "Mat", it: "Opaco", match: ["matt", "glänzend, matt"] },
  { id: "satiniert", label: "Satiniert", en: "Satin", fr: "Satiné", it: "Satinato", match: ["satiniert"] },
  { id: "phosphoreszierend", label: "Nachleuchtend", en: "Glow-in-the-dark", fr: "Phosphorescent", it: "Fosforescente", match: ["phosphoreszierend"] },
]);

const ids = (list) => new Set(list.map((x) => x.id));
const MULTI = {
  farbfamilie: ids(FARBFAMILIEN),
  format: ids(FORMATE),
  einsatz: ids(EINSATZ),
  wasser: ids(WASSERWIRKUNG),
  typ: ids(TYPEN),
  linie: ids(LINIEN),
  oberflaeche: ids(OBERFLAECHEN),
};
/** Reihenfolge der Parameter in der URL (stabile, teilbare Links). */
export const FILTER_KEYS = Object.freeze(["q", "kollektion", "linie", "farbfamilie", "farbe", "format", "einsatz", "typ", "safe", "spezial", "wasser", "oberflaeche"]);

const HEX_RE = /^#?([0-9a-f]{6})$/i;
const SLUG_RE = /^[a-z0-9-]{1,40}$/;

function readParam(source, key) {
  if (!source) return undefined;
  if (typeof source.get === "function") return source.getAll ? source.getAll(key).join(",") || undefined : source.get(key) ?? undefined;
  const v = source[key];
  return Array.isArray(v) ? v.join(",") : v;
}

const split = (v) =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * URL-Parameter → Filterobjekt. Nimmt URLSearchParams oder das searchParams-
 * Objekt einer Page (bereits awaited). Ungültige Werte fallen weg.
 * @param {URLSearchParams|Record<string,string|string[]>} source
 * @param {{kollektionen?: string[]}} [known] gültige Kollektions-IDs
 */
export function parseFilters(source, known = {}) {
  const f = {};
  for (const [key, allowed] of Object.entries(MULTI)) {
    const vals = [...new Set(split(readParam(source, key)).filter((v) => allowed.has(v)))];
    if (vals.length) f[key] = vals;
  }
  const kol = [...new Set(split(readParam(source, "kollektion")).filter((v) => SLUG_RE.test(v) && (!known.kollektionen || known.kollektionen.includes(v))))];
  if (kol.length) f.kollektion = kol;
  const hex = HEX_RE.exec(String(readParam(source, "farbe") ?? ""));
  if (hex) f.farbe = `#${hex[1].toLowerCase()}`;
  if (readParam(source, "safe") === "1") f.safe = true;
  if (readParam(source, "spezial") === "1") f.spezial = true;
  const q = String(readParam(source, "q") ?? "").trim().slice(0, 60);
  if (q) f.q = q;
  return f;
}

/** Filterobjekt → Query-String ohne "?" (stabile Reihenfolge, leere Filter fallen weg). */
export function serializeFilters(f = {}) {
  const p = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const v = f[key];
    if (v === undefined || v === null || v === false || (Array.isArray(v) && v.length === 0) || v === "") continue;
    if (v === true) p.set(key, "1");
    else if (Array.isArray(v)) p.set(key, v.join(","));
    else p.set(key, key === "farbe" ? String(v).replace(/^#/, "") : String(v));
  }
  return p.toString().replace(/%2C/g, ",");
}

/** Anzahl aktiver Filter (für „Filter (3)“ und Ergebnis-Ansage). */
export function countActiveFilters(f = {}) {
  return FILTER_KEYS.reduce((n, k) => {
    const v = f[k];
    if (Array.isArray(v)) return n + v.length;
    return v ? n + 1 : n;
  }, 0);
}

// ---------------------------------------------------------------------------
// Farbe: Nähe in CIELAB (ΔE76 reicht für eine Sortierung nach Ähnlichkeit).

function hexToLab(hex) {
  const m = HEX_RE.exec(String(hex || ""));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = lin((n >> 16) & 255), g = lin((n >> 8) & 255), b = lin(n & 255);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x), fy = f(y), fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** ΔE76 zwischen zwei Hex-Farben; Infinity, wenn eine fehlt. */
export function colorDistance(hexA, hexB) {
  const a = hexToLab(hexA), b = hexToLab(hexB);
  if (!a || !b) return Infinity;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Grenze, ab der eine Farbe nicht mehr als „ähnlich“ gilt. */
export const COLOR_MATCH_MAX_DE = 28;

// ---------------------------------------------------------------------------
// Treffer-Logik. Arbeitet auf der schlanken Karte aus data.js (toReferenceCard)
// und auf vollen Datensätzen gleichermaßen.

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const anyIn = (have, want) => want.some((w) => have.includes(w));

/** Formate einer Referenz als Filter-IDs (25mm/50mm/hexa). */
export function formatIdsOf(ref) {
  const labels = [ref.format, ...(ref.formate_verfuegbar || []).map((x) => x.label), ...(ref.formate || [])].filter(Boolean);
  return FORMATE.filter((fm) => labels.some((l) => fm.match.includes(l) || l === fm.id)).map((fm) => fm.id);
}

/** Ist eine Referenz rutschhemmend (Safe-Step oder Safe-Format verfügbar)? */
export function isSafe(ref) {
  if (typeof ref.safe === "boolean") return ref.safe;
  return ref.typ === "safe-step" || Boolean(ref.rutschhemmung) || (ref.formate_verfuegbar || []).some((x) => /safe/i.test(x.label));
}

/**
 * Passt eine Referenz (Karte oder voller Datensatz) zum Filter?
 * `spezial` verlangt, dass es zur Referenz Corner/Cove gibt – das weiß nur
 * data.js (Feld `hatSpezialteile` der Karte) oder der Typ selbst.
 */
export function matchesReference(ref, f = {}) {
  if (f.kollektion && !f.kollektion.includes(ref.kollektion)) return false;
  if (f.linie && !f.linie.includes(ref.linie)) return false;
  if (f.typ && !f.typ.includes(ref.typ)) return false;
  if (f.farbfamilie && !anyIn(ref.farbfamilien || [], f.farbfamilie)) return false;
  if (f.format && !anyIn(formatIdsOf(ref), f.format)) return false;
  if (f.einsatz && !anyIn(ref.einsatz || [], f.einsatz)) return false;
  if (f.wasser) {
    const values = WASSERWIRKUNG.filter((w) => f.wasser.includes(w.id)).map((w) => w.value);
    if (!anyIn([].concat(ref.wasserfarbe ?? []), values)) return false;
  }
  if (f.oberflaeche) {
    const values = OBERFLAECHEN.filter((o) => f.oberflaeche.includes(o.id)).flatMap((o) => o.match);
    if (!values.includes(ref.oberflaeche)) return false;
  }
  if (f.safe && !isSafe(ref)) return false;
  if (f.spezial && !(ref.hatSpezialteile || ref.typ === "corner" || ref.typ === "cove")) return false;
  if (f.farbe) {
    const hex = ref.hex ?? ref.konfigurator?.farbe_hex;
    if (colorDistance(hex, f.farbe) > COLOR_MATCH_MAX_DE) return false;
  }
  if (f.q) {
    // Farbnamen deutsch und englisch (Suche auf /en/ezarri/mosaike: „blue“).
    const fam = (ref.farbfamilien || []).map((id) => FARBFAMILIEN.find((x) => x.id === id)?.en).filter(Boolean);
    const hay = norm([ref.name, ref.code, ref.kollektion, ...(ref.farben || []), ...fam].join(" "));
    if (!norm(f.q).split(/\s+/).every((t) => hay.includes(t))) return false;
  }
  return true;
}

/** Passt ein Galerie-Eintrag zum Filter (Einsatz, Wasser, Farbfamilie, Format, Kollektion, Safe, Spezial)? */
export function matchesGallery(item, f = {}) {
  if (f.kollektion && !f.kollektion.includes(item.kollektion)) return false;
  if (f.farbfamilie && !anyIn(item.farbfamilien || [], f.farbfamilie)) return false;
  if (f.format) {
    const have = FORMATE.filter((fm) => (item.format || []).some((l) => fm.match.includes(l))).map((fm) => fm.id);
    if (!anyIn(have, f.format)) return false;
  }
  if (f.einsatz && !anyIn(item.einsatz || [], f.einsatz)) return false;
  if (f.wasser) {
    const values = WASSERWIRKUNG.filter((w) => f.wasser.includes(w.id)).map((w) => w.value);
    if (!anyIn([].concat(item.wasserfarbe ?? []), values)) return false;
  }
  if (f.safe && !item.antirutsch) return false;
  if (f.spezial && !(item.special_piece || []).length) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Sprache (Welle 2, Englisch): dieselben IDs, Werte und Treffer-Logik, nur die
// Labels wechseln. facetsFor("en") liefert die Listen mit englischem `label`
// (Feld `en`), sodass Aufrufer nur die Quelle tauschen.

// 01.11.2026: dasselbe für fr/it (Felder `fr`, `it`; ohne Feld gilt das englische, dann das deutsche Label).
const LANGS = ["en", "fr", "it"];
const localize = (list, locale) => (LANGS.includes(locale) ? Object.freeze(list.map((x) => Object.freeze({ ...x, label: x[locale] ?? x.en ?? x.label }))) : list);
const TABLES = { FARBFAMILIEN, FORMATE, EINSATZ, WASSERWIRKUNG, TYPEN, LINIEN, OBERFLAECHEN };
const LOCALE_TABLES = Object.freeze(Object.fromEntries(LANGS.map((l) => [l, Object.freeze(Object.fromEntries(Object.entries(TABLES).map(([k, v]) => [k, localize(v, l)])))])));

/** Filterlisten in der Sprache der Seite ({ FARBFAMILIEN, FORMATE, EINSATZ, WASSERWIRKUNG, TYPEN, LINIEN, OBERFLAECHEN }). */
export function facetsFor(locale = "de") {
  return LOCALE_TABLES[locale] ?? TABLES;
}

/** Label zu einer Filter-ID (für ActiveFilters-Chips und Ansagen). */
export function facetLabel(key, id, locale = "de") {
  const t = facetsFor(locale);
  const table = { farbfamilie: t.FARBFAMILIEN, format: t.FORMATE, einsatz: t.EINSATZ, wasser: t.WASSERWIRKUNG, typ: t.TYPEN, linie: t.LINIEN, oberflaeche: t.OBERFLAECHEN }[key];
  return table?.find((x) => x.id === id)?.label ?? id;
}
