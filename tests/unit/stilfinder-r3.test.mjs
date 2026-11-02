// node --test tests/unit/stilfinder-r3.test.mjs
// Stil-Finder, QA Runde 3 (qa-screenshots/erlebnis/stilfinder/feedback-2.md):
//   P1    Hinweise-Seite: kein Text läuft in die Fußzeile (alle 5 Profile),
//         keine Dateinamen im PDF, KI-Block in der mittleren Spalte
//   P2.1  jede Raum-Leitseite hat ein randabfallendes Bild
//   P2.2  Einschub ≥ 35 % Bedeckung, keine Tom-Dixon-Szenen
//   P2.3  je Raum 1 Stück je Kategorie, höchstens 2 je Marke, Schlafen-Reihenfolge,
//         Essen-Hero kein Bistrotisch
//   P2.4  Lichtseite nie leer, solange es eine Leuchte gibt
//   P2.5  Outdoor-Szene je Profil eigen
//   P2.6  Web-Moodboard: große Kachel = Raumszene (Küche zuletzt), breite Kachel nur Szene;
//         Küchen-Hero je Profil, Phoenix höchstens einmal
//   P2.7  Vorwärmen hält für einen echten Auftrag an; queueMs in den Zeiten
// Läuft offline: künstlicher Katalog, Bilder per sharp.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerStilfinderHooks } from "./stilfinder-hooks.lib.mjs";
import { readFileSync } from "node:fs";
import zlib from "node:zlib";

registerStilfinderHooks();

const sharp = (await import("sharp")).default;
const { PROFILES, PROFILE_ORDER } = await import("../../src/components/Labs/Stilfinder/profiles.js");
const { ROOM_SLOTS, CURATOR_PICKS, LIGHT_KEY, MAX_PER_BRAND, ROOM_SEQUENCE, roomCandidates, isHeroFor, fitsVisible } = await import("../../src/lib/stilfinder/rooms.js");
const { buildMoodboardPdf, ROOM_SCENES, INTRO_IMAGES, HERO_CREDITS } = await import("../../src/lib/stilfinder/build.js");
const { boardItems } = await import("../../src/lib/stilfinder/curate.js");
const { toPdfJpeg, toneToPaper, warmImages } = await import("../../src/lib/stilfinder/images.js");
const { ROOM_ORDER } = await import("../../src/lib/stilfinder/content.js");
const { archiveCreditLine, leadLayout, INSET_MIN_COVERAGE } = await import("../../src/lib/stilfinder/document.js");

const src = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), "utf8");
const H = 595.28;

// ---------- fake catalogue (every slot twice) ----------
function catalog() {
  const byBrand = {};
  let n = 0;
  const add = (brand, cat, name) => {
    n++;
    (byBrand[brand] ||= []).push({
      name: name || `P${n}`,
      produkt_name: name || `Testobjekt ${n}`,
      path_field: `produkt-${n}`,
      marken: brand,
      kategories: cat,
      status: "Aktiv",
      bild_anhangen: [{ bild_anhangen: `/files/t-${n}.webp` }],
    });
  };
  for (const rooms of Object.values(ROOM_SLOTS))
    for (const slots of Object.values(rooms))
      for (const slot of slots) {
        const [brand, cats] = slot.split("|");
        for (const cat of cats.split(",")) for (let k = 0; k < 3; k++) add(brand, cat);
      }
  add("Eichholtz", "dining-tables", "Dining Table Declan Square");
  add("Eichholtz", "dining-tables", "Bar Table Tazi");
  for (const list of Object.values(byBrand)) list.reverse();
  return byBrand;
}

const scene = await sharp({ create: { width: 1600, height: 1100, channels: 3, background: "#b4ab9c" } })
  .composite([{ input: Buffer.from(`<svg width="1600" height="1100"><rect x="200" y="300" width="1200" height="600" fill="#5a4d42"/><circle cx="800" cy="500" r="200" fill="#e9e1d4"/></svg>`) }])
  .jpeg()
  .toBuffer();
// a long, low sofa-like cut-out (the hard case for the inset)
const cut = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: "#ffffff" } })
  .composite([{ input: Buffer.from(`<svg width="1200" height="1200"><rect x="150" y="480" width="900" height="300" fill="#57524c"/></svg>`) }])
  .jpeg()
  .toBuffer();
const sceneImg = await toPdfJpeg(scene);
const cutImg = await toPdfJpeg(cut);
const allCut = async () => cutImg;
let calls = 0;
const mixed = async () => (++calls % 3 === 0 ? sceneImg : cutImg);

