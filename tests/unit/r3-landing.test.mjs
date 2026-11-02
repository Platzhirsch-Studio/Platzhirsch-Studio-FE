// tests/unit/r3-landing.test.mjs
// R3-landing (26.10.2026): robots of the region pages follow the doorway
// audit, /de/kuechen-vorarlberg stays indexable, no superlatives in the
// landing copy, unreleased Yacht/Outdoor heroes are held back.
// Report: Marktresearch/digital/teamleiter/r3-R3-landing.md
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { REGION_AUDIT, passesDoorwayAudit, regionRobots } from "../../src/lib/seo/sitemap/doorwayAudit.js";
import { heroImage } from "../../src/components/Landing/imagery.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const APP = "src/app/[locale]";

const LANDING_FILES = [
  ...readdirSync(path.join(ROOT, APP))
    .filter((d) => d.startsWith("designermoebel-"))
    .map((d) => `${APP}/${d}/page.js`),
  ...["moebel-bodensee", "kuechen-vorarlberg", "interior-design-vorarlberg", "wohnzimmer-einrichten-vorarlberg", "yacht-interior", "outdoor-gartenplanung"].map(
    (d) => `${APP}/${d}/page.js`
  ),
  "src/lib/content/landingPages.js",
];

test("all 13 region page files exist and are in the audit", () => {
  const regions = LANDING_FILES.filter((f) => f.includes("designermoebel-"));
  assert.equal(regions.length, 13);
  for (const f of regions) {
    const p = `/${f.split("/").at(-2)}`;
    assert.ok(p in REGION_AUDIT, `${p} missing in REGION_AUDIT`);
  }
});

test("landingMetadata takes the region robots from regionRobots()", () => {
  const src = read("src/components/Landing/landingPage.js");
  assert.match(src, /import \{ isRegionPath, regionRobots \} from "@\/lib\/seo\/sitemap\/doorwayAudit"/);
  assert.match(src, /isRegionPath\(path\) \? \{ index: index && regionRobots\(path\)\.index, follow: true \}/);
  // every region page goes through landingMetadata (no own robots)
  for (const f of LANDING_FILES.filter((x) => x.includes("designermoebel-"))) {
    const page = read(f);
    assert.match(page, /landingMetadata\(\{/, f);
    assert.doesNotMatch(page, /robots:/, f);
  }
});

// Runde 3 P5: Bregenz, Dornbirn, Lindau, Friedrichshafen and St. Gallen got
// own, sourced facts (doorwayAudit.js REGION_FACTS) and pass; Kempten and
// Ravensburg still fail.
test("failing region pages are noindex,follow (no facts invented to pass)", () => {
  for (const p of ["/designermoebel-kempten", "/designermoebel-ravensburg"]) {
    assert.deepEqual(regionRobots(p), { index: false, follow: true }, p);
  }
});

test("kuechen-vorarlberg: indexable, no stale noindex note", () => {
  const page = read(`${APP}/kuechen-vorarlberg/page.js`);
  assert.doesNotMatch(page, /Kept noindex/);
  assert.doesNotMatch(page, /index:\s*false/);
});

test("kuechen-vorarlberg: no unconfirmed showroom claims (QM P2-1), teaser matches page", () => {
  const page = read(`${APP}/kuechen-vorarlberg/page.js`).split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  assert.doesNotMatch(page, /im Original/);
  assert.doesNotMatch(page, /Küchen vor der Planung im Showroom ansehen/);
  assert.doesNotMatch(read("src/lib/content/landingPages.js"), /Schüller/);
});

test("meta lengths: descriptions <= 160, titles incl. suffix <= 60 (QM P3-1)", () => {
  for (const p of ["kuechen-vorarlberg", "designermoebel-bregenz", "designermoebel-kempten", "outdoor-gartenplanung"]) {
    const page = read(`${APP}/${p}/page.js`);
    const meta = page.split("landingMetadata({")[1].split("});")[0];
    const title = meta.match(/title:\s*"([^"]+)"/)[1];
    const desc = meta.match(/description:\s*"([^"]+)"/)[1];
    assert.ok(desc.length <= 160, `${p} description ${desc.length}`);
    assert.ok(`${title} | Platzhirsch Home Living`.length <= 60, `${p} title`);
  }
});

