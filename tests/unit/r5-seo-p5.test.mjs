// node --test tests/unit/r5-seo-p5.test.mjs
// Runde 4, Fix-Team P5 (SEO-Inhalte):
//  1. Marke × Kategorie: indexierbar erst ab 4 Modellen (seo P1-1)
//  2. Ezarri-Mosaike: nur eigener Text bzw. < 50 % Ähnlichkeit in der Kollektion (seo P1-2), H1
//  3. BreadcrumbList: jede Stufe außer der letzten hat `item` (seo P1-3)
//  5. llms.txt: NAP aus src/lib/site.js, kein 3D-Versprechen, Concierge nur mit Schlüssel
//  6. Marken-Build: generateStaticParams fällt bei Timeout auf [] zurück (technik P1-5)
//  7./8. Produktseite (Startseite, H1 mit Marke, CTA-Format) und /de/projekte 308 (Quelltext)
// Live-Teil gegen SITEMAP_BASE (Standard http://localhost:3000): Stichproben-Crawl
// der Ezarri-/Marken-URLs aus den Sitemaps ohne 404, BreadcrumbList auf jeder Seite.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_CATEGORY_MIN_MODELS, brandCategoryModelKey, buildBrandCategories, isIndexableBrandCategory } from "../../src/lib/marken/brandCategory.js";
import { brandCategoryRobots } from "../../src/lib/marken/brandCategoryPage.js";
import { toBrandCategoryEntries } from "../../src/lib/seo/sitemap/brandCategorySitemap.js";
import { safeStaticParams } from "../../src/lib/marken/staticParams.js";
import { EZARRI_SIMILARITY_MAX, computeMosaikIndex, jaccard, mosaikHeading, shingles } from "../../src/lib/ezarri/indexierung.js";
import { EZ_MENU_GROUP, ezBreadcrumbList, ezCrumbs } from "../../src/lib/ezarri/crumbs.js";
import { LLMS_HEADER, LLMS_NAP } from "../../src/lib/seo/llms.js";
import { ADDRESS, PHONE_DISPLAY, openingHoursLine } from "../../src/lib/site.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(read(p));

// ------------------------------------------------------------ 1. Marke × Kategorie
const row = (marken, kategories, path_field, extra = {}) => ({
  marken,
  kategories,
  path_field,
  status: "Aktiv",
  produkt_name: `Modell ${path_field}`,
  bild_anhangen: [{ bild_anhangen: `/files/${path_field}.webp` }],
  ...extra,
});

test("1 Marke × Kategorie: Mindestanzahl 4 Modelle, gleiche Regel für Seite und Sitemap", () => {
  assert.equal(BRAND_CATEGORY_MIN_MODELS, 4);
  const [b] = buildBrandCategories([
    ...["a", "b", "c", "d"].map((id) => row("Flos", "lamps", id)),
    ...["e", "f", "g"].map((id) => row("Flos", "rugs", id)),
    // Brand-van-Egmond-Fall: Einträge ohne Bild = leere Galerie
    ...["h", "i", "j", "k", "l"].map((id) => row("Flos", "decor", id, { bild_anhangen: [] })),
    // Varianten desselben Modells zählen einmal
    ...["m", "n", "o", "p"].map((id, i) => row("Flos", "beds", id, { produkt_name: i % 2 ? "Bett (Beds 2)" : "Bett" })),
  ]);
  const by = Object.fromEntries(b.categories.map((c) => [c.slug, c]));
  assert.deepEqual([by.lamps.models, by.lamps.indexable], [4, true]);
  assert.deepEqual([by.rugs.models, by.rugs.indexable], [3, false]);
  assert.deepEqual([by.decor.count, by.decor.models, by.decor.indexable], [5, 0, false]);
  assert.deepEqual([by.beds.count, by.beds.models, by.beds.indexable], [4, 1, false]);
  const urls = toBrandCategoryEntries([b], "https://platzhirsch.studio").map((e) => e.url);
  assert.equal(urls.length, 4, "nur lamps, in 4 Sprachen");
  assert.ok(urls.every((u) => /\/flos\/lamps$/.test(u)));
  // Seite: robots nach derselben Zahl
  for (const c of b.categories) {
    assert.equal(brandCategoryRobots({ models: c.models, collision: c.collision, excluded: c.excluded, products: [] }).index, c.indexable, c.slug);
  }
  assert.equal(isIndexableBrandCategory({ models: 40, collision: true }), false);
  assert.equal(brandCategoryModelKey({ produkt_name: "Twiggy (Sofas)", bild_anhangen: [{ bild_anhangen: "/x" }] }), "twiggy");
  assert.equal(brandCategoryModelKey({ produkt_name: "Twiggy", bild_anhangen: [] }), null);
});

