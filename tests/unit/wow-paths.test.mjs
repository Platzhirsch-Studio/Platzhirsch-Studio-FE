// Wow hero "Pause" – data contracts (wow-spezifikation §4, §5, §8.2; push r4).
//   node --test tests/unit/wow-paths.test.mjs
// 1. Registration: the viewBox is the photo's real size (sharp), every path
//    lies inside it.
// 2. Drawing (push r3): 13–17 paths, 9–12 "base" paths for phones, the room
//    as ONE stroke, every pen path one continuous stroke (no ruler splits),
//    no zero-length dash (no vertex dots), pressure core < swell < belly.
// 3. Timeline: three acts, every stroke inside the line act, the room visible
//    by 1.6 s after the pen starts and ≤ 2.4 s after the start script in
//    production (deadline + release), climax hold ≥ 1400 ms (push r4, Wächter
//    #4 – the extension goes into the rest phase only), rest by 3.3 s.
// 4. Budgets: inline script ≤ 900 B, CSS ≤ 4.5 KB gzip (minified), stage SVG
//    markup ≤ 10 KB gzip (with the pencil underdrawing), no image besides the
//    photo, WowControls without libraries; every keyframe of the comparison
//    edge and the invitation moves by transform, none by clip-path (Safari,
//    Wächter r4 #1).
// 5. Hero switch exactly as specified, old hero kept as fallback.
// 6. Texts: no superlative, no "!", no Harald name in phase A.
// Registration against the photo: tests/unit/wow-registration.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PAUSE_PATHS, VIEWBOX, PHOTO_SIZE, CHAIR_PATH_ID } from "../../src/lib/wow/pause-paths.js";
import { inkStrokes, dash } from "../../src/lib/wow/ink.js";
import { TIMELINE, STATES, strokeTimings, stateStarts, stageVars, START_DEADLINE } from "../../src/lib/wow/timeline.js";
import { START_SCRIPT } from "../../src/lib/wow/start-script.js";
import MESSAGES from "../../src/lib/wow/messages.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const nums = (d) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
const gz = (s) => zlib.gzipSync(Buffer.from(s)).length;

test("Deckung: viewBox = Originalmaß von aboutHome.jpg", async () => {
  const meta = await sharp(path.join(root, "public/Images/Home/aboutHome.jpg")).metadata();
  assert.deepEqual({ width: meta.width, height: meta.height }, PHOTO_SIZE);
  assert.equal(VIEWBOX, `0 0 ${meta.width} ${meta.height}`);
});

test("Deckung: alle Pfade liegen innerhalb der viewBox, max. 1 Nachkommastelle", () => {
  const { width: W, height: H } = PHOTO_SIZE;
  for (const p of PAUSE_PATHS) {
    const n = nums(p.d);
    for (let i = 0; i < n.length; i += 2) {
      assert.ok(n[i] >= 0 && n[i] <= W && n[i + 1] >= 0 && n[i + 1] <= H, `${p.id} point ${n[i]},${n[i + 1]}`);
    }
    assert.ok(!/\d\.\d\d/.test(p.d), `${p.id}: max. 1 decimal`);
  }
});

test("Zeichnung: 13–17 Pfade, 9–12 base, Raum in einem Strich, kein Sofa/Tisch mehr, Sessel vorhanden", () => {
  assert.ok(PAUSE_PATHS.length >= 13 && PAUSE_PATHS.length <= 17, `paths ${PAUSE_PATHS.length}`);
  const base = PAUSE_PATHS.filter((p) => p.detail === "base").length;
  assert.ok(base >= 9 && base <= 12, `base ${base}`);
  assert.deepEqual(PAUSE_PATHS.filter((p) => p.gesture).map((p) => p.id), ["room"]);
  assert.equal(PAUSE_PATHS.find((p) => p.kind !== "guide").id, "room", "the gesture comes first");
  assert.ok(PAUSE_PATHS.filter((p) => p.kind === "guide").every((p) => p.group === 0), "construction lines first");
  assert.equal(new Set(PAUSE_PATHS.map((p) => p.id)).size, PAUSE_PATHS.length);
  assert.ok(PAUSE_PATHS.some((p) => p.id === CHAIR_PATH_ID));
  // luxus-cd #3: what does not sit within 2 px is struck
  assert.ok(!PAUSE_PATHS.some((p) => /^(sofa|marble|hex)/.test(p.id)));
});

