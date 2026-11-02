// QM planer-tools r5: Planausschnitt mit Maßketten nur an den Kettenseiten, Textfaktor,
// Eckbereich in der Wandansicht.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { elevationCornerZones, planViewBox } from "../../src/lib/kuechenplaner/planview.js";
import { scaleFromFontSize } from "../../src/components/Labs/textScale.js";

test("Maßketten-Rand nur an den Seiten mit Ketten (Druck: kein leerer Streifen unter dem Plan)", () => {
  const kitchen = buildKitchen(defaultPlan("l"));
  const plain = planViewBox(kitchen, false);
  const dims = planViewBox(kitchen, true);
  // oben/links stehen die Ketten (Wände A und B) → mehr Rand dort
  assert.ok(dims.minX < plain.minX - 50, `links ${dims.minX} vs ${plain.minX}`);
  assert.ok(dims.minZ < plain.minZ - 50, `oben ${dims.minZ} vs ${plain.minZ}`);
  // unten (offene Raumseite) bleibt der schmale Rand
  const bottomPlain = plain.minZ + plain.h;
  const bottomDims = dims.minZ + dims.h;
  assert.ok(Math.abs(bottomDims - bottomPlain) < 1, `unten ${bottomDims} vs ${bottomPlain}`);
});

test("Textfaktor vergrößert den Kettenrand (200 % Text)", () => {
  const kitchen = buildKitchen(defaultPlan("l"));
  const k1 = planViewBox(kitchen, true, 1);
  const k2 = planViewBox(kitchen, true, 2);
  assert.ok(k2.w > k1.w && k2.h > k1.h);
  // ohne Ketten unverändert
  assert.deepEqual(planViewBox(kitchen, false, 2), planViewBox(kitchen, false, 1));
});

test("scaleFromFontSize: 16px → 1, 32px → 2, Unsinn → 1, gedeckelt", () => {
  assert.equal(scaleFromFontSize("16px"), 1);
  assert.equal(scaleFromFontSize("32px"), 2);
  assert.equal(scaleFromFontSize(""), 1);
  assert.equal(scaleFromFontSize("12px"), 1);
  assert.equal(scaleFromFontSize("80px"), 3);
});

test("Eckbereich: Rückwand ohne Modul am Wandende wird erkannt", () => {
  const parts = [{ id: "b-splash0", local: { u0: 0.012, u1: 3.3 } }];
  const run = [{ x0: 0, x1: 270 }];
  assert.deepEqual(elevationCornerZones(parts, run), [{ x0: 270, w: 60 }]);
  assert.deepEqual(elevationCornerZones(parts, [{ x0: 0, x1: 320 }]), []);
  assert.deepEqual(elevationCornerZones([], run), []);
});

test("Wandansicht L-Form: Wand mit Eck-Rückwand hat genau einen Eckbereich", () => {
  const plan = { ...defaultPlan("l"), splash: "glas" };
  const kitchen = buildKitchen(plan);
  const zones = Object.keys(kitchen.runs).map((w) => {
    const parts = kitchen.parts.filter((p) => p.local?.wall === w && !p.geom);
    return elevationCornerZones(parts, (kitchen.runs[w] || []).filter((m) => m.x1 > m.x0));
  });
  assert.equal(zones.flat().length, 1, JSON.stringify(zones));
  assert.ok(Math.abs(zones.flat()[0].w - 60) < 2);
});

test("Sofaplaner-Karte: ab 140 cm mindestens zwei Plätze (Aston Sofa 167 cm)", async () => {
  const { silhouetteSeats } = await import("../../src/lib/sofaplaner/geometry.js");
  const row = (w) => [{ x: 0, y: 0, w, d: 95, rot: 0 }];
  assert.equal(silhouetteSeats(row(167), 95), 2);
  assert.equal(silhouetteSeats(row(162), 95), 2);
  assert.equal(silhouetteSeats(row(90), 95), 1);
});

test("Bezugskollektion ohne doppelte Angaben", async () => {
  const { coverMeta } = await import("../../src/lib/sofaplaner/covers.js");
  assert.deepEqual(coverMeta({ name: "Stoff", material: "Stoff", category: "Stoffkollektion von Minotti" }), ["Stoffkollektion von Minotti"]);
  assert.deepEqual(coverMeta({ name: "Leder", material: "Leder", category: "Lederkollektion von Minotti" }), ["Lederkollektion von Minotti"]);
  assert.deepEqual(coverMeta({ name: "Kuoio", material: "Leder", category: "Leder" }), ["Leder"]);
  assert.deepEqual(coverMeta({ name: "Ansel", material: "Stoff" }), ["Stoff"]);
});