test("1 Route: 0 Modelle → Umleitung auf die Markenseite (Quelltext)", () => {
  const src = read("src/app/[locale]/ueber-uns/marken/[title]/[collection]/page.js");
  // Bewusst geändert (R5-Fix P1, r5-seo P2-2): permanentRedirect() = 308 statt redirect() = 307.
  assert.match(src, /isEmptyCategory\(category\)\) permanentRedirect\(brandPageTarget\(locale, title\)\)/);
  assert.equal(src.match(/isEmptyCategory\(category\)\) permanentRedirect/g).length, 2, "Metadaten und Seite");
});

// ------------------------------------------------------------ 2. Ezarri-Mosaike
const REFS = json("src/lib/ezarri/references.json").referenzen;
const REZEPTE = json("src/lib/ezarri/kombinationen.json").rezepte;

test("2 Ezarri: Ähnlichkeit < 50 % oder eigener Text → index, sonst noindex", () => {
  assert.equal(EZARRI_SIMILARITY_MAX, 0.5);
  assert.equal(jaccard(shingles("a b c d"), shingles("a b c d")), 1);
  assert.equal(jaccard(shingles("a b c d"), shingles("w x y z")), 0);
  const idx = computeMosaikIndex(REFS, REZEPTE);
  const mosaike = REFS.filter((r) => r.typ === "mosaik");
  assert.equal(idx.size, mosaike.length);
  const indexable = [...idx].filter(([, v]) => v.indexable);
  assert.ok(indexable.length > 0 && indexable.length < mosaike.length, String(indexable.length));
  for (const [id, v] of idx) assert.equal(v.indexable, v.maxSimilarity < 0.5 || v.eigenerText, id);
  assert.equal(idx.get("2511-a").indexable, false, "Beispiel aus dem Bericht: Variante");
  // eigenes Feld überstimmt die Ähnlichkeit
  assert.equal(computeMosaikIndex(REFS, REZEPTE, { "2511-a": "Eigener Text von Platzhirsch." }).get("2511-a").indexable, true);
  // Safe/Corner/Cove stehen nicht in der Liste (immer noindex)
  assert.ok(![...idx.keys()].some((id) => REFS.find((r) => r.id === id).typ !== "mosaik"));
});

test("2 Ezarri: H1 nennt Ezarri, Code und Kollektion", () => {
  const r = REFS.find((x) => x.id === "2511-a");
  assert.deepEqual(mosaikHeading(r, "Niebla"), { main: "Ezarri Mosaik 2511-A 25", kollektion: "Kollektion Niebla", text: "Ezarri Mosaik 2511-A 25 · Kollektion Niebla" });
  // Name ohne Code → Code in Klammern
  assert.equal(mosaikHeading({ name: "Basalt 25", code: "BASALT-25" }, "Gea").text, "Ezarri Mosaik Basalt 25 (BASALT-25) · Kollektion Gea");
  const src = read("src/app/[locale]/ezarri/mosaike/[referenz]/page.js");
  assert.match(src, /utility: r\.typ !== "mosaik" \|\| !isIndexableMosaik\(r\)/);
  assert.match(src, /\{h1\.main\}/);
});

test("2 Ezarri: Sitemap-Hook nennt nur indexierbare Mosaike (Quelltext)", () => {
  assert.match(read("src/lib/ezarri/data.js"), /REFERENCES\.referenzen\.filter\(\(r\) => isIndexableMosaik\(r\.id\)\)/);
});

