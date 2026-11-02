// Ezarri-Konfigurator „Fotoansicht“: Render-Manifest (48 Visualisierungen) → Zustand.
// Prüft Zuordnung Referenz → Render, Bedingungen (Einzelfarbe, 25 mm, Standardfuge, Pool),
// Rückfälle bei Ansicht/Licht, Dateien in public/ und Pflicht-Bildunterschrift.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    return next(specifier, context);
  },
});

let R, S, K, I, index;
before(async () => {
  const imp = (p) => import(pathToFileURL(path.join(SRC, p)).href);
  R = await imp("lib/ezarri/konfigurator/renders.js");
  S = await imp("lib/ezarri/konfigurator/state.js");
  K = await imp("lib/ezarri/konfigurator/katalog.js");
  I = await imp("lib/ezarri/konfigurator/katalog-index.js");
  index = I.buildIndex(K.getKonfiguratorKatalog());
});

const refFuer = (state) => index.resolveRef(state.mix[0].id, state.format, { ref: state.mix[0].ref });
const mitMix = (mix, patch = {}) => ({ ...S.DEFAULT_STATE, mix, ...patch });

test("Manifest: 48 Renders, 15 Farben, Dateien liegen in public/Images/Ezarri/renders", () => {
  assert.equal(R.RENDERS.length, 48);
  assert.equal(new Set(R.RENDERS.map((r) => r.farbe)).size, 15);
  for (const r of R.RENDERS) {
    assert.ok(R.FOTO_VIEWS.includes(r.view), r.file);
    assert.ok(R.FOTO_LICHTER.includes(r.licht), r.file);
    assert.equal(r.file, `ezarri-${r.serie}-${r.farbe}-${r.view}-${r.licht}.webp`);
    assert.ok(fs.existsSync(path.join(ROOT, "public", R.renderSrc(r))), r.file);
  }
  assert.equal(new Set(R.RENDERS.map((r) => r.file)).size, 48);
});

test("Manifest: jede Render-Farbe ist eine 25-mm-Referenz derselben Serie im Konfigurator-Katalog", () => {
  for (const farbe of new Set(R.RENDERS.map((r) => r.farbe))) {
    const ref = index.byId.get(farbe);
    assert.ok(ref, farbe);
    assert.equal(ref.fmt, "25", farbe);
    assert.equal(ref.safe, false, farbe);
    assert.ok(R.rendersFuer(farbe).every((r) => r.serie === ref.kol), farbe);
    // Über die Mosaik-ID (wie im Zustand) kommt dieselbe Referenz heraus
    const st = mitMix([{ id: ref.mid, anteil: 100 }]);
    const info = R.fotoansicht(st, refFuer(st));
    assert.equal(info.ok, true, farbe);
    assert.equal(info.refId, farbe);
    assert.deepEqual(info.views, ["hero", "wasserlinie", "draufsicht"], farbe);
  }
});

test("Startzustand (Niebla 2508-A, 25 mm, Fuge 1) → Fotoansicht mit Morgen und Abend", () => {
  const st = S.DEFAULT_STATE;
  const info = R.fotoansicht(st, refFuer(st));
  assert.deepEqual(info, { ok: true, refId: "2508-a", views: ["hero", "wasserlinie", "draufsicht"], lichter: ["morgen", "abend"] });
  assert.equal(R.renderFuer("2508-a", "wasserlinie", "abend").file, "ezarri-niebla-2508-a-wasserlinie-abend.webp");
  assert.equal(R.renderFuer("2508-a").file, "ezarri-niebla-2508-a-hero-morgen.webp");
});

test("Licht-Rückfall: ohne Abend-Render gilt Morgen; unbekannte Ansicht → erste vorhandene", () => {
  const info = R.fotoansicht(mitMix([{ id: index.byId.get("azur").mid, anteil: 100 }]), index.byId.get("azur"));
  assert.deepEqual(info.lichter, ["morgen"]);
  assert.equal(R.renderFuer("azur", "draufsicht", "abend").file, "ezarri-iridescent-azur-draufsicht-morgen.webp");
  assert.equal(R.renderFuer("azur", "gibtsnicht", "morgen").view, "hero");
  assert.equal(R.renderFuer("gibtsnicht"), null);
  // Serie muss passen
  assert.equal(R.rendersFuer("azur", "niebla").length, 0);
});

test("Nicht verfügbar: Mischung, Kanäle, Pattern, 50 mm, andere Fuge, andere Szene, Safe, Farbe ohne Render", () => {
  const ref = index.byId.get("2508-a");
  const grund = (patch, r = ref) => R.fotoansicht({ ...S.DEFAULT_STATE, ...patch }, r).grund;
  assert.equal(grund({ mix: [{ id: "38", anteil: 60 }, { id: "48", anteil: 40 }], modus: "mix" }), "mischung");
  assert.equal(grund({ kanaele: [{ id: "45", lage: "bahnen", breite: 25 }] }), "mischung");
  assert.equal(grund({ modus: "pattern", pattern: { id: "1", ids: ["38"] } }), "mischung");
  assert.equal(grund({ format: "50" }), "format");
  assert.equal(grund({ fuge: "4" }), "fuge");
  assert.equal(grund({ szene: "bad" }), "szene");
  assert.equal(grund({}, { ...ref, safe: true, id: "2508-a-safe" }), "farbe");
  assert.equal(grund({}, null), "farbe");
  const ohne = index.byId.get("2510-a") || [...index.byId.values()].find((r) => r.fmt === "25" && !r.safe && !R.rendersFuer(r.id).length);
  assert.equal(grund({}, ohne), "farbe");
  assert.equal(R.fotoansicht(null, ref).ok, false);
  // Über den Zustand: Safe-Wahl löst auf die Safe-Referenz auf → keine Fotoansicht
  const safe = mitMix([{ id: "38", anteil: 100, ref: "2508-a-safe" }]);
  assert.equal(R.fotoansicht(safe, refFuer(safe)).ok, false);
});

test("Texte: Bildunterschrift und Hinweis wie vorgegeben, Komponente zeigt die Bildunterschrift immer", () => {
  assert.equal(R.FOTO_CAPTION.de, "Visualisierung (Rendering), Farbwirkung bitte am Muster prüfen");
  assert.equal(R.FOTO_HINWEIS.de, "Fotoansicht als Beispielbecken 8 × 4 m für Einzelfarben verfügbar");
  const comp = fs.readFileSync(path.join(SRC, "components/Ezarri/Konfigurator/FotoAnsicht.js"), "utf8");
  assert.match(comp, /from "next\/image"/);
  assert.match(comp, /sizes=\{SIZES\}/);
  // 01.11.2026: FR/IT-Bildunterschrift vom Server (X.fotoCaption), de/en wie bisher
  assert.match(comp, /<figcaption[^>]*>\s*\{X\?\.fotoCaption \?\? \(en \? FOTO_CAPTION\.en : FOTO_CAPTION\.de\)\}/);
  assert.match(comp, /motion-reduce:transition-none/);
  const quellen = fs.readFileSync(path.join(ROOT, "docs/bildquellen/QUELLEN-ezarri-renders.md"), "utf8");
  for (const a of ["kloofendal_48d_partly_cloudy_puresky", "qwantani_sunset_puresky", "Travertine009", "wood_floor_deck"]) assert.ok(quellen.includes(a), a);
});
