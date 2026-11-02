// node --test tests/unit/stilfinder-feinschliff.test.mjs
// Stil-Finder, Feinschliff (qa-screenshots/feinschliff/stilfinder/feedback.md):
//   P3.1  Lichtseite: Leuchte passt zum Lichttext (Warm: Taraxacum, Klar: Belt)
//   P3.2  keine Tabletts/Küchenzubehör als Raumstück, Küche ohne Esstisch,
//         Schlafzimmer nur Bett/Nachttisch/Schrank/Spiegel/Textil/Leuchte
//   P3.3  kleine Freisteller: weniger Luft bis ≥ 35 % Kachelbedeckung (Minotti unverändert)
//   P3.4  Teppichtextur nie Leitbild oder große Kachel der Kombination
//   P3.5  Titelbild Warme Moderne zeigt einen Tisch, keinen Arbeitsplatz
// (P2.1 KI-Abstand: tests/e2e/stilfinder-ki-abstand.spec.js, Messung der Rects.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerStilfinderHooks } from "./stilfinder-hooks.lib.mjs";

registerStilfinderHooks();

const { PROFILES } = await import("../../src/components/Labs/Stilfinder/profiles.js");
const { LIGHT_KEY, LIGHT_PICKS, ROOM_SLOTS, fitsRoom, lightFits, roomCandidates } = await import("../../src/lib/stilfinder/rooms.js");
const { CUTOUT_TARGET, comboColumnPlan, cutoutPad, tileCoverage } = await import("../../src/lib/stilfinder/document.js");
const { HERO_CREDITS } = await import("../../src/lib/stilfinder/build.js");
const { PROFILE_CONTENT } = await import("../../src/lib/stilfinder/content.js");

const row = (name, brand, cat) => ({ name, produkt_name: name, marken: brand, kategories: cat, status: "Aktiv", path_field: name.toLowerCase().replace(/\W+/g, "-"), bild_anhangen: [{ bild_anhangen: "/files/x.jpg" }] });

test("P3.1: Lichtseite nimmt die zum Text passende Leuchte (Warm Taraxacum, Klar Belt), kein Raum nimmt sie vorher", () => {
  const flos = [
    row("Pochette Up-Down Led", "Flos", "lamps"),
    row("2097/30", "Flos", "lamps"),
    row("Taraxacum 88 Suspension 1", "Flos", "lamps"),
    row("Belt Fabric Copper Brown Casambi 2000mm", "Flos", "lamps"),
    row("Chiara Floor", "Flos", "lamps"),
  ];
  for (const [key, pick] of [["warm", "Taraxacum 88 Suspension 1"], ["klar", "Belt Fabric Copper Brown Casambi 2000mm"]]) {
    assert.equal(LIGHT_PICKS[key][0], pick);
    const out = roomCandidates(key, { Flos: flos }, 3);
    assert.equal(out[LIGHT_KEY][0]?.name, pick, `${key}: ${out[LIGHT_KEY].map((p) => p.name)}`);
    for (const [room, list] of Object.entries(out)) if (room !== LIGHT_KEY) assert.ok(!list.some((p) => p.name === pick), `${key}/${room} nimmt ${pick}`);
  }
  // without the pick: a fitting spare comes first
  const many = flos.filter((p) => !/Belt/.test(p.name)).concat(["Arrangements Line", "Aim Small", "IC Lights", "Glo-Ball", "Snoopy", "Bellhop", "Spun Light"].map((n) => row(n, "Flos", "lamps")));
  for (const seed of [1, 5, 9]) {
    const lic = roomCandidates("klar", { Flos: many }, seed)[LIGHT_KEY];
    const firstFit = lic.findIndex((p) => lightFits("klar", p));
    assert.ok(firstFit <= 0, `seed ${seed}: ${lic.map((p) => p.name)}`);
  }
  assert.ok(!lightFits("warm", { name: "Pochette Up-Down Led" }), "Chrom-Wandleuchte passt nicht zu Opal/Stoff");
  assert.ok(!lightFits("klar", { name: "2097/30" }), "Kronleuchter ist keine lineare Leuchte");
  assert.match(PROFILE_CONTENT.warm.light, /Pendelleuchten/);
  assert.match(PROFILE_CONTENT.klar.light, /Lineare Leuchten/);
});

