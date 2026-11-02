// tests/unit/upload-live.test.mjs — Abnahme Restliste (28.10.2026):
// R-9 live preparation (storage/rate-limit config, readiness checklist, limit
// stores), R-8 longer portal header timeout, R-6 message proposal (JSON valid,
// covers every upload error code, ICU placeholders balanced).
// Run: node --test tests/unit/upload-live.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const live = await load("src/lib/upload/liveConfig.js");
const limits = await load("src/lib/upload/limitStore.js");
const messages = await load("src/lib/upload/messages.js");

const GOOD_ENV = {
  UPLOAD_TOKEN_SECRET: "x".repeat(40),
  UPLOAD_PUBLIC_BASE_URL: "https://platzhirsch.studio",
  UPLOAD_LOCAL_DIR: "/srv/platzhirsch/uploads",
  UPLOAD_BACKUP_CONFIRMED: "1",
  UPLOAD_TRUSTED_IP_HEADER: "x-real-ip",
};

test("R-9 readiness: empty env is not ready and names every open point", () => {
  const r = live.liveReadiness({});
  assert.equal(r.ready, false);
  const open = new Set(r.items.filter((i) => !i.ok).map((i) => i.key));
  for (const k of ["secret", "baseUrl", "localDir", "backup", "trustedIp", "retention"]) assert.ok(open.has(k), k);
  assert.ok(!open.has("demoOff") && !open.has("storageKnown") && !open.has("rateLimitScope"));
  // QM fix2 P3-5: only open items carry the to-do text.
  for (const i of r.items) {
    if (i.ok) assert.equal(i.text, null, i.key);
    else assert.match(i.text, /\S{3}/, i.key);
  }
});

test("R-9 readiness: single instance + local volume + backup + confirmed Löschfrist is ready", () => {
  assert.equal(live.liveReadiness(GOOD_ENV, { retentionConfirmed: true }).ready, true);
  assert.equal(live.liveReadiness(GOOD_ENV).ready, false, "retention placeholder blocks");
  const bad = (extra) => live.liveReadiness({ ...GOOD_ENV, ...extra }, { retentionConfirmed: true });
  assert.equal(bad({ UPLOAD_DEMO_ENABLED: "1" }).ready, false);
  assert.equal(bad({ UPLOAD_TOKEN_SECRET: "short" }).ready, false);
  assert.equal(bad({ UPLOAD_PUBLIC_BASE_URL: "http://192.168.0.5:3000" }).ready, false);
  assert.equal(bad({ UPLOAD_LOCAL_DIR: ".data/uploads" }).ready, false, "relative dir");
  assert.equal(bad({ UPLOAD_LOCAL_DIR: "D:\\uploads" }).ready, true, "Windows absolute dir");
  assert.equal(bad({ UPLOAD_SINGLE_INSTANCE: "0" }).ready, false, "memory limits + local disk need one instance");
  assert.equal(bad({ UPLOAD_RATE_LIMIT_STORE: "redis" }).ready, false, "unknown backend");
  assert.equal(bad({ UPLOAD_RATE_LIMIT_STORE: "shared" }).ready, true, "shared store wired in code");
});

