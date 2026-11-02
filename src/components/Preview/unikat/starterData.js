// Prototyp „Unikat“ – Daten für Raum-Starter, Zahlen-Kacheln und Marquee.
// Nur Server: liest den statischen Herstellerkatalog (src/lib/katalog, keine
// Backoffice-Anfrage) und den Claim-Guard. Der Client bekommt nur die fertige,
// kleine Auswahl (4 Räume × 4 Stile × 3 Produkte).
//
// Regeln: keine Preise, keine Zeit-/Ersparnisangaben, nur Marken mit
// belegtem Händlerstatus im Katalog (MARKE.dealer). Die Stil-Zuordnung ist
// eine Textsuche in den Material-/Farbangaben der Hersteller – das sagt die
// Oberfläche auch so („nach Herstellerangaben“), keine Stilbehauptung.
import fs from "node:fs";
import path from "node:path";
import { ALLE_PRODUKTE, KATALOG_MARKEN, letzterStand, markePath, produktPath, produkteByWelt } from "@/lib/katalog";
import { FEATURED_BRANDS, brandHref } from "@/lib/content/brands";

const MARKEN_BASE = "/ueber-uns/marken";

export const STILE = [
  { id: "natur", label: "Natürlich", re: /holz|eiche|nuss|stein|marmor|leinen|keramik|\bton\b|rattan|travertin|kork|naturstein|wachs/i },
  { id: "pur", label: "Puristisch", re: /wei(ß|ss)|schwarz|edelstahl|glas|matt|beton|aluminium|grau|chrom/i },
  { id: "warm", label: "Warm & edel", re: /messing|gold|bronze|kupfer|leder|samt|amber|rauch|patina|vergoldet/i },
  { id: "farbe", label: "Farbig", re: /grün|blau|\brot\b|gelb|rosa|terrakotta|orange|türkis|farbig|bunt/i },
];

// Nur Bilder, die wirklich in public/ liegen (einige Katalogbilder fehlen lokal).
const hasFile = (src) => fs.existsSync(path.join(process.cwd(), "public", src));
const bildVon = (p) => {
  const da = (p.bilder || []).filter((b) => hasFile(b.src));
  return da.find((b) => b.typ === "freisteller") || da[0] || null;
};

const dealerSlugs = new Set(KATALOG_MARKEN.filter((m) => m.dealer).map((m) => m.slug));
const markeName = (slug) => KATALOG_MARKEN.find((m) => m.slug === slug)?.name || slug;

const RAEUME = [
  {
    id: "wohnen",
    label: "Wohnzimmer",
    thema: "sofa",
    pool: () => produkteByWelt("accessoires").filter((p) => ["wohnaccessoire", "vase", "duftkerze", "diffuser"].includes(p.kategorie)),
    poolNote: "Vorschläge aus den Accessoires für das Wohnzimmer",
    welten: [
      { label: "Wohnen im Showroom", href: "/produkte/sofas-couches" },
      { label: "Accessoires", href: "/accessoires/produkte" },
    ],
    marken: () => FEATURED_BRANDS.filter((b) => ["minotti", "poliform", "flos", "tom-dixon", "classicon"].includes(b.slug)).map((b) => ({ name: b.name, href: brandHref(b, MARKEN_BASE) })),
  },
  {
    id: "kueche",
    label: "Küche",
    thema: "kueche",
    pool: () => produkteByWelt("kuechengeraete"),
    poolNote: "Vorschläge aus den Küchengeräten",
    welten: [
      { label: "Küchen planen", href: "/kuechen-vorarlberg" },
      { label: "Küchengeräte", href: "/kuechengeraete" },
    ],
    marken: () => katalogMarken("kuechengeraete"),
  },
  {
    id: "bad",
    label: "Bad & Wellness",
    thema: "bad",
    pool: () => produkteByWelt("bad-wellness").filter((p) => p.bereich === "bad" || p.bereich === "wellness"),
    poolNote: "Vorschläge aus Bad & Wellness",
    welten: [{ label: "Bad & Wellness", href: "/bad-wellness" }],
    marken: () => katalogMarken("bad-wellness"),
  },
  {
    id: "hotelspa",
    label: "Hotel-Spa",
    thema: "hotel",
    pool: () => produkteByWelt("bad-wellness").filter((p) => p.bereich === "objekt" || p.bereich === "wellness"),
    poolNote: "Vorschläge aus Wellness und Objekt",
    welten: [
      { label: "Hotel & Objekt", href: "/hotel-objekt" },
      { label: "Bad & Wellness", href: "/bad-wellness" },
    ],
    marken: () => katalogMarken("bad-wellness"),
  },
];

