// Prüft die Regeln des Pinterest-Startpakets (Konzept §9) an data.js und den
// erzeugten Dateien. Aufruf: node --test Marktresearch/digital/marketing/pinterest/werkzeug/pins.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const require = createRequire(path.join(ROOT, "package.json"));
const sharp = require("sharp");
const D = await import(pathToFileURL(path.join(ROOT, "src/components/Preview/pinterest/data.js")).href);

const VERBOTEN = /minotti|poliform|custom[-_ ]?line|navetta|rimadesio|flos|classicon|treca|unsplash/i;
const ERLAUBT = (q) => q.startsWith("/ezarri/") || q === "/Images/Home/aboutHome.jpg";

test("12–20 Pins, 8 Boards in der vorgegebenen Reihenfolge", () => {
  assert.ok(D.PINS.length >= 12 && D.PINS.length <= 20);
  assert.deepEqual(D.BOARDS.map((b) => b.titel), ["Wohnen am Bodensee", "Chalet Arlberg", "Pool & Spa mit Ezarri", "Küche", "Outdoor am See", "Yacht-Interior", "Hotel & Objekt", "Von der Skizze zum Raum"]);
});

test("nur erlaubte Bildquellen, keine Herstellerbilder ohne Pinterest-Freigabe", () => {
  for (const p of D.PINS) {
    if (p.layout === "slot") { assert.ok(!p.quelle && !p.basis, p.id); continue; }
    assert.ok(ERLAUBT(p.quelle), `${p.id}: ${p.quelle}`);
    assert.doesNotMatch(p.quelle, VERBOTEN, p.id);
    if (p.quelle.startsWith("/ezarri/")) assert.equal(p.credit, "Ezarri", p.id);
    assert.ok(fs.existsSync(path.join(ROOT, "public", p.quelle)), `Original fehlt: ${p.quelle}`);
  }
});

test("Boards, Cover und Plan verweisen auf vorhandene Einträge", () => {
  for (const p of D.PINS) assert.ok(D.boardById(p.board), p.id);
  for (const b of D.BOARDS) if (b.cover !== "slot") assert.equal(D.pinById(b.cover)?.board, b.id, b.id);
  assert.equal(D.PLAN.length, 12);
  for (const w of D.PLAN) assert.ok(w.pins.length >= 3 && w.pins.length <= 5, `KW ${w.kw}`);
});

test("Texte ohne Superlative und Ausrufezeichen (Bibel §1)", () => {
  const all = JSON.stringify([D.PINS, D.BOARDS, D.PROFIL]);
  assert.doesNotMatch(all, /\b(Luxus|luxuriös|exklusiv|Traum\w*|beste[nrs]?|größte[nrs]?|einzigartig)\b|!/i);
});

test("erzeugte Pins: 1000 × 1500 und 600 × 900, WebP", async () => {
  for (const p of D.PINS) {
    const big = path.join(ROOT, "public/preview/pinterest", `${p.id}.webp`);
    const small = path.join(ROOT, "public/preview/pinterest", `${p.id}-600.webp`);
    const a = await sharp(big).metadata();
    const b = await sharp(small).metadata();
    assert.deepEqual([a.format, a.width, a.height], ["webp", 1000, 1500], p.id);
    assert.deepEqual([b.width, b.height], [600, 900], p.id);
  }
});
