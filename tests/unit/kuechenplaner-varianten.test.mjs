// node --test tests/unit/kuechenplaner-varianten.test.mjs
// Küchenplaner Feinschliff (QA-Feedback 2, P3-9): Kennzahlen und Vergleich A/B.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodePlan, defaultPlan, encodePlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";
import { compareRows, moduleDiff, planMetrics } from "../../src/lib/kuechenplaner/compare.js";

const metrics = (plan, price = null) => {
  const k = buildKitchen(plan);
  return planMetrics(plan, k, runChecks(plan, k), price);
};

test("gleiche Planung: keine Unterschiede, keine Deltas", () => {
  const m = metrics(defaultPlan("l"));
  const rows = compareRows(m, metrics(defaultPlan("l")));
  assert.equal(rows.filter((r) => r.diff).length, 0);
  assert.ok(rows.every((r) => r.delta === ""));
  assert.deepEqual(moduleDiff(m, m), { onlyA: [], onlyB: [] });
});

test("L-Form gegen Insel: Form, Fläche und Stauraum mit Delta B gegenüber A", () => {
  const a = metrics(defaultPlan("l"));
  const b = metrics(defaultPlan("insel"));
  const rows = Object.fromEntries(compareRows(a, b).map((r) => [r.key, r]));
  assert.equal(rows.shape.diff, true);
  assert.equal(rows.shape.a, "L-Form");
  assert.equal(rows.worktop.diff, true);
  assert.match(rows.worktop.delta, /^[+−]\d/);
  // Delta-Vorzeichen stimmt mit den Zahlen überein
  const sign = b.worktop - a.worktop > 0 ? "+" : "−";
  assert.ok(rows.worktop.delta.startsWith(sign));
  assert.ok(a.worktopFree <= a.worktop);
  const d = moduleDiff(a, b);
  assert.ok(d.onlyA.length + d.onlyB.length > 0);
});

test("Geräte in anderer Reihenfolge gelten nicht als Unterschied", () => {
  const p = defaultPlan("zeile");
  const q = { ...p, runs: { ...p.runs, a: [...p.runs.a].reverse() } };
  const rows = Object.fromEntries(compareRows(metrics(p), metrics(q)).map((r) => [r.key, r]));
  assert.equal(rows.appliances.diff, false);
});

test("Material-Unterschied wird erkannt, Preis nur bei freigegebenem Rahmen", () => {
  const p = defaultPlan("l");
  const q = { ...p, topT: p.topT === 20 ? 30 : 20 };
  const rows = compareRows(metrics(p), metrics(q));
  assert.ok(rows.find((r) => r.key === "worktopMat").diff);
  assert.equal(rows.some((r) => r.key === "price"), false);
  const hidden = { min: 1, max: 2, visible: false };
  assert.equal(compareRows(metrics(p, hidden), metrics(q, hidden)).some((r) => r.key === "price"), false);
  const rowsP = compareRows(metrics(p, { min: 10000, max: 14000, visible: true }), metrics(q, { min: 11000, max: 15000, visible: true }));
  const pr = rowsP.find((r) => r.key === "price");
  assert.ok(pr && pr.diff);
  assert.match(pr.delta, /^\+/);
});

test("Merkplatz-Code bleibt beim Öffnen stabil (Kennzeichnung „Im Planer geöffnet“)", () => {
  for (const shape of ["l", "u", "insel", "frei"]) {
    const k = encodePlan(defaultPlan(shape));
    assert.equal(encodePlan(decodePlan(k)), k, shape);
  }
});

// ---- Fix 3 (QA Feinschliff Restliste) ----
import { openVariant, parseSlots } from "../../src/lib/kuechenplaner/variants.js";

test("P3-1: Haubenschrank zählt als Modul, aber nicht als Hängeschrank-Stauraum", () => {
  const p = defaultPlan("zeile");
  const withHood = { ...p, up: { a: { m: "frei", r: [{ t: "haengeschrank", w: 60 }, { t: "luefterhs", w: 60 }] } } };
  const onlyCab = { ...p, up: { a: { m: "frei", r: [{ t: "haengeschrank", w: 60 }] } } };
  const mh = metrics(withHood);
  const mc = metrics(onlyCab);
  assert.ok(buildKitchen(withHood).mods.some((m) => m.t === "luefterhs"), "Haubenschrank gebaut");
  assert.equal(mh.storeUpper, mc.storeUpper);
  assert.equal(mh.modules, mc.modules + 1);
  const row = compareRows(mh, mc).find((r) => r.key === "storeUpper");
  assert.equal(row.label, "Hängeschränke (Stauraum)");
});

test("P3-2: Zahl und Einheit mit geschütztem Leerzeichen (auch Delta, Raum, Plattenstärke)", () => {
  const rows = Object.fromEntries(compareRows(metrics(defaultPlan("l")), metrics(defaultPlan("u"))).map((r) => [r.key, r]));
  assert.match(rows.worktop.a, /\d cm$/);
  assert.match(rows.worktop.delta, /^[+−]\d+ cm$/);
  assert.match(rows.worktopMat.a, /\d mm$/);
  assert.match(rows.room.a, /^A \d/);
  assert.match(rows.room.a, /\d cm$/);
  assert.ok(!/\d cm|\d mm/.test(Object.values(rows).map((r) => r.a + r.b + r.delta).join("|")), "kein normales Leerzeichen vor Einheiten");
});

test("P2-3: Öffnen aus dem Live-Zustand merkt die aktuelle Planung zuerst auf der Gegenseite", () => {
  const A = encodePlan(defaultPlan("l"));
  const U = encodePlan(defaultPlan("u"));
  const r = openVariant({ a: { k: A, at: 1 }, b: null }, "a", U, 5);
  assert.equal(r.kept, "b");
  assert.deepEqual(r.slots.b, { k: U, at: 5 });
  assert.deepEqual(r.slots.a, { k: A, at: 1 });
  // Nur B gemerkt → A öffnen geht nicht (leer), B öffnen merkt live als A
  assert.equal(openVariant({ a: null, b: { k: A, at: 1 } }, "b", U, 7).kept, "a");
  // Aktuelle Planung = Ziel → nichts doppelt merken
  assert.equal(openVariant({ a: { k: A, at: 1 }, b: null }, "a", A).kept, null);
  // Beide gemerkt → nichts überschreiben
  const both = { a: { k: A, at: 1 }, b: { k: U, at: 2 } };
  const r2 = openVariant(both, "a", encodePlan(defaultPlan("insel")));
  assert.equal(r2.kept, null);
  assert.equal(r2.slots, both);
  assert.equal(openVariant({ a: null, b: null }, "a", U).kept, null);
});

test("P3-5: parseSlots ist robust und liefert nur gültige Merkplätze", () => {
  assert.deepEqual(parseSlots('{"a":{"k":"kaputt!!"},"b":42}'), { a: null, b: null });
  assert.deepEqual(parseSlots("nicht json"), { a: null, b: null });
  assert.deepEqual(parseSlots('{"a":{"k":"x","at":3,"z":1}}'), { a: { k: "x", at: 3 }, b: null });
  assert.deepEqual(parseSlots({ b: { k: "y", at: 4 } }), { a: null, b: { k: "y", at: 4 } });
});
