// node --test tests/unit/ar-viewer-sortiment.test.mjs
// AR-Viewer für das ganze Sortiment: Stufenlogik, Rechte, Maße nur aus
// Herstellerquelle, AR-Foto-Assets (GLB gültig, im Budget), Suche/Filter.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";
import { resolveStage, verifiedDims, STUFEN } from "../../src/lib/arviewer/stage.js";
import { parseQuery, querySortiment, pageList, listHref, PAGE_SIZE } from "../../src/lib/arviewer/query.js";
import { photoSize, footprintAxes, eligibility, buildGlb } from "../../scripts/arviewer/ar-foto.mjs";

const root = new URL("../../", import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const RIGHTS = json("src/lib/arviewer/rights.json");
const DIMS = json("src/lib/arviewer/dims.json");
const AR = json("src/lib/arviewer/arfotos.json");
const SOURCES = json("src/lib/arviewer/sources.json");

test("Rechte-Register deckt jede Marke der Inventur ab, Werte nur ja/nein/unklar", () => {
  for (const brand of Object.keys(SOURCES.marken)) assert.ok(RIGHTS.marken[brand], `fehlt: ${brand}`);
  for (const [b, r] of Object.entries(RIGHTS.marken)) {
    assert.match(r.veraenderung, /^(ja|nein|unklar)$/, b);
    assert.ok(r.beleg.length > 10 && r.quelle, b);
  }
  for (const b of ["Minotti", "Poliform", "Sifas", "Umbrosa", "Treca"]) assert.equal(RIGHTS.marken[b].veraenderung, "nein", b);
});

test("Minotti: öffentlich nie AR-Foto, intern nur mit Kennzeichnung", () => {
  const base = { brand: "Minotti", hasImage: true, rights: RIGHTS.marken.Minotti, arFoto: { glb: "/x.glb" }, dims: { quelle: "https://x", w: 1, d: 1, h: 1 } };
  const pub = resolveStage(base);
  assert.equal(pub.stufe, "bild");
  assert.match(pub.gesperrt, /untersagt/);
  const intern = resolveStage({ ...base, intern: true });
  assert.equal(intern.stufe, "ar-foto");
  assert.equal(intern.nurIntern, true);
});

// Fix-Runde 1 (F2, P0): Erwartung bewusst geändert – „unklar“ gilt öffentlich wie
// „nein“ (Bildansicht statt freigestelltem AR-Foto, kein „Labs-Test“-Hinweis),
// das AR-Foto gibt es nur noch intern mit Kennzeichnung.
test("AR-Foto braucht Asset UND Herstellermaße; unklare Rechte → öffentlich Bildansicht ohne Hinweis", () => {
  const r = { ...RIGHTS.marken.Solpuri, veraenderung: "unklar" };
  assert.equal(resolveStage({ brand: "Solpuri", hasImage: true, rights: r, arFoto: { glb: "/a.glb" } }).stufe, "bild");
  const dims = { quelle: "https://s", w: 1, d: 1, h: 1 };
  const pub = resolveStage({ brand: "Solpuri", hasImage: true, rights: r, arFoto: { glb: "/a.glb" }, dims });
  assert.equal(pub.stufe, "bild");
  assert.equal(pub.hinweis, null);
  assert.equal(pub.nurIntern, false);
  const intern = resolveStage({ brand: "Solpuri", hasImage: true, rights: r, arFoto: { glb: "/a.glb" }, dims, intern: true });
  assert.equal(intern.stufe, "ar-foto");
  assert.equal(intern.nurIntern, true);
  assert.match(intern.hinweis, /Interne Vorschau/);
  const ja = resolveStage({ brand: "Solpuri", hasImage: true, rights: { ...r, veraenderung: "ja" }, arFoto: { glb: "/a.glb" }, dims });
  assert.equal(ja.stufe, "ar-foto");
  assert.equal(ja.hinweis, null);
  for (const v of ["ja", "nein", "unklar"]) {
    const x = resolveStage({ brand: "Solpuri", hasImage: true, rights: { ...r, veraenderung: v }, arFoto: { glb: "/a.glb" }, dims });
    assert.doesNotMatch(String(x.hinweis || ""), /Labs/);
  }
  assert.equal(resolveStage({ brand: "X", hasImage: false }).stufe, "ohne-bild");
});

test("Herstellermodell ohne Freigabe bleibt gesperrt, Ausblick nennt die Quelle", () => {
  const s = resolveStage({ brand: "ClassiCon", hasImage: true, rights: RIGHTS.marken.ClassiCon, model3d: { src: "/m.glb" }, source3d: { url: "https://c", format: "zip (3DS/DWG)" } });
  assert.equal(s.stufe, "bild");
  assert.match(s.ausblick[0], /3DS\/DWG/);
  const brandOnly = resolveStage({ brand: "Flos", hasImage: true, rights: RIGHTS.marken.Flos, brand3d: "public", catalogDims: true });
  assert.match(brandOnly.ausblick.join(" "), /Zuordnung/);
  assert.match(brandOnly.ausblick.join(" "), /Maße vom Hersteller bestätigt/);
});

test("Maße nur mit Herstellerquelle (URL), sonst null", () => {
  assert.equal(verifiedDims(null), null);
  assert.equal(verifiedDims({ w: 1, d: 2, h: 3 }), null);
  for (const [p, d] of Object.entries(DIMS.produkte)) {
    const v = verifiedDims(d);
    assert.ok(v, p);
    assert.match(d.quelle, /^https:\/\//, p);
  }
});

test("Pilot: jedes AR-Foto hat Herstellermaße, eine Marke ohne Verbot, gültige GLB im Budget", () => {
  const entries = Object.entries(AR.produkte);
  assert.ok(entries.length >= 15, `nur ${entries.length} AR-Fotos`);
  for (const [p, a] of entries) {
    const d = DIMS.produkte[p];
    assert.ok(d, `${p}: keine Herstellermaße`);
    assert.deepEqual([a.w, a.d, a.h], [d.w, d.d, d.h], p);
    assert.notEqual(RIGHTS.marken[a.marke]?.veraenderung, "nein", `${p}: Marke mit Verbot`);
    const glb = new URL(`public${a.glb}`, root);
    assert.ok(existsSync(glb), p);
    const buf = readFileSync(glb);
    assert.equal(buf.readUInt32LE(0), 0x46546c67, `${p}: kein GLB`);
    assert.equal(buf.readUInt32LE(8), buf.length, `${p}: Länge`);
    assert.ok(buf.length < 400 * 1024, `${p}: GLB > 400 KB`);
    assert.ok(statSync(new URL(`public${a.poster}`, root)).size < 120 * 1024, `${p}: Poster > 120 KB`);
    const js = JSON.parse(buf.subarray(20, 20 + buf.readUInt32LE(12)).toString());
    assert.equal(js.materials[0].alphaMode, "BLEND");
    const foot = js.accessors[js.meshes[1].primitives[0].attributes.POSITION];
    const want = footprintAxes(d);
    assert.ok(Math.abs(foot.max[0] - foot.min[0] - want.x / 100) < 1e-4, `${p}: Grundfläche x`);
    assert.ok(Math.abs(foot.max[2] - foot.min[2] - want.z / 100) < 1e-4, `${p}: Grundfläche z`);
  }
});

test("Foto-Fläche: Höhe aus Datenblatt, Breite nie unter 90 % der längsten Seite; Liegen längs", () => {
  const chair = photoSize({ w: 56, d: 64, h: 89 }, 0.73);
  assert.ok(Math.abs(chair.photoH - 0.89) < 1e-9);
  const lounger = photoSize({ w: 73, d: 200, h: 50 }, 1.68);
  assert.ok(Math.abs(lounger.photoW - 1.8) < 1e-9);
  assert.deepEqual(footprintAxes({ w: 73, d: 200 }), { x: 200, z: 73, laengs: true });
  assert.deepEqual(footprintAxes({ w: 80, d: 91 }), { x: 80, z: 91, laengs: false });
});

test("ar-foto.mjs: Verbot, fehlende Maße und zu kleine Bilder werden übersprungen", () => {
  const dims = { w: 1, d: 1, h: 1, quelle: "https://x" };
  assert.equal(eligibility({ brand: "Minotti", dims, hasImage: true, rights: { veraenderung: "nein" } }).grund, "verbot");
  assert.equal(eligibility({ brand: "Minotti", dims, hasImage: true, rights: { veraenderung: "nein" }, intern: true }).grund, "intern");
  assert.equal(eligibility({ brand: "A", dims: null, hasImage: true, rights: null }).grund, "keine_herstellermasse");
  assert.equal(eligibility({ brand: "A", dims, hasImage: true, imageEdge: 720, rights: null }).grund, "bild_zu_klein");
  assert.equal(eligibility({ brand: "A", dims, hasImage: true, imageEdge: 1200, rights: null }).ok, true);
  const glb = buildGlb({ photoPng: Buffer.alloc(8), photoW: 1, photoH: 1, footPng: Buffer.alloc(8), footW: 1, footD: 1, name: "t" });
  assert.equal(glb.readUInt32LE(8), glb.length);
});

const ITEMS = [
  { id: "a", name: "Connery", brand: "Minotti", brandKey: "minotti", category: "sofas-couches", categoryLabel: "Sofas", stufe: "bild" },
  { id: "b", name: "Jazz Stuhl", brand: "Solpuri", brandKey: "solpuri", category: "garden-chairs", categoryLabel: "Gartenstühle", stufe: "ar-foto" },
  ...Array.from({ length: 50 }, (_, i) => ({ id: `x${i}`, name: `Tisch ${i}`, brand: "Eichholtz", brandKey: "eichholtz", category: "tables", categoryLabel: "Tische", stufe: "bild" })),
];
const META = {
  brands: [{ key: "minotti" }, { key: "solpuri" }, { key: "eichholtz" }],
  categories: [{ key: "sofas-couches" }, { key: "garden-chairs" }, { key: "tables" }],
};

test("Suche/Filter: unbekannte Werte fallen weg, Stufe sortiert nach oben, 24 pro Seite", () => {
  const f = parseQuery({ marke: "gibtsnicht", stufe: "xyz", seite: "2" }, META);
  assert.deepEqual([f.marke, f.stufe, f.seite], ["", "", 2]);
  const all = querySortiment(ITEMS, parseQuery({}, META));
  assert.equal(all.items[0].id, "b");
  assert.equal(all.items.length, PAGE_SIZE);
  assert.equal(all.pages, 3);
  assert.equal(all.counts.stufe["ar-foto"], 1);
  const q = querySortiment(ITEMS, parseQuery({ q: "connéry" }, META));
  assert.deepEqual(q.items.map((i) => i.id), ["a"]);
  const m = querySortiment(ITEMS, parseQuery({ marke: "solpuri", stufe: "ar-foto" }, META));
  assert.equal(m.total, 1);
  assert.equal(m.counts.marke.minotti, undefined); // Stufe-Filter wirkt auf Markenzähler
  assert.deepEqual(pageList(5, 20), [1, null, 4, 5, 6, null, 20]);
  assert.equal(listHref({ q: "a b", marke: "", kategorie: "", stufe: "bild", seite: 3 }, { seite: 2 }), "/de/3d-ansicht?q=a+b&stufe=bild&seite=2#sortiment");
  // Runde 2: Stufe 2b „raumbedarf“ dazu (QA R1 P1-1)
  assert.ok(Object.keys(STUFEN).length === 5);
});

// Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9): /de/3d-ansicht ist eine feste, indexierbare Seite; die
// Einzelansichten bleiben noindex (follow), kanonisch ist die Produktseite.
test("Seiten: Übersicht indexierbar, Einzelansicht noindex, 3D nur dynamisch, keine Preise", () => {
  const list = readFileSync(new URL("src/app/[locale]/3d-ansicht/page.js", root), "utf8");
  const prod = readFileSync(new URL("src/app/[locale]/3d-ansicht/[produkt]/page.js", root), "utf8");
  // R7-P4 (Release-Rat R2, seo P2-4, bewusst geändert): Metadaten über werkzeugMetadata() → deOnlyMetadata()
  // (Standard index/follow, canonical + hreflang de/x-default aus WERKZEUGE["3d-ansicht"].path).
  assert.match(list, /werkzeugMetadata\("3d-ansicht"/);
  assert.doesNotMatch(list, /index: false/);
  assert.match(readFileSync(new URL("src/components/Labs/werkzeugSeo.js", root), "utf8"), /"3d-ansicht": \{ path: "\/de\/3d-ansicht"/);
  assert.match(prod, /const robots = \{ index: false, follow: true \}/);
  for (const s of [list, prod]) {
    assert.doesNotMatch(s, /€|EUR\b|Preis:/);
    assert.doesNotMatch(s, /\(Labs\)|Prototyp/);
  }
  const pv = readFileSync(new URL("src/components/Labs/ArViewer/ProductViewer.js", root), "utf8");
  // Runde 2 (QA R1 P2-3): React.lazy statt next/dynamic – nur im Client nach Klick
  // gerendert; „Erneut versuchen“ erzeugt ein neues lazy() und wiederholt import().
  assert.match(pv, /lazy\(\(\) => import\("\.\/ModelStage"\)\)/);
  assert.match(pv, /class StageBoundary extends Component/);
});
