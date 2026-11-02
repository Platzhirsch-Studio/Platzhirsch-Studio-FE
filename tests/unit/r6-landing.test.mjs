// tests/unit/r6-landing.test.mjs
// R6-landing-inhalt (26.10.2026):
// 1. LandingHero: no empty image band without a released photo, typographic
//    close instead; on phones the lead comes before the primary action
//    (Schweiz P3-3).
// 2. og:locale of the content pages and landing pages from ogLocale().
// 3. Doorway stand unchanged: region robots follow the audit, Schweiz hub,
//    Projekte and Ratgeber stay noindex.
// Report: Marktresearch/digital/teamleiter/r6-R6-landing-inhalt.md
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { REGION_AUDIT, MIN_OWN_FACTS, passesDoorwayAudit, regionRobots } from "../../src/lib/seo/sitemap/doorwayAudit.js";
import { getIndexableRatgeber, listRatgeber } from "../../src/lib/ratgeber/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const APP = "src/app/[locale]";

// ---------------------------------------------------------------- 1. Hero

test("LandingHero: no decorative image band, hairline close when there is no photo", () => {
  const src = read("src/components/Landing/parts.js");
  const hero = src.slice(src.indexOf("export function LandingHero"), src.indexOf("export function FactRow"));
  // the R5 stone/lake band is gone
  assert.doesNotMatch(hero, /from-surface-band|--color-see|lg:h-36/);
  // the photo renders only when released (image passed) …
  assert.match(hero, /\{image && \(\s*<Media/);
  // … otherwise one hairline closes the hero (unless a fact row does)
  // no section-sized hole below the close: half the rhythm without a photo
  assert.match(hero, /image \? "pb-section" : "pb-\[calc\(var\(--spacing-stack-m\)\*2\)\]"/);
  assert.match(hero, /\{!image && !facts\?\.length && <div data-hero-close="" aria-hidden="true" className="mt-stack-m border-t border-line-strong" \/>\}/);
});

test("LandingHero: without a photo the lead precedes the primary action in the DOM (P3-3)", () => {
  const src = read("src/components/Landing/parts.js");
  const hero = src.slice(src.indexOf("export function LandingHero"), src.indexOf("export function FactRow"));
  const leadFirst = hero.indexOf("{!image && heroLead}");
  // Runde 2 (P3, ux P1-1): der Knopf trägt den Kontext (appointmentHref, Fallback /beratung) –
  // nur der Suchbegriff ist angepasst, die geprüfte Reihenfolge bleibt.
  const button = hero.indexOf("<Button href={appointmentHref || ROUTES.beratung.de}");
  const leadAfter = hero.indexOf("{image && heroLead}");
  assert.ok(leadFirst > 0 && button > leadFirst, "no-photo lead before the button");
  assert.ok(leadAfter > button, "with a photo the order H1 → photo → button → lead stays (QM P2-1)");
  // one LCP candidate at most: the photo keeps preload, nothing else preloads
  assert.equal((hero.match(/preload/g) || []).length, 1);
});

test("Hero callers: Küchen, Yacht, Outdoor pass the photo only when released; Schweiz hub has none", () => {
  assert.match(read("src/components/Landing/landingPage.js"), /image=\{hero\.show \? hero\.src : null\}/);
  for (const f of ["src/components/Landing/Yacht/YachtLanding.js", "src/components/Landing/Outdoor/OutdoorLanding.js"]) {
    assert.match(read(f), /image=\{heroImg\.show \? heroImg\.src : null\}/, f);
  }
  const ch = read(`${APP}/einkaufen-aus-der-schweiz/page.js`);
  const call = ch.slice(ch.indexOf("<LandingHero"), ch.indexOf("/>", ch.indexOf("<LandingHero")));
  assert.doesNotMatch(call, /image=/);
});

// ---------------------------------------------------------- 2. og:locale

const OG_FILES = [
  `${APP}/news/page.js`,
  `${APP}/news/[title]/page.js`,
  `${APP}/ueber-uns/karriere/page.js`,
  `${APP}/ueber-uns/karriere/[slug]/page.js`,
  `${APP}/ueber-uns/partner/page.js`,
  `${APP}/ueber-uns/presse/page.js`,
  `${APP}/ueber-uns/platzhirsch/page.js`,
  `${APP}/ueber-uns/team/page.js`,
  `${APP}/datenschutz/page.js`,
  `${APP}/impressum/page.js`,
];

test("og:locale: content pages use ogLocale(locale), no own map, no CMS override", () => {
  for (const f of OG_FILES) {
    const src = read(f);
    assert.match(src, /import \{[^}]*\bogLocale\b[^}]*\} from "@\/lib\/seo\/pageMetadata"/, f);
    assert.match(src, /locale: ogLocale\(locale\)/, f);
    assert.doesNotMatch(src, /"de_DE"|"en_US"|"en_GB"|"de_AT"|meta\?\.locale/, f);
  }
});

test("og:locale: DE-only Ratgeber/Projekte and the landing template use the shared map", () => {
  for (const f of [`${APP}/ratgeber/page.js`, `${APP}/ratgeber/[slug]/page.js`, `${APP}/projekte/page.js`, `${APP}/projekte/[slug]/page.js`]) {
    const src = read(f);
    assert.match(src, /locale: ogLocale\("de"\)/, f);
    assert.doesNotMatch(src, /"de_AT"/, f);
  }
  const landing = read("src/components/Landing/landingPage.js");
  assert.match(landing, /locale: locale \|\| AUDIENCE_OG_LOCALE\[path\] \|\| ogLocale\("de"\)/);
  assert.doesNotMatch(landing, /"de_AT"/);
});