test("P3.2: Tabletts und Küchenzubehör nie Raumstück, Küche ohne Esstisch, Schlafzimmer nur Schlafzimmer", () => {
  assert.ok(!fitsRoom(row("BUTLER Tray", "Solpuri", "kitchen-accessories"), "see", "kueche"));
  assert.ok(!fitsRoom(row("Serving Tray Oak", "101 Copenhagen", "decor"), "warm", "wohnen"));
  assert.ok(!fitsRoom(row("Jean Table", "ClassiCon", "dining-tables"), "warm", "kueche"));
  assert.ok(!fitsRoom(row("Dining Table Declan Square", "Eichholtz", "dining-tables"), "salon", "kueche"));
  assert.ok(fitsRoom(row("Bar Stool No. 2", "ClassiCon", "bar-stools"), "warm", "kueche"));
  assert.ok(!fitsRoom(row("Shibusa Lounge Chair", "Paola Lenti", "armchairs-stools"), "see", "schlafen"));
  assert.ok(!fitsRoom(row("Side Table X", "ClassiCon", "side-tables"), "warm", "schlafen"));
  for (const cat of ["beds", "night-tables", "wardrobes", "mirrors", "bedwear", "lamps"]) assert.ok(fitsRoom(row(`Stück ${cat}`, "Treca", cat), "warm", "schlafen"), cat);
  // no dead slots: every kitchen/bedroom slot names an allowed category
  for (const [key, rooms] of Object.entries(ROOM_SLOTS))
    for (const room of ["kueche", "schlafen"])
      for (const slot of rooms[room]) for (const cat of slot.split("|")[1].split(",")) assert.ok(fitsRoom(row("Probe", slot.split("|")[0], cat), key, room), `${key}/${room}: ${slot}`);
});

test("P3.3: kleiner Freisteller bekommt weniger Luft bis ≥ 35 % Bedeckung", () => {
  const trolley = { width: 1000, height: 700, fill: 0.6 };
  const w = 220;
  const h = 275;
  const before = tileCoverage(trolley, w, h, 0.12);
  const pad = cutoutPad(trolley, w, h);
  const after = tileCoverage(trolley, w, h, pad);
  assert.ok(pad < 0.12 && after > before, `${before.toFixed(2)} → ${after.toFixed(2)} (pad ${pad})`);
  // a piece that already fills its tile keeps the 12 % air
  assert.equal(cutoutPad({ width: 800, height: 1000, fill: 0.8 }, w, h), 0.12);
  assert.ok(tileCoverage({ width: 800, height: 1000, fill: 0.8 }, w, h, 0.12) >= CUTOUT_TARGET);
});

test("P3.4: Teppich nie Leitbild oder große Kachel, breite Freisteller über die volle Breite", () => {
  const rug = { id: "rug", category: "rugs", img: { cutout: false, width: 1000, height: 1000 } };
  const sofa = { id: "sofa", category: "sofas-couches", img: { cutout: false, width: 1600, height: 900 }, protected: true };
  const mush = { id: "mush", category: "coffee-tables", img: { cutout: true, width: 1500, height: 600 } };
  const lamp = { id: "lamp", category: "lamps", img: { cutout: true, width: 400, height: 1000 } };
  const p1 = comboColumnPlan([sofa, rug, mush]);
  assert.equal(p1.a.id, "sofa");
  assert.equal(p1.bottom, "strip");
  assert.equal(p1.piece.id, "mush");
  assert.equal(p1.rug.id, "rug");
  assert.equal(comboColumnPlan([rug, sofa, lamp]).a.id, "sofa", "Teppich führt nie");
  assert.equal(comboColumnPlan([sofa, mush, lamp]).bottom, "stack", "breiter Freisteller → volle Breite");
  assert.equal(comboColumnPlan([sofa, lamp, { ...lamp, id: "l2" }]).bottom, "row");
});

test("P3.5: Titelbild Warme Moderne zeigt den Tisch, nicht den Arbeitsplatz", () => {
  assert.doesNotMatch(PROFILES.warm.hero.src, /unique-workplace|Arbeiten/);
  assert.match(PROFILES.warm.hero.alt, /Esstisch/);
  assert.doesNotMatch(HERO_CREDITS.warm, /Arbeiten/);
});
