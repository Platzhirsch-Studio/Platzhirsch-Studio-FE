// R3-produkt: checked product copy on the product page (text-hash approval,
// FAQ + FAQPage JSON-LD), central claim filter for manufacturer copy,
// catalogue rest list (/produkte/sofas alias).
// Run: node --test tests/unit/r3-produkt.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  approvedFaqItems,
  carryApprovals,
  entryHash,
  isFieldApproved,
  signApproval,
  staleApprovals,
} from "../../src/lib/productCopy/approvals.js";
import { buildFaqJsonLd, createProductCopyStore, isPublishedCopy, metadataOverride, previewCopy } from "../../src/lib/productCopy/core.js";
import { getProductCopyDraft } from "../../src/lib/productCopy/index.js";
import {
  filterManufacturerCopy,
  filterManufacturerParagraphs,
  filterManufacturerProduct,
  filterManufacturerText,
  manufacturerClaimReason,
} from "../../src/lib/shop/manufacturerText.js";
import { findClaims, toBrandSlug } from "../../src/lib/legal/claims.js";
import { BRAND_VAN_EGMOND_PRODUCTS } from "../../src/lib/data/importedProducts/brandVanEgmond.js";
import { NEXT125_PRODUCTS } from "../../src/lib/data/importedProducts/next125.js";
import { TRECA_PRODUCTS } from "../../src/lib/data/importedProducts/treca.js";
import { CATEGORY_ALIASES, categoryAlias } from "../../src/lib/shop/categoryAliases.js";

const SIGN = { by: "Inhaber", at: "2026-10-27" };
const read = (rel) => fs.readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");

// A real draft entry (Flos Arco) as fixture: approvals are only ever added in
// memory here, de.json stays untouched.
const ARCO = getProductCopyDraft("lamps", "lamps-arco");
const storeWith = (entry) => createProductCopyStore({ entries: [entry] });

// ---------------------------------------------------------------- approvals

test("01 Freigabe gilt nur mit passendem Text-Hash (ganzer Eintrag)", () => {
  assert.ok(ARCO, "Arco-Entwurf vorhanden");
  assert.equal(storeWith(ARCO).get("lamps", "lamps-arco", "de"), null, "Entwurf ohne Freigabe");
  assert.equal(storeWith({ ...ARCO, approved: true }).get("lamps", "lamps-arco", "de"), null, "approved:true ohne Hash");
  assert.equal(storeWith({ ...ARCO, approved: true, approvalHash: "t1:falsch" }).get("lamps", "lamps-arco", "de"), null);

  const ok = signApproval(ARCO, { fields: "all", ...SIGN });
  assert.equal(ok.approvalHash, entryHash(ARCO));
  const copy = storeWith(ok).get("lamps", "lamps-arco", "de");
  assert.ok(isPublishedCopy(copy));
  assert.deepEqual(copy.paragraphs, ARCO.paragraphs);
  assert.equal(copy.faq.length, ARCO.faq.length);

  // Text nach der Freigabe geändert -> unsichtbar
  const edited = { ...ok, paragraphs: [...ok.paragraphs.slice(0, -1), "Geänderter Absatz."] };
  assert.equal(storeWith(edited).get("lamps", "lamps-arco", "de"), null);
  assert.deepEqual(staleApprovals(edited), ["lamps/lamps-arco:entry"]);
});

