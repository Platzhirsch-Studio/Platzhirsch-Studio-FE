// node --test tests/unit/ar-viewer-raumbedarf.test.mjs
// AR-Viewer Runde 2 (QA R1): Stufe 2b Raumbedarf, fertige USDZ, Maßquellen,
// Minotti-Zuordnung, Suche mit Synonymen/Tippfehlern, QR-Origin.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolveStage, hatRaum, STUFEN } from "../../src/lib/arviewer/stage.js";
import { parseQuery, querySortiment, editDistance, matches } from "../../src/lib/arviewer/query.js";
import { footprintFor } from "../../src/lib/arviewer/geometry.js";
import { footprintAxes } from "../../scripts/arviewer/ar-foto.mjs";
import { boxFaces, buildRaumbedarf } from "../../scripts/arviewer/raumbedarf.mjs";
import { readGlb, readZipStored, crc32 } from "../../scripts/arviewer/lib/glb-usdz.mjs";
import { splitName, wantedKind, pickElement } from "../../scripts/arviewer/raumbedarf-masse.mjs";

const root = new URL("../../", import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const DIMS = json("src/lib/arviewer/dims.json").produkte;
const RAUM = json("src/lib/arviewer/raumbedarf.json").produkte;
const AR = json("src/lib/arviewer/arfotos.json").produkte;
const RIGHTS = json("src/lib/arviewer/rights.json");

function checkUsdz(buf, label) {
  const files = readZipStored(buf);
  assert.equal(files[0].name, "model.usda", `${label}: Wurzel-Layer zuerst`);
  for (const f of files) {
    assert.equal(f.start % 64, 0, `${label}: ${f.name} nicht auf 64 Byte ausgerichtet`);
    assert.equal(crc32(f.data), f.crc, `${label}: CRC ${f.name}`);
  }
  const usda = files[0].data.toString();
  assert.match(usda, /^#usda 1\.0/);
  assert.match(usda, /metersPerUnit = 1/);
  assert.match(usda, /upAxis = "Y"/);
  for (const m of usda.matchAll(/@(textures\/[^@]+)@/g)) assert.ok(files.some((f) => f.name === m[1]), `${label}: fehlt ${m[1]}`);
  return usda;
}

test("Ziel P1-1: ≥ 100 Produkte mit Ansicht im Raum, ≥ 30 Minotti-Sofas/-Sessel, jedes mit Herstellerquelle", () => {
  const raum = new Set([...Object.keys(RAUM), ...Object.keys(AR)]);
  assert.ok(raum.size >= 100, `nur ${raum.size}`);
  const minotti = Object.entries(DIMS).filter(([p, d]) => d.herkunft === "minotti-technical-sheet" && RAUM[p] && /^(sofas|armchairs|tables|produkt|chairs|lounge|stools|little)/.test(p));
  assert.ok(minotti.length >= 30, `nur ${minotti.length} Minotti`);
  for (const [p, d] of Object.entries(DIMS)) {
    assert.match(d.quelle, /^https:\/\//, p);
    assert.ok(d.dokument, `${p}: lokale Kopie / Datensatz fehlt`);
    assert.match(d.geprueft, /^\d{4}-\d{2}-\d{2}$/, p);
  }
});

test("Raumbedarf: GLB exakt B × T × H, USDZ gültig, ohne Herstellerbild, im Budget", () => {
  for (const [p, r] of Object.entries(RAUM)) {
    const d = DIMS[p];
    assert.ok(d, `${p}: keine Maße`);
    assert.deepEqual([r.w, r.d, r.h], [d.w, d.d, d.h], p);
    assert.equal(r.bildnutzung, "keine", p);
    const glb = readFileSync(new URL(`public${r.glb}`, root));
    assert.ok(glb.length < 120 * 1024, `${p}: GLB zu groß`);
    const meshes = readGlb(glb);
    const all = meshes.flatMap((m) => m.pos);
    const ax = (k) => all.filter((_, i) => i % 3 === k);
    const span = (k) => Math.max(...ax(k)) - Math.min(...ax(k));
    assert.ok(Math.abs(span(0) - d.w / 100) < 1e-4, `${p}: Breite`);
    assert.ok(Math.abs(span(1) - d.h / 100) < 1e-4, `${p}: Höhe`);
    assert.ok(Math.abs(span(2) - d.d / 100) < 1e-4, `${p}: Tiefe`);
    assert.ok(Math.min(...ax(1)) >= 0, `${p}: unter dem Boden`);
    const usdz = readFileSync(new URL(`public${r.usdz}`, root));
    assert.ok(usdz.length < 200 * 1024, `${p}: USDZ zu groß`);
    checkUsdz(usdz, p);
    assert.ok(statSync(new URL(`public${r.poster}`, root)).size < 60 * 1024, `${p}: Poster`);
  }
});

test("AR-Foto: fertiges USDZ je Produkt, Foto an der Vorderkante der Grundfläche", () => {
  for (const [p, a] of Object.entries(AR)) {
    assert.ok(a.usdz && existsSync(new URL(`public${a.usdz}`, root)), `${p}: USDZ fehlt`);
    checkUsdz(readFileSync(new URL(`public${a.usdz}`, root)), p);
    const meshes = readGlb(readFileSync(new URL(`public${a.glb}`, root)));
    const photo = meshes.find((m) => /^Foto/.test(m.name));
    const z = photo.pos.filter((_, i) => i % 3 === 2);
    assert.ok(Math.abs(z[0] - footprintAxes(a).z / 200) < 1e-4, `${p}: Foto nicht an der Vorderkante`);
  }
});

test("boxFaces/buildRaumbedarf: sechs Flächen, Ursprung in der Mitte der Grundfläche", async () => {
  const f = boxFaces({ w: 200, d: 100, h: 80 });
  assert.equal(Object.keys(f).length, 6);
  assert.deepEqual(f.front.pos.slice(0, 3), [-1, 0, 0.5]);
  const { glb, usdz } = await buildRaumbedarf({ w: 50, d: 40, h: 90, brand: "Test", name: "Hocker & Co <x>" });
  assert.equal(glb.readUInt32LE(8), glb.length);
  const usda = checkUsdz(usdz, "test");
  assert.doesNotMatch(usda, /<x>/); // Name nur escaped/ohne Sonderzeichen im Layer
});

test("Stufe 2b gilt auch bei Bildverbot (Minotti), AR-Foto bleibt dort gesperrt", () => {
  const base = { brand: "Minotti", hasImage: true, rights: RIGHTS.marken.Minotti, dims: { quelle: "https://m", w: 1, d: 1, h: 1 } };
  assert.equal(resolveStage({ ...base, raumbedarf: { glb: "/r.glb" } }).stufe, "raumbedarf");
  assert.equal(resolveStage({ ...base, raumbedarf: { glb: "/r.glb" }, arFoto: { glb: "/a.glb" } }).stufe, "raumbedarf");
  assert.equal(resolveStage({ ...base, raumbedarf: { glb: "/r.glb" }, dims: null }).stufe, "bild");
  assert.equal(STUFEN.raumbedarf.nr, "2b");
  assert.ok(hatRaum("raumbedarf") && hatRaum("ar-foto") && !hatRaum("bild"));
  assert.equal(RIGHTS.raumbedarf.bildnutzung, "keine");
  for (const r of Object.values(RIGHTS.marken)) assert.match(r.raumbedarf, /ohne Bildnutzung/);
});

test("Minotti-Zuordnung: Name → Familie/Elementart, „(Armchairs 2)“ nimmt das zweite Element", () => {
  assert.deepEqual(splitName("Lawson (Armchairs 2)"), { full: "lawson armchairs 2", base: "lawson", tag: "armchairs 2", nr: 2 });
  assert.equal(wantedKind({ name: "Yang \"Ottoman\"", category: "armchairs-stools" }), "hocker");
  assert.equal(wantedKind({ name: "Lawson (Dining)", category: "dining-chairs" }), "dining");
  assert.equal(wantedKind({ name: "Connery", category: "sofas-couches" }), "sofa");
  const fam = json("src/lib/sofaplaner/minotti/lawson.json");
  const one = pickElement(fam, { name: "Lawson (Armchairs)", category: "armchairs-stools" });
  const two = pickElement(fam, { name: "Lawson (Armchairs 2)", category: "armchairs-stools" });
  assert.notDeepEqual([one.el.breite_cm, one.el.tiefe_cm], [two.el.breite_cm, two.el.tiefe_cm]);
  assert.equal(DIMS["tables-connery"].w, 214);
});

test("Suche: Synonyme, Tippfehler (≤ 1 ab 5 Zeichen), Standardliste ohne „ohne Bild“, Chip „raum“", () => {
  const items = [
    { id: "a", name: "Connery", brand: "Minotti", brandKey: "minotti", category: "sofas-couches", categoryLabel: "Sofas & Couches", stufe: "raumbedarf" },
    { id: "b", name: "Arco", brand: "Flos", brandKey: "flos", category: "lamps", categoryLabel: "Leuchten", stufe: "bild" },
    { id: "c", name: "Arthur", brand: "BvE", brandKey: "bve", category: "lamps", categoryLabel: "Leuchten", stufe: "ohne-bild" },
    { id: "d", name: "Jazz", brand: "Solpuri", brandKey: "solpuri", category: "garden-chairs", categoryLabel: "Gartenstühle", stufe: "ar-foto" },
  ];
  const meta = { brands: [], categories: [] };
  assert.equal(editDistance("conery", "connery"), 1);
  assert.ok(matches({ ...items[0] }, ["conery"]));
  assert.ok(!matches({ ...items[1] }, ["arcx"])); // unter 5 Zeichen keine Toleranz
  // Fix-Runde 1 (F2): bewusst geändert – „Noch ohne Bild“ auch in der Suche nicht mehr öffentlich (vorher ["b", "c"]).
  assert.deepEqual(querySortiment(items, parseQuery({ q: "lampe" }, meta)).items.map((i) => i.id).sort(), ["b"]);
  assert.equal(parseQuery({ stufe: "ohne-bild" }, meta).stufe, "");
  assert.deepEqual(querySortiment(items, parseQuery({ q: "couch" }, meta)).items.map((i) => i.id), ["a"]);
  const def = querySortiment(items, parseQuery({}, meta));
  assert.equal(def.total, 3);
  assert.equal(def.counts.stufe["ohne-bild"], 1);
  const raum = querySortiment(items, parseQuery({ stufe: "raum" }, meta));
  assert.deepEqual(raum.items.map((i) => i.id), ["d", "a"]);
  assert.equal(raum.counts.stufe.raum, 2);
});

test("UI: QR aus SITE_URL mit ?von=qr, Ruhezone 4 Module, AR-Start ohne Bühne, Fehlerfall lokal", () => {
  const src = (p) => readFileSync(new URL(p, root), "utf8");
  const launch = src("src/components/Labs/ArViewer/ArLaunch.js");
  assert.match(launch, /SITE_URL/);
  assert.match(launch, /\?von=qr/);
  assert.match(launch, /rel", "ar"/);
  assert.match(launch, /allowsContentScaling=0/);
  assert.match(launch, /resizable: "false"/);
  assert.doesNotMatch(launch, /window\.location\.href\)\s*;?\s*\n\s*u\.search/);
  assert.match(src("src/components/Labs/ArViewer/PhoneHandoff.js"), /margin: 4/);
  const pv = src("src/components/Labs/ArViewer/ProductViewer.js");
  assert.match(pv, /Erneut versuchen/);
  assert.match(pv, /dimsBox/);
  const stage = src("src/components/Labs/ArViewer/ModelStage.js");
  assert.match(stage, /webkit \? 15000 : 30000/);
  assert.match(stage, /tabIndex=\{0\}/);
  const filters = src("src/components/Labs/ArViewer/Sortiment/SortimentFilters.js");
  assert.match(filters, /if \(!ready\) return;/);
  assert.match(filters, /push: true/);
  // Fix-Runde 1 (F2): bewusst geändert – Marken ohne Treffer werden ausgeblendet statt deaktiviert.
  assert.match(filters, /if \(!n && sel\.marke !== b\.key\) return null;/);
  assert.match(filters, /webkit-search-cancel-button\]:appearance-none/);
  assert.deepEqual(footprintFor({ w: 73, d: 200 }), { x: 200, z: 73, laengs: true });
  assert.deepEqual(footprintFor({ w: 73, d: 200 }, false), { x: 73, z: 200, laengs: false });
});
