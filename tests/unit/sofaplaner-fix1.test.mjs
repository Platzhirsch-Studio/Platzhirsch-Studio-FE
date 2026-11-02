// node --test tests/unit/sofaplaner-fix1.test.mjs
// QM Sofaplaner R1 (qa-screenshots/labs-ausbau/sofaplaner/feedback-1.md):
// P1-3 Startformen ohne Konflikt im Standardraum, P1-4 Raum klemmt nicht still,
// P2-2 deutsche Optionsnamen, P2-3 Rücken als Einzelwahl + Zusatzoptionen,
// P2-7 Bezugskollektionen mit Quelle, P3-2 einheitliche Anführungszeichen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DEFAULT_OPENINGS, DEFAULT_ROOM, checkPlan, fitItemsToRoom, fitTemplate, makeLookup, overlappingPairs, planFor } from "../../src/components/Labs/Sofaplaner/model.js";
import { familySummary, germanOptionLabel, normalizeFamily, normalizeQuotes } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { availability, backGroups } from "../../src/lib/sofaplaner/options.js";

const DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);
const families = readdirSync(DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const fam = normalizeFamily(JSON.parse(readFileSync(new URL(f, DIR), "utf8")));
    return { ...fam, templates: buildTemplates(fam) };
  });
const errorsOf = (room, openings, items, lookup) => checkPlan({ room, openings, items }, lookup).filter((c) => c.level === "error");

// Formen, die physisch nicht in 560 × 440 cm mit Tür rechts (ab 320 cm) passen:
// breiter als der Raum oder der Schenkel reicht immer in den Türschwenk.
// Die Kachel zeigt dann „Passt nicht in Ihren Raum“ statt eines roten Plans.
const NOT_FITTING = new Set([
  "allen/peninsula",
  "connery/u",
  "florida/peninsula",
  "lawson/chaise",
  "lawson/peninsula",
  "patio-teak/peninsula",
  "saki-cord-outdoor/u",
  "saki-outdoor/u",
  "saki/u",
  "yang/peninsula",
]);

test("P1-3: alle 329 Startformen (317 + Ecke links/rechts für 6 Familien, Feinschliff R3) im Standardraum – passende ohne Fehler, die übrigen als „passt nicht“ markiert", () => {
  let n = 0;
  const notFitting = [];
  for (const fam of families) {
    const lookup = makeLookup(fam);
    for (const t of fam.templates) {
      n += 1;
      const r = fitTemplate(t, DEFAULT_ROOM, DEFAULT_OPENINGS, lookup);
      if (r.fits) assert.deepEqual(errorsOf(DEFAULT_ROOM, DEFAULT_OPENINGS, r.items, lookup), [], `${fam.slug}/${t.key}`);
      else notFitting.push(`${fam.slug}/${t.key}`);
    }
  }
  assert.equal(n, 329);
  assert.deepEqual(new Set(notFitting), NOT_FITTING);
  for (const key of notFitting) {
    const [slug, form] = key.split("/");
    const t = families.find((f) => f.slug === slug).templates.find((x) => x.key === form);
    assert.ok(t.w > DEFAULT_ROOM.w || Math.min(t.w, t.d) > 320, `${key} müsste passen`);
  }
});

test("P1-3: Connery „Ecke rechts“ startet ohne Konflikt; Startplan jeder Familie hat 0 Fehler", () => {
  const con = families.find((f) => f.slug === "connery");
  const lookup = makeLookup(con);
  const r = fitTemplate(con.templates.find((t) => t.key === "ecke-rechts"), DEFAULT_ROOM, DEFAULT_OPENINGS, lookup);
  assert.equal(r.fits, true);
  assert.deepEqual(errorsOf(DEFAULT_ROOM, DEFAULT_OPENINGS, r.items, lookup), []);
  assert.equal(overlappingPairs(r.items).length, 0);
  for (const fam of families) {
    const p = planFor(fam);
    assert.deepEqual(
      checkPlan(p, makeLookup(fam))
        .filter((c) => c.level === "error")
        .map((c) => c.text),
      [],
      fam.slug
    );
  }
});

