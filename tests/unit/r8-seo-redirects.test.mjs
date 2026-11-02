// Runde 3 P5 (FIX-Team „P5-seo-stadtseiten-footer-redirects“):
// News-Redirects (308), /de/projekte (308 seit Runde 4 P5), robots-Ausnahmen, Kontakt-OG-Karte,
// Schweiz-Hub (Canonical, „Termin anfragen“), Markenseiten-Metadaten,
// areaServed nach Regionen. Run: node --test tests/unit/r8-seo-redirects.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { WITHHELD_NEWS } from "../../src/lib/news/withheldNews.js";
import { defuseHouseVoice } from "../../src/lib/news/newsCopy.js";
import { brandSafeTitle, collectionMetaTitle, fitMetaDescription, DESC_MAX, DESC_MIN, TITLE_MAX } from "../../src/lib/seo/brandMeta.js";
import { organizationNode, SERVED_REGIONS } from "../../src/lib/seo/siteSchema.js";
import robots from "../../src/app/robots.js";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const require = createRequire(import.meta.url);
const { newsRedirects, WITHHELD_NEWS_SLUGS, NEWS_HUB } = require("../../src/lib/seo/newsRedirects.cjs");

// ------------------------------------------------------------ News

test("News: Liste der Redirect-Slugs = WITHHELD_NEWS, 12 Artikel-URLs → Hub (308)", () => {
  assert.deepEqual([...WITHHELD_NEWS_SLUGS].sort(), WITHHELD_NEWS.map((w) => w.slug).sort());
  const r = newsRedirects();
  for (const x of r) assert.equal(x.permanent, true, x.source);
  const toHub = r.filter((x) => WITHHELD_NEWS_SLUGS.some((s) => x.source.endsWith(`/news/${s}`)));
  assert.equal(toHub.length, 12, "3 Artikel × 4 Sprachen");
  for (const x of toHub) {
    const locale = x.source.split("/")[1];
    assert.equal(x.destination, `/${locale}${NEWS_HUB[locale]}`);
  }
  // /fr/nouvelles/<slug>, /it/notizie/<slug> → /…/news/<slug>; beendete direkt zum Hub
  assert.ok(r.some((x) => x.source === "/fr/nouvelles/:slug([^./]+)" && x.destination === "/fr/news/:slug"));
  assert.ok(r.some((x) => x.source === "/it/notizie/:slug([^./]+)" && x.destination === "/it/news/:slug"));
  const direct = r.findIndex((x) => x.source === `/fr/nouvelles/${WITHHELD_NEWS_SLUGS[0]}`);
  const generic = r.findIndex((x) => x.source.startsWith("/fr/nouvelles/:slug"));
  assert.ok(direct >= 0 && direct < generic, "Direkter Hub-Redirect vor der generischen Regel (ein Sprung)");
  assert.match(read("next.config.js"), /\.\.\.newsRedirects\(\),/);
  const detail = read("src/app/[locale]/news/[title]/page.js");
  assert.equal((detail.match(/if \(isWithheldNews\(found\)\) permanentRedirect\(getNewsPageUrl\(locale\)\);/g) || []).length, 2, "Metadaten und Seite");
});

test("News: „weltweit“ und „perfekt“ werden entschärft (recht P2), alle Sprachen", () => {
  assert.equal(defuseHouseVoice("Der weltweit trendbestimmende Leuchtenhersteller.", "de"), "Der trendbestimmende Leuchtenhersteller.");
  assert.equal(defuseHouseVoice("Ästhetik und Komfort perfekt vereint.", "de"), "Ästhetik und Komfort vereint.");
  assert.equal(defuseHouseVoice("Die perfekte Ergänzung.", "de"), "Die passende Ergänzung.");
  assert.equal(defuseHouseVoice("Weltweit für Qualität bekannt.", "de"), "Für Qualität bekannt.");
  assert.doesNotMatch(defuseHouseVoice("A perfect sofa, known worldwide.", "en"), /perfect|worldwide/i);
  assert.doesNotMatch(defuseHouseVoice("Un canapé parfait, connu mondialement.", "fr"), /parfait|mondialement/i);
  assert.doesNotMatch(defuseHouseVoice("Un divano perfetto, perfettamente comodo.", "it"), /perfett/i);
});