test("R-9 storage: s3 is planned but not implemented (no cloud without owner OK)", () => {
  const s = live.storageConfig({ UPLOAD_STORAGE: "S3", UPLOAD_S3_BUCKET: "b" });
  assert.equal(s.adapter, "s3");
  assert.equal(s.known, true);
  assert.equal(s.implemented, false);
  assert.equal(s.s3.configured, false);
  assert.ok(s.s3.missing.includes("UPLOAD_S3_SECRET_ACCESS_KEY"));
  const all = Object.fromEntries(live.S3_ENV.map((k) => [k, "SECRET_VALUE"]));
  const full = live.storageConfig({ UPLOAD_STORAGE: "s3", ...all });
  assert.equal(full.s3.configured, true);
  assert.ok(!JSON.stringify({ ...full, s3: { ...full.s3, bucket: null, region: null } }).includes("SECRET_VALUE"), "no keys in the result");
  const r = live.liveReadiness({ ...GOOD_ENV, UPLOAD_STORAGE: "s3", ...all }, { retentionConfirmed: true });
  assert.equal(r.ready, false);
  assert.equal(r.items.find((i) => i.key === "storageKnown").ok, false);
  // store.js only maps the local adapter; no cloud SDK anywhere in the store.
  assert.match(read("src/lib/upload/store.js"), /const adapters = \{ local: localStore \};/);
  assert.doesNotMatch(read("src/lib/upload/store.js") + read("src/lib/upload/localStore.js"), /@aws-sdk|minio|fetch\(/);
});

test("R-9 local dir: UPLOAD_LOCAL_DIR is honoured, default stays <cwd>/.data/uploads", () => {
  const src = read("src/lib/upload/localStore.js");
  assert.match(src, /process\.env\.UPLOAD_LOCAL_DIR \? path\.resolve\(process\.env\.UPLOAD_LOCAL_DIR\) : path\.join\(process\.cwd\(\), "\.data", "uploads"\)/);
});

test("R-9 memory limit store: sliding window, counts every request, LRU trim", async () => {
  const m = limits.createMemoryStore({ maxKeys: 4 });
  const now = 1_000_000;
  for (let i = 0; i < 3; i++) assert.equal(await m.take("a", 3, 1000, now + i), false);
  assert.equal(await m.take("a", 3, 1000, now + 3), true, "4th within window is over");
  assert.equal(await m.take("a", 3, 1000, now + 5000), false, "window passed");
  for (const k of ["b", "c", "d", "e"]) await m.take(k, 3, 1000, now);
  assert.ok(m.size() <= 4);
});

test("R-9 shared limit store: Redis commands via exec, no client bundled", async () => {
  const zsets = new Map();
  const calls = [];
  const exec = async ([cmd, key, ...a]) => {
    calls.push(cmd);
    const z = zsets.get(key) || [];
    zsets.set(key, z);
    if (cmd === "ZREMRANGEBYSCORE") {
      const max = Number(a[1]);
      zsets.set(key, z.filter((s) => s > max));
      return 0;
    }
    if (cmd === "ZADD") {
      z.push(Number(a[0]));
      return 1;
    }
    if (cmd === "ZCARD") return z.length;
    return 1;
  };
  const s = limits.createSharedStore(exec, { prefix: "t:" });
  assert.equal(s.name, "shared");
  assert.equal(await s.take("k", 1, 1000, 10), false);
  assert.equal(await s.take("k", 1, 1000, 11), true);
  assert.equal(await s.take("k", 1, 1000, 5000), false);
  assert.deepEqual([...new Set(calls)].sort(), ["PEXPIRE", "ZADD", "ZCARD", "ZREMRANGEBYSCORE"]);
  assert.ok([...zsets.keys()].every((k) => k.startsWith("t:")));
  assert.throws(() => limits.createSharedStore(null), TypeError);
});

test("R-9 http.js: limits come from config, store is pluggable with memory fallback", () => {
  const src = read("src/lib/upload/http.js");
  assert.match(src, /export function setUploadLimitStore/);
  assert.match(src, /UPLOAD_CONFIG\.rateLimits\.link/);
  assert.match(src, /withFallback\(store, state\.memory, \{ timeoutMs: UPLOAD_CONFIG\.rateLimits\.storeTimeoutMs \}\)/);
  assert.match(src, /sharedStoreMismatch\(process\.env, uploadLimitStoreName\(\)\)/);
  const session = read("src/app/api/upload/session/route.js");
  assert.match(session, /MINT\.perIp/);
  assert.match(session, /await rateLimited\("mint:all", MINT\.all/);
  for (const f of ["[token]/files/route.js", "[token]/files/[fileId]/route.js", "[token]/route.js"]) {
    const r = read(`src/app/api/upload/${f}`);
    assert.doesNotMatch(r, /= linkLimited\(/, `${f}: linkLimited is awaited`);
  }
});

test("R-8: portal header requests have their own longer timeout and a warm-up", () => {
  const spec = read("tests/e2e/r3-portal-upload.spec.js");
  assert.match(spec, /const HEADER_REQ = \{ method: "HEAD", maxRedirects: 0, timeout: REQUEST_TIMEOUT \}/);
  assert.doesNotMatch(spec, /(request|ctx)\.get\([^)]*HEADER_REQ/, "QM fix2 P3-2: header checks use HEAD via fetch");
  assert.match(spec, /test\.beforeAll\(async \(\{ playwright \}/);
  assert.doesNotMatch(spec, /\{ maxRedirects: 0 \}\)/, "no request without the longer timeout");
});

test("R-7: dev indicator is documented, not changed by this team", () => {
  const doc = read("Marktresearch/digital/features/handy-upload.md");
  assert.match(doc, /R-7/);
  assert.match(doc, /devIndicators/);
});

test("R-6: message proposal is valid, covers every error code and has balanced ICU", () => {
  const json = JSON.parse(read("Marktresearch/digital/features/upload-messages-vorschlag.json"));
  const U = json.Upload;
  assert.ok(U && U.client && U.handoff && U.consent && U.errors && U.handoffReasons);
  for (const code of Object.keys(messages.UPLOAD_ERRORS)) assert.equal(U.errors[code], messages.UPLOAD_ERRORS[code], code);
  assert.equal(U.errors.fallback, messages.FALLBACK_ERROR);
  for (const [k, v] of Object.entries(messages.HANDOFF_REASONS)) if (v) assert.equal(U.handoffReasons[k], v, k);
  // Existing keys in src/messages/de.json are not duplicated.
  for (const k of ["page", "problem", "frame"]) assert.equal(U[k], undefined, k);
  const walk = (o, p = "") => Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? walk(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
  for (const [k, v] of walk(U)) {
    let depth = 0;
    for (const ch of v) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      assert.ok(depth >= 0, k);
    }
    assert.equal(depth, 0, `${k}: braces balanced`);
    assert.doesNotMatch(v, /\$\{/, `${k}: no JS template left`);
    for (const tag of v.matchAll(/<(\w+)>/g)) assert.ok(v.includes(`</${tag[1]}>`), `${k}: <${tag[1]}> closed`);
  }
  // src/messages/*.json belongs to the translation team, which has adopted
  // the proposal there since (28.10.2026). This team does not edit those
  // files; when adopted, the error texts must still match the proposal.
  const de = JSON.parse(read("src/messages/de.json"));
  if (de.Upload.errors) assert.deepEqual(de.Upload.errors, U.errors);
});

// ---- QM fix2 (qa-screenshots/feinschliff/handy-upload/feedback.md) ----

test("P2-1 withFallback: a shared store that never answers falls back to memory in < 500 ms", async () => {
  const logs = [];
  const memory = limits.createMemoryStore();
  const hanging = limits.createSharedStore(() => new Promise(() => {})); // offline queue: never resolves
  const s = limits.withFallback(hanging, memory, { timeoutMs: 300, log: (m) => logs.push(m) });
  assert.equal(s.name, "shared");
  const t0 = Date.now();
  assert.equal(await s.take("k", 1, 60_000, 1000), false);
  const took = Date.now() - t0;
  assert.ok(took >= 250 && took < 500, `took ${took} ms`);
  assert.equal(s.lastSource(), "memory");
  assert.equal(memory.size(), 1, "counted in memory");
  assert.equal(await s.take("k", 1, 60_000, 1001), true, "memory keeps counting: 2nd is over");
  assert.equal(logs.length, 1, "logged at most once per minute");
  assert.match(logs[0], /antwortet nicht innerhalb von 300 ms/);
});

test("P2-1 withFallback: a throwing store falls back at once; a healthy one is used", async () => {
  const logs = [];
  const memory = limits.createMemoryStore();
  const broken = limits.createSharedStore(async () => {
    throw new Error("ECONNREFUSED");
  });
  const s = limits.withFallback(broken, memory, { timeoutMs: 300, log: (m) => logs.push(m) });
  const t0 = Date.now();
  assert.equal(await s.take("k", 5, 60_000, 1000), false);
  assert.ok(Date.now() - t0 < 100, "no waiting for the timeout");
  assert.equal(s.lastSource(), "memory");
  assert.equal(memory.size(), 1);
  assert.match(logs[0], /nicht erreichbar \(ECONNREFUSED\)/);

  let calls = 0;
  const ok = { name: "shared", take: async () => (calls++, true) };
  const h = limits.withFallback(ok, limits.createMemoryStore(), { timeoutMs: 300, log: () => {} });
  assert.equal(await h.take("k", 1, 1000, 1), true);
  assert.equal(h.lastSource(), "shared");
  assert.equal(calls, 1);
  assert.throws(() => limits.withFallback(null, memory), TypeError);
});

test("P2-1 config: storeTimeoutMs is 300 ms", () => {
  assert.match(read("src/lib/upload/config.js"), /storeTimeoutMs: 300,/);
});

test("P2-2 sharedStoreMismatch: env says shared but no shared store is attached", () => {
  const msg = limits.sharedStoreMismatch({ UPLOAD_RATE_LIMIT_STORE: "shared" }, "memory");
  assert.equal(msg, "[upload] UPLOAD_RATE_LIMIT_STORE=shared, aber kein geteilter Speicher angeschlossen – zähle im Arbeitsspeicher");
  assert.equal(limits.sharedStoreMismatch({ UPLOAD_RATE_LIMIT_STORE: " Shared " }, "memory"), msg);
  assert.equal(limits.sharedStoreMismatch({ UPLOAD_RATE_LIMIT_STORE: "shared" }, "shared"), null);
  assert.equal(limits.sharedStoreMismatch({}, "memory"), null);
  assert.equal(limits.sharedStoreMismatch({ UPLOAD_RATE_LIMIT_STORE: "memory" }, "memory"), null);
  assert.doesNotMatch(read("src/lib/upload/liveConfig.js"), /store\.js logs the active store/, "old comment fixed");
});

test("P3-4: size errors use the German plural (Pläne, not Plans)", async () => {
  const { UPLOAD_CONFIG } = await load("src/lib/upload/config.js");
  const plural = Object.fromEntries(Object.entries(UPLOAD_CONFIG.categories).map(([k, c]) => [k, c.labelPlural]));
  assert.deepEqual(plural, { photo: "Fotos", video: "Videos", plan: "Pläne" });
  const client = read("src/components/Upload/UploadClient.js");
  assert.doesNotMatch(client, /\.label\}s/);
  assert.equal((client.match(/\.labelPlural\}/g) || []).length, 2);
});

test("P3-3: proposal has the four demo test notes", () => {
  const j = JSON.parse(read("Marktresearch/digital/features/upload-messages-vorschlag.json"));
  assert.deepEqual(Object.keys(j.Upload.demo.testNotesItems), ["lanIp", "limits", "resume", "magicBytes"]);
});

test("P3-1/P3-6 doc: first upload call (not start), no offline queue, bundling noted", () => {
  const doc = read("Marktresearch/digital/features/handy-upload.md");
  assert.doesNotMatch(doc, /schreibt `store\.js` beim Start/);
  assert.match(doc, /beim ersten Upload-Aufruf/);
  assert.match(doc, /disableOfflineQueue/);
  assert.match(doc, /enableOfflineQueue: false/);
  assert.match(doc, /MULTI`\/`EXEC/);
});
