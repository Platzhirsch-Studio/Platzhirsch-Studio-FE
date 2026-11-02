// node --test tests/unit/ar-viewer-feinschliff.test.mjs
// AR-Viewer, Restliste nach QA R2 (feedback-2.md, P2/P3) und Sortiments-Abdeckung:
//   Pinch-Zoom (FotoZoom + reine Rechnung in src/lib/arviewer/zoom.js)
//   Höhen-Bedingung nur mit Beleg, iPad/iOS-Hinweistext, alt am model-viewer,
//   Standbild + Fortschritt bis „load“, QR vorladen + Skeleton + Live-Status,
//   „Meinten Sie …?“, ClassiCon-Pilot Stufe 2b (Product Sheets)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { clampPan, zoomAt, ZOOM_MAX } from "../../src/lib/arviewer/zoom.js";
import { verifiedDims } from "../../src/lib/arviewer/stage.js";

const root = new URL("../../", import.meta.url);
const src = (p) => readFileSync(new URL(p, root), "utf8");
const json = (p) => JSON.parse(src(p));

test("Zoom: Verschiebung bleibt in der Fläche, 1× ist immer mittig", () => {
  assert.deepEqual(clampPan(1, 50, -20, 400, 300), { x: 0, y: 0 });
  assert.deepEqual(clampPan(2, 500, -500, 400, 300), { x: 200, y: -150 });
  assert.deepEqual(zoomAt({ s: 2, x: 80, y: 10 }, 0.5, 0, 0, 400, 300), { s: 1, x: 0, y: 0 });
  assert.equal(zoomAt({ s: 1, x: 0, y: 0 }, 99, 0, 0, 400, 300).s, ZOOM_MAX);
});

test("Zoom: der Punkt unter den Fingern bleibt stehen", () => {
  // Zoom 1× → 2× um (100, 0): Bildpunkt bei x=100 wandert nicht
  const v = zoomAt({ s: 1, x: 0, y: 0 }, 2, 100, 0, 400, 300);
  assert.equal(v.s, 2);
  assert.equal(v.x, -100);
  assert.equal(100 * 2 + v.x, 100); // Bildpunkt bei 100 px liegt nach dem Zoom wieder bei 100 px
});

test("Zoom: Fotos öffnen per Knopf, Tipp und zwei Fingern; Bild bleibt unverändert", () => {
  const pv = src("src/components/Labs/ArViewer/ProductViewer.js");
  assert.match(pv, /aria-label="Bild vergrößern"/);
  assert.match(pv, /e\.touches\.length === 2 && setZoomOpen\(true\)/);
  // Embla 8 kennt clickAllowed() nicht (Laufzeitfehler, Zoom per Tipp blieb zu); Wisch-Klicks fängt Embla selbst ab
  assert.doesNotMatch(pv, /clickAllowed/);
  assert.match(pv, /aria-roledescription="Folie"[\s\S]{0,900}onClick=\{\(\) => setZoomOpen\(true\)\}/);
  const fz = src("src/components/Labs/ArViewer/FotoZoom.js");
  assert.match(fz, /<dialog/);
  assert.match(fz, /touch-none/);
  for (const l of ["Vergrößern", "Verkleinern", "Zurücksetzen", "Vergrößerung schließen"]) assert.match(fz, new RegExp(`aria-label="${l}"`));
  assert.match(fz, /reducedMotion/);
  assert.match(fz, /object-contain/); // kein Beschnitt, keine Filter
  assert.doesNotMatch(fz, /filter:|mix-blend|object-cover/);
});

test("Höhe: Bedingung nur mit Beleg im Register (Jazz, Foxx)", () => {
  const dims = json("src/lib/arviewer/dims.json").produkte;
  for (const id of ["sun-loungers-jazz-lounger", "sun-loungers-foxx-lounger"]) {
    assert.ok(dims[id].hoeheHinweis && dims[id].hoeheBeleg, id);
    assert.equal(verifiedDims(dims[id]).hoeheHinweis, dims[id].hoeheHinweis);
  }
  assert.match(dims["sun-loungers-jazz-lounger"].hoeheHinweis, /Liegefläche 32 cm/);
  // ohne Beleg kein Hinweis
  assert.equal(verifiedDims({ w: 1, d: 1, h: 1, quelle: "x", hoeheHinweis: "geschätzt" }).hoeheHinweis, null);
  const n = Object.values(dims).filter((d) => d.hoeheHinweis && !d.hoeheBeleg).length;
  assert.equal(n, 0);
  assert.match(src("src/components/Labs/ArViewer/ProductViewer.js"), /arv-hoehe-hinweis/);
});

test("iPad/iPhone ohne Quick Look: Hinweis nennt den Weg zur Kamera", () => {
  const al = src("src/components/Labs/ArViewer/ArLaunch.js");
  assert.match(al, /export function hinweisText/);
  assert.match(al, /platform === "ios-ohne-ar"\) return "In Safari startet hier direkt die Kamera/);
});

test("model-viewer: alt als Attribut, Standbild bis load, Fortschritt aus progress", () => {
  const ms = src("src/components/Labs/ArViewer/ModelStage.js");
  assert.match(ms, /setAttribute\("alt", altText\)/);
  assert.match(ms, /addEventListener\("progress", onProgress\)/);
  const pv = src("src/components/Labs/ArViewer/ProductViewer.js");
  assert.match(pv, /!loadedHere && \(/);
  assert.match(pv, /arv-buehne-standbild/);
});

test("QR: Vorladen bei Hover/Fokus, Skeleton, Live-Status", () => {
  const al = src("src/components/Labs/ArViewer/ArLaunch.js");
  assert.match(al, /onPointerEnter=\{preloadQr\}/);
  assert.match(al, /onFocus=\{preloadQr\}/);
  const ph = src("src/components/Labs/ArViewer/PhoneHandoff.js");
  assert.match(ph, /arv-qr-skeleton/);
  assert.match(ph, /motion-safe:animate-pulse/);
  assert.match(ph, /Auf dem Handy geöffnet/);
});

test("ClassiCon-Pilot 2b: Maße aus Product Sheet, Quelle, Dateien vorhanden", () => {
  const dims = json("src/lib/arviewer/dims.json").produkte;
  const raum = json("src/lib/arviewer/raumbedarf.json").produkte;
  const ids = Object.keys(dims).filter((k) => dims[k].herkunft === "classicon-product-sheet");
  assert.ok(ids.length >= 5, `nur ${ids.length}`);
  for (const id of ids) {
    const d = dims[id];
    assert.match(d.quelle, /^https:\/\/www\.classicon\.com\/files\/classicon\/Product%20Sheets\//);
    assert.ok(existsSync(new URL(d.dokument, root)), d.dokument);
    assert.ok(raum[id], `Register ${id}`);
    for (const f of [raum[id].glb, raum[id].usdz, raum[id].poster]) {
      const p = new URL(`public${f}`, root);
      assert.ok(existsSync(p) && statSync(p).size > 1000, f);
    }
  }
  assert.deepEqual([dims["armchairs-stools-bibendum-armchair"].w, dims["armchairs-stools-bibendum-armchair"].d, dims["armchairs-stools-bibendum-armchair"].h], [90, 79, 72]);
  // Rechte: ClassiCon nur Geometrie (ohne Bildnutzung)
  assert.match(json("src/lib/arviewer/rights.json").marken.ClassiCon.raumbedarf, /ohne Bildnutzung/);
});
