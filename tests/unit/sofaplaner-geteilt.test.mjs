// node --test tests/unit/sofaplaner-geteilt.test.mjs
// Team katalog-modell-code (31.10.2026), fix-04: a share link whose model is
// gone from the catalogue (e.g. created with the Minotti catalogue, opened
// with the neutral one) used to show "Geteilter Plan … geladen" over a start
// suggestion of ANOTHER model. openShared() now returns null for it and the
// page shows the "not found" note.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { openShared, planFor, planSchema } from "../../src/components/Labs/Sofaplaner/model.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { NEUTRAL_FILES } from "../../src/lib/sofaplaner/neutral-data.js";

const raw = normalizeFamily(structuredClone(NEUTRAL_FILES[0][1]));
const fam = { ...raw, templates: buildTemplates(raw) };
const catalogue = new Map([[fam.slug, fam]]);
const familyFor = (slug) => catalogue.get(slug) || null;
const stored = planSchema.parse(JSON.parse(JSON.stringify(planFor(fam))));

test("bekanntes Modell: Plan, Modell und Zahl entfernter Elemente", () => {
  const r = openShared(stored, familyFor);
  assert.equal(r.family, fam);
  assert.equal(r.dropped, 0);
  assert.equal(r.plan.items.length, stored.items.length);
  const withGone = { ...stored, items: [...stored.items, { ...stored.items[0], id: "gone", code: "GIBT-ES-NICHT" }] };
  assert.equal(openShared(withGone, familyFor).dropped, 1);
});

test("Modell nicht (mehr) im Katalog oder kein Plan → null", () => {
  assert.equal(openShared({ ...stored, family: "connery" }, familyFor), null);
  assert.equal(openShared(null, familyFor), null);
});

test("Seite: „Geteilter Plan geladen“ nur, wenn openShared ein Modell gefunden hat", () => {
  const src = readFileSync(new URL("../../src/app/[locale]/sofaplaner/page.js", import.meta.url), "utf8");
  assert.match(src, /const opened = openShared\(loaded, clientFamily\);/);
  assert.match(src, /const stored = opened \? loaded : null;/);
  assert.doesNotMatch(src, /clientFamily\(stored\.family\)/);
});
