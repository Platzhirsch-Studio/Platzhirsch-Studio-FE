// lead-mobil-i18n fix-02: /en/sofaplaner zeigte Herstellermaße mit deutschem
// Dezimalkomma („168,5 × 80 cm“), weil fmtCm (geometry.js) immer "," setzt.
// Komponenten nutzen jetzt T.cm(), gebaute Texte (Anfrage, Prüfungen) T.dyn().
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dynEn, makeT } from "../../src/lib/sofaplaner/copy/t.js";
import { localizeFamily } from "../../src/lib/sofaplaner/copy/family-en.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { fmtCm } from "../../src/lib/sofaplaner/geometry.js";
import { planFor, planToText } from "../../src/components/Labs/Sofaplaner/model.js";

const COMP_DIR = new URL("../../src/components/Labs/Sofaplaner/", import.meta.url);
const DATA_DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);

test("T.cm: Dezimalzeichen je Sprache, sonst wie fmtCm", () => {
  const de = makeT("de");
  const en = makeT("en");
  for (const v of [64.5, 168.54, 90, 0, null, undefined]) assert.equal(de.cm(v), fmtCm(v), String(v));
  assert.equal(en.cm(64.5), "64.5");
  assert.equal(en.cm(168.54), "168.5");
  assert.equal(en.cm(90), "90");
  assert.equal(en.cm(null), "–");
});

test("T.dyn (EN) wandelt das Dezimalkomma in gebauten Texten, DE bleibt", () => {
  assert.equal(dynEn("Abschluss links (64,5 × 105 cm)"), "end, left (64.5 × 105 cm)");
  assert.equal(makeT("de").dyn("64,5 cm"), "64,5 cm");
});

test("Client-Komponenten formatieren Maße nicht mit fmtCm (nur model.js für den deutschen Text)", () => {
  for (const f of readdirSync(COMP_DIR).filter((x) => x.endsWith(".js") && x !== "model.js")) {
    const src = readFileSync(new URL(f, COMP_DIR), "utf8");
    assert.doesNotMatch(src, /\bfmtCm\b/, f);
  }
});

test("Anfrage-Text EN: keine Dezimalkommas bei Elementen mit halben Zentimetern", () => {
  let checked = 0;
  for (const f of readdirSync(DATA_DIR).filter((x) => x.endsWith(".json"))) {
    const fam = normalizeFamily(JSON.parse(readFileSync(new URL(f, DATA_DIR), "utf8")));
    const dec = (fam?.elements || []).filter((e) => [e.w, e.d, e.h].some((v) => v != null && v % 1));
    if (!dec.length) continue;
    const loc = localizeFamily({ ...fam, templates: buildTemplates(fam) });
    const items = dec.map((e, i) => ({ id: `t${i}`, code: e.code, x: i * 200, y: 0, rot: 0, w: e.w, d: e.d }));
    const text = planToText({ ...planFor(loc), items }, loc, "").split("\n").map(dynEn).join("\n");
    assert.match(text, /\d\.\d/, fam.slug);
    assert.doesNotMatch(text, /\d,\d/, `${fam.slug}: ${text}`);
    checked++;
  }
  assert.ok(checked >= 5, String(checked));
});
