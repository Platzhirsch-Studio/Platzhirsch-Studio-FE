// Ezarri-Konfigurator (Team B): Zustand/Codec, Mischregeln, Flächen gegen das
// Ezarri-Beispiel, Katalog (402 Referenzen + 55 Safe-Varianten), Rezepte, 2D-Vorschau, Bundle-Grenzen,
// Robots-Schalter. Doku: Marktresearch/digital/features/ezarri-konfigurator.md
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    return next(specifier, context);
  },
});

let S, M, G, K, I, P, C, U;
before(async () => {
  const imp = (p) => import(pathToFileURL(path.join(SRC, p)).href);
  S = await imp("lib/ezarri/konfigurator/state.js");
  M = await imp("lib/ezarri/konfigurator/mix.js");
  G = await imp("lib/ezarri/konfigurator/geometry.js");
  K = await imp("lib/ezarri/konfigurator/katalog.js");
  I = await imp("lib/ezarri/konfigurator/katalog-index.js");
  P = await imp("lib/ezarri/konfigurator/preview2d.js");
  C = await imp("lib/ezarri/rechner/core.js");
  U = await imp("lib/ezarri/rechner/url.js");
});

// ---------------------------------------------------------------------------
// Zustand und Codec (Vertrag §7.4 Nr. 1)

