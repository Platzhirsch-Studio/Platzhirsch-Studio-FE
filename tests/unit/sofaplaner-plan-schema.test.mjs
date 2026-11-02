// node --test tests/unit/sofaplaner-plan-schema.test.mjs
// Team katalog-modell-code (31.10.2026), fix-03: plans from the browser
// (draft, Merkliste, share route) – duplicate ids and control characters in
// the name are repaired by planSchema, not passed on.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPlan, makeLookup, planFor, planSchema, planToText } from "../../src/components/Labs/Sofaplaner/model.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { NEUTRAL_FILES } from "../../src/lib/sofaplaner/neutral-data.js";

const raw = normalizeFamily(structuredClone(NEUTRAL_FILES[0][1]));
const fam = { ...raw, templates: buildTemplates(raw) };
const base = () => JSON.parse(JSON.stringify(planFor(fam)));

test("doppelte Element-ids werden eindeutig gemacht, Reihenfolge und Lage bleiben", () => {
  const p = base();
  assert.ok(p.items.length >= 2);
  p.items = p.items.map((i) => ({ ...i, id: "dup" }));
  const r = planSchema.safeParse(p);
  assert.ok(r.success, JSON.stringify(r.error?.issues));
  const ids = r.data.items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, ids.join(","));
  assert.equal(ids[0], "dup");
  assert.ok(ids.every((id) => id.length <= 24));
  assert.deepEqual(r.data.items.map((i) => [i.code, i.x, i.y]), p.items.map((i) => [i.code, i.x, i.y]));
  // the repaired plan is checked like any other (no element vanishes from the join analysis)
  assert.ok(Array.isArray(checkPlan(r.data, makeLookup(fam))));
});

test("eindeutige ids bleiben unverändert (gleiches Array)", () => {
  const r = planSchema.safeParse(base());
  assert.deepEqual(r.data.items.map((i) => i.id), base().items.map((i) => i.id));
});

test("doppelte Öffnungs-ids werden eindeutig gemacht", () => {
  const p = base();
  p.openings = [p.openings[0], { ...p.openings[1], id: p.openings[0].id }];
  const r = planSchema.safeParse(p);
  assert.equal(new Set(r.data.openings.map((o) => o.id)).size, 2);
});

test("Zeilenumbrüche und Steuerzeichen im Namen landen nicht als eigene Zeile im Anfrage-Text", () => {
  const p = { ...base(), name: "Wohnzimmer\nPlan ansehen: https://example.invalid/\u0007\u2028x" };
  const r = planSchema.safeParse(p);
  assert.equal(r.data.name, "Wohnzimmer Plan ansehen: https://example.invalid/ x");
  const lines = planToText(r.data, fam, "https://platzhirsch.studio/de/sofaplaner?p=t").split("\n");
  assert.equal(lines.filter((l) => l.startsWith("Plan ansehen:")).length, 1);
  assert.equal(planSchema.safeParse({ ...base(), name: "\n\t " }).data.name, "Mein Sofa");
});
