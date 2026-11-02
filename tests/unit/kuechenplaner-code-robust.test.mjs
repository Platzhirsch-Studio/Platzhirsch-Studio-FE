// node --test tests/unit/kuechenplaner-code-robust.test.mjs
// code-tests Fix 05: Sicherheitsnetz für Zustand und Teilen-Link.
// - Zufallspläne (fester Seed, alle schema-gültig) → Geometrie, Prüfung, Preis, Stückliste,
//   Zusammenfassung werfen nie, Maße bleiben endlich, Link-Rundlauf ist verlustfrei.
// - decodePlan liefert bei Müll immer null, nie eine Exception.
// - Verlauf: Obergrenze, Zusammenfassen gleicher Gruppen, Redo-Liste nach neuer Änderung leer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES, OPENINGS, PRICE_TABLE, SHAPES } from "../../src/components/Labs/Kuechenplaner/catalog.js";
import { decodePlan, defaultPlan, encodePlan, planSchema } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { priceRange, summaryLines } from "../../src/components/Labs/Kuechenplaner/pricing.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";
import { buildBom } from "../../src/lib/kuechenplaner/bom.js";
import { RUN_KEYS, WALL_IDS } from "../../src/lib/kuechenplaner/room.js";
import { HISTORY_LIMIT, historyReducer, initHistory } from "../../src/lib/kuechenplaner/history.js";

function rng(seed) {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

function randomPlan(rnd) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const types = Object.keys(MODULES);
  const p = defaultPlan(pick(Object.keys(SHAPES)));
  if (rnd() < 0.5) p.raster = 55;
  if (p.shape === "frei" || rnd() < 0.2) {
    p.room.poly = Array.from({ length: 2 + Math.floor(rnd() * 6) }, () => ({ l: 40 + Math.round(rnd() * 1160), a: pick([45, 90, 90, 135, 180, 225, 270]) }));
  }
  p.walls = { a: 150 + Math.round(rnd() * 650), b: 150 + Math.round(rnd() * 650), c: 150 + Math.round(rnd() * 650) };
  for (const k of RUN_KEYS) {
    if (rnd() < 0.4) p.runs[k] = Array.from({ length: Math.floor(rnd() * 24) }, () => ({ t: pick(types), w: 1 + Math.round(rnd() * 1290) / 10, ...(rnd() < 0.2 ? { g: Math.round(rnd() * 1200) } : {}) }));
  }
  for (const w of WALL_IDS) if (rnd() < 0.15) p.up[w] = { m: pick(["auto", "frei", "aus"]), r: rnd() < 0.5 ? [{ t: pick(types), w: 60 }] : [] };
  if (rnd() < 0.3) {
    p.room.op = Array.from({ length: Math.floor(rnd() * 5) }, () => ({ k: pick(Object.keys(OPENINGS)), w: pick(WALL_IDS), x: Math.round(rnd() * 1200), b: 1 + Math.round(rnd() * 399), y: Math.round(rnd() * 320), h: 1 + Math.round(rnd() * 319) }));
  }
  if (rnd() < 0.3) p.room.slope = { w: pick(["", ...WALL_IDS]), k: 60 + Math.round(rnd() * 190), d: 15 + Math.round(rnd() * 45) };
  p.island = { ...p.island, len: 120 + Math.round(rnd() * 280), x: -200 + Math.round(rnd() * 400) };
  return p;
}

test("Zufallspläne: Berechnung wirft nie, Maße endlich, Link-Rundlauf verlustfrei", () => {
  const rnd = rng(42);
  let checked = 0;
  for (let n = 0; n < 400; n++) {
    const parsed = planSchema.safeParse(randomPlan(rnd));
    if (!parsed.success) continue;
    const plan = parsed.data;
    const kitchen = buildKitchen(plan);
    const checks = runChecks(plan, kitchen);
    priceRange(plan, PRICE_TABLE, kitchen);
    buildBom(plan, kitchen);
    summaryLines(plan);
    assert.ok(Array.isArray(checks.items));
    for (const m of kitchen.mods || []) {
      for (const k of ["x", "y", "z", "w", "h", "d"]) if (m[k] !== undefined) assert.ok(Number.isFinite(m[k]), `${plan.shape}: ${m.t}.${k} = ${m[k]}`);
    }
    assert.deepEqual(decodePlan(encodePlan(plan)), plan, `Rundlauf ${plan.shape}`);
    checked++;
  }
  assert.ok(checked > 300, `nur ${checked} gültige Zufallspläne`);
});

test("decodePlan: Müll → null, nie eine Exception", () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const good = JSON.parse(Buffer.from(encodePlan(defaultPlan("l")), "base64url").toString());
  const cases = [undefined, null, 42, "", "!!!", "A".repeat(8001), b64(null), b64([1, 2]), b64("text"), b64({ v: 2 }), b64({ ...good, v: 3 }), b64({ ...good, runs: { a: "zz999" } }), b64({ ...good, up: { a: { m: "kaputt", r: "" } } })];
  for (const c of cases) assert.equal(decodePlan(c), null, String(c).slice(0, 40));
  const proto = decodePlan(b64({ ...good, ["__proto__"]: { polluted: 1 } }));
  assert.equal(({}).polluted, undefined, "kein Prototype-Pollution");
  assert.equal(proto?.polluted, undefined, "unbekannte Felder werden entfernt");
});

test("Verlauf: Obergrenze, Gruppen, Redo-Liste", () => {
  let h = initHistory({ n: 0 });
  for (let i = 1; i <= HISTORY_LIMIT + 20; i++) h = historyReducer(h, { type: "set", update: { n: i }, now: i * 1000 });
  assert.equal(h.past.length, HISTORY_LIMIT);
  let g = initHistory({ n: 0 });
  g = historyReducer(g, { type: "set", update: { n: 1 }, group: "wand", now: 1000 });
  g = historyReducer(g, { type: "set", update: { n: 2 }, group: "wand", now: 1500 });
  assert.equal(g.past.length, 1, "Schieberegler innerhalb 800 ms = ein Schritt");
  g = historyReducer(g, { type: "set", update: { n: 3 }, group: "wand", now: 2600 });
  assert.equal(g.past.length, 2, "nach Pause neuer Schritt");
  g = historyReducer(g, { type: "undo" });
  assert.equal(g.present.n, 2);
  assert.equal(g.future.length, 1);
  g = historyReducer(g, { type: "set", update: { n: 9 } });
  assert.equal(g.future.length, 0, "neue Änderung leert Wiederholen");
  const same = historyReducer(g, { type: "set", update: (p) => p });
  assert.equal(same, g, "unveränderter Plan erzeugt keinen Schritt");
});
