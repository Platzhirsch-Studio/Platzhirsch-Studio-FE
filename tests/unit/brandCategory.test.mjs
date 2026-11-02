// node --test tests/unit/brandCategory.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildBrandCategories,
  brandCategoryHref,
  brandCategorySlug,
  BRAND_CATEGORY_MIN_PRODUCTS,
} from "../../src/lib/marken/brandCategory.js";

// Runde 4 P5: every row is its own model with an image (indexability counts models).
const row = (marken, kategories, path_field, extra = {}) => ({
  marken,
  kategories,
  path_field,
  status: "Aktiv",
  produkt_name: `Modell ${path_field}`,
  bild_anhangen: [{ bild_anhangen: `/files/${path_field}.webp` }],
  ...extra,
});

// Runde 4 P5 (seo P1-1): threshold raised from 3 entries to 4 models.
test("counts active products per brand and category, indexable from 4 models", () => {
  const products = [
    row("Minotti", "sofas-couches", "a", { modified: "2026-09-01 10:00:00" }),
    row("Minotti", "sofas-couches", "b", { modified: "2026-10-02 10:00:00" }),
    row("Minotti", "sofas-couches", "c"),
    row("Minotti", "sofas-couches", "f"),
    row("Minotti", "beds", "d"),
    row("Minotti", "beds", "e"),
  ];
  const [minotti] = buildBrandCategories(products, {});
  assert.equal(minotti.brand, "Minotti");
  assert.equal(minotti.brandSlug, "minotti");
  assert.equal(minotti.total, 6);
  assert.deepEqual(
    minotti.categories.map((c) => [c.slug, c.count, c.indexable]),
    [["sofas-couches", 4, true], ["beds", 2, false]]
  );
  assert.equal(BRAND_CATEGORY_MIN_PRODUCTS, 4);
  assert.equal(minotti.categories[0].href, "/ueber-uns/marken/minotti/sofas-couches");
  assert.equal(new Date(minotti.categories[0].lastModified).getUTCMonth(), 9); // October
});

test("ignores inactive rows, rows without path/category, and duplicate path_field", () => {
  const products = [
    row("Poliform", "kitchen", "k1"),
    row("Poliform", "kitchen", "k1"),
    row("Poliform", "kitchen", "k2", { status: "Inaktiv" }),
    row("Poliform", "", "k3"),
    row("Poliform", "kitchen", ""),
    null,
  ];
  const [poliform] = buildBrandCategories(products);
  assert.equal(poliform.categories.length, 1);
  assert.equal(poliform.categories[0].count, 1);
});

test("flags a collision with an existing collection slug and never indexes it", () => {
  const products = ["1", "2", "3", "4"].map((id) => row("Paola Lenti", "Rugs", id));
  const [pl] = buildBrandCategories(products, { "Paola Lenti": [{ name: "rugs" }, { name: "Frame" }] });
  assert.equal(pl.brandSlug, "paola-lenti");
  assert.equal(pl.categories[0].slug, "rugs");
  assert.equal(pl.categories[0].collision, true);
  assert.equal(pl.categories[0].indexable, false);
});

test("collections may also come as a flat array with `marken`", () => {
  const products = ["1", "2", "3"].map((id) => row("Rimadesio", "shelves", id));
  const [r] = buildBrandCategories(products, [{ marken: "Rimadesio", name: "shelves" }, { marken: "Minotti", name: "beds" }]);
  assert.equal(r.categories[0].collision, true);
});

test("brands sorted A–Z, categories by count then slug", () => {
  const products = [
    row("Minotti", "rugs", "1"),
    row("ClassiCon", "side-tables", "2"),
    row("ClassiCon", "lamps", "3"),
    row("ClassiCon", "lamps", "4"),
    row("ClassiCon", "decor", "5"),
  ];
  const result = buildBrandCategories(products);
  assert.deepEqual(result.map((b) => b.brand), ["ClassiCon", "Minotti"]);
  assert.deepEqual(result[0].categories.map((c) => c.slug), ["lamps", "decor", "side-tables"]);
});

test("brandCategoryHref builds the localized brand path with the shared slug helper", () => {
  assert.equal(brandCategoryHref("Paola Lenti", "garden-tables"), "/ueber-uns/marken/paola-lenti/garden-tables");
  assert.equal(brandCategoryHref({ name1: "ClassiCon" }, { slug: "lamps" }, "en"), "/about-us/brands/classicon/lamps");
  assert.equal(brandCategoryHref("Minotti", "Sofas Couches", "fr"), "/a-propos/marques/minotti/sofas-couches");
  assert.equal(brandCategoryHref("Minotti", "beds", "it"), "/chi-siamo/marche/minotti/beds");
  assert.equal(brandCategoryHref("Minotti", "beds", "xx"), "/ueber-uns/marken/minotti/beds");
  assert.equal(brandCategoryHref("", "beds"), null);
  assert.equal(brandCategorySlug("Möbel Für Draußen"), "moebel-fuer-draussen");
});
