// QM planer-tools r3 (01.11.2026): Handy-Zoom 200 %, Querformat, Maß-Umbrüche,
// Moodboard-Raster, Stil-Finder-Rückschritt (StilCopyProvider fehlte).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { splitProductName } from "../../src/lib/stilfinder/displayName.js";
import { keepTogether } from "../../src/lib/kuechenplaner/typo.js";
import { nbUnits } from "../../src/components/Labs/Stilfinder/localize.js";
import { fillRows } from "../../src/components/Labs/Stilfinder/fillRows.js";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const NB = " ";

test("Moodboard-Titel: Maß mitten im Titel wird zu Name + Ausführung, ohne Technik-Zusätze", () => {
  assert.deepEqual(splitProductName("Camouflage 240 mm Non Dimmable Crema d'Orcia Stone"), { name: "Camouflage", finish: "Crema d'Orcia Stone" });
  assert.deepEqual(splitProductName("Arc Dining Table, L250 - H35mm - Coffee Black Oak"), { name: "Arc Dining Table", finish: "Coffee Black Oak" });
  assert.deepEqual(splitProductName("Charlotte"), { name: "Charlotte", finish: "" });
  assert.deepEqual(splitProductName("Tavolo 3000 Series"), { name: "Tavolo 3000 Series", finish: "" });
});

test("Druckansicht: Bezeichnung und Maß bleiben zusammen", () => {
  assert.equal(keepTogether("Spülenschrank 60, Korpus 78"), `Spülenschrank${NB}60, Korpus${NB}78`);
  assert.equal(keepTogether("Unterschrank (Auszüge) 30, Wand A"), `Unterschrank (Auszüge)${NB}30, Wand${NB}A`);
  assert.equal(keepTogether("208 × 102 cm"), `208${NB}×${NB}102${NB}cm`);
});

test("Stil-Ergebnis: Zahl und Einheit im Studio-Tipp zusammen", () => {
  assert.equal(nbUnits("etwa 65 cm Abstand."), `etwa 65${NB}cm Abstand.`);
  assert.equal(nbUnits("ohne Maß"), "ohne Maß");
  assert.equal(nbUnits(null), null);
});

test("Moodboard: keine Waise in der letzten Reihe (4er-Raster)", () => {
  const sq = (id) => ({ id, tile: "square" });
  const full = [{ id: "a", tile: "big" }, sq("b"), sq("c"), sq("d"), sq("e"), { id: "f", tile: "wide" }, sq("g"), sq("h")];
  assert.equal(fillRows(full).length, 8); // 4 + 4 + 2 + 2 = 12 Zellen
  const oneMissing = full.filter((x) => x.id !== "c"); // 11 Zellen → eine Einzelkachel weg
  const out = fillRows(oneMissing);
  const cells = out.reduce((n, x) => n + (x.tile === "big" ? 4 : x.tile === "wide" ? 2 : 1), 0);
  assert.equal(cells % 4, 0);
  assert.equal(out.length, 7); // 11 Zellen → die letzte Einzelkachel wird breit (12), kein Stück fällt weg
  assert.equal(fillRows(full.filter((x) => !["c", "d"].includes(x.id))).length, 6); // 10 → zwei breit
  assert.equal(fillRows([...full, sq("i")]).length, 8); // 13 → letzte Einzelkachel entfällt
});

test("Stil-Finder: Quiz bekommt die Texte der Sprache (500er „StilCopyProvider fehlt“)", () => {
  const page = read("src/app/[locale]/stil-finder/page.js");
  assert.match(page, /<StilfinderQuiz copy=\{stilfinderClientCopy\(locale\)\}/);
  const quiz = read("src/components/Labs/Stilfinder/StilfinderQuiz.js");
  assert.match(quiz, /<StilCopyProvider copy=\{copy\}>/);
  const layout = read("src/app/[locale]/stil-finder/ergebnis/[profil]/layout.js");
  assert.match(layout, /<StilCopyProvider copy=\{stilfinderClientCopy\(locale\)\}>/);
});

test("Küchenplaner: Reiter wachsen mit der Schrift, Preisleiste trennt nicht mitten im Wort", () => {
  const app = read("src/components/Labs/Kuechenplaner/KuechenplanerApp.js");
  assert.match(app, /role="tablist"[^>]*overflow-x-auto/);
  assert.doesNotMatch(app, /role="tablist"[^>]*flex-wrap/);
  assert.match(app, /min-h-\[44px\] min-w-max flex-auto whitespace-nowrap px-2\.5 text-\[0\.8125rem\]/);
  assert.doesNotMatch(app, /\[overflow-wrap:anywhere\]">\{tr\(price\.label\)\}/);
  assert.match(app, /@max-\[20em\]:sr-only">\{tr\(price\.label\)\}/);
  const css = read("src/components/Labs/Kuechenplaner/Kuechenplaner.module.css");
  assert.match(css, /@container kp-panel \(max-width: 21rem\)/);
});

test("Küchenplaner 3D-Leiste: kein Umbruch, Beschriftung nach Containerbreite, Ladezeile ohne Widerspruch", () => {
  const v = read("src/components/Labs/Kuechenplaner/Viewer.js");
  assert.match(v, /const btn = `inline-flex min-h-\[44px\] min-w-\[44px\][^`]*whitespace-nowrap/);
  assert.match(v, /role="toolbar"/);
  assert.match(v, /@container absolute inset-x-1\.5 top-1\.5 flex-wrap/);
  assert.match(v, /\{slow && progress < 100 &&/);
  assert.match(read("src/lib/kuechenplaner/copy/ui.js"), /\["3D-Ansicht wird aufgebaut …", "Building the 3D view …"/);
});

test("Sofaplaner: Plan scrollt bei Platzmangel mit, Schrittleiste/Weiter nach Containerbreite", () => {
  const p = read("src/components/Labs/Sofaplaner/Planner.js");
  assert.match(p, /toggleAttribute\("data-sp-tall", tall\)/);
  assert.match(p, /--sp-header/);
  const css = read("src/components/Labs/Sofaplaner/sofaplaner.module.css");
  assert.match(css, /\.app\[data-sp-tall\] \.stageSticky \{\s*position: relative;/);
  assert.match(css, /@container sp-steps \(max-width: 16rem\)/);
  assert.match(css, /@container sp-nav \(max-width: 30rem\)/);
  assert.match(css, /--sp-top: var\(--sp-header, var\(--header-h, 56px\)\);/);
  const sum = read("src/components/Labs/Sofaplaner/Summary.js");
  assert.match(sum, /\\u00a0×\\u00a0\$\{T\.cm\(r\.el\?\.d\)\}\\u00a0cm/);
});
