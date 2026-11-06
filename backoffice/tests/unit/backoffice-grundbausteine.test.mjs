// Grundbausteine v2 (Team P0-2): Rechenlogik der Charts/Kennzahl und Token-Vollständigkeit.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  balkenGeometrie,
  beschriftete,
  donutSegmente,
  formatiere,
  linienPunkte,
  pfad,
  prozentText,
  skala,
  sparkPunkte,
  trendBewertung,
  wechselArt,
  zielAnteil,
} from "../../src/components/Backoffice/Charts/logik.js";

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const lies = (p) => readFileSync(path.join(wurzel, p), "utf8").replace(/\r\n/g, "\n");
const NBSP = " ";

test("formatiere: Punkt als Tausender, Minuszeichen, Einheit mit geschütztem Leerzeichen", () => {
  assert.equal(formatiere(1234567), "1.234.567");
  assert.equal(formatiere(-12), "−12");
  assert.equal(formatiere(123450, "cent"), `1.234,50${NBSP}€`);
  assert.equal(formatiere(-5, "cent"), `−0,05${NBSP}€`);
  assert.equal(formatiere(123450, "cent-rund"), `1.235${NBSP}€`);
  assert.equal(formatiere(12.5, "prozent"), `12,5${NBSP}%`);
  assert.equal(formatiere(1234.56, "dezimal"), "1.234,6");
  assert.equal(formatiere(null), "–");
  assert.equal(formatiere(""), "–");
  assert.equal(formatiere("abc"), "–");
  assert.equal(formatiere(0), "0");
});

test("wechselArt: zählt nur bei Änderung, Sprünge ab 5 Stellen direkt", () => {
  assert.equal(wechselArt(5, 5), "nein");
  assert.equal(wechselArt(undefined, 5), "nein");
  assert.equal(wechselArt(5, "7"), "nein");
  assert.equal(wechselArt(5, 9), "zaehlen");
  assert.equal(wechselArt(0, 9999), "zaehlen");
  assert.equal(wechselArt(0, 10000), "direkt");
  // Cent: Unterschied in Euro gemessen
  assert.equal(wechselArt(0, 999900, "cent"), "zaehlen");
  assert.equal(wechselArt(0, 1000000, "cent"), "direkt");
});

test("skala/balkenGeometrie: Nulllinie bei negativen Werten, Mindesthöhe für kleine Werte", () => {
  assert.deepEqual(skala([2, 4]), { max: 4, min: 0, spanne: 4, nullLinie: 0 });
  const s = skala([-1, 3]);
  assert.equal(s.nullLinie, 25);
  const g = balkenGeometrie([10, 0, 0.001]);
  assert.equal(g[0].hoehe, 82);
  assert.equal(g[1].hoehe, 0);
  assert.ok(g[2].hoehe >= 0.8);
  const n = balkenGeometrie([-2, 2], 80);
  assert.equal(n[0].negativ, true);
  assert.equal(n[0].unten + n[0].hoehe, n[1].unten); // beide treffen sich an der Nulllinie
  assert.equal(balkenGeometrie([]).length, 0);
});

test("beschriftete: bis 8 alle, darüber Maximum und letzter", () => {
  assert.equal(beschriftete([1, 2, 3]).size, 3);
  const b = beschriftete([1, 9, 3, 4, 5, 6, 7, 8, 2]);
  assert.deepEqual([...b].sort((a, c) => a - c), [1, 8]);
});

test("linienPunkte/pfad: Spaltenmitte, Kopfraum, Fläche geschlossen", () => {
  const p = linienPunkte([0, 10], 10);
  assert.equal(p[0].x, 25);
  assert.equal(p[1].x, 75);
  assert.equal(p[0].y, 98);
  assert.equal(p[1].y, 20);
  assert.equal(pfad(p), "M25.00,98.00 L75.00,20.00");
  assert.match(pfad(p, true), /L75\.00,100 L25\.00,100 Z$/);
  assert.equal(pfad([]), "");
  assert.ok(linienPunkte([5], 0)[0].y < 100);
});

test("donutSegmente: höchstens 5 Teile, Rest als „Weitere“, Anteile summieren auf 100", () => {
  const { summe, segmente } = donutSegmente([
    { label: "A", wert: 40 },
    { label: "B", wert: 30 },
    { label: "C", wert: 10 },
    { label: "D", wert: 10 },
    { label: "E", wert: 5 },
    { label: "F", wert: 5 },
  ]);
  assert.equal(summe, 100);
  assert.equal(segmente.length, 5);
  assert.equal(segmente[4].label, "Weitere");
  assert.equal(segmente[4].wert, 10);
  assert.equal(Math.round(segmente.reduce((a, s) => a + s.anteil, 0)), 100);
  assert.equal(segmente[1].start, 40);
  assert.ok(segmente[0].strich < segmente[0].anteil); // Lücke zwischen Segmenten
  const eins = donutSegmente([{ label: "A", wert: 3 }]);
  assert.equal(eins.segmente[0].strich, 100); // ein Teil: voller Ring ohne Lücke
  assert.equal(donutSegmente([{ label: "A", wert: -3 }]).summe, 0);
});

