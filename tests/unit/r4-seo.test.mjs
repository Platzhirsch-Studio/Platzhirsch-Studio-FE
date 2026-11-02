// R4-seo: audit parsers, hreflang reciprocity, Rich-Results validation, site
// JSON-LD through the dealer filter, llms ↔ Yacht JSON-LD wording,
// indexableBrandCategoryHref, and (live, skipped without :3000) "no SEO loss"
// against the baseline snapshot plus the imported catalogues in
// /sitemap-produkte.xml.
// Run: node --test tests/unit/r4-seo.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  checkHreflangReciprocity,
  diffUrlSets,
  isNoindex,
  jsonLdNodes,
  parseHead,
  parseLocs,
  parseUrlset,
  richResultKind,
  richResultWarnings,
  spreadSample,
  validateRichResult,
} from "../../src/lib/seo/audit/seoAudit.js";
import { SHOWROOM_BRANDS, organizationNode, siteSchema, splitBrandsByDealerFilter } from "../../src/lib/seo/siteSchema.js";
import { ADDRESS, openingHoursSpecification } from "../../src/lib/site.js";
import { findClaims, VERIFIED_DEALER_BRANDS, toBrandSlug } from "../../src/lib/legal/claims.js";
import { EXTRA_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";
import { buildBrandCategories, brandCategoryHref, indexableBrandCategoryHref } from "../../src/lib/marken/brandCategory.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => readFileSync(`${ROOT}${p}`, "utf8");
// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const BASE = process.env.BASE_URL || process.env.SITEMAP_BASE || process.env.QA_BASE || "";
const SITE = "https://platzhirsch.studio";

// ---------------------------------------------------------------- parsers
test("parseLocs/parseUrlset lesen Index und urlset", () => {
  const xml = `<?xml version="1.0"?><urlset><url><loc>${SITE}/de</loc><lastmod>2026-10-07T00:00:00.000Z</lastmod></url><url><loc>${SITE}/de/a&amp;b</loc></url></urlset>`;
  assert.deepEqual(parseLocs(xml), [`${SITE}/de`, `${SITE}/de/a&b`]);
  assert.deepEqual(parseUrlset(xml), [
    { loc: `${SITE}/de`, lastmod: "2026-10-07T00:00:00.000Z" },
    { loc: `${SITE}/de/a&b`, lastmod: null },
  ]);
});

test("parseHead liest robots, canonical, hrefLang (auch im body) und JSON-LD", () => {
  const html = `<html><head><link rel="canonical" href="${SITE}/de/x"/></head><body>
    <meta name="robots" content="noindex, follow"/>
    <link rel="alternate" hrefLang="de" href="${SITE}/de/x"/><link rel="alternate" hreflang="en" href="${SITE}/en/x"/>
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","itemListElement":[]}]}</script>
    <script type="application/ld+json">{kaputt</script></body></html>`;
  const h = parseHead(html);
  assert.equal(h.robots, "noindex, follow");
  assert.equal(h.canonical, `${SITE}/de/x`);
  assert.deepEqual(h.hreflang, { de: `${SITE}/de/x`, en: `${SITE}/en/x` });
  assert.equal(h.jsonLd.length, 1);
  assert.equal(h.jsonLdErrors, 1);
  assert.equal(isNoindex(h.robots), true);
  assert.equal(isNoindex("index, follow"), false);
  assert.equal(isNoindex("none"), true);
  assert.deepEqual(jsonLdNodes(h.jsonLd).map((n) => n["@type"]), ["BreadcrumbList"]);
});

// ---------------------------------------------------------------- rich results
test("Rich Results: Product, FAQPage, BreadcrumbList, LocalBusiness", () => {
  assert.equal(richResultKind({ "@type": ["Organization", "FurnitureStore"] }), "LocalBusiness");
  assert.equal(richResultKind({ "@type": "WebSite" }), null);

  assert.deepEqual(validateRichResult({ "@type": "Product", name: "Sofa", image: ["x"] }), []);
  assert.deepEqual(validateRichResult({ "@type": "Product" }), ["Product.name fehlt"]);
  assert.deepEqual(richResultWarnings({ "@type": "Product", name: "Sofa" }), [
    "Product.image fehlt",
    "kein Produkt-Snippet (ohne offers/review, bewusst)",
  ]);

  const faq = { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "F?", acceptedAnswer: { "@type": "Answer", text: "A." } }] };
  assert.deepEqual(validateRichResult(faq), []);
  assert.deepEqual(validateRichResult({ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "F?" }] }), [
    "FAQ 1: acceptedAnswer.text fehlt",
  ]);

  const crumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Start", item: `${SITE}/de` },
      { "@type": "ListItem", position: 2, name: "Hier" },
    ],
  };
  assert.deepEqual(validateRichResult(crumbs), []);
  const bad = structuredClone(crumbs);
  bad.itemListElement[0].item = "/de";
  bad.itemListElement[1].position = 3;
  assert.deepEqual(validateRichResult(bad), ["Breadcrumb 1: item nicht absolut", "Breadcrumb 2: position 3"]);
});

