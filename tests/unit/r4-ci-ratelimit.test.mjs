// tests/unit/r4-ci-ratelimit.test.mjs — R4-plattform-ci (AP1.4)
// Rate-Limit für /cmx und /api/shop-search über die Concierge-Speicher-
// Abstraktion, Header-Timeout des /cmx-Proxys. Kein Netz, kein Server.
// Run: node --test tests/unit/r4-ci-ratelimit.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LIMITS,
  clientIp,
  createRouteLimiter,
  getRouteLimiter,
  isInternal,
  tooManyRequests,
} from "../../src/app/cmx/_lib/routeLimit.js";
import { fetchWithHeaderTimeout } from "../../src/app/cmx/_lib/upstream.js";
import { createSharedStore } from "../../src/lib/concierge/limitStore.js";

const NOW = Date.parse("2026-10-26T10:00:00Z");
const h = (obj) => new Headers(obj);
const RULE = [{ max: 3, windowMs: 60_000 }];

test("clientIp: letzter X-Forwarded-For-Eintrag (nginx hängt an), sonst x-real-ip, sonst null", () => {
  assert.equal(clientIp(h({ "x-forwarded-for": "1.1.1.1, 203.0.113.7" })), "203.0.113.7");
  assert.equal(clientIp(h({ "x-real-ip": "198.51.100.2" })), "198.51.100.2");
  assert.equal(clientIp(h({})), null);
  assert.equal(clientIp(undefined), null);
});

test("isInternal: Loopback und fehlende Adresse zählen nicht (Bild-Optimierer)", () => {
  for (const ip of [null, "", "127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"]) assert.equal(isInternal(ip), true, ip);
  for (const ip of ["203.0.113.7", "10.0.0.5", "2001:db8::1"]) assert.equal(isInternal(ip), false, ip);
});

test("Limit: 4. Anfrage derselben IP → 429-Ergebnis mit retryAfter, andere IP frei, Fenster läuft ab", async () => {
  const lim = createRouteLimiter("cmx", { rules: RULE });
  const a = h({ "x-forwarded-for": "203.0.113.7" });
  for (let i = 0; i < 3; i++) assert.deepEqual(await lim.check(a, NOW + i), { ok: true });
  const blocked = await lim.check(a, NOW + 10);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfter, 60);
  assert.equal((await lim.check(h({ "x-forwarded-for": "198.51.100.9" }), NOW + 10)).ok, true);
  assert.equal((await lim.check(a, NOW + 60_001)).ok, true);
});

test("Abgelehnte Anfragen verlängern die Sperre nicht", async () => {
  const lim = createRouteLimiter("search", { rules: RULE });
  const a = h({ "x-forwarded-for": "203.0.113.8" });
  for (let i = 0; i < 3; i++) await lim.check(a, NOW);
  for (let i = 0; i < 50; i++) assert.equal((await lim.check(a, NOW + 1000 + i)).ok, false);
  assert.equal((await lim.check(a, NOW + 60_000)).ok, true);
});

test("Interne Aufrufe (ohne Adresse/Loopback) werden nie gezählt", async () => {
  const lim = createRouteLimiter("cmx", { rules: RULE });
  for (let i = 0; i < 20; i++) {
    const r = await lim.check(h({ "x-forwarded-for": "127.0.0.1" }), NOW);
    assert.equal(r.ok, true);
    assert.equal(r.skipped, "internal");
  }
  assert.equal((await lim.check(h({}), NOW)).skipped, "internal");
});

test("Routen haben getrennte Eimer", async () => {
  const cmx = createRouteLimiter("cmx", { rules: RULE });
  const search = createRouteLimiter("search", { rules: RULE });
  const a = h({ "x-forwarded-for": "203.0.113.10" });
  for (let i = 0; i < 3; i++) await cmx.check(a, NOW);
  assert.equal((await cmx.check(a, NOW)).ok, false);
  assert.equal((await search.check(a, NOW)).ok, true);
});

test("Mehrere Regeln: Stundenlimit greift auch, wenn das Minutenlimit frei ist", async () => {
  const lim = createRouteLimiter("search", { rules: [{ max: 5, windowMs: 60_000 }, { max: 6, windowMs: 3_600_000 }] });
  const a = h({ "x-forwarded-for": "203.0.113.11" });
  for (let i = 0; i < 6; i++) assert.equal((await lim.check(a, NOW + i * 61_000)).ok, true);
  const r = await lim.check(a, NOW + 7 * 61_000);
  assert.equal(r.ok, false);
  assert.ok(r.retryAfter > 60, `retryAfter ${r.retryAfter}`);
});