test("yacht JSON-LD service description: no partnership wording", () => {
  const page = read(`${APP}/yacht-interior/page.js`);
  assert.doesNotMatch(page, /in Zusammenarbeit mit|Partner(?!n?\b)/);
});

test("no superlatives or unconditional country promises in the landing copy", () => {
  const BAD = [/führende[rnms]?\b/i, /Premium-Marken/, /\bperfekt/i, /größte|grösste/i, /einzigartig/i, /exklusiv/i, /Ja, wir liefern und montieren in ganz Österreich/];
  for (const f of LANDING_FILES) {
    const code = read(f).split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    for (const re of BAD) assert.doesNotMatch(code, re, `${f}: ${re}`);
  }
});

test("heroes without release (Yacht, Outdoor, Küchen, Kempten) are held back, others shown", () => {
  for (const p of ["/yacht-interior", "/outdoor-gartenplanung", "/kuechen-vorarlberg", "/designermoebel-kempten"]) {
    const h = heroImage(p, "/x.jpg", "x");
    assert.equal(h.show, false, p);
    assert.ok(h.src, `${p}: src kept for the unchanged JSON-LD`);
  }
  // Runde 3 P5: the five city pages have typographic heroes (no photo with a
  // documented release, Bregenz had the homepage photo); Liechtenstein shows its photo.
  for (const p of ["/designermoebel-bregenz", "/designermoebel-dornbirn", "/designermoebel-lindau", "/designermoebel-friedrichshafen", "/designermoebel-st-gallen"]) {
    assert.equal(heroImage(p, "/x.jpg", "x").show, false, p);
  }
  assert.equal(heroImage("/designermoebel-liechtenstein", "/x.jpg", "x").show, true);
  assert.deepEqual(heroImage("/moebel-bodensee", "/x.jpg", "x"), { src: "/x.jpg", alt: "x", show: true });
});

test("messages-r3-landing.json has the new key in all 4 languages", () => {
  const m = JSON.parse(read("Marktresearch/digital/teamleiter/messages-r3-landing.json"));
  for (const l of ["de", "en", "fr", "it"]) assert.ok(m[l]?.landing?.outdoorLink, l);
});

// Live checks against the dev server (skipped when it is not reachable).
// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const LIVE = process.env.SITEMAP_BASE || process.env.QA_BASE || "";
let liveSkip = false;
try {
  await fetch(`${LIVE}/robots.txt`, { signal: AbortSignal.timeout(15000) });
} catch {
  liveSkip = `${LIVE} not reachable (set SITEMAP_BASE)`;
}
const robotsOf = async (p) => {
  const html = await (await fetch(`${LIVE}/de${p}`, { signal: AbortSignal.timeout(120000) })).text();
  return html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "";
};

test("live: robots of the 13 region pages match the doorway audit", { skip: liveSkip, timeout: 600000 }, async () => {
  const wrong = [];
  for (const p of Object.keys(REGION_AUDIT)) {
    const robots = await robotsOf(p);
    if (/noindex/.test(robots) === passesDoorwayAudit(p)) wrong.push(`${p}: ${robots}`);
  }
  assert.deepEqual(wrong, []);
});

test("live: kuechen-vorarlberg index, yacht hero without photo", { skip: liveSkip, timeout: 300000 }, async () => {
  assert.equal(await robotsOf("/kuechen-vorarlberg"), "index, follow");
  const html = await (await fetch(`${LIVE}/de/yacht-interior`)).text();
  const hero = html.split('id="landing-title"')[1]?.split("</section>")[0] || "";
  assert.doesNotMatch(hero, /<img/);
});
