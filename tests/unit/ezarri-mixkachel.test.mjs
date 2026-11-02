// MixKachel (Kollektionskachel ohne Herstellerbild): Töne gewichtet, Raster deterministisch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mixRaster, mixToene } from "../../src/lib/ezarri/mixRaster.js";

const MIX = [
  { anteil: 70, toene: [["#1f5f8b", 60], ["#2a7ab0", 40]] },
  { anteil: 30, toene: [["#e9f2f7", 100]] },
];

test("mixToene: Anteil × Tongewicht, ungültige Farben fallen weg", () => {
  const t = mixToene([...MIX, { anteil: 10, toene: [["kein-hex", 100]] }]);
  assert.deepEqual(t.map(([h]) => h), ["#1f5f8b", "#2a7ab0", "#e9f2f7"]);
  assert.ok(Math.abs(t[0][1] - 42) < 1e-9);
  assert.ok(Math.abs(t[2][1] - 30) < 1e-9);
  assert.deepEqual(mixToene(null), []);
});

test("mixRaster: deterministisch, nur Töne der Mischung, grob nach Anteil", () => {
  const t = mixToene(MIX);
  const a = mixRaster(t, 216);
  assert.equal(a.length, 216);
  assert.deepEqual(a, mixRaster(t, 216));
  assert.ok(a.every((h) => ["#1f5f8b", "#2a7ab0", "#e9f2f7"].includes(h)));
  const hell = a.filter((h) => h === "#e9f2f7").length / a.length;
  assert.ok(hell > 0.15 && hell < 0.45, `Anteil hell ${hell}`);
  assert.deepEqual(mixRaster([], 10), []);
});
