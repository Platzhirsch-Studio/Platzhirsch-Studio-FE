// node --test tests/unit/stilfinder-restliste.test.mjs
// Stil-Finder, Restliste der Abnahme Runde 3 (qa-screenshots/erlebnis/stilfinder/abnahme.md):
//   R1    Szenen-Regel: Detailstücke (Couchtisch, Beistelltisch, Nachttisch,
//         Sideboard, Barhocker, Leuchte …) nur als Freisteller – erst die
//         weiteren Katalogbilder derselben Bildfamilie, sonst nur als letzte
//         Reserve, wenn der Raum sonst unter 3 Stücke fällt
//   R2    keine leere Kachel „Mehr im Studio“: Raster folgt der Stückzahl,
//         ein Raum mit zu wenigen Stücken darf ein drittes Stück einer Marke zeigen
//   P3.1  Termin-Seite: untere Hälfte gefüllt (drei Schritte + Materialband)
//   P3.2  Kombinationen S. 24: Collage über die volle Seitenhöhe
//   P3.3  Materialwelt: vier verschiedene Layouts, Samt mit Faltenwurf
//   P3.5  keine Outdoor-Laternen (In Vitro, Unplugged) im Innenraum/auf der Lichtseite
//   P3.6  KI-Button: Quiz-Intro hält mobil Abstand (--ph-concierge-h)
//   Inhaber  keine Tom-Dixon-Titelbilder, Quiz-Intro ohne Licht4
// Läuft offline: künstlicher Katalog, Bilder per sharp.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerStilfinderHooks } from "./stilfinder-hooks.lib.mjs";
import { readFileSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

registerStilfinderHooks();

const sharp = (await import("sharp")).default;
const { PROFILES, PROFILE_ORDER } = await import("../../src/components/Labs/Stilfinder/profiles.js");
const { ROOM_SLOTS, LIGHT_KEY, MAX_PER_BRAND, fitsRoom, roomCandidates } = await import("../../src/lib/stilfinder/rooms.js");
const { curateRooms, toItem, altImages, SCENE_DETAIL, MIN_PIECES } = await import("../../src/lib/stilfinder/curate.js");
const { buildMoodboardPdf, HERO_CREDITS } = await import("../../src/lib/stilfinder/build.js");
const { toPdfJpeg } = await import("../../src/lib/stilfinder/images.js");
const { selectionGrid, MATERIAL_LAYOUTS, TERMIN_STEPS, COMBO_A_WIDTH } = await import("../../src/lib/stilfinder/document.js");
const { MATERIAL_DIR, MATERIAL_TEXTURES } = await import("../../src/lib/stilfinder/materials.js");

const src = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), "utf8");
const W = 841.89;
const H = 595.28;

const sceneBuf = await sharp({ create: { width: 1600, height: 1100, channels: 3, background: "#b4ab9c" } })
  .composite([{ input: Buffer.from(`<svg width="1600" height="1100"><rect x="200" y="300" width="1200" height="600" fill="#5a4d42"/><circle cx="800" cy="500" r="200" fill="#e9e1d4"/></svg>`) }])
  .jpeg()
  .toBuffer();
const cutBuf = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: "#ffffff" } })
  .composite([{ input: Buffer.from(`<svg width="1200" height="1200"><rect x="250" y="300" width="700" height="600" fill="#57524c"/></svg>`) }])
  .jpeg()
  .toBuffer();
const sceneImg = await toPdfJpeg(sceneBuf);
const cutImg = await toPdfJpeg(cutBuf);