test("Tusche: jeder Strich durchgehend (keine Lineal-Teilung), Druckverlauf, kein Strich der Länge 0", () => {
  for (const p of inkStrokes(PAUSE_PATHS)) {
    assert.equal(p.rd, p.d, `${p.id}: rendered as drawn`);
    if (p.kind === "guide") {
      assert.equal(p.swell, null);
      continue;
    }
    assert.equal((p.d.match(/M/g) || []).length, 1, `${p.id}: one continuous stroke`);
    const [a, b] = p.swell;
    assert.ok(a >= 0.05 && a <= 0.2 && a + b <= 0.95 && b >= 0.55, `${p.id} swell ${a} ${b}`);
    if (p.belly) assert.ok(p.belly[0] + p.belly[1] < 1);
    for (const r of [p.swell, p.belly].filter(Boolean)) {
      const { strokeDasharray, strokeDashoffset } = dash(r);
      assert.ok(strokeDasharray.split(" ").map(Number).every((n) => n > 0), `${p.id} dash ${strokeDasharray}`);
      assert.ok(strokeDashoffset < 0);
    }
  }
  const css = read("src/components/Wow/Pause.module.css");
  const px = (k) => Number(css.match(new RegExp(`--${k}: ([\\d.]+)px`))[1]);
  assert.ok(px("pen") < px("swell") && px("swell") < px("belly") && px("belly") / px("pen") >= 3, "visible pressure range");
});

test("Timeline: drei Akte, Striche im Linien-Akt, Raum ≤ 2,4 s nach dem Startskript (Produktion), Höhepunkt ≥ 1,4 s, Ruhe ≤ 3,3 s", () => {
  const t = TIMELINE;
  assert.deepEqual(STATES, ["line", "light", "room"]);
  const strokes = strokeTimings();
  assert.deepEqual(Object.keys(strokes).sort(), PAUSE_PATHS.filter((p) => p.kind !== "guide").map((p) => p.id).sort());
  for (const [id, { delay, dur }] of Object.entries(strokes)) {
    assert.ok(delay >= t.line[0] && delay + dur <= t.line[1], `${id} ${delay}+${dur}`);
  }
  // one gesture first: no other stroke starts before the room is 80 % drawn
  const first = Math.min(...Object.entries(strokes).filter(([id]) => id !== "room").map(([, v]) => v.delay));
  assert.ok(first >= strokes.room.delay + strokes.room.dur * 0.8, "pieces follow the gesture");
  // each armchair: the shell comes before its seat line and feet
  for (const side of ["left", "right"])
    for (const part of ["seam", "foot", "foot-2"]) assert.ok(strokes[`chair-${side}-${part}`].delay > strokes[`chair-${side}`].delay);
  assert.ok(t.light[0] < t.line[1] && t.light[1] <= t.room[0], "light comes in while the last strokes land, before the release");
  assert.ok(t.litIn > t.room[0] && t.litIn < t.room[1]);
  const s = stateStarts();
  assert.deepEqual([s.line, s.light, s.room], [0, t.light[0], t.room[0]]);
  // Wächter #6: room visible ≤ 2.4 s after the start script (production deadline 850 ms)
  assert.ok(t.room[1] <= 1600);
  assert.ok(START_DEADLINE + t.room[1] <= 2400, "worst case: compositor pen from the deadline");
  assert.equal(t.hold[0], t.room[1]);
  assert.ok(t.hold[1] - t.hold[0] >= 1400, "climax ≥ 1.4 s (Wächter r4 #4)");
  assert.equal(t.outro[0], t.hold[1]);
  assert.equal(t.outro[1], t.end);
  assert.ok(t.end <= 3300);
  assert.ok(Object.keys(stageVars()).length >= 8);
});

