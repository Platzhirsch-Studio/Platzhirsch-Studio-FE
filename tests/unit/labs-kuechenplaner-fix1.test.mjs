// node --test tests/unit/labs-kuechenplaner-fix1.test.mjs
// Küchenplaner Fix 1 (QA-Feedback 1): Beispielplanungen ohne Warnung,
// Arbeitsdreieck an einer Wand nur als Hinweis, zugeschnittener Plan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { planViewBox } from "../../src/lib/kuechenplaner/planview.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";

const problems = (plan) => runChecks(plan, buildKitchen(plan)).items.filter((i) => i.level === "error" || i.level === "warn");

test("Beispielplanungen L, Zeile, Zweizeilig, Insel, Halbinsel, frei starten ohne Warnung (P2-1)", () => {
  for (const s of ["l", "zeile", "zweizeilig", "insel", "halbinsel", "frei"]) {
    assert.deepEqual(problems(defaultPlan(s)).map((i) => i.text), [], s);
  }
});

test("Arbeitsdreieck an einer Wand: Hinweis statt Warnung, mit Erklärung", () => {
  const items = runChecks(defaultPlan("zeile"), buildKitchen(defaultPlan("zeile"))).items;
  const tri = items.find((i) => /Arbeitsdreieck:/.test(i.text));
  assert.equal(tri.level, "hint");
  assert.match(tri.text, /geometrisch nicht möglich/);
});

test("Plan-viewBox liegt eng am Inhalt (P1-1)", () => {
  const plan = defaultPlan("l");
  const vb = planViewBox(buildKitchen(plan), false);
  // 420 × 330 cm Raum + je ca. 6 % Rand
  assert.ok(vb.w < 420 + 2 * 30, `Breite ${vb.w}`);
  assert.ok(vb.h < 330 + 2 * 30, `Höhe ${vb.h}`);
  const withDims = planViewBox(buildKitchen(plan), true);
  assert.ok(withDims.w > vb.w);
});
