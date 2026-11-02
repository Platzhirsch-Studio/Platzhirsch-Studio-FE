// node --test tests/unit/sitemap.test.mjs
// Unit: XML serialization (src/lib/seo/sitemap/xml.js) and the extra-pages
// registry (src/lib/seo/sitemap/extraPages.js).
// Integration: the live sitemaps on SITEMAP_BASE (default http://localhost:3000)
// are fetched and checked for well-formed XML, duplicate <loc> and the doorway
// rule. Skipped with a visible reason only when that server is not reachable.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toUrlsetXml, toSitemapIndexXml, latestLastModified, BASE_URL } from "../../src/lib/seo/sitemap/xml.js";
import { EXTRA_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";
import { LANDING_PAGES, landingPagePath } from "../../src/lib/content/landingPages.js";
import { REGION_AUDIT, MIN_OWN_FACTS, passesDoorwayAudit, isRegionPath, regionRobots } from "../../src/lib/seo/sitemap/doorwayAudit.js";
import { statSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Minimal well-formedness check for the flat sitemap XML: one XML
// declaration, balanced tags, no raw "&" or "<" in text.
function assertWellFormed(xml) {
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n/);
  const body = xml.replace(/^<\?xml[^>]*\?>/, "");
  const stack = [];
  const tag = /<(\/?)([A-Za-z][\w:.-]*)([^>]*?)(\/?)>/g;
  let last = 0;
  let m;
  while ((m = tag.exec(body))) {
    const text = body.slice(last, m.index);
    assert.ok(!/[<]/.test(text), `raw "<" in text: ${text.slice(0, 80)}`);
    assert.ok(!/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(text), `raw "&" in text: ${text.slice(0, 80)}`);
    last = tag.lastIndex;
    const [, closing, name, , selfClosing] = m;
    if (selfClosing) continue;
    if (closing) assert.equal(stack.pop(), name, `unbalanced </${name}>`);
    else stack.push(name);
  }
  assert.equal(stack.length, 0, `unclosed: ${stack.join(",")}`);
  assert.equal(body.slice(last).trim(), "");
}

const locs = (xml) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

test("toUrlsetXml is well-formed, escapes and writes W3C lastmod", () => {
  const xml = toUrlsetXml([
    { url: `${BASE_URL}/de/a?x=1&y=2`, lastModified: "2026-10-26" },
    { url: `${BASE_URL}/de/b`, lastModified: "not a date" },
  ]);
  assertWellFormed(xml);
  assert.ok(xml.includes("<loc>https://platzhirsch.studio/de/a?x=1&amp;y=2</loc>"));
  assert.ok(xml.includes("<lastmod>2026-10-26T00:00:00.000Z</lastmod>"));
  assert.equal((xml.match(/<lastmod>/g) || []).length, 1);
  assert.ok(!xml.includes("xhtml:link"));
});

test("toSitemapIndexXml is well-formed and points at the base URL", () => {
  const xml = toSitemapIndexXml([{ path: "/sitemap-static.xml", lastModified: "2026-10-26" }, { path: "/sitemap-news.xml" }]);
  assertWellFormed(xml);
  assert.deepEqual(locs(xml), [`${BASE_URL}/sitemap-static.xml`, `${BASE_URL}/sitemap-news.xml`]);
});

test("latestLastModified picks the newest valid date", () => {
  const d = latestLastModified([{ lastModified: "2026-01-01" }, { lastModified: "x" }, { lastModified: "2026-10-26" }]);
  assert.equal(d.toISOString().slice(0, 10), "2026-10-26");
});

test("extra pages: unique, German path, real date, no overlap with LANDING_PAGES", () => {
  const paths = EXTRA_PAGES.map((p) => p.path);
  assert.equal(new Set(paths).size, paths.length);
  const landing = new Set(LANDING_PAGES.map((p) => landingPagePath(p.slug)));
  for (const page of EXTRA_PAGES) {
    assert.match(page.path, /^\/[a-z0-9-]+$/);
    assert.ok(!landing.has(page.path), `${page.path} is already in LANDING_PAGES`);
    assert.match(page.lastModified, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(page.label && page.llms, `${page.path} needs label and llms line`);
  }
  // Not indexable today (noindex until the legal review) → must not be listed.
  assert.ok(!paths.includes("/outdoor-gartenplanung"));
  // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9: Bild weglassen statt Seite verstecken): Yacht indexable again (Navetta chapter left out), former labs pages listed.
  assert.ok(paths.includes("/yacht-interior"));
  for (const p of ["/leistungen", "/kuechenplaner", "/sofaplaner", "/stil-finder", "/3d-ansicht", "/dreilaender-rechner", "/concierge", "/bodensee-licht", "/ki-assistenten"]) assert.ok(paths.includes(p), p);
  // Service/login pages and pages waiting for real material stay out.
  for (const p of ["/upload", "/portal", "/showroom"]) assert.ok(!paths.includes(p), p);
  // Runde 2 (seo P0-1): /arbeitsweise is registered, but only listed while the
  // page is index,follow (rule "arbeitsweise" → robotsForLaunch()).
  assert.equal(EXTRA_PAGES.find((p) => p.path === "/arbeitsweise")?.rule, "arbeitsweise");
});

test("extra region pages pass the doorway rule (>= 4 own facts)", () => {
  for (const page of EXTRA_PAGES.filter((p) => p.kind === "region")) {
    assert.ok(page.path.startsWith("/designermoebel-"), page.path);
    assert.ok(Array.isArray(page.facts) && page.facts.length >= 4, `${page.path}: ${page.facts?.length} facts`);
  }
});

test("llms lines: no dealer claims, no superlatives", () => {
  const banned = /händler|autorisiert|offiziell|partner|größte|groesste|grösste|beste|führend|einzige|nr\.\s*1|nummer 1/i;
  for (const page of EXTRA_PAGES) assert.ok(!banned.test(`${page.label} ${page.llms}`), page.path);
});

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REGION_DIRS = readdirSync(`${ROOT}src/app/[locale]`).filter((d) => d.startsWith("designermoebel-"));

test("doorway audit covers every region page and matches the extra-pages facts", () => {
  for (const dir of REGION_DIRS) assert.ok(`/${dir}` in REGION_AUDIT, `/${dir} has no audit entry`);
  for (const page of EXTRA_PAGES.filter((p) => p.kind === "region")) {
    assert.ok(passesDoorwayAudit(page.path), page.path);
    assert.ok(page.facts.length >= REGION_AUDIT[page.path], `${page.path}: facts list shorter than audit count`);
  }
  assert.equal(MIN_OWN_FACTS, 4);
  assert.equal(passesDoorwayAudit("/kuechen-vorarlberg"), true);
  assert.equal(passesDoorwayAudit("/designermoebel-unbekannt"), false);
  // Runde 3 P5: Bregenz has own facts now (REGION_FACTS); Kempten still fails.
  assert.deepEqual(regionRobots("/designermoebel-bregenz"), { index: true, follow: true });
  assert.deepEqual(regionRobots("/designermoebel-kempten"), { index: false, follow: true });
  assert.deepEqual(regionRobots("/designermoebel-rheintal"), { index: true, follow: true });
});

// lastModified must not be older than the page file. Date of the page = last
// git commit if tracked, otherwise the file modification date (untracked).
function pageFileDate(path) {
  const file = `src/app/[locale]${path}/page.js`;
  try {
    const d = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { cwd: ROOT, encoding: "utf8" }).trim();
    if (d) return d;
  } catch {}
  return statSync(`${ROOT}${file}`).mtime.toISOString().slice(0, 10);
}
test("extra pages: lastModified is not older than the page file", () => {
  for (const page of EXTRA_PAGES) {
    const fileDate = pageFileDate(page.path);
    assert.ok(page.lastModified >= fileDate, `${page.path}: lastModified ${page.lastModified} < page.js ${fileDate} – bump it in extraPages.js`);
  }
});

// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const LIVE = process.env.SITEMAP_BASE || process.env.QA_BASE || "";
let liveSkip = false;
try {
  await fetch(`${LIVE}/robots.txt`, { signal: AbortSignal.timeout(15000) });
} catch {
  liveSkip = `${LIVE} not reachable (set SITEMAP_BASE)`;
  console.warn(`[sitemap.test] live tests skipped: ${liveSkip}`);
}
const liveLocs = async () => {
  const index = await (await fetch(`${LIVE}/sitemap.xml`)).text();
  assertWellFormed(index);
  const all = [];
  for (const loc of locs(index)) {
    const path = new URL(loc).pathname;
    const res = await fetch(`${LIVE}${path}`);
    assert.equal(res.status, 200, path);
    const xml = await res.text();
    assertWellFormed(xml);
    all.push(...locs(xml));
  }
  return all;
};
test("live sitemaps: well-formed, no duplicate <loc>, extra pages listed once", { skip: liveSkip }, async () => {
  const all = await liveLocs();
  const dupes = all.filter((u, i) => all.indexOf(u) !== i);
  assert.deepEqual(dupes, []);
  for (const page of EXTRA_PAGES) {
    assert.equal(all.filter((u) => u === `${BASE_URL}/de${page.path}`).length, 1, page.path);
  }
  assert.ok(all.includes(`${BASE_URL}/de/yacht-interior`), "yacht-interior is indexable again (integration 28.10.2026)");
  assert.ok(all.includes(`${BASE_URL}/de/ezarri`), "Ezarri world in the sitemap (EZARRI_PUBLIC)");
  assert.ok(!all.some((u) => u.includes("/labs")), "no /labs URL in any sitemap");
});

test("live sitemaps: region pages listed only when they pass the doorway audit", { skip: liveSkip }, async () => {
  const all = new Set(await liveLocs());
  for (const path of Object.keys(REGION_AUDIT)) {
    assert.equal(all.has(`${BASE_URL}/de${path}`), passesDoorwayAudit(path), path);
  }
});

// Robots of the region pages: the region pages use regionRobots() (R3-landing,
// via landingMetadata); sitemap and robots must agree (armed in R3-marken-seo).
test("live region pages: robots meta matches the doorway audit", { skip: liveSkip }, async () => {
  const wrong = [];
  for (const path of Object.keys(REGION_AUDIT)) {
    const html = await (await fetch(`${LIVE}/de${path}`)).text();
    const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "";
    if (/noindex/.test(robots) === passesDoorwayAudit(path)) wrong.push(`${path}: ${robots}`);
  }
  assert.deepEqual(wrong, []);
});
