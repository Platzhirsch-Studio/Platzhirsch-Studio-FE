#!/usr/bin/env node
// tools/qa/prod-check.mjs — reproducible production check (R3-release).
//
//   node tools/qa/prod-check.mjs [--label=basis] [--copy=<dir>] [--port=3100]
//        [--steps=copy,build,start,tests,claims,nap,perf] [--specs="smoke.spec.js …"]
//        [--workers=4] [--runs=3] [--error-preview] [--legal-preview]
//        [--commerce-preview]
//        [--round=r4-release] [--isolated] [--npm="install --save-exact next@16.3.8"]
//        [--npm-ls=qrcode,react-share]  (R5: --npm takes several commands split by ";")
//        [--freigabe-preview]  (R6: server with FREIGABE_PREVIEW=1, cockpit 200)
//        [--design-preview]    (F5: server with DESIGN_PREVIEW=1, prototypes 200)
//
// R6-release: opt-in step "profile" (tools/qa/profile.mjs): V8 CPU profile and
// long tasks, mobile throttled, median of --runs, for --profile-paths=/a,/b
// (default: the perf paths). Output in <label>/profile/.
// R6-release: step "facts" (check-facts --strict, files only, like nap) runs
// by default; /cmx 404 must carry Cache-Control: no-store (route sets it).
//   npm run check:prod -- --label=basis
//
// R4-release additions:
//   --round     output folder below qa-screenshots/teamleiter/ (default r4-release)
//   --isolated  the copy gets its OWN node_modules (`npm ci` in the copy, no
//               junction, no turbopack.root wrapper), to test a dependency
//               change before it touches the repo. Default copy dir then
//               ../platzhirsch-prod-check-isolated.
//   --npm       extra npm command run in the isolated copy after `npm ci`
//               (e.g. the exact install under test). Only with --isolated.
// Rat 9,5 (T5, B3): step "dse" (default) – every feature with personal data
//   that is active in this production server needs its section anchor on
//   /de/datenschutz (src/lib/legal/dseFeatures.js), and no draft section may
//   be in the production HTML; otherwise the step fails. Output dse.json.
//   Steps "manifest" (prerender-manifest.json + route table of build.log),
//   "probe" (status/headers of fixed URLs, see PROBES) and "logscan" (server
//   log: "static to dynamic", NoFallbackError, render errors) run by default.
//
// What it does (never builds inside the repo, never starts a dev server, never
// sends a form, mail or payment):
//   1. robocopy the repo into a copy OUTSIDE the repo (default
//      ../platzhirsch-prod-check), without node_modules, .next, .data,
//      qa-screenshots, Herstellermaterial, .git
//   2. node_modules of the repo is mounted into the copy as a junction
//   3. turbopack.root is set to the parent folder — in the copy only (a wrapper
//      next.config.js around the repo's file), otherwise Turbopack panics with
//      "Symlink node_modules points out of the filesystem root"
//   4. `next build` in the copy (SERVER from the environment, else the
//      production backoffice, as in redesign/00-integration.md §5)
//   5. `next start -p 3100` in the copy
//   6. Playwright suite from the repo with BASE_URL=http://localhost:3100
//   7. check-claims --live (4 languages) and check-nap
//   8. LCP/CLS/TBT, mobile throttled and desktop (tools/qa/perf.mjs)
//   9. always (also on error/Ctrl+C): stop the prod server (taskkill /T on its
//      PID only), remove the junction with `rmdir` (never recursive)
// Output: qa-screenshots/teamleiter/r3-release/<label>/ (logs, Playwright HTML
// and JSON report, claims.json, nap.json, perf.json, summary.json, summary.md).
import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { measure, BUDGET, DEFAULT_PATHS } from "./perf.mjs";
import { profilePages } from "./profile.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const i = a.indexOf("=");
      return i < 0 ? [a.slice(2), true] : [a.slice(2, i), a.slice(i + 1)];
    }),
);

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const LABEL = String(args.label || stamp).replace(/[^\w.-]+/g, "-");
const ISOLATED = !!args.isolated;
const COPY = path.resolve(
  String(args.copy || path.join(REPO, "..", ISOLATED ? "platzhirsch-prod-check-isolated" : "platzhirsch-prod-check")),
);
const PORT = Number(args.port || 3100);
const BASE = `http://localhost:${PORT}`;
const STEPS = new Set(String(args.steps || "copy,build,manifest,start,probe,dse,tests,claims,nap,facts,perf,logscan").split(","));
const ROUND = String(args.round || "r4-release").replace(/[^\w.-]+/g, "-");
const OUT = path.join(REPO, "qa-screenshots", "teamleiter", ROUND, LABEL);
const SERVER = process.env.SERVER || "https://backoffice.platzhirsch.studio";
// Per-run secret: server and Playwright (upload.spec.js) must share it. Never a real secret.
const UPLOAD_TOKEN_SECRET = process.env.UPLOAD_TOKEN_SECRET || `prod-check-${crypto.randomBytes(24).toString("hex")}`;
// Same idea for the portal session cookie (tests/e2e/r3-portal-voice.spec.js signs one).
const PORTAL_SESSION_SECRET = process.env.PORTAL_SESSION_SECRET || `prod-check-${crypto.randomBytes(24).toString("hex")}`;
const EXCLUDE_DIRS = ["node_modules", ".next", ".data", "qa-screenshots", "Herstellermaterial", ".git", ".claude"];
// Credentials that must never reach the copy: no real backoffice writes, mails or model calls.
const STRIP_ENV = [/^ANTHROPIC_/, /^FRAPPE_/, /^API_KEY$/, /^API_SECRET$/, /^PORTAL_MAIL/, /^SMTP/, /^RESEND/, /^STRIPE/, /^PAYPAL/];

