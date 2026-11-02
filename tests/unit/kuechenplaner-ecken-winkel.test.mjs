// node --test tests/unit/kuechenplaner-ecken-winkel.test.mjs
// Planungslogik Fix 01: Ecken mit schiefen Winkeln (freie Raumform).
// Stumpfe Ecken (z. B. 135°) überlappten die Korpusse, spitze Ecken (z. B. 60°)
// ließen den letzten Schrank durch die Nachbarwand ragen – ohne Meldung.
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";
import { cornerClearance, pointInRoom, roomWalls, runExtent, wallClearance } from "../../src/lib/kuechenplaner/room.js";

const near = (a, b, eps = 0.05) => Math.abs(a - b) < eps;

/** Freier Raum mit Ecke `ang` zwischen Wand A und B; A läuft bündig bis in die Ecke. */
function cornerPlan(ang) {
  const p = defaultPlan("frei");
  p.room.poly = [{ l: 420, a: ang }, { l: 400, a: 90 }, { l: 300, a: 90 }];
  p.runs.a = [{ t: "unterschrank", w: 60 }, { t: "unterschrank", w: 60 }, { t: "unterschrank", w: 60 }];
  p.runs.a[0].g = runExtent(p, "a").length - 180;
  p.runs.b = [{ t: "unterschrank", w: 60 }, { t: "unterschrank", w: 60 }];
  p.runs.c = [];
  p.up = { a: { m: "aus", r: [] }, b: { m: "aus", r: [] } };
  return p;
}

test("cornerClearance: 90° = 60, stumpf = 60·sin, spitz = Winkelhalbierende, 180°/Vorsprung = 0", () => {
  assert.ok(near(cornerClearance(90), 60));
  assert.ok(near(cornerClearance(135), 42.43));
  assert.ok(near(cornerClearance(120), 51.96));
  assert.ok(near(cornerClearance(60), 103.92));
  assert.equal(cornerClearance(180), 0);
  assert.equal(cornerClearance(270), 0);
});

test("wallClearance: nur bei spitzen Winkeln, 60° → 34,6 cm, 45° → 60 cm", () => {
  assert.equal(wallClearance(90), 0);
  assert.equal(wallClearance(135), 0);
  assert.ok(near(wallClearance(60), 34.64));
  assert.ok(near(wallClearance(45), 60));
});

test("Stumpfe Ecken 105–170°: bündig geplante Schränke überschneiden sich nicht mehr", () => {
  for (const ang of [105, 120, 135, 150, 170]) {
    const p = cornerPlan(ang);
    const items = runChecks(p, buildKitchen(p)).items;
    assert.ok(!items.some((i) => i.level === "error" && /überschneiden sich/.test(i.text)), `${ang}°`);
  }
});

test("Spitze Ecken: Zeile A endet vor der Wand, kein Schrank ragt aus dem Raum", () => {
  for (const ang of [45, 60, 75]) {
    const p = cornerPlan(ang);
    const wa = roomWalls(p).find((w) => w.id === "a");
    const ext = runExtent(p, "a");
    assert.ok(near(wa.len * 100 - ext.start - ext.length, wallClearance(ang), 0.1), `${ang}°: Ende gekürzt`);
    const k = buildKitchen(p);
    for (const m of k.mods.filter((x) => x.kind !== "upper")) {
      // Ecken minimal nach innen ziehen (Rundung), dann muss jeder Punkt im Raum liegen
      const [cx, cz] = m.quad.reduce(([x, z], q) => [x + q[0] / 4, z + q[1] / 4], [0, 0]);
      for (const [x, z] of m.quad) assert.ok(pointInRoom(p, x + (cx - x) * 0.01, z + (cz - z) * 0.01), `${ang}° ${m.id}`);
    }
  }
});

test("Spitze Ecke ohne Nachbarzeile: Zeile endet trotzdem vor der Wand", () => {
  const p = cornerPlan(60);
  p.runs.b = [];
  const ext = runExtent(p, "a");
  assert.ok(near(4.2 * 100 - ext.length, wallClearance(60), 0.1));
});

test("Rechteck (alle 90°) bleibt unverändert", () => {
  const p = defaultPlan("frei");
  assert.deepEqual(runExtent(p, "a"), { start: 0, length: 420 });
});
