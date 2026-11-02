// Runde 3 P5 (FIX-Team „P5-seo-stadtseiten-footer-redirects“):
//   1. Stadtseiten Bregenz, Dornbirn, Lindau, Friedrichshafen, St. Gallen:
//      ≥ 4 eigene, belegte Fakten → index; keine Preise/Projekte/Referenzen;
//      Bregenz „Lieferung und Montage auf Wunsch“; kein Startseiten-Hero.
//   2. Footer verlinkt nur indexierbare Seiten (Regionen nach Doorway-Audit,
//      keine noindex-Service-Seiten), Footer-Zeile ohne Länderversprechen.
//   3. Sitemap ohne noindex-URL (live gegen den Dev-Server, falls erreichbar).
// Run: node --test tests/unit/r8-seo-footer.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LANDING_PAGES, landingPagePath } from "../../src/lib/content/landingPages.js";
import { EXTRA_PAGES } from "../../src/lib/seo/sitemap/extraPages.js";
import { MIN_OWN_FACTS, REGION_AUDIT, REGION_FACTS, REGION_FACTS_DATE, passesDoorwayAudit, regionRobots } from "../../src/lib/seo/sitemap/doorwayAudit.js";
import { FOOTER_NOINDEX_PATHS, footerLinkAllowed, footerLinks, footerPath } from "../../src/lib/seo/footerLinks.js";
import { heroImage } from "../../src/components/Landing/imagery.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const CITIES = ["bregenz", "dornbirn", "lindau", "friedrichshafen", "st-gallen"];
// QM-Endabnahme 02.11.2026: auch Block-/JSX-Kommentare ignorieren ({/* QM R3: Vertragshändler-Block … */}
// ist kein Seitentext; der sichtbare Händlersatz kommt aus src/lib/legal/claims.js).
const code = (f) => read(f).replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");

// ------------------------------------------------------------ 1. Stadtseiten