// ---------- PDF text positions (content stream of one page) ----------
// react-pdf (pdfkit) writes every text run as "… cm BT 1 0 0 1 x y Tm /F n Tf … ET"
// inside q/Q blocks (the font is set after Tm, the run ends with TJ). This walks the translations and returns, per run, the
// font size and the baseline measured from the TOP of the page.
function pageStreams(buf) {
  const s = buf.toString("latin1");
  const out = [];
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(s))) {
    const st = m.index + m[0].length;
    const en = s.indexOf("endstream", st);
    try {
      const d = zlib.inflateSync(buf.subarray(st, en)).toString("latin1");
      if (/\bBT\b/.test(d) && /\bTm\b/.test(d) && /\bcm\b/.test(d)) out.push(d);
    } catch {
      /* not deflated */
    }
  }
  return out;
}
const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
function textRuns(stream) {
  const toks = stream.split(/\s+/);
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  let size = 0;
  let tm = null;
  const runs = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === "q") stack.push(ctm);
    else if (t === "Q") ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (t === "cm") ctm = mul(ctm, toks.slice(i - 6, i).map(Number));
    else if (t === "Tf") size = Number(toks[i - 1]);
    else if (t === "Tm") tm = mul(ctm, toks.slice(i - 6, i).map(Number));
    else if ((t === "TJ" || t === "Tj") && tm) runs.push({ size, top: H - tm[5] });
  }
  return runs;
}

test("P1: Hinweise-Seite – kein Textblock reicht in die Fußzeile (alle 5 Profile, viele Archivszenen)", { timeout: 180_000 }, async () => {
  const cat = catalog();
  for (const key of PROFILE_ORDER) {
    // all cut-outs → every room uses an archive scene: the longest credit list
    const out = await buildMoodboardPdf({ profile: PROFILES[key], customer: { name: "Ana Krasniqi-Müller", projektLabel: "Neubau", regionLabel: "Vorarlberg" }, roomRows: roomCandidates(key, cat, 7), loadImage: allCut, minImages: 0 });
    const notes = out.plan.indexOf("notes");
    const streams = pageStreams(out.buffer);
    assert.equal(streams.length, out.pages, `${key}: ein Inhaltsstrom je Seite`);
    const runs = textRuns(streams[notes]);
    if (process.env.DEBUG_RUNS) console.log(key, JSON.stringify(runs));
    // footer: 6.8/7.5 pt; its top edge sits at H − 18 − 2 lines
    const footer = runs.filter((r) => r.size < 8 && r.top > H - 60);
    assert.ok(footer.length >= 3, `${key}: Fußzeile gefunden`);
    const footerTop = Math.min(...footer.map((r) => r.top)) - 7;
    const body = runs.filter((r) => r.size >= 8);
    const last = Math.max(...body.map((r) => r.top));
    assert.ok(last < footerTop - 4, `${key}: letzte Textzeile bei ${last.toFixed(1)} pt, Fußzeile ab ${footerTop.toFixed(1)} pt`);
  }
});

test("P1: keine Dateinamen im PDF-Bildnachweis, KI-Block unter Datenschutz", () => {
  for (const c of Object.values(HERO_CREDITS)) assert.doesNotMatch(c, /\.(jpe?g|webp|png)\b/i, c);
  for (const d of [...Object.values(INTRO_IMAGES), ...Object.values(ROOM_SCENES).flatMap((r) => Object.values(r))]) {
    assert.doesNotMatch(d.credit, /\.(jpe?g|webp|png)\b/i, d.credit);
    assert.match(d.file, /\.(jpe?g|webp|png)$/i, "Dateiname bleibt für meta.json");
  }
  const line = archiveCreditLine([22, 3, 14, 16, 14]);
  assert.match(line, /S\. 3, 14, 16, 22:/);
  assert.doesNotMatch(line, /\.(jpe?g|webp)/);
  const doc = src("lib/stilfinder/document.js");
  const notes = doc.slice(doc.indexOf("function Notes("), doc.indexOf("function BackCover("));
  assert.ok(notes.indexOf('"Datenschutz"') < notes.indexOf('"Kennzeichnung KI-Inhalte"'), "KI-Block nach Datenschutz");
  assert.ok(notes.indexOf('"Kennzeichnung KI-Inhalte"') < notes.indexOf('"Impressum"'), "KI-Block in der mittleren Spalte");
});

