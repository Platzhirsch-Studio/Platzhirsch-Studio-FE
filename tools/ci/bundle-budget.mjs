#!/usr/bin/env node
// tools/ci/bundle-budget.mjs — R4-plattform-ci (Masterplan AP1.6, Budget-Tor)
// JS-Budget je Route aus der Build-Ausgabe (.next), ohne Zusatzpaket.
//
//   node tools/ci/bundle-budget.mjs [--dir=<.next>] [--budget-kb=190]
//        [--json=<datei>] [--md=<datei>] [--include-polyfills]
//        [--compare=<baseUrl>] [--compare-limit=10]
//        [--baseline=<datei>] [--tolerance-kb=2]
//        [--write-baseline=<datei>] [--reset-baseline]
//
// --dir     Build-Ausgabe. Standard: ../platzhirsch-prod-check/.next (die
//           Prod-Kopie von R4-release, nur lesen), in CI: --dir=.next
// Exit 0 = alle Routen im Budget (bzw. nicht über ihrer Baseline),
//      1 = mindestens eine Route darüber, 2 = Build-Ausgabe/Baseline fehlt.
//
// Ratchet (Welle 1): Mit --baseline=tools/ci/bundle-baseline.json ist eine
// Route über dem Budget nur dann rot, wenn sie über ihrem Baseline-Wert plus
// Toleranz liegt (Zuwachs) oder neu ist und keinen Baseline-Wert hat. Das Tor
// ist damit heute grün und verhindert trotzdem jedes weitere Wachstum. Wird
// eine Route kleiner, meldet der Bericht "kleiner als Baseline"; dann die
// Baseline mit --write-baseline neu schreiben, damit der Gewinn gesichert ist.
// --write-baseline übernimmt je Route den KLEINEREN Wert aus alter Baseline
// und aktuellem Build (sie sinkt, steigt nie); --reset-baseline ignoriert die
// alte Datei (nur bewusst, z. B. beim ersten Lauf).
//
// Next 16 druckt keine "First Load JS"-Spalte mehr. Darum wird das Initial-JS
// je Seite aus den Manifesten berechnet:
//   build-manifest.json            rootMainFiles (Runtime, React, Router)
//   app-path-routes-manifest.json  alle App-Routen (nur …/page zählt)
//   server/app/<route>/page_client-reference-manifest.js
//                                  entryJSFiles: Client-Chunks je Segment
//                                  (Layouts, Seite, error/not-found/loading)
// Gezählt wird die Vereinigung aus rootMainFiles und ALLEN entryJSFiles der
// Seite, auch error/not-found/global-error: Next schreibt deren Chunks als
// <script async> ins HTML. Abgleich am 26.10. gegen next start (:3100,
// /de/produkte): 16 Skripte im HTML = 16 gezählte Dateien, gleiche Summe;
// mit --compare=<baseUrl> jederzeit wiederholbar.
// Nicht gezählt: dynamische Importe (next/dynamic, import()), die erst nach
// Klick/Sichtbarkeit laden, und polyfillFiles (nur <script nomodule>, laden in
// modernen Browsern nicht; mit --include-polyfills zählen sie mit).
// Größe = gzip Stufe 9 jeder Datei (wie früher "First Load JS"), in KiB.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DEFAULT_DIR = path.join(REPO, "..", "platzhirsch-prod-check", ".next");
export const DEFAULT_BUDGET_KB = 190;
export const DEFAULT_BASELINE = path.join(REPO, "tools", "ci", "bundle-baseline.json");
// gzip schwankt je Build um wenige hundert Bytes (Hashes, Reihenfolge).
export const DEFAULT_TOLERANCE_KB = 2;

