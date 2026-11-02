// tests/unit/tempo-fix2.test.mjs — Tempo Nachbessern Runde 2 (qa-screenshots/tempo/fix2.md):
// 1. Prefetch-Tor: <Link> (next-intl, src/i18n/navigation.js) prefetcht erst
//    nach load + 1,2 s im Leerlauf oder bei der ersten Absicht.
// 2. Sofaplaner: FamilyList ohne Client-Wörterbuch (ui-en.js nicht mehr im
//    ersten Bundle), Texte vom Server.
// 3. PlannerGate: im Leerlauf zod/mini -> model.js -> Planer in drei Aufgaben.
// Run: node --test tests/unit/tempo-fix2.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const STATIC_IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
function resolve(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const e of ["", ".js", ".mjs", "/index.js"]) {
    const p = base + e;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}
function staticGraph(entry) {
  const seen = new Set();
  const stack = [path.join(ROOT, entry)];
  while (stack.length) {
    const f = stack.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    const s = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const m of s.matchAll(STATIC_IMPORT)) {
      const r = resolve(f, m[1] || m[2]);
      if (r) stack.push(r);
    }
  }
  return [...seen].map((f) => path.relative(SRC, f).split(path.sep).join("/"));
}

test("Prefetch-Tor: gatedPrefetch hält jedes prefetch-Prop bis zum Öffnen zurück, danach unverändert", async () => {
  const { gatedPrefetch } = await import("../../src/lib/prefetchGate.js");
  for (const p of [undefined, null, true, "auto"]) {
    assert.equal(gatedPrefetch(false, p), false, `zu: ${p}`);
    assert.equal(gatedPrefetch(true, p), p, `offen: ${p}`);
  }
  assert.equal(gatedPrefetch(false, false), false);
  assert.equal(gatedPrefetch(true, false), false, "prefetch={false} bleibt false");
});