test("P2.1/2.2: jede Raum-Leitseite blutet mit einem Bild, Einschub nur ab 35 %", { timeout: 180_000 }, async () => {
  const cat = catalog();
  const BLEED = ["protected-band", "protected-scene", "scene-hero", "inset", "scene-only"];
  for (const key of PROFILE_ORDER) {
    for (const r of ROOM_ORDER) assert.ok(ROOM_SCENES[key]?.[r]?.src, `${key}/${r}: Raumszene hinterlegt`);
    for (const loader of [allCut, mixed]) {
      const out = await buildMoodboardPdf({ profile: PROFILES[key], roomRows: roomCandidates(key, cat, 5), loadImage: loader, minImages: 0 });
      for (const r of ROOM_ORDER) {
        const L = out.leads[r];
        assert.ok(BLEED.includes(L.mode), `${key}/${r}: Leitseite ${L.mode}`);
        if (L.mode === "inset") assert.ok(L.coverage >= INSET_MIN_COVERAGE, `${key}/${r}: Einschub ${L.coverage}`);
      }
      // the archive files of the scenes are listed for meta.json
      assert.ok(out.imageFiles.some((f) => /Raumszene/.test(f.use)), `${key}: imageFiles`);
    }
  }
  // a thin cut-out (white table on white) never gets an inset
  const thin = await toneToPaper({ ...cutImg, data: Buffer.from(cutImg.data), stats: { ...cutImg.stats, coverage: 0.04 } });
  assert.notEqual(leadLayout({ img: thin, brand: "X" }, { img: sceneImg }).mode, "inset");
});

test("P2.2/2.5: Szenen ohne Fremdmarken, Outdoor-Szene je Profil eigen", () => {
  const all = [...Object.values(ROOM_SCENES).flatMap((r) => Object.values(r)), ...Object.values(INTRO_IMAGES)];
  for (const s of all) assert.doesNotMatch(s.src, /tomdixon|bannerImageLicht[345]|orionMinoti/i, s.src);
  const outdoor = PROFILE_ORDER.map((k) => ROOM_SCENES[k].outdoor.src);
  assert.equal(new Set(outdoor).size, outdoor.length, outdoor.join(", "));
  assert.doesNotMatch(src("lib/stilfinder/content.js").match(/salon:[\s\S]*?outdoor: "([^"]+)"/)[1], /in dunklen Tönen/, "Salon-Outdoor-Text passt zu den Stücken");
});

test("P2.3: je Raum 1 Stück je Kategorie, höchstens 2 je Marke, Schlafen-Reihenfolge, Essen-Hero kein Bistrotisch", { timeout: 180_000 }, async () => {
  const cat = catalog();
  for (const key of PROFILE_ORDER) {
    const out = await buildMoodboardPdf({ profile: PROFILES[key], roomRows: roomCandidates(key, cat, 11), loadImage: mixed, minImages: 0 });
    for (const r of ROOM_ORDER) {
      const items = out.items.filter((i) => i.room === r);
      const cats = items.map((i) => i.category);
      assert.equal(new Set(cats).size, cats.length, `${key}/${r}: ${cats.join(", ")}`);
      const brands = {};
      for (const i of items) brands[i.brand] = (brands[i.brand] || 0) + 1;
      for (const [b, c] of Object.entries(brands)) assert.ok(c <= MAX_PER_BRAND, `${key}/${r}: ${c}× ${b}`);
      if (r === "schlafen") {
        const rank = items.slice(1).map((i) => ROOM_SEQUENCE.schlafen.indexOf(i.category));
        assert.deepEqual(rank, [...rank].sort((a, b) => a - b), `${key}: Schlafen ${cats.join(" → ")}`);
      }
      if (r === "essen" && items[0]) assert.ok(isHeroFor("essen", items[0].category, items[0].name), `${key}: Essen-Hero ${items[0].name}`);
    }
  }
  assert.ok(!isHeroFor("essen", "dining-tables", "Dining Table Declan Square"));
  assert.ok(!isHeroFor("essen", "dining-tables", "Bar Table Tazi"));
  assert.ok(!isHeroFor("essen", "dining-tables", "MILANO BISTRO bar table"));
  assert.ok(isHeroFor("essen", "dining-tables", "Dining Table Bodega Rectangular"));
  assert.ok(!fitsVisible([{ kategories: "sofas-couches", marken: "A" }], { kategories: "sofas-couches", marken: "B" }));
  assert.ok(!fitsVisible([{ kategories: "beds", marken: "A" }, { kategories: "lamps", marken: "A" }], { kategories: "mirrors", marken: "A" }));
  for (const key of PROFILE_ORDER) assert.ok(!(CURATOR_PICKS[key].schlafen || []).includes("Cypris Mirror"), "Cypris: Spiegel im Bild winzig");
});

