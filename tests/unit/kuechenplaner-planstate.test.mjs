// Rundlauftest für den Teilen-Link (QA Runde 1, P1-1).
//   node --test tests/unit/kuechenplaner-planstate.test.mjs
// (code-tests Fix 06: lag unter src/ und lief deshalb nicht mit `npm run test:unit` – der
// einzige Test für alte v1-Links. Hierher verschoben, Inhalt unverändert.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodePlan, defaultPlan, encodePlan, switchRaster } from "../../src/components/Labs/Kuechenplaner/planState.js";

const SHAPES = ["zeile", "l", "u", "insel"];

for (const raster of [60, 55]) {
  for (const shape of SHAPES) {
    test(`Rundlauf ${shape} im ${raster}-cm-Raster`, () => {
      const plan = switchRaster(defaultPlan(shape), raster);
      const back = decodePlan(encodePlan(plan));
      assert.ok(back, "decodePlan liefert null");
      assert.deepEqual(back, plan);
    });
  }
}

test("55er-Breiten mit Nachkommastellen (27,5 / 41,25 / 82,5) bleiben erhalten", () => {
  const plan = switchRaster(defaultPlan("l"), 55);
  plan.runs.a = [
    { t: "unterschrank", w: 27.5 },
    { t: "unterschrank", w: 41.25 },
    { t: "kochfeld", w: 82.5 },
  ];
  const code = encodePlan(plan);
  const raw = JSON.parse(Buffer.from(code, "base64url").toString());
  assert.equal(raw.v, 2);
  assert.match(raw.runs.a, /^[a-z]\d+(\.[a-z]\d+)*$/); // jedes Modul = Buchstabe + Ganzzahl
  assert.equal(raw.runs.a, "u2750.u4125.k8250");
  assert.deepEqual(decodePlan(code).runs.a, plan.runs.a);
});

test("alte v1-Links (Breite in cm mit Dezimalpunkt) werden weiter gelesen", () => {
  const plan = switchRaster(defaultPlan("u"), 55);
  const v1 = (p) => {
    const runs = {};
    for (const w of ["a", "b", "c"]) runs[w] = p.runs[w].map((m) => `${{ unterschrank: "u", spuele: "s", geschirrspueler: "g", kochfeld: "k", hochschrank: "h", backofen: "o", kuehlschrank: "f" }[m.t]}${m.w}`).join(".");
    return Buffer.from(JSON.stringify({ ...p, runs })).toString("base64url");
  };
  assert.deepEqual(decodePlan(v1(plan)), plan);
  const p60 = defaultPlan("insel");
  assert.deepEqual(decodePlan(v1(p60)), p60);
});

test("Müll liefert null statt Exception", () => {
  assert.equal(decodePlan("%%%"), null);
  assert.equal(decodePlan("abc"), null);
  assert.equal(decodePlan(Buffer.from('{"v":2,"runs":{"a":"x12"}}').toString("base64url")), null);
});