test("P1-4: zu kleiner Raum schiebt keine Elemente gegeneinander, Konflikt nennt beide Maße", () => {
  const con = families.find((f) => f.slug === "connery");
  const p = planFor(con, "gerade");
  const room = { w: 150, d: 440 };
  const items = fitItemsToRoom(p.items, room);
  assert.equal(overlappingPairs(items).length, 0);
  const err = checkPlan({ ...p, room, items }, makeLookup(con)).find((c) => c.kind === "roomsize");
  assert.match(err.text, /^Sofa \(\d+ cm\) ist breiter als der Raum \(150 cm\)\.$/);
});

test("P2-2: englische Optionsnamen werden deutsch, Herstellerbegriff bleibt erhalten", () => {
  assert.equal(germanOptionLabel("Optional backrest cushion"), "Optionales Rückenkissen");
  assert.equal(germanOptionLabel("Optional backrest cushion with band"), "Optionales Rückenkissen mit Band");
  assert.equal(germanOptionLabel("Optional cushion"), "Optionales Kissen");
  assert.equal(germanOptionLabel("Optional tray"), "Optionales Tablett");
  assert.equal(germanOptionLabel("OPTIONAL BACKREST CUSHION CM 60X40"), "Optionales Rückenkissen 60 × 40 cm");
  assert.equal(germanOptionLabel("Teddy-Kissen optional"), "Teddy-Kissen optional");
  const con = families.find((f) => f.slug === "connery");
  const labels = con.options.cushions.map((c) => c.label);
  assert.ok(labels.includes("Optionales Rückenkissen 65 × 60 cm"), labels.join(" | "));
  const tray = con.options.cushions.find((c) => c.label.startsWith("Optionales Tablett"));
  assert.equal(tray.labelEn, "Optional tray");
  for (const fam of families)
    for (const k of ["back", "arm", "base", "cushions"])
      for (const o of fam.options[k]) assert.doesNotMatch(o.label, /^Optional (backrest|back|cushion|tray|headrest|rain|lumbar)\b/i, `${fam.slug}: ${o.label}`);
});

test("P2-3: Connery-Rücken – fester Rücken und „Ohne Rücken“ als Einzelwahl, Kopfstützen als Zusatz mit Elementbezug", () => {
  const con = families.find((f) => f.slug === "connery");
  const { base, addons } = backGroups(con.options.back);
  assert.equal(base.length, 2);
  assert.match(base[0].label, /^Fester gepolsterter Rücken/);
  assert.match(base[1].label, /^Ohne Rücken/);
  assert.ok(addons.length >= 3);
  const lookup = makeLookup(con);
  const els = planFor(con, "gerade").items.map((i) => lookup(i.code));
  assert.equal(availability(base[1], con.elements, els).available, false, "ohne Bank/Hocker im Plan ausgegraut");
  const head90 = addons.find((o) => /90 cm/.test(o.label));
  assert.match(availability(head90, con.elements, els).scope, /Chaise/);
});

test("P2-7: Bezugskollektionen nur mit Quelle aus der Familie", () => {
  const con = families.find((f) => f.slug === "connery");
  assert.deepEqual(
    con.options.cover.collections.map((c) => c.name),
    ["Aspen"]
  );
  let named = 0;
  for (const fam of families)
    for (const c of fam.options.cover.collections) {
      named += 1;
      assert.match(c.source, /^https:\/\/(www\.)?minotti\.com\//, `${fam.slug}: ${c.name}`);
    }
  assert.ok(named >= 10, `nur ${named}`);
});

test("P3-2 und Modellkarten: Anführungszeichen einheitlich, Karte mit Tiefe aus Herstellerdaten", () => {
  assert.equal(normalizeQuotes('Andersen "Quilt"'), "Andersen „Quilt“");
  for (const fam of families) assert.doesNotMatch(fam.name, /["”]/, fam.slug);
  const sum = familySummary(families.find((f) => f.slug === "connery"));
  assert.equal(typeof sum.depth, "number");
  assert.equal(sum.line, "Connery");
  assert.equal(familySummary(families.find((f) => f.slug === "andersen-slim-90")).line, "Andersen");
});