test("02 Freigabe je Feld und je FAQ-Antwort: nur Freigegebenes erscheint", () => {
  const partial = signApproval(ARCO, { fields: ["facts"], faq: [0], ...SIGN });
  const copy = storeWith(partial).get("lamps", "lamps-arco", "de");
  assert.ok(isPublishedCopy(copy));
  assert.deepEqual(copy.facts, ARCO.facts);
  assert.equal(copy.paragraphs, undefined, "Absätze nicht freigegeben -> unsichtbar");
  assert.equal(copy.meta, undefined);
  assert.equal(copy.h1, undefined);
  assert.deepEqual(copy.faq, [ARCO.faq[0]]);
  assert.deepEqual(metadataOverride(copy), {}, "Meta nicht freigegeben -> Backoffice-Titel bleibt");

  // Eine freigegebene Antwort wird geändert -> nur sie fällt weg
  const faq = ARCO.faq.map((f, i) => (i === 0 ? { ...f, answer: `${f.answer} Neu.` } : f));
  const changed = { ...partial, faq };
  assert.deepEqual(approvedFaqItems(changed), []);
  assert.ok(isFieldApproved(changed, "facts"));
  assert.deepEqual(staleApprovals(changed), ["lamps/lamps-arco:faq#0"]);
  assert.equal(storeWith({ ...changed, facts: [] }).get("lamps", "lamps-arco", "de"), null, "nichts Gültiges -> null");
});

test("03 nur Deutsch: andere Sprachen bekommen keinen deutschen Text", () => {
  const store = storeWith(signApproval(ARCO, { fields: "all", ...SIGN }));
  for (const loc of ["en", "fr", "it", "", undefined]) {
    assert.equal(store.get("lamps", "lamps-arco", loc), null, `locale ${loc}`);
    assert.equal(store.resolve("lamps", "lamps-arco", loc), null);
  }
  // Page: only the de branch may fall back to the dev preview
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /if \(published \|\| locale !== "de" \|\| process\.env\.NODE_ENV === "production"\) return published;/);
});

test("04 build.mjs-Übernahme behält Feld-Hashes, meldet veraltete", () => {
  const prev = [signApproval(ARCO, { fields: ["facts", "paragraphs"], faq: [1], ...SIGN })];
  const next = [{ ...ARCO, paragraphs: ["Neu generiert."] }];
  const r = carryApprovals(prev, next);
  assert.deepEqual(r.entries[0].approvals, prev[0].approvals);
  assert.deepEqual(r.stale, ["lamps/lamps-arco:paragraphs"]);
  assert.ok(isFieldApproved(r.entries[0], "facts"));
  assert.equal(isFieldApproved(r.entries[0], "paragraphs"), false);
});

test("05 ausgelieferte de.json: kein Eintrag freigegeben, Vorschau nie veröffentlicht", () => {
  const data = JSON.parse(read("src/content/productCopy/de.json"));
  assert.ok(data.entries.every((e) => !e.approvalHash && !e.approvals));
  const preview = previewCopy(ARCO);
  assert.equal(preview.preview, true);
  assert.equal(isPublishedCopy(preview), false);
  assert.equal(buildFaqJsonLd(preview, "https://x.test/p", { faqVisible: true }), null);
  assert.deepEqual(metadataOverride(preview), {});
});

// -------------------------------------------------- rich results structure

// Structure Google's Rich Results Test expects for FAQPage / Product
// (developers.google.com/search/docs/appearance/structured-data/faqpage):
// @context, FAQPage.mainEntity[] of Question{name, acceptedAnswer: Answer{text}},
// text without HTML, no empty strings; one FAQPage per page.
function assertFaqPage(node, pageUrl, expected) {
  assert.equal(node["@type"], "FAQPage");
  assert.equal(node["@id"], `${pageUrl}#faq`);
  assert.ok(Array.isArray(node.mainEntity) && node.mainEntity.length === expected.length);
  node.mainEntity.forEach((q, i) => {
    assert.equal(q["@type"], "Question");
    assert.equal(q.name, expected[i].question);
    assert.equal(q.acceptedAnswer["@type"], "Answer");
    assert.equal(q.acceptedAnswer.text, expected[i].answer);
    for (const v of [q.name, q.acceptedAnswer.text]) {
      assert.equal(typeof v, "string");
      assert.ok(v.trim().length > 0);
      assert.doesNotMatch(v, /<[a-z/][^>]*>/i, "kein HTML im JSON-LD");
    }
  });
}