test("state: Codec hin und zurück, Schema v1, unbekannte Version → null", () => {
  const s = S.sanitizeState({
    ...S.DEFAULT_STATE,
    szene: "pool",
    becken: { form: "l", l: 12, b: 6, tFlach: 1, tTief: 2.2, treppe: "eck", bank: true, rand: "ueberlauf" },
    format: "50",
    mix: [{ id: "38", anteil: 60 }, { id: "48", anteil: 40, ref: "2502-a-safe" }],
    kanaele: [{ id: "45", lage: "bahnen", breite: 25 }],
    fuge: "4",
    spezial: { corner: true, cove: false, cornerId: "corner-2508-safe" },
    wasser: "ruhig",
    zeit: "abend",
    led: "tuerkis",
    modus: "mix",
    seed: 4711,
  });
  const k = S.encodeState(s);
  assert.match(k, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(S.decodeState(k), s);
  // Vertragsfelder stehen lesbar im JSON
  const raw = JSON.parse(Buffer.from(k, "base64url").toString("utf8"));
  for (const f of ["v", "szene", "becken", "format", "mix", "kanaele", "fuge", "spezial", "wasser", "zeit", "led"]) assert.ok(f in raw, f);
  assert.equal(raw.v, 1);
  assert.equal(S.decodeState(Buffer.from(JSON.stringify({ ...raw, v: 2 })).toString("base64url")), null);
  assert.equal(S.decodeState("kaputt!"), null);
  assert.equal(S.decodeState(""), null);
});

test("state: üblicher Entwurf (Mischung aus 4) ≤ 600 Zeichen, Maximalentwurf ≤ 1000", () => {
  const typisch = S.sanitizeState({
    ...S.DEFAULT_STATE,
    becken: { form: "radius", l: 12.5, b: 6.5, tFlach: 1.15, tTief: 2.05, treppe: "roemisch", bank: true, rand: "ueberlauf" },
    mix: [{ id: "38", anteil: 40 }, { id: "48", anteil: 30 }, { id: "45", anteil: 20 }, { id: "103", anteil: 10 }],
    spezial: { corner: true, cove: true },
    modus: "mix",
    seed: 4711,
  });
  assert.ok(S.encodeState(typisch).length <= 600, `typisch ${S.encodeState(typisch).length}`);
  const s = S.sanitizeState({
    ...S.DEFAULT_STATE,
    becken: { form: "radius", l: 24.5, b: 11.5, tFlach: 1.35, tTief: 2.45, treppe: "voll", bank: true, rand: "infinity" },
    mix: [{ id: "38", anteil: 40 }, { id: "48", anteil: 30, ref: "2502-a-50-safe" }, { id: "45", anteil: 20 }, { id: "103", anteil: 10 }],
    kanaele: [{ id: "45", lage: "bahnen", breite: 25 }, { id: "122", lage: "wasserlinie", breite: 15 }, { id: "1", lage: "stufen", breite: 5 }],
    spezial: { corner: true, cove: true, cornerId: "corner-2508-safe", coveId: "cove-03-d-safe" },
    modus: "pattern",
    pattern: { id: "30", ids: ["38", "45", "48"] },
    wasserton: "naturpool",
    kamera: "unterwasser",
    seed: 99991,
  });
  const k = S.encodeState(s);
  assert.ok(k.length <= 1000, `Länge ${k.length}`);
});

test("state: Grenzen, Formen je Szene, tTief ≥ tFlach, ungültige Werte → Standard", () => {
  const s = S.sanitizeState({ szene: "pool", becken: { form: "achteck", l: 99, b: 0.2, tFlach: 3, tTief: 0.5 }, format: "75", fuge: "9", mix: [{ id: "<script>", anteil: 50 }] });
  assert.equal(s.becken.form, "rechteck");
  assert.equal(s.becken.l, 25);
  assert.equal(s.becken.b, 1.5);
  assert.equal(s.becken.tFlach, 2.5);
  assert.ok(s.becken.tTief >= s.becken.tFlach);
  assert.equal(s.format, "25");
  assert.equal(s.fuge, "1");
  assert.deepEqual(s.mix, S.DEFAULT_STATE.mix.map((e) => ({ ...e })));
  const w = S.withSzene(S.sanitizeState(S.DEFAULT_STATE), "whirlpool");
  assert.equal(w.becken.form, "kreis");
  assert.equal(w.becken.b, w.becken.l);
  assert.equal(S.withSzene(w, "bad").becken.treppe, "keine");
  // unbekannte Mosaike fallen beim Dekodieren heraus
  const k = S.encodeState({ ...S.DEFAULT_STATE, mix: [{ id: "38", anteil: 50 }, { id: "gibtsnicht", anteil: 50 }] });
  assert.deepEqual(S.decodeState(k, { isKnown: (id) => id === "38" }).mix, [{ id: "38", anteil: 100 }]);
});

test("state: Rückgängig/Wiederholen, höchstens 50 Schritte", () => {
  let h = S.createHistory(S.DEFAULT_STATE);
  for (let i = 0; i < 60; i++) h = S.pushHistory(h, { ...h.present, seed: i + 100 });
  assert.equal(h.past.length, 50);
  h = S.undo(h);
  assert.equal(h.present.seed, 158);
  h = S.redo(h);
  assert.equal(h.present.seed, 159);
  assert.equal(S.pushHistory(h, { ...h.present }), h, "gleicher Zustand wird nicht doppelt gespeichert");
});

test("state: Team C liest den Link (rechner/url.js fromKonfigurator)", () => {
  const k = S.encodeState({ ...S.DEFAULT_STATE, becken: { ...S.DEFAULT_STATE.becken, l: 10, b: 5, tFlach: 1, tTief: 2, treppe: "keine" }, format: "50", mix: [{ id: "38", anteil: 70 }, { id: "48", anteil: 30 }] });
  const r = U.fromKonfigurator(k);
  assert.ok(r);
  assert.equal(r.eingabe.l, 10);
  assert.equal(r.eingabe.format, "50");
  assert.deepEqual(r.mix, [{ id: "38", anteil: 70 }, { id: "48", anteil: 30 }]);
});

// ---------------------------------------------------------------------------
// Mischung (Vertrag §7.4 Nr. 4)

test("mix: Summe immer 100, höchstens 4, nicht mischbar steht allein", () => {
  const mx = (id) => id !== "nm";
  let r = M.addToMix([{ id: "a", anteil: 100 }], "b", mx);
  assert.deepEqual(r.mix.map((e) => e.anteil), [50, 50]);
  r = M.addToMix(r.mix, "c", mx);
  assert.equal(r.mix.reduce((s, e) => s + e.anteil, 0), 100);
  r = M.addToMix(r.mix, "d", mx);
  assert.equal(M.addToMix(r.mix, "e", mx).hinweis, "voll");
  const alone = M.addToMix(r.mix, "nm", mx);
  assert.equal(alone.hinweis, "allein");
  assert.deepEqual(alone.mix, [{ id: "nm", anteil: 100 }]);
  assert.equal(M.canMix([{ id: "a" }, { id: "nm" }], mx).ok, false);
  assert.equal(M.addToMix([{ id: "a", anteil: 100 }], "a", mx).hinweis, "vorhanden");
});

test("mix: Anteil setzen und Grenze ziehen halten Summe 100 und Mindestwert 1 %", () => {
  const mix = [{ id: "a", anteil: 40 }, { id: "b", anteil: 30 }, { id: "c", anteil: 30 }];
  for (const v of [-5, 0, 1, 37, 99, 120]) {
    const s = M.setShare(mix, 1, v);
    assert.equal(s.reduce((x, e) => x + e.anteil, 0), 100, `setShare ${v}`);
    assert.ok(s.every((e) => e.anteil >= 1));
  }
  const b = M.setBoundary(mix, 0, 55);
  assert.deepEqual(b.map((e) => e.anteil), [55, 15, 30]);
  assert.deepEqual(M.setBoundary(mix, 1, 100).map((e) => e.anteil), [40, 59, 1]);
  assert.deepEqual(M.boundaries(mix), [40, 70]);
  assert.deepEqual(M.removeFromMix(mix, "a").map((e) => e.anteil), [50, 50]);
});

test("mix: Zuteilung je Stein deterministisch und nahe an den Anteilen", () => {
  const mix = [{ id: "a", anteil: 70 }, { id: "b", anteil: 30 }];
  const a1 = M.cellAssignment(7, mix, 120, 120);
  const a2 = M.cellAssignment(7, mix, 120, 120);
  assert.deepEqual(a1, a2);
  const [c0, c1] = M.countAssignment(a1, 2);
  assert.ok(Math.abs(c0 / (c0 + c1) - 0.7) < 0.03, `Anteil ${c0 / (c0 + c1)}`);
  assert.notDeepEqual(M.cellAssignment(8, mix, 40, 40), M.cellAssignment(7, mix, 40, 40));
});

// ---------------------------------------------------------------------------
// Flächen (Vertrag §7.4 Nr. 2) gegen Ezarris Rechner-Beispiel

test("geometry: 10 × 5 m, Tiefe 1/2 m, 10 % → 106 m², 265 kg Kleber, 127 kg Fuge (Ezarri)", () => {
  const b = { form: "rechteck", l: 10, b: 5, tFlach: 1, tTief: 2, treppe: "keine", bank: false, rand: "skimmer" };
  const a = G.areas(b);
  assert.equal(a.boden, 50);
  assert.equal(a.gesamt, 95);
  assert.equal(a.waende.reduce((s, w) => s + w.m2, 0), 45);
  const q = C.quantities({ flaechen: a, margeProzent: 10, format: "25" });
  assert.equal(q.m2, 106);
  assert.equal(q.kgKleber, 265);
  assert.equal(q.kgFuge, 127);
  assert.equal(a.kantenLfm.corner, 30);
});

test("geometry: alle Formen, Treppen und Szenen liefern plausible, positive Flächen", () => {
  for (const form of ["rechteck", "radius", "rund", "l"]) {
    for (const treppe of G.TREPPEN_JE_FORM[form]) {
      const b = { form, l: 9, b: 4.5, tFlach: 1.1, tTief: 1.9, treppe, bank: true, rand: "skimmer" };
      const a = G.areas(b);
      const grund = Math.abs(G.polygonArea(G.outline(b)));
      assert.ok(a.boden > 0 && a.boden <= grund + 1e-6, `${form}/${treppe} Boden`);
      assert.ok(a.gesamt > grund, `${form}/${treppe} gesamt`);
      assert.equal(G.steps(b).length > 0, treppe !== "keine", `${form}/${treppe} Stufen`);
      for (const st of G.steps(b)) assert.ok(st.pts.length >= 3 && st.yTop < 0);
    }
  }
  // Formen mit nicht erlaubter Treppe fallen auf die erste erlaubte zurück
  assert.equal(G.treppeFuerForm({ form: "rund", treppe: "voll" }), "roemisch");
  const w = G.areas({ form: "kreis", l: 2.2, b: 2.2, tFlach: 0.9, tTief: 0.9, bank: true }, "whirlpool");
  assert.ok(w.bank > 0 && w.waende[0].m2 > 0);
  assert.equal(G.areas({ l: 1.8, b: 1.2, tTief: 2.4 }, "bad").gesamt, 12.24);
  assert.equal(G.areas({ l: 3, tTief: 0.6 }, "kueche").gesamt, 1.8);
  for (const sz of ["pool", "whirlpool", "bad", "kueche"]) {
    const start = S.BECKEN_START[sz];
    assert.ok(G.cameraPresets(start, sz).uebersicht, sz);
  }
});

// ---------------------------------------------------------------------------
// Katalog: jede Referenz wählbar und darstellbar

test("katalog: alle 402 Referenzen + 55 Safe-Varianten mit gemessenen Farben, alle 201 Konfigurator-Mosaike auflösbar", () => {
  const kat = K.getKonfiguratorKatalog();
  assert.equal(kat.refs.length, 402 + 55);
  for (const r of kat.refs) {
    assert.ok(r.pal.length >= 1 && r.pal.length <= 6, r.id);
    assert.equal(r.pal.reduce((s, p) => s + p[1], 0) > 95, true, r.id);
    assert.ok(r.pal.every((p) => /^#[0-9a-f]{6}$/.test(p[0])), r.id);
    assert.equal(r.fin.length, 3);
    assert.ok(r.img, `Bild ${r.id}`);
    assert.ok(fs.existsSync(path.join(ROOT, "public", `${r.img}-600.webp`)), `Datei ${r.img}`);
  }
  const konf = JSON.parse(read("src/lib/ezarri/configurator.json"));
  const idx = I.buildIndex(kat);
  for (const m of konf.mosaike) assert.ok(idx.mosaic(m.id), `Konfigurator-Mosaik ${m.id}`);
  // jede Referenz ist über ihre Mosaik-ID und ihr Format wieder erreichbar
  for (const r of kat.refs.filter((x) => x.typ !== "corner" && x.typ !== "cove")) {
    const back = idx.resolveRef(r.mid, r.fmt || "25", { ref: r.id });
    assert.equal(back?.id, r.id, `resolve ${r.id}`);
  }
  assert.equal(kat.rezepte.length, 57);
  assert.ok(kat.rezepte.every((x) => x.mix.reduce((s, e) => s + e.anteil, 0) === 100 && x.mix.length <= 4));
  assert.equal(kat.patterns.length, 20);
  for (const p of kat.patterns) {
    assert.equal(p.maske.length, p.w * p.h);
    assert.equal(p.kanaele, konf.patterns.find((x) => x.id === p.id).kanaele, `Pattern ${p.id} Kanäle`);
  }
  assert.equal(kat.fugen.length, 7);
});

test("katalog: Teilkatalog für den ersten Render klein, voller Katalog ≤ 40 KB gzip", () => {
  const full = zlib.gzipSync(JSON.stringify(K.getKonfiguratorKatalog())).length;
  const teil = zlib.gzipSync(JSON.stringify(K.katalogFuer(S.sanitizeState(S.DEFAULT_STATE)))).length;
  assert.ok(full <= 40 * 1024, `voll ${full}`);
  assert.ok(teil <= 5 * 1024, `teil ${teil}`);
  const t = K.katalogFuer(S.sanitizeState(S.DEFAULT_STATE));
  assert.ok(I.hasAll(I.buildIndex(t), S.sanitizeState(S.DEFAULT_STATE)));
});

// ---------------------------------------------------------------------------
// 2D-Vorschau (Vertrag §7.4 Nr. 4)

function fakeCtx() {
  const c = { img: null, createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), putImageData(i) { c.img = i; }, save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, fillRect() {} };
  return c;
}

test("preview2d: Mosaik mit Fuge, Draufsicht für alle Szenen, Vorher/Nachher", () => {
  const index = I.buildIndex(K.getKonfiguratorKatalog());
  const st = S.sanitizeState({ ...S.DEFAULT_STATE, fuge: "3" });
  const c = fakeCtx();
  P.drawMosaic(c, { state: st, index, width: 120, height: 80, stonePx: 16 });
  const d = c.img.data;
  let dark = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] < 40 && d[i + 1] < 40 && d[i + 2] < 40) dark++;
  assert.ok(dark > 200, "schwarze Fuge sichtbar");
  for (const sz of ["pool", "whirlpool", "bad", "kueche"]) {
    const s2 = S.withSzene(st, sz);
    const c2 = fakeCtx();
    P.drawPlan(c2, { state: s2, index, width: 160, height: 100, vorher: S.sanitizeState({ ...s2, mix: [{ id: "45", anteil: 100 }] }), split: 0.5 });
    assert.equal(c2.img.width, 160);
    assert.ok(c2.img.data.some((v, i) => i % 4 !== 3 && v > 0));
  }
  // Wasser macht flach heller/türkiser als tief (Beer-Lambert)
  const flach = P.throughWater([0.8, 0.8, 0.8], 0.5);
  const tief = P.throughWater([0.8, 0.8, 0.8], 2.5);
  assert.ok(flach[0] > tief[0] && tief[2] > tief[0]);
});