// ------------------------------------------------------- 3. Doorway stand

test("doorway audit stand unchanged (R1-seo counts, threshold 4)", () => {
  assert.equal(MIN_OWN_FACTS, 4);
  assert.deepEqual(
    { ...REGION_AUDIT },
    {
      "/designermoebel-rheintal": 5,
      "/designermoebel-liechtenstein": 5,
      "/designermoebel-arlberg": 5,
      "/designermoebel-konstanz": 4,
      "/designermoebel-feldkirch": 4,
      "/designermoebel-appenzell": 4,
      "/designermoebel-ravensburg": 3,
      "/designermoebel-kempten": 2,
      // Runde 3 P5 (seo P0-1): own, sourced facts (doorwayAudit.js REGION_FACTS).
      "/designermoebel-lindau": 4,
      "/designermoebel-friedrichshafen": 4,
      "/designermoebel-st-gallen": 4,
      "/designermoebel-dornbirn": 4,
      "/designermoebel-bregenz": 4,
    }
  );
  const indexed = Object.keys(REGION_AUDIT).filter(passesDoorwayAudit).sort();
  assert.deepEqual(indexed, [
    "/designermoebel-appenzell",
    "/designermoebel-arlberg",
    "/designermoebel-bregenz",
    "/designermoebel-dornbirn",
    "/designermoebel-feldkirch",
    "/designermoebel-friedrichshafen",
    "/designermoebel-konstanz",
    "/designermoebel-liechtenstein",
    "/designermoebel-lindau",
    "/designermoebel-rheintal",
    "/designermoebel-st-gallen",
  ]);
  for (const p of Object.keys(REGION_AUDIT)) {
    assert.deepEqual(regionRobots(p), { index: passesDoorwayAudit(p), follow: true }, p);
  }
});

test("region robots still come from regionRobots() in landingMetadata", () => {
  const src = read("src/components/Landing/landingPage.js");
  assert.match(src, /robots: isRegionPath\(path\) \? \{ index: index && regionRobots\(path\)\.index, follow: true \} : \{ index, follow: true \}/);
});

test("Schweiz hub and Projekte stay noindex,follow", () => {
  for (const f of [`${APP}/einkaufen-aus-der-schweiz/page.js`, `${APP}/projekte/page.js`, `${APP}/projekte/[slug]/page.js`]) {
    const src = read(f);
    assert.match(src, /robots: \{ index: false, follow: true \}/, f);
    assert.doesNotMatch(src, /index: true/, f);
  }
});

// QM content-legal (01.11.2026): Die sechs AP-6-Entwürfe (status „Entwurf –
// Faktenprüfung und Inhaber-Freigabe offen“, Prüfvermerk „Noch nicht
// freigegeben“) stehen wieder auf freigegeben: false, bis eine Inhaber-Freigabe
// belegt ist (inhaber-entscheidungen.md: „Veröffentlichung der Ratgeber mit
// [prüfen]-Stellen“ nicht entschieden). Freigegeben bleiben 8 Artikel.
const AP6_ENTWUERFE = [
  "bora-kochfeld-kosten",
  "interior-designer-oder-innenarchitekt",
  "quooker-kosten-strom-einbau",
  "sauna-zuhause-planen",
  "sofa-probesitzen-worauf-achten",
  "warum-sind-designermoebel-so-teuer",
];
test("Ratgeber: exactly the released articles are indexable, robots follow the release flag", () => {
  assert.ok(listRatgeber().length > 0);
  const indexable = getIndexableRatgeber().map((a) => a.slug).sort();
  assert.equal(indexable.length, 8);
  assert.ok(!indexable.includes("whirlpool-swimspa-garten-planen"), "Whirlpool-Entwurf nicht freigegeben");
  for (const slug of AP6_ENTWUERFE) assert.ok(!indexable.includes(slug), `${slug}: Entwurf nicht freigegeben`);
  assert.ok(indexable.includes("was-kostet-ein-minotti-sofa") && indexable.includes("was-kostet-eine-designerkueche"));
  assert.ok(listRatgeber().some((a) => a.freigegeben !== true), "Entwürfe bleiben noindex");
  assert.match(read(`${APP}/ratgeber/page.js`), /robots(?::| =) \{ index: getIndexableRatgeber\(\)\.length > 0, follow: true \}/);
  assert.match(read(`${APP}/ratgeber/[slug]/page.js`), /robots(?::| =) \{ index: article\.freigegeben === true, follow: true \}/);
});

test("Ratgeber: hreflang de + x-default like the other German-only pages (only while indexable)", async () => {
  const { deOnlyLanguages, seoAlternates } = await import("../../src/lib/seo/pageMetadata.js");
  assert.match(read(`${APP}/ratgeber/page.js`), /seoAlternates\(\{ canonical: url, languages: deOnlyLanguages\("\/ratgeber"\), robots \}\)/);
  assert.match(read(`${APP}/ratgeber/[slug]/page.js`), /seoAlternates\(\{ canonical: url, languages: deOnlyLanguages\(`\/ratgeber\/\$\{article\.slug\}`\), robots \}\)/);
  const url = "https://platzhirsch.studio/de/ratgeber/x";
  assert.deepEqual(seoAlternates({ canonical: url, languages: deOnlyLanguages("/ratgeber/x"), robots: { index: true, follow: true } }).languages, { de: url, "x-default": url });
  assert.deepEqual(seoAlternates({ canonical: url, languages: deOnlyLanguages("/ratgeber/x"), robots: { index: false, follow: true } }), { canonical: url });
});