test("06 Rich Results: FAQPage aus geprüften Antworten, im @graph neben Product", () => {
  const pageUrl = "https://platzhirsch.studio/de/produkte/lamps/lamps-arco";
  const copy = storeWith(signApproval(ARCO, { fields: "all", ...SIGN })).get("lamps", "lamps-arco", "de");
  const showFaq = copy.faq.length > 0;
  const faqNode = buildFaqJsonLd(copy, pageUrl, { faqVisible: showFaq });
  assertFaqPage(faqNode, pageUrl, ARCO.faq);
  // Same graph shape the page builds (structuredData.graph filters null)
  const graphJson = { "@context": "https://schema.org", "@graph": [{ "@type": "Product", "@id": `${pageUrl}#product`, name: "Arco" }, faqNode].filter(Boolean) };
  const parsed = JSON.parse(JSON.stringify(graphJson).replace(/</g, "\\u003c"));
  assert.equal(parsed["@context"], "https://schema.org");
  assert.equal(parsed["@graph"].filter((n) => n["@type"] === "FAQPage").length, 1);
  assert.equal(parsed["@graph"].filter((n) => n["@type"] === "Product").length, 1);

  // Only the approved answers end up in the markup
  const partial = storeWith(signApproval(ARCO, { fields: [], faq: [1], ...SIGN })).get("lamps", "lamps-arco", "de");
  assertFaqPage(buildFaqJsonLd(partial, pageUrl, { faqVisible: true }), pageUrl, [ARCO.faq[1]]);
  // Not visible -> no markup
  assert.equal(buildFaqJsonLd(copy, pageUrl, { faqVisible: false }), null);
});

