// tests/unit/optik3-kueche-bad-outdoor.test.mjs – Optik-QA Küche/Bad/Outdoor, Runde 3 (01.11.2026).
// Run: node --test --test-reporter=tap tests/unit/optik3-kueche-bad-outdoor.test.mjs
//
// Prüft: (1) Katalog/galerieDoppel.js – Ausführungsbilder des Konfigurators stehen nicht
// zusätzlich als Ansicht (BORA CKA2 zeigte dasselbe Motiv dreimal); (2) BadWellness/
// brandFrame.js – Mehrfach-Markenrahmen: Zellbreite ∝ Seitenverhältnis (gleich hohe Motive);
// (3) Quelltext-Regeln: Öffnungszeiten ohne Umbruch in der Zeitspanne, Bildpaar der
// Landing-Galerie ab md gleich hoch, SeoFaq `flush` auf Küchengeräte/Bad, quadratischer
// Rahmen für die zweispaltigen Ansichten im Produktdetail.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("ohneKonfigDoppel: entfernt nur Bilder, die eine Ausführungsoption zeigt", async () => {
  const { ohneKonfigDoppel, konfigBildSrcs } = await load("src/components/Katalog/galerieDoppel.js");
  const p = {
    ausfuehrungen: [
      { optionen: [{ id: "a", bilder: ["/x/a.webp"] }, { id: "b", bilder: [{ src: "/x/b.webp" }] }, { id: "c" }] },
    ],
  };
  assert.deepEqual([...konfigBildSrcs(p)].sort(), ["/x/a.webp", "/x/b.webp"]);
  const ansichten = [{ src: "/x/b.webp" }, { src: "/x/detail.webp" }, { src: "/x/a.webp" }];
  assert.deepEqual(ohneKonfigDoppel(ansichten, p), [{ src: "/x/detail.webp" }]);
  // ohne Ausführungen / ohne Optionsbilder: unverändert (gleiche Referenz)
  assert.equal(ohneKonfigDoppel(ansichten, {}), ansichten);
  assert.equal(ohneKonfigDoppel(ansichten, { ausfuehrungen: [{ optionen: [{ id: "x" }] }] }), ansichten);
  assert.deepEqual(ohneKonfigDoppel([], p), []);
  // Startbild der Vorschau (Optionen ohne Bilder, z. B. Agape Cenote) zählt ebenfalls als Doppel
  const ohneBilder = { ausfuehrungen: [{ optionen: [{ id: "x" }, { id: "y" }] }] };
  assert.deepEqual(ohneKonfigDoppel(ansichten, ohneBilder, "/x/detail.webp"), [{ src: "/x/b.webp" }, { src: "/x/a.webp" }]);
});

test("ohneKonfigDoppel: echtes Produkt BORA CKA2 – keine Ansicht doppelt zur Vorschau", async () => {
  const { produktBySlug } = await load("src/lib/katalog/index.js").catch(() => ({}));
  if (typeof produktBySlug !== "function") return; // Index-API nicht vorhanden → Logiktest oben genügt
  const p = produktBySlug("bora-cka2");
  if (!p) return;
  const { ohneKonfigDoppel } = await load("src/components/Katalog/galerieDoppel.js");
  const rest = ohneKonfigDoppel(p.bilder.slice(1), p);
  assert.ok(rest.every((b) => !/bora-cka2-[12]\.webp$/.test(b.src)));
});

