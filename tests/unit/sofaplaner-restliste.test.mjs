// node --test tests/unit/sofaplaner-restliste.test.mjs
// QM-Feedback Sofaplaner Restliste (qa-screenshots/feinschliff/sofaplaner/feedback.md):
// P2-2 Eck-Startformen ohne „Prüfen“, gleiche Hinweise zusammengefasst,
// vereinfachte Ecken mit Showroom-Hinweis; P3-1 Grund bei „Form passt nicht“;
// P3-2 keine SX/DX-Codes im Seitenhinweis.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DEPTH_TOLERANCE, joinIssue } from "../../src/lib/sofaplaner/geometry.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { DEFAULT_OPENINGS, DEFAULT_ROOM, checkPlan, makeLookup, mergeChecks, nofitReason, planFor } from "../../src/components/Labs/Sofaplaner/model.js";

const DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);
const families = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const fam = normalizeFamily(JSON.parse(readFileSync(new URL(f, DIR), "utf8")));
    return { slug: f.replace(/\.json$/, ""), fam: { ...fam, templates: buildTemplates(fam) } };
  });
const bySlug = (s) => families.find((f) => f.slug === s).fam;

// Families whose corner start shape uses a corner element that is only drawn as
// a rectangle (overall size ≠ arm depth) and that no official Minotti
// arrangement in the research file shows with these end elements → the start
// shape carries "Kombination im Showroom bestätigen" (sofaplaner.md, Restliste P2-2).
const SHOWROOM_CORNERS = new Set(["allen", "bezier", "bezier-cord-outdoor", "vivienne"]);

test("P2-2: Eck-Startformen ergeben 0 Hinweise der Stufe „warn“ und keinen Konflikt", () => {
  let n = 0;
  for (const { slug, fam } of families) {
    const lookup = makeLookup(fam);
    for (const t of fam.templates.filter((x) => x.key.startsWith("ecke"))) {
      n += 1;
      const checks = checkPlan(planFor(fam, t.key), lookup);
      const bad = checks.filter((c) => c.level === "warn" || c.level === "error");
      assert.deepEqual(bad.map((c) => c.text), [], `${slug} ${t.key}`);
    }
  }
  assert.ok(n >= 66, `nur ${n} Eck-Startformen`);
});

test("P2-2: vereinfachte Ecken nur mit Showroom-Hinweis, und nur bei den begründeten Familien", () => {
  const flagged = new Set();
  for (const { slug, fam } of families) {
    for (const t of fam.templates.filter((x) => x.confirm)) {
      flagged.add(slug);
      assert.match(t.hint, /Kombination im Showroom bestätigen/, `${slug} ${t.key}`);
    }
  }
  assert.deepEqual([...flagged].sort(), [...SHOWROOM_CORNERS].sort());
});

test("P2-2: kleiner Tiefenunterschied (≤ 5 cm) ist ein neutraler Hinweis, großer bleibt „Prüfen“", () => {
  const a = { role: "end", kind: "ende", d: 102, w: 195, shape: "rect", label: "A" };
  assert.equal(joinIssue(a, { ...a, d: 102 + DEPTH_TOLERANCE })?.level, "info");
  assert.equal(joinIssue(a, { ...a, d: 120 })?.level, "warn");
  // a corner deeper than the legs is a simplification, not a depth conflict
  const corner = { role: "corner", kind: "ecke", w: 168, d: 168, shape: "rect", label: "Eckelement" };
  assert.equal(joinIssue(corner, { ...a, d: 103 })?.level, "info");
  assert.equal(joinIssue(corner, { ...a, d: 103 })?.code, "corner");
  // a corner shallower than the legs keeps the warning
  assert.equal(joinIssue({ ...corner, w: 200, d: 90 }, { ...a, d: 103 })?.level, "warn");
});

test("P2-2: gleiche Hinweise werden zusammengefasst („an 2 Stellen“), betroffene Elemente bleiben markiert", () => {
  const merged = mergeChecks([
    { level: "warn", kind: "join", ids: ["a", "b"], text: "Gleicher Satz." },
    { level: "warn", kind: "join", ids: ["b", "c"], text: "Gleicher Satz." },
    { level: "warn", kind: "join", ids: ["c"], text: "Anderer Satz." },
  ]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].text, "Gleicher Satz. (an 2 Stellen)");
  assert.deepEqual(merged[0].ids, ["a", "b", "c"]);
  assert.equal(merged[1].text, "Anderer Satz.");
  // in real plans no text appears twice
  for (const { slug, fam } of families) {
    const lookup = makeLookup(fam);
    for (const t of fam.templates) {
      const texts = checkPlan(planFor(fam, t.key), lookup).map((c) => c.text);
      assert.equal(new Set(texts).size, texts.length, `${slug} ${t.key}`);
    }
  }
});

test("P3-1: „Form passt nicht“ nennt den Grund", () => {
  const connery = bySlug("connery");
  const lookup = makeLookup(connery);
  const u = connery.templates.find((t) => t.key === "u");
  const reason = nofitReason(u, DEFAULT_ROOM, DEFAULT_OPENINGS, lookup);
  assert.match(reason, /weil .*Tür/);
  assert.match(reason, /480 × 400/);
  const straight = connery.templates.find((t) => t.key === "gerade");
  assert.match(nofitReason(straight, { w: 150, d: 90 }, [], lookup), /größer als Ihr Raum/);
  assert.equal(nofitReason(straight, DEFAULT_ROOM, DEFAULT_OPENINGS, lookup), "");
});

test("P3-2: Seitenhinweis ohne SX/DX-Codes", () => {
  const page = readFileSync(new URL("../../src/app/[locale]/sofaplaner/page.js", import.meta.url), "utf8");
  assert.doesNotMatch(page, /\((SX|DX)\)/);
});
