// node --test tests/unit/brandCategoryPage.test.mjs
// "Marke × Kategorie" page logic (R2-seo): copy in 4 languages, intro from
// proven data through the Claim-Guard, robots (noindex < 3 / collision),
// canonical + hreflang, BreadcrumbList + ItemList JSON-LD, and that the
// messages proposal matches the locale module.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BRAND_CATEGORY_COPY, BRAND_CATEGORY_NAMESPACE, formatCopy, makeBrandCategoryTr } from "../../src/lib/marken/brandCategoryCopy.js";
import {
  brandCategoryRobots,
  brandCategoryUrl,
  buildBrandCategoryIntro,
  buildBrandCategoryJsonLd,
  buildBrandCategoryMetadata,
  introInput,
  brandCategoryModelCount,
} from "../../src/lib/marken/brandCategoryPage.js";
import { findClaims } from "../../src/lib/legal/claims.js";
import { expectedFor, itExpected, itExpectedTree } from "./r5-i18n-voi.lib.mjs"; // Runde 4: IT voi (tools/i18n/patches/r4-p2-it-voi.json)

const LOCALES = ["de", "en", "fr", "it"];
const LABEL = { de: "Sofas & Couches", en: "Sofas & Couches", fr: "Canapés", it: "Divani" };

const fixture = (over = {}) => ({
  brand: { name: "Minotti", display: "Minotti", slug: "minotti", country: "Italien", founded: "1948" },
  category: { key: "sofas-couches", slug: "sofas-couches", label: "Sofas & Couches" },
  count: 62,
  indexable: true,
  collision: false,
  lastModified: "2026-10-02T09:51:49.000Z",
  products: [
    { slug: "sofas-lawrence", name: "Lawrence", href: "/produkte/sofas-couches/sofas-lawrence", image: "/cmx/files/a.webp", alt: "Minotti Lawrence" },
    { slug: "sofas-andersen", name: "Andersen", href: "/produkte/sofas-couches/sofas-andersen", image: "/cmx/files/b.webp", alt: "Minotti Andersen" },
  ],
  otherCategories: [],
  ...over,
});

test("copy: every locale has the same keys, no empty string", () => {
  const keys = Object.keys(BRAND_CATEGORY_COPY.de).sort();
  for (const l of LOCALES) {
    assert.deepEqual(Object.keys(BRAND_CATEGORY_COPY[l]).sort(), keys, l);
    for (const [k, v] of Object.entries(BRAND_CATEGORY_COPY[l])) assert.ok(String(v).trim(), `${l}.${k} empty`);
  }
});

test("copy: no dealer claim, no superlative in any locale (Minotti and Poliform)", () => {
  for (const l of LOCALES) {
    const tr = makeBrandCategoryTr(null, l);
    for (const brand of ["Minotti", "Poliform"]) {
      for (const key of Object.keys(BRAND_CATEGORY_COPY[l])) {
        for (const count of [1, 2, 62]) {
          const text = tr(key, { brand, category: LABEL[l], count });
          assert.deepEqual(findClaims(text, { brandSlug: brand.toLowerCase(), locale: l }), [], `${l}.${key}: ${text}`);
          assert.ok(!/[{}]/.test(text), `${l}.${key} unresolved placeholder: ${text}`);
        }
      }
    }
    // Words the brand pages avoid (voice), even where the guard allows them.
    for (const v of Object.values(BRAND_CATEGORY_COPY[l])) assert.ok(!/exklusiv|exclusi|esclusiv|luxus|luxur|lusso|luxe|premium|führend|leading|händler|dealer/i.test(v), v);
  }
});

test("formatCopy: ICU plural one/other with #", () => {
  assert.equal(formatCopy("{count, plural, one {# Stück} other {# Stücke}}", { count: 1 }, "de"), "1 Stück");
  assert.equal(formatCopy("{count, plural, one {# Stück} other {# Stücke}}", { count: 3 }, "de"), "3 Stücke");
  assert.equal(formatCopy("{count, plural, one {un {b}} other {# de {b}}}", { count: 5, b: "X" }, "fr"), "5 de X");
  assert.equal(formatCopy("{a} und {missing}", { a: "A" }), "A und {missing}");
});