/** Liest eine Baseline-Datei → { route: gzKb }. Fehlt sie, null. */
export function loadBaseline(file) {
  if (!file || !fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const routes = data?.routes && typeof data.routes === "object" ? data.routes : {};
  const out = {};
  for (const [route, value] of Object.entries(routes)) {
    const n = Number(typeof value === "object" ? value?.gzKb : value);
    if (Number.isFinite(n) && n > 0) out[route] = n;
  }
  return out;
}

/**
 * Neue Baseline aus einem Bericht: nur Routen über dem Budget (die übrigen
 * hält das Budget selbst). Mit alter Baseline gilt je Route der kleinere Wert.
 */
export function buildBaseline(report, previous = null) {
  const routes = {};
  for (const r of report.routes) {
    if (r.gzKb <= report.budgetKb) continue;
    const old = previous?.[r.route];
    routes[r.route] = old ? Math.min(old, r.gzKb) : r.gzKb;
  }
  return {
    note: "Bundle-Budget-Ratchet (tools/ci/bundle-budget.mjs --baseline). JS gzip KiB je Route über dem Budget. Nur senken (--write-baseline), nie von Hand erhöhen.",
    buildId: report.buildId,
    budgetKb: report.budgetKb,
    generated: new Date().toISOString().slice(0, 10),
    routes: Object.fromEntries(Object.entries(routes).sort(([a], [b]) => a.localeCompare(b))),
  };
}

export function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

/** Liest page_client-reference-manifest.js in einer leeren VM (kein Zugriff auf Node). */
export function loadClientManifest(file, routeKey) {
  const code = fs.readFileSync(file, "utf8");
  const sandbox = {};
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  vm.runInNewContext(code, sandbox, { timeout: 2000, filename: path.basename(file) });
  const all = sandbox.__RSC_MANIFEST || {};
  return all[routeKey] || Object.values(all)[0] || null;
}

/** Chunks einer Seite: Vereinigung aller entryJSFiles. */
export function pageChunks(manifest) {
  const files = new Set();
  for (const list of Object.values(manifest?.entryJSFiles || {})) {
    for (const f of list || []) files.add(f);
  }
  return files;
}

/** Nur zur Info: nicht inline eingebettete CSS-Dateien der Seite. */
export function pageCss(manifest) {
  const files = new Set();
  for (const [entry, list] of Object.entries(manifest?.entryCSSFiles || {})) {
    if (/\/global-error$/.test(entry)) continue;
    for (const f of list || []) if (!f.inlined && f.path) files.add(f.path);
  }
  return files;
}

/** Vorwärts-Schrägstriche, ohne führendes "/" oder "/_next/". */
export const normalizeChunk = (f) => String(f).replace(/\\/g, "/").replace(/^\/?(_next\/)?/, "");

export function createSizer(dir) {
  const cache = new Map();
  return (file) => {
    const rel = normalizeChunk(file);
    if (!cache.has(rel)) {
      const abs = path.join(dir, rel);
      if (!fs.existsSync(abs)) {
        cache.set(rel, { raw: 0, gz: 0, missing: true });
      } else {
        const buf = fs.readFileSync(abs);
        cache.set(rel, { raw: buf.length, gz: zlib.gzipSync(buf, { level: 9 }).length, missing: false });
      }
    }
    return cache.get(rel);
  };
}

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

/**
 * Berechnet den Bericht. Wirft nur bei fehlender Build-Ausgabe.
 * → { dir, buildId, budgetKb, shared, routes: [{ route, file, files, rawKb, gzKb, ownGzKb, cssGzKb, missing, over }], over, errors }
 */
export function analyze(
  dir,
  { budgetKb = DEFAULT_BUDGET_KB, includePolyfills = false, baseline = null, toleranceKb = DEFAULT_TOLERANCE_KB } = {}
) {
  const buildManifestFile = path.join(dir, "build-manifest.json");
  const routesFile = path.join(dir, "app-path-routes-manifest.json");
  for (const f of [buildManifestFile, routesFile]) {
    if (!fs.existsSync(f)) throw new Error(`Build-Ausgabe fehlt: ${f} (erst "next build" laufen lassen)`);
  }
  const buildManifest = readJson(buildManifestFile);
  const appRoutes = readJson(routesFile);
  const size = createSizer(dir);

  const rootFiles = new Set((buildManifest.rootMainFiles || []).map(normalizeChunk));
  if (includePolyfills) for (const f of buildManifest.polyfillFiles || []) rootFiles.add(normalizeChunk(f));
  const sharedGz = [...rootFiles].reduce((s, f) => s + size(f).gz, 0);
  const sharedRaw = [...rootFiles].reduce((s, f) => s + size(f).raw, 0);

  const routes = [];
  const errors = [];
  for (const [key, route] of Object.entries(appRoutes)) {
    if (!key.endsWith("/page")) continue; // route.js (APIs, Bilder, Feeds) hat kein Client-JS
    const file = path.join(dir, "server", "app", `${key}_client-reference-manifest.js`);
    if (!fs.existsSync(file)) {
      errors.push({ route, error: "client-reference-manifest fehlt" });
      continue;
    }
    let manifest;
    try {
      manifest = loadClientManifest(file, key);
    } catch (error) {
      errors.push({ route, error: `Manifest unlesbar: ${error.message}` });
      continue;
    }
    const own = [...pageChunks(manifest)].map(normalizeChunk).filter((f) => !rootFiles.has(f));
    const all = [...rootFiles, ...own];
    const missing = all.filter((f) => size(f).missing);
    const gz = all.reduce((s, f) => s + size(f).gz, 0);
    const raw = all.reduce((s, f) => s + size(f).raw, 0);
    const ownGz = own.reduce((s, f) => s + size(f).gz, 0);
    const cssGz = [...pageCss(manifest)].reduce((s, f) => s + size(f).gz, 0);
    const gzKb = kb(gz);
    const overBudget = gzKb > budgetKb;
    const baselineKb = baseline ? (baseline[route] ?? null) : null;
    // status: ok | over (ohne Baseline) | baseline (über Budget, nicht gewachsen)
    //         | regression (über Baseline + Toleranz) | new (über Budget, keine Baseline)
    let status = "ok";
    if (overBudget) {
      if (!baseline) status = "over";
      else if (baselineKb == null) status = "new";
      else if (gzKb > baselineKb + toleranceKb) status = "regression";
      else status = "baseline";
    }
    routes.push({
      route,
      files: all.length,
      rawKb: kb(raw),
      gzKb,
      ownGzKb: kb(ownGz),
      cssGzKb: kb(cssGz),
      missing,
      overBudget,
      baselineKb,
      improved: baselineKb != null && gzKb < baselineKb - toleranceKb,
      status,
      over: status === "over" || status === "new" || status === "regression",
      chunks: own,
    });
  }
  routes.sort((a, b) => b.gzKb - a.gzKb || a.route.localeCompare(b.route));
  let buildId = null;
  try {
    buildId = fs.readFileSync(path.join(dir, "BUILD_ID"), "utf8").trim();
  } catch {
    /* optional */
  }
  return {
    dir,
    buildId,
    budgetKb,
    includePolyfills,
    baseline: baseline ? { routes: Object.keys(baseline).length, toleranceKb } : null,
    overBudget: routes.filter((r) => r.overBudget).map((r) => r.route),
    shared: { files: [...rootFiles], gzKb: kb(sharedGz), rawKb: kb(sharedRaw) },
    routes,
    over: routes.filter((r) => r.over).map((r) => r.route),
    errors,
  };
}

export function toMarkdown(report) {
  const lines = [
    `# Bundle-Budget (JS gzip je Route)`,
    ``,
    `Build: \`${report.buildId || "?"}\` · Budget: **${report.budgetKb} KiB** gz · Routen: ${report.routes.length} · über Budget: ${report.overBudget?.length ?? report.over.length} · **rot: ${report.over.length}**`,
    ``,
    report.baseline
      ? `Ratchet: Baseline mit ${report.baseline.routes} Routen, Toleranz ${report.baseline.toleranceKb} KiB. Rot nur bei Zuwachs über die Baseline oder bei neuen Routen über dem Budget.`
      : `Ohne Baseline: Jede Route über dem Budget ist rot.`,
    ``,
    `Gemeinsam (rootMainFiles${report.includePolyfills ? " + Polyfills" : ""}): ${report.shared.gzKb} KiB gz (${report.shared.files.length} Dateien)`,
    ``,
    `| Route | JS gz (KiB) | Baseline | davon routeneigen | JS roh (KiB) | Dateien | CSS gz (KiB) | Status |`,
    `|---|---:|---:|---:|---:|---:|---:|---|`,
  ];
  const LABEL = {
    over: "**über Budget**",
    new: "**neu über Budget**",
    regression: "**gewachsen**",
    baseline: "über Budget (Baseline)",
    ok: "ok",
  };
  for (const r of report.routes) {
    let status = LABEL[r.status || (r.over ? "over" : "ok")];
    if (r.improved) status += ", kleiner als Baseline";
    if (r.missing.length) status += ` (${r.missing.length} Datei(en) fehlen)`;
    lines.push(
      `| \`${r.route}\` | ${r.gzKb} | ${r.baselineKb ?? "–"} | ${r.ownGzKb} | ${r.rawKb} | ${r.files} | ${r.cssGzKb} | ${status} |`
    );
  }
  if (report.errors.length) {
    lines.push("", "## Nicht auswertbar", "");
    for (const e of report.errors) lines.push(`- \`${e.route}\`: ${e.error}`);
  }
  if (report.compare) {
    lines.push("", "## Abgleich mit ausgeliefertem HTML", "");
    for (const c of report.compare) {
      lines.push(
        `- \`${c.url}\`: ${c.error ? `Fehler ${c.error}` : `${c.htmlScripts} Skripte im HTML (ohne nomodule), ${c.notCounted.length} nicht gezählt${c.notCounted.length ? ` (${c.notCounted.join(", ")})` : ""}, ${c.notInHtml.length} gezählt, aber nicht im HTML${c.notInHtml.length ? ` (${c.notInHtml.join(", ")})` : ""}`}`
      );
    }
  }
  return lines.join("\n") + "\n";
}

/** Prüft für statische Routen, ob jedes <script src> des HTML im Bericht steckt. */
export async function compareWithHtml(report, baseUrl, { limit = 10, locale = "de" } = {}) {
  const out = [];
  const candidates = report.routes.filter((r) => !r.route.replace("[locale]", "").includes("[")).slice(0, limit);
  for (const r of candidates) {
    const url = new URL(r.route.replace("[locale]", locale) || "/", baseUrl).toString();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      const html = await res.text();
      // <script nomodule> (Polyfills) lädt in modernen Browsern nicht.
      const scripts = [...html.matchAll(/<script\b[^>]*>/g)]
        .map((m) => m[0])
        .filter((tag) => !/\snomodule\b/i.test(tag))
        .map((tag) => /\ssrc="([^"]+)"/.exec(tag)?.[1])
        .filter(Boolean)
        .map((src) => normalizeChunk(src.split("?")[0]));
      const counted = new Set([...report.shared.files, ...r.chunks]);
      const inHtml = new Set(scripts);
      const notCounted = scripts.filter((s) => s.startsWith("static/") && !counted.has(s));
      const notInHtml = [...counted].filter((f) => !inHtml.has(f));
      out.push({ url, status: res.status, htmlScripts: scripts.length, notCounted, notInHtml });
    } catch (error) {
      out.push({ url, error: error.message });
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dir = path.resolve(String(args.dir || DEFAULT_DIR));
  const budgetKb = Number(args["budget-kb"] || DEFAULT_BUDGET_KB);
  const toleranceKb = args["tolerance-kb"] !== undefined ? Number(args["tolerance-kb"]) : DEFAULT_TOLERANCE_KB;
  let report;
  let baseline = null;
  try {
    if (args.baseline) {
      const file = path.resolve(String(args.baseline === true ? DEFAULT_BASELINE : args.baseline));
      baseline = loadBaseline(file);
      if (!baseline) throw new Error(`Baseline fehlt: ${file}`);
    }
    report = analyze(dir, { budgetKb, includePolyfills: !!args["include-polyfills"], baseline, toleranceKb });
  } catch (error) {
    console.error(`bundle-budget: ${error.message}`);
    process.exit(2);
  }
  if (args.compare) {
    report.compare = await compareWithHtml(report, String(args.compare), { limit: Number(args["compare-limit"] || 10) });
  }

  const width = Math.max(...report.routes.map((r) => r.route.length), 10);
  console.log(`Bundle-Budget ${budgetKb} KiB gz je Route · Build ${report.buildId || "?"} · ${dir}`);
  console.log(`Gemeinsam: ${report.shared.gzKb} KiB gz`);
  for (const r of report.routes) {
    const mark = r.over ? "✗" : r.overBudget ? "~" : "✓";
    const base = r.baselineKb != null ? `, Baseline ${r.baselineKb}${r.improved ? " ↓" : ""}` : "";
    console.log(`${mark} ${r.route.padEnd(width)}  ${String(r.gzKb).padStart(6)} KiB gz  (eigen ${r.ownGzKb}${base})`);
  }
  for (const e of report.errors) console.log(`? ${e.route}: ${e.error}`);
  if (report.compare) {
    for (const c of report.compare) {
      console.log(
        `  Abgleich ${c.url}: ${c.error || `${c.htmlScripts} Skripte, nicht gezählt: ${c.notCounted.length}, zu viel gezählt: ${c.notInHtml.length}`}`
      );
    }
  }
  if (args.json) {
    fs.mkdirSync(path.dirname(path.resolve(String(args.json))), { recursive: true });
    fs.writeFileSync(String(args.json), JSON.stringify(report, null, 2));
  }
  if (args.md) {
    fs.mkdirSync(path.dirname(path.resolve(String(args.md))), { recursive: true });
    fs.writeFileSync(String(args.md), toMarkdown(report));
  }
  if (args["write-baseline"]) {
    const file = path.resolve(String(args["write-baseline"] === true ? DEFAULT_BASELINE : args["write-baseline"]));
    const previous = args["reset-baseline"] ? null : loadBaseline(file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(buildBaseline(report, previous), null, 2) + "\n");
    console.log(`bundle-budget: Baseline geschrieben: ${file}`);
  }
  if (!report.routes.length) {
    console.error("bundle-budget: keine Seiten in der Build-Ausgabe gefunden");
    process.exit(2);
  }
  if (report.over.length) {
    const why = baseline
      ? `über ${budgetKb} KiB gz und gewachsen (> Baseline + ${toleranceKb} KiB) oder neu`
      : `über ${budgetKb} KiB gz`;
    console.error(`bundle-budget: ${report.over.length} Route(n) ${why}: ${report.over.join(", ")}`);
    process.exit(1);
  }
  const improved = report.routes.filter((r) => r.improved).map((r) => r.route);
  if (improved.length) {
    console.log(
      `bundle-budget: ${improved.length} Route(n) kleiner als Baseline, bitte mit --write-baseline senken: ${improved.join(", ")}`
    );
  }
  if (report.overBudget.length) {
    console.log(`bundle-budget: kein Zuwachs. ${report.overBudget.length} Route(n) noch über ${budgetKb} KiB (Baseline).`);
  } else {
    console.log(`bundle-budget: alle ${report.routes.length} Routen im Budget.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