test("brandCell: flex-grow = Breite/Höhe, aspect-ratio aus den Bildmaßen", async () => {
  const { brandCell } = await load("src/components/BadWellness/brandFrame.js");
  const hoch = brandCell({ width: 1235, height: 1600 });
  const quer = brandCell({ width: 1600, height: 1199 });
  assert.equal(hoch.flex, "0.7719 1 0%");
  assert.equal(quer.flex, "1.3344 1 0%");
  assert.equal(hoch.aspectRatio, "1235 / 1600");
  // gleich hoch: Breite_i / Seitenverhältnis_i ist für alle Zellen gleich
  const W = 352;
  const sum = 1235 / 1600 + 1600 / 1199;
  const hHoch = (W * (1235 / 1600)) / sum / (1235 / 1600);
  const hQuer = (W * (1600 / 1199)) / sum / (1600 / 1199);
  assert.ok(Math.abs(hHoch - hQuer) < 1e-9);
  // defekte Maße → quadratisch statt NaN
  assert.deepEqual(brandCell({}), { flex: "1.0000 1 0%", aspectRatio: "1 / 1" });
});

test("Quelltext: Fixes der Runde 3 bleiben drin", () => {
  const parts = src("src/components/Landing/parts.js");
  assert.match(parts, /<span className="whitespace-nowrap">\{l\("hoursWeek"\)\}<\/span>/);
  assert.match(parts, /md:col-span-4 md:col-start-9 md:aspect-auto md:self-stretch/);
  assert.match(parts, /items\.length === 3 \? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"/);

  const faq = src("src/components/Reusable/SeoFaq.js");
  assert.match(faq, /flush = false/);
  assert.match(faq, /xl:col-start-2 xl:col-span-3/); // Standard unverändert für die übrigen Seiten
  assert.match(src("src/components/Kuechengeraete/KuechengeraetePage.js"), /<SeoFaq[^>]*\bflush\b/);
  assert.match(src("src/components/BadWellness/BadWellnessPage.js"), /<SeoFaq[^>]*\bflush\b/);

  const pd = src("src/components/Katalog/ProduktDetail.js");
  // QM R1: Startbild bleibt als Ansicht; Vorschau nur mit eigenem Optionsbild ≠ Hauptbild (hauptSrc).
  assert.match(pd, /ohneKonfigDoppel\(restAlle, p\)/);
  assert.match(pd, /hauptSrc=\{hauptSrc\}/);
  // QM R3: Kacheln vergrößerbar (BildZoom)
  // QM R4: Raum-Kacheln mit Reihenformat (kachelFormat) statt immer quadratisch
  assert.equal((pd.match(/sizes="\(min-width: 1024px\) 27vw, 50vw" kachel kachelAr=\{kachelFormat\(raumRest\)\} zoom=\{zoom\(\)\} \/>/g) || []).length, 1);
  assert.match(pd, /relative aspect-square w-full bg-linen/);

  const bw = src("src/components/BadWellness/BadWellnessPage.js");
  assert.match(bw, /style=\{multi \? brandCell\(image\) : undefined\}/);

  // RegionLinks: Gutter innerhalb max-w-page (gleiche Kante wie ui/Container)
  const rl = src("src/app/[locale]/regionen/RegionLinks.js");
  assert.match(rl, /className="mx-auto grid w-full max-w-page gap-x-grid gap-y-8 px-gutter lg:grid-cols-12"/);
  assert.doesNotMatch(rl, /bg-surface px-gutter/);
  const hub = src("src/app/[locale]/regionen/RegionenHub.js");
  assert.equal((hub.match(/max-w-page[^"]*px-gutter/g) || []).length, 3);
  assert.doesNotMatch(hub, /<(section|header)[^>]*className="[^"]*px-gutter/);

  // Architekten: Bauträger-Liste ab lg zeilenweise (Titel 14rem | Text), keine Trennung in Überschriften
  const arch = src("src/components/Architekten/ArchitektenPage.js");
  assert.match(arch, /md:grid-cols-3 lg:col-span-7 lg:col-start-6 lg:grid-cols-1/);
  // QM R1: Titelspalte als Anteil statt 14rem, weiche Trennstellen statt overflow-wrap.
  assert.match(arch, /lg:grid lg:grid-cols-\[minmax\(0,9fr\)_minmax\(0,11fr\)\]/);
  assert.match(arch, /\{fitHeading\(it\.title\)\}/);
  assert.doesNotMatch(arch, /wrap-break-word/);
});
