// node --test tests/unit/stilfinder-kuratierung.test.mjs
// Stil-Finder, QA Runde 2 (feedback-2.md): Kuratierung des Moodboard-PDFs und
// des Web-Moodboards.
//   P1.1  keine Bettfüße/Beine als Stück, Schlafen-Hero heißt wie ein Bett
//   P1.2  ein Stück je Produktfamilie und Dokument, Einleitungsbild kein Produkt
//   P2.1  Seitenverweise der Kombinationen zeigen auf die echte Seite
//   P2.3  60/30/10: Grafik und Text aus einer Quelle, Breiten 6 : 3 : 1
//   P2.4  Stilbrüche (Rattan/Teak im Salon, Konsole in der Küche, kalter Stein)
//   P2.5  Szenen für Freisteller-Heros, Tagline nicht mehr fünfmal
//   P2.7  Web-Moodboard: große Kacheln nur für Szenen oder volle Freisteller
// Läuft offline: künstlicher Katalog mit den echten Problemnamen, Bilder per sharp.
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerStilfinderHooks } from "./stilfinder-hooks.lib.mjs";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

registerStilfinderHooks();

const sharp = (await import("sharp")).default;
const { PROFILES, PROFILE_ORDER } = await import("../../src/components/Labs/Stilfinder/profiles.js");
const { ROOM_SLOTS, CURATOR_PICKS, FILLER_NAME, selectRooms, roomCandidates, familyKey, isHeroFor } = await import("../../src/lib/stilfinder/rooms.js");
const { buildMoodboardPdf, countPdfPages, INTRO_IMAGES, ROOM_SCENES } = await import("../../src/lib/stilfinder/build.js");
const { boardItems, BIG_TILE_MIN_COVERAGE } = await import("../../src/lib/stilfinder/curate.js");
const { toPdfJpeg } = await import("../../src/lib/stilfinder/images.js");
const { PROFILE_CONTENT, colorRoles, colorUseText } = await import("../../src/lib/stilfinder/content.js");
const { colorBlockWidths } = await import("../../src/lib/stilfinder/document.js");
const { PROFILE_MATERIALS, MATERIAL_DIR } = await import("../../src/lib/stilfinder/materials.js");
const { analyseImage, paletteDistance, rgbToLab, hexToRgb } = await import("../../src/lib/stilfinder/imageStats.js");

const FOOT = /füße|fuesse|\bfeet\b|\blegs?\b|\bbeine?\b/i;
const src = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), "utf8");

// Fake catalogue: two products per slot plus the real problem rows of Runde 2.
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
        for (const cat of cats.split(",")) for (let k = 0; k < 2; k++) add(brand, cat);
      }
  // Tréca lists feet, mattresses and headboards as "beds" – feet first, so a
  // category-only rule would pick them
  for (const nm of ["Füße Léna", "Füße Angèle", "Füße Cylindre", "Füße Bruxelles", "Matratze Apogée", "Kopfteil Chloé", "Kopfteil Club Prestige", "Bett Adonis"]) add("Treca", "beds", nm);
  add("Eichholtz", "night-tables", "Nightstand Nottingham Left");
  add("Eichholtz", "night-tables", "Nightstand Nottingham Right");
  add("Eichholtz", "dining-tables", "Dining Table Tiago");
  add("Eichholtz", "small-furniture", "Console Table Drayton");
  add("101 Copenhagen", "lamps", "Drop Chandelier - Brass (5m)");
  add("101 Copenhagen", "lamps", "Drop Chandelier, Mini - Bronze (5m)");
  add("Sifas", "lounge-furniture-daybeds", "Komfy 3 seater sofa Teak");
  add("Sifas", "lounge-furniture-daybeds", "Kross 3 seater sofa");
  // put the problem rows to the front of their brand lists
  for (const list of Object.values(byBrand)) list.reverse();
  return byBrand;
}

const scene = await sharp({ create: { width: 1600, height: 1100, channels: 3, background: "#b4ab9c" } })
  .composite([{ input: Buffer.from(`<svg width="1600" height="1100"><rect x="200" y="300" width="1200" height="600" fill="#5a4d42"/><circle cx="800" cy="500" r="200" fill="#e9e1d4"/></svg>`) }])
  .jpeg()
  .toBuffer();
const cut = await sharp({ create: { width: 1200, height: 1200, channels: 3, background: "#ffffff" } })
  .composite([{ input: Buffer.from(`<svg width="1200" height="1200"><rect x="250" y="400" width="700" height="450" fill="#57524c"/></svg>`) }])
  .jpeg()
  .toBuffer();