fs.mkdirSync(OUT, { recursive: true });

const summary = { label: LABEL, started: new Date().toISOString(), copy: COPY, base: BASE, server: SERVER, steps: {}, notes: [] };
const logLine = (msg) => {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${msg}`;
  console.log(line);
  fs.appendFileSync(path.join(OUT, "prod-check.log"), line + "\n");
};

// ---------- guards ----------
const rel = path.relative(REPO, COPY);
if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
  console.error(`Abbruch: Die Kopie (${COPY}) liegt im Repo. Nie im Repo bauen.`);
  process.exit(2);
}
// R5-release: one run per copy. A second run's robocopy /MIR into a copy whose
// server is still running broke the first run (r5-zwischen, 26.10.2026).
const LOCK = path.join(COPY + ".prod-check.lock");
try {
  const other = JSON.parse(fs.readFileSync(LOCK, "utf8"));
  let alive = false;
  try {
    process.kill(other.pid, 0);
    alive = true;
  } catch {
    /* stale lock */
  }
  if (alive) {
    console.error(`Abbruch: Lauf "${other.label}" (PID ${other.pid}) nutzt ${COPY} noch. Warten oder --copy=<anderer Ordner> --port=<anderer Port>.`);
    process.exit(2);
  }
} catch {
  /* no lock */
}
fs.writeFileSync(LOCK, JSON.stringify({ pid: process.pid, label: LABEL, started: new Date().toISOString() }));
process.on("exit", () => {
  try {
    if (JSON.parse(fs.readFileSync(LOCK, "utf8")).pid === process.pid) fs.unlinkSync(LOCK);
  } catch {
    /* gone */
  }
});
if (process.platform !== "win32") {
  console.error("Abbruch: Das Skript nutzt robocopy/mklink/taskkill und läuft nur unter Windows.");
  process.exit(2);
}

function cleanEnv(extra = {}) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) if (!STRIP_ENV.some((re) => re.test(k))) env[k] = v;
  delete env.NODE_ENV; // next build/start set it themselves
  delete env.PORT;
  return { ...env, NEXT_TELEMETRY_DISABLED: "1", ...extra };
}

async function portInUse(port) {
  try {
    await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(5_000), redirect: "manual" });
    return true;
  } catch (err) {
    // Refused = free. Anything else (timeout, reset) counts as busy.
    return !/ECONNREFUSED/.test(String(err.cause?.code || err.cause?.errors?.[0]?.code || ""));
  }
}

/** Runs a command, tees output into a log file, resolves with { code, ms }. */
function run(cmd, argv, { cwd, env, logFile, timeoutMs = 60 * 60_000 }) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const out = fs.createWriteStream(logFile);
    const child = spawn(cmd, argv, { cwd, env, windowsHide: true });
    const timer = setTimeout(() => {
      out.write(`\n[prod-check] Timeout nach ${timeoutMs} ms – beende PID ${child.pid}\n`);
      killTree(child.pid);
    }, timeoutMs);
    child.stdout.on("data", (d) => out.write(d));
    child.stderr.on("data", (d) => out.write(d));
    child.on("close", (code) => {
      clearTimeout(timer);
      out.end(`\nEXIT ${code}\n`);
      resolve({ code, ms: Date.now() - t0 });
    });
  });
}

function killTree(pid) {
  if (!pid) return;
  spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true });
}

// ---------- junction ----------
const JUNCTION = path.join(COPY, "node_modules");
let junctionCreated = false; // teardown only removes a junction this run created

function removeJunction() {
  let st;
  try {
    st = fs.lstatSync(JUNCTION);
  } catch {
    return "keine Junction vorhanden";
  }
  if (!st.isSymbolicLink()) {
    // A real folder here is unexpected; never delete it recursively.
    throw new Error(`${JUNCTION} ist ein echter Ordner, keine Junction – bitte von Hand prüfen.`);
  }
  // `rmdir` without /S removes only the link, never the target.
  const r = spawnSync("cmd.exe", ["/d", "/c", "rmdir", JUNCTION], { windowsHide: true, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`rmdir der Junction fehlgeschlagen: ${r.stderr || r.stdout}`);
  if (!fs.existsSync(path.join(REPO, "node_modules", "next", "package.json"))) {
    throw new Error("Repo-node_modules fehlt nach dem Entfernen der Junction!");
  }
  return "Junction mit rmdir entfernt, Repo-node_modules unversehrt";
}

function createJunction() {
  removeJunction();
  const r = spawnSync("cmd.exe", ["/d", "/c", "mklink", "/J", JUNCTION, path.join(REPO, "node_modules")], {
    windowsHide: true,
    encoding: "utf8",
  });
  if (r.status !== 0) throw new Error(`mklink /J fehlgeschlagen: ${r.stderr || r.stdout}`);
  junctionCreated = true;
}

// ---------- steps ----------
async function stepCopy() {
  fs.mkdirSync(COPY, { recursive: true });
  // before /MIR, so robocopy never walks into the repo's node_modules. The
  // isolated copy keeps its own real node_modules (npm ci replaces it; R5).
  if (!ISOLATED) removeJunction();
  const r = spawnSync(
    "robocopy",
    [REPO, COPY, "/MIR", "/XD", ...EXCLUDE_DIRS, "/XF", "*.log", "/R:1", "/W:1", "/NFL", "/NDL", "/NJH", "/NP", "/MT:8"],
    { windowsHide: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  fs.writeFileSync(path.join(OUT, "robocopy.log"), r.stdout || "");
  if (r.status >= 8) throw new Error(`robocopy Exit ${r.status}`);
  // Fresh build: drop the copy's old .next (a plain folder inside the copy).
  const nextDir = path.join(COPY, ".next");
  if (fs.existsSync(nextDir) && !fs.lstatSync(nextDir).isSymbolicLink()) fs.rmSync(nextDir, { recursive: true, force: true });
  if (ISOLATED) return { robocopyExit: r.status, ...(await isolatedInstall()) };
  createJunction();
  // turbopack.root only in the copy: wrap the repo's next.config.js.
  fs.renameSync(path.join(COPY, "next.config.js"), path.join(COPY, "next.config.repo.js"));
  fs.writeFileSync(
    path.join(COPY, "next.config.js"),
    `// Generated by tools/qa/prod-check.mjs — build copy only, never in the repo.
// The repo's node_modules is a junction, so Turbopack needs the parent as root.
const path = require("path");
const base = require("./next.config.repo.js");
const root = path.join(__dirname, "..");
const withRoot = (c) => ({ ...c, turbopack: { ...(c.turbopack || {}), root } });
module.exports = typeof base === "function" ? async (...a) => withRoot(await base(...a)) : withRoot(base);
`,
  );
  return { robocopyExit: r.status };
}

// Own node_modules in the copy (never a junction): `npm ci` from the copied
// lockfile, then optionally the npm command under test (--npm=…).
async function isolatedInstall() {
  let st = null;
  try {
    st = fs.lstatSync(JUNCTION);
  } catch {
    /* none yet */
  }
  if (st?.isSymbolicLink()) throw new Error(`${JUNCTION} ist eine Junction – der isolierte Lauf braucht einen eigenen Ordner.`);
  const npmCli = path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  const npm = (argv, log) =>
    run(process.execPath, [npmCli, ...argv], { cwd: COPY, env: cleanEnv(), logFile: path.join(OUT, log), timeoutMs: 30 * 60_000 });
  const out = {};
  const ci = await npm(["ci", "--no-audit", "--no-fund"], "npm-ci.log");
  out.npmCi = { exit: ci.code, minutes: +(ci.ms / 60000).toFixed(1) };
  if (ci.code !== 0) throw new Error(`npm ci in der Kopie Exit ${ci.code}`);
  if (args.npm) {
    // R5-release: several commands separated by ";" (e.g. uninstall, then install).
    out.npmExtra = [];
    const cmds = String(args.npm).split(";").map((c) => c.split(/\s+/).filter(Boolean)).filter((c) => c.length);
    for (const [i, cmd] of cmds.entries()) {
      const r = await npm([...cmd, "--no-audit", "--no-fund"], `npm-extra-${i + 1}.log`);
      out.npmExtra.push({ cmd: `npm ${cmd.join(" ")}`, exit: r.code });
      if (r.code !== 0) throw new Error(`npm ${cmd.join(" ")} in der Kopie Exit ${r.code}`);
    }
  }
  const lsPkgs = ["next", "sharp", "eslint-config-next", ...String(args["npm-ls"] || "").split(",").filter(Boolean)];
  const ls = spawnSync(process.execPath, [npmCli, "ls", ...lsPkgs], { cwd: COPY, encoding: "utf8", windowsHide: true });
  out.npmLs = (ls.stdout || "").trim().split("\n");
  fs.writeFileSync(path.join(OUT, "npm-ls.txt"), ls.stdout || "");
  return out;
}

async function stepBuild() {
  const nextBin = path.join(COPY, "node_modules", "next", "dist", "bin", "next");
  const env = cleanEnv({ SERVER, ...(args["error-preview"] ? { ERROR_PREVIEW: "1" } : {}) });
  let res = await run(process.execPath, [nextBin, "build"], { cwd: COPY, env, logFile: path.join(OUT, "build.log") });
  // R5-release: next/font/google sometimes fails to fetch (R4.5 Nr. 7); one retry, logged.
  if (res.code !== 0 && /internal\/font\/google/.test(fs.readFileSync(path.join(OUT, "build.log"), "utf8"))) {
    fs.renameSync(path.join(OUT, "build.log"), path.join(OUT, "build-1-font-fehler.log"));
    summary.notes.push("Build 1 brach an Google Fonts ab (build-1-font-fehler.log), Wiederholung");
    res = await run(process.execPath, [nextBin, "build"], { cwd: COPY, env, logFile: path.join(OUT, "build.log") });
  }
  const log = fs.readFileSync(path.join(OUT, "build.log"), "utf8");
  const pages = [...log.matchAll(/Generating static pages[^\n]*?\((\d+)\/(\d+)\)/g)].at(-1);
  const warnings = log.split("\n").filter((l) => /⚠|warn/i.test(l)).slice(0, 30);
  const errors = log.split("\n").filter((l) => /error|⨯|panic/i.test(l)).slice(0, 30);
  if (res.code !== 0) throw Object.assign(new Error(`next build Exit ${res.code}`), { detail: errors });
  return { exit: res.code, minutes: +(res.ms / 60000).toFixed(1), staticPages: pages ? Number(pages[2]) : null, warnings, errors };
}

let serverChild = null;
async function stepStart() {
  if (await portInUse(PORT)) throw new Error(`Port ${PORT} ist belegt – fremden Prozess nicht beenden, Lauf abgebrochen.`);
  const nextBin = path.join(COPY, "node_modules", "next", "dist", "bin", "next");
  const env = cleanEnv({
    SERVER,
    UPLOAD_TOKEN_SECRET,
    // Upload links/QR point at this server instead of SITE_URL (the live site);
    // in production without this variable handoff.js uses SITE_URL.
    UPLOAD_PUBLIC_BASE_URL: BASE,
    PORTAL_SESSION_SECRET, // portal adapter stays "mock" (default), no mail provider
    ...(args["legal-preview"] ? { LEGAL_PREVIEW: "1" } : {}),
    // R5-release fix: /de/preview/commerce is 404 in production unless
    // COMMERCE_PREVIEW=1 (src/lib/commerce/mode.js). Default run = production.
    ...(args["commerce-preview"] ? { COMMERCE_PREVIEW: "1" } : {}),
    ...(args["freigabe-preview"] ? { FREIGABE_PREVIEW: "1" } : {}),
    // F5: design prototypes and /de/projekte/vorlage (src/components/Preview/gate.js).
    ...(args["design-preview"] ? { DESIGN_PREVIEW: "1" } : {}),
    // No CONCIERGE_MOCK / CONCIERGE_SECRET / ANTHROPIC_API_KEY: the concierge runs
    // as in production today ("unavailable"); its mock tests skip themselves.
    ...(args["error-preview"] ? { ERROR_PREVIEW: "1" } : {}),
  });
  const out = fs.createWriteStream(path.join(OUT, "start.log"));
  serverChild = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], { cwd: COPY, env, windowsHide: true });
  serverChild.stdout.on("data", (d) => out.write(d));
  serverChild.stderr.on("data", (d) => out.write(d));
  serverChild.on("close", (code) => out.end(`\nEXIT ${code}\n`));
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (serverChild.exitCode !== null) throw new Error(`next start beendet (Exit ${serverChild.exitCode}), siehe start.log`);
    try {
      const r = await fetch(`${BASE}/de`, { signal: AbortSignal.timeout(30_000) });
      if (r.status === 200) return { pid: serverChild.pid, port: PORT };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error(`${BASE}/de antwortet nicht mit 200`);
}

async function stepTests() {
  const specs = args.specs ? String(args.specs).split(/[\s,]+/).filter(Boolean) : [];
  const env = {
    ...process.env,
    BASE_URL: BASE,
    UPLOAD_TOKEN_SECRET,
    PORTAL_SESSION_SECRET,
    // r3-recht.spec.js: without LEGAL_PREVIEW=1 the previews must answer 404 + noindex.
    LEGAL_PREVIEW_EXPECT: args["legal-preview"] ? "on" : "off",
    // playwright.config.js: "off" leaves out the preview tests of
    // r5-commerce.spec.js (they need COMMERCE_PREVIEW=1); the probe below
    // checks the 404 instead.
    COMMERCE_PREVIEW_EXPECT: args["commerce-preview"] ? "on" : "off",
    FREIGABE_PREVIEW_EXPECT: args["freigabe-preview"] ? "on" : "off",
    // F5: playwright.config.js leaves out the tests that need the design previews.
    DESIGN_PREVIEW_EXPECT: args["design-preview"] ? "on" : "off",
    PW_REPORT_DIR: path.join(OUT, "playwright-report"),
    PW_OUTPUT_DIR: path.join(OUT, "playwright-results"),
    PW_JSON_REPORT: path.join(OUT, "playwright.json"),
    PW_WORKERS: String(args.workers || 4),
  };
  const cli = path.join(REPO, "node_modules", "@playwright", "test", "cli.js");
  const res = await run(process.execPath, [cli, "test", ...specs], { cwd: REPO, env, logFile: path.join(OUT, "playwright.log"), timeoutMs: 3 * 60 * 60_000 });
  return { exit: res.code, minutes: +(res.ms / 60000).toFixed(1), specFiles: fs.readdirSync(path.join(REPO, "tests", "e2e")).filter((f) => f.endsWith(".spec.js")), ...parsePlaywright() };
}

function parsePlaywright() {
  let report;
  try {
    report = JSON.parse(fs.readFileSync(path.join(OUT, "playwright.json"), "utf8"));
  } catch {
    return { stats: null, failures: [] };
  }
  const failures = [];
  const fixme = [];
  const walk = (suite, trail) => {
    for (const s of suite.suites || []) walk(s, [...trail, s.title]);
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const last = t.results?.at(-1);
        const entry = { file: spec.file, title: [...trail, spec.title].filter(Boolean).join(" › "), project: t.projectName, line: spec.line };
        if (t.status === "unexpected") {
          entry.error = (last?.error?.message || last?.errors?.[0]?.message || "").replace(/\u001b\[[0-9;]*m/g, "").slice(0, 1200);
          failures.push(entry);
        } else if (t.status === "flaky") {
          failures.push({ ...entry, flaky: true });
        } else if (t.annotations?.some((a) => a.type === "fixme")) {
          fixme.push({ ...entry, annotations: t.annotations.map((a) => `${a.type}: ${String(a.description || "").slice(0, 300)}`) });
        }
      }
    }
  };
  for (const s of report.suites || []) walk(s, []);
  return { stats: report.stats, failures, fixme };
}

async function stepClaims() {
  const json = path.join(OUT, "claims.json");
  const res = await run(
    process.execPath,
    [
      path.join(REPO, "tools/checks/check-claims.mjs"),
      "--live",
      `--base=${BASE}`,
      "--locales=de,en,fr,it",
      "--concurrency=4",
      `--json=${json}`,
      // R6: preview pages only when this server has the switch (else 404).
      ...(args["commerce-preview"] ? ["--commerce-preview"] : []),
      ...(args["freigabe-preview"] ? ["--freigabe-preview"] : []),
    ],
    { cwd: REPO, env: process.env, logFile: path.join(OUT, "claims.log") },
  );
  let data = {};
  try {
    data = JSON.parse(fs.readFileSync(json, "utf8"));
  } catch {
    /* no json */
  }
  const v = data.violations || [];
  const count = (pred) => v.filter(pred).length;
  return {
    exit: res.code,
    liveUrls: data.live?.count ?? null,
    liveErrors: data.live?.errors?.length ?? null,
    productSample: data.live?.products
      ? { fromSitemap: data.live.products.fromSitemap.length, ofSitemap: data.live.products.totalInSitemap, imported: Object.fromEntries(Object.entries(data.live.products.imported).map(([b, l]) => [b, l.length])), urls: data.live.products.urls.length }
      : null,
    violations: v.length,
    dealer: count((f) => f.type === "dealer"),
    superlative: count((f) => f.type === "superlative"),
    live: count((f) => !!f.url),
    source: count((f) => !!f.file),
  };
}

async function stepNap() {
  const json = path.join(OUT, "nap.json");
  const res = await run(process.execPath, [path.join(REPO, "tools/checks/check-nap.mjs"), `--json=${json}`], {
    cwd: REPO,
    env: process.env,
    logFile: path.join(OUT, "nap.log"),
  });
  const log = fs.readFileSync(path.join(OUT, "nap.log"), "utf8");
  return { exit: res.code, tail: log.trim().split("\n").slice(-12) };
}

// R6-release: Faktencheck-Gate (npm run check:facts). Reads files only.
async function stepFacts() {
  const res = await run(process.execPath, [path.join(REPO, "tools/content/check-facts.mjs"), "--strict", `--out=${path.join(OUT, "facts")}`], {
    cwd: REPO,
    env: process.env,
    logFile: path.join(OUT, "facts.log"),
  });
  const log = fs.readFileSync(path.join(OUT, "facts.log"), "utf8");
  const lines = log.split(/\r?\n/);
  const head = lines.find((l) => /^Faktencheck:/.test(l)) || "";
  const gate = lines.find((l) => /Faktencheck-Gate/.test(l)) || "";
  const out = { exit: res.code, summary: head.trim(), gate: gate.trim() };
  if (res.code !== 0) throw Object.assign(new Error(`check-facts --strict Exit ${res.code}: ${gate.trim()}`), { detail: out });
  return out;
}

async function stepProfile() {
  const paths = args["profile-paths"] ? String(args["profile-paths"]).split(",").filter(Boolean) : DEFAULT_PATHS;
  const rows = await profilePages({ base: BASE, paths, runs: Number(args.runs || 3), out: path.join(OUT, "profile"), log: logLine });
  return rows.map((r) => ({ path: r.path, tbtRuns: r.tbtRuns, tbtMedian: r.tbtMedian, longTasks: r.longTasks.length, biggestTask: r.biggestTask?.dur ?? 0, topScripts: r.byUrl.slice(0, 5) }));
}

async function stepPerf() {
  const results = await measure({ base: BASE, paths: DEFAULT_PATHS, runs: Number(args.runs || 3), log: logLine });
  fs.writeFileSync(path.join(OUT, "perf.json"), JSON.stringify({ budget: BUDGET, results }, null, 2));
  return results.map(({ profile, path: p, status, ttfb, lcp, cls, tbt, withinBudget, lcpElement }) => ({ profile, path: p, status, ttfb, lcp, cls, tbt, withinBudget, lcpElement }));
}

// Prerendered routes (R4 target ~7 700) and the route table of the build.
// Pages that read cookies/session must stay dynamic and never show up here.
const MUST_STAY_DYNAMIC = [/\/merkliste/, /\/wishlist/, /\/liste-de-souhaits/, /\/lista-desideri/, /\/portal/, /\/upload/, /^\/api\//];
async function stepManifest() {
  const m = JSON.parse(fs.readFileSync(path.join(COPY, ".next", "prerender-manifest.json"), "utf8"));
  const routes = Object.keys(m.routes || {});
  const byTop = {};
  const revalidate = {};
  for (const r of routes) {
    const top = r.split("/").slice(0, 3).join("/");
    byTop[top] = (byTop[top] || 0) + 1;
  }
  for (const v of Object.values(m.routes || {})) {
    const k = String(v.initialRevalidateSeconds);
    revalidate[k] = (revalidate[k] || 0) + 1;
  }
  const leaked = routes.filter((r) => MUST_STAY_DYNAMIC.some((re) => re.test(r)));
  const log = fs.readFileSync(path.join(OUT, "build.log"), "utf8");
  const table = log
    .split("\n")
    .filter((l) => /^[├└┌│ ]\s*[○●ƒ◐]/.test(l) && /(merkliste|portal|ratgeber|upload|kontakt|_not-found|\/\[locale\]\s*$)/.test(l))
    .slice(0, 60);
  const out = {
    prerendered: routes.length,
    dynamicRoutes: Object.keys(m.dynamicRoutes || {}).length,
    revalidate,
    ratgeber: routes.filter((r) => r.startsWith("/de/ratgeber")),
    leakedCount: leaked.length,
    leakedDynamic: leaked.slice(0, 20),
    topLevel: Object.fromEntries(Object.entries(byTop).sort((a, b) => b[1] - a[1]).slice(0, 25)),
    routeTable: table,
  };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({ ...out, routes }, null, 2));
  return out;
}

// Fixed probes: status codes plus the headers R4 touches (CSP report-only,
// X-XSS-Protection gone, portal exceptions unchanged, ISR cache state).
const RATGEBER_SLUGS = (() => {
  try {
    return fs
      .readdirSync(path.join(REPO, "src", "content", "ratgeber"))
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  } catch {
    return [];
  }
})();
// [path, expected status, header check?] – null: any status, only headers are
// recorded. The optional check gets the recorded headers and returns an error
// text or null (R5-release: /cmx cache by status, CSP without Unsplash).
const longCache = (cc) => /immutable|max-age=(?!0\b)\d+/.test(cc || "");
// 404 from the route carries no Cache-Control (a config default would also
// override the route's 200 header, tested in R5); only a long cache is an error.
const CMX_ERROR_NOT_CACHED = (h) => (longCache(h["cache-control"]) ? `cmx-Fehler mit Cache-Control "${h["cache-control"]}" (lang gecacht)` : null);
// R6-release: the route itself now sends no-store on 404 (not only nginx).
const CMX_404_NO_STORE = (h) => CMX_ERROR_NOT_CACHED(h) || (/no-store/.test(h["cache-control"] || "") ? null : `cmx-404 ohne no-store: "${h["cache-control"] ?? "—"}"`);
const CMX_OK_IMMUTABLE = (h) => (/immutable/.test(h["cache-control"] || "") ? null : `cmx-200 ohne immutable: "${h["cache-control"] ?? "—"}"`);
const CSP_CHECK = (h) => {
  const csp = h["content-security-policy-report-only"] || "";
  if (!csp) return "CSP-Report-Only fehlt";
  if (h["content-security-policy"]) return "CSP wird erzwungen (soll Report-Only bleiben)";
  return /unsplash/.test(csp) ? "CSP nennt noch images.unsplash.com" : null;
};
const PROBES = [
  ["/de", 200, CSP_CHECK],
  ["/en", 200],
  ["/de/ratgeber", 200],
  ...RATGEBER_SLUGS.map((s) => [`/de/ratgeber/${s}`, 200]),
  ["/de/ratgeber/gibt-es-nicht", 404],
  ["/en/ratgeber/was-kostet-ein-minotti-sofa", 404],
  ["/fr/ratgeber/was-kostet-ein-minotti-sofa", 404],
  ["/it/ratgeber/was-kostet-ein-minotti-sofa", 404],
  ["/de/gibt-es-nicht", 404],
  ["/en/xyz", 404],
  ["/xyz/abc", 307], // next-intl: unprefixed path → /de/xyz/abc
  ["/wp-login.php", 404],
  ["/foo.html", 404],
  ["/de/produkte", 200],
  ["/de/merkliste", 200],
  ["/de/portal", null],
  ["/de/portal/projekte/demo", null],
  ["/api/portal/dokumente/demo", null],
  ["/api/portal/dokumente/kalender", null],
  // /cmx: only success responses are cached long (R5-release: /cmx excluded
  // from all long-cache config rules, the route sets immutable on 200 – a
  // missing .mp4 used to get max-age=1 year from the video rule).
  ["/cmx/files/does-not-exist-r4-release.webp", 404, CMX_404_NO_STORE],
  ["/cmx/files/does-not-exist-r5-release.mp4", 404, CMX_404_NO_STORE],
  ["/cmx/nicht-files/x.webp", 404, CMX_404_NO_STORE],
  // R6: extensionless /cmx path – route 404 (proxy matcher excludes cmx/), no 307 to /de/cmx/…
  ["/cmx/api/x", 404, CMX_404_NO_STORE],
  ["/cmx/files/minotti-orion-01.webp", 200, CMX_OK_IMMUTABLE],
  ["/de/bewerten", 200], // target of the QR cards (scripts/make-review-qr.mjs)
  ["/en/bewerten", 404],
  // Commerce preview: production 404 without --commerce-preview (R5-release fix).
  ["/de/preview/commerce", args["commerce-preview"] ? 200 : 404],
  // R6: Freigabe-Cockpit (R6-uebergabe), production 404 without FREIGABE_PREVIEW=1.
  ["/de/preview/freigaben", args["freigabe-preview"] ? 200 : 404],
  // F5 (Runde 1): design prototypes and the project template, 404 without DESIGN_PREVIEW=1.
  ...["/de/preview/buehne", "/de/preview/galerie", "/de/preview/dreilaendereck", "/de/projekte/vorlage", "/de/projekte/vorlage/demo.mp4"].map((p) => [p, args["design-preview"] ? 200 : 404]),
  ["/de/einkaufen-aus-der-schweiz", 200],
  ["/de/projekte", 200],
  ["/Images/Home/aboutHome.jpg", 200],
];
const PROBE_HEADERS = [
  "content-security-policy",
  "content-security-policy-report-only",
  "x-frame-options",
  "x-xss-protection",
  "permissions-policy",
  "x-nextjs-cache",
  "x-nextjs-prerender",
  "cache-control",
];
async function stepProbe() {
  const rows = [];
  for (const [p, expect, check] of PROBES) {
    const t0 = Date.now();
    try {
      const r = await fetch(BASE + p, { redirect: "manual", signal: AbortSignal.timeout(60_000) });
      const body = await r.text();
      const headers = Object.fromEntries(PROBE_HEADERS.map((k) => [k, r.headers.get(k)]).filter(([, v]) => v !== null));
      const lang = body.match(/<html[^>]*\blang="([^"]+)"/)?.[1] || null;
      const headerError = check ? check(headers) : null;
      rows.push({ path: p, status: r.status, expect, ok: (expect === null || r.status === expect) && !headerError, headerError, ms: Date.now() - t0, lang, headers });
    } catch (err) {
      rows.push({ path: p, status: String(err.message), expect, ok: false });
    }
  }
  fs.writeFileSync(path.join(OUT, "probe.json"), JSON.stringify(rows, null, 2));
  const bad = rows.filter((r) => !r.ok);
  if (bad.length) {
    throw Object.assign(new Error(`${bad.length} Probe(n) mit falschem Status oder Header: ${bad.map((b) => `${b.path}→${b.status}${b.headerError ? ` (${b.headerError})` : ""}`).join(", ")}`), { detail: bad });
  }
  return { count: rows.length, bad: 0, statuses: rows.map((r) => `${r.path} ${r.status}${r.headers?.["x-nextjs-cache"] ? ` (${r.headers["x-nextjs-cache"]})` : ""}`) };
}

// Gesamtabnahme (R5-release, opt-in step "accept"): tools/qa/shoot.mjs on all
// page types x 4 languages x 4 devices against this prod server. URL list:
// --accept=<file> (default tools/qa/abnahme-urls.txt, "<path> <status>").
// Portal pages get a signed demo session (same secret as the server).
async function stepAccept() {
  const list = path.resolve(REPO, String(args.accept || "tools/qa/abnahme-urls.txt"));
  const rows = fs
    .readFileSync(list, "utf8")
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, "").trim())
    .filter(Boolean)
    .map((l) => {
      const [p, status] = l.split(/\s+/);
      return { path: p, expect: Number(status) || null };
    });
  const dir = path.join(OUT, "abnahme");
  // --accept-reuse: only re-evaluate an existing report.json (no new shots).
  const reuse = args["accept-reuse"] && fs.existsSync(path.join(dir, "report.json"));
  const res = reuse ? { code: 0, ms: 0 } : await run(process.execPath, [path.join(REPO, "tools", "qa", "shoot.mjs"), dir, ...rows.map((r) => BASE + r.path)], {
    cwd: REPO,
    env: { ...process.env, SHOOT_PORTAL_SECRET: PORTAL_SESSION_SECRET },
    logFile: path.join(OUT, "abnahme.log"),
    timeoutMs: 4 * 60 * 60_000,
  });
  let report = [];
  try {
    report = JSON.parse(fs.readFileSync(path.join(dir, "report.json"), "utf8"));
  } catch {
    throw new Error(`shoot.mjs ohne report.json (Exit ${res.code}), siehe abnahme.log`);
  }
  const expectOf = new Map(rows.map((r) => [BASE + r.path, r.expect]));
  const issues = [];
  let cspNotice = 0;
  for (const e of report) {
    const expect = expectOf.get(e.url);
    const p = e.url.slice(BASE.length);
    if (e.error) issues.push({ path: p, device: e.device, issue: `Fehler: ${e.error}` });
    else if (expect && e.status !== expect) issues.push({ path: p, device: e.device, issue: `Status ${e.status} statt ${expect}` });
    if (e.horizontalOverflow) issues.push({ path: p, device: e.device, issue: "horizontaler Überlauf" });
    // The 404 page logs its own "404 (Not Found)"; everything else counts.
    // WebKit logs the report-only CSP without report-uri as an error (by
    // design until monitoring exists); counted separately, not as a defect.
    // shoot.mjs cuts messages at 300 chars, so match the start: "The Content
    // Security Policy '<policy>' was delivered in report-only mode, but does not
    // specify a 'report-uri'". Real violations start with "Refused to …".
    const isCspNotice = (c) => /^The Content Security Policy '/.test(c);
    if (e.consoleErrors.some(isCspNotice)) cspNotice++;
    const errs = e.consoleErrors.filter((c) => !(expect === 404 && /404/.test(c)) && !isCspNotice(c));
    if (errs.length) issues.push({ path: p, device: e.device, issue: `${errs.length} Konsolenfehler: ${errs[0]}` });
    // Aborted RSC prefetches (?_rsc=) are normal when the shot ends the page.
    const failed = e.failedRequests.filter((f) => !/ERR_ABORTED .*[?&]_rsc=|cancelled .*[?&]_rsc=/i.test(f));
    if (failed.length) issues.push({ path: p, device: e.device, issue: `${failed.length} fehlgeschlagene Requests: ${failed[0]}` });
  }
  fs.writeFileSync(path.join(OUT, "abnahme.json"), JSON.stringify({ urls: rows.length, shots: report.length, cspReportOnlyNotices: cspNotice, issues }, null, 2));
  return { exit: res.code, minutes: +(res.ms / 60000).toFixed(1), urls: rows.length, shots: report.length, cspReportOnlyNotices: cspNotice, issues: issues.length, sample: issues.slice(0, 12).map((i) => `${i.device} ${i.path}: ${i.issue}`) };
}

// Server log of `next start`: render errors that a green test run can hide.
// Rat 9,5 B3 (T5): release test "DSE-Sperre". Same env as the server (process
// env without credentials over the .env files of the copy, NODE_ENV=production).
function readDotenv(dir) {
  const out = {};
  for (const name of [".env", ".env.production", ".env.local", ".env.production.local"]) {
    let text = "";
    try {
      text = fs.readFileSync(path.join(dir, name), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  }
  return out;
}

async function stepDse() {
  const root = fs.existsSync(path.join(COPY, "src/lib/legal/dseFeatures.js")) ? COPY : REPO;
  const { DSE_FEATURES, anchorsInHtml, missingDseSections } = await import(pathToFileURL(path.join(root, "src/lib/legal/dseFeatures.js")).href);
  const env = { ...readDotenv(COPY), ...cleanEnv(), NODE_ENV: "production" };
  const r = await fetch(`${BASE}/de/datenschutz`, { signal: AbortSignal.timeout(60_000) });
  const html = await r.text();
  if (r.status !== 200) throw new Error(`/de/datenschutz antwortet ${r.status}`);
  const missing = missingDseSections(env, anchorsInHtml(html));
  const active = DSE_FEATURES.filter((f) => {
    try {
      return f.active(env);
    } catch {
      return true;
    }
  }).map((f) => f.feature);
  const drafts = (html.match(/data-dse-draft/g) || []).length;
  fs.writeFileSync(path.join(OUT, "dse.json"), JSON.stringify({ active, missing, drafts }, null, 2));
  if (drafts) throw new Error(`${drafts} Entwurf/Entwürfe von DSE-Abschnitten im Produktions-HTML`);
  if (missing.length) {
    const list = missing.map((m) => `${m.feature} (#${m.anchor})`).join(", ");
    throw Object.assign(new Error(`${missing.length} aktive Funktion(en) ohne Abschnitt in der Datenschutzerklärung: ${list}`), { detail: missing });
  }
  return { active: active.length, missing: 0 };
}

