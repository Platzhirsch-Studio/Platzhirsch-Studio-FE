// R7-P4 (Release-Rat R2, neuland P0-1): Ohne schriftliche Minotti-Zustimmung
// (MINOTTI_DATA_CONSENT = false) liefert der Sofaplaner keinen Minotti-Datensatz –
// weder im Bundle (kein statischer Import, kein Client-Import) noch im HTML
// (Seite und Katalog-Route bekommen nur die eigenen Sofa-Typen).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MINOTTI_CREDIT, MINOTTI_DATA_CONSENT, SOURCE_COPY } from "../../src/lib/sofaplaner/consent.js";
import { NEUTRAL_DEFAULT, NEUTRAL_FILES } from "../../src/lib/sofaplaner/neutral-data.js";
import { familySummary, normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { checkPlan, makeLookup, planFor, planToText } from "../../src/components/Labs/Sofaplaner/model.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");
const MINOTTI_SLUGS = readdirSync(join(root, "src/lib/sofaplaner/minotti")).map((f) => f.replace(/\.json$/, ""));

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx|mjs)$/.test(f)) out.push(p);
  }
  return out;
}

// Inhaber-Entscheidung Nr. 11 (29.10.2026): Minotti-Zustimmung liegt per Mail
// vor → Schalter EIN. Erwartung bewusst umgedreht (vorher: Standard AUS); der
// neutrale Katalog bleibt als Rückfall und wird unten weiter geprüft.
test("Schalter: EIN nach Minotti-Zustimmung, Markentexte mit Quellenangabe", () => {
  assert.equal(MINOTTI_DATA_CONSENT, true);
  assert.equal(SOURCE_COPY.brand, "Minotti");
  assert.equal(MINOTTI_CREDIT, "Daten: Minotti S.p.A.");
  assert.ok(SOURCE_COPY.sourceNote.startsWith(MINOTTI_CREDIT), "Quellenangabe sichtbar im Hinweis");
  assert.match(SOURCE_COPY.unabhaengig, /kein Angebot von Minotti/);
  assert.match(SOURCE_COPY.sourceNote, /keine Herstellerbilder|unverändert/);
  for (const v of Object.values(SOURCE_COPY)) {
    const t = typeof v === "function" ? v(3) : String(v ?? "");
    assert.doesNotMatch(t, /€|EUR|\d+\s?Euro/, t);
  }
});

test("Bundle: minotti-data.js nur hinter dem Schalter dynamisch, kein Client-/Seitenimport der Recherchedaten", () => {
  const cat = read("src/lib/sofaplaner/catalog.server.js");
  assert.doesNotMatch(cat, /^import[^\n]*minotti/m, "kein statischer Import");
  assert.match(cat, /if \(!MINOTTI_DATA_CONSENT\) return \{ files: NEUTRAL_FILES/);
  const files = [...walk(join(root, "src/components")), ...walk(join(root, "src/app")), ...walk(join(root, "src/lib"))].filter(
    (p) => !/sofaplaner[\\/](minotti-data\.js|catalog\.server\.js|tools[\\/])/.test(p)
  );
  for (const p of files) {
    const s = readFileSync(p, "utf8");
    assert.doesNotMatch(s, /(from|import\()\s*["'][^"']*(minotti-data|sofaplaner\/minotti\/|minotti-covers\.json)/, p);
  }
});

test("Rückfall-Katalog (neutral): eigene Sofa-Typen ohne Minotti-Datensatz", () => {
  const fams = NEUTRAL_FILES.map(([, raw]) => normalizeFamily(structuredClone(raw)));
  assert.ok(fams.length >= 3);
  assert.ok(fams.some((f) => f.slug === NEUTRAL_DEFAULT));
  for (const f of fams) {
    assert.ok(!MINOTTI_SLUGS.includes(f.slug), f.slug);
    const fam = { ...f, templates: buildTemplates(f) };
    // was die Seite (Index) und die Katalog-Route (Familie) ausliefern
    const payload = JSON.stringify({ sum: familySummary(f), fam });
    assert.doesNotMatch(payload, /minotti|internen Labs-Planer|Nutzungsbedingungen/i, f.slug);
    assert.deepEqual(f.sources, []);
    // Modul-Typen: Ecke, Sitz, Chaiselongue, Hocker in Rastermaßen
    const kinds = new Set(f.elements.map((e) => e.kind));
    for (const k of ["ecke", "mitte", "ende", "chaise", "hocker"]) assert.ok(kinds.has(k), `${f.slug}: ${k}`);
    const R = f.elements.find((e) => e.kind === "mitte").module;
    for (const e of f.elements.filter((x) => x.kind === "mitte")) assert.equal(e.w % R, 0, `${f.slug} ${e.code} im Raster`);
    // Startformen konfliktfrei
    assert.ok(fam.templates.some((t) => t.key === "ecke-links"));
    const plan = planFor(fam);
    assert.deepEqual(checkPlan(plan, makeLookup(fam)).filter((c) => c.level === "error"), [], f.slug);
    // Rückfall-Katalog: Modellwort folgt der Datenquelle (Nr. 11: „Minotti-Modell“)
    assert.match(planToText(plan, fam, null), new RegExp(`Modell: ${SOURCE_COPY.modelWord} `));
  }
});

test("Seite: Hinweis „Konkrete Modelle im Showroom“, Silhouette im ersten Bildschirm, keine Minotti-Texte fest im Code", () => {
  const page = read("src/app/[locale]/sofaplaner/page.js");
  assert.match(page, /await ensureCatalog\(\)/);
  assert.match(page, /SOURCE_COPY\.showroom/);
  assert.match(page, /data-sofa-hero/);
  assert.match(page, /<Silhouette /);
  assert.match(read("src/components/Labs/Sofaplaner/ModelPicker.js"), /<Silhouette /);
  for (const f of ["Planner.js", "ModelPicker.js", "FamilyList.js", "ResultPanel.js", "model.js"]) {
    assert.doesNotMatch(read(`src/components/Labs/Sofaplaner/${f}`), /"Minotti-Modell"|>Minotti-Modell<|`Minotti-Modell /, f);
  }
  for (const r of ["src/app/[locale]/sofaplaner/katalog/[slug]/route.js", "src/app/[locale]/sofaplaner/teilen/route.js"]) {
    assert.match(read(r), /await ensureCatalog\(\)/, r);
  }
});
