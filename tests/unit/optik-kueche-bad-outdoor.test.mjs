// tests/unit/optik-kueche-bad-outdoor.test.mjs – Optik-QA Küche/Bad/Outdoor (01.11.2026).
// Run: node --test --test-reporter=tap tests/unit/optik-kueche-bad-outdoor.test.mjs
//
// Prüft: (1) Landing/typoLanding.js – Ergänzungsstrich bindet das Bindewort,
// erster Satz abtrennbar (FAQ „… Rufen Sie uns an: <Nummer>“);
// (2) Katalog/produktTitel.js – Maßangaben in Produktnamen brechen nicht,
// lange Namen bekommen die kleinere H1-Stufe; (3) Quelltext-Regeln der Fixes
// (Galerie-Abstand, Trust-Zeile, „Gut zu wissen“ im Raster, Details links).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const NBSP = " ";

test("bindSuspendedHyphen: Bindewort bleibt am Ergänzungsstrich", async () => {
  const { bindSuspendedHyphen } = await load("src/components/Landing/typoLanding.js");
  assert.equal(bindSuspendedHyphen("Fragen zur Hotel- und Gastroeinrichtung"), `Fragen zur Hotel-${NBSP}und Gastroeinrichtung`);
  assert.equal(bindSuspendedHyphen("Wohn- oder Essbereich"), `Wohn-${NBSP}oder Essbereich`);
  // Gedankenstrich und normale Bindestriche bleiben unberührt
  assert.equal(bindSuspendedHyphen("Bad – das tägliche Ritual"), "Bad – das tägliche Ritual");
  assert.equal(bindSuspendedHyphen("Outdoor-Planung & Gartenprojekte"), "Outdoor-Planung & Gartenprojekte");
  assert.equal(bindSuspendedHyphen(""), "");
  assert.equal(bindSuspendedHyphen(undefined), undefined);
  // nur Leerzeichen ändern sich, nie Zeichen
  const s = "Garten- und Landschaftsbau, Hotel- oder Gastro";
  assert.equal(bindSuspendedHyphen(s).replace(/ /g, " "), s);
});

test("splitFirstSentence: zweiter Satz bleibt mit der Nummer zusammen", async () => {
  const { splitFirstSentence } = await load("src/components/Landing/typoLanding.js");
  assert.deepEqual(splitFirstSentence("Ihre Frage ist nicht dabei? Rufen Sie uns an:"), ["Ihre Frage ist nicht dabei?", "Rufen Sie uns an:"]);
  assert.deepEqual(splitFirstSentence("Rufen Sie uns an:"), ["", "Rufen Sie uns an:"]);
  assert.deepEqual(splitFirstSentence(undefined), ["", ""]);
});

test("produktTitel: Maße brechen nicht, Name bleibt gleich", async () => {
  const { produktTitel, produktTitelGroesse } = await load("src/components/Katalog/produktTitel.js");
  assert.equal(produktTitel("Backofen 60 x 60 cm GO 250"), `Backofen 60${NBSP}x${NBSP}60${NBSP}cm GO 250`);
  assert.equal(produktTitel("Backofen 90 x 48 cm Edelstahl EB 333"), `Backofen 90${NBSP}x${NBSP}48${NBSP}cm Edelstahl EB 333`);
  assert.equal(produktTitel("Flex Round"), "Flex Round");
  assert.equal(produktTitel("DGC 7865 HC Pro / DGC 7865 HCX Pro"), "DGC 7865 HC Pro / DGC 7865 HCX Pro");
  for (const n of ["Backofen 60 x 60 cm GO 250", "Kühlschrank 178 cm", "BORA X Pure Max"]) {
    assert.equal(produktTitel(n).replace(/ /g, " "), n, "nur Leerzeichen werden geschützt");
  }
  assert.equal(produktTitelGroesse("Classic Sauna"), "display-l");
  assert.equal(produktTitelGroesse("DGC 7865 HC Pro / DGC 7865 HCX Pro"), "display-m");
});

test("Quelltext: Abstände, Raster und Spaltenbelegung der Fixes", () => {
  const landing = src("src/components/Landing/landingPage.js");
  assert.match(landing, /<LandingGallery[^>]*className=\{content\.process !== false \? "pt-section" : undefined\}/, "Galerie hat Abstand zum Arbeitsweise-Band");
  const parts = src("src/components/Landing/parts.js");
  assert.match(parts, /export function LandingGallery\(\{[^}]*bottom = true/);
  assert.match(parts, /lg:w-max[^"]*lg:flex-row/, "Trust-Zeile: erst ab lg einzeilig");
  assert.doesNotMatch(parts, /sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8/, "kein 2+1-Umbruch mehr");
  assert.match(parts, /splitFirstSentence\(l\("faqMissing"\)\)/);
  const outdoor = src("src/components/Landing/Outdoor/OutdoorLanding.js");
  assert.match(outdoor, /<LandingGallery[^>]*bottom=\{false\}/);
  for (const f of ["src/components/Kuechengeraete/KuechengeraetePage.js", "src/components/BadWellness/BadWellnessPage.js"]) {
    const s = src(f);
    assert.doesNotMatch(s, /hinweis-title" contained="text"/, `${f}: „Gut zu wissen“ im Seitenraster`);
    assert.match(s, /mb-1 block text-small tabular/, `${f}: Schrittnummer über dem Titel`);
  }
  const detail = src("src/components/Katalog/ProduktDetail.js");
  // R3: Ansichten ohne Konfigurator-Doppel (galerieDoppel.js) – Zählung über Hauptbild + Rest.
  // 03.11.2026: Zählung Leitbild + Raumbilder + Rest (Leitbild = Kachelbild, kachelBild.js).
  assert.ok(detail.includes("const detailsLinks = Boolean(konfig) && (leit ? 1 : 0) + raumRest.length + rest.length <= 3;"));
  assert.match(detail, /\{!detailsLinks && details\}/);
  assert.match(detail, /size=\{produktTitelGroesse\(p\.name\)\}/);
});
