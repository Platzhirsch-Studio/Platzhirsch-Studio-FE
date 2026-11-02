// node --test tests/unit/kuechenplaner-code-schema.test.mjs
// code-tests Fix 01: Das Plan-Schema nimmt alles an, was der Planer erzeugen kann
// (Katalogbreiten, lange Zeilen), und lehnt ab, was der Teilen-Link nicht kodieren kann.
import { test } from "node:test";
import assert from "node:assert/strict";
import { MODULES, moduleWidths } from "../../src/components/Labs/Kuechenplaner/catalog.js";
import { decodePlan, defaultPlan, encodePlan, planSchema, switchRaster } from "../../src/components/Labs/Kuechenplaner/planState.js";

test("Schema: alle Katalogbreiten (beide Raster) sind gültig", () => {
  for (const raster of [60, 55]) {
    for (const t of Object.keys(MODULES)) {
      for (const w of moduleWidths(t, raster)) {
        const plan = switchRaster(defaultPlan("l"), raster);
        if (MODULES[t].kind === "upper") plan.up = { a: { m: "frei", r: [{ t, w }] } };
        else plan.runs.a = [{ t, w }];
        const r = planSchema.safeParse(plan);
        assert.ok(r.success, `${t} ${w} cm (Raster ${raster}): ${r.error?.issues?.[0]?.message}`);
      }
    }
  }
});

test("Schema: Wandbord 180 cm übersteht den Teilen-Link", () => {
  const plan = defaultPlan("l");
  plan.up = { a: { m: "frei", r: [{ t: "wandbord", w: 180 }] } };
  const back = decodePlan(encodePlan(plan));
  assert.ok(back, "decodePlan liefert null");
  assert.deepEqual(back.up.a.r, plan.up.a.r);
});

test("Schema: 26 Module an einer 800-cm-Wand – Rundlauf, Link unter 8000 Zeichen", () => {
  const plan = defaultPlan("zeile");
  plan.walls.a = 800;
  plan.runs.a = Array.from({ length: 26 }, () => ({ t: "unterschrank", w: 30 }));
  const code = encodePlan(plan);
  assert.ok(code.length < 8000, `Link ${code.length} Zeichen`);
  const back = decodePlan(code);
  assert.ok(back, "decodePlan liefert null");
  assert.equal(back.runs.a.length, 26);
});

const withOpt = (o) => {
  const plan = defaultPlan("zeile");
  plan.runs.a = [{ t: "unterschrank", w: 60, o }];
  return plan;
};

test("Schema: Optionen mit Zeichen außerhalb a–z/0–9 werden abgelehnt", () => {
  for (const o of ["f3.x", "<b>", "f3~m", "F3", ""]) assert.equal(planSchema.safeParse(withOpt(o)).success, false, JSON.stringify(o));
});

test("Schema: alle Katalog-Optionen bleiben gültig", () => {
  for (const [t, m] of Object.entries(MODULES)) {
    for (const [k, def] of Object.entries(m.opts || {})) {
      for (const v of Object.keys(def.values)) {
        assert.equal(planSchema.safeParse(withOpt(k + v)).success, true, `${t}: ${k}${v}`);
      }
    }
  }
});
