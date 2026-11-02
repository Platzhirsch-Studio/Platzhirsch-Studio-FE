// tests/unit/labs-dreilaender-geo.test.mjs — R2-labs-service: Trefferflächen der Karte.
// Run: node --test tests/unit/labs-dreilaender-geo.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { PLACES, hitCell } from "../../src/components/Labs/Dreilaender/geo.js";

const pts = (d) => [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
const extent = (d, axis) => {
  const v = pts(d).map((p) => p[axis]);
  return Math.max(...v) - Math.min(...v);
};

test("freistehender Ort: voller Kreis", () => {
  const d = hitCell([100, 100], [[400, 400]], 48);
  assert.ok(Math.abs(extent(d, 0) - 96) < 1);
  assert.ok(Math.abs(extent(d, 1) - 96) < 1);
});

test("zwei nahe Orte teilen sich die Fläche an der Mittelsenkrechten", () => {
  const a = hitCell([100, 100], [[140, 100]], 48);
  const b = hitCell([140, 100], [[100, 100]], 48);
  assert.ok(Math.max(...pts(a).map((p) => p[0])) <= 120.05);
  assert.ok(Math.min(...pts(b).map((p) => p[0])) >= 119.95);
});

test("mobil (Skala 0,5, r = 48): jeder Ort außer Callout-Orten behält ≥ 44 px in jede Achse", () => {
  const neighbours = PLACES.filter((p) => !p.callout).map((p) => p.xy);
  for (const p of PLACES.filter((x) => !x.callout)) {
    const d = hitCell(p.xy, neighbours, 48);
    // 44 px bei Skala 0,5 = 88 Einheiten. R4: Dornbirn ist mobil Callout, damit
    // hat auch Lindau keine Nachbarn mehr unter 2 r Abstand (vorher 80).
    assert.ok(extent(d, 0) >= 88, `${p.id} Breite ${extent(d, 0)}`);
    assert.ok(extent(d, 1) >= 88, `${p.id} Höhe ${extent(d, 1)}`);
  }
});

test("Callout-Orte haben Koordinaten für die mobile Beschriftung", () => {
  const minor = PLACES.filter((p) => p.minor);
  assert.deepEqual(minor.map((p) => p.id).sort(), ["bregenz", "rheintal"]);
  for (const p of minor) assert.ok(p.callout && Number.isFinite(p.callout.x) && Number.isFinite(p.callout.y));
});

test("R4: Callout-Rechtecke (Bregenz, Dornbirn, Rheintal) überlappen sich nicht und liegen in der Karte", () => {
  const H = 92;
  const box = (c) => {
    const w = c.anchor === "middle" ? 116 : 124;
    const x = c.anchor === "middle" ? c.x - w / 2 : c.anchor === "end" ? c.x - w + 16 : c.x - 16;
    return { x, y: c.y - H + 34, w, h: H };
  };
  const callouts = PLACES.filter((p) => p.callout);
  assert.deepEqual(callouts.map((p) => p.id).sort(), ["bregenz", "dornbirn", "rheintal"]);
  const boxes = callouts.map((p) => ({ id: p.id, ...box(p.callout) }));
  for (const b of boxes) {
    assert.ok(b.x >= 0 && b.x + b.w <= 680 + 32 && b.y >= -24 && b.y + b.h <= 560 + 24, b.id);
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      assert.equal(overlap, false, `${a.id} / ${b.id}`);
    }
});