// ---------- R1: further pictures of the same file family ----------
test("R1: altImages nimmt nur Bilder derselben Bildfamilie (keine Vase, kein Esstisch)", () => {
  const row = (files) => ({ bild_anhangen: files.map((f) => ({ bild_anhangen: `/files/${f}` })) });
  assert.deepEqual(altImages(row(["bow-coffee-table-no-1-01.jpg", "bow-coffee-table-no-4-02.jpg", "vase-10.jpg", "bow-coffee-table-no-2-04.jpg"])), [
    "/cmx/files/bow-coffee-table-no-4-02.jpg",
    "/cmx/files/bow-coffee-table-no-2-04.jpg",
  ]);
  assert.deepEqual(altImages(row(["101-copenhagen-drop-chandelier-mini-burned-black-5m-01.webp", "101-copenhagen-arc-dining-table-120-coffee-black-oak-02.webp", "101-copenhagen-drop-chandelier-mini-burned-black-5m-04.webp"])), [
    "/cmx/files/101-copenhagen-drop-chandelier-mini-burned-black-5m-04.webp",
  ]);
  assert.deepEqual(altImages(row(["minotti-superquadra-01.webp", "minotti-superquadra-02.webp"])), ["/cmx/files/minotti-superquadra-02.webp"]);
  assert.deepEqual(altImages(row(["nur-ein-bild-01.jpg"])), []);
  // the item carries them for curateRooms
  const it = toItem({ name: "X", produkt_name: "Bow", marken: "ClassiCon", kategories: "coffee-tables", path_field: "bow", ...row(["bow-coffee-table-no-1-01.jpg", "bow-coffee-table-no-1-02.jpg"]) });
  assert.deepEqual(it.alts, ["/cmx/files/bow-coffee-table-no-1-02.jpg"]);
  for (const c of ["coffee-tables", "side-tables", "night-tables", "sideboards-chests", "bar-stools", "lamps"]) assert.ok(SCENE_DETAIL.includes(c), c);
  for (const c of ["sofas-couches", "beds", "dining-tables", "kitchen"]) assert.ok(!SCENE_DETAIL.includes(c), `${c} darf Szene bleiben`);
});

// fake rows + loader: files with "cut" or ending in "<n>c.jpg" are cut-outs, the rest room scenes
let n = 0;
const row = (brand, cat, files) => {
  n++;
  return { name: `R${n}`, produkt_name: `Stück ${n}`, marken: brand, kategories: cat, path_field: `stueck-${n}`, status: "Aktiv", bild_anhangen: files.map((f) => ({ bild_anhangen: `/files/${f}` })) };
};
const loader = async (p) => (/cut|\dc\.jpg$/.test(p) ? cutImg : sceneImg);
const curate = (rows) =>
  curateRooms({
    profile: PROFILES.klar,
    candidates: { wohnen: rows.map((r) => toItem(r)), essen: [], kueche: [], schlafen: [], outdoor: [] },
    loadImage: loader,
    lamp: false,
  });

test("R1: Detailstück als Szene → Freisteller aus den weiteren Katalogbildern", async () => {
  const sofa = row("Poliform", "sofas-couches", ["sofa-a-scene-01.jpg"]);
  // same file family "tisch-b": 01 and 02 scenes, 03c the cut-out
  const table = row("Desalto", "coffee-tables", ["tisch-b-01.jpg", "tisch-b-02.jpg", "tisch-b-03c.jpg"]);
  const shelf = row("Rimadesio", "shelves", ["regal-c-scene-01.jpg"]);
  const side = row("ClassiCon", "side-tables", ["beistell-d-scene-01.jpg"]);
  const { rooms } = await curate([sofa, table, shelf, side]);
  const ids = rooms.wohnen.map((it) => it.id);
  const t = rooms.wohnen.find((it) => it.id === table.name);
  assert.ok(t, "Couchtisch dabei");
  assert.ok(t.img.cutout, "als Freisteller");
  assert.equal(t.shown, "/cmx/files/tisch-b-03c.jpg", "Web-Kachel zeigt dasselbe Bild");
  assert.ok(!t.lastResort);
  // sofa and shelf may stay scenes; the side table has no cut-out and the room has 3 pieces already
  assert.ok(ids.includes(sofa.name) && ids.includes(shelf.name));
  assert.ok(!ids.includes(side.name), "Beistelltisch nur als Szene → nicht in der Auswahl");
});

test("R1/R2: zu wenige Stücke → Detail-Szene als letzte Reserve, dritte Marke erlaubt", async () => {
  // hero + one scene-only side table: the room would fall to 1 piece
  const sofa = row("Poliform", "sofas-couches", ["sofa-e-scene-01.jpg"]);
  const side = row("ClassiCon", "side-tables", ["beistell-f-scene-01.jpg"]);
  const r1 = await curate([sofa, side]);
  const s = r1.rooms.wohnen.find((it) => it.id === side.name);
  assert.ok(s && s.lastResort && !s.img.cutout, "letzte Reserve statt Lücke");

  // three pieces of one brand: the third is allowed only because nothing else fits
  const a = row("Eichholtz", "sofas-couches", ["sofa-g-cut-01.jpg"]);
  const b = row("Eichholtz", "armchairs-stools", ["sessel-h-cut-01.jpg"]);
  const c = row("Eichholtz", "rugs", ["teppich-i-cut-01.jpg"]);
  const r2 = await curate([a, b, c]);
  assert.equal(r2.rooms.wohnen.length, 3, "drittes Eichholtz-Stück statt leerer Kachel");
  assert.equal(MIN_PIECES, 3);
  // with another brand available the normal limit holds
  const d = row("Flos", "lamps", ["leuchte-j-cut-01.jpg"]);
  const e = row("Eichholtz", "coffee-tables", ["tisch-k-cut-01.jpg"]);
  const r3 = await curate([a, b, d, e].map((x) => ({ ...x, name: `${x.name}x` })));
  const brands = r3.rooms.wohnen.map((it) => it.brand);
  assert.ok(brands.filter((x) => x === "Eichholtz").length <= MAX_PER_BRAND, brands.join(", "));
});

