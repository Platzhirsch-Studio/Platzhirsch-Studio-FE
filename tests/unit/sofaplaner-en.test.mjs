// node --test tests/unit/sofaplaner-en.test.mjs
// Welle 2 (team EN-Yacht-Sofa, 29.10.2026): /en/sofaplaner in English.
// - every T("…") key of the components has an English entry (src/lib/sofaplaner/copy/ui-en.js)
// - data-derived interface labels (kinds, measures, materials, start shapes) are covered
// - plan checks, dock reasons and the enquiry text come out without German
// - element names are Minotti's own English names; specs are English or flagged German
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { UI_EN } from "../../src/lib/sofaplaner/copy/ui-en.js";
import { dynEn, makeT } from "../../src/lib/sofaplaner/copy/t.js";
import { enElementLabel, localizeFamily, localizeIndex } from "../../src/lib/sofaplaner/copy/family-en.js";
import { specEn } from "../../src/lib/sofaplaner/copy/glossary-en.js";
import { sourceCopy, terminHref } from "../../src/lib/sofaplaner/copy/source.js";
import { KINDS, MEASURE_LABEL, normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { MATERIALS } from "../../src/lib/sofaplaner/materials.js";
import { BRAND_NOTE } from "../../src/lib/sofaplaner/covers.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { handoffHref, handoffProdukt } from "../../src/lib/sofaplaner/handoff.js";
import { PRICE_CONFIG, checkPlan, makeLookup, planFor, planToText } from "../../src/components/Labs/Sofaplaner/model.js";

const COMP_DIR = new URL("../../src/components/Labs/Sofaplaner/", import.meta.url);
const DATA_DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);

// German that must not survive on the English page
const GERMAN = /[äöüßÄÖÜ]|\b(und|oder|mit|nicht|bitte|Raum|Elemente|Anschluss|Armlehne|Rücken|Tiefe|Breite|Höhe|Sitz\w*|wählen|prüfen|Hinweis|Konflikt)\b/;

/** T("…") keys of the component files (first argument only, incl. ternaries). */
function componentKeys() {
  const keys = new Set();
  for (const f of readdirSync(COMP_DIR).filter((x) => x.endsWith(".js"))) {
    const s = readFileSync(new URL(f, COMP_DIR), "utf8");
    let i = 0;
    while ((i = s.indexOf("T(", i)) !== -1) {
      if (/[\w.$]/.test(s[i - 1] || "")) {
        i += 2;
        continue;
      }
      let depth = 0;
      let j = i + 1;
      let q = null;
      for (; j < s.length; j++) {
        const c = s[j];
        if (q) {
          if (c === "\\") j++;
          else if (c === q) q = null;
          continue;
        }
        if (c === '"' || c === "`" || c === "'") q = c;
        else if (c === "(") depth++;
        else if (c === ")" && --depth === 0) break;
      }
      const first = s.slice(i + 2, j).split(/,\s*\{/)[0];
      for (const m of first.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
        // comparison literals inside ternaries (state codes) are not texts
        if (/^[a-z]+$/.test(m[1]) && m[1] !== "in") continue;
        if (/[A-Za-zÄÖÜäöüß]/.test(m[1])) keys.add(m[1]);
      }
      i = j;
    }
  }
  return [...keys];
}

test("jeder T()-Schlüssel der Komponenten hat eine englische Fassung", () => {
  const keys = componentKeys();
  assert.ok(keys.length > 250, `nur ${keys.length} Schlüssel gefunden`);
  const missing = keys.filter((k) => UI_EN[k] == null);
  assert.deepEqual(missing, []);
});

test("Daten-Labels der Oberfläche sind übersetzt (Arten, Maße, Materialien, Preis, Formen)", () => {
  const labels = [
    ...Object.values(KINDS).map((k) => k.label),
    ...Object.values(MEASURE_LABEL),
    ...Object.values(MATERIALS).flatMap((m) => [m.label, m.hint, ...m.tones.map((t) => t[1])]),
    PRICE_CONFIG.label,
    BRAND_NOTE,
    "Modell", "Form", "Anpassen", "Ausführung", "Im Raum prüfen", "Übersicht", "Oben", "Rechts", "Unten", "Links",
  ];
  const missing = labels.filter((l) => UI_EN[l] == null);
  assert.deepEqual(missing, []);
});

const families = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => normalizeFamily(JSON.parse(readFileSync(new URL(f, DATA_DIR), "utf8"))));

test("Startformen: Name und Hinweis aller 90 Familien englisch", () => {
  const miss = new Set();
  for (const fam of families) for (const t of buildTemplates(fam)) for (const x of [t.label, t.hint]) if (UI_EN[x] == null) miss.add(x);
  assert.deepEqual([...miss], []);
});

