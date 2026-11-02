// node --test tests/unit/kuechenplaner-3d-quality.test.mjs
// 3D-Qualitätsstufen: Startstufe nach Gerät, Herunterregeln nur bei echtem Ruckeln.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TIERS, createFrameBudget, initialTier } from "../../src/components/Labs/Kuechenplaner/sceneQuality.js";

test("Startstufe: Desktop hoch, Touch/schmal mittel, Daten sparen sparsam", () => {
  assert.equal(initialTier({ coarse: false, width: 1440, cores: 8 }), 2);
  assert.equal(initialTier({ coarse: true, width: 390 }), 1);
  assert.equal(initialTier({ width: 700 }), 1);
  assert.equal(initialTier({ cores: 2 }), 1);
  assert.equal(initialTier({ saveData: true }), 0);
  assert.equal(TIERS[2].ao, true);
  assert.equal(TIERS[1].ao, false);
});

test("Wächter: 60 fps bleibt, 25 fps regelt herunter, Pausen zählen nicht", () => {
  const run = (dt, frames, push = createFrameBudget()) => {
    let t = 0;
    let down = false;
    for (let i = 0; i <= frames; i++) {
      t += dt;
      down = push(t) || down;
    }
    return down;
  };
  assert.equal(run(16.7, 200), false);
  assert.equal(run(40, 60), true);
  // ruhende Szene: ein Bild alle 2 s → nie herunterregeln
  assert.equal(run(2000, 100), false);
});