// ------------------------------------------------------------ Projekte

// Runde 4 P5 (seo P2-6): bewusst 308 statt 307 – der Umzug ist dauerhaft.
test("/de/projekte: 308 auf /de/arbeitsweise, solange die Liste leer ist", () => {
  const src = read("src/app/[locale]/projekte/page.js");
  assert.match(src, /import \{ notFound, permanentRedirect \} from "next\/navigation"/);
  assert.match(src, /if \(projekte\.length === 0\) permanentRedirect\("\/de\/arbeitsweise"\);/);
  assert.match(src, /index: false/);
});

// ------------------------------------------------------------ robots

test("robots: /*?* gesperrt, ?lang= ?thema= ?ort= erlaubt (spezifischer), Training gesperrt", () => {
  const { rules } = robots();
  for (const rule of rules.filter((r) => r.allow)) {
    assert.ok(rule.disallow.includes("/*?*"));
    for (const a of ["/*?lang=", "/*?thema=", "/*?ort="]) {
      assert.ok(rule.allow.includes(a), a);
      assert.ok(a.length > "/*?*".length, "längere Regel gewinnt");
    }
  }
  const training = rules.find((r) => [].concat(r.userAgent).includes("GPTBot"));
  assert.deepEqual(training.disallow, ["/"]);
});

// ------------------------------------------------------------ Kontakt

