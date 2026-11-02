// Ezarri-Konfigurator „Fotoansicht“: Render-Manifest (618 Visualisierungen, 205 Farben) → Zustand.
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

// 02.11.2026: Rest-Satz – 618 Renders, 205 Farben (48 + 531 + 18 Nachtrag + 21 Dekor-Motive nach Freigabe; Moss nur 50 mm)
const ANZAHL = 618;
const FARBEN = 205;
// Dekor-/Druckmotive: Rendering zeigt nur die Grundfarbe → Zusatz in der Bildunterschrift
const DEKOR_FARBEN = ["dolphin-family", "happy-dolphins", "sea-view", "border-1-2545-a-2543-d", "border-6-2545-a-2543-d", "d-2", "d-9"];

test(`Manifest: ${ANZAHL} Renders, ${FARBEN} Farben, Dateien liegen in public/Images/Ezarri/renders, keine Duplikate`, () => {
  assert.equal(R.RENDERS.length, ANZAHL);
  assert.equal(new Set(R.RENDERS.map((r) => r.farbe)).size, FARBEN);
  assert.equal(R.RENDER_STAND, "2026-11-02");
  for (const r of R.RENDERS) {
    assert.ok(R.FOTO_VIEWS.includes(r.view), r.file);
    assert.ok(R.FOTO_LICHTER.includes(r.licht), r.file);
    assert.equal(r.file, `ezarri-${r.serie}-${r.farbe}-${r.view}-${r.licht}.webp`);
    assert.ok(fs.existsSync(path.join(ROOT, "public", R.renderSrc(r))), r.file);
  }
  assert.equal(new Set(R.RENDERS.map((r) => r.file)).size, ANZAHL);
  // jede Farbe hat alle drei Ansichten mit Licht „morgen“
  for (const farbe of new Set(R.RENDERS.map((r) => r.farbe))) {
    const views = new Set(R.rendersFuer(farbe).filter((r) => r.licht === "morgen").map((r) => r.view));
    assert.deepEqual([...views].sort(), ["draufsicht", "hero", "wasserlinie"], farbe);
  }
  // keine Datei im Ordner, die das Manifest nicht kennt (und umgekehrt)
  const imOrdner = fs.readdirSync(path.join(ROOT, "public", R.RENDER_DIR)).filter((f) => f.endsWith(".webp")).sort();
  assert.deepEqual(imOrdner, R.RENDERS.map((r) => r.file).sort());
});

test("Dateien: jedes WebP hat 1600 × 1066 px (VP8-Header)", () => {
  // WebP: RIFF…WEBP, dann Chunk „VP8 “ (lossy): Breite/Höhe 14 Bit ab Byte 26
  for (const r of R.RENDERS) {
    const fd = fs.openSync(path.join(ROOT, "public", R.renderSrc(r)), "r");
    const b = Buffer.alloc(32);
    fs.readSync(fd, b, 0, 32, 0);
    fs.closeSync(fd);
    assert.equal(b.toString("ascii", 0, 4), "RIFF", r.file);
    assert.equal(b.toString("ascii", 8, 16), "WEBPVP8 ", r.file);
    assert.equal(b.readUInt16LE(26) & 0x3fff, R.RENDER_BREITE, r.file);
    assert.equal(b.readUInt16LE(28) & 0x3fff, R.RENDER_HOEHE, r.file);
  }
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
  // 02.11.2026: 2510-A hat jetzt ein Rendering; Dune (Gea) ist im Rest-Satz nicht gerendert
  const ohne = [index.byId.get("dune"), ...index.byId.values()].find((r) => r && r.fmt === "25" && !r.safe && !R.rendersFuer(r.id).length);
  assert.ok(ohne, "eine 25-mm-Referenz ohne Rendering");
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

test("Dekor-Motive (02.11.): istDekor greift für die 7 Druck-/Pixel-Motive, nicht für Einzelfarben; Hinweis in Komponente und FR/IT", async () => {
  assert.deepEqual([...R.DEKOR_SERIEN].sort(), ["standard-pixel", "standard-printed"]);
  const dekorImManifest = new Set(R.RENDERS.filter((r) => R.istDekor(r)).map((r) => r.farbe));
  assert.deepEqual([...dekorImManifest].sort(), [...DEKOR_FARBEN].sort());
  for (const farbe of DEKOR_FARBEN) {
    const list = R.rendersFuer(farbe);
    assert.equal(list.length, 3, farbe);
    assert.ok(list.every((r) => R.istDekor(r)), farbe);
    assert.ok(index.byId.get(farbe).kol.startsWith("standard-"), farbe);
  }
  for (const farbe of ["blots", "2508-a", "azur", "aurum"]) assert.equal(R.istDekor(R.renderFuer(farbe)), false, farbe);
  assert.equal(R.istDekor(null), false);
  // Texte: nüchtern, kein „KI“, Pflicht-Unterschrift bleibt davor
  assert.equal(R.FOTO_DEKOR_HINWEIS.de, "Nur Grundfarbe des Motivs, Zeichnung nicht abgebildet.");
  assert.doesNotMatch(R.FOTO_DEKOR_HINWEIS.de + R.FOTO_DEKOR_HINWEIS.en, /\bKI\b|\bAI\b/);
  const comp = fs.readFileSync(path.join(SRC, "components/Ezarri/Konfigurator/FotoAnsicht.js"), "utf8");
  assert.match(comp, /istDekor\(render\) \? \(X\?\.fotoDekorHinweis \?\? \(en \? FOTO_DEKOR_HINWEIS\.en : FOTO_DEKOR_HINWEIS\.de\)\)/);
  assert.match(comp, /data-ezk-foto-dekor=""/);
  assert.ok(comp.indexOf("X?.fotoCaption") < comp.indexOf("{dekorHinweis && <span"), "Zusatz steht nach der Pflicht-Unterschrift");
  const imp = (p) => import(pathToFileURL(path.join(SRC, p)).href);
  const FR = await imp("lib/ezarri/konfigurator/copy.fr.js");
  const IT = await imp("lib/ezarri/konfigurator/copy.it.js");
  assert.match(FR.LISTEN.fotoDekorHinweis, /couleur de fond/i);
  assert.match(IT.LISTEN.fotoDekorHinweis, /colore di fondo/i);
});
