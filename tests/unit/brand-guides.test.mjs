// tests/unit/brand-guides.test.mjs
// SEO-Team A (31.10.2026), AP-1 Minotti + AP-7 Markenseiten-Muster:
// eigene Sachtexte und FAQ der Markenseiten (src/lib/content/brandGuides.js).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { GUIDE_BRANDS, GUIDE_LOCALES, brandGuide, guideWordCount } from "../../src/lib/content/brandGuides.js";
import { dealerStudio, findClaims, hasCountryPromise, hasUnprovenClaim, isVerifiedDealerBrand } from "../../src/lib/legal/claims.js";
import { faqPageSchema } from "../../src/lib/seo/faqSchema.js";

const NAMES = { minotti: "Minotti", rimadesio: "Rimadesio", treca: "Tréca", classicon: "ClassiCon", poliform: "Poliform", flos: "Flos", "tom-dixon": "Tom Dixon", "paola-lenti": "Paola Lenti" };
const all = (g) => [g.h1, g.title || "", g.description, ...g.sections.flatMap((s) => [s.title, ...s.paragraphs]), ...g.faq.flatMap((f) => [f.q, f.a]), ...g.links.map((l) => l.label)];
const DEALER_WORD = /händler|dealer|revendeur|rivenditore/i;

test("Leitfäden: alle Marken in vier Sprachen, gleiche Struktur", () => {
  assert.deepEqual([...GUIDE_BRANDS].sort(), Object.keys(NAMES).sort());
  for (const slug of GUIDE_BRANDS) {
    const de = brandGuide(slug, "de", NAMES[slug]);
    for (const l of GUIDE_LOCALES) {
      const g = brandGuide(slug, l, NAMES[slug]);
      assert.equal(g.sections.length, de.sections.length, `${slug}/${l}`);
      assert.equal(g.faq.length, de.faq.length, `${slug}/${l}`);
      assert.ok(g.faq.length >= 3, `${slug}/${l}: mindestens 3 Fragen`);
      for (const t of all(g)) assert.doesNotMatch(t, /\{\w+\}|undefined|null/, `${slug}/${l}: Platzhalter in „${t}“`);
    }
  }
});

test("Claim-Guard: keine Superlative, kein unbelegtes Händlerwort, keine Werbebehauptungen, kein Länderversprechen", () => {
  for (const slug of GUIDE_BRANDS) {
    for (const l of GUIDE_LOCALES) {
      const g = brandGuide(slug, l, NAMES[slug]);
      const text = all(g).join("\n");
      assert.deepEqual(findClaims(text, { locale: l, brandSlug: slug }), [], `${slug}/${l}`);
      assert.equal(hasUnprovenClaim(text), false, `${slug}/${l}`);
      assert.equal(hasCountryPromise(text), false, `${slug}/${l}`);
      // Händlerwort nur bei belegten Marken (VERIFIED_DEALER_BRANDS), Minotti nur im Studio-Wortlaut.
      if (!isVerifiedDealerBrand(slug) || slug === "minotti") assert.doesNotMatch(text, DEALER_WORD, `${slug}/${l}`);
      // Fläche des Minotti Studio (Stand 2019) wird nicht genannt, keine Preise.
      assert.doesNotMatch(text, /\d+\s?m²|\bm2\b|€|EUR\s?\d/, `${slug}/${l}`);
      // Kein „Innenarchitekt“ als eigene Berufsbezeichnung.
      assert.doesNotMatch(text, /innenarchitekt/i, `${slug}/${l}`);
    }
  }
});

test("AP-1 Minotti: H1 mit Studio-Namen, ≥ 500 Wörter eigener Text, Studio-Satz aus dem Claim-Register", () => {
  for (const l of GUIDE_LOCALES) {
    const g = brandGuide("minotti", l, "Minotti");
    assert.match(g.h1, /^Minotti Studio by Platzhirsch Home Living (in|à|a) Lochau$/, l);
    assert.notEqual(g.h1, "Minotti");
    assert.ok(guideWordCount(g) >= 500, `${l}: ${guideWordCount(g)} Wörter`);
    assert.ok(all(g).join(" ").includes(dealerStudio("minotti", l).statement), l);
    assert.equal(g.title, null, "Title bleibt der Claim-Wortlaut aus claims.js");
    // Interne Links: Sofaplaner, Ratgeber Minotti-Sofa, Arbeitsweise.
    const hrefs = g.links.map((x) => x.href);
    assert.ok(hrefs.some((h) => h.includes("/sofaplaner")), l);
    assert.ok(hrefs.includes("/de/ratgeber/was-kostet-ein-minotti-sofa"), l);
    assert.ok(hrefs.some((h) => h.endsWith("/arbeitsweise")), l);
  }
});

