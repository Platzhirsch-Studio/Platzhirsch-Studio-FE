// tests/unit/motion-kueche-bad-outdoor.test.mjs – Motion-Runde Küche/Bad/Outdoor (01.11.2026).
// Run: node --test --test-reporter=tap tests/unit/motion-kueche-bad-outdoor.test.mjs
//
// Prüft: (1) Landing/motionLanding.js – setTileVisible() (Filter: zurückkehrende
// Kacheln bekommen .ph-arrive, nie beim ersten Lauf), Re-Exports, LINK_EASE nur
// aus Tokens; (2) revealConfirmation.prefersReducedMotion() kennt auch
// data-motion="calm"; (3) Quelltext-Regeln: H1 und LCP-Bild (preload) ohne
// Reveal, Reveals nur über die gemeinsamen Klassen, keine Deckkraft ab 0,
// Live-Regionen bleiben stehen (nur innerer Span wechselt).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
const src = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

function fakeTile(hidden) {
  const classes = new Set();
  return { hidden, classList: { add: (c) => classes.add(c), has: (c) => classes.has(c) } };
}

test("setTileVisible: nur zurückkehrende Kacheln bekommen .ph-arrive, nie beim ersten Lauf", async () => {
  const { setTileVisible } = await load("src/components/Landing/motionLanding.js");
  const back = fakeTile(true);
  assert.equal(setTileVisible(back, true, false), true);
  assert.equal(back.hidden, false);
  assert.equal(back.classList.has("ph-arrive"), true);

  const first = fakeTile(true); // z. B. per URL vorgefiltert, erster Lauf nach dem Mount
  setTileVisible(first, true, true);
  assert.equal(first.classList.has("ph-arrive"), false);

  const stays = fakeTile(false); // war sichtbar → kein neuer Auftritt
  setTileVisible(stays, true, false);
  assert.equal(stays.classList.has("ph-arrive"), false);

  const goes = fakeTile(false);
  assert.equal(setTileVisible(goes, false, false), false);
  assert.equal(goes.hidden, true);
  assert.equal(goes.classList.has("ph-arrive"), false);
});

test("motionLanding: Re-Exports und LINK_EASE nur aus gemeinsamen Tokens", async () => {
  const m = await load("src/components/Landing/motionLanding.js");
  assert.deepEqual(m.staggerStyle(4, 4), { "--reveal-start": "0%", "--reveal-end": "40%" });
  assert.deepEqual(m.staggerStyle(6, 7), { "--reveal-start": "12%", "--reveal-end": "52%" }); // höchstens 4 Stufen
  assert.match(m.IMAGE_HOVER, /motion-safe:group-hover:scale-\[1\.02\]/);
  assert.equal(m.LINK_EASE, "transition-colors duration-(--duration-micro) ease-quiet");
});

test("prefersReducedMotion: data-motion reduced UND calm, sonst Systemeinstellung", async () => {
  const { prefersReducedMotion } = await load("src/components/Landing/revealConfirmation.js");
  const saved = { window: globalThis.window, document: globalThis.document };
  try {
    for (const [motion, media, want] of [
      ["reduced", false, true],
      ["calm", false, true],
      [undefined, true, true],
      [undefined, false, false],
    ]) {
      globalThis.document = { documentElement: { dataset: motion ? { motion } : {} } };
      globalThis.window = { matchMedia: () => ({ matches: media }) };
      assert.equal(prefersReducedMotion(), want, `${motion}/${media}`);
    }
  } finally {
    globalThis.window = saved.window;
    globalThis.document = saved.document;
  }
});

const AREA = [
  "src/components/Landing/parts.js",
  "src/components/Landing/landingPage.js",
  "src/components/Landing/Outdoor/OutdoorLanding.js",
  "src/components/BadWellness/BadWellnessPage.js",
  "src/components/Kuechengeraete/KuechengeraetePage.js",
  "src/components/Hotel/HotelPage.js",
  "src/components/Architekten/ArchitektenPage.js",
  "src/components/Katalog/ProduktKachel.js",
  "src/components/Katalog/ProduktDetail.js",
];

test("Quelltext: H1 und preload-Bilder ohne Reveal, keine Deckkraft ab 0", () => {
  for (const rel of AREA) {
    const s = src(rel);
    for (const m of s.matchAll(/<Heading[^>]*level=\{1\}[^>]*>/g)) assert.doesNotMatch(m[0], /reveal|ph-arrive/, `${rel}: H1 ohne Reveal`);
    // jedes Media/Bild mit preload: kein reveal im selben Tag
    for (const m of s.matchAll(/<(Media|Bild|BrandImage|Image)\b[^>]*\bpreload\b[^>]*>/gs)) assert.doesNotMatch(m[0], /\breveal\b/, `${rel}: LCP-Bild ohne Reveal`);
    assert.doesNotMatch(s, /opacity-0|starting:opacity-0|\bfade-in\b/, `${rel}: nichts blendet ab 0 ein`);
  }
});

test("Quelltext: Reveals nutzen die gemeinsamen Klassen/Helfer", () => {
  const counts = Object.fromEntries(AREA.map((rel) => [rel, (src(rel).match(/\breveal\b/g) || []).length]));
  for (const [rel, n] of Object.entries(counts)) assert.ok(n > 0, `${rel}: mindestens ein Reveal`);
  assert.match(src("src/components/Katalog/ProduktKachel.js"), /className=\{`reveal flex \$\{className\}`\} style=\{staggerStyle\(index, spalten\)\}/);
  assert.match(src("src/components/Landing/landingPage.js"), /className="reveal" style=\{staggerStyle\(index, 4\)\}/);
});

test("Quelltext: Live-Regionen bleiben stehen, nur der innere Text kommt mit .ph-arrive", () => {
  const filter = src("src/components/Katalog/KatalogFilter.js");
  assert.match(filter, /aria-live="polite" data-kat-count="">[\s\S]*<span key=\{anzahl\} className="ph-arrive">/);
  assert.match(filter, /setTileVisible\(el, ok, ersterLauf\.current\)/);
  const konfig = src("src/components/Katalog/Konfigurator.js");
  // QM R1: Zusammenfassung als Zeilenliste – Live-Region (div) bleibt, innerer Block mit .ph-arrive.
  assert.match(konfig, /<div aria-live="polite"[^>]*data-kat-auswahl="">[\s\S]*<div key=\{label\} className=\{cx\("flex items-start gap-4", zuletzt !== null && "ph-arrive"\)\}>/);
  // QM R3: Vorschaubild steht im Block mit .ph-arrive – erst nach einer Wahl (nie beim Laden)
  assert.match(konfig, /zuletzt !== null && "ph-arrive"\)\}>\s*\{bild && \(/);
});