test("Speicher-Abstraktion: geteilter Speicher wird benutzt, bei Ausfall Arbeitsspeicher (Limits greifen weiter)", async () => {
  const calls = [];
  const zsets = new Map();
  const exec = async (args) => {
    calls.push(args[0]);
    const [cmd, key, a, b] = args;
    const z = zsets.get(key) || zsets.set(key, new Map()).get(key);
    if (cmd === "ZADD") return z.set(b, Number(a)), 1;
    if (cmd === "ZREMRANGEBYSCORE") {
      for (const [m, s] of z) if (s <= Number(b)) z.delete(m);
      return 1;
    }
    if (cmd === "ZRANGEBYSCORE") return [...z].flatMap(([m, s]) => (s >= Number(a) ? [m, String(s)] : []));
    return 1;
  };
  const lim = createRouteLimiter("cmx", { rules: RULE, store: createSharedStore(exec, { prefix: "cmx:rl:" }) });
  assert.equal(lim.storeName, "shared");
  const a = h({ "x-forwarded-for": "203.0.113.12" });
  for (let i = 0; i < 3; i++) await lim.check(a, NOW);
  assert.equal((await lim.check(a, NOW)).ok, false);
  assert.ok(calls.includes("ZADD"));

  const errors = [];
  const origError = console.error;
  console.error = (...args) => errors.push(args.join(" "));
  try {
    const broken = createRouteLimiter("cmx", { rules: RULE, store: createSharedStore(async () => { throw new Error("redis down"); }) });
    for (let i = 0; i < 3; i++) assert.equal((await broken.check(a, NOW)).ok, true);
    assert.equal((await broken.check(a, NOW)).ok, false, "Arbeitsspeicher-Ersatz zählt weiter");
  } finally {
    console.error = origError;
  }
  assert.ok(errors.some((e) => e.includes("redis down")));
});

test("getRouteLimiter: eine Instanz je Route und Prozess; Standardgrenzen großzügig", () => {
  assert.equal(getRouteLimiter("cmx"), getRouteLimiter("cmx"));
  assert.notEqual(getRouteLimiter("cmx"), getRouteLimiter("search"));
  assert.throws(() => getRouteLimiter("unbekannt"));
  assert.ok(LIMITS.cmx[0].max >= 300 && LIMITS.cmx[0].windowMs === 60_000);
  assert.ok(LIMITS.search[0].max >= 120);
});

test("tooManyRequests: 429, Retry-After in ganzen Sekunden, no-store; JSON-Variante abwärtskompatibel", async () => {
  const text = tooManyRequests(12.2);
  assert.equal(text.status, 429);
  assert.equal(text.headers.get("Retry-After"), "13");
  assert.equal(text.headers.get("Cache-Control"), "no-store");
  assert.match(text.headers.get("Content-Type"), /text\/plain/);
  const json = tooManyRequests(0, { json: true });
  assert.equal(json.status, 429);
  assert.equal(json.headers.get("Retry-After"), "1");
  assert.deepEqual(await json.json(), { error: "rate_limited", code: "rate_limited", retryAfter: 1 });
});

test("fetchWithHeaderTimeout: Timeout → timedOut, Fehler → nicht timedOut, Antwort → response", async () => {
  const hang = (url, { signal }) =>
    new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
  const t = await fetchWithHeaderTimeout("http://x", 20, { fetchImpl: hang });
  assert.equal(t.timedOut, true);
  assert.equal(t.response, undefined);

  const down = await fetchWithHeaderTimeout("http://x", 1000, { fetchImpl: async () => { throw new TypeError("fetch failed"); } });
  assert.equal(down.timedOut, false);

  const ok = await fetchWithHeaderTimeout("http://x", 1000, { fetchImpl: async () => new Response("hi") });
  assert.equal(await ok.response.text(), "hi");
});

test("fetchWithHeaderTimeout: Timer endet mit den Headern, der Body darf länger laufen", async () => {
  let seenSignal;
  const slowBody = async (url, { signal }) => {
    seenSignal = signal;
    return new Response("body");
  };
  const { response } = await fetchWithHeaderTimeout("http://x", 10, { fetchImpl: slowBody });
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(seenSignal.aborted, false, "nach der Antwort darf kein Abbruch mehr kommen");
  assert.equal(await response.text(), "body");
});

test("Routen sind verdrahtet: /cmx 8 s + Limit nach Pfadprüfung, shop-search Limit nach Kurz-Eingabe", () => {
  const cmx = fs.readFileSync(new URL("../../src/app/cmx/[...path]/route.js", import.meta.url), "utf8");
  assert.match(cmx, /const TIMEOUT_MS = 8000;/);
  assert.match(cmx, /getRouteLimiter\("cmx"\)\.check\(req\.headers\)/);
  assert.match(cmx, /status: 504/);
  assert.ok(cmx.indexOf('getRouteLimiter("cmx")') > cmx.indexOf("if (!contentType) return notFound();"), "404 vor dem Limit");
  assert.doesNotMatch(cmx, /AbortSignal\.timeout/);

  const search = fs.readFileSync(new URL("../../src/app/api/shop-search/route.js", import.meta.url), "utf8");
  assert.match(search, /getRouteLimiter\("search"\)\.check\(request\.headers\)/);
  assert.match(search, /tooManyRequests\(limit\.retryAfter, \{ json: true \}\)/);
  assert.ok(search.indexOf('getRouteLimiter("search")') > search.indexOf("if (q.length < 2)"), "kurze Eingaben vor dem Limit");
});
