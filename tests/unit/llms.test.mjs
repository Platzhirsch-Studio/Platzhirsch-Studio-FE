// node --test tests/unit/llms.test.mjs
// /llms.txt (src/lib/seo/llms.js): only index,follow pages, LANDING_PAGES only
// when they pass the doorway audit, Ratgeber only from getIndexableRatgeber(),
// no claims. Live part against SITEMAP_BASE (default http://localhost:3000).
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLlmsTxt, buildPagesSection } from "../../src/lib/seo/llms.js";
import { LANDING_PAGES } from "../../src/lib/content/landingPages.js";
import { EXTRA_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";
import { passesDoorwayAudit } from "../../src/lib/seo/sitemap/doorwayAudit.js";
import { getIndexableRatgeber, listRatgeber } from "../../src/lib/ratgeber/index.js";
import { findClaims } from "../../src/lib/legal/claims.js";

// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const BASE = process.env.SITEMAP_BASE || process.env.QA_BASE || "";
const SITE = "https://platzhirsch.studio";
const links = (txt) => [...txt.matchAll(/\]\((https:\/\/platzhirsch\.studio[^)]*)\)/g)].map((m) => m[1]);

const body = buildLlmsTxt({
  brands: [{ name1: "Minotti" }, { name1: "ClassiCon" }],
  landingPages: LANDING_PAGES,
  extraPages: EXTRA_PAGES,
  ratgeber: getIndexableRatgeber(),
});

test("llms.txt: spec shape (one H1, summary, H2 link sections)", () => {
  assert.equal((body.match(/^# /gm) || []).length, 1);
  assert.match(body, /^> /m);
  assert.match(body, /^## Marken$/m);
  assert.match(body, /^## Regionen und Leistungen$/m);
  assert.ok(body.endsWith("\n"));
});

test("llms.txt: noindex pages are not listed (Impressum, Datenschutz, Newsletter, Merkliste)", () => {
  // Integration 28.10.2026: /de/yacht-interior is indexable again (Inhaber-Entscheidung Nr. 9) → listed;
  // the service and login pages of the former labs stay out.
  for (const p of ["/de/impressum", "/de/datenschutz", "/de/newsletter", "/de/merkliste", "/de/outdoor-gartenplanung", "/de/upload", "/de/portal", "/de/labs"]) {
    assert.ok(!links(body).includes(`${SITE}${p}`), p);
  }
});

test("llms.txt: LANDING_PAGES only when they pass the doorway audit, each path once", () => {
  const listed = new Set(links(body));
  for (const page of LANDING_PAGES) {
    const url = `${SITE}/de/${page.slug}`;
    assert.equal(listed.has(url), passesDoorwayAudit(`/${page.slug}`), page.slug);
  }
  for (const page of EXTRA_PAGES) assert.equal(listed.has(`${SITE}/de${page.path}`), passesDoorwayAudit(page.path), page.path);
  const all = links(body);
  assert.equal(new Set(all).size, all.length, "duplicate link");
  // Since Runde 3 P5 the 5 region pages in LANDING_PAGES pass the audit too.
  assert.ok(listed.has(`${SITE}/de/kuechen-vorarlberg`));
  assert.ok(listed.has(`${SITE}/de/designermoebel-bregenz`));
});

// Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti is verified → the claim example is Poliform.
test("llms.txt: a teaser with a claim is listed without description", () => {
  const section = buildPagesSection([{ slug: "kuechen-vorarlberg", label: "Küchen", teaser: "Ihr offizieller Poliform-Händler." }], []);
  assert.equal(section, `## Regionen und Leistungen\n\n- [Küchen](${SITE}/de/kuechen-vorarlberg)`);
});

test("llms.txt: Ratgeber only from getIndexableRatgeber() (today none)", () => {
  if (!getIndexableRatgeber().length) assert.ok(!/ratgeber/i.test(body));
  const unreleased = listRatgeber().filter((a) => a.freigegeben !== true);
  assert.ok(!/## Ratgeber/.test(buildLlmsTxt({ ratgeber: unreleased })));
  const released = buildLlmsTxt({ ratgeber: [{ slug: "x", title: "X", seoTitle: "X kurz", description: "Was X kostet.", freigegeben: true }] });
  assert.match(released, /## Ratgeber\n\n- \[X kurz\]\(https:\/\/platzhirsch\.studio\/de\/ratgeber\/x\): Was X kostet\./);
});

test("llms.txt: no dealer claim, no superlative, voice words of the brand pages avoided", () => {
  assert.deepEqual(findClaims(body, { locale: "de" }), []);
  // Runde 2 (seo P2-1): the one allowed dealer sentence names the two verified
  // dealer brands (CLAIM_REGISTER); nothing else may say "Händler".
  // Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): the sentence comes from CLAIM_REGISTER:
  // contract dealers, Bad-&-Wellness dealers (supply agreement), Minotti studio wording.
  // Inhaber-Entscheidung Nr. 24 (bewusst geändert, 31.10.2026): plus the six kitchen-appliance dealer brands.
  // Inhaber-Entscheidungen Nr. 27/28 (bewusst geändert, SEO-Team A 31.10.2026): plus Baobab Collection,
  // Riedel and Cire Trudon (dealer status confirmed by the owner, now in CLAIM_REGISTER).
  // Inhaber-Entscheidung Nr. 32 (bewusst geändert, SEO-Team A 31.10.2026): plus Flos, Tom Dixon, Zalto, Assouline, Kähler, Lyngby Porcelæn.
  const VERIFIED =
    "Platzhirsch Home Living ist Vertragshändler von ClassiCon und Ezarri und Händler von Starpool, Soleum, Fabio Alemanno, Aquavia Spa, Naggura, Dornbracht, antoniolupi, Gaggenau, Miele, V-ZUG, BORA, Liebherr, Quooker, Baobab Collection, Riedel, Cire Trudon, Flos, Tom Dixon, Zalto, Assouline, Kähler und Lyngby Porcelæn. " +
    "Minotti hat das Minotti Studio by Platzhirsch Home Living in Lochau 2019 eröffnet; gestaltet hat es das hauseigene Kreativstudio von Minotti.";
  assert.ok(body.includes(VERIFIED));
  assert.doesNotMatch(VERIFIED, /Poliform|Rimadesio|Agape|400 ?m|offiziell/);
  assert.ok(!/händler|exklusiv|premium|geführt|führt/i.test(body.replace(VERIFIED, "")));
});

test("live /llms.txt matches the rules", async (t) => {
  let live;
  try {
    const res = await fetch(`${BASE}/llms.txt`, { signal: AbortSignal.timeout(180000) });
    assert.equal(res.status, 200);
    live = await res.text();
  } catch (e) {
    t.skip(`dev server not reachable at ${BASE}: ${e.message}`);
    return;
  }
  const listed = links(live);
  assert.ok(!listed.includes(`${SITE}/de/impressum`));
  assert.ok(!listed.includes(`${SITE}/de/datenschutz`));
  for (const page of LANDING_PAGES) assert.equal(listed.includes(`${SITE}/de/${page.slug}`), passesDoorwayAudit(`/${page.slug}`), page.slug);
  assert.deepEqual(findClaims(live, { locale: "de" }), []);
});

test("llms.txt: no unproven service area (QA R2 P2-3)", () => {
  const txt = buildLlmsTxt();
  assert.doesNotMatch(txt, /ganz Österreich|throughout Austria/i);
  // Runde 2 (technik P2-9): same wording as the pages – "auf Wunsch".
  assert.match(txt, /Lieferung und Montage auf Wunsch/);
});