function katalogMarken(welt) {
  return KATALOG_MARKEN.filter((m) => m.welt === welt && m.dealer && ALLE_PRODUKTE.some((p) => p.marke === m.slug)).map((m) => ({ name: m.name, href: markePath(welt, m.slug) }));
}

const textOf = (p) => [p.kurz?.de, ...(p.merkmale || []).map((m) => m?.de)].filter(Boolean).join(" ");

/** 3 Produkte, möglichst verschiedene Marken, deterministisch. */
function pick(list, n = 3) {
  const byBrand = new Map();
  for (const p of list) {
    if (!byBrand.has(p.marke)) byBrand.set(p.marke, []);
    byBrand.get(p.marke).push(p);
  }
  const queues = [...byBrand.values()];
  const out = [];
  for (let round = 0; out.length < n && round < 10; round++) {
    for (const q of queues) {
      if (out.length >= n) break;
      if (q[round]) out.push(q[round]);
    }
  }
  return out;
}

function card(p) {
  const img = bildVon(p);
  return {
    slug: p.slug,
    name: p.name,
    marke: markeName(p.marke),
    href: produktPath(p.welt, p.slug),
    image: { src: img.src, alt: img.alt?.de || `${markeName(p.marke)} ${p.name}`, width: img.width, height: img.height },
  };
}

/** Stil-Chips für den Client (ohne RegExp). */
export const stilOptionen = () => STILE.map(({ id, label }) => ({ id, label }));

export function starterData() {
  return RAEUME.map((r) => {
    const pool = r.pool().filter((p) => dealerSlugs.has(p.marke) && bildVon(p));
    const vorschlaege = {};
    for (const st of STILE) {
      const hits = pool.filter((p) => st.re.test(textOf(p)));
      const chosen = pick(hits.length >= 3 ? hits : [...hits, ...pool]);
      vorschlaege[st.id] = { cards: chosen.map(card), exact: hits.length >= 3 };
    }
    return { id: r.id, label: r.label, thema: r.thema, poolNote: r.poolNote, welten: r.welten, marken: r.marken().slice(0, 6), vorschlaege };
  });
}

// ---------------------------------------------------------------------------
// Zahlen (zur Laufzeit gezählt)

const WELT_LABEL = { "bad-wellness": "Bad & Wellness", kuechengeraete: "Küchengeräte", accessoires: "Accessoires" };
const WELT_HREF = { "bad-wellness": "/bad-wellness", kuechengeraete: "/kuechengeraete", accessoires: "/accessoires/produkte" };

export function katalogZahlen() {
  const welten = Object.keys(WELT_LABEL).map((id) => ({ id, label: WELT_LABEL[id], href: WELT_HREF[id], count: produkteByWelt(id).length }));
  return {
    produkte: ALLE_PRODUKTE.length,
    katalogMarken: new Set(ALLE_PRODUKTE.map((p) => p.marke)).size,
    welten,
    stand: letzterStand(ALLE_PRODUKTE),
  };
}

/** Markennamen für den Lauftext: Startseiten-Auswahl + Katalogmarken (nur Namen). */
export function marqueeNamen() {
  const names = [...FEATURED_BRANDS.map((b) => b.name), ...KATALOG_MARKEN.filter((m) => m.dealer).map((m) => m.name)];
  return [...new Set(names)];
}