// ---------------------------------------------------------------------------
// Seiten, Bundle, Recht

test("Seiten: robots über withEzarriRobots/ezarriMetadata, nur Deutsch, keine Händler-Aussage im Code", () => {
  for (const p of ["src/app/[locale]/ezarri/konfigurator/page.js", "src/app/[locale]/ezarri/konfigurator/blatt/page.js"]) {
    const src = read(p);
    // 01.11.2026: de/en/fr/it – Metadaten über toolMetadata (seo.js, ruft withEzarriRobots), Sprachprüfung über TOOL_LOCALES
    assert.match(src, /ezarriMetadata|withEzarriRobots|toolMetadata/);
    assert.match(src, /toolLocaleEnabled\(locale\)\) notFound\(\)/);
  }
  assert.match(read("src/lib/ezarri/konfigurator/seo.js"), /withEzarriRobots\(/);
  assert.match(read("src/app/[locale]/ezarri/konfigurator/blatt/page.js"), /utility: true/);
  assert.match(read("src/app/[locale]/ezarri/konfigurator/katalog/route.js"), /X-Robots-Tag/);
  const dirs = ["src/components/Ezarri/Konfigurator", "src/lib/ezarri/konfigurator", "src/app/[locale]/ezarri/konfigurator"];
  for (const d of dirs) {
    for (const f of fs.readdirSync(path.join(ROOT, d), { recursive: true })) {
      if (!/\.(m?js)$/.test(f)) continue;
      const src = read(path.join(d, f));
      assert.doesNotMatch(src.replace(/^\s*(\/\/|\*).*$/gm, ""), /h(ä|ae)ndler|Vertragsh/i, `${d}/${f}`);
      assert.doesNotMatch(src, /€|EUR\b|Preis:\s*\d/, `${d}/${f} keine Preise`);
    }
  }
});

