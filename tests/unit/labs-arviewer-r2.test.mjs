// node --test tests/unit/labs-arviewer-r2.test.mjs
// 3D/AR-Viewer (Labs), Runde 2: Katalogdaten, Dateigrößen und die Auflagen
// Maße mobil (Auflage 1), Hotspots bei Maßen, Leerraum über der H1 (Punkt 6).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { AR_MODELS } from "../../src/components/Labs/ArViewer/data/catalog.js";

const root = new URL("../../", import.meta.url);
const file = (p) => new URL(p.replace(/^\//, ""), root);
const pub = (p) => file("public" + p);
const read = (p) => readFileSync(file(p), "utf8");

test("jedes Modell: B/T/H > 0, Dateien vorhanden, Poster und GLB im Budget", () => {
  assert.ok(AR_MODELS.length >= 1);
  for (const m of AR_MODELS) {
    for (const k of ["w", "d", "h"]) assert.ok(m.dimensionsCm[k] > 0, `${m.id} ${k}`);
    assert.ok(statSync(pub(m.src)).size < 1.5 * 1024 * 1024, `${m.id}: GLB > 1,5 MB`);
    assert.ok(statSync(pub(m.poster)).size < 100 * 1024, `${m.id}: Poster > 100 KB`);
    assert.match(m.cameraOrbit, /^-?\d+deg \d+deg (auto|\d+%)$/);
    assert.ok(m.posterAlt?.length > 10);
  }
});

test("Kennzeichnung bleibt: Beispielmodell · CC0 und Credits", () => {
  const app = read("src/components/Labs/ArViewer/ArViewerApp.js");
  assert.match(app, /Beispielmodell · CC0/);
  for (const m of AR_MODELS) if (m.credit) assert.match(m.credit.url, /^https:\/\/polyhaven\.com\//);
});

test("Auflage 1: Maßleiste mit Breite, Tiefe, Höhe unter der Bühne", () => {
  const app = read("src/components/Labs/ArViewer/ArViewerApp.js");
  assert.match(app, /data-testid="arv-dims-bar"/);
  for (const l of ["Breite", "Tiefe", "Höhe"]) assert.ok(app.includes(`["${l}", dims.`), l);
});

test("Auflage 1: Hotspots aus bei aktiven Maßen, schmale Bühne mit mehr Abstand, Neuzeichnen bei Sichtbarkeit", () => {
  const st = read("src/components/Labs/ArViewer/ModelStage.js");
  assert.match(st, /showHotspots && !showDims/);
  assert.match(st, /const narrow = mv\.clientWidth < 500/);
  assert.match(st, /max-camera-orbit=\{showDims \?/);
  assert.match(st, /if \(visible\) requestAnimationFrame\(\(\) => requestAnimationFrame\(\(\) => drawRef\.current\?\.\(\)\)\)/);
});

test("3D lädt erst auf Klick (dynamic, ssr:false)", () => {
  const app = read("src/components/Labs/ArViewer/ArViewerApp.js");
  assert.match(app, /dynamic\(\(\) => import\("\.\/ModelStage"\), \{\s*ssr: false/);
});

test("Punkt 6: kein 224-px-Leerraum mehr über der H1", () => {
  const page = read("src/app/[locale]/3d-ansicht/page.js");
  assert.doesNotMatch(page, /lg:pt-56|md:pt-40/);
});