test("Stadtseiten: je ≥ 4 eigene Fakten mit Quelle, Audit besteht, robots index", () => {
  for (const c of CITIES) {
    const p = `/designermoebel-${c}`;
    assert.ok(REGION_FACTS[p]?.length >= MIN_OWN_FACTS, p);
    assert.equal(REGION_AUDIT[p], REGION_FACTS[p].length, `${p}: Zähler = Faktenliste`);
    assert.equal(passesDoorwayAudit(p), true, p);
    assert.deepEqual(regionRobots(p), { index: true, follow: true });
    // Fahrzeit mit Quelle (Marktresearch/02 §3) in jeder Liste
    assert.match(REGION_FACTS[p][0], /Fahrzeit .*Marktresearch\/02/, p);
    // Seite nennt die Fakten im Kopf-Kommentar und rendert eine Faktenzeile
    const src = read(`src/app/[locale]/designermoebel-${c}/page.js`);
    assert.match(src, /Own facts \(doorway audit/, p);
    assert.match(src, /facts: \[/, p);
    assert.match(src, /lead: "/, p);
  }
  assert.equal(REGION_FACTS_DATE, "2026-10-28");
  // Kempten und Ravensburg bleiben unter der Schwelle (nichts erfunden)
  for (const p of ["/designermoebel-kempten", "/designermoebel-ravensburg"]) assert.equal(passesDoorwayAudit(p), false, p);
});

test("Stadtseiten: keine Preise, Projekte, Referenzen, Superlative; Lieferung nur „auf Wunsch/auf Anfrage“", () => {
  const BAD = [/€|\bEUR\b|CHF\s*\d|\d+\s*Franken/, /Referenz|(?<!Ihr )Projekt in |unsere Kunden in|Kundin aus/i, /\bperfekt|einzigartig|exklusiv|größte|grösste|führend|(?<!am )\bbeste[nrs]?\b/i, /Händler|offizielle[rs]? (Partner|Vertrieb)|autorisiert/i];
  for (const c of CITIES) {
    const src = code(`src/app/[locale]/designermoebel-${c}/page.js`);
    for (const re of BAD) assert.doesNotMatch(src, re, `${c}: ${re}`);
    // „Wir liefern und montieren …“ nur mit „Auf Wunsch“ davor (Entscheidung Nr. 3)
    for (const m of src.matchAll(/[^."?]*(?:wir liefern und montieren|liefern und montieren wir)[^."]*/gi)) assert.match(m[0], /auf (Wunsch|Anfrage)/i, `${c}: ${m[0]}`);
    assert.doesNotMatch(src, /Termin vereinbaren|vereinbaren Sie/i, `${c}: „Termin anfragen“ statt „vereinbaren“`);
  }
  assert.match(read("src/app/[locale]/designermoebel-bregenz/page.js"), /Lieferung und Montage auf Wunsch/);
});

test("Stadtseiten: Hero nicht mehr das Startseiten-Foto, je Ort typografisch", () => {
  const HOME_HERO = read("src/components/Home/Hero.js").match(/HERO_IMAGE = "([^"]+)"/)?.[1] || "/Images/Home/aboutHome.jpg";
  for (const c of CITIES) {
    const p = `/designermoebel-${c}`;
    const h = heroImage(p, "/x.jpg", "x");
    assert.equal(h.show, false, `${p}: typografischer Hero`);
    const src = read(`src/app/[locale]/designermoebel-${c}/page.js`);
    const lead = src.match(/lead: "([^"]+)"/)?.[1];
    assert.ok(lead && lead.length > 60, `${p}: eigener Lead`);
  }
  // Kein anderer Ort zeigt das Startseiten-Foto als Hero
  for (const page of LANDING_PAGES) {
    const p = landingPagePath(page.slug);
    const src = read(`src/app/[locale]${p}/page.js`);
    const banner = src.match(/banner: \{\s*image: "([^"]+)"/)?.[1];
    const h = heroImage(p, banner, "");
    assert.ok(!(h.show && h.src === HOME_HERO), `${p} zeigt das Startseiten-Foto`);
  }
  // Leads sind verschieden (kein Doorway-Baustein)
  const leads = CITIES.map((c) => read(`src/app/[locale]/designermoebel-${c}/page.js`).match(/lead: "([^"]+)"/)[1]);
  assert.equal(new Set(leads).size, leads.length);
});

// ------------------------------------------------------------ 2. Footer

test("footerLinkAllowed: Regionen nach Audit, noindex-Seiten nie, extern egal", () => {
  assert.equal(footerPath("/de/portal/login?x=1#a"), "/portal/login");
  assert.equal(footerPath("/en"), "/");
  for (const p of ["/outdoor-gartenplanung", "/showroom", "/upload", "/portal/login", "/projekte", "/einkaufen-aus-der-schweiz", "/newsletter", "/ratgeber/x"]) {
    assert.equal(footerLinkAllowed(p), false, p);
    assert.equal(footerLinkAllowed(`/de${p}`), false, `/de${p}`);
  }
  assert.equal(footerLinkAllowed("/concierge"), false);
  assert.equal(footerLinkAllowed("/concierge", { conciergeIndexable: true }), true);
  assert.equal(footerLinkAllowed("/designermoebel-bregenz"), true);
  assert.equal(footerLinkAllowed("/designermoebel-kempten"), false);
  assert.equal(footerLinkAllowed("https://www.platzhirsch.cafe"), true);
  assert.deepEqual(footerLinks([{ href: "/upload" }, { href: "/kontakt" }]).map((l) => l.href), ["/kontakt"]);
  assert.ok(FOOTER_NOINDEX_PATHS.includes("/outdoor-gartenplanung"));
});

test("Footer: Regionen = Teilmenge der indexierbaren Seiten (Sitemap-Regel), alle Linkgruppen gefiltert", () => {
  // Same list as Footer.js regionLinks(): LANDING_PAGES regions + extra region pages.
  const regions = footerLinks([
    ...LANDING_PAGES.filter((p) => p.slug.startsWith("designermoebel-") || p.slug === "moebel-bodensee").map((p) => ({ href: landingPagePath(p.slug) })),
    ...EXTRA_PAGES.filter((p) => p.kind === "region").map((p) => ({ href: p.path })),
  ]);
  for (const l of regions) assert.equal(passesDoorwayAudit(l.href), true, l.href);
  for (const c of CITIES) assert.ok(regions.some((l) => l.href === `/designermoebel-${c}`), c);
  const src = read("src/components/Reusable/Footer.js");
  assert.match(src, /import \{ footerLinks \} from "@\/lib\/seo\/footerLinks"/);
  assert.match(src, /return footerLinks\(\[/, "regionLinks gefiltert");
  assert.match(src, /const houseLinks = footerLinks\(/);
  assert.match(src, /const serviceLinks = footerLinks\(/);
  assert.match(src, /conciergeIndexable: conciergeIndexable\(\)/);
});

test("Footer-Zeile: keine Länderaufzählung als Lieferversprechen (Entscheidung Nr. 3)", () => {
  const src = read("src/components/Reusable/Footer.js");
  const intro = src.slice(src.indexOf("const FOOTER_INTRO"), src.indexOf("};", src.indexOf("const FOOTER_INTRO")));
  assert.doesNotMatch(intro, /für Österreich, Deutschland|for Austria, Germany|pour l'Autriche|per Austria, Germania/);
  assert.match(intro, /Lieferung und Montage auf Wunsch/);
  assert.match(intro, /on request/);
  assert.match(src, /\{FOOTER_INTRO\[locale\] \|\| FOOTER_INTRO\.de\}/);
});

// ------------------------------------------------------------ 3. live
//
// Runde 4 (technik P1-3): the live part made `npm test` hang for up to 30 min
// (it crawled every footer/sitemap URL of the dev server with 3–5 min per
// request). It now runs ONLY when a base URL is set explicitly –
//   LIVE_URL=http://localhost:3100 node --test tests/unit/r8-seo-footer.test.mjs
// (SITEMAP_BASE is accepted as before) – with 30 s per request and 3 min per
// test. Without the variable both tests are skipped, so `npm test` stays
// offline and fast.
const LIVE = process.env.LIVE_URL || process.env.SITEMAP_BASE || "";
const FETCH_MS = 30_000;
const TEST_MS = 180_000;
let liveSkip = LIVE ? false : "LIVE_URL not set (live check against a running server only on request)";
if (LIVE) {
  try {
    await fetch(`${LIVE}/robots.txt`, { signal: AbortSignal.timeout(10_000) });
  } catch {
    liveSkip = `${LIVE} not reachable`;
  }
}
const robotsOf = async (url) => {
  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(FETCH_MS) });
  const html = res.status === 200 ? await res.text() : "";
  return { status: res.status, robots: html.match(/<meta name="robots" content="([^"]*)"/)?.[1] || "" };
};

test("live: Footer-Links von /de/kontakt sind indexierbar (200, kein noindex)", { skip: liveSkip, timeout: TEST_MS }, async () => {
  const html = await (await fetch(`${LIVE}/de/kontakt`, { signal: AbortSignal.timeout(FETCH_MS) })).text();
  const footer = html.slice(html.indexOf('id="site-footer"'));
  const legal = /\/(impressum|datenschutz)$/;
  const hrefs = [...new Set([...footer.matchAll(/href="(\/de[^"#]*)"/g)].map((m) => m[1]))].filter((h) => !legal.test(h));
  assert.ok(hrefs.length > 20, "Footer-Links gefunden");
  const bad = [];
  for (const h of hrefs) {
    const { status, robots } = await robotsOf(`${LIVE}${h}`);
    if (status !== 200 || /noindex/.test(robots)) bad.push(`${h}: ${status} ${robots}`);
  }
  assert.deepEqual(bad, []);
});

test("live: sitemap-static.xml enthält keine noindex-URL (DE-Seiten außer Produkten/Marken)", { skip: liveSkip, timeout: TEST_MS }, async () => {
  const xml = await (await fetch(`${LIVE}/sitemap-static.xml`, { signal: AbortSignal.timeout(FETCH_MS) })).text();
  const urls = [...xml.matchAll(/<loc>https:\/\/platzhirsch\.studio(\/de[^<]*)<\/loc>/g)].map((m) => m[1]).filter((p) => !/\/(produkte|ueber-uns\/karriere)\//.test(p));
  assert.ok(urls.length > 20);
  for (const c of CITIES) assert.ok(urls.includes(`/de/designermoebel-${c}`), c);
  const bad = [];
  for (const p of urls) {
    const { status, robots } = await robotsOf(`${LIVE}${p}`);
    if (status !== 200 || /noindex/.test(robots)) bad.push(`${p}: ${status} ${robots}`);
  }
  assert.deepEqual(bad, []);
});
