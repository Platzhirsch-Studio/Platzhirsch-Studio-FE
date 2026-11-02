// node --test tests/unit/kuechenplaner-nischen-ch.test.mjs
// Planungslogik Fix 04: Gerätenischen passen zum Raster.
// (a) 55-cm-Raster (SMS, Schweiz): Stückliste nannte 56-cm-Nischen aus EU-Geräten –
//     die passen in einen 55er-Korpus nicht. Jetzt „Maß fehlt“ statt falscher Zahl.
// (b) Side-by-Side integriert (2 Nischen 178) mit 91 cm Breite: zwei 56er-Nischen passen nicht.
import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultPlan, switchRaster } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { buildBom } from "../../src/lib/kuechenplaner/bom.js";
import { runChecks } from "../../src/lib/kuechenplaner/checks.js";

const notes = (plan) => buildBom(plan, buildKitchen(plan)).rows.map((r) => r.note).filter(Boolean);
const items = (plan) => runChecks(plan, buildKitchen(plan)).items;

test("60er-Raster: Nischenmaße mit Herstellerangabe bleiben", () => {
  assert.ok(notes(defaultPlan("l")).some((n) => /Kühlgeräte-Nische 178: 178 × 56 × 55 cm \(Herstellerangabe\)/.test(n)));
});

test("55er-Raster (SMS): keine 56-cm-Nische, sondern „Maß fehlt“", () => {
  const p = switchRaster(defaultPlan("l"), 55);
  const n = notes(p);
  assert.ok(n.length > 0);
  assert.ok(n.every((x) => !/× 56 ×/.test(x)), n.join(" | "));
  assert.ok(n.some((x) => /Kühlgeräte-Nische 178 \(SMS 55\) – Maß fehlt/.test(x)));
  assert.ok(n.some((x) => /Backofen-Nische \(SMS 55\) – Maß fehlt/.test(x)));
});

test("Side-by-Side integriert: 91 cm → Hinweis, 120 cm (bzw. 110 cm SMS) → keiner, freistehend → keiner", () => {
  const re = /zwei Kühlnischen nebeneinander/;
  const p = defaultPlan("zeile");
  p.runs.a = [{ t: "sidebyside", w: 91 }, ...p.runs.a.slice(2)];
  assert.ok(items(p).some((i) => i.level === "warn" && re.test(i.text)));
  p.runs.a[0] = { t: "sidebyside", w: 120 };
  assert.ok(!items(p).some((i) => re.test(i.text)));
  p.runs.a[0] = { t: "sidebyside", w: 91, o: "sf" };
  assert.ok(!items(p).some((i) => re.test(i.text)));
  const ch = switchRaster(defaultPlan("zeile"), 55);
  ch.runs.a = [{ t: "sidebyside", w: 110 }, ...ch.runs.a.slice(2)];
  assert.ok(!items(ch).some((i) => re.test(i.text)));
});
