// node --test tests/unit/kuechenplaner-abzug.test.mjs
// Planungslogik Fix 02: Dunstabzug wird so geprüft, wie er gebaut wird.
// Vorher meldete die Prüfung immer „Haube … 65 cm“ als ok – auch bei Muldenlüfter,
// bei Wandhaube auf der Insel, bei Fenster über dem Kochfeld (keine Haube gebaut)
// und bei einem frei gesetzten Hängeschrank 55 cm über einem Gaskochfeld.
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";
import { placeRun } from "../../src/lib/kuechenplaner/layout.js";

const items = (plan) => runChecks(plan, buildKitchen(plan)).items;
const has = (plan, level, re) => items(plan).some((i) => i.level === level && re.test(i.text));
const hobAt = (plan, wall = "a") => placeRun(plan.runs[wall]).find((m) => m.t === "kochfeld");
const setHob = (plan, o, wall = "a") => (plan.runs[wall] = plan.runs[wall].map((m) => (m.t === "kochfeld" ? { ...m, o } : m)));

test("Vorgabe Zeile: Flachschirm im Haubenschrank, Unterkante gemessen (65 cm), keine neuen Fehler", () => {
  const p = defaultPlan("zeile");
  assert.ok(has(p, "ok", /Haube über Kochfeld .*Unterkante 65 cm/));
  for (const s of ["zeile", "l", "u", "zweizeilig", "insel", "halbinsel", "frei"]) {
    assert.ok(!items(defaultPlan(s)).some((i) => i.level === "error"), s);
  }
});

test("Hängeschränke 70 cm über der Platte: Haubentext nennt 70 cm statt fest 65 cm", () => {
  const p = defaultPlan("zeile");
  p.ergo = { ...p.ergo, upGap: 70 };
  assert.ok(has(p, "ok", /Unterkante 70 cm/));
});

test("Insel-Vorgabe: Muldenlüfter wird als Muldenlüfter gemeldet, nicht als Haube", () => {
  const p = defaultPlan("insel");
  assert.ok(has(p, "ok", /Muldenlüfter bei Kochfeld \(Insel/));
  assert.ok(!items(p).some((i) => /Haube über Kochfeld \(Insel/.test(i.text)));
});

test("Wandhaube oder Flachschirm auf der Insel → Fehler", () => {
  for (const o of ["aw", "af"]) {
    const p = defaultPlan("insel");
    p.runs.i = [{ t: "unterschrank", w: 60 }, { t: "kochfeld", w: 90, o }, { t: "unterschrank", w: 60 }];
    assert.ok(has(p, "error", /auf der Insel nicht möglich/), o);
  }
});

test("Fenster über dem Kochfeld mit Abzug automatisch → Fehler statt stiller fehlender Haube", () => {
  const p = defaultPlan("zeile");
  const k = hobAt(p);
  p.room.op = [{ k: "fenster", w: "a", x: k.x0 - 20, b: 100, y: 100, h: 120 }];
  assert.ok(has(p, "error", /Fenster – dort passt keine Flachschirmhaube/));
  setHob(p, "am");
  assert.ok(!has(p, "error", /Flachschirmhaube/), "Muldenlüfter unter dem Fenster geht");
});

test("Flachschirm gewählt, aber keine Hängeschränke an der Wand → Hinweis", () => {
  const p = defaultPlan("zeile");
  setHob(p, "af");
  p.up = { a: { m: "aus", r: [] } };
  assert.ok(has(p, "warn", /Kein Haubenschrank darüber/));
});

test("Inselhaube an der Wand → Hinweis", () => {
  const p = defaultPlan("zeile");
  setHob(p, "ai");
  assert.ok(has(p, "warn", /Inselhaube an der Wand/));
});

test("Frei gesetzter Hängeschrank 55 cm über Gaskochfeld → Hinweis; Haubenschrank nicht", () => {
  const p = defaultPlan("zeile");
  setHob(p, "kgam");
  const k = hobAt(p);
  p.up = { a: { m: "frei", r: [{ t: "haengeschrank", w: 60, g: k.x0 }] } };
  assert.ok(has(p, "warn", /Hängeschrank \(Wand A\) hängt nur 55 cm über Kochfeld/));
  p.up = { a: { m: "frei", r: [{ t: "luefterhs", w: 60, g: k.x0 }] } };
  setHob(p, "kg");
  assert.ok(!has(p, "warn", /hängt nur/));
  assert.ok(has(p, "ok", /Haube über Kochfeld .*Unterkante 65 cm .*mindestens 65 cm/));
});
