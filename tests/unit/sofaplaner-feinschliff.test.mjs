// node --test tests/unit/sofaplaner-feinschliff.test.mjs
// Sofaplaner Restliste aus der QM-Abnahme (qa-screenshots/labs-ausbau/sofaplaner/abnahme.md)
// und Inhaber-Anforderungen (Marktresearch/digital/features/sofaplaner-anforderungen-inhaber.md):
// P3-A Raum anpassen statt Konflikt, P3-B angedockte Gruppe dreht als Ganzes,
// P3-H keine Herstellercodes / kein doppeltes Maß in der Übersicht,
// Deployment (Modelldaten statisch gebündelt), alle 90 Familien wählbar,
// Ecksofa für jede Familie mit rechteckigen Ecken.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  DEFAULT_OPENINGS,
  DEFAULT_ROOM,
  checkPlan,
  fitTemplate,
  joinedGroup,
  makeLookup,
  overlappingPairs,
  planFor,
  planToText,
  plainLabel,
  roomForTemplate,
  rotateItems,
  settleGroup,
  shortName,
  sideLabel,
} from "../../src/components/Labs/Sofaplaner/model.js";
import { analyzeJoins } from "../../src/lib/sofaplaner/geometry.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";

const DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".json")).sort();
const families = FILES.map((f) => {
  const fam = normalizeFamily(JSON.parse(readFileSync(new URL(f, DIR), "utf8")));
  return { ...fam, templates: buildTemplates(fam) };
});
const bySlug = (slug) => families.find((f) => f.slug === slug);

test("Deployment: minotti-data.js importiert jede Recherchedatei statisch, catalog.server liest kein Dateisystem", () => {
  const src = readFileSync(new URL("../../src/lib/sofaplaner/minotti-data.js", import.meta.url), "utf8");
  const imported = [...src.matchAll(/from "\.\/minotti\/([^"]+\.json)"/g)].map((m) => m[1]);
  assert.deepEqual(imported, FILES, "Index veraltet: node src/lib/sofaplaner/tools/build-catalog-index.mjs ausführen");
  assert.match(src, /from "\.\/minotti-covers\.json"/);
  const cat = readFileSync(new URL("../../src/lib/sofaplaner/catalog.server.js", import.meta.url), "utf8");
  assert.doesNotMatch(cat, /node:fs|readFileSync|readdirSync|process\.cwd/);
  // R7-P4 (Release-Rat R2, neuland P0-1, bewusst geändert): kein statischer Import mehr –
  // minotti-data.js lädt nur hinter MINOTTI_DATA_CONSENT per dynamischem import().
  assert.doesNotMatch(cat, /from "\.\/minotti-data\.js"/);
  assert.match(cat, /if \(!MINOTTI_DATA_CONSENT\) return[^\n]*\n\s*const m = await import\("\.\/minotti-data\.js"\)/);
});

test("Inhaber 1: alle 90 Familien wählbar, jede mit Startform und konfliktfreiem Startplan", () => {
  assert.equal(families.length, 90);
  assert.equal(new Set(families.map((f) => f.slug)).size, 90);
  for (const fam of families) {
    assert.ok(fam.templates.length > 0, `${fam.slug}: keine Startform`);
    const plan = planFor(fam);
    const errs = checkPlan(plan, makeLookup(fam)).filter((c) => c.level === "error");
    assert.deepEqual(errs, [], fam.slug);
  }
});

test("Inhaber 3: jede Familie mit rechteckiger Ecke und Endelementen bietet „Ecke links“ und „Ecke rechts“", () => {
  const missing = [];
  for (const fam of families) {
    const corners = fam.elements.filter((e) => e.role === "corner" && e.shape === "rect" && e.w && e.d);
    const ends = fam.elements.some((e) => e.role === "end" && e.kind === "ende");
    if (!corners.length || !ends) continue;
    const keys = fam.templates.map((t) => t.key);
    if (!keys.includes("ecke-links") || !keys.includes("ecke-rechts")) missing.push(fam.slug);
  }
  // nicht als Startform (im Schritt „Anpassen“ wählbar): Florida/Horizonte (gebogene bzw. geneigte Ecken),
  // Goodman (Ecke ohne veröffentlichte Tiefe), Quadrado (keine Endelemente)
  assert.deepEqual(missing, []);
  for (const slug of ["allen", "daniels", "lawrence", "vivienne", "bezier"]) {
    assert.ok(bySlug(slug).templates.some((t) => t.key === "ecke-links"), slug);
  }
});

