// Motion planer-tools (01.11.2026): Küchenplaner, Sofaplaner, Stil-Finder, Hub.
// Source checks: new motion uses the shared tokens, animates opacity/transform
// only, never starts invisible, and stands still under prefers-reduced-motion
// AND the "Ruhige Ansicht" (html[data-motion="reduced"|"calm"]) – in CSS and in
// the JS paths (framer-motion, smooth scroll, 3D camera).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const KP_CSS = read("src/components/Labs/Kuechenplaner/Kuechenplaner.module.css");
const SP_CSS = read("src/components/Labs/Sofaplaner/sofaplaner.module.css");

// all properties inside the named @keyframes blocks
function keyframeProps(css, names) {
  const props = new Set();
  for (const name of names) {
    const start = css.indexOf(`@keyframes ${name}`);
    assert.ok(start >= 0, `@keyframes ${name} fehlt`);
    let depth = 0;
    let i = css.indexOf("{", start);
    const from = i;
    for (; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) break;
    }
    for (const m of css.slice(from, i).matchAll(/([a-z-]+)\s*:/g)) props.add(m[1]);
    // never from invisible
    assert.doesNotMatch(css.slice(from, i), /opacity:\s*0(?:\.0*)?\s*;/, `${name} startet unsichtbar`);
  }
  return [...props];
}

test("Keyframes der Planer: nur opacity/transform, Start nie unsichtbar", () => {
  for (const p of keyframeProps(KP_CSS, ["kpSwapIn", "kpTick"])) assert.ok(["opacity", "transform"].includes(p), p);
  for (const p of keyframeProps(SP_CSS, ["spSwapIn", "spFoldIn", "spArrive"])) assert.ok(["opacity", "transform"].includes(p), p);
});

test("Küchenplaner: Reiter- und Preiswechsel nur mit Bewegung erlaubt, Tokens", () => {
  assert.match(KP_CSS, /@media \(prefers-reduced-motion: no-preference\) \{\s*:global\(:root:not\(\[data-motion="reduced"\], \[data-motion="calm"\]\)\) \.panel > \* \{\s*animation: kpSwapIn var\(--duration-swap/);
  assert.match(KP_CSS, /\.tick \{\s*animation: kpTick var\(--duration-ui/);
  const app = read("src/components/Labs/Kuechenplaner/KuechenplanerApp.js");
  // QM r4: Preiszeilen als <span data-kp-line> (WCAG 1.4.12: keine Absatzabstände in der festen Leiste)
  assert.match(app, /<span key=\{`\$\{price\.min\}-\$\{price\.max\}`\} data-kp-line="" className=\{`\$\{styles\.tick\}/);
  // smooth scroll asks both questions (system + Ruhige Ansicht)
  assert.doesNotMatch(app, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.equal(app.match(/scrollBehavior\(document, window\)/g)?.length, 2);
  assert.match(read("src/components/Labs/Kuechenplaner/ResultPanel.js"), /className="ph-arrive mt-4 bg-\[#eef3ea\]/);
});

test("Küchenplaner 3D: Kamerafahrten folgen auch data-motion", () => {
  const v = read("src/components/Labs/Kuechenplaner/Viewer.js");
  assert.match(v, /attributeFilter: \["data-motion"\]/);
  assert.match(v, /useSyncExternalStore\(subscribeRM, \(\) => isCalmMotion\(document, window\), \(\) => false\)/);
});

test("Sofaplaner: Schritt, Menü, Bestätigung, Modellkarte; Ruhige Ansicht stoppt alles", () => {
  assert.match(SP_CSS, /\.side > \.stack \{\s*animation: spSwapIn var\(--duration-swap/);
  assert.match(SP_CSS, /\.menu \{\s*animation: spFoldIn var\(--duration-ui/);
  assert.match(SP_CSS, /\.okBox \{\s*animation: spArrive/);
  assert.match(SP_CSS, /@media \(hover: hover\) and \(prefers-reduced-motion: no-preference\) \{\s*\.modelCard:hover \.silhouette \{\s*transform: scale\(1\.03\)/);
  assert.match(SP_CSS, /:global\(:root:is\(\[data-motion="reduced"\], \[data-motion="calm"\]\)\) \.app \*,[\s\S]*?animation: none !important;/);
  const planner = read("src/components/Labs/Sofaplaner/Planner.js");
  assert.match(planner, /const smooth = !isCalmMotion\(document, window\);/);
  assert.match(planner, /className=\{`\$\{s\.loading3d\} ph-skeleton`\}/);
});

test("Stil-Finder: Framer folgt der Ruhigen Ansicht, Paletten-Hover ohne Layout", () => {
  const motion = read("src/components/Labs/motion.js");
  assert.match(motion, /export const CALM_VALUES = \["reduced", "calm"\];/);
  assert.match(motion, /export function useCalmMotion\(\)/);
  assert.match(motion, /attributeFilter: \["data-motion"\]/);
  const quiz = read("src/components/Labs/Stilfinder/StilfinderQuiz.js");
  assert.match(quiz, /const reduce = useCalmMotion\(\);/);
  assert.doesNotMatch(quiz, /flexGrow:/);
  assert.match(quiz, /motion-safe:hover:scale-x-\[1\.35\]/);
  assert.match(quiz, /motion-safe:group-hover:scale-\[1\.04\]/);
  assert.doesNotMatch(quiz, /duration-700/);
});

test("Stil-Finder: Ladezustand, Ergebnis, Bestätigung", () => {
  const sk = read("src/components/Labs/Stilfinder/Skeletons.js");
  assert.match(sk, /const block = "ph-skeleton";/);
  assert.doesNotMatch(sk, /animate-pulse/);
  const res = read("src/components/Labs/Stilfinder/StilResult.js");
  assert.match(res, /:root:is\(\[data-motion=reduced\],\[data-motion=calm\]\) \[data-sf-anim\]\{animation:none!important\}/);
  assert.match(read("src/components/Labs/Stilfinder/MoodboardPdfForm.js"), /className="ph-arrive border border-ink\/15 bg-white p-6 sm:p-10"/);
  assert.match(read("src/components/Labs/Stilfinder/Moodboard.js"), /duration-\(--duration-enter\) ease-quiet motion-safe:group-hover:scale-\[1\.03\]/);
});

test("Hub und Sofaplaner-Seite: Abschnitte erscheinen gestaffelt (reveal-group)", () => {
  const hub = read("src/components/Labs/Hub/LabsHub.js");
  assert.equal(hub.match(/reveal-group/g)?.length >= 2, true);
  const page = read("src/app/[locale]/sofaplaner/page.js");
  assert.equal(page.match(/ph-chapter/g)?.length, 2);
  assert.equal(page.match(/reveal-group/g)?.length, 2);
});
