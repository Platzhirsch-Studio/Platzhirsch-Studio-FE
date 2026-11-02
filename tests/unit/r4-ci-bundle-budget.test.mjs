// tests/unit/r4-ci-bundle-budget.test.mjs — R4-plattform-ci
// tools/ci/bundle-budget.mjs gegen eine künstliche Build-Ausgabe im Temp-Ordner.
// Run: node --test tests/unit/r4-ci-bundle-budget.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { analyze, normalizeChunk, pageChunks, toMarkdown } from "../../tools/ci/bundle-budget.mjs";

const TOOL = path.resolve("tools/ci/bundle-budget.mjs");

// Zufallsbytes komprimieren kaum: gz ≈ roh. So lassen sich Größen steuern.
function writeChunk(dir, name, kib) {
  const file = path.join(dir, "static", "chunks", name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const buf = crypto.randomBytes(Math.round(kib * 1024));
  fs.writeFileSync(file, buf);
  return zlib.gzipSync(buf, { level: 9 }).length;
}

function writeManifest(dir, key, entries) {
  const file = path.join(dir, "server", "app", `${key}_client-reference-manifest.js`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const body = { clientModules: {}, entryCSSFiles: {}, entryJSFiles: entries };
  fs.writeFileSync(
    file,
    `globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};\nglobalThis.__RSC_MANIFEST[${JSON.stringify(key)}] = ${JSON.stringify(body)};\n`
  );
}

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "r4-ci-bb-"));
  writeChunk(dir, "main.js", 100);
  writeChunk(dir, "poly.js", 40);
  writeChunk(dir, "layout.js", 30);
  writeChunk(dir, "small.js", 10);
  writeChunk(dir, "big.js", 80);
  writeChunk(dir, "ge.js", 2);
  fs.writeFileSync(
    path.join(dir, "build-manifest.json"),
    JSON.stringify({ rootMainFiles: ["static/chunks/main.js"], polyfillFiles: ["static/chunks/poly.js"] })
  );
  fs.writeFileSync(
    path.join(dir, "app-path-routes-manifest.json"),
    JSON.stringify({
      "/[locale]/klein/page": "/[locale]/klein",
      "/[locale]/gross/page": "/[locale]/gross",
      "/api/x/route": "/api/x",
    })
  );
  fs.writeFileSync(path.join(dir, "BUILD_ID"), "test-build\n");
  writeManifest(dir, "/[locale]/klein/page", {
    "[project]/app/[locale]/layout": ["static/chunks/main.js", "static/chunks/layout.js"],
    "[project]/app/[locale]/klein/page": ["static/chunks/small.js"],
    "[project]/app/global-error": ["static/chunks/ge.js"],
  });
  writeManifest(dir, "/[locale]/gross/page", {
    "[project]/app/[locale]/layout": ["static/chunks/layout.js"],
    "[project]/app/[locale]/gross/page": ["static/chunks/big.js", "static/chunks/small.js"],
  });
  return dir;
}

test("normalizeChunk: /_next/-Präfix und Backslashes", () => {
  assert.equal(normalizeChunk("/_next/static/chunks/a.js"), "static/chunks/a.js");
  assert.equal(normalizeChunk("static\\chunks\\a.js"), "static/chunks/a.js");
});

test("pageChunks: Vereinigung aller Segmente inkl. global-error (steht im HTML)", () => {
  const set = pageChunks({ entryJSFiles: { a: ["x.js", "y.js"], "b/global-error": ["z.js"], c: ["x.js"] } });
  assert.deepEqual([...set].sort(), ["x.js", "y.js", "z.js"]);
});

test("analyze: Größe je Route, gemeinsame Dateien einmal, API-Routen ausgelassen, Budget", () => {
  const dir = fixture();
  const r = analyze(dir, { budgetKb: 190 });
  assert.equal(r.buildId, "test-build");
  assert.deepEqual(r.routes.map((x) => x.route), ["/[locale]/gross", "/[locale]/klein"]);
  const gross = r.routes[0];
  const klein = r.routes[1];
  // gross: main 100 + layout 30 + big 80 + small 10 ≈ 220 KiB > 190
  assert.ok(gross.gzKb > 215 && gross.gzKb < 225, `gross ${gross.gzKb}`);
  assert.equal(gross.over, true);
  assert.equal(gross.files, 4);
  // klein: main 100 (nicht doppelt) + layout 30 + small 10 + ge 2 ≈ 142
  assert.ok(klein.gzKb > 139 && klein.gzKb < 146, `klein ${klein.gzKb}`);
  assert.equal(klein.over, false);
  assert.equal(klein.files, 4);
  assert.deepEqual(r.over, ["/[locale]/gross"]);
  assert.ok(Math.abs(r.shared.gzKb - 100) < 2);
  // Polyfills nur auf Wunsch.
  const withPoly = analyze(dir, { budgetKb: 190, includePolyfills: true });
  assert.ok(withPoly.routes[1].gzKb - klein.gzKb > 38);
  const md = toMarkdown(r);
  assert.match(md, /\| `\/\[locale\]\/gross` \| \d+(\.\d)? \|/);
  assert.match(md, /über Budget/);
});

test("analyze: fehlende Chunk-Datei wird gemeldet, nicht verschluckt; fehlende Build-Ausgabe wirft", () => {
  const dir = fixture();
  fs.rmSync(path.join(dir, "static", "chunks", "small.js"));
  const r = analyze(dir);
  assert.ok(r.routes.find((x) => x.route === "/[locale]/klein").missing.includes("static/chunks/small.js"));
  assert.throws(() => analyze(path.join(dir, "gibt-es-nicht")), /Build-Ausgabe fehlt/);
});

test("CLI: Exit 1 über Budget, 0 im Budget, 2 ohne Build; schreibt JSON und Markdown", () => {
  const dir = fixture();
  const out = path.join(dir, "report");
  const over = spawnSync(process.execPath, [TOOL, `--dir=${dir}`, `--json=${out}/r.json`, `--md=${out}/r.md`], { encoding: "utf8" });
  assert.equal(over.status, 1, over.stderr);
  assert.match(over.stderr, /über 190 KiB/);
  assert.equal(JSON.parse(fs.readFileSync(`${out}/r.json`, "utf8")).over.length, 1);
  assert.ok(fs.readFileSync(`${out}/r.md`, "utf8").startsWith("# Bundle-Budget"));

  const ok = spawnSync(process.execPath, [TOOL, `--dir=${dir}`, "--budget-kb=300"], { encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /alle 2 Routen im Budget/);

  const missing = spawnSync(process.execPath, [TOOL, `--dir=${path.join(dir, "nix")}`], { encoding: "utf8" });
  assert.equal(missing.status, 2);
});

test("Manifest läuft in einer leeren VM: kein Zugriff auf process/require", () => {
  const dir = fixture();
  const evil = path.join(dir, "server", "app", "[locale]", "klein", "page_client-reference-manifest.js");
  fs.writeFileSync(evil, "process.exit(99);");
  const r = analyze(dir);
  assert.ok(r.errors.some((e) => e.route === "/[locale]/klein" && /unlesbar/.test(e.error)));
});