test("Kontakt: typografische OG-Karte statt questionmark-og.jpg, Description 120–155 ohne „Platzhirsch Studio“", () => {
  const src = read("src/app/[locale]/kontakt/page.js");
  assert.doesNotMatch(src.replace(/^\s*\/\/.*$/gm, ""), /questionmark/);
  assert.match(src, /url: "\/Images\/Kontakt\/kontakt-og\.png", width: 1200, height: 630/);
  assert.ok(fs.existsSync(path.join(ROOT, "public/Images/Kontakt/kontakt-og.png")));
  assert.ok(!fs.existsSync(path.join(ROOT, "public/Images/Kontakt/questionmark-og.jpg")), "Bild mit Gemini-Wasserzeichen entfernt");
  const png = fs.readFileSync(path.join(ROOT, "public/Images/Kontakt/kontakt-og.png"));
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  const fn = src.slice(src.indexOf("const getLocalizedDescription"), src.indexOf("};", src.indexOf("const getLocalizedDescription")));
  const street = "Landstraße 11", phone = "+43 5574 46255";
  for (const m of fn.matchAll(/return `([^`]+)`/g)) {
    const text = m[1].replace("${ADDRESS.street}", street).replace("${PHONE_DISPLAY}", phone);
    assert.ok(text.length >= 120 && text.length <= 155, `${text.length}: ${text}`);
    assert.doesNotMatch(text, /Platzhirsch Studio/);
  }
  assert.doesNotMatch(src, /getLocalizedContactMetadata/, "keine Backoffice-Texte mit „Platzhirsch Studio“ mehr in den Metadaten");
});

// ------------------------------------------------------------ Schweiz-Hub

test("Schweiz-Hub: noindex, eigener Canonical, „Termin anfragen“; Feldkirch/Konstanz ebenso", () => {
  const src = read("src/app/[locale]/einkaufen-aus-der-schweiz/page.js");
  assert.match(src, /robots: \{ index: false, follow: true \}/);
  assert.match(src, /alternates: \{ canonical: CANONICAL \}/);
  assert.doesNotMatch(src, /Beratung vereinbaren/);
  // QM-Endabnahme 02.11.2026, bewusst geändert: Seite ist viersprachig, das Label steht in UI_DE
  // (EN/FR/IT aus content-intl.js) und wird an beiden CTAs über UI.primaryLabel gesetzt.
  assert.match(src, /primaryLabel: "Termin anfragen"/);
  assert.equal((src.match(/primaryLabel=\{UI\.primaryLabel\}/g) || []).length, 2);
  for (const c of ["feldkirch", "konstanz"]) {
    const page = read(`src/app/[locale]/designermoebel-${c}/page.js`);
    assert.match(page, /\{ title: "Termin anfragen", /, c);
    assert.doesNotMatch(page, /title: "Termin vereinbaren"/, c);
  }
});

// ------------------------------------------------------------ Marken

test("Markenseiten: Titel ≤ 65 mit Marke einmal, Description 120–155", () => {
  const t = collectionMetaTitle("101 Copenhagen Brick Candle Holder", "101 Copenhagen", "de");
  assert.ok(t.length <= TITLE_MAX, t);
  assert.equal(t.match(/101 Copenhagen/g).length, 1, t);
  const old = "101 Copenhagen Brick Candle Holder Kollektion – 101 Copenhagen | Platzhirsch Home Living";
  const fixed = brandSafeTitle(old, "101 Copenhagen");
  assert.ok(fixed.length <= TITLE_MAX && fixed.match(/101 Copenhagen/g).length === 1, fixed);
  for (const l of ["de", "en", "fr", "it"]) {
    for (const text of ["", "Minotti aus Italien, gegründet 1948.", "x ".repeat(120)]) {
      const d = fitMetaDescription(text, l, "Minotti");
      assert.ok(d.length >= DESC_MIN && d.length <= DESC_MAX, `${l} ${d.length}: ${d}`);
      assert.doesNotMatch(d, /Händler|dealer|revendeur|rivenditore|€/i);
    }
  }
  const brandPage = read("src/app/[locale]/ueber-uns/marken/[title]/page.js");
  // SEO-Team A (bewusst geändert, 31.10.2026, AP-7): Marken mit eigenem Leitfaden (brandGuides.js) bringen
  // Title (nur ohne Händlerclaim) und Description mit; beide laufen weiter durch brandSafeTitle/fitMetaDescription.
  assert.match(brandPage, /brandSafeTitle\((?:guide\?\.title \|\| )?brandPageTitle\(/);
  assert.match(brandPage, /fitMetaDescription\((?:guide\?\.description \|\| )?metaText, locale/);
  assert.match(brandPage, /export const revalidate = 3600;/);
  const coll = read("src/app/[locale]/ueber-uns/marken/[title]/[collection]/page.js");
  assert.match(coll, /collectionMetaTitle\(data\.collection\?\.name, brand, locale\)/);
  assert.match(coll, /export const revalidate = 3600;/);
  assert.doesNotMatch(coll.replace(/^\s*\/\/.*$/gm, ""), /searchParams/);
  // wm-fix3: H1 with soft hyphens at compound joints (200 % text size).
  assert.match(read("src/components/MarkenClient/Marken.js"), /\{(softHyphens\()?H1\[locale\] \|\| H1\.de\)?\}/);
});

test("Schema: areaServed nach Regionen statt ganzer Länder (Entscheidung Nr. 3)", () => {
  const org = organizationNode();
  const countries = org.areaServed.filter((a) => a["@type"] === "Country").map((a) => a.name);
  assert.deepEqual(countries, ["Liechtenstein"]);
  for (const n of ["Österreich", "Deutschland", "Schweiz"]) assert.ok(!JSON.stringify(org.areaServed).includes(`"${n}"`), n);
  assert.ok(SERVED_REGIONS.some((r) => r.name === "Bodensee"));
  assert.notEqual(org.contactPoint.areaServed, "AT");
  const cities = org.areaServed.filter((a) => a["@type"] === "City").map((a) => a.name);
  for (const c of ["Bregenz", "Lindau", "St. Gallen", "Feldkirch", "Konstanz"]) assert.ok(cities.includes(c), c);
});
