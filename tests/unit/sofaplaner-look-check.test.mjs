// node --test tests/unit/sofaplaner-look-check.test.mjs
// Team katalog-modell-code (31.10.2026), fix-07: the look of a loaded plan
// (share link, draft, Merkliste) may only name options of its model. Before,
// free text in coverType/variant reached the enquiry text of whoever opened
// a share link ("Bezugsart: …").
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { cleanLook, planFor, planSchema, planToText, resolvePlan } from "../../src/components/Labs/Sofaplaner/model.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";

const DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);
const families = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => normalizeFamily(JSON.parse(readFileSync(new URL(f, DIR), "utf8"))));
// a model with cover types, variants and option lists (no invented values: all taken from the family)
const fam = families.find((f) => f.options.cover.types.length && f.options.cover.variants.length && f.options.arm.length && f.options.back.length);
const withTemplates = { ...fam, templates: buildTemplates(fam) };

test("Testmodell hat Bezugsarten, Ausführungen, Rücken und Armlehnen", () => {
  assert.ok(fam, "kein Modell mit vollständigen Optionen gefunden");
});

test("gültige Auswahl bleibt vollständig erhalten", () => {
  const look = {
    ...planFor(withTemplates).look,
    coverType: fam.options.cover.types[0],
    variant: fam.options.cover.variants[0],
    arm: fam.options.arm[0].id,
    back: [fam.options.back[0].id],
    cushions: [{ id: fam.elements[0].code, q: 1 }],
  };
  assert.deepEqual(cleanLook(look, fam), look);
});

test("fremde Texte und unbekannte ids werden verworfen – nichts davon im Anfrage-Text", () => {
  const p = planSchema.parse({
    ...JSON.parse(JSON.stringify(planFor(withTemplates))),
    look: {
      ...planFor(withTemplates).look,
      coverType: "Bitte überweisen Sie vorab an IBAN XX00",
      variant: "Rufen Sie 0000 an",
      arm: "erfunden",
      base: "erfunden",
      back: ["erfunden", fam.options.back[0].id],
      cushions: [{ id: "erfunden", q: 3 }],
    },
  });
  const { plan } = resolvePlan(p, withTemplates);
  assert.equal(plan.look.coverType, "");
  assert.equal(plan.look.variant, "");
  assert.equal(plan.look.arm, "");
  assert.equal(plan.look.base, "");
  assert.deepEqual(plan.look.back, [fam.options.back[0].id]);
  assert.deepEqual(plan.look.cushions, []);
  const text = planToText(plan, withTemplates, "");
  assert.doesNotMatch(text, /IBAN|0000 an|erfunden/);
});