// ---------------------------------------------------------------- hreflang
test("hreflang-Reziprozität: Rückverweis, Selbstverweis, Ziel-Status", () => {
  const de = `${SITE}/de/x`;
  const en = `${SITE}/en/x`;
  const ok = new Map([
    [de, { status: 200, hreflang: { de, en, "x-default": de } }],
    [en, { status: 200, hreflang: { de, en, "x-default": de } }],
  ]);
  assert.deepEqual(checkHreflangReciprocity(ok), { errors: [], unchecked: 0, pairs: 3 });

  const oneWay = new Map([
    [de, { status: 200, hreflang: { de, en } }],
    [en, { status: 200, hreflang: { en } }],
  ]);
  const r = checkHreflangReciprocity(oneWay);
  assert.deepEqual(r.errors.map((e) => e.problem), ["Ziel verweist nicht zurück"]);

  const gone = new Map([
    [de, { status: 200, hreflang: { de, en } }],
    [en, { status: 404, hreflang: {} }],
  ]);
  assert.deepEqual(checkHreflangReciprocity(gone).errors.map((e) => e.problem), ["Ziel liefert 404"]);

  const noSelf = new Map([[de, { status: 200, hreflang: { en } }]]);
  const r2 = checkHreflangReciprocity(noSelf);
  assert.deepEqual(r2.errors.map((e) => e.problem), ["kein Selbstverweis"]);
  assert.equal(r2.unchecked, 1);
});

test("spreadSample ist deterministisch und gleichmäßig, diffUrlSets findet Verluste", () => {
  const list = Array.from({ length: 100 }, (_, i) => i);
  assert.deepEqual(spreadSample(list, 4), [0, 25, 50, 75]);
  assert.deepEqual(spreadSample(list, 4), spreadSample(list, 4));
  assert.equal(spreadSample(list, 500).length, 100);
  assert.deepEqual(diffUrlSets(["a", "b"], ["b", "c"]), { lost: ["a"], added: ["c"] });
});