const sceneImg = await toPdfJpeg(scene);
const cutImg = await toPdfJpeg(cut);
// cut-outs everywhere except every fourth picture, so the scene layout is used
let calls = 0;
const loader = async () => (++calls % 4 === 0 ? sceneImg : cutImg);

test("P1.1: Füße, Beine und Matratzen sind nie ein Stück, nie ein Hero", () => {
  assert.ok(!isHeroFor("schlafen", "beds", "Füße Léna"));
  assert.ok(!isHeroFor("schlafen", "beds", "Matratze Apogée"));
  assert.ok(isHeroFor("schlafen", "beds", "Kopfteil Chloé"));
  assert.ok(isHeroFor("schlafen", "beds", "Curtis"), "Modellname ohne Teil-Wort bleibt Hero");
  for (const nm of ["Füße Léna", "Füße Angèle", "Leg set Oak", "Bed legs", "Matratze Apogée", "Gleiter"]) assert.ok(FILLER_NAME.test(nm), nm);
  for (const nm of ["Kopfteil Chloé", "Bett Adonis", "Bellevue Legacy Sofa"]) assert.ok(!FILLER_NAME.test(nm), nm);
  for (const key of PROFILE_ORDER)
    for (const nm of Object.values(CURATOR_PICKS[key]).flat()) assert.doesNotMatch(nm, FOOT, `${key}: Kuratoren-Pick ${nm}`);
});

test("P1.1: in keinem Profil ein Fuß als Hero, Auswahlstück oder Kombination", { timeout: 120_000 }, async () => {
  const cat = catalog();
  for (const key of PROFILE_ORDER) {
    const all = Object.values(roomCandidates(key, cat, 3)).flat();
    assert.ok(!all.some((p) => FOOT.test(p.produkt_name) || /matratz/i.test(p.produkt_name)), `${key}: Kandidaten`);
    const sel = selectRooms(key, cat, 3);
    if (sel.schlafen[0]) assert.ok(isHeroFor("schlafen", sel.schlafen[0].kategories, sel.schlafen[0].produkt_name), `${key}: Schlafen-Hero ${sel.schlafen[0].produkt_name}`);
  }
  for (const key of ["warm", "salon", "see"]) {
    const out = await buildMoodboardPdf({ profile: PROFILES[key], roomRows: roomCandidates(key, cat, 3), loadImage: loader, minImages: 0 });
    for (const it of out.items) assert.doesNotMatch(it.name, FOOT, `${key}: ${it.name}`);
    for (const c of out.combos) for (const r of c.refs) assert.doesNotMatch(r.name, FOOT, `${key} Kombination: ${r.name}`);
    const hero = out.items.find((i) => i.room === "schlafen");
    if (hero) assert.doesNotMatch(hero.name, /füße|matratz/i, `${key}: ${hero.name}`);
  }
});

test("P1.2: Familienschlüssel erkennt Links/Rechts, Mini, Farbe, Maße", () => {
  assert.equal(familyKey("Eichholtz", "Nightstand Nottingham Left"), familyKey("Eichholtz", "Nightstand Nottingham Right"));
  assert.equal(familyKey("101 Copenhagen", "Drop Chandelier - Brass (5m)"), familyKey("101 Copenhagen", "Drop Chandelier, Mini - Bronze (5m)"));
  assert.equal(familyKey("Sifas", "Komfy 2 seater sofa Teak"), familyKey("Sifas", "Komfy 3 seater sofa Teak"));
  assert.equal(familyKey("Eichholtz", "Bar Stool Josephine"), familyKey("Eichholtz", "Bar Stool Josephine (Bar Stool Josephine 121268)"));
  assert.equal(familyKey("Eichholtz", "Sofa Bleecker"), familyKey("Eichholtz", "Chair Bleecker"));
  assert.equal(familyKey("Poliform", "Westside Sofa"), familyKey("Poliform", "Westside Soft"));
  assert.equal(familyKey("Desalto", "Koki"), familyKey("Desalto", "Koki Wire - Outdoor"));
  assert.equal(familyKey("Poliform", "Artex"), familyKey("Poliform", "Artex Pro"));
  assert.equal(familyKey("101 Copenhagen", "Drop Chandelier - Brass (5m)"), familyKey("101 Copenhagen", "Drop Chandelier Globe, Mini - Burned Black (5m)"));
  assert.notEqual(familyKey("Treca", "Kopfteil Angèle"), familyKey("Treca", "Füße Angèle"));
  assert.notEqual(familyKey("Treca", "Kopfteil Angèle"), familyKey("Treca", "Kopfteil Club Prestige"));
  assert.notEqual(familyKey("Solpuri", "BASKET Dining Chair"), familyKey("Sifas", "Basket Side table"), "Marke gehört zum Schlüssel");
  assert.notEqual(familyKey("Eichholtz", "Chair Elisha"), familyKey("Eichholtz", "Chair Bleecker"));
});

