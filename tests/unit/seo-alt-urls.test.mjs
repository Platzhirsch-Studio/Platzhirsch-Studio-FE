// Alte URLs, die bei Google ranken (SISTRIX AT/DE/CH, 26.10.2026), führen in einem
// Schritt auf die heutige Seite: Produkte über die feste Zuordnung, der
// umbenannte Treca-Artikel über LEGACY_NEWS_SLUGS. Geprüft lokal am 30.10.2026.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LEGACY_PRODUCT_MAP, mappedLegacyProduct } from "../../src/lib/seo/legacyProductMap.js";
import { decideKnownPath, indexKnownSlugs, LEGACY_NEWS_SLUGS } from "../../src/lib/seo/knownSlugs.js";

test("rankende alte Produkt-URLs haben ein Ziel im neuen Katalog", () => {
  assert.equal(Object.keys(LEGACY_PRODUCT_MAP).length, 11);
  assert.deepEqual(mappedLegacyProduct("rimadesio", "sixty-coffee-table-coffee-tables-rimadesio"), {
    categoryKey: "coffee-tables",
    pathField: "coffee-tables-sixty-coffee-table",
  });
  assert.deepEqual(mappedLegacyProduct("minotti", "darren-night-storage-units-night-tables-minotti"), {
    categoryKey: "night-tables",
    pathField: "drawer-units-darren-night-storage-units",
  });
  // Nicht mehr im Katalog → kein Eintrag, Resolver fällt auf die Markenseite.
  assert.equal(mappedLegacyProduct("desalto", "riga-outdoor-chairs-desalto"), null);
  for (const [key, [cat, slug]] of Object.entries(LEGACY_PRODUCT_MAP)) {
    assert.match(key, /^[a-z0-9-]+\/[a-z0-9-]+$/, key);
    assert.match(cat, /^[a-z0-9-]+$/, key);
    assert.match(slug, /^[a-z0-9-]+$/, key);
  }
});

test("Resolver nutzt die feste Zuordnung vor der alten Produkte-API", () => {
  const src = fs.readFileSync(new URL("../../src/lib/seo/legacyProductRedirects.js", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export async function resolveLegacyProductUrl"));
  assert.ok(fn.indexOf("mappedLegacyProduct(") > 0);
  assert.ok(fn.indexOf("mappedLegacyProduct(") < fn.indexOf("fetchLegacyProdukt("));
});

test("umbenannter Treca-Artikel: 308 auf den heutigen Slug, in allen Sprachen", () => {
  const known = indexKnownSlugs({
    v: 1,
    brands: { ok: true, list: [] },
    brandSegs: {},
    categories: { ok: true, list: [] },
    products: { ok: true, map: {} },
    news: { ok: true, list: ["treca-paris-minotti-poliform-schlafkomfort"] },
    jobs: { ok: true, list: [] },
  });
  for (const loc of ["de", "en", "fr", "it"]) {
    assert.deepEqual(decideKnownPath(`/${loc}/news/treca-paris-minotti-poliform-luxurioeser-schlafkomfort`, known), {
      action: "redirect",
      pathname: `/${loc}/news/treca-paris-minotti-poliform-schlafkomfort`,
    });
  }
  for (const target of Object.values(LEGACY_NEWS_SLUGS)) assert.notEqual(decideKnownPath(`/de/news/${target}`, known).action, "redirect");
});

test("Café in den Firmen-Daten: eigenes Profil platzhirsch.cafe, Teil von Platzhirsch", async () => {
  const src = fs.readFileSync(new URL("../../src/lib/seo/siteSchema.js", import.meta.url), "utf8");
  assert.match(src, /name: "Platzhirsch Café, Restaurant & Bar"/);
  assert.match(src, /url: "https:\/\/platzhirsch\.cafe\/"/);
  assert.match(src, /tripadvisor\.at\/Restaurant_Review-g1214785-d15685355/);
  assert.match(src, /tourismus\.lochau\.at\/cafe-platzhirsch\.html/);
  assert.match(src, /parentOrganization: \{ "@id": ORGANIZATION_ID \}/);
});

test("Händler-Alias: Backoffice-Marke „Baobab“ = belegte Marke baobab-collection", async () => {
  const { isVerifiedDealerBrand, dealerStatement, DEALER_BRAND_ALIASES } = await import("../../src/lib/legal/claims.js");
  assert.equal(DEALER_BRAND_ALIASES.baobab, "baobab-collection");
  assert.ok(isVerifiedDealerBrand("Baobab"));
  assert.ok(dealerStatement("Baobab", "de").length > 0);
  assert.ok(!isVerifiedDealerBrand("Poliform"));
});