// ---------------------------------------------------------------- site JSON-LD
// F6 (28.10.2026): Ezarri ist laut Inhaber-Entscheidung Nr. 7 belegter Vertragshändler
// (CLAIM_REGISTER) → zweite brand-Marke; brand-Knoten tragen die @id der Markenseiten.
// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti (Markenseite) und die 7 Bad-&-Wellness-
// Marken (Nr. 19/21, eigene Liste DEALER_ONLY_BRANDS, keine Showroom-Aussage) kommen hinzu; @id wie die
// ItemList auf /bad-wellness (brandNodeId), also kein toter #brand-Verweis.
// Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): die 6 Küchengeräte-Marken kommen in
// DEALER_ONLY_BRANDS hinzu (keine Showroom-Aussage); @id wie die ItemList auf /kuechengeraete.
test("Organization: brand nur belegte Händler-Marken (ClassiCon, Ezarri, Minotti, Bad & Wellness, Küchengeräte), alle anderen neutral unter knowsAbout", () => {
  const org = organizationNode();
  assert.deepEqual(org.brand, [
    { "@type": "Brand", "@id": "https://platzhirsch.studio/#brand/minotti", name: "Minotti" },
    // Inhaber-Entscheidung Nr. 32 (bewusst geändert, SEO-Team A 31.10.2026): Flos und Tom Dixon (Showroom-Marken, Markenseite) über den Händler-Filter.
    { "@type": "Brand", "@id": "https://platzhirsch.studio/#brand/flos", name: "Flos" },
    { "@type": "Brand", "@id": "https://platzhirsch.studio/#brand/tom-dixon", name: "Tom Dixon" },
    { "@type": "Brand", "@id": "https://platzhirsch.studio/#brand/classicon", name: "ClassiCon" },
    { "@type": "Brand", "@id": "https://platzhirsch.studio/#brand/ezarri", name: "Ezarri" },
    ...["Dornbracht", "antoniolupi", "Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura",
      "Gaggenau", "Miele", "V-ZUG", "BORA", "Liebherr", "Quooker",
      // Inhaber-Entscheidungen Nr. 27/28 (bewusst geändert, SEO-Team A 31.10.2026): Baobab Collection, Riedel und Cire Trudon kommen hinzu (DEALER_ONLY_BRANDS, keine Showroom-Aussage).
      "Baobab Collection", "Riedel", "Cire Trudon",
      // Inhaber-Entscheidung Nr. 32 (bewusst geändert, SEO-Team A 31.10.2026): Accessoire-Marken in DEALER_ONLY_BRANDS.
      "Zalto", "Assouline", "Kähler", "Lyngby Porcelæn"].map((name) => ({
      "@type": "Brand", "@id": `https://platzhirsch.studio/#brand/${toBrandSlug(name)}`, name,
    })),
  ]);
  // Bad & Wellness steht NICHT in der Showroom-Liste (Showroom-Bereich erst ab Sommer 2027).
  for (const n of ["Dornbracht", "antoniolupi", "Starpool", "Soleum", "Fabio Alemanno", "Aquavia Spa", "Naggura", "Agape"]) assert.ok(!SHOWROOM_BRANDS.includes(n), n);
  // Gleiche @id wie die ItemList auf /bad-wellness.
  assert.match(read("src/components/BadWellness/BadWellnessPage.js"), /"@id": brandNodeId\(m\.id\)/);
  // Küchengeräte: nicht in der Showroom-Liste, gleiche @id wie die ItemList auf /kuechengeraete.
  for (const n of ["Gaggenau", "Miele", "V-ZUG", "BORA", "Liebherr", "Quooker"]) assert.ok(!SHOWROOM_BRANDS.includes(n), n);
  assert.match(read("src/components/Kuechengeraete/KuechengeraetePage.js"), /"@id": brandNodeId\(m\.id\)/);
  // Unbelegte Marken bleiben neutral.
  assert.ok(!org.brand.some((b) => ["Poliform", "Rimadesio", "Agape"].includes(b.name)));
  for (const b of org.brand) assert.ok(VERIFIED_DEALER_BRANDS.includes(toBrandSlug(b.name)));
  const { dealer, neutral } = splitBrandsByDealerFilter();
  // Keine Marke geht verloren: dealer + neutral = Showroom-Liste.
  assert.deepEqual([...dealer, ...neutral].sort(), [...SHOWROOM_BRANDS].sort());
  // knowsAbout = Kern-USP-Themen (Text) + neutrale Marken (Brand).
  assert.deepEqual(org.knowsAbout.filter((b) => typeof b === "object").map((b) => b.name), neutral);
  assert.ok(org.knowsAbout.includes("Einrichtungsplanung mit Handzeichnung"));
  assert.ok(!neutral.includes("ClassiCon") && !neutral.includes("Ezarri") && !neutral.includes("Minotti"));
  assert.ok(neutral.includes("Poliform") && neutral.includes("Rimadesio"));
  // Kein Händler-/Superlativ-Claim im Beschreibungstext.
  assert.deepEqual(findClaims(org.description), []);
  assert.doesNotMatch(JSON.stringify(siteSchema()), /händler|offiziell|dealer|größte|führend/i);
});

