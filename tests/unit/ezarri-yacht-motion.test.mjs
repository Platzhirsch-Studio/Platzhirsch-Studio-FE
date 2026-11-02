// Motion-Runde Ezarri/Yacht (01.11.2026): gemeinsame Motion-Bausteine,
// „Ruhige Ansicht“ (data-motion="reduced" | "calm") in JS und Modul-CSS.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  BAR_UP,
  DIALOG_FADE,
  IMAGE_HOVER,
  PANEL_IN,
  PANEL_RIGHT,
  RUHIG_WERTE,
  SHEET_UP,
  istRuhig,
  staggerStyle,
  wechselKlasse,
  wertSchluessel,
} from "../../src/lib/ezarri/motion.js";
import * as yachtMotion from "../../src/lib/yacht/motion.js";

const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

test("staggerStyle: Versatz je Spalte, höchstens vier Stufen, immer beide Variablen", () => {
  assert.deepEqual(staggerStyle(0, 3), { "--reveal-start": "0%", "--reveal-end": "40%" });
  assert.deepEqual(staggerStyle(2, 3), { "--reveal-start": "8%", "--reveal-end": "48%" });
  assert.deepEqual(staggerStyle(3, 3), { "--reveal-start": "0%", "--reveal-end": "40%" }, "neue Reihe beginnt links");
  assert.deepEqual(staggerStyle(4, 5), { "--reveal-start": "12%", "--reveal-end": "52%" }, "Stufe 4 = Maximum");
  assert.deepEqual(staggerStyle(-1, 0), { "--reveal-start": "0%", "--reveal-end": "40%" });
  assert.deepEqual(staggerStyle("x", "y"), { "--reveal-start": "0%", "--reveal-end": "40%" });
});

test("istRuhig: Systemeinstellung ODER data-motion reduced/calm", () => {
  const env = (matches, motion) => ({ matchMedia: () => ({ matches }), document: { documentElement: { dataset: motion ? { motion } : {} } } });
  assert.equal(istRuhig(null), false);
  assert.equal(istRuhig(env(false)), false);
  assert.equal(istRuhig(env(true)), true);
  assert.equal(istRuhig(env(false, "reduced")), true);
  assert.equal(istRuhig(env(false, "calm")), true);
  assert.equal(istRuhig(env(false, "full")), false);
  assert.deepEqual([...RUHIG_WERTE], ["reduced", "calm"]);
});

test("Wechsel-Helfer: Schlüssel und Klasse", () => {
  assert.equal(wertSchluessel([1.5, 3]), "[1.5,3]");
  assert.notEqual(wertSchluessel([96]), wertSchluessel([106]));
  assert.equal(wechselKlasse(true), "ph-arrive");
  assert.equal(wechselKlasse(false), undefined);
});

test("Klassen: nur transform/opacity, Token-Dauern, ruhig ohne Transition", () => {
  for (const c of [PANEL_IN, DIALOG_FADE, SHEET_UP, PANEL_RIGHT, BAR_UP]) {
    assert.match(c, /transition-(opacity|transform)\b/);
    assert.match(c, /duration-\(--duration-(swap|ui)\)/);
    assert.match(c, /motion-reduce:transition-none/);
    assert.doesNotMatch(c, /starting:opacity-0\b/, "Panels nie aus 0 (Text ≥ 0,6)");
  }
  assert.match(PANEL_IN, /starting:opacity-60/);
  assert.match(IMAGE_HOVER, /motion-safe:group-hover:scale-\[1\.02\]/);
  assert.doesNotMatch(IMAGE_HOVER, /(^|\s)group-hover:scale/, "Zoom nur unter motion-safe");
});

test("Yacht re-exportiert dieselben Bausteine", () => {
  assert.equal(yachtMotion.staggerStyle, staggerStyle);
  assert.equal(yachtMotion.istRuhig, istRuhig);
  assert.equal(yachtMotion.IMAGE_HOVER, IMAGE_HOVER);
});

test("Modul-CSS von Ezarri/Yacht kennt auch data-motion=\"calm\"", () => {
  const files = [
    "src/components/Ezarri/Welt/ezarri.module.css",
    ...readdirSync(join(ROOT, "src/components/Yacht")).filter((f) => f.endsWith(".module.css")).map((f) => `src/components/Yacht/${f}`),
  ];
  for (const f of files) {
    const css = read(f);
    assert.doesNotMatch(css, /:not\(\[data-motion="reduced"\]\)/, `${f}: nur "reduced" geprüft`);
  }
});

test("JS-Prüfungen der ruhigen Ansicht laufen über istRuhig (auch \"calm\")", () => {
  for (const f of ["src/components/Ezarri/Konfigurator/Konfigurator.js", "src/components/Yacht/Werfthalle.js", "src/components/Yacht/WorldsChapter.js"]) {
    const js = read(f);
    assert.doesNotMatch(js, /dataset\.motion === "reduced"/, f);
    assert.match(js, /istRuhig\(\)/, f);
  }
  for (const f of ["src/components/Ezarri/Rechner/RechnerApp.js", "src/components/Ezarri/CustomMix/CustomMixApp.js", "src/components/Ezarri/Anfrage/AnfrageForm.js"]) {
    assert.match(read(f), /scrollVerhalten\(\)/, f);
  }
});

test("Zahl- und Panelwechsel erst nach der ersten Bedienung (nichts blinkt beim Laden)", () => {
  assert.match(read("src/components/Ezarri/Rechner/RechnerApp.js"), /className=\{wechselKlasse\(m2Bewegt\)\}/);
  assert.match(read("src/components/Ezarri/Konfigurator/Mengen.js"), /useGeaendert\(/);
  assert.match(read("src/components/Ezarri/Konfigurator/Konfigurator.js"), /tabBewegt \? PANEL_IN : ""/);
  assert.match(read("src/components/Yacht/ConceptTabs.js"), /bewegt \? PANEL_IN : ""/);
  // H1/LCP: das Hero-Bild der Welt trägt kein Reveal und keine Opacity-Transition
  const sections = read("src/components/Ezarri/Welt/Sections.js");
  const hero = sections.slice(sections.indexOf("export function HeroImage"), sections.indexOf("export function WeltTile"));
  assert.doesNotMatch(hero, /reveal|transition-opacity|IMAGE_HOVER/);
});
