// Builds src/lib/sofaplaner/minotti-covers.json (QM Sofaplaner R2 P2-C).
//
// Input: a folder with the public minotti.com product pages of all families
// (one <slug>.html per family, fetched with curl from the URL in the family's
// research file) plus the family research JSON files.
// Output: per family the cover materials and named cover collections that THE
// MINOTTI PRODUCT PAGE OF THAT FAMILY states in its text (name, material,
// category, source URL, short verbatim evidence) – no colours, no images.
// Brand-wide statements (Minotti news pages) live in BRAND below.
//
// Run:  node src/lib/sofaplaner/tools/build-covers.mjs <html-folder>
// Minotti's "World of Materials" (the full cover catalogue) is dealer-only
// behind a login, so names beyond the public pages are NOT included.

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const htmlDir = process.argv[2];
if (!htmlDir) throw new Error("usage: build-covers.mjs <html-folder>");

// name, material, category (German, as the source states it), test
const VOCAB = [
  // generic families: only where the sentence is about the cover/upholstery,
  // not about padding fabric (hypoallergenic cotton) or eco-leather piping
  ["Stoff", "Stoff", "Stoffkollektion von Minotti", { test: (x) => /\bfabrics?\b/i.test(x) && /\bcovers?\b|upholster|version|in fabric|fabric or|or fabric|fabric and/i.test(x) && !/hypoallergenic|laminated|casing|water-?(?:repellent|resistant|proof)|outdoor fabric|eco-leather/i.test(x) }],
  ["Leder", "Leder", "Lederkollektion von Minotti", { test: (x) => /(?<!eco-)\bleathers?\b/i.test(x) && /\bcovers?\b|upholster|version|in leather|leather or|or leather|leather and/i.test(x) && !/eco-leather|bonded leather/i.test(x) }],
  ["Leder Kategorie Extra", "Leder", "Lederkategorie", /\bExtra(?:[- ]grade)? leather\b|\bPelle Extra\b|\bExtra Leather\b/i],
  ["Leder Kategorie Nature", "Leder", "Lederkategorie", /\bNatur(?:e|al) leather\b|\bPelle Nature\b|\bNature Leather\b|\bCat\.? Nature\b/i],
  ["Aspen", "Leder", "Kategorie Nature", /\bAspen\b/],
  ["Nabuk Lodge", "Leder", "Kategorie Nature", /\bNabuk(?: Lodge)?\b|\bLodge leather\b/],
  ["Napa", "Leder", "Kategorie Extra", /\bNapa\b/],
  ["Cervo", "Leder", "Leder mit natürlicher Narbung", /\bCervo\b/],
  ["Coccodrillo", "Leder", "Leder mit Prägung", /\bCoccodrillo\b/],
  ["Pony Look", "Leder", "Fell-Optik", /\bPony (?:Look|Cenere)\b/],
  ["Zebra Look", "Leder", "Fell-Optik", /\bZebra Look\b/],
  ["Sattelleder (Saddle-Hide)", "Sattelleder", "Sattelleder", /\bsaddle-?hide\b/i],
  ["Alcantara®", "Mikrofaser", "Bezugsmaterial", /\bAlcantara\b/],
  ["Mirage", "Stoff", "Stoff mit Schattierungseffekt", /\bMirage fabric\b/],
  ["Art Lifescape", "Outdoor-Stoff", "Outdoor-Stoffkollektion", /\bArt Lifescape\b/],
  ["Batyline®", "Outdoor-Gewebe", "Bespannung", /\bBatyline\b/],
  ["Taslan-Kordel", "Outdoor-Kordel", "Polypropylen, geflochten bzw. gewebt", /\bTaslan\b/],
  ["Polypropylen-Kordel", "Outdoor-Kordel", "Polypropylen", /\bpolypropylene cord\b|\bbraided polypropylene\b|\bcord\b.*\bpolypropylene\b/i],
  ["Wasserabweisender Bezug", "Outdoor-Stoff", "wasserabweisend", /\bwater-?repellent (?:fibre and )?fabric\b|\bwater-?repellent polyester upholstery\b/i],
];