test("LocalBusiness: Adresse und Öffnungszeiten aus src/lib/site.js, Rich-Result gültig", () => {
  const org = organizationNode();
  assert.deepEqual(org.openingHoursSpecification, openingHoursSpecification());
  assert.equal(org.address.streetAddress, ADDRESS.street);
  assert.equal(org.address.postalCode, ADDRESS.postalCode);
  assert.equal(richResultKind(org), "LocalBusiness");
  assert.deepEqual(validateRichResult(org), []);
  const graph = siteSchema()["@graph"];
  assert.deepEqual(graph.map((n) => n["@type"]), [["Organization", "FurnitureStore"], "WebSite"]);
  assert.equal(graph[1].publisher["@id"], org["@id"]);
});

test("structuredData.js re-exportiert siteSchema (eine Quelle für das Layout)", () => {
  assert.match(read("src/lib/seo/structuredData.js"), /export \{ siteSchema[^}]*\} from "\.\/siteSchema\.js"/);
});

// ---------------------------------------------------------------- llms ↔ Yacht
// Since 28.10.2026 the Yacht page is noindex (owner decision 27.10., 23:32,
// Navetta 42 photos not released) → no llms/sitemap entry. The JSON-LD keeps
// the wording that the llms line must use again once the page is indexable.
// Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9: Bild weglassen statt Seite verstecken): indexierbar, llms-Zeile = JSON-LD-Beschreibung.
test("Yacht: indexierbar, in EXTRA_PAGES mit dem JSON-LD-Satz", () => {
  const entry = EXTRA_PAGES.find((p) => p.path === "/yacht-interior");
  const sentence = "Aufmaß, Fertigung und Montage übernehmen Bootssattler und Werft; Platzhirsch koordiniert die Termine.";
  assert.ok(entry && entry.llms.includes(sentence));
  const page = read("src/app/[locale]/yacht-interior/page.js");
  assert.doesNotMatch(page, /index: false/);
  assert.ok(page.includes(sentence), "Yacht-JSON-LD hat den Satz nicht mehr");
  assert.doesNotMatch(page, /umgesetzt mit|Bootssattlern und Werften/);
});

// ---------------------------------------------------------------- brandCategoryHref
test("indexableBrandCategoryHref: Link nur auf indexierbare Marke × Kategorie (für R4-produkt)", () => {
  // Runde 4 P5: indexierbar ab 4 Modellen (eigener Name + Bild), nicht mehr ab 3 Einträgen.
  const row = (marken, kategories, path_field) => ({
    marken,
    kategories,
    path_field,
    status: "Aktiv",
    produkt_name: `Modell ${path_field}`,
    bild_anhangen: [{ bild_anhangen: `/files/${path_field}.webp` }],
  });
  const [minotti] = buildBrandCategories([
    row("Minotti", "sofas-couches", "a"),
    row("Minotti", "sofas-couches", "b"),
    row("Minotti", "sofas-couches", "c"),
    row("Minotti", "sofas-couches", "e"),
    row("Minotti", "beds", "d"),
  ]);
  assert.equal(
    indexableBrandCategoryHref(minotti.categories, "Minotti", "sofas-couches", "en"),
    brandCategoryHref("Minotti", "sofas-couches", "en")
  );
  assert.equal(indexableBrandCategoryHref(minotti.categories, "Minotti", "Sofas Couches"), "/ueber-uns/marken/minotti/sofas-couches");
  assert.equal(indexableBrandCategoryHref(minotti.categories, "Minotti", "beds"), null, "< 4 Modelle → noindex → kein Link");
  assert.equal(indexableBrandCategoryHref(minotti.categories, "Minotti", "lamps"), null);
  assert.equal(indexableBrandCategoryHref(undefined, "Minotti", "beds"), null);
});

// ---------------------------------------------------------------- live
async function reachable() {
  try {
    const res = await fetch(`${BASE}/sitemap.xml`, { signal: AbortSignal.timeout(20_000) });
    return res.ok;
  } catch {
    return false;
  }
}
const LIVE = await reachable();
const BASELINE = `${ROOT}qa-screenshots/teamleiter/r4-seo/baseline`;