test("P1.2: je Dokument nur ein Stück je Familie (Auswahl und PDF)", { timeout: 120_000 }, async () => {
  const cat = catalog();
  for (const key of PROFILE_ORDER) {
    const fams = Object.values(roomCandidates(key, cat, 9)).flat().map((p) => familyKey(p.marken, p.produkt_name));
    assert.equal(new Set(fams).size, fams.length, `${key}: Familien in den Kandidaten`);
  }
  for (const key of ["salon", "warm"]) {
    const out = await buildMoodboardPdf({ profile: PROFILES[key], roomRows: roomCandidates(key, cat, 9), loadImage: loader, minImages: 0 });
    const fams = out.items.map((i) => familyKey(i.brand, i.name));
    assert.equal(new Set(fams).size, fams.length, `${key}: ${out.items.map((i) => i.name).join(" | ")}`);
  }
});

test("P1.2 b: Einleitungsbild je Profil fest, kein Produkt, nicht Titel- oder Raumszene", () => {
  for (const key of PROFILE_ORDER) {
    const intro = INTRO_IMAGES[key];
    assert.ok(intro?.src, key);
    assert.ok(existsSync(path.join(process.cwd(), "public", intro.src)), intro.src);
    assert.notEqual(intro.src, PROFILES[key].hero.src, `${key}: nicht das Titelbild`);
    const scenes = Object.values(ROOM_SCENES[key] || {}).map((s) => s.src);
    assert.ok(!scenes.includes(intro.src), `${key}: nicht als Raumszene`);
    assert.ok(!scenes.includes(PROFILES[key].hero.src), `${key}: Titelbild nicht als Raumszene`);
    for (const s of scenes) assert.ok(existsSync(path.join(process.cwd(), "public", s)), s);
  }
});

test("P2.1: jeder Kombinationsverweis zeigt auf die Seite mit dem Stück", { timeout: 120_000 }, async () => {
  const cat = catalog();
  for (const key of ["salon", "ruhe"]) {
    const out = await buildMoodboardPdf({ profile: PROFILES[key], roomRows: roomCandidates(key, cat, 4), loadImage: loader, minImages: 0 });
    // with scene credits on the notes page nothing may spill onto an extra page
    assert.equal(countPdfPages(out.buffer), out.pages, `${key}: Seiten im PDF = Seitenplan`);
    const byId = new Map(out.items.map((i) => [i.id, i]));
    for (const c of out.combos)
      for (const r of c.refs) {
        const pageKey = out.plan[r.page - 1];
        const roomList = out.items.filter((i) => i.room === r.room);
        const idx = roomList.findIndex((i) => i.id === r.id);
        assert.ok(idx >= 0 && byId.get(r.id).page === r.page);
        // the hero stands on the lead page, pieces 2–4 on the selection page;
        // in the "scene-only" lead (QA Runde 3, P2.2) the hero opens the
        // selection page as well
        const heroOnLead = idx === 0 && out.leads[r.room]?.mode !== "scene-only";
        assert.equal(pageKey, heroOnLead ? `room-${r.room}` : `room-${r.room}-p`, `${key}: ${r.name} Seite ${r.page}`);
      }
  }
});

test("P2.2: Labs-Satz auf der Moodboard-Seite nur einmal", () => {
  const doc = src("lib/stilfinder/document.js");
  const line = doc.split("\n").find((l) => l.includes("moodCredit: `"));
  assert.ok(line && !line.includes("Labs"), "moodCredit ohne Labs-Satz (der Rahmen hängt ihn an)");
});