test("R2: Auswahlraster ohne leere Kacheln", () => {
  for (const heroHere of [false, true])
    for (let count = 0; count <= 4; count++) {
      const g = selectionGrid(count, heroHere);
      if (count >= 3) assert.ok(g.slots === Math.min(count, heroHere ? 4 : 3) || (count === 4 && !heroHere && g.slots === 3), `${count}/${heroHere}: ${g.slots}`);
      else assert.equal(g.slots, 2);
      // never more slots than pieces, except the note column next to a single piece
      assert.ok(g.slots <= Math.max(count, 2));
      assert.equal(g.note, count < 2);
    }
  assert.doesNotMatch(src("lib/stilfinder/document.js"), /backgroundColor: C\.bone, padding: 18, justifyContent: "flex-end" \}, tx\(\[T\.h3, \{ fontSize: 18 \}\], "Mehr im Studio"\)/, "keine Platzhalter-Kachel mehr");
});

// ---------- PDF pages ----------
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
/** Text runs (size, top) and image boxes (top, bottom, left, right; from the top left). */
function layout(stream) {
  const toks = stream.split(/\s+/);
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  let size = 0;
  let tm = null;
  const runs = [];
  const images = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === "q") stack.push(ctm);
    else if (t === "Q") ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
    else if (t === "cm") ctm = mul(ctm, toks.slice(i - 6, i).map(Number));
    else if (t === "Tf") size = Number(toks[i - 1]);
    else if (t === "Tm") tm = mul(ctm, toks.slice(i - 6, i).map(Number));
    else if ((t === "TJ" || t === "Tj") && tm) runs.push({ size, top: H - tm[5] });
    else if (t === "Do" && /^\/I/.test(toks[i - 1])) {
      const [a, , , d, e, f] = ctm;
      images.push({ left: e, right: e + a, top: H - (f + d), bottom: H - f });
    }
  }
  return { runs, images };
}

const fakeCatalog = () => {
  const byBrand = {};
  let k = 0;
  for (const rooms of Object.values(ROOM_SLOTS))
    for (const slots of Object.values(rooms))
      for (const slot of slots) {
        const [brand, cats] = slot.split("|");
        for (const cat of cats.split(",")) for (let j = 0; j < 3; j++) {
          k++;
          (byBrand[brand] ||= []).push({ name: `P${k}`, produkt_name: `Testobjekt ${k}`, path_field: `produkt-${k}`, marken: brand, kategories: cat, status: "Aktiv", bild_anhangen: [{ bild_anhangen: `/files/t-${k}.webp` }] });
        }
      }
  return byBrand;
};

test("P3.1/P3.2/P3.3: Termin-Seite gefüllt, Kombinationen über die volle Höhe, vier Material-Layouts", { timeout: 120_000 }, async () => {
  let calls = 0;
  const mixed = async () => (++calls % 3 === 0 ? sceneImg : cutImg);
  const out = await buildMoodboardPdf({ profile: PROFILES.salon, customer: { name: "Ana Krasniqi-Müller" }, roomRows: roomCandidates("salon", fakeCatalog(), 7), loadImage: mixed, minImages: 0 });
  const streams = pageStreams(out.buffer);
  assert.equal(streams.length, out.pages);

  // P3.1: below the contact row (≈ 350 pt) there are the three steps and the material band
  const next = layout(streams[out.plan.indexOf("next")]);
  assert.equal(TERMIN_STEPS.length, 3);
  assert.ok(next.runs.filter((r) => r.size >= 8 && r.top > 370 && r.top < H - 60).length >= 6, "Schritte in der unteren Hälfte");
  // cover images are drawn larger than their frame: their centre sits in the band
  const band = next.images.filter((im) => (im.top + im.bottom) / 2 > 420 && (im.top + im.bottom) / 2 < H - 50);
  assert.ok(band.length >= 4, `Materialband: ${band.length} Bilder`);

  // P3.2: the first combination covers the right part from top to bottom
  const combo = layout(streams[out.plan.indexOf("combos-a")]);
  const right = combo.images.filter((im) => im.left >= W - COMBO_A_WIDTH - 1);
  assert.ok(right.length >= 3, "drei Bilder rechts");
  const top = Math.min(...right.map((im) => im.top));
  const bottom = Math.max(...right.map((im) => im.bottom));
  assert.ok(bottom - top > 0.8 * H, `Collage ${Math.round(top)}–${Math.round(bottom)} pt`);

  // P3.3: four different layouts; the photo sits left, right, full width, framed
  assert.equal(new Set(MATERIAL_LAYOUTS).size, 4);
  const mats = ["holz", "stein", "textil", "metall"].map((k) => layout(streams[out.plan.indexOf(`mat-${k}`)]).images.sort((a, b) => b.right - b.left - (a.right - a.left))[0]);
  assert.ok(mats[0].left < 1, "Holz: Foto links randabfallend");
  assert.ok(mats[1].right > W - 1, "Stein: Foto rechts randabfallend");
  assert.ok(mats[2].right - mats[2].left > W - 1, "Textil: Foto über die volle Breite");
  assert.ok(mats[3].left > W / 3 && mats[3].right < W - 100, "Metall: gerahmtes Foto auf dem Musterbrett (rechts davon die Tonkarten)");
});