async function stepLogscan() {
  const file = path.join(OUT, "start.log");
  const log = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const count = (re) => (log.match(re) || []).length;
  return {
    staticToDynamic: count(/static to dynamic/gi),
    noFallbackError: count(/NoFallbackError/g),
    dynamicServerUsage: count(/DYNAMIC_SERVER_USAGE|Dynamic server usage/g),
    errorLines: count(/⨯/g),
    sample: log
      .split("\n")
      .filter((l) => /static to dynamic|NoFallbackError|⨯|Dynamic server usage/i.test(l))
      .slice(0, 15),
  };
}

// ---------- teardown ----------
let tornDown = false;
function teardown() {
  if (tornDown) return;
  tornDown = true;
  const notes = [];
  if (serverChild && serverChild.exitCode === null) {
    killTree(serverChild.pid);
    notes.push(`Prod-Server PID ${serverChild.pid} beendet (taskkill /T)`);
  }
  try {
    notes.push(
      ISOLATED
        ? "isolierte Kopie mit eigenem node_modules, keine Junction"
        : junctionCreated
          ? removeJunction()
          : "Junction nicht von diesem Lauf angelegt, bleibt",
    );
  } catch (err) {
    notes.push(`FEHLER Junction: ${err.message}`);
  }
  summary.teardown = notes;
  for (const n of notes) logLine(n);
}
for (const sig of ["SIGINT", "SIGTERM", "SIGBREAK"]) {
  process.on(sig, () => {
    teardown();
    process.exit(130);
  });
}

