// Werfthalle 3D, Runde 3 (31.10.2026): shared geometries/materials, stable
// part keys, metre UVs for the plank texture, honest triangle budget.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MODEL_KEYS, buildModel, cameraFor, isRoundedPart, sectionParts, triangleEstimate } from "../../src/lib/yacht/hull.js";
import { createGeometryCache, createMaterialCache, geometryKey, keyedParts } from "../../src/lib/yacht/stageAssets.js";

const read = (f) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");

test("triangle budget counts what is drawn (≤ 120 k, rounded parts 300 each)", () => {
  for (const key of MODEL_KEYS) {
    const model = buildModel(key);
    const cache = createGeometryCache();
    let drawn = 0;
    for (const p of model.parts) {
      const g = cache.get(p);
      drawn += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    }
    const est = triangleEstimate(model);
    assert.ok(est < 120000, `${key} ${est}`);
    // the estimate is within 1 % of the parts as drawn plus hull and deck
    const partsEst = est - triangleEstimate({ parts: [] });
    assert.ok(Math.abs(partsEst - drawn) <= drawn * 0.01, `${key}: estimate ${partsEst} vs drawn ${drawn}`);
    cache.dispose();
  }
});

test("geometry cache: equal sizes share one geometry, far fewer than parts", () => {
  const model = buildModel("motoryacht");
  const cache = createGeometryCache();
  for (const p of model.parts) cache.get(p);
  assert.ok(cache.size < model.parts.length * 0.75, `${cache.size} geometries for ${model.parts.length} parts`);
  const chairs = model.parts.filter((p) => p.mat === "soft0" && p.s[0] === 0.46 && p.s[2] === 0.46);
  assert.ok(chairs.length >= 2);
  assert.equal(cache.get(chairs[0]), cache.get(chairs[1]));
  assert.notEqual(geometryKey({ s: [1, 1, 1], r: 0.04 }), geometryKey({ s: [1, 1, 1], r: 0.2 }));
});

test("metre UVs: the top of a 3.2 m teak sole spans 3.2 texture units along the boat", () => {
  const cache = createGeometryCache();
  const g = cache.get({ s: [3.2, 0.06, 1.2], mat: "teak", r: 0.04 });
  const { uv, normal } = g.attributes;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < uv.count; i++) {
    if (normal.getY(i) > 0.99) {
      lo = Math.min(lo, uv.getX(i));
      hi = Math.max(hi, uv.getX(i));
    }
  }
  // flat top = 3.2 m minus the rounded edges (r = 4 cm) – metres, not 0..1
  assert.ok(hi - lo > 3.2 - 2 * 0.04 - 1e-3 && hi - lo < 3.2 + 1e-3, `${hi - lo}`);
});

test("material cache: one material per id, evening switches in place", () => {
  const mats = createMaterialCache({ palette: ["#112233"], finish: "gelcoat", teak: null });
  const a = mats.get("window");
  mats.setEvening(true);
  assert.equal(mats.get("window"), a);
  assert.equal(a.emissiveIntensity, 1.6);
  assert.ok(mats.get("lamp").emissiveIntensity > 2, "lamp created after the switch glows too");
  mats.setEvening(false);
  assert.equal(a.emissiveIntensity, 0);
  assert.equal(mats.get("soft0").color.getHexString(), "112233");
  assert.ok(mats.get("metal").anisotropy > 0, "brushed metal");
  mats.dispose();
  assert.equal(mats.map.size, 0);
});

test("stable keys: a zone change keeps most parts mounted", () => {
  for (const key of ["daycruiser", "motoryacht", "hausboot"]) {
    const model = buildModel(key);
    const overview = new Set(keyedParts(model, null, false, sectionParts).map((p) => p.key));
    for (const zone of Object.keys(model.cutY)) {
      const parts = keyedParts(model, cameraFor(model, zone).cut, false, sectionParts);
      const keys = parts.map((p) => p.key);
      assert.equal(new Set(keys).size, keys.length, `${key} ${zone}: keys unique`);
      const kept = keys.filter((k) => overview.has(k)).length;
      const uncut = model.parts.filter((p) => !p.cut && !p.steg).length;
      assert.ok(kept >= uncut, `${key} ${zone}: ${kept} kept, ${uncut} uncut parts`);
    }
  }
});

test("Stage3D draws parts from the shared caches, not one drei RoundedBox each", () => {
  const s3 = read("src/components/Yacht/Stage3D.js");
  assert.doesNotMatch(s3, /<RoundedBox/);
  assert.match(s3, /createGeometryCache/);
  assert.match(s3, /dispose=\{null\}/, "shared resources are not disposed per mesh");
  assert.ok(isRoundedPart({ s: [1, 1, 1], r: 0.04 }));
  assert.ok(!isRoundedPart({ s: [1, 0.04, 1], r: 0.04 }));
});