// ------------------------------------------------------------ 3. BreadcrumbList
test("3 Breadcrumbs: Outdoor & Pool hat eine URL; jedes Item außer dem letzten hat item", () => {
  assert.equal(EZ_MENU_GROUP.label, "Outdoor & Pool");
  assert.match(EZ_MENU_GROUP.href, /^\/[a-z]/);
  const sets = [
    ezCrumbs(),
    ezCrumbs({ label: "Konfigurator" }),
    ezCrumbs({ label: "Mosaike", href: "/ezarri/mosaike" }, { label: "Basalt 25" }),
    ezCrumbs({ label: "Kollektionen", href: "/ezarri/kollektionen" }, { label: "Gea" }),
    ezCrumbs({ label: "Technik", href: "/ezarri/technik" }, { label: "Pflege" }),
  ];
  for (const crumbs of sets) {
    assert.ok(crumbs.slice(0, -1).every((c) => c.href), "sichtbar: jede Stufe vor der letzten verlinkt");
    const list = ezBreadcrumbList(crumbs);
    const items = list.itemListElement;
    items.slice(0, -1).forEach((it) => assert.match(it.item, /^https:\/\/platzhirsch\.studio\/de/, it.name));
    items.forEach((it, i) => assert.equal(it.position, i + 1));
  }
  assert.equal(ezBreadcrumbList(ezCrumbs({ label: "Konfigurator" }), { pageHref: "/ezarri/konfigurator" }).itemListElement.at(-1).item, "https://platzhirsch.studio/de/ezarri/konfigurator");
  assert.throws(() => ezBreadcrumbList([{ label: "A" }, { label: "B" }]), /ohne URL/);
  // Konfigurator gibt eine BreadcrumbList aus
  // QM-Endabnahme 02.11.2026, bewusst geändert: Konfigurator viersprachig → toolCrumbsSchema(crumbs, locale, PATH)
  // (src/lib/ezarri/konfigurator/seo.js, ruft ezBreadcrumbList mit pageHref und Sprach-URLs).
  assert.match(read("src/app/[locale]/ezarri/konfigurator/page.js"), /toolCrumbsSchema\(crumbs, locale, PATH\)/);
  assert.match(read("src/lib/ezarri/konfigurator/seo.js"), /ezBreadcrumbList\(crumbs, \{ siteUrl: SITE_URL, locale: toolLang\(locale\), pageHref \}\)/);
});

// ------------------------------------------------------------ 5. llms.txt
test("5 llms.txt: NAP aus site.js, kein 3D-Versprechen, Concierge nur mit Schlüssel", () => {
  assert.ok(LLMS_HEADER.includes(LLMS_NAP));
  assert.ok(LLMS_NAP.includes(`${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}`));
  assert.match(LLMS_NAP, /Landstraße 11, 6911 Lochau/);
  assert.ok(LLMS_NAP.includes(PHONE_DISPLAY));
  assert.ok(LLMS_NAP.includes(openingHoursLine("de")));
  // NAP direkt unter dem Blockzitat
  const lines = LLMS_HEADER.split("\n");
  const quote = lines.findIndex((l) => l.startsWith("> "));
  assert.match(lines[quote + 2], /^- Adresse: /);
  const route = read("src/app/llms.txt/route.js");
  assert.doesNotMatch(route, /3D-Raum|begehbar/);
  assert.match(route, /conciergeAvailable: conciergeLive\(\)/);
  assert.match(route, /import \{ conciergeLive \} from "@\/lib\/concierge\/config"/);
});

// ------------------------------------------------------------ 6. Marken-Build
test("6 safeStaticParams: Timeout und Fehler → [], sonst Liste", async () => {
  const slow = () => new Promise((r) => setTimeout(() => r([{ name1: "Minotti" }]), 200));
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.deepEqual(await safeStaticParams(slow, (d) => d.map(() => ({ title: "minotti" })), { timeoutMs: 20 }), []);
    assert.deepEqual(await safeStaticParams(() => Promise.reject(new Error("502")), () => [{ title: "x" }]), []);
    assert.deepEqual(await safeStaticParams(() => { throw new Error("sync"); }, () => [{ title: "x" }]), []);
  } finally {
    console.warn = warn;
  }
  assert.deepEqual(await safeStaticParams(async () => [{ name1: "A" }, { name1: "" }], (d) => d.map((m) => ({ title: m.name1.toLowerCase() }))), [{ title: "a" }]);
  for (const p of ["src/app/[locale]/ueber-uns/marken/[title]/page.js", "src/app/[locale]/ueber-uns/marken/[title]/[collection]/page.js"]) {
    const src = read(p);
    assert.match(src, /safeStaticParams\(/, p);
    assert.match(src, /export const dynamicParams = true;/, p);
  }
});