test("Budget: Inline-Skript ≤ 900 B, CSS ≤ 4,5 KB gzip, SVG ≤ 10 KB gzip, kein Bild außer dem Foto", () => {
  assert.ok(Buffer.byteLength(START_SCRIPT) <= 900, `script ${Buffer.byteLength(START_SCRIPT)} B`);
  // a second image in the stage (SVG <image>, CSS url()) can become the LCP element (push r2)
  const stage = read("src/components/Wow/WowStage.js");
  assert.ok(!/<image\b|href="\/wow\//.test(stage), "no image in the stage SVG");
  const cssNoComments = read("src/components/Wow/Pause.module.css").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/url\((?!#)/.test(cssNoComments), "no url() image in the CSS");
  const css = cssNoComments.replace(/\s+/g, " ").replace(/\s*([{};:,>])\s*/g, "$1");
  assert.ok(gz(css) <= 4608, `css ${gz(css)} B gzip`);
  // compositor release: the paper's edge moves by transform only
  assert.match(cssNoComments, /@keyframes wow-sweep\s*\{\s*from\s*\{\s*transform:/);
  assert.match(cssNoComments, /@keyframes wow-hold-paper\s*\{\s*from\s*\{\s*transform:/);
  // push r4 (Wächter #1): comparison edge and invitation by transform, no clip-path keyframe
  for (const k of cssNoComments.matchAll(/@keyframes ([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
    assert.ok(!/clip-path/.test(k[2]), `${k[1]}: no clip-path animation`);
  }
  for (const k of ["wow-invite-cut", "wow-invite-in", "wow-invite-rail"]) {
    assert.match(cssNoComments, new RegExp(`@keyframes ${k}\\s*\\{[^@]*transform:`), k);
  }
  assert.match(cssNoComments, /\.stage:not\(\[data-wow="play"\]\) \.cut \{\s*transform: translateX\(calc\(var\(--cut\) - 100%\)\)/);
  // Approximate server markup of the SVG layers.
  const svg =
    '<svg><defs><pattern id="wow-grid" width="64" height="64"><rect width="64" height="64" class="x"/><path d="M64 0H0V64" class="x"/></pattern></defs><rect width="2048" height="1228" fill="url(#wow-grid)"/></svg>' +
    inkStrokes(PAUSE_PATHS)
      .map(
        (p) =>
          `<g data-detail="${p.detail}" style="--d:200ms;--t:300ms"><path d="${p.rd}" pathLength="1" class="x"/>` +
          (p.swell ? `<path d="${p.rd}" pathLength="1" class="y" style="stroke-dasharray:0.7 0.3;stroke-dashoffset:-0.12"/>` : "") +
          (p.belly ? `<path d="${p.rd}" pathLength="1" class="z" style="stroke-dasharray:0.3 0.7;stroke-dashoffset:-0.3"/>` : "") +
          "</g>" +
          // light core + pencil underdrawing (push r4)
          (p.kind === "guide" ? "" : `<path d="${p.rd}" data-detail="${p.detail}"/>`.repeat(2)),
      )
      .join("");
  assert.ok(gz(svg) <= 10 * 1024, `svg ${gz(svg)} B gzip`);
});

test("Startskript: wartet auf den Stift, springt bei Eingabe zum Raum, blendet über", () => {
  assert.match(START_SCRIPT, /wowWait=""/);
  assert.match(START_SCRIPT, /pointerdown keydown wheel touchstart/);
  assert.match(START_SCRIPT, /wowFade=""/);
  assert.match(START_SCRIPT, /wowState="room"/);
  assert.match(START_SCRIPT, /ph-calm-view/);
  // at the deadline: compositor pen if the photo is decoded, else fade (Wächter #2/#6)
  assert.match(START_SCRIPT, /wowPen="wipe"/);
  const css = read("src/components/Wow/Pause.module.css");
  assert.match(css, /\[data-wow-pen="wipe"\] \.inkSweep \{\s*animation: wow-sweep/);
});

test("WowControls: 'use client', keine Bibliothek, Stift erst nach Idle, Regler mit role=slider", () => {
  const src = read("src/components/Wow/WowControls.js");
  assert.match(src, /^"use client";/);
  const imports = [...src.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imports, ["react"]);
  // shipped code is minified: measure without comments and indentation
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^\s+/gm, "");
  assert.ok(gz(code) <= 4096, `controls ${gz(code)} B gzip`);
  assert.match(src, /requestIdleCallback\(fn, \{ timeout: 600 \}\)/);
  assert.match(src, /role="slider"/);
  assert.match(src, /ph:wow-done/);
  const stage = read("src/components/Wow/WowStage.js");
  assert.ok(!/three|@react-three|from "motion|framer-motion|embla/.test(stage));
});

test("Hero.js: Schalter wie spezifiziert, alter Hero bleibt Fallback", () => {
  const hero = read("src/components/Home/Hero.js");
  assert.ok(
    hero.includes(
      // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9): standardmäßig AN, "0" schaltet ab.
      'const WOW_HERO = (process.env.NEXT_PUBLIC_WOW_HERO ?? "1") !== "0";',
    ),
  );
  assert.match(hero, /WOW_HERO \? \(\s*<WowStage/);
  // Runde 2 P2: on phones the coda also carries the USP sentence (usp prop)
  assert.match(hero, /WOW_HERO \? <WowCoda locale=\{locale\} usp=\{uspPhone\} \/> : null/);
  assert.match(hero, /<picture>/, "fallback picture kept");
  assert.match(hero, /WOW_HERO \? null : \(\s*<div className="relative mt-stack-m aspect-\[3\/2\]/, "old photo block kept at its place");
  // switched off, every layout class is the previous one
  for (const c of [
    "px-gutter pt-6 lg:col-span-6 lg:row-start-1 lg:px-0 lg:pt-16",
    "block font-display text-display-l text-text lg:text-display-xl",
    "px-gutter pt-stack-m lg:col-span-6 lg:row-start-3 lg:px-0",
    "px-gutter pt-stack-m lg:col-span-6 lg:row-start-4 lg:self-start lg:px-0 lg:pb-2",
    "mt-stack-s block font-sans text-lead font-medium text-text-soft",
  ])
    assert.ok(hero.includes(`"${c}"`), c);
  assert.match(hero, /eyebrow: undefined/);
  assert.match(hero, /WOW_HERO \? \{ "data-wow-cta": "" \} : \{\}/);
  assert.equal((hero.match(/preload\(/g) || []).length, 2, "preload logic unchanged");
});

test("Texte: keine Superlative, kein Ausrufezeichen, Harald erst in Phase B, Vorschlag = Code", () => {
  for (const [loc, m] of Object.entries(MESSAGES)) {
    const flat = JSON.stringify({ ...m, caption: { phaseA: m.caption.phaseA } });
    assert.ok(!flat.includes("!"), loc);
    assert.ok(!/Harald/.test(flat), `${loc}: Harald only in phaseB`);
    assert.ok(!/\b(beste|einzigartig|best|unique|meilleur|migliore)\b/i.test(flat), loc);
    // push r4 (luxus-cd #3): no toolbar, one quiet button, a labelled grip
    assert.equal(m.states, undefined);
    assert.equal(m.replay, undefined);
    assert.deepEqual(Object.keys(m.show), ["open", "close"]);
    assert.match(m.slider.grip, /↔/);
    assert.ok(m.slider.value.includes("{n}"));
  }
  const json = JSON.parse(read("Marktresearch/digital/features/wow-messages-vorschlag.json"));
  for (const loc of Object.keys(MESSAGES)) assert.deepEqual(json[loc].Wow, MESSAGES[loc], loc);
});
