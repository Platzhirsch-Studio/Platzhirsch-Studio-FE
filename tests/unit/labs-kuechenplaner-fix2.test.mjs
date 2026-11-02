// node --test tests/unit/labs-kuechenplaner-fix2.test.mjs
// Küchenplaner Fix 2 (QA-Feedback 2): U-Vorlage ohne Hinweis, Geschirrspüler-Regel,
// fehlende Spüle/Kochfeld, Auto-Belegung behält Geräte, Drop in volle Zeile
// (Ersetzen), Zoom-Ziel ohne Auswahl.
import { test } from "node:test";
import assert from "node:assert/strict";
import { autoRun, defaultPlan, presetAppliances, runLength, withAutoRuns } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";
import { dropTarget, insertModule, placeRun, replaceModule } from "../../src/lib/kuechenplaner/layout.js";
import { planViewBox, zoomBox, zoomFocus } from "../../src/lib/kuechenplaner/planview.js";

const items = (plan) => runChecks(plan, buildKitchen(plan)).items;
const problems = (plan) => items(plan).filter((i) => i.level === "warn" || i.level === "error");

test("P2-4: alle Vorlagen (auch U) starten ohne Hinweis und Kollision", () => {
  for (const shape of ["zeile", "l", "u", "zweizeilig", "insel", "halbinsel", "frei"]) {
    assert.deepEqual(problems(defaultPlan(shape)).map((i) => i.text), [], shape);
  }
});

test("P2-4: Geschirrspüler weit weg von der Spüle → Hinweis (warn), ein Modul Abstand → Tipp", () => {
  const plan = defaultPlan("zeile");
  // kueh, back, US, SP, GS, KF, US → GS ans Ende: zwei Module Abstand
  const run = plan.runs.a;
  const far = { ...plan, runs: { ...plan.runs, a: [run[0], run[1], run[2], run[3], run[5], run[6], run[4]] } };
  assert.ok(items(far).some((i) => i.level === "warn" && /Geschirrspüler nicht neben/.test(i.text)));
  const one = { ...plan, runs: { ...plan.runs, a: [run[0], run[1], run[2], run[3], run[5], run[4], run[6]] } };
  const it = items(one).find((i) => /Geschirrspüler/.test(i.text));
  assert.equal(it.level, "hint");
  assert.ok(items(plan).some((i) => i.level === "ok" && /Geschirrspüler direkt neben/.test(i.text)));
});

test("P2-6: keine Spüle bzw. kein Kochfeld → Hinweis", () => {
  const plan = defaultPlan("zeile");
  const noSink = { ...plan, runs: { ...plan.runs, a: plan.runs.a.filter((m) => m.t !== "spuele") } };
  assert.ok(items(noSink).some((i) => i.level === "warn" && /Keine Spüle geplant/.test(i.text)));
  const noHob = { ...plan, runs: { ...plan.runs, a: plan.runs.a.filter((m) => m.t !== "kochfeld") } };
  assert.ok(items(noHob).some((i) => i.level === "warn" && /Kein Kochfeld geplant/.test(i.text)));
});

test("P2-6: Wand A auf 150 cm → Spüle bleibt (Blindecke statt Eckschrank), Geschirrspüler fällt weg", () => {
  const p = defaultPlan("l");
  const small = withAutoRuns({ ...p, walls: { ...p.walls, a: 150 } }, ["a", "b"]);
  const types = small.runs.a.map((m) => m.t);
  assert.ok(types.includes("spuele"), types.join());
  assert.ok(!types.includes("geschirrspueler"));
  assert.ok(!problems(small).some((i) => i.level === "error"), "keine Kollision");
  const lost = presetAppliances("l", "a").filter((t) => !types.includes(t));
  assert.deepEqual(lost.sort(), ["eckschrank", "geschirrspueler"]);
  // 250 cm: alles passt wie in der Vorlage
  const ok = autoRun("l", "a", 250, 60).map((m) => m.t);
  assert.deepEqual(ok.slice(0, 3), ["eckschrank", "spuele", "geschirrspueler"]);
  // 200 cm: Eckschrank auf 100 cm (LeMans), Spüle bleibt
  const mid = autoRun("l", "a", 200, 60);
  assert.equal(mid[0].t, "eckschrank");
  assert.equal(mid[0].w, 100);
  assert.ok(mid.some((m) => m.t === "spuele"));
  assert.ok(runLength(small, "a") >= 0);
});

test("P2-7: volle Zeile → kein Einfügen, Modul gleicher Breite unter dem Zeiger → ersetzen", () => {
  const plan = defaultPlan("l");
  const placed = placeRun(plan.runs.a, 0);
  const us = placed.find((m) => m.t === "unterschrank" && m.w === 60);
  const at = (us.x0 + us.x1) / 2;
  const r = dropTarget(plan, "a", 60, at - 30, at);
  assert.equal(r.type, "replace");
  assert.equal(r.i, us.i);
  const next = replaceModule(plan, "a", r.i, { t: "kuehlschrank", w: 60 });
  assert.equal(next.runs.a.length, plan.runs.a.length);
  assert.equal(next.runs.a[r.i].t, "kuehlschrank");
  // Breite passt nicht → "full", nichts wird geändert
  const full = dropTarget(plan, "a", 90, at - 45, at);
  assert.equal(full.type, "full");
  // Freier Platz → "insert" wie bisher
  const short = { ...plan, runs: { ...plan.runs, a: plan.runs.a.slice(0, 2) } };
  assert.equal(dropTarget(short, "a", 60, 300, 330).type, "insert");
  assert.equal(insertModule(short, "a", { t: "unterschrank", w: 60 }, 300).runs.a.length, 3);
});

test("P2-2: Zoom ohne Auswahl zielt auf Module, nicht auf den leeren Raum", () => {
  const plan = defaultPlan("l");
  const k = buildKitchen(plan);
  const vb = planViewBox(k, false);
  const c = zoomFocus(k.mods, vb, 2);
  assert.ok(c);
  const box = zoomBox(vb, 2, c);
  const inBox = k.mods.filter((m) => m.kind !== "upper").filter((m) => {
    const x = ((m.quad[0][0] + m.quad[2][0]) / 2) * 100;
    const z = ((m.quad[0][1] + m.quad[2][1]) / 2) * 100;
    return x >= box.minX && x <= box.minX + box.w && z >= box.minZ && z <= box.minZ + box.h;
  });
  assert.ok(inBox.length >= 4, `nur ${inBox.length} Module im Ausschnitt`);
  // Raummitte (alter Stand) zeigt deutlich weniger
  const mid = zoomBox(vb, 2, [vb.minX + vb.w / 2, vb.minZ + vb.h / 2]);
  const inMid = k.mods.filter((m) => m.kind !== "upper").filter((m) => {
    const x = ((m.quad[0][0] + m.quad[2][0]) / 2) * 100;
    const z = ((m.quad[0][1] + m.quad[2][1]) / 2) * 100;
    return x >= mid.minX && x <= mid.minX + mid.w && z >= mid.minZ && z <= mid.minZ + mid.h;
  });
  assert.ok(inBox.length > inMid.length);
});