// ------------------------------------------------------------ 7./8. Produkt, Projekte
test("7 Produktseite: Startseite (sprachabhängig), H1 mit Marke, CTA im Header-Format", () => {
  const src = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(src, /const Home = homeCrumbLabel\(locale\);/);
  assert.doesNotMatch(src, /: "Home";/);
  assert.match(src, /\{productHeading\}\s*<\/Heading>/);
  assert.match(src, /withContext\(beratungBase, \{ produkt: cleanText\(productHeading, 120\) \}\)/);
});

test("8 /de/projekte: 308 (permanentRedirect)", () => {
  assert.match(read("src/app/[locale]/projekte/page.js"), /permanentRedirect\("\/de\/arbeitsweise"\)/);
});

// ---------------------------------------------------------------- live ---
// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const BASE = process.env.SITEMAP_BASE || process.env.QA_BASE || "";
let live = true;
try {
  await fetch(`${BASE}/robots.txt`, { signal: AbortSignal.timeout(10000) });
} catch {
  live = false;
  console.warn(`r5-seo-p5: dev server not reachable at ${BASE}, live tests skipped`);
}
const liveSkip = live ? false : `dev server not reachable at ${BASE}`;
const get = (p, init = {}) => fetch(`${BASE}${p}`, { redirect: "manual", signal: AbortSignal.timeout(240000), ...init });
const locs = (xml) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
const ldNodes = (html) => {
  const out = [];
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== "object") return;
    out.push(n);
    if (n["@graph"]) walk(n["@graph"]);
  };
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1]));
    } catch {
      /* gemeldet in seo.spec.js */
    }
  }
  return out;
};

test("live: Stichproben-Crawl Ezarri/Marken aus den Sitemaps – kein 404, index, gültige BreadcrumbList", { skip: liveSkip }, async () => {
  const stat = locs(await (await get("/sitemap-static.xml")).text());
  const marken = locs(await (await get("/sitemap-marken.xml")).text());
  assert.ok(!marken.some((u) => /brand-van-egmond\/lamps$/.test(u)), "van-egmond/lamps nicht in der Sitemap");
  const ez = stat.filter((u) => u.includes("/de/ezarri"));
  const mosaike = ez.filter((u) => u.includes("/ezarri/mosaike/"));
  assert.ok(mosaike.length > 0 && mosaike.length < 281, `${mosaike.length} Mosaike in der Sitemap`);
  const cats = marken.filter((u) => /\/de\/ueber-uns\/marken\/[^/]+\/[^/]+$/.test(u));
  const pick = (list, n) => list.filter((_, i) => i % Math.max(1, Math.floor(list.length / n)) === 0).slice(0, n);
  const sample = [...pick(ez.filter((u) => !u.includes("/mosaike/")), 6), ...pick(mosaike, 6), ...pick(cats, 6), "https://platzhirsch.studio/de/ezarri/konfigurator"];
  for (const url of sample) {
    const p = url.replace("https://platzhirsch.studio", "");
    const res = await get(p);
    assert.equal(res.status, 200, p);
    const html = await res.text();
    const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "";
    assert.doesNotMatch(robots, /noindex/, `${p} steht in der Sitemap, also index`);
    const lists = ldNodes(html).filter((n) => n["@type"] === "BreadcrumbList");
    assert.ok(lists.length > 0, `${p}: BreadcrumbList`);
    for (const l of lists) l.itemListElement.slice(0, -1).forEach((it) => assert.ok(it.item, `${p}: ${it.name} ohne item`));
  }
});

test("live: van-egmond/lamps in 4 Sprachen nicht index; llms.txt ohne nicht indexierte Seiten", { skip: liveSkip }, async () => {
  for (const p of ["/de/ueber-uns/marken", "/en/about-us/brands", "/fr/a-propos/marques", "/it/chi-siamo/marche"]) {
    const res = await get(`${p}/brand-van-egmond/lamps`);
    if (res.status >= 300 && res.status < 400) {
      assert.match(res.headers.get("location"), /\/brand-van-egmond$/, p);
    } else {
      assert.match((await res.text()).match(/<meta name="robots" content="([^"]*)"/)?.[1] || "", /noindex/, p);
    }
  }
  const llms = await (await get("/llms.txt")).text();
  assert.match(llms, /Landstraße 11, 6911 Lochau/);
  assert.doesNotMatch(llms, /brand-van-egmond\/lamps|ezarri\/mosaike\/2511-a\b|3D-Raum/);
});