test("07 Seite: FAQ-JSON-LD an dieselbe Bedingung wie die sichtbare FAQ gebunden, SEO-Knoten bleiben", () => {
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /const showFaq = copy\?\.faq\?\.length > 0;/);
  assert.match(page, /buildFaqJsonLd\(copy, pageUrl, \{ faqVisible: showFaq \}\)/);
  assert.match(page, /curated=\{copy\}/);
  assert.match(page, /productSchema\(\{/);
  assert.match(page, /breadcrumbList\(/);
  assert.match(page, /pathByLocale: productsPathByLocale\(categorySlug, productSlug\)/, "Canonical/hreflang aus der Live-URL");
  assert.doesNotMatch(page.replace(/\/\/.*$/gm, ""), /catalog\.path/, "nie copy.catalog.path als Canonical/Link");
  assert.match(page, /from "@\/lib\/productCopy\/server"/);
  const sections = read("src/components/ShopCatalog/productInfoTabs.js");
  // FAQ rendered as <details>: content stays in the DOM (not a lazy tab)
  assert.match(sections, /curatedFaq\.length > 0 && \(\s*<Block id="fragen"/);
  assert.match(sections, /<details key=\{f\.question\}/);
});

// ------------------------------------------------------ manufacturer filter

test("08 Herstellertext-Filter: Superlative, Händler, Liefer- und Preissätze fallen weg", () => {
  const cases = [
    ["This unique object truly shines. It is made of brass.", "Brand van Egmond", "It is made of brass."],
    ["The suspension adapts to your morphology, giving you unrivalled comfort. The base is oak.", "Tréca Paris", "The base is oak."],
    ["Today Minotti is recognized worldwide as a leading name in luxury furniture. Founded in 1948.", "Minotti", "Founded in 1948."],
    // Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026):unbelegte Marke Rimadesio statt Minotti.
    ["Wir sind offizieller Rimadesio Händler. Der Tisch ist rund.", "Rimadesio", "Der Tisch ist rund."],
    ["Erhältlich bei Platzhirsch Studio in Vorarlberg. Gestell aus Eiche.", "Minotti", "Gestell aus Eiche."],
    ["Lieferzeit 6 Wochen. Ab 2.400 € erhältlich. Stoffe in Preisgruppe A bis D.", "Poliform", "Stoffe in Preisgruppe A bis D."],
    ["It’s the perfect mattress for side sleepers. Height 26 cm.", "Tréca Paris", "Height 26 cm."],
    ["Available in Nickel, Gold Satin.", "Brand van Egmond", "Available in Nickel, Gold Satin."],
    ["FSC-zertifiziertes Holz. Bezug abnehmbar.", "Minotti", "FSC-zertifiziertes Holz. Bezug abnehmbar."],
  ];
  for (const [input, brand, expected] of cases) assert.equal(filterManufacturerText(input, { brand }), expected, input);
  // ClassiCon is the one documented dealer (CLAIM_REGISTER)
  assert.equal(filterManufacturerText("Platzhirsch ist ClassiCon Händler.", { brand: "ClassiCon" }), "Platzhirsch ist ClassiCon Händler.");
  assert.equal(manufacturerClaimReason("Platzhirsch ist Poliform Händler.", { brand: "Poliform" }), "dealer");
});

test("09 Herstellertext-Filter: HTML bleibt gültig, leere Absätze verschwinden", () => {
  const html = "<p>Weich und tief. <strong>Ein einzigartiges</strong> Design.</p><p>Das beste Sofa.</p><ul><li>Sehr luxuriös.</li><li>Eiche massiv.</li></ul>";
  const r = filterManufacturerCopy(html, { brand: "Minotti" });
  assert.equal(r.text, "<p>Weich und tief.</p><ul><li>Eiche massiv.</li></ul>");
  assert.equal(r.removed.length, 3);
  assert.deepEqual(filterManufacturerParagraphs(["<p>Das beste Sofa.</p>", "<p>Bezug abnehmbar.</p>", ""], { brand: "Minotti" }), ["<p>Bezug abnehmbar.</p>"]);
  // inline markup of a kept sentence survives
  assert.equal(filterManufacturerText("<p><strong>Gestell:</strong> Eiche. Die führende Marke.</p>", { brand: "Minotti" }), "<p><strong>Gestell:</strong> Eiche.</p>");
});

// R4-produkt: the sources were rewritten neutrally, so the raw data has no
// finding any more either; the render filter stays (second line of defence).
test("10 Datendateien (brandVanEgmond, treca, next125): Rohdaten (R4) und gefilterte Sicht ohne Claim-Fund, Filter ändert die Quelle nicht", () => {
  const all = [...BRAND_VAN_EGMOND_PRODUCTS, ...NEXT125_PRODUCTS, ...TRECA_PRODUCTS];
  assert.ok(all.length > 100);
  const before = JSON.stringify(all);
  const texts = (value, out = []) => {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach((v) => texts(v, out));
    else if (value && typeof value === "object") Object.values(value).forEach((v) => texts(v, out));
    return out;
  };
  let rawHits = 0;
  for (const p of all) {
    const brandSlug = toBrandSlug(p.brand);
    const fields = (q) => texts([q.longDescription, q.details, (q.variants || []).map((v) => [v.description, v.specifications, v.compositions, v.finishes])]);
    rawHits += fields(p).reduce((n, t) => n + findClaims(t, { brandSlug, brands: [p.brand] }).length, 0);
    const filtered = filterManufacturerProduct(p);
    for (const t of fields(filtered)) {
      assert.deepEqual(findClaims(t, { brandSlug, brands: [p.brand] }), [], `${p.id}: ${t.slice(0, 120)}`);
      assert.equal(manufacturerClaimReason(t, { brand: p.brand }), null, `${p.id}: ${t.slice(0, 120)}`);
    }
    assert.equal(filtered.name, p.name);
    assert.deepEqual(filtered.images, p.images);
  }
  assert.equal(rawHits, 0, "Rohdaten an der Quelle neutral (R4-produkt)");
  assert.equal(JSON.stringify(all), before, "Quelldaten nicht verändert");
});

test("11 staticShopProducts: alle Text-Zugriffe laufen durch den Filter", () => {
  const src = read("src/lib/data/staticShopProducts.js");
  assert.match(src, /from "\.\.\/shop\/manufacturerText\.js"/);
  // R9-P5 (recht P1-3): both accessors take the locale and go through
  // localizedInfo(), which filters the English source AND the translation.
  assert.match(src, /export function getBrandInfo\(brand, locale = "de"\) \{\s*return localizedInfo\(brand, BRAND_INFO\[brand\]/);
  assert.match(src, /export function getDesignerInfo\(designer, locale = "de"\) \{[\s\S]{0,80}localizedInfo\(designer, DESIGNER_INFO\[designer\]/);
  assert.match(src, /const source = filterInfoBio\(info, ctx\);[\s\S]{0,160}filterInfoBio\(\{ \.\.\.info, bio \}, ctx\)/);
  assert.match(src, /export function getStaticShopProducts\(\)/);
  assert.match(src, /filterManufacturerText\(v, ctx\)/);
  const page = read("src/app/[locale]/produkte/[category]/[product]/page.js");
  assert.match(page, /filterManufacturerParagraphs\(product\.descriptionParagraphs/);
  assert.match(page, /filterManufacturerText\(localizedMarkenField\(marke, "produkte", locale\)/);
  assert.doesNotMatch(page, /AVAILABILITY_CLAIM|cleanProse/);
});

// ------------------------------------------------------------- rest list

test("12 /produkte/sofas: eindeutiger Alias auf sofas-couches, Seite prüft das Ziel", () => {
  assert.equal(categoryAlias("sofas"), "sofas-couches");
  assert.equal(categoryAlias("constructor"), null);
  assert.equal(categoryAlias("sofas-couches"), null);
  for (const [from, to] of Object.entries(CATEGORY_ALIASES)) assert.notEqual(from, to);
  const page = read("src/app/[locale]/produkte/[category]/page.js");
  assert.match(page, /if \(alias && \(await resolveCategory\(locale, alias\)\)\) \{\s*permanentRedirect\(/);
});

test("13 Katalog: jedes Raumbild höchstens einmal, Bühne ohne gestanzten Zoom-Knopf", () => {
  const catalog = read("src/components/ShopCatalog/shopCatalog.js");
  assert.match(catalog, /image: interludeImages\[ordinal\] \|\| null,/);
  const gallery = read("src/components/ShopCatalog/productGallery.js");
  assert.doesNotMatch(gallery, /pointer-events-none absolute right-3 top-3/);
  assert.doesNotMatch(gallery, /object-contain p-3/);
  assert.match(gallery, /onClick=\{\(\) => openLightbox\(index\)\}/);
});

// ------------------------------------------------------------- fix round

test("14 Katalog: Backoffice-Doppel (Marke + Name + Hauptbild) erscheinen nur einmal", async () => {
  const { dedupeShopProducts } = await import("../../src/lib/shop/dedupe.js");
  const img = "/cmx/files/minotti-torii-01.webp";
  const list = [
    { id: "a", brand: "Minotti", name: "Torii", image: img, url_slug: "sofas-torii-sofas" },
    { id: "b", brand: "Minotti", name: "Torii", image: img, url_slug: "sofas-torii-sofas-3" },
    { id: "c", brand: "Minotti", name: " torii ", image: img, url_slug: "sofas-torii-sofas-2" },
    { id: "d", brand: "Minotti", name: "Torii", image: "/cmx/files/minotti-torii-02.webp", url_slug: "chairs-torii" },
    { id: "e", brand: "Minotti", name: "Reeves", image: null, url_slug: "sofas-reeves-lounge-sofa" },
    { id: "f", brand: "Minotti", name: "Reeves", image: null, url_slug: "sofas-reeves-semi-round" },
  ];
  assert.deepEqual(dedupeShopProducts(list).map((p) => p.id), ["a", "d", "e", "f"]);
  const src = read("src/lib/shop/shopProducts.js");
  assert.match(src, /return dedupeShopProducts\(/);
});

test("15 Startliste Freigabe: 10 vorhandene Einträge, keiner doppelt", async () => {
  const { START_LIST } = await import("../../src/lib/productCopy/startList.js");
  const de = JSON.parse(read("src/content/productCopy/de.json"));
  const keys = new Set(de.entries.map((e) => e.key));
  assert.equal(START_LIST.length, 10);
  assert.equal(new Set(START_LIST).size, 10);
  for (const k of START_LIST) assert.ok(keys.has(k), k);
});