function writeSummary() {
  summary.finished = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  const s = summary.steps;
  const lines = [`# Prod-Check ${LABEL}`, "", `Start ${summary.started}, Ende ${summary.finished}, Kopie \`${COPY}\`, ${BASE}, SERVER=${SERVER}`, ""];
  for (const [name, r] of Object.entries(s)) {
    if (r.error) lines.push(`- **${name}: FEHLER** ${r.error}`);
    else if (name === "tests" && r.stats)
      lines.push(`- tests: ${r.stats.expected} grün, ${r.stats.unexpected} rot, ${r.stats.flaky} flaky, ${r.stats.skipped} übersprungen (${r.minutes} min)`);
    else if (name === "perf")
      for (const p of r)
        lines.push(`- perf ${p.profile} ${p.path}: TTFB ${p.ttfb} ms, LCP ${p.lcp} ms, CLS ${p.cls}, TBT ${p.tbt} ms${p.withinBudget ? "" : " **über Budget**"}`);
    else if (name === "manifest")
      lines.push(`- manifest: ${r.prerendered} vorgerenderte Routen, ${r.leakedCount} dynamisch-pflichtige darunter, Ratgeber ${r.ratgeber?.length ?? 0}, revalidate ${JSON.stringify(r.revalidate)}`);
    else if (name === "logscan")
      lines.push(`- logscan: static-to-dynamic ${r.staticToDynamic}, NoFallbackError ${r.noFallbackError}, Dynamic server usage ${r.dynamicServerUsage}, ⨯-Zeilen ${r.errorLines}`);
    else lines.push(`- ${name}: ${JSON.stringify(r).slice(0, 400)}`);
  }
  if (s.tests?.failures?.length) {
    lines.push("", "## Rote/flaky Tests", "");
    for (const f of s.tests.failures) lines.push(`- ${f.flaky ? "(flaky) " : ""}${f.project} · ${f.file}:${f.line} · ${f.title}${f.error ? `\n  > ${f.error.split("\n").slice(0, 4).join(" ⏎ ")}` : ""}`);
  }
  lines.push("", "Abbau: " + (summary.teardown || []).join("; "));
  fs.writeFileSync(path.join(OUT, "summary.md"), lines.join("\n") + "\n");
}