test("Bundle: three/R3F nur im Lazy-Chunk (Stage3D über next/dynamic, ssr: false)", () => {
  const eager = ["Konfigurator.js", "Stage.js", "Preview2D.js", "controls.js", "MixBand.js", "Mengen.js", "BlattBild.js"];
  for (const f of eager) {
    const src = read(`src/components/Ezarri/Konfigurator/${f}`);
    assert.doesNotMatch(src, /from "three|@react-three|@google\/model-viewer|shader\/mosaic|buildScene/, f);
  }
  assert.match(read("src/components/Ezarri/Konfigurator/Stage.js"), /dynamic\(\(\) => import\("\.\/Stage3D"\), \{ ssr: false/);
  assert.match(read("src/components/Ezarri/Konfigurator/ArAnsicht.js"), /await import\("@google\/model-viewer"\)/);
  // feste dpr, frameloop demand (Lehre Yacht/WebKit)
  const s3 = read("src/components/Ezarri/Konfigurator/Stage3D.js");
  assert.match(s3, /frameloop="demand"/);
  assert.match(s3, /isTouch\(\) \? 1\.25 : 1\.5/);
  assert.doesNotMatch(s3, /PerformanceMonitor/);
  // keine Ordner mit Namen anderer Teams
  for (const d of ["src/components/Ezarri/Konfigurator", "src/lib/ezarri/konfigurator", "src/app/[locale]/ezarri/konfigurator"]) {
    for (const f of fs.readdirSync(path.join(ROOT, d), { recursive: true })) assert.doesNotMatch(f, /upload|concierge|yacht|stilfinder|kuechenplaner|sofaplaner|ar-viewer|arviewer/i, f);
  }
});

// ---------------------------------------------------------------------------
// QM Runde 1: Rezepte unverfälscht (P1-1), Safe-Varianten (P1-2), Poster (P1-3), Standbild (P2-5)

test("rezepte: jedes ausgelieferte Rezept summiert sich OHNE Hochrechnen auf 100 % (Ezarri-Anteile 1:1)", () => {
  const kat = K.getKonfiguratorKatalog();
  const konf = JSON.parse(read("src/lib/ezarri/configurator.json"));
  const roh = new Map(konf.mosaike.map((m) => [m.id, m]));
  const idx = I.buildIndex(kat);
  const voll = kat.rezepte.filter((r) => !r.unvollstaendig);
  assert.ok(voll.length >= 40, `vollständige Rezepte ${voll.length}`);
  for (const r of voll) {
    const m = roh.get(r.id);
    const ids = m.cf_mosaico.split(";");
    const teile = m.mischanteil.split(";").map(Number);
    assert.deepEqual(r.mix.map((e) => e.id), ids, r.name);
    if (r.normalisiert) {
      // Ezarri summiert auf 99 %: nur der größte Anteil +1 (QM R2 P3)
      assert.equal(teile.reduce((a, b) => a + b, 0), 99, r.name);
      const g = teile.indexOf(Math.max(...teile));
      assert.deepEqual(r.mix.map((e) => e.anteil), teile.map((t, i) => t + (i === g ? 1 : 0)), r.name);
      assert.equal(r.mix.reduce((a, e) => a + e.anteil, 0), 100, r.name);
    } else {
      assert.deepEqual(r.mix.map((e) => e.anteil), teile, `${r.name}: Anteile wie bei Ezarri`);
      assert.equal(teile.reduce((a, b) => a + b, 0), 100, r.name);
    }
    for (const e of r.mix) assert.ok(idx.mosaic(e.id), `${r.name}: Bestandteil ${e.id} im Katalog`);
  }
  // unvollständige: nie als Mischung, sondern die Ezarri-Referenz selbst (Produktfoto)
  const mojito = kat.rezepte.find((r) => r.name === "Mojito");
  assert.equal(mojito.unvollstaendig, true);
  assert.deepEqual(mojito.fehlend, ["66"]);
  assert.deepEqual(mojito.mix, [{ id: "214", anteil: 100 }]);
  for (const r of kat.rezepte.filter((x) => x.unvollstaendig)) {
    assert.equal(r.mix.length, 1, r.name);
    assert.equal(r.mix[0].id, r.id, r.name);
    assert.ok(idx.resolveRef(r.id, "25")?.pal?.length, `${r.name}: gemessene Farben`);
  }
  // Alexander Gold (99 %) wird normalisiert, nicht mehr „nach Produktfoto“
  assert.equal(kat.rezepte.find((r) => r.name === "Alexander Gold")?.normalisiert, true);
  for (const n of ["Manhattan", "Daikiri", "Bellini", "Kir Royal", "Bloody Mary", "San Francisco", "Caipirinha", "Long Island", "Blue Moon"]) {
    assert.equal(kat.rezepte.find((r) => r.name === n)?.unvollstaendig, true, n);
  }
});

test("safe: Varianten, die Ezarri nur als ?as-25/?as-50 führt, sind wählbar (Dune 25/50 Safe, Ash 25 Safe)", async () => {
  const kat = K.getKonfiguratorKatalog();
  const idx = I.buildIndex(kat);
  const SV = await import(pathToFileURL(path.join(SRC, "lib/ezarri/konfigurator/safe-varianten.js")).href);
  const refsJson = JSON.parse(read("src/lib/ezarri/references.json")).referenzen;
  const sv = SV.safeVarianten(refsJson);
  assert.equal(sv.length, 55);
  const ids = new Set(refsJson.map((r) => r.id));
  for (const v of sv) {
    assert.ok(!ids.has(v.id), `${v.id} kollidiert nicht`);
    assert.ok(ids.has(v.basis), `${v.id} Basis ${v.basis}`);
    assert.match(v.quelle, /^https:\/\/www\.ezarri\.com\/(de|en)\/.+\?as-(25|50)$/);
  }
  const dune = idx.mosaic(kat.refs.find((r) => r.id === "dune").mid);
  assert.equal(dune.safe["25"], "dune-safe");
  assert.equal(dune.safe["50"], "dune-50-safe");
  assert.equal(idx.mosaic(kat.refs.find((r) => r.id === "ash").mid).safe["25"], "ash-safe");
  assert.equal(idx.mosaic(kat.refs.find((r) => r.id === "ash").mid).safe["50"], "ash-50-safe");
  const ds = idx.byId.get("dune-safe");
  assert.equal(ds.typ, "safe-step");
  assert.equal(ds.basis, "dune");
  assert.equal(ds.q, "https://www.ezarri.com/de/dune?as-25");
  assert.ok(ds.fin[0] <= 0.25);
  // Safe-Format-Wechsel bleibt Safe
  assert.equal(idx.resolveRef(ds.mid, "50", { safe: true }).id, "dune-50-safe");
  // Dune: Ezarri führt nur Corner (cove-dune ist 404, Stand 28.10.2026)
  assert.equal(idx.spezialFuer(ds.mid, "corner")?.id, "corner-dune");
  assert.equal(idx.spezialFuer(ds.mid, "cove"), null);
});

test("poster: Vorschaubild passt zum Startentwurf, WebP ≤ 80 KB, eigene Quelle", () => {
  const p = JSON.parse(read("src/lib/ezarri/konfigurator/poster.json"));
  assert.equal(p.k, S.encodeState(S.sanitizeState(S.DEFAULT_STATE)), "Poster neu rendern: node src/lib/ezarri/konfigurator/tools/poster.mjs");
  const file = path.join(ROOT, "public", p.bild);
  assert.ok(fs.existsSync(file));
  assert.ok(fs.statSync(file).size <= 80 * 1024, `Poster ${fs.statSync(file).size} B`);
  assert.match(p.quelle, /eigenes Rendering/);
});

test("3D-Umgebung prozedural (kein Download), Wasser spiegelt die Umgebung, Beckenkopf mit Fase", () => {
  const u = read("src/components/Ezarri/Konfigurator/umgebung.js");
  assert.doesNotMatch(u, /TextureLoader|RGBELoader|fetch\(|\.hdr|\.ktx2/);
  const s3 = read("src/components/Ezarri/Konfigurator/Stage3D.js");
  assert.match(s3, /CubeCamera/);
  assert.match(read("src/lib/ezarri/konfigurator/shader/mosaic.js"), /textureCube\(uEnv, R\)/);
  assert.match(read("src/components/Ezarri/Konfigurator/buildScene.js"), /bevelEnabled: true/);
  assert.match(read("src/components/Ezarri/Konfigurator/BlattBild.js"), /Visualisierung, Farben angenähert/);
  assert.doesNotMatch(read("src/app/[locale]/ezarri/konfigurator/blatt/page.js"), /\(\{r\?\.id\}\)/, "keine interne ID auf dem Blatt");
});

test("QM R2: Vorschau-Masken klein, Startkamera zeigt die Treppe (Blick zur flachen Seite)", () => {
  const p = JSON.parse(read("src/lib/ezarri/konfigurator/poster.json"));
  for (const f of [p.basis, p.gain]) {
    const st = fs.statSync(path.join(ROOT, "public", f));
    assert.ok(st.size <= 40 * 1024, `${f}: ${st.size} B`);
  }
  assert.equal(p.maskeBreite, 720);
  const start = S.sanitizeState(S.DEFAULT_STATE).becken;
  const u = G.cameraPresets(start, "pool").uebersicht;
  assert.ok(u.pos[0] > u.target[0], "Kamera steht an der tiefen Seite und blickt zur Treppe (−x)");
  assert.ok(u.pos[1] <= 1.3, "tiefer als Runde 1");
  const inf = G.cameraPresets({ ...start, rand: "infinity" }, "pool").uebersicht;
  assert.ok(inf.pos[0] < inf.target[0], "Infinity: Blick über die Kante zum See (+x)");
});