// URLs that may leave a sitemap, each with its reason (documented in
// Marktresearch/digital/teamleiter/r4-R4-seo.md). Empty in R4.
// Yacht is indexable again since the integration (28.10.2026) → no removal left.
const DOCUMENTED_REMOVALS = new Map([]);

// Runde 4 P5 (seo P1-1): Marke × Kategorie-Seiten mit weniger als 4 Modellen
// sind bewusst noindex,follow (bzw. bei 0 Modellen eine Umleitung auf die
// Markenseite) und fallen deshalb aus sitemap-marken.xml. Erlaubt ist das nur,
// wenn die deutsche Seite live wirklich nicht indexierbar ist.
const BRAND_CATEGORY_URL = /^https:\/\/platzhirsch\.studio\/(?:de\/ueber-uns\/marken|en\/about-us\/brands|fr\/a-propos\/marques|it\/chi-siamo\/marche)\/([^/]+)\/([^/]+)$/;
async function notIndexableBrandCategory(url, cache) {
  const m = url.match(BRAND_CATEGORY_URL);
  if (!m) return false;
  const key = `${m[1]}/${m[2]}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      (async () => {
        const res = await fetch(`${BASE}/de/ueber-uns/marken/${key}`, { redirect: "manual", signal: AbortSignal.timeout(240_000) });
        if (res.status >= 300 && res.status < 400) return true;
        const robots = (await res.text()).match(/<meta name="robots" content="([^"]*)"/)?.[1] || "";
        return /noindex/.test(robots);
      })()
    );
  }
  return cache.get(key);
}

test("Kein SEO-Verlust: jede Baseline-URL steht weiter in einer Sitemap", { skip: !LIVE || !existsSync(BASELINE) ? "Server :3000 oder Baseline fehlt" : false }, async () => {
  const sections = ["sitemap-static.xml", "sitemap-marken.xml", "sitemap-news.xml", "sitemap-produkte.xml"];
  const before = sections.flatMap((s) => parseLocs(readFileSync(`${BASELINE}/${s}`, "utf8")));
  const after = [];
  for (const s of sections) after.push(...parseLocs(await (await fetch(`${BASE}/${s}`)).text()));
  const { lost } = diffUrlSets(before, after);
  const cache = new Map();
  const undocumented = [];
  for (const u of lost) if (!DOCUMENTED_REMOVALS.has(u) && !(await notIndexableBrandCategory(u, cache))) undocumented.push(u);
  assert.deepEqual(undocumented, [], `${undocumented.length} URLs ohne Begründung aus der Sitemap gefallen`);
  assert.equal(new Set(after).size, after.length, "doppelte <loc>");
});

test("Importierte Kataloge (Brand van Egmond, Treca, Next125) vollständig in sitemap-produkte.xml", { skip: !LIVE ? "Server :3000 fehlt" : false }, async (t) => {
  const xml = await (await fetch(`${BASE}/sitemap-produkte.xml`)).text();
  const locs = new Set(parseLocs(xml).map((u) => u.split("/").pop()));
  const api =
    "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.produkte_new.api.get_produkte_by_marke_api";
  for (const brand of ["Brand van Egmond", "Treca", "Next125"]) {
    let rows;
    try {
      const res = await fetch(`${api}?marken=${encodeURIComponent(brand)}`, { signal: AbortSignal.timeout(30_000) });
      rows = (await res.json()).message || [];
    } catch {
      t.skip("Backoffice nicht erreichbar");
      return;
    }
    const active = rows.filter((p) => p.status === "Aktiv" && p.path_field && p.kategories);
    assert.ok(active.length > 0, `${brand}: keine aktiven Produkte`);
    const missing = active.filter((p) => !locs.has(p.path_field)).map((p) => p.path_field);
    assert.deepEqual(missing, [], `${brand}: fehlt in sitemap-produkte.xml`);
  }
  // Die statischen Import-IDs sind keine URLs und stehen nicht drin.
  assert.ok(![...locs].some((s) => /^(bve|n125|treca)-\d+$/.test(s)));
});