test("P3-A: zu große Startform → kleinster Raum, in dem sie ohne Konflikt passt", () => {
  const connery = bySlug("connery");
  const lookup = makeLookup(connery);
  const u = connery.templates.find((t) => t.key === "u");
  assert.equal(fitTemplate(u, DEFAULT_ROOM, DEFAULT_OPENINGS, lookup).fits, false);
  const room = roomForTemplate(u, DEFAULT_ROOM, DEFAULT_OPENINGS, lookup);
  assert.ok(room && room.w >= u.w && room.w % 10 === 0 && room.d >= DEFAULT_ROOM.d, JSON.stringify(room));
  assert.equal(fitTemplate(u, { ...DEFAULT_ROOM, ...room }, DEFAULT_OPENINGS, lookup).fits, true);
  // 10 cm kleiner in der Breite passt es nicht
  assert.equal(fitTemplate(u, { ...DEFAULT_ROOM, ...room, w: room.w - 10 }, DEFAULT_OPENINGS, lookup).fits, false);
  // jede im Standardraum unpassende Form bekommt einen Raumvorschlag
  for (const fam of families) {
    const lk = makeLookup(fam);
    for (const t of fam.templates) {
      if (fitTemplate(t, DEFAULT_ROOM, DEFAULT_OPENINGS, lk).fits) continue;
      assert.ok(roomForTemplate(t, DEFAULT_ROOM, DEFAULT_OPENINGS, lk), `${fam.slug}/${t.key}`);
    }
  }
});

test("P3-B: Drehen eines angedockten Elements dreht die ganze Gruppe, Anschlüsse bleiben", () => {
  const connery = bySlug("connery");
  const lookup = makeLookup(connery);
  const plan = planFor(connery, "ecke-rechts");
  const corner = plan.items.find((i) => lookup(i.code).role === "corner");
  const group = joinedGroup(plan.items, lookup, corner.id);
  assert.equal(group.size, plan.items.length);
  const before = analyzeJoins(plan.items, lookup).joins.length;
  let items = plan.items;
  for (let k = 0; k < 4; k++) {
    items = rotateItems(items, group, plan.room);
    assert.equal(analyzeJoins(items, lookup).joins.length, before, `nach ${k + 1} × 90°`);
    assert.deepEqual(overlappingPairs(items), []);
    assert.deepEqual(
      checkPlan({ ...plan, items }, lookup).filter((c) => c.level === "error" && (c.kind === "join" || c.kind === "overlap")),
      []
    );
  }
  // gedreht in einen Konflikt (Wand/Tür) → Block rückt an die nächste freie Stelle
  const turned = rotateItems(plan.items, group, plan.room);
  const settled = settleGroup({ ...plan, items: turned }, group, lookup);
  assert.equal(settled.ok, true);
  assert.deepEqual(checkPlan({ ...plan, items: settled.items }, lookup).filter((c) => c.level === "error"), []);
  // ein freies Einzelstück bildet keine Gruppe
  const loose = { id: "solo", code: corner.code, x: 50, y: 300, rot: 0, w: corner.w, d: corner.d };
  assert.equal(joinedGroup([...plan.items, loose], lookup, "solo").size, 1);
});

test("P3-H: Übersicht in Klartext – „Ecke links“ statt SX, Maß nicht doppelt", () => {
  const daniels = bySlug("daniels");
  const lookup = makeLookup(daniels);
  const plan = planFor(daniels, "ecke-links");
  const text = planToText(plan, daniels);
  assert.doesNotMatch(text, /\b(SX|DX)\b/);
  for (const line of text.split("\n").filter((l) => l.startsWith("- "))) {
    const n = (line.match(/\d+(?:,\d+)? × \d+(?:,\d+)?/g) || []).length;
    assert.ok(n <= 1, `doppeltes Maß: ${line}`);
  }
  for (const fam of families) {
    for (const el of fam.elements) {
      const side = sideLabel(el);
      if (side) assert.doesNotMatch(side, /SX|DX/, el.code);
      assert.doesNotMatch(shortName(el), /\b(SX|DX)\b/, el.code);
      assert.ok(plainLabel(el).length > 1, el.code);
    }
  }
  assert.equal(sideLabel({ side: "SX", role: "corner" }), "Ecke links");
  assert.equal(sideLabel({ side: "DX", role: "end" }), "Abschluss rechts");
  assert.equal(plainLabel({ label: "Ecksofa 208 × 102 cm", code: "x" }), "Ecksofa");
  assert.equal(plainLabel({ label: "Optionales Kissen 45×45", code: "x" }), "Optionales Kissen");
  assert.equal(plainLabel({ label: "Sofa", code: "x" }), "Sofa");
  assert.equal(plainLabel({ label: "Eckelement 198 cm", w: 198, code: "x" }), "Eckelement");
  assert.equal(plainLabel({ label: "Bank 198 cm", w: 240, code: "x" }), "Bank 198 cm");
});