test("P2.3: 60/30/10 – Text nennt die Töne der Grafik, Breiten 6 : 3 : 1", () => {
  for (const key of PROFILE_ORDER) {
    const roles = colorRoles(PROFILE_CONTENT[key], PROFILES[key].palette);
    const used = roles.flatMap((r) => r.tones.map((t) => t.name));
    assert.equal(new Set(used).size, 5, `${key}: jeder Ton genau einer Rolle`);
    const text = colorUseText(PROFILE_CONTENT[key], PROFILES[key].palette);
    for (const r of roles) for (const t of r.tones) assert.ok(r.sentence.includes(t.name) && text.includes(r.sentence), `${key}: ${t.name}`);
  }
  // Pariser Salon: Messing ist Akzent, nicht Grundfläche
  const salon = colorRoles(PROFILE_CONTENT.salon, PROFILES.salon.palette);
  assert.deepEqual(salon[0].tones.map((t) => t.name), ["Champagner"]);
  assert.ok(salon[2].tones.some((t) => t.name === "Messing"));
  const [a, b, c] = colorBlockWidths(500, 8, 0);
  assert.ok(Math.abs(a / b - 2) < 0.01 && Math.abs(b / c - 3) < 0.01, `${a}/${b}/${c}`);
  const [, , minC] = colorBlockWidths(300, 8, 44);
  assert.ok(minC >= 44, "Mindestbreite für die Beschriftung");
});

test("P2.4: Stilbrüche – Salon ohne Rattan/Teak, Küche ohne Konsole", () => {
  const cat = catalog();
  for (const seed of [1, 2, 3, 4, 5]) {
    const all = Object.values(roomCandidates("salon", cat, seed)).flat().map((p) => p.produkt_name);
    assert.ok(!all.some((n) => /tiago|teak|rattan/i.test(n)), all.join(" | "));
    for (const key of PROFILE_ORDER) {
      const kueche = roomCandidates(key, cat, seed).kueche;
      assert.ok(kueche.every((p) => ["kitchen", "bar-stools", "lamps", "dining-tables", "kitchen-accessories"].includes(p.kategories)), `${key}: ${kueche.map((p) => p.kategories).join(",")}`);
    }
  }
});

test("P2.4 d: Materialfotos passen zur Palette (ΔE) und sind bei warmen Profilen nicht kühl", async () => {
  for (const key of PROFILE_ORDER) {
    for (const [group, file] of Object.entries(PROFILE_MATERIALS[key])) {
      const s = await analyseImage(path.join(MATERIAL_DIR, `${file}.jpg`));
      assert.ok(paletteDistance(s.dominant, PROFILES[key].palette) <= 25, `${key}/${group}: ${file} ${s.dominant}`);
      if (["warm", "ruhe", "salon"].includes(key)) {
        const [, , bStar] = rgbToLab(hexToRgb(s.dominant));
        assert.ok(bStar >= -1, `${key}/${group}: ${file} wirkt kühl (b* ${bStar.toFixed(1)})`);
      }
    }
  }
  assert.notEqual(PROFILE_MATERIALS.warm.stein, "terrazzo");
});

test("P2.5: Freisteller-Hero bekommt eine Raumszene, Tagline höchstens dreimal", { timeout: 60_000 }, async () => {
  const doc = src("lib/stilfinder/document.js");
  assert.match(doc, /roomScenes\?\.\[r(?:oom)?\]/);
  assert.ok(ROOM_SCENES.salon.wohnen && ROOM_SCENES.salon.essen && ROOM_SCENES.salon.outdoor);
  // tagline: cover + moodboard caption only (the introduction and the
  // moodboard text page no longer quote it)
  const uses = doc.match(/profile\.tagline|ctx\.profile\.tagline/g) || [];
  assert.ok(uses.length <= 2, `profile.tagline ${uses.length}×`);
});

test("P2.7: Web-Moodboard – große Kachel nur Szene oder Freisteller ab 25 %", () => {
  const mk = (id, room, { cutout = true, coverage = 0.5, w = 1000, h = 800, prot = false } = {}) => ({ id, room, protected: prot, img: { cutout, width: w, height: h, stats: { coverage } } });
  const rooms = {
    wohnen: [mk("plateau", "wohnen", { coverage: 0.08 }), mk("b", "wohnen")],
    essen: [mk("c", "essen", { cutout: false, w: 1600, h: 900 }), mk("d", "essen")],
    kueche: [mk("e", "kueche", { cutout: false })],
    schlafen: [mk("f", "schlafen")],
    outdoor: [mk("g", "outdoor", { coverage: 0.1 }), mk("h", "outdoor")],
  };
  const items = boardItems(rooms, 8);
  assert.equal(items.length, 8);
  assert.equal(items[0].id, "c", "Szene in der größten Kachel");
  for (const i of [0, 5]) assert.ok(!items[i].img.cutout || items[i].img.stats.coverage >= BIG_TILE_MIN_COVERAGE, `Kachel ${i}: ${items[i].id}`);
  assert.equal(new Set(items.map((i) => i.id)).size, 8);
  // the website uses the same curation module as the PDF
  const web = src("components/Labs/Stilfinder/catalog.js");
  assert.match(web, /curateRooms/);
  assert.match(web, /roomCandidates/);
});