// ---------- main ----------
const ORDER = [
  ["copy", stepCopy, true],
  ["build", stepBuild, true],
  ["manifest", stepManifest, false],
  ["start", stepStart, true],
  ["probe", stepProbe, false],
  ["dse", stepDse, false],
  ["tests", stepTests, false],
  ["claims", stepClaims, false],
  ["nap", stepNap, false],
  ["facts", stepFacts, false],
  ["perf", stepPerf, false],
  ["accept", stepAccept, false], // opt-in (not in the default --steps)
  ["profile", stepProfile, false], // opt-in (R6)
  ["logscan", stepLogscan, false],
];
let failed = false;
try {
  if (!STEPS.has("copy") && (STEPS.has("build") || STEPS.has("start"))) {
    // reuse an existing copy: the junction is needed for build/start
    if (!ISOLATED && !fs.existsSync(JUNCTION)) createJunction();
  }
  for (const [name, fn, fatal] of ORDER) {
    if (!STEPS.has(name)) continue;
    if (name === "nap" || name === "facts" || name === "manifest" || name === "logscan") {
      /* reads files only, no server needed */
    } else if (["probe", "dse", "tests", "claims", "perf", "accept", "profile"].includes(name) && !(name === "accept" && args["accept-reuse"]) && !serverChild && !(await portInUse(PORT))) {
      summary.steps[name] = { error: "kein Prod-Server" };
      continue;
    }
    logLine(`▶ ${name}`);
    try {
      summary.steps[name] = await fn();
      logLine(`✓ ${name}`);
    } catch (err) {
      summary.steps[name] = { error: err.message, detail: err.detail };
      logLine(`✗ ${name}: ${err.message}`);
      failed = true;
      if (fatal) break;
    }
    writeSummary();
  }
} finally {
  teardown();
  writeSummary();
  logLine(`Ergebnis: ${path.join(OUT, "summary.md")}`);
}
const t = summary.steps.tests;
process.exitCode = failed || t?.stats?.unexpected ? 1 : 0;
