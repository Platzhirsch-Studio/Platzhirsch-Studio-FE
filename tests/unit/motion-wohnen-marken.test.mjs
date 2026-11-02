// tests/unit/motion-wohnen-marken.test.mjs — Motion-Runde Wohnen & Marken (01.11.2026)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { staggerStyle, IMAGE_HOVER } from "../../src/components/ShopCatalog/motion.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("staggerStyle: per column, 4 % steps, max four stages, always both variables", () => {
  assert.deepEqual(staggerStyle(0), { "--reveal-start": "0%", "--reveal-end": "40%" });
  assert.deepEqual(staggerStyle(1), { "--reveal-start": "4%", "--reveal-end": "44%" });
  assert.deepEqual(staggerStyle(2), { "--reveal-start": "8%", "--reveal-end": "48%" });
  // next row starts again at column 1 (no lockstep of later rows)
  assert.deepEqual(staggerStyle(3), staggerStyle(0));
  assert.deepEqual(staggerStyle(7), staggerStyle(1));
  // two columns
  assert.deepEqual(staggerStyle(2, 2), staggerStyle(0));
  assert.deepEqual(staggerStyle(3, 2), staggerStyle(1));
  // wide grids are capped at the fourth stage (≈ --stagger-max)
  assert.deepEqual(staggerStyle(5, 6), { "--reveal-start": "12%", "--reveal-end": "52%" });
  // robust against junk
  assert.deepEqual(staggerStyle(-3), staggerStyle(0));
  assert.deepEqual(staggerStyle(undefined, 0), staggerStyle(0));
  assert.deepEqual(staggerStyle(Number.NaN, Number.NaN), staggerStyle(0));
});

test("image hover: transform only, shared tokens, motion-safe (honours data-motion)", () => {
  assert.match(IMAGE_HOVER, /^transition-transform /);
  assert.match(IMAGE_HOVER, /duration-\(--duration-morph\)/);
  assert.match(IMAGE_HOVER, /ease-drift/);
  assert.match(IMAGE_HOVER, /motion-safe:group-hover:scale-\[1\.02\]/);
  for (const f of ["catalogTile.js", "shopCategoryGrid.js", "collectionSlider.js"]) {
    const src = read(`src/components/ShopCatalog/${f}`);
    assert.ok(src.includes("IMAGE_HOVER"), `${f} uses the shared image hover`);
    assert.ok(!/group-hover:scale-\[/.test(src), `${f}: no own scale classes`);
  }
  // Brand tiles (Minotti among them) keep their own hover image – no zoom.
  assert.ok(!/scale-/.test(read("src/components/MarkenItems/brandTile.js")));
});

test("grids stagger by column with the shared reveal", () => {
  const cases = [
    ["src/components/ShopCatalog/shopCatalog.js", "reveal-group"],
    ["src/components/ShopCatalog/shopCategoryGrid.js", "reveal-group"],
    ["src/components/ShopCatalog/catalogSearch.js", "reveal-group"],
    ["src/components/MarkenItems/markenitems.js", "reveal-group"],
    ["src/app/[locale]/produkte/[category]/[product]/page.js", "reveal-group"],
    ["src/components/Team/teammember.js", "reveal"],
    ["src/components/Partner/partner.js", "reveal"],
    ["src/components/UberUns/uberuns.js", "reveal"],
  ];
  for (const [f, cls] of cases) {
    const src = read(f);
    assert.ok(src.includes(cls), `${f}: ${cls}`);
    assert.ok(src.includes("style={staggerStyle("), `${f}: staggerStyle`);
  }
});

test("catalogue: progress is scaleX, count arrives, buttons press", () => {
  const src = read("src/components/ShopCatalog/shopCatalog.js");
  assert.ok(/transform: `scaleX\(/.test(src), "progress bar uses transform");
  assert.ok(!/style=\{\{ width: `\$\{\(visibleProducts/.test(src), "no animated width");
  assert.ok(/<span key=\{filteredProducts\.length\} className="ph-arrive">/.test(src));
  assert.ok((src.match(/ph-press /g) || []).length >= 4, "filter, all-filters, chips, show more");
});

test("dialogs open with transform/opacity and stand still under reduced motion", () => {
  const sheet = read("src/components/ShopCatalog/filterSheet.js");
  assert.ok(sheet.includes("starting:open:translate-x-full"));
  assert.ok(sheet.includes("starting:open:backdrop:opacity-0"));
  assert.ok(sheet.includes("motion-reduce:transition-none"));
  const lb = read("src/components/ShopCatalog/productLightbox.js");
  assert.ok(lb.includes("starting:open:opacity-0"));
  assert.ok(lb.includes("motion-reduce:transition-none"));
});
