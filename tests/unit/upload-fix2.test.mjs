// tests/unit/upload-fix2.test.mjs — Handy-Upload Premium, QA round fix2
// (qa-screenshots/labs-ausbau/handy-upload/feedback-2.md).
// Run: node --test tests/unit/upload-fix2.test.mjs
// No network, no backoffice. The local store writes into a temporary folder
// (process.chdir), never into the repo.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SRC = path.join(ROOT, "src");

// F4 Fix-Runde 1 (r1-recht-inhalt P0-4): the upload takes nothing while the
// Löschfrist is unconfirmed (UPLOAD_CONFIG.retentionConfirmed = false). These
// tests check the upload mechanics themselves, so they open it with the
// development override (ignored in production). The paused state has its own
// tests in tests/unit/f4-upload-recht.test.mjs.
process.env.UPLOAD_ACCEPT_UNCONFIRMED = "1";
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// Same mapping as upload.test.mjs: "server-only", "@/..." and extensionless imports.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
    if (specifier === "next/server") return next("next/server.js", context);
    let spec = specifier;
    if (spec.startsWith("@/")) spec = pathToFileURL(path.join(SRC, spec.slice(2))).href;
    const fromSrc = spec.startsWith("file:") || ((spec.startsWith("./") || spec.startsWith("../")) && context.parentURL?.includes("/src/"));
    if (fromSrc && !/\.[cm]?js$/.test(spec)) {
      const url = new URL(spec, context.parentURL);
      for (const ext of [".js", "/index.js"]) {
        const candidate = fileURLToPath(url) + ext;
        if (fs.existsSync(candidate)) return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return next(spec, context);
  },
});

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "ph-upload-fix2-"));
const CWD = process.cwd();
let token, service, config;

before(async () => {
  process.chdir(TMP); // localStore uses <cwd>/.data/uploads
  token = await import(pathToFileURL(path.join(SRC, "lib/upload/token.js")).href);
  service = await import(pathToFileURL(path.join(SRC, "lib/upload/service.js")).href);
  config = await import(pathToFileURL(path.join(SRC, "lib/upload/config.js")).href);
});
after(() => {
  process.chdir(CWD);
  fs.rmSync(TMP, { recursive: true, force: true });
});

// ---- pure helpers of UploadClient.js, evaluated in isolation ---------------
// (UploadClient.js is a JSX client module; postJson/attemptSignal/nap are plain JS.)
function clientLib({ fetchImpl, online = true }) {
  const src = read("src/components/Upload/UploadClient.js");
  const pick = (name) => src.match(new RegExp(`(?:async )?function ${name}\\([\\s\\S]*?\\n\\}`))[0];
  const body = `const POST_TIMEOUT_MS = 12000;\n${pick("attemptSignal")}\n${pick("nap")}\n${pick("postJson")}\nreturn { postJson };`;
  return new Function("fetch", "navigator", body)(fetchImpl, { onLine: online });
}

/** fetch that hangs until aborted (like a WebKit request to an overloaded server); `answerOn` = call numbers that answer ok. */
function hangingFetch(answerOn = []) {
  const calls = [];
  const fn = (url, init) => {
    calls.push({ url, at: Date.now() });
    if (answerOn.includes(calls.length)) return Promise.resolve(Response.json({ ok: true, file: { fileId: "x" } }));
    return new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason || new Error("aborted"))));
  };
  fn.calls = calls;
  return fn;
}

test("P1-1: every POST attempt has its own timeout; POST /files gets 5 attempts", async () => {
  const f = hangingFetch();
  const { postJson } = clientLib({ fetchImpl: f });
  const retries = [];
  const t0 = Date.now();
  const res = await postJson("/api/upload/t/files", {}, [5, 5, 5, 5], (n, of) => retries.push(`${n}/${of}`), { timeout: 40 });
  assert.equal(f.calls.length, 5, "1 + 4 retries");
  assert.deepEqual(retries, ["2/5", "3/5", "4/5", "5/5"]);
  assert.equal(res.network, true);
  assert.ok(Date.now() - t0 < 2000, "timeouts end each attempt (no 60 s wait)");
});