test("AP-7: H1 „<Marke> bei Platzhirsch in Lochau“, Title ≤ 60 nur ohne Händlerclaim, Description 120–150", () => {
  const H1 = { de: / bei Platzhirsch in Lochau$/, en: / at Platzhirsch in Lochau$/, fr: / chez Platzhirsch à Lochau$/, it: / da Platzhirsch a Lochau$/ };
  for (const slug of GUIDE_BRANDS) {
    for (const l of GUIDE_LOCALES) {
      const g = brandGuide(slug, l, NAMES[slug]);
      if (slug !== "minotti") assert.match(g.h1, H1[l], `${slug}/${l}`);
      assert.ok(g.description.length >= 120 && g.description.length <= 150, `${slug}/${l}: Description ${g.description.length}`);
      if (isVerifiedDealerBrand(slug)) assert.equal(g.title, null, `${slug}: Händlermarke behält den Titel aus brandTitle.js`);
      if (g.title) {
        assert.ok(g.title.length <= 60, `${slug}/${l}: Title ${g.title.length}`);
        assert.match(g.title, /\| Platzhirsch$/);
      }
      assert.match(g.sourceUrl, /^https:\/\//);
    }
  }
});

test("Händlersatz belegter Marken nur über dealerStatement(), unbelegte Marken: „Wir führen …“", () => {
  for (const slug of ["classicon", "flos", "tom-dixon"]) {
    const g = brandGuide(slug, "de", NAMES[slug]);
    assert.match(g.sections[1].paragraphs[0], /^Platzhirsch Home Living ist (Vertragsh|H)ändler von /, slug);
  }
  for (const slug of ["rimadesio", "poliform", "paola-lenti", "treca"]) {
    const g = brandGuide(slug, "de", NAMES[slug]);
    assert.ok(!isVerifiedDealerBrand(slug), slug);
    assert.match(g.sections[1].paragraphs.join(" "), /Wir führen /, slug);
  }
});

test("FAQPage aus denselben Einträgen wie die sichtbare FAQ; Markenseite bindet Leitfaden und FAQ ein", () => {
  const g = brandGuide("minotti", "fr", "Minotti");
  const ld = faqPageSchema("https://platzhirsch.studio/fr/a-propos/marques/minotti", "fr", g.faq);
  assert.equal(ld["@type"], "FAQPage");
  assert.deepEqual(ld.mainEntity.map((q) => q.name), g.faq.map((f) => f.q));
  const src = fs.readFileSync("src/components/MarkenItems/markenitems.js", "utf8");
  assert.match(src, /brandGuide\(brandSlug, locale, brand\)/);
  // Leitfaden-FAQ + „Minotti am Bodensee“-Frage in EINER Liste (sichtbar + FAQPage).
  assert.match(src, /const faqItems = \[\.\.\.\(guide\?\.faq \|\| \[\]\), \.\.\.\(bodensee\?\.faq \|\| \[\]\)\]/);
  assert.match(src, /faqPageSchema\(pageUrl, locale, faqItems\)/);
  assert.match(src, /\{guide\?\.h1 \|\| brand\}/);
  assert.match(fs.readFileSync("src/app/[locale]/ueber-uns/marken/[title]/page.js", "utf8"), /guide\?\.title \|\| brandPageTitle/);
});

test("Sofaplaner-Wortlaut bleibt an SOURCE_COPY gebunden (r8-claims-sofaplaner)", () => {
  const src = fs.readFileSync("src/lib/content/brandGuides.js", "utf8");
  assert.doesNotMatch(src, /"[^"\n]*(Minotti-Sofaplaner|Minotti-Sofa zusammenstellen|Minotti-Sofa aus|Minotti sofa from|canapé Minotti à partir|divano Minotti a partire)[^"\n]*"/);
  assert.match(src, /sourceCopyFor\(l\)\.seoName/);
});
