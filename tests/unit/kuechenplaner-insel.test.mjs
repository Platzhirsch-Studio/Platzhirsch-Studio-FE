// node --test tests/unit/kuechenplaner-insel.test.mjs
// Planungslogik Fix 05: Insel-Regeln.
// Vorher ohne Meldung: Insel 80 tief mit 30 Überstand (Korpus 50 cm, Kochfeld ragt
// über die Plattenkante), Kochfeld ohne Überstand direkt an der Sitzseite (5 cm Platte
// dahinter), Insel seitlich über die Raumbreite hinausgeschoben.
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";
import { RULES } from "../../src/lib/kuechenplaner/norms.js";

const items = (plan) => runChecks(plan, buildKitchen(plan)).items;
const has = (plan, level, re) => items(plan).some((i) => i.level === level && re.test(i.text));
const island = (patch) => {
  const p = defaultPlan("insel");
  p.island = { ...p.island, ...patch };
  return p;
};

test("Vorgabe Insel: keine der neuen Meldungen", () => {
  const p = defaultPlan("insel");
  assert.ok(!has(p, "warn", /Korpustiefe|Hinter dem Kochfeld|seitlich über/));
  assert.ok(!has(defaultPlan("halbinsel"), "warn", /seitlich über/));
});

test("Insel 80 tief, 30 Überstand → Korpus 50 cm zu flach für das Kochfeld", () => {
  assert.ok(has(island({ depth: 80, over: 30 }), "warn", /nur 50 cm Korpustiefe/));
  assert.ok(!has(island({ depth: 90, over: 30 }), "warn", /Korpustiefe/));
  assert.ok(!has(island({ depth: 80, over: 30, fn: "keine" }), "warn", /Korpustiefe/), "ohne Gerät kein Hinweis");
});

test("Kochfeld auf der Insel ohne Überstand → zu wenig Platte dahinter (NKBA 23 cm)", () => {
  assert.ok(RULES.islandBehindHob.source?.url);
  assert.ok(has(island({ over: 0 }), "warn", /Hinter dem Kochfeld bleiben 5 cm Platte/));
  assert.ok(!has(island({ over: 20 }), "warn", /Hinter dem Kochfeld/));
  assert.ok(!has(island({ over: 0, bar: true }), "warn", /Hinter dem Kochfeld/), "Barplatte als Aufkantung");
  assert.ok(!has(island({ over: 0, fn: "spuele" }), "warn", /Hinter dem Kochfeld/), "nur beim Kochfeld");
});

test("Insel seitlich über die Raumbreite geschoben → Hinweis", () => {
  assert.ok(has(island({ x: 200, len: 300 }), "warn", /Insel ragt 140 cm seitlich/));
  assert.ok(!has(island({ x: 0, len: 300 }), "warn", /seitlich über/));
  const h = defaultPlan("halbinsel");
  h.island = { ...h.island, len: 400 };
  h.walls = { ...h.walls, a: 300 };
  assert.ok(has(h, "warn", /Halbinsel ragt 100 cm seitlich/));
});