test("Elementnamen sind Minottis englische Originalnamen (ohne Umlaut, ohne SX/DX)", () => {
  let n = 0;
  for (const fam of families) {
    for (const e of fam.elements) {
      const en = enElementLabel(e);
      assert.ok(e.labelEn, `${fam.slug}/${e.code}: kein englischer Herstellername`);
      assert.doesNotMatch(en, /[äöüß]/, `${fam.slug}/${e.code}: ${en}`);
      assert.doesNotMatch(en, /\b(SX|DX)$/, `${fam.slug}/${e.code}: ${en}`);
      n++;
    }
  }
  assert.ok(n > 6000);
  assert.equal(enElementLabel({ labelEn: "ELEMENT WITH ONE ARMREST LOW CM 202" }), "Element with one armrest low 202 cm");
  assert.equal(enElementLabel({ labelEn: "Sofa with flap cm 230 – seating module cm 83 SX" }), "Sofa with flap 230 cm – seating module 83 cm");
});

test("Herstellerangaben: entweder vollständig englisch oder als Deutsch markiert", () => {
  for (const fam of families.slice(0, 30)) {
    const en = localizeFamily({ ...fam, templates: buildTemplates(fam) });
    for (const o of [...en.options.back, ...en.options.arm, ...en.options.base, ...en.options.cushions]) {
      if (!o.de) assert.doesNotMatch(o.label, /[äöüß]/, `${fam.slug}: ${o.label}`);
      else assert.equal(o.label, o.labelDe);
    }
  }
  assert.deepEqual(specEn("Optionales Rückenkissen 65 × 60 cm"), { text: "Optional back cushion 65 × 60 cm", de: false });
  assert.equal(specEn("Armlehnen im 60er-Jahre-Stil").de, true);
});

test("Plan-Prüfungen und Anfrage-Text auf Englisch ohne deutsche Reste", () => {
  const T = makeT("en");
  const seen = new Set();
  for (const fam of families.slice(0, 40)) {
    const loc = localizeFamily({ ...fam, templates: buildTemplates(fam) });
    const lookup = makeLookup(loc);
    // every start shape in a small room → walls, doors, joins, overlaps
    for (const t of loc.templates) {
      const plan = planFor(loc, t.key, { w: 260, d: 240 }, [{ id: "d1", type: "door", wall: "top", offset: 20, width: 90, sill: 0 }]);
      for (const c of checkPlan(plan, lookup)) {
        const out = T.dyn(c.text);
        seen.add(c.kind);
        assert.doesNotMatch(out, GERMAN, `${fam.slug}/${t.key} ${c.kind}: ${out}`);
      }
      const text = planToText(plan, loc, "https://platzhirsch.studio/en/sofaplaner?p=x").split("\n").map(dynEn).join("\n");
      for (const line of text.split("\n")) {
        if (/^(Back|Armrest|Base\/feet|Type of cover|Cover version|- )/.test(line)) continue; // option names: maker data (EN or flagged German)
        assert.doesNotMatch(line, GERMAN, `${fam.slug}/${t.key}: ${line}`);
      }
    }
  }
  assert.ok(seen.size >= 3, `nur ${[...seen].join(", ")} geprüft`);
});

test("Textquelle, Termin- und Übergabe-Link auf Englisch", () => {
  const sc = sourceCopy("en");
  for (const k of ["overline", "lead", "leadShort", "dimsNote", "sourceNote", "rulesNote", "metaTitle", "metaDescription", "unabhaengig", "h1Satz"]) assert.doesNotMatch(sc[k], /[äöüß]/, k);
  assert.ok(sc.metaTitle.length <= 65 && sc.metaDescription.length <= 165);
  assert.match(sc.unabhaengig, /not an offer from Minotti/);
  assert.match(terminHref("en"), /^\/en\/consultation\?/);
  assert.match(terminHref("de"), /^\/de\/beratung\?/);
  assert.match(handoffHref({ locale: "en", name: "Lounge", count: 4 }), /^\/en\/consultation\?produkt=Minotti\+sofa%3A\+Lounge%2C\+4\+elements/);
  assert.equal(handoffProdukt({ name: "Lounge", count: 4 }), "Minotti-Sofa: Lounge, 4 Elemente");
  assert.equal(makeT("de")("Schritt {n} von 6", { n: 2 }), "Schritt 2 von 6");
  assert.equal(makeT("en")("Schritt {n} von 6", { n: 2 }), "Step 2 of 6");
});

test("Modellliste: Charakterzeile aus Fakten, ohne deutschen Recherchetext", () => {
  const idx = localizeIndex(families.map((f) => ({ slug: f.slug, name: f.name, modular: f.modular, outdoor: f.outdoor, sofabed: f.sofabed, character: f.character })));
  for (const f of idx) assert.doesNotMatch(f.character, /[äöüß]/);
});