// R6-release: messages-r5-shell.json (übernommen in R6-i18n) setzt
// brandCategory.breadcrumbHome neu ("Startseite" statt "Home"); spätere
// Vorschläge überschreiben frühere, wie beim Merge.
test("messages-r2-seo/r3-marken/r5-shell.json mirror the locale module", () => {
  const read = (name) => JSON.parse(readFileSync(fileURLToPath(new URL(`../../Marktresearch/digital/teamleiter/${name}`, import.meta.url)), "utf8"));
  const r2 = read("messages-r2-seo.json");
  const r3 = read("messages-r3-marken.json");
  const r5 = read("messages-r5-shell.json");
  for (const l of LOCALES) {
    const merged = { ...r2[l][BRAND_CATEGORY_NAMESPACE], ...(r3[l]?.[BRAND_CATEGORY_NAMESPACE] || {}), ...(r5[l]?.[BRAND_CATEGORY_NAMESPACE] || {}) };
    assert.deepEqual(Object.keys(merged).sort(), Object.keys(BRAND_CATEGORY_COPY[l]).sort(), l);
    // r7-p1 (ux P1-5): the appointment CTA uses the one main word per
    // language ("Termin anfragen", "Request a visit" …) since round 7.
    for (const k of Object.keys(merged).filter((k) => k !== "ctaAppointment")) assert.equal(expectedFor(l, `${BRAND_CATEGORY_NAMESPACE}.${k}`, merged[k]), BRAND_CATEGORY_COPY[l][k], `${l}.${k}`);
  }
});

test("translator prefers next-intl messages when the key exists", () => {
  const t = Object.assign((key) => `MSG:${key}`, { has: (key) => key === "h1" });
  const tr = makeBrandCategoryTr(t, "de");
  assert.equal(tr("h1", {}), "MSG:h1");
  assert.equal(tr("ctaBrand"), "Zur Markenseite");
});

test("intro: only proven facts, count, neutral showroom sentence, guard clean", () => {
  for (const l of LOCALES) {
    const data = fixture({ category: { key: "sofas-couches", slug: "sofas-couches", label: LABEL[l] } });
    const intro = buildBrandCategoryIntro(introInput(data), l);
    assert.equal(intro.length, 2, l);
    // one visible number: the gallery's model count (2), never the raw 62 entries
    assert.match(intro[0], / 2 /);
    assert.doesNotMatch(intro[0], /62/);
    assert.match(intro[0], /Minotti/);
    assert.match(intro[1], /Lochau/);
    assert.deepEqual(findClaims(intro.join(" "), { brandSlug: "minotti", locale: l }), [], l);
  }
  const one = buildBrandCategoryIntro({ brand: "Flos", brandSlug: "flos", category: "Leuchten", count: 1 }, "de");
  assert.match(one[0], /ein Modell von Flos/);
});

test("intro: a category label carrying a claim never leaks one", () => {
  const intro = buildBrandCategoryIntro({ brand: "Minotti", brandSlug: "minotti", category: "Offizieller Händler Sofas", count: 5 }, "de");
  assert.deepEqual(findClaims(intro.join(" "), { brandSlug: "minotti", locale: "de" }).filter((f) => f.type === "dealer"), []);
});

// Runde 4 P5 (seo P1-1): the threshold is 4 MODELS (gallery tiles or
// buildBrandCategories().models), no longer 3 raw backoffice entries; Brand
// van Egmond lamps had 3+ entries but an empty gallery and was indexed.
test("robots: index from 4 models on, noindex,follow below and on collision", () => {
  assert.deepEqual(brandCategoryRobots(fixture({ models: 4 })), { index: true, follow: true });
  assert.deepEqual(brandCategoryRobots(fixture({ models: 3, count: 62 })), { index: false, follow: true });
  assert.deepEqual(brandCategoryRobots(fixture({ models: 0 })), { index: false, follow: true });
  // without `models` the gallery decides (fixture: 2 tiles, so noindex)
  assert.deepEqual(brandCategoryRobots(fixture({ count: 62 })), { index: false, follow: true });
  assert.deepEqual(brandCategoryRobots(fixture({ models: 40, collision: true })), { index: false, follow: true });
  assert.deepEqual(buildBrandCategoryMetadata(fixture({ models: 2 }), "de").robots, { index: false, follow: true });
});