test("Prefetch-Tor: öffnet nach load + Verzögerung im Leerlauf, einmal je Dokument", async () => {
  const listeners = new Map();
  const timers = [];
  const idles = [];
  globalThis.window = {
    addEventListener: (k, fn) => listeners.set(k, [...(listeners.get(k) || []), fn]),
    removeEventListener: (k, fn) => listeners.set(k, (listeners.get(k) || []).filter((x) => x !== fn)),
    setTimeout: (fn, ms) => timers.push({ fn, ms }),
    clearTimeout: () => {},
    requestIdleCallback: (fn, opts) => idles.push({ fn, opts }),
    cancelIdleCallback: () => {},
  };
  globalThis.document = { readyState: "loading" };
  try {
    const gate = await import(`../../src/lib/prefetchGate.js?t=${Date.now()}`);
    let calls = 0;
    const off = gate.subscribePrefetchGate(() => calls++);
    assert.equal(gate.isPrefetchOpen(), false, "vor load zu");
    for (const k of ["pointerdown", "touchstart", "keydown", "wheel", "pointermove", "load"]) assert.ok(listeners.get(k)?.length, k);
    listeners.get("pointermove")[0]({ pointerType: "touch" });
    assert.equal(gate.isPrefetchOpen(), false, "pointermove ohne Maus öffnet nicht");
    listeners.get("load")[0]();
    assert.equal(timers.at(-1).ms, gate.PREFETCH_DELAY_MS);
    timers.at(-1).fn();
    assert.equal(idles.at(-1).opts.timeout, gate.PREFETCH_IDLE_TIMEOUT_MS);
    assert.equal(gate.isPrefetchOpen(), false, "erst im Leerlauf");
    idles.at(-1).fn();
    assert.equal(gate.isPrefetchOpen(), true);
    assert.equal(calls, 1);
    for (const k of ["pointerdown", "touchstart", "keydown", "wheel", "pointermove"]) assert.equal(listeners.get(k).length, 0, `${k} abgemeldet`);
    off();
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

test("Prefetch-Tor: erste Absicht (Zeiger, Maus-Bewegung) öffnet sofort", async () => {
  for (const [kind, ev] of [["pointerdown", {}], ["pointermove", { pointerType: "mouse" }], ["keydown", {}]]) {
    const l = new Map();
    globalThis.window = {
      addEventListener: (k, fn) => l.set(k, [...(l.get(k) || []), fn]),
      removeEventListener: () => {},
      setTimeout: () => 1,
      clearTimeout: () => {},
    };
    globalThis.document = { readyState: "complete" };
    try {
      const gate = await import(`../../src/lib/prefetchGate.js?${kind}=${Date.now()}`);
      gate.subscribePrefetchGate(() => {});
      assert.equal(gate.isPrefetchOpen(), false);
      l.get(kind)[0](ev);
      assert.equal(gate.isPrefetchOpen(), true, kind);
    } finally {
      delete globalThis.window;
      delete globalThis.document;
    }
  }
});

test("Prefetch-Tor: navigation.js liefert den Tor-Link, gleiche übrigen Exporte", () => {
  const nav = code("src/i18n/navigation.js");
  assert.match(nav, /import GatedLink from '\.\/GatedLink';/);
  assert.match(nav, /export const Link = GatedLink;/);
  assert.match(nav, /export const \{redirect, usePathname, useRouter, getPathname\} =\s*createNavigation\(routing\);/);
  const g = code("src/i18n/GatedLink.js");
  assert.match(g, /^"use client";/);
  assert.match(g, /const \{ Link: IntlLink \} = createNavigation\(routing\);/);
  assert.match(g, /prefetch=\{gatedPrefetch\(isOpen, prefetch\)\}/);
  assert.match(g, /\{\.\.\.props\}/);
});

test("Sofaplaner: FamilyList ist Server-Teil, der Client-Teil zieht kein Wörterbuch", () => {
  const fl = code("src/components/Labs/Sofaplaner/FamilyList.js");
  assert.doesNotMatch(fl, /^\s*["']use client["']/);
  assert.doesNotMatch(fl, /useT/);
  assert.match(fl, /makeT\(locale\)/);
  const page = read("src/app/[locale]/sofaplaner/page.js");
  assert.match(page, /<FamilyList [^\n]*total=\{total\} locale=\{locale\} \/>/);
  assert.match(read("src/components/Labs/Sofaplaner/FamilyListToggle.js"), /^"use client";/);
  for (const f of staticGraph("src/components/Labs/Sofaplaner/FamilyListToggle.js")) assert.doesNotMatch(f, /copy\/|useT|ui-en|glossary-en|family-en/, f);
  // erstes Bundle der Seite: PlannerGate + Toggle, beide ohne ui-en.js
  for (const f of staticGraph("src/components/Labs/Sofaplaner/PlannerGate.js")) assert.doesNotMatch(f, /ui-en|glossary-en|useT/, f);
});

test("Sofaplaner: FamilyList füllt die Elementzahl wie makeT (DE/EN)", async () => {
  const { makeT } = await import("../../src/lib/sofaplaner/copy/t.js");
  for (const locale of ["de", "en"]) {
    const T = makeT(locale);
    assert.equal(T("{n} Elemente").replace(/\{n\}/g, "12"), T("{n} Elemente", { n: 12 }), locale);
  }
});

test("PlannerGate: Leerlauf in drei Aufgaben, Absicht direkt, Server direkt", () => {
  const g = code("src/components/Labs/Sofaplaner/PlannerGate.js");
  assert.match(g, /const nextTask = \(\) => new Promise\(\(resolve\) => setTimeout\(resolve, 0\)\);/);
  assert.match(g, /import\("\.\/zod-mini\.js"\)\s*\.then\(nextTask\)\s*\.then\(\(\) => import\("\.\/model"\)\)\s*\.then\(nextTask\)\s*\.then\(\(\) => import\("\.\/Planner"\)\)/);
  assert.match(g, /direct \|\| typeof window === "undefined"\s*\? import\("\.\/Planner"\)/);
  assert.match(g, /if \(typeof window === "undefined"\) loadPlanner\(true\);/);
  assert.match(g, /const go = \(\) => start\(false\);/);
  assert.match(g, /if \(root\.contains\(e\.target\)\) goNow\(\);/);
  assert.match(g, /pathOf\(root, btn\) \};\s*goNow\(\);/);
});