test("P1-1: a slow first attempt is cut off and the retry gets through", async () => {
  const f = hangingFetch([2]);
  const { postJson } = clientLib({ fetchImpl: f });
  const res = await postJson("/api/upload/t/files", {}, [5, 5, 5, 5], null, { timeout: 40 });
  assert.equal(res.ok, true);
  assert.equal(f.calls.length, 2);
});

test("P1-1: manual 'Erneut versuchen' (ctl.kick) ends the attempt at once and does not use up an attempt", async () => {
  const f = hangingFetch([2]);
  const { postJson } = clientLib({ fetchImpl: f });
  const ctl = { kick: null, kicked: false };
  const retries = [];
  const p = postJson("/api/upload/t/files", {}, [5, 5, 5, 5], (n) => retries.push(n), { timeout: 60_000, ctl });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(typeof ctl.kick, "function", "kick available while the attempt runs");
  const kickedAt = Date.now();
  ctl.kick();
  const res = await p;
  assert.equal(res.ok, true);
  assert.ok(Date.now() - kickedAt < 500, "new attempt right away");
  assert.deepEqual(retries, [], "a kick is not counted as an automatic retry");
  assert.equal(ctl.kick, null);
});

test("P1-1: offline → no retry storm, answer 'network' at once", async () => {
  const f = hangingFetch();
  const { postJson } = clientLib({ fetchImpl: f, online: false });
  const res = await postJson("/x", {}, [5, 5, 5, 5], null, { timeout: 30 });
  assert.equal(res.network, true);
  assert.equal(f.calls.length, 1);
});

// ---- server: idempotent POST /files, mint without blocking purge -----------
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1]), Buffer.alloc(5_000_000, 7), Buffer.from([0xff, 0xd9])]);
const fileInput = (over = {}) => ({ name: "wohnzimmer.jpg", size: JPEG.length, type: "image/jpeg", lastModified: 1730000000000, category: "photo", consentVersion: config.CONSENT_VERSION, ...over });

test("P1-1: same fingerprint → same fileId, also for 5 parallel retries of POST /files", async () => {
  const { token: tk } = await service.mintSession({ ticket: token.signTicket({ kind: "beratung" }) });
  const results = await Promise.all(Array.from({ length: 5 }, () => service.initFile(tk, fileInput())));
  const ids = new Set(results.map((r) => r.fileId));
  assert.equal(ids.size, 1, "one file, no duplicates");
  assert.equal(results[0].totalChunks, 2, "multi-chunk file stays 'uploading' and is still matched");
  // a later retry (e.g. after a timeout) still lands on the same entry
  assert.equal((await service.initFile(tk, fileInput())).fileId, results[0].fileId);
  // a different file (other lastModified) is a new entry
  assert.notEqual((await service.initFile(tk, fileInput({ lastModified: 2 }))).fileId, results[0].fileId);
  const { session } = await service.openSession(tk);
  assert.equal(session.files.length, 2);
});

test("P1-1: mint starts the purge in the background (throttled) and reads stats in parallel", async () => {
  const src = read("src/lib/upload/service.js");
  const mint = src.slice(src.indexOf("export async function mintSession"), src.indexOf("export function demoSession"));
  assert.doesNotMatch(mint, /await store\.purgeExpired/);
  assert.match(mint, /purgeInBackground\(\);/);
  assert.match(read("src/lib/upload/localStore.js"), /await Promise\.all\(entries\.filter/);

  // an expired folder is removed by the background run, not inside the request
  const id = "expired-folder-test-1";
  const dir = path.join(TMP, ".data", "uploads", id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "session.json"), JSON.stringify({ id, createdAt: "2020-01-01T00:00:00Z", deleteAfter: "2020-01-02T00:00:00Z", files: [] }));
  const run = service.purgeInBackground(Date.now() + 11 * 60 * 1000);
  assert.ok(run && typeof run.then === "function");
  assert.equal(service.purgeInBackground(Date.now() + 11 * 60 * 1000), run, "one run at a time");
  await run;
  assert.equal(fs.existsSync(dir), false, "expired folder purged");
  assert.equal(service.purgeInBackground(Date.now() + 12 * 60 * 1000), null, "throttled: max. once per 10 min");
});