// Statements Minotti makes for the whole collection (not per model).
const BRAND = [
  {
    name: "Baumwolle, Wolle, Leinen",
    material: "Stoff",
    category: "Indoor-Stoffe der Textile and Leather Collection",
    scope: "indoor",
    source: "https://www.minotti.com/en/textile-and-leather-collection-a-project-with-style_2",
    evidence: "A vast range of options connects the indoor - with cottons, wools and linens - with the outdoor",
  },
  {
    name: "Leder, Kategorien Leather, Extra und Nature",
    material: "Leder",
    category: "Lederkategorien",
    scope: "indoor",
    source: "https://www.minotti.com/en/torii",
    evidence: "the three available categories of leather: Leather, Extra leather and Nature leather",
  },
  {
    name: "Boston",
    material: "Leder",
    category: "Leder der Kollektion 2023",
    scope: "indoor",
    source: "https://www.minotti.com/en/2023-textile-and-leather-collectiona-haute-couture-project_2",
    evidence: "The indoor upholstery proposal is also enriched by the new Boston leather",
  },
  {
    name: "Nabuk",
    material: "Leder",
    category: "fester Bestandteil der Kollektion",
    scope: "indoor",
    source: "https://www.minotti.com/en/2023-textile-and-leather-collectiona-haute-couture-project_2",
    evidence: "new nuances for Nabuk, a constant in the collection",
  },
  {
    name: "Sattelleder (Saddle-Hide)",
    material: "Sattelleder",
    category: "Textile and Leather Collection",
    scope: "indoor",
    source: "https://www.minotti.com/en/minotti-launches-the-new-2020-collection",
    evidence: "the refined combination of materials – fabrics, leather and saddle-hide",
  },
  {
    name: "Outdoor-Stoffe aus Polypropylen",
    material: "Outdoor-Stoff",
    category: "100 % recycelbar, atmungsaktiv",
    scope: "outdoor",
    source: "https://www.minotti.com/en/textile-and-leather-collection-a-project-with-style_2",
    evidence: "with the outdoor, featuring yarns in 100% recyclable and breathable polypropylene",
  },
  {
    name: "Kordel",
    material: "Outdoor-Kordel",
    category: "tragendes Element der Outdoor-Serien",
    scope: "outdoor",
    source: "https://www.minotti.com/en/textile-and-leather-collection-a-project-with-style_2",
    evidence: "cord takes on structural meaning for the open-air ranges",
  },
];

const clean = (h) =>
  h
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&[a-z#0-9]+;/g, " ")
    .replace(/\s+/g, " ");

function sentencesOf(html) {
  let t = clean(html);
  const a = t.indexOf("Job Opportunities");
  if (a > 0) t = t.slice(a + 17);
  const b = t.indexOf("2d files");
  if (b > 0) t = t.slice(0, b);
  return t
    .split(/(?<=[.;:])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 12 && !/See the product|images available|CAD files|Privacy|cookie|Download Technical sheet/i.test(x));
}

const famDir = path.join(root, "minotti");
const out = {
  _hinweis:
    "Generiert von tools/build-covers.mjs aus den öffentlichen minotti.com-Produktseiten (Abschnitte Beschreibung, Polsterung, Bezüge). Nur Namen und Materialien, die die Seite nennt; keine Farben, keine Bilder. Die vollständige Material-Bibliothek („The World of Materials“) ist bei Minotti nur mit Fach-Login (Handel, Architektur) zugänglich.",
  abrufdatum: new Date().toISOString().slice(0, 10),
  markenweit: BRAND,
  familien: {},
};
for (const f of fs.readdirSync(famDir).filter((x) => x.endsWith(".json")).sort()) {
  const slug = f.replace(/\.json$/, "");
  const j = JSON.parse(fs.readFileSync(path.join(famDir, f), "utf8"));
  const url = (j.quellen || []).map((x) => (typeof x === "string" ? x : x?.url)).find((x) => x && /minotti\.com\/[a-z]{2}\/[^/]+$/.test(x));
  const file = path.join(htmlDir, `${slug}.html`);
  if (!url || !fs.existsSync(file)) {
    out.familien[slug] = { source: url || null, items: [] };
    continue;
  }
  const sents = sentencesOf(fs.readFileSync(file, "utf8"));
  const items = [];
  for (const [name, material, category, re] of VOCAB) {
    const hit = sents.find((x) => re.test(x));
    if (!hit) continue;
    // "Eco-Nabuk" is piping, not a cover
    if (name === "Nabuk Lodge" && sents.filter((x) => re.test(x)).every((x) => /Eco-Nabuk|eco-nubuck/i.test(x))) continue;
    items.push({ name, material, category, evidence: hit.slice(0, 220) });
  }
  out.familien[slug] = { source: url, items };
}
fs.writeFileSync(path.join(root, "minotti-covers.json"), JSON.stringify(out, null, 1) + "\n");
const n = Object.values(out.familien).filter((x) => x.items.length).length;
console.log(`${n} von ${Object.keys(out.familien).length} Familien mit Bezugsangaben von der eigenen Produktseite`);