test("P2.4: Lichtseite zeigt eine Leuchte (eigene, sonst aus der Auswahl), dunkler Block nur als letzte Lösung", { timeout: 120_000 }, async () => {
  const cat = catalog();
  for (const key of PROFILE_ORDER) {
    const rows = roomCandidates(key, cat, 2);
    assert.ok((rows[LIGHT_KEY] || []).length > 0, `${key}: Ersatzleuchten`);
    const out = await buildMoodboardPdf({ profile: PROFILES[key], roomRows: rows, loadImage: mixed, minImages: 0 });
    assert.equal(out.light.mode, "own", `${key}: ${JSON.stringify(out.light)}`);
    // without spare lamps: a lamp of the selection, never the empty block
    const { [LIGHT_KEY]: _x, ...noSpare } = rows;
    const out2 = await buildMoodboardPdf({ profile: PROFILES[key], roomRows: noSpare, loadImage: mixed, minImages: 0 });
    assert.notEqual(out2.light.mode, "dark", `${key}: ${JSON.stringify(out2.light)}`);
  }
});

test("P2.6: Web-Moodboard – große Kachel Raumszene (Küche zuletzt), breite Kachel nur Szene", () => {
  const mk = (id, { cutout = true, coverage = 0.5, w = 1000, h = 800, prot = false, category = "x" } = {}) => ({ id, category, protected: prot, img: { cutout, width: w, height: h, stats: { coverage } } });
  const rooms = {
    wohnen: [mk("sofa", { coverage: 0.26 }), mk("w2")],
    essen: [mk("e1"), mk("e2")],
    kueche: [mk("phoenix", { cutout: false, w: 1600, h: 900 }), mk("k2")],
    schlafen: [mk("bett", { cutout: false, w: 900, h: 1100 }), mk("s2")],
    outdoor: [mk("o1"), mk("o2")],
  };
  const items = boardItems(rooms, 8);
  assert.equal(items[0].id, "bett", "Schlafen-Szene vor der Küche");
  assert.equal(items[0].tile, "big");
  const wide = items.find((i) => i.tile === "wide");
  assert.ok(!wide || !wide.img.cutout, "breite Kachel nur Szene");
  const cells = items.reduce((s, i) => s + (i.tile === "big" ? 4 : i.tile === "wide" ? 2 : 1), 0);
  assert.equal(cells, 12, "Raster geschlossen");
  // kitchen hero per profile, Phoenix at most once
  const heroes = PROFILE_ORDER.map((k) => CURATOR_PICKS[k].kueche?.[0]);
  assert.equal(new Set(heroes).size, heroes.length, heroes.join(", "));
  assert.ok(Object.values(CURATOR_PICKS).filter((p) => (p.kueche || []).includes("Phoenix")).length <= 1);
  assert.equal(CURATOR_PICKS.salon.kueche[0], "Alea Pro");
  assert.equal(CURATOR_PICKS.klar.kueche[0], "Twelve");
  assert.equal(CURATOR_PICKS.warm.kueche[0], "Harp");
  assert.match(src("components/Labs/Stilfinder/Moodboard.js"), /item\.tile/);
});

test("P2.7: Vorwärmen hält an, sobald ein Auftrag läuft; Zeiten mit queueMs", async () => {
  let busy = false;
  let loaded = 0;
  const loader = async () => {
    loaded++;
    if (loaded === 2) busy = true;
    await new Promise((r) => setTimeout(r, 5));
    return {};
  };
  const paths = Array.from({ length: 20 }, (_, i) => `/cmx/files/w-${i}.jpg`);
  const r = await warmImages(loader, paths, { concurrency: 1, shouldStop: () => busy });
  assert.equal(r.stopped, true);
  assert.ok(loaded <= 3, `geladen: ${loaded}`);
  const pool = src("lib/stilfinder/pdfPool.js");
  assert.match(pool, /queueMs/);
  assert.match(src("lib/stilfinder/pdfWorker.mjs"), /recvAt/);
  const service = src("lib/stilfinder/service.js");
  assert.match(service, /queueMs: pdf\.queueMs/);
  assert.match(service, /orderStarted\(\)/);
  assert.match(src("lib/stilfinder/warm.js"), /shouldStop: orderRunning/);
});
