// tests/unit/tempo-start.test.mjs – Team Startseite, Tempo-Runde 30.10.2026
// (qa-screenshots/tempo/start.md, Inhaber-Entscheidung Nr. 16).
//
// The "Zum Ideenboard" island (IdeenboardAdd + clientStore + model + rights,
// ~4.4 KB gzip) is not in the page chunk of /de: the sketch slot of the USP
// chapter reaches ImageSlot only through a lazy client boundary. A static
// import anywhere in the home tree would pull it back in (Turbopack merges
// all client references of the page; next/dynamic on a SERVER module does not
// split them – checked on the dev server).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// Static import graph of the homepage (src only, "@/" alias, no import()).
function staticGraph(entry) {
  const seen = new Set();
  const queue = [path.join(ROOT, entry)];
  const resolve = (from, spec) => {
    let p;
    if (spec.startsWith("@/")) p = path.join(ROOT, "src", spec.slice(2));
    else if (spec.startsWith(".")) p = path.resolve(path.dirname(from), spec);
    else return null;
    for (const c of [p, `${p}.js`, `${p}.mjs`, path.join(p, "index.js")]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    return null;
  };
  while (queue.length) {
    const f = queue.shift();
    if (seen.has(f)) continue;
    seen.add(f);
    if (!/\.(m?js)$/.test(f)) continue;
    const src = fs.readFileSync(f, "utf8");
    for (const m of src.matchAll(/(?:import|export)[^'"]*?from\s*["']([^"']+)["']/g)) {
      const r = resolve(f, m[1]);
      if (r) queue.push(r);
    }
  }
  return [...seen].map((f) => path.relative(ROOT, f).split(path.sep).join("/"));
}

test("Startseite: Ideenboard-Insel nicht statisch im Seiten-Bundle", () => {
  const files = staticGraph("src/app/[locale]/page.js");
  assert.ok(files.includes("src/components/Home/Process.js"), "Graph erreicht das USP-Kapitel");
  for (const f of ["src/components/Arbeitsweise/ImageSlot.js", "src/components/Pinterest/IdeenboardAdd.js", "src/lib/ideenboard/clientStore.js"]) {
    assert.ok(!files.includes(f), `${f} statisch von der Startseite erreichbar`);
  }
});

test("Startseite: Skizzenplatz über eine Client-Grenze mit next/dynamic, weiter serverseitig gerendert", () => {
  const proc = read("src/components/Home/Process.js");
  assert.match(proc, /import ProcessSketch from "\.\/ProcessSketch"/);
  assert.match(proc, /<ProcessSketch slot=\{sketch\}/);
  assert.doesNotMatch(proc, /<ImageSlot/);
  const lazy = read("src/components/Home/ProcessSketch.js");
  assert.match(lazy, /^"use client";/);
  assert.match(lazy, /dynamic\(\(\) => import\("@\/components\/Arbeitsweise\/ImageSlot"\)\)/);
  assert.doesNotMatch(lazy, /ssr:\s*false/, "SSR bleibt an (Crawler, kein Layoutsprung)");
  // ImageSlot must stay renderable inside a client boundary.
  const slot = read("src/components/Arbeitsweise/ImageSlot.js");
  assert.doesNotMatch(slot, /server-only|next\/headers|next-intl\/server|async function ImageSlot/);
});