test("P3.3: Samt Bordeaux hat Faltenwurf (Helligkeitsverlauf statt Farbfläche)", async () => {
  assert.ok(MATERIAL_TEXTURES.samt.folds, "Faltenwurf im Generator hinterlegt");
  const { channels } = await sharp(path.join(MATERIAL_DIR, "samt.jpg")).greyscale().stats();
  // the flat velvet of round 3 had a luminance deviation of 4.3, the draped one 24
  assert.ok(channels[0].stdev > 12, `Kontrast ${channels[0].stdev.toFixed(1)}`);
});

test("P3.5: Outdoor-Laternen (In Vitro, Unplugged) nie im Innenraum oder auf der Lichtseite", () => {
  const lamp = (name) => ({ name, produkt_name: name, marken: "Flos", kategories: "lamps", status: "Aktiv", path_field: "x", bild_anhangen: [{ bild_anhangen: "/files/x.jpg" }] });
  for (const nm of ["In Vitro Unplugged", "In Vitro Wall", "Captain Flint Outdoor"]) {
    assert.ok(!fitsRoom(lamp(nm), "warm", LIGHT_KEY), `${nm} nicht auf der Lichtseite`);
    assert.ok(!fitsRoom(lamp(nm), "warm", "wohnen"), `${nm} nicht im Wohnen`);
    assert.ok(fitsRoom(lamp(nm), "warm", "outdoor") || !ROOM_SLOTS.warm.outdoor.length, `${nm} draußen erlaubt`);
  }
  assert.ok(fitsRoom(lamp("Taraxacum 88"), "warm", LIGHT_KEY));
});

// Feinschliff P2.1: the real check is the rect measurement in
// tests/e2e/stilfinder-ki-abstand.spec.js (Pixel 7, iPhone 15 Pro). This only
// guards the factor: --ph-concierge-h is the button HEIGHT (64), the button is
// about 75 px wide + 16 px edge, so the gap is 1.25 x 64 = 80 px (0 without concierge).
test("P3.6/P2.1: Quiz-Intro hält mobil 1,25 × --ph-concierge-h Abstand zum KI-Button", () => {
  const quiz = src("components/Labs/Stilfinder/StilfinderQuiz.js");
  // Motion/CLS 01.11.2026: only while a launcher is in the page (phones show none
  // when closed – the late variable re-wrapped the intro, CLS 0.069 at 390 px).
  assert.match(quiz, /data-sf-ki-gap="" className="max-md:\[body:has\(\[data-concierge-launcher\]\)_&\]:pr-\[calc\(var\(--ph-concierge-h,0px\)\*1\.25\)\]"/);
});

test("Inhaber-Frage: keine Tom-Dixon-Titelbilder, Quiz-Intro ohne Pendelgruppe Licht4", () => {
  for (const key of PROFILE_ORDER) assert.doesNotMatch(PROFILES[key].hero.src, /tomdixon|bannerImageLicht[345]/i, `${key}: ${PROFILES[key].hero.src}`);
  for (const c of Object.values(HERO_CREDITS)) assert.doesNotMatch(c, /Tom Dixon/, c);
  const quiz = src("components/Labs/Stilfinder/StilfinderQuiz.js");
  const collage = quiz.split("\n").filter((l) => /^import iCollage/.test(l)).join("\n");
  assert.doesNotMatch(collage, /tomdixon|bannerImageLicht4/i);
});