// ---- client presentation rules (source checks) -----------------------------
test("P1-1: client timeout 12 s, 5 attempts for POST /files, stall button after 20 s, bar mirrors the active file", () => {
  const src = read("src/components/Upload/UploadClient.js");
  assert.match(src, /const POST_TIMEOUT_MS = 12000;/);
  assert.match(src, /AbortSignal\.timeout\(ms\)/);
  assert.match(src, /\}, BACKOFF, onRetry, \{ ctl \}\);/);
  assert.doesNotMatch(src, /BACKOFF\.slice\(0, 2\)/);
  assert.match(src, /const STALL_MS = 20000;/);
  assert.match(src, /data-upload-kick=""/);
  assert.match(src, /paused: "Pausiert – wartet auf Verbindung"/);
  assert.match(src, /retry: `Neuer Versuch \$\{active\?\.retry\}\/\$\{active\?\.retryOf \|\| TRIES\}…`/);
  assert.match(src, /slow: "Verbindung ist langsam – wir bleiben dran…"/);
  assert.match(src, /paused: WifiOff/);
  assert.match(src, /motion-safe:animate-\[uploadSweep[^\]]*\] motion-reduce:hidden" data-upload-bar-sweep/);
  // security logic untouched
  assert.match(src, /xhr\.open\("PUT", url\)/);
  assert.match(src, /consentVersion: CONSENT_VERSION/);
});

test("P2-1/P2-2: progress never backwards, 97 % per chunk until confirmed, ≤ 99 % until all done", () => {
  const src = read("src/components/Upload/UploadClient.js");
  assert.match(src, /shown = Math\.max\(shown, Math\.min\(1, value\)\);/);
  assert.match(src, /Math\.min\(loaded, blob\.size \* 0\.97\)/);
  assert.match(src, /const pct = allDone \? 100 : Math\.min\(99, Math\.floor\(overall \* 100\)\);/);
  assert.doesNotMatch(src, /Math\.round\(overall \* 100\)/);
});

test("P2-3: blocked clipboard → read-only, selected field with the link + live message", () => {
  const src = read("src/components/Upload/UploadHandoff.js");
  assert.match(src, /if \(!navigator\.clipboard\?\.writeText\) throw/);
  assert.match(src, /data-upload-copy-fallback=""/);
  assert.match(src, /readOnly/);
  assert.match(src, /el\?\.select\(\);/);
  assert.match(src, /Kopieren nicht möglich – Link markiert, mit \$\{isMac \? "⌘" : "Strg"\} \+ C kopieren/);
});

// ---- acceptance remainders (abnahme.md R-1, R-5) ----------------------------
test("Abnahme R-1/R-5: consent locked until hydration, early files adopted, phone bar keeps its text", () => {
  const src = read("src/components/Upload/UploadClient.js");
  assert.match(src, /const useMounted = \(\) => useSyncExternalStore\(noopSubscribe, \(\) => true, \(\) => false\);/);
  assert.match(src, /checked=\{consent\}\s+disabled=\{!mounted\}/);
  assert.match(src, /if \(el\?\.files\?\.length\) \{\s+addFiles\(el\.files, p\);/);
  // the queue still waits for consent: adopted files never upload without it
  assert.match(src, /if \(runningRef\.current \|\| !consent \|\| !online \|\| linkProblem\) return;/);
  // icon-only retry on phones, accessible name kept
  assert.equal((src.match(/<span className="sr-only sm:not-sr-only">Erneut versuchen<\/span>/g) || []).length, 2);
  assert.match(src, /min-h-11 min-w-11 shrink-0/);
});
