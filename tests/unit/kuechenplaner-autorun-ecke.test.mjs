// node --test tests/unit/kuechenplaner-autorun-ecke.test.mjs
// Planungslogik Fix 06: Auto-Aufteilung hält die Ecken frei.
// Vorher: U-Form, Wand A 180–410 cm → die Blindecke am Ende von Wand A fiel als
// „unwichtigster Unterschrank“ weg, der Geschirrspüler rutschte in die Ecke hinter
// Wand C → Kollisionsfehler direkt nach dem Ändern einer Wandlänge.
import { test } from "node:test";
import assert from "node:assert/strict";
import { autoRun, defaultPlan, withAutoRuns } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";

const collisions = (plan) => runChecks(plan, buildKitchen(plan)).items.filter((i) => i.level === "error" && !/Gang/.test(i.text));

test("U-Form: Wand A 180–500 cm, Seiten 150–330 cm → keine Kollision aus der Auto-Aufteilung", () => {
  for (let a = 180; a <= 500; a += 10) {
    for (const b of [150, 250, 330]) {
      const p = withAutoRuns({ ...defaultPlan("u"), walls: { a, b, c: b } });
      assert.deepEqual(collisions(p).map((i) => i.text), [], `a=${a} b=${b}: ${p.runs.a.map((m) => m.t + m.w).join(",")}`);
    }
  }
});

test("U-Form 400 cm: Ecke am Ende bleibt Blindecke (90 cm), Spüle und Geschirrspüler bleiben", () => {
  const run = autoRun("u", "a", 400, 60);
  const last = run[run.length - 1];
  assert.equal(last.t, "unterschrank");
  assert.ok(last.w >= 90, JSON.stringify(last));
  assert.ok(run.some((m) => m.t === "spuele") && run.some((m) => m.t === "geschirrspueler"));
  assert.ok(run.reduce((s, m) => s + m.w, 0) <= 400);
});

test("L-Form unverändert: 150 cm → Blindecke + Spüle, 200 cm → LeMans 100", () => {
  assert.deepEqual(autoRun("l", "a", 150, 60).map((m) => [m.t, m.w]), [["unterschrank", 90], ["spuele", 60]]);
  const mid = autoRun("l", "a", 200, 60);
  assert.equal(mid[0].t, "eckschrank");
  assert.equal(mid[0].w, 100);
});

test("Vorlagen unverändert (420 cm)", () => {
  for (const s of ["l", "u"]) assert.deepEqual(withAutoRuns(defaultPlan(s)).runs, defaultPlan(s).runs, s);
  assert.deepEqual(autoRun("u", "a", 420, 60).map((m) => m.w), [120, 60, 60, 60, 120]);
});