test("metadata: canonical self per locale, hreflang like the brand pages", () => {
  const paths = {
    de: "/de/ueber-uns/marken/minotti/sofas-couches",
    en: "/en/about-us/brands/minotti/sofas-couches",
    fr: "/fr/a-propos/marques/minotti/sofas-couches",
    it: "/it/chi-siamo/marche/minotti/sofas-couches",
  };
  for (const l of LOCALES) {
    const meta = buildBrandCategoryMetadata(fixture(), l);
    assert.equal(meta.alternates.canonical, `https://platzhirsch.studio${paths[l]}`);
    assert.equal(meta.openGraph.url, meta.alternates.canonical);
    const langs = meta.alternates.languages;
    for (const x of LOCALES) assert.equal(langs[x], `https://platzhirsch.studio${paths[x]}`);
    assert.equal(langs["x-default"], langs.de);
    assert.equal(langs["de-CH"], langs.de);
    assert.equal(langs["fr-CH"], langs.fr);
    assert.ok(meta.title.length <= 70, meta.title);
    assert.ok(meta.description.length > 50 && meta.description.length <= 160, meta.description);
    assert.deepEqual(findClaims(`${meta.title} ${meta.description}`, { brandSlug: "minotti", locale: l }), []);
  }
  assert.equal(buildBrandCategoryMetadata(fixture(), "de").title, "Minotti Sofas & Couches – Beratung in Lochau | Platzhirsch");
  assert.equal(brandCategoryUrl("Paola Lenti", "rugs", "it"), "https://platzhirsch.studio/it/chi-siamo/marche/paola-lenti/rugs");
});

test("metadata: unknown page → noindex title, robots override for the preview", () => {
  assert.deepEqual(buildBrandCategoryMetadata(null, "en").robots, { index: false, follow: true });
  const preview = buildBrandCategoryMetadata(fixture(), "de", null, { robots: { index: false, follow: false } });
  assert.deepEqual(preview.robots, { index: false, follow: false });
});

test("JSON-LD: BreadcrumbList (4 levels) and ItemList with absolute product URLs", () => {
  const ld = buildBrandCategoryJsonLd(fixture(), "en");
  assert.equal(ld["@context"], "https://schema.org");
  const byType = Object.fromEntries(ld["@graph"].map((n) => [n["@type"], n]));
  const crumbs = byType.BreadcrumbList.itemListElement;
  assert.deepEqual(crumbs.map((c) => c.position), [1, 2, 3, 4]);
  assert.equal(crumbs[1].item, "https://platzhirsch.studio/en/about-us/brands");
  assert.equal(crumbs[2].item, "https://platzhirsch.studio/en/about-us/brands/minotti");
  assert.equal(crumbs[3].item, "https://platzhirsch.studio/en/about-us/brands/minotti/sofas-couches");
  const list = byType.ItemList;
  assert.equal(list.numberOfItems, 2);
  assert.equal(list.itemListElement[0].url, "https://platzhirsch.studio/en/produkte/sofas-couches/sofas-lawrence");
  assert.equal(byType.CollectionPage.mainEntity["@id"], list["@id"]);
  assert.equal(byType.CollectionPage.breadcrumb["@id"], byType.BreadcrumbList["@id"]);
  assert.equal(buildBrandCategoryJsonLd(null, "de"), null);
});

test("QA R2 P2-1/P2-2: titles promise advice, not an exhibition; one number on the page", async () => {
  const { BRAND_CATEGORY_COPY } = await import("../../src/lib/marken/brandCategoryCopy.js");
  for (const l of LOCALES) {
    const title = BRAND_CATEGORY_COPY[l].metaTitle;
    assert.doesNotMatch(title, /Ausstellung|Showroom|exposition|esposizione/i, l);
    assert.match(title, /Lochau/, l);
    const meta = buildBrandCategoryMetadata(fixture(), l);
    assert.doesNotMatch(meta.description, /62/, l);
    assert.match(meta.description, / 2 /, l);
  }
  assert.equal(brandCategoryModelCount(fixture()), 2);
  assert.equal(brandCategoryModelCount({ count: 7 }), 7);
});
