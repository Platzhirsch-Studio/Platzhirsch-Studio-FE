// node --test tests/unit/qm-planer-tools.test.mjs
// QM planer-tools (01.11.2026): Befunde aus der Geräte-Matrix (Screenshots) –
// Küchenplaner, Sofaplaner, Druckansicht. Prüft die Korrekturen im Quelltext.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const K = "src/components/Labs/Kuechenplaner/";
const S = "src/components/Labs/Sofaplaner/";

test("Küchenplaner quer: gelöste Ansicht ohne top-Versatz (lag 57 px über dem Panel)", () => {
  const css = read(`${K}Kuechenplaner.module.css`);
  assert.match(css, /max-height: 500px\)\s*\{\s*\.stick\s*\{\s*position: relative !important;[\s\S]*?top: auto !important;/);
  assert.match(css, /:focus\) \.stick \{\s*position: relative;\s*top: auto;/);
});

test("Küchenplaner mobil: Preisleiste deckend, Platz am Seitenende, Fokus nicht verdeckt", () => {
  const app = read(`${K}KuechenplanerApp.js`);
  const bar = app.match(/<div ref=\{barRef\} className=\{`\$\{styles\.priceBar\}[^`]*`\}/);
  assert.ok(bar, "Preisleiste mit barRef");
  assert.doesNotMatch(bar[0], /bg-paper\/\d+|backdrop-blur/);
  assert.match(bar[0], /\bbg-paper\b/);
  assert.match(app, /addEventListener\("focusin", onFocus\)/);
  const css = read(`${K}Kuechenplaner.module.css`);
  assert.match(css, /:global\(body\):has\(\.root\)\s*\{[^}]*padding-bottom: var\(--kp-bar-h, calc\(76px/);
  assert.match(app, /--kp-bar-h/);
  // zu hohe Ansicht (200 % Textgröße) scrollt mit
  assert.match(app, /root\.toggleAttribute\("data-kp-tall", tall\)/);
  assert.match(css, /\.root\[data-kp-tall\] \.stick \{\s*position: relative !important;\s*top: auto !important;/);
  assert.match(css, /:global\(html\):has\(\.root\)\s*\{\s*scroll-padding-bottom:/);
});

test("Druckansicht: Logo mobil über dem Titel, Trennpunkt nie am Zeilenanfang", () => {
  const p = read("src/app/[locale]/kuechenplaner/druck/page.js");
  assert.match(p, /flex flex-col-reverse items-start gap-3 border-b border-ink\/25 pb-4 sm:flex-row/);
  assert.match(p, /print:flex-row/);
  // r2/r3: Trennpunkt über keepTogether (typo.js, eigener Test in planer-tools-r2/r3)
  assert.match(p, /lines\.map\(\(l\) => <li key=\{l\}>\{kt\(t\(l\)\)\}<\/li>\)/);
  assert.match(read(`${K}ResultPanel.js`), /\{kt\(l\)\}<\/li>/);
});

test("Sofaplaner: Maße umbrechen nicht zwischen Zahl und Einheit, Dezimalkomma", () => {
  const d = read(`${S}Draufsicht.js`);
  assert.match(d, /const NB = "\\u00a0";/);
  assert.match(d, /const m = \(cm\) => \(cm \/ 100\)\.toLocaleString\("de-AT"\);/);
  assert.match(d, /Raum \{m\(RAUM\.w\)\}\{NB\}×\{NB\}\{m\(RAUM\.h\)\}\{NB\}m/);
  assert.equal((5.2).toLocaleString("de-AT"), "5,2");
  const mp = read(`${S}ModelPicker.js`);
  assert.match(mp, /const keepUnits = /);
  // gleiche Regel wie in ModelPicker.js
  const NB = "\u00a0";
  const keepUnits = (t) => t.replace(/ cm/g, `${NB}cm`).replace(/^(\S+) (?=\d)/, `$1${NB}`);
  assert.equal(keepUnits("Breiten 97,5–320 cm"), `Breiten${NB}97,5–320${NB}cm`);
  assert.equal(keepUnits("Breite 183 cm"), `Breite${NB}183${NB}cm`);
  const pl = read(`${S}Planner.js`);
  assert.match(pl, /const keepDims = \(t\) => t\.replace\(/);
  assert.match(pl, /keepDims\(T\("Der Grundriss zeigt einen Beispielraum/);
});

test("Sofaplaner: Formkarten oben ausgerichtet, Schrittleiste 375 px, Tablet-Kopf, Fokus über der Schrittleiste", () => {
  const css = read(`${S}sofaplaner.module.css`);
  assert.match(css, /\.formCard \{\s*display: grid;[\s\S]*?align-content: start;/);
  assert.match(css, /@media \(max-width: 400px\) \{\s*\.stepBtn \{[\s\S]*?\.stepNum \{\s*width: 24px;\s*height: 24px;/);
  assert.match(css, /@media \(min-width: 768px\) and \(max-width: 1023px\) \{\s*\.heroPlanMobil \.draufsicht \{/);
  assert.match(css, /\.plainList \+ \.more \{\s*margin-top: 16px;/);
  assert.match(read(`${S}Planner.js`), /root\.addEventListener\("focusin", onFocus\)/);
});
