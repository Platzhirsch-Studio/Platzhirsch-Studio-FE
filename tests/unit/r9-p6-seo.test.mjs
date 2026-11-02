// node --test tests/unit/r9-p6-seo.test.mjs
// Runde 5, Fix-Team P6 (SEO): Yacht-Redirect, Concierge-Regel der Sitemap,
// kein hreflang auf noindex-Seiten, Ratgeber-Brotkrume, News-lastmod ohne
// Migrationsdatum, Partner/Presse-Titel. Live-Teil gegen SITEMAP_BASE
// (Standard http://localhost:3000), übersprungen, wenn kein Server läuft.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { buildPageMetadata, deOnlyMetadata, isIndexable, seoAlternates } from "../../src/lib/seo/pageMetadata.js";
import { articleSchema, hubSchema } from "../../src/lib/ratgeber/schema.js";
import { newsLastModified, untrustedNewsChangeDays } from "../../src/lib/seo/sitemap/newsLastmod.js";
import { EXTRA_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const require = createRequire(import.meta.url);
const moves = require("../../src/lib/seo/labsMoves.cjs");
const BASE = process.env.SITEMAP_BASE || "http://localhost:3000";

async function serverUp() {
  try {
    await fetch(`${BASE}/robots.txt`, { signal: AbortSignal.timeout(5000) });
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------ 3 Yacht-Redirect
test("3 /labs/yacht → 308 auf /de/yacht-interior (alle Sprachen, Unterpfade auf die Seite)", () => {
  for (const l of ["de", "en", "fr", "it"]) {
    assert.equal(moves.newPathFor(`/${l}/labs/yacht`), "/de/yacht-interior", l);
    assert.equal(moves.newPathFor(`/${l}/labs/yacht/navetta`), "/de/yacht-interior", `${l} Unterpfad`);
  }
  const list = moves.labsRedirects();
  const exact = list.find((r) => r.source === "/:locale(de|en|fr|it)/labs/yacht");
  const sub = list.find((r) => r.source === "/:locale(de|en|fr|it)/labs/yacht/:rest*");
  assert.deepEqual([exact?.destination, exact?.permanent], ["/de/yacht-interior", true]);
  assert.deepEqual([sub?.destination, sub?.permanent], ["/de/yacht-interior", true]);
  // Vor dem Hub-Fallback, sonst gewinnt /labs/:rest* → /leistungen.
  assert.ok(list.indexOf(exact) < list.findIndex((r) => r.source.endsWith("/labs/:rest*")));
  // Andere Ziele unverändert.
  assert.equal(moves.newPathFor("/de/labs/ar-viewer/tables-freeman"), "/de/3d-ansicht/tables-freeman");
});

test("3 live: /de/labs/yacht und /labs/yacht → EIN 308 auf /de/yacht-interior (200)", async (t) => {
  if (!(await serverUp())) return t.skip("kein Server");
  for (const p of ["/labs/yacht", "/de/labs/yacht", "/en/labs/yacht", "/fr/labs/yacht", "/it/labs/yacht"]) {
    const res = await fetch(`${BASE}${p}`, { redirect: "manual", signal: AbortSignal.timeout(60_000) });
    assert.equal(res.status, 308, p);
    assert.equal(new URL(res.headers.get("location"), BASE).pathname, "/de/yacht-interior", p);
  }
  const target = await fetch(`${BASE}/de/yacht-interior`, { redirect: "manual", signal: AbortSignal.timeout(120_000) });
  assert.equal(target.status, 200);
  // public/labs/yacht/* (Bilddateien) bleibt unberührt.
  const file = await fetch(`${BASE}/labs/yacht/bootshaus-ufer-terrasse-1200.webp`, { redirect: "manual", signal: AbortSignal.timeout(60_000) });
  assert.equal(file.status, 200);
});

// ------------------------------------------------------------ 4 Concierge
test("4 Sitemap: Concierge nur mit conciergeIndexable() && conciergeLive() (Regel von Seite/Footer)", () => {
  const src = read("src/lib/seo/sitemapEntries.js");
  assert.match(src, /export function conciergeAvailableForSeo\(\) \{\s*return conciergeIndexable\(\) && conciergeLive\(\);/);
  assert.match(src, /visibleExtraPages\(\{ conciergeAvailable: conciergeAvailableForSeo\(\) \}\)/);
  assert.doesNotMatch(src, /conciergeAvailable: conciergeIndexable\(\)/);
});

test("4 live: ohne ANTHROPIC_API_KEY kein /concierge in sitemap-static.xml, Seite noindex", async (t) => {
  if (!(await serverUp())) return t.skip("kein Server");
  const page = await (await fetch(`${BASE}/de/concierge`, { signal: AbortSignal.timeout(120_000) })).text();
  const noindex = /<meta name="robots" content="[^"]*noindex/.test(page);
  const xml = await (await fetch(`${BASE}/sitemap-static.xml`, { signal: AbortSignal.timeout(180_000) })).text();
  const listed = xml.includes("<loc>https://platzhirsch.studio/de/concierge</loc>");
  // Sitemap und Seite folgen derselben Regel: gelistet ⇔ index.
  assert.equal(listed, !noindex, `listed=${listed} noindex=${noindex}`);
});

// ------------------------------------------------------------ 5 hreflang / Brotkrume
test("5 hreflang: keine languages-Alternates auf noindex-Seiten (zentrale Helfer)", () => {
  assert.equal(isIndexable({ index: false, follow: true }), false);
  assert.equal(isIndexable("noindex, follow"), false);
  assert.equal(isIndexable(undefined), true);
  assert.deepEqual(seoAlternates({ canonical: "x", languages: { de: "x" }, robots: { index: false } }), { canonical: "x" });
  assert.deepEqual(seoAlternates({ canonical: "x", languages: { de: "x" }, robots: { index: true } }), { canonical: "x", languages: { de: "x" } });

  const on = buildPageMetadata({ locale: "de", pathByLocale: "/a", title: "T", description: "D" });
  const off = buildPageMetadata({ locale: "de", pathByLocale: "/a", title: "T", description: "D", index: false });
  assert.ok(on.alternates.languages?.["x-default"]);
  assert.equal(off.alternates.languages, undefined);
  assert.equal(off.alternates.canonical, "https://platzhirsch.studio/de/a");

  const deOn = deOnlyMetadata({ path: "/yacht-interior", title: "T", description: "D" });
  const deOff = deOnlyMetadata({ path: "/outdoor-gartenplanung", title: "T", description: "D", robots: { index: false, follow: true } });
  assert.deepEqual(Object.keys(deOn.alternates.languages), ["de", "x-default"]);
  assert.equal(deOff.alternates.languages, undefined);
  assert.equal(deOff.alternates.canonical, "https://platzhirsch.studio/de/outdoor-gartenplanung");
});

test("5 Ratgeber-JSON-LD: erste Brotkrume „Startseite“ (je Sprache), nicht „Home“", () => {
  const article = { slug: "s", heading: "H", title: "T", description: "", keywords: [], quellen: [], faq: [], rubrik: "R" };
  const opts = { siteUrl: "https://platzhirsch.studio", organizationId: "o", websiteId: "w" };
  const crumbs = (graph) => graph["@graph"].find((n) => n["@type"] === "BreadcrumbList").itemListElement;
  assert.equal(crumbs(articleSchema(article, opts))[0].name, "Startseite");
  assert.equal(crumbs(hubSchema([article], opts))[0].name, "Startseite");
  assert.equal(crumbs(articleSchema(article, { ...opts, locale: "fr" }))[0].name, "Accueil");
  assert.doesNotMatch(JSON.stringify(articleSchema(article, opts)), /"name":"Home"/);
});

// ------------------------------------------------------------ 6 Partner/Presse
test("6 Partner/Presse: Titel 30–60 Zeichen, ohne Superlative, kein CMS-Titel", () => {
  const SUPERLATIVE = /\b(beste[nrs]?|best|meilleur\w*|miglior\w*|einzig\w*|exklusiv\w*|exclusive?|führend\w*|leading|Nr\.\s?1|Starke)\b/i;
  for (const file of ["src/app/[locale]/ueber-uns/partner/page.js", "src/app/[locale]/ueber-uns/presse/page.js"]) {
    const src = read(file);
    const block = /const getLocalizedTitle = \(locale\) => \{([\s\S]*?)\n\};/.exec(src)?.[1] || "";
    const titles = [...block.matchAll(/return "([^"]+)";/g)].map((m) => m[1]);
    assert.equal(titles.length, 4, file);
    for (const t of titles) {
      assert.ok(t.length >= 30 && t.length <= 60, `${file}: „${t}“ (${t.length})`);
      assert.doesNotMatch(t, SUPERLATIVE, t);
    }
    const desc = /const getLocalizedDescription = \(locale\) => \{([\s\S]*?)\n\};/.exec(src)?.[1] || "";
    for (const [, d] of desc.matchAll(/return "([^"]+)";/g)) {
      assert.ok(d.length >= 70 && d.length <= 160, `${file}: Description ${d.length}`);
      assert.doesNotMatch(d, SUPERLATIVE, d);
    }
    assert.doesNotMatch(src, /meta\?\.title/, `${file}: CMS-Titel überschreibt nicht`);
    assert.match(src, /const Home = homeCrumbLabel\(locale\);/, `${file}: Brotkrume über homeCrumbLabel()`);
  }
  // Presse: kein Foto mit offenen Rechten als og:image (bildrechte.csv: offen).
  assert.doesNotMatch(read("src/app/[locale]/ueber-uns/presse/page.js"), /cool-living-room/);
});

// ------------------------------------------------------------ 7 News-lastmod / Sitemap
test("7 News-lastmod: Migrations-/Importtag ist kein Änderungsdatum → kein <lastmod>", () => {
  const items = [
    { name1: "A", daten: "2025-01-14" },
    { name1: "B", daten: "2025-01-14", modified: "2025-01-14 10:00:00" },
    { name1: "C", daten: "2023-03-15" },
    { name1: "D", daten: "2024-05-01", modified: "2026-08-19 09:00:00" },
    // fünf Datensätze mit demselben modified-Tag = Massen-Import
    ...["E", "F", "G", "H", "I"].map((n) => ({ name1: n, daten: "2025-01-14", modified: "2025-02-02 08:00:00" })),
  ];
  const untrusted = untrustedNewsChangeDays(items);
  assert.ok(untrusted.has("2025-01-14") && untrusted.has("2025-02-02"));
  assert.equal(newsLastModified(items[0], untrusted), null);
  assert.equal(newsLastModified(items[1], untrusted), null);
  assert.equal(newsLastModified(items[2], untrusted)?.toISOString().slice(0, 10), "2023-03-15");
  assert.equal(newsLastModified(items[3], untrusted)?.toISOString().slice(0, 10), "2026-08-19");
  assert.equal(newsLastModified(items[4], untrusted), null);
  const src = read("src/lib/seo/sitemapEntries.js");
  assert.match(src, /const changed = newsLastModified\(newsItem, untrusted\);/);
  assert.doesNotMatch(src, /changed \? new Date\(changed\) : STATIC_LAST_MODIFIED/);
});

test("7 live: sitemap-news.xml ohne Migrationsdatum 2025-01-14", async (t) => {
  if (!(await serverUp())) return t.skip("kein Server");
  const xml = await (await fetch(`${BASE}/sitemap-news.xml`, { signal: AbortSignal.timeout(180_000) })).text();
  assert.ok(xml.includes("<urlset"));
  assert.doesNotMatch(xml, /<lastmod>2025-01-14/);
});

test("7 Arbeitsweise: nur Deutsch in der Sitemap, solange EN/FR/IT nicht index sind", () => {
  const page = EXTRA_PAGES.find((p) => p.path === "/arbeitsweise");
  assert.equal(page.rule, "arbeitsweise");
  // getStaticEntries listet EXTRA_PAGES nur unter /de (keine hreflang-Alternates).
  assert.match(read("src/lib/seo/sitemapEntries.js"), /addEntry\(entries, `\$\{BASE_URL\}\/de\$\{page\.path\}`, page\.lastModified, "monthly", 0\.7\);/);
});