test("prozentText, sparkPunkte, zielAnteil", () => {
  assert.equal(prozentText(12.345), `12,3${NBSP}%`);
  assert.equal(prozentText(0.4), `< 1${NBSP}%`);
  assert.equal(prozentText(0), `0${NBSP}%`);
  const sp = sparkPunkte([0, 10], 64, 20);
  assert.deepEqual(sp[0], { x: 3, y: 17 });
  assert.deepEqual(sp[1], { x: 61, y: 3 });
  assert.equal(zielAnteil(7, 10), 70);
  assert.equal(zielAnteil(12, 10), 100);
  assert.equal(zielAnteil(5, 0), 0);
});

test("trendBewertung: Farbe nach Bedeutung, nicht Richtung", () => {
  assert.equal(trendBewertung("auf"), "gut");
  assert.equal(trendBewertung("ab"), "schlecht");
  assert.equal(trendBewertung("auf", "niedrig"), "schlecht");
  assert.equal(trendBewertung("ab", "niedrig"), "gut");
  assert.equal(trendBewertung("auf", "neutral"), "neutral");
  assert.equal(trendBewertung("gleich"), "neutral");
});

// ---- Token ---------------------------------------------------------------------------

const css = lies("src/app/globals.css");

function block(start) {
  const i = css.indexOf(start);
  assert.ok(i >= 0, `Block fehlt: ${start}`);
  let tiefe = 0;
  for (let j = css.indexOf("{", i); j < css.length; j++) {
    if (css[j] === "{") tiefe++;
    else if (css[j] === "}" && --tiefe === 0) return css.slice(i, j + 1);
  }
  throw new Error("Block nicht geschlossen");
}
const deklarationen = (text) =>
  Object.fromEntries([...text.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

test("Dunkel per System und per Schalter haben dieselben Werte", () => {
  const system = deklarationen(block('@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"])'));
  const schalter = deklarationen(block(':root[data-theme="dark"] {'));
  assert.ok(Object.keys(system).length > 60);
  assert.deepEqual(schalter, system);
});

test("Jede Rolle mit Hell-Wert hat einen Dunkel-Wert (Status-Tints, Chart)", () => {
  const dunkel = deklarationen(block(':root[data-theme="dark"] {'));
  const pflicht = ["success", "warning", "info", "progress", "special", "neutral"].flatMap((t) => [`--color-bo-${t}-text`, `--color-bo-${t}-soft`]);
  for (const n of [...pflicht, "--color-bo-danger-text", "--color-bo-danger-soft", "--color-bo-overlay", "--color-bo-overlay-leicht", "--color-bo-skeleton", "--color-chart-4", "--color-chart-5", "--color-chart-seq-1", "--color-chart-seq-5", "--color-chart-negativ"]) {
    assert.ok(dunkel[n], `Dunkel-Wert fehlt: ${n}`);
  }
});

test("Dichte-Variablen: kompakt, komfortabel, Kiosk vollständig", () => {
  const namen = ["--bo-row-h", "--bo-control-h-s", "--bo-control-h", "--bo-control-h-l", "--bo-cell-px", "--bo-card-p", "--bo-font-table", "--bo-gap", "--bo-segment-h"];
  const kompakt = deklarationen(block(':root,\n[data-dichte="kompakt"] {'));
  const komfortabel = deklarationen(block('[data-dichte="komfortabel"] {'));
  const kiosk = deklarationen(block('[data-dichte="kiosk"] {'));
  for (const n of namen) {
    assert.ok(kompakt[n] && komfortabel[n] && kiosk[n], `Dichte-Variable fehlt: ${n}`);
  }
  assert.equal(kompakt["--bo-row-h"], "36px");
  assert.equal(komfortabel["--bo-row-h"], "44px");
  assert.equal(kiosk["--bo-row-h"], "56px");
  assert.equal(kompakt["--bo-control-h"], "32px");
  assert.equal(komfortabel["--bo-control-h"], "40px");
  assert.equal(kiosk["--bo-control-h"], "48px");
});

test("Grundbausteine nutzen nur definierte Farb-Token und keine Hex-Werte", () => {
  const definiert = new Set([...css.matchAll(/(--color-[a-z0-9-]+):/g)].map((m) => m[1]));
  const dateien = ["Knopf", "StatusBadge", "Kennzahl", "Leer", "Fehler", "Segment", "Charts/index", "Charts/Zahl"].map((d) => `src/components/Backoffice/${d}.js`);
  for (const d of dateien) {
    const text = lies(d);
    assert.doesNotMatch(text, /#[0-9a-fA-F]{6}\b/, `${d}: Hex-Wert`);
    for (const m of text.matchAll(/(?:bg|text|border|ring|fill|stroke|decoration|from|to)-(bo-[a-z0-9-]+?)(?:\/\d+)?(?=[\s"'`:\]])/g)) {
      const name = `--color-${m[1]}`;
      assert.ok(definiert.has(name), `${d}: Token ${name} fehlt in globals.css`);
    }
    for (const m of text.matchAll(/var\((--color-[a-z0-9-]+)\)/g)) {
      assert.ok(definiert.has(m[1]), `${d}: ${m[1]} fehlt in globals.css`);
    }
  }
});

test("Demo-Register: Grundbausteine nur für Admin im Mock", async () => {
  const text = lies("src/lib/backoffice/demo-register.js");
  assert.match(text, /grundbausteine: \{[^\n]*team: "P0-2"[^\n]*Demo\/grundbausteine/);
});
