// tests/unit/tempo-fix1.test.mjs — Tempo Nachbessern Runde 1 (qa-screenshots/tempo/fix1.md):
// Consent-Chunk jeder Seite ohne lucide, ui-Barrel, Claims-Register und
// Showroom-Texte; Details und Google-Tag-Lader als eigene Chunks; Client-
// Komponenten importieren ui-Bausteine direkt; Merkliste-Link prefetcht bei
// Absicht statt beim Sichtbarwerden.
// Run: node --test tests/unit/tempo-fix1.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as stations from "../../src/lib/showroom/stations.js";
import * as data from "../../src/lib/showroom/data.js";
import { SHOWROOM_PUBLIC, manifestReady } from "../../src/lib/showroom/config.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// Static import graph (import()/next/dynamic not followed), as in tempo-shell.test.mjs.
const STATIC_IMPORT = /(?:^|\n)\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
function resolve(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return { pkg: spec };
  for (const e of ["", ".js", ".mjs", "/index.js"]) {
    const p = base + e;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return { file: p };
  }
  return {};
}
function graph(entries) {
  const files = new Set();
  const pkgs = new Set();
  const stack = entries.map((f) => path.join(SRC, f));
  while (stack.length) {
    const f = stack.pop();
    if (files.has(f) || /\.(css|json)$/.test(f)) continue;
    files.add(f);
    for (const m of fs.readFileSync(f, "utf8").matchAll(STATIC_IMPORT)) {
      const r = resolve(f, m[1] || m[2]);
      if (r.file) stack.push(r.file);
      if (r.pkg) pkgs.add(r.pkg);
    }
  }
  return { files: [...files].map((f) => path.relative(SRC, f).replaceAll("\\", "/")), pkgs: [...pkgs] };
}

test("Consent-Chunk (jede Seite): kein lucide, kein ui-Barrel, keine Claims, keine Showroom-Texte, Details/Google-Tag nachgeladen", () => {
  const { files, pkgs } = graph(["components/Cookies/cookiecomponent.js"]);
  assert.ok(files.includes("lib/legal/services.js"), "Register bleibt die eine Quelle");
  assert.ok(files.includes("lib/showroom/stations.js"));
  assert.ok(!pkgs.some((p) => p.startsWith("lucide-react")), pkgs.join());
  for (const bad of [
    "components/ui/index.js",
    "components/ui/Breadcrumbs.js",
    "lib/legal/claims.js",
    "lib/showroom/data.js",
    "lib/showroom/copy.js",
    "components/Cookies/cookieItem.js",
    "components/Cookies/googleTag.js",
  ]) {
    assert.ok(!files.includes(bad), `${bad} im Consent-Chunk`);
  }
  const banner = code("src/components/Cookies/cookiecomponent.js");
  assert.match(banner, /const CookieDetails = dynamic\(\(\) => import\("\.\/cookieItem"\)\);/);
  assert.match(banner, /import\("\.\/googleTag"\)/);
  // same calls as before: saved choice → load; new choice → load, then remove withdrawn cookies
  assert.match(banner, /loadGoogleTag\(consent\);\s*if \(removeWithdrawn\) removeWithdrawnCookies\(consent\);/);
  assert.match(banner, /applyGoogleTag\(saved\);/);
  assert.match(banner, /applyGoogleTag\(value, \{ removeWithdrawn: true \}\);/);
  assert.match(banner, /import \{ X \} from "@\/components\/ui\/icons";/);
});

test("showroom/stations.js: dieselben Funktionen, data.js reicht sie weiter, SHOWROOM_PUBLIC unverändert", () => {
  for (const k of ["hasRealMaterial", "visibleStations", "hotspotAllowed", "visibleHotspots"]) {
    assert.equal(typeof stations[k], "function", k);
    assert.equal(data[k], stations[k], `data.${k}`);
  }
  assert.doesNotMatch(read("src/lib/showroom/stations.js"), /^\s*import\s/m, "keine Importe");
  assert.match(read("src/lib/showroom/config.js"), /import \{ visibleStations \} from "\.\/stations\.js";/);
  assert.equal(SHOWROOM_PUBLIC, manifestReady().ok);
  const d = {
    stationen: [
      { id: "a", typ: "raum" },
      { id: "b", typ: "haralds-tisch" },
      { id: "c", typ: "haralds-tisch", material: [{ src: "/x.jpg", quelle: "Harald" }] },
    ],
    hotspots: [
      { station: "a", imShowroom: true, rechte: "ok" },
      { station: "a", imShowroom: true, rechte: "pruefen" },
      { station: "b", imShowroom: true, rechte: "ok" },
    ],
  };
  assert.deepEqual(stations.visibleStations(d).map((s) => s.id), ["a", "c"]);
  assert.equal(stations.visibleHotspots(d).length, 1);
});

test("Client-Komponenten importieren ui-Bausteine direkt, nicht über das Barrel", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.js$/.test(e.name)) {
        const src = fs.readFileSync(p, "utf8");
        if (/^\s*["']use client["']/.test(src) && /from ["']@\/components\/ui["']/.test(src)) offenders.push(path.relative(SRC, p));
      }
    }
  };
  walk(SRC);
  assert.deepEqual(offenders, []);
});

test("Merkliste-Link im Kopf: Prefetch erst bei Absicht (Zeiger, Fokus, Berührung)", () => {
  const src = code("src/components/Navbar/SelectionLink.js");
  assert.match(src, /prefetch=\{intent \? null : false\}/);
  for (const ev of ["onPointerEnter", "onFocus", "onTouchStart"]) assert.match(src, new RegExp(`${ev}=\\{onIntent\\}`), ev);
});
