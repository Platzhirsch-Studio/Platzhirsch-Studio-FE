// tests/unit/labs-concierge-limiter.test.mjs — R2-labs-service (A4): Rate-Limit
// und Tagesbudget hinter der Speicher-Schnittstelle.
// Run: node --test tests/unit/labs-concierge-limiter.test.mjs
// Kein Netz, kein Redis, kein Claude: der geteilte Speicher ist eine Attrappe,
// die Redis-Befehle im Arbeitsspeicher nachbildet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore, createSharedStore } from "../../src/lib/concierge/limitStore.js";
import { createLimiter, utcDay } from "../../src/lib/concierge/limiter.js";

const NOW = Date.parse("2026-10-26T10:00:00Z");
const BURST = { max: 3, windowMs: 60_000 };
const DAILY = { max: 5, windowMs: 24 * 60 * 60 * 1000 };

// Minimaler Redis-Ersatz für die vom Adapter genutzten Befehle.
function fakeRedis() {
  const zsets = new Map();
  const strings = new Map();
  const log = [];
  const exec = async (args) => {
    log.push(args[0]);
    const [cmd, key, a, b] = args;
    const z = () => zsets.get(key) || zsets.set(key, new Map()).get(key);
    const num = (v) => (v === "-inf" ? -Infinity : v === "+inf" ? Infinity : Number(v));
    switch (cmd) {
      case "ZADD":
        z().set(b, Number(a));
        return 1;
      case "ZREMRANGEBYSCORE": {
        let n = 0;
        for (const [m, s] of z()) if (s >= num(a) && s <= num(b)) (z().delete(m), n++);
        return n;
      }
      case "ZRANGEBYSCORE": {
        const out = [];
        for (const [m, s] of [...z()].sort((x, y) => x[1] - y[1])) if (s >= num(a) && s <= num(b)) out.push(m, String(s));
        return out;
      }
      case "PEXPIRE":
        return 1;
      case "GET":
        return strings.has(key) ? String(strings.get(key)) : null;
      case "INCR":
        strings.set(key, (strings.get(key) || 0) + 1);
        return strings.get(key);
      default:
        throw new Error(`unbekannter Befehl ${cmd}`);
    }
  };
  return { exec, log, zsets, strings };
}

for (const [label, make] of [
  ["Arbeitsspeicher", () => createMemoryStore()],
  ["geteilter Speicher (Attrappe)", () => createSharedStore(fakeRedis().exec)],
]) {
  test(`${label}: Burst-Fenster sperrt und gibt nach Ablauf wieder frei`, async () => {
    const lim = createLimiter({ store: make(), globalPerDay: 100 });
    const checks = [{ key: "ip:1", rules: [BURST, DAILY] }];
    for (let i = 0; i < 3; i++) assert.equal((await lim.take(checks, { now: NOW + i })).ok, true);
    const blocked = await lim.take(checks, { now: NOW + 10 });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.reason, "rate");
    assert.equal(blocked.retryAfter, 60);
    assert.equal((await lim.take(checks, { now: NOW + 60_001 })).ok, true, "nach 60 s frei");
  });

  test(`${label}: Tageslimit über mehrere Burst-Fenster`, async () => {
    const lim = createLimiter({ store: make(), globalPerDay: 100 });
    const checks = [{ key: "ip:2", rules: [BURST, DAILY] }];
    for (let i = 0; i < 5; i++) assert.equal((await lim.take(checks, { now: NOW + i * 120_000 })).ok, true);
    const r = await lim.take(checks, { now: NOW + 5 * 120_000 });
    assert.equal(r.ok, false);
    assert.ok(r.retryAfter > 60 * 60, "Sperre bis das älteste Ereignis aus dem Tag fällt");
  });

  test(`${label}: nichts wird gezählt, wenn eine Prüfung scheitert`, async () => {
    const store = make();
    const lim = createLimiter({ store, globalPerDay: 100 });
    const sid = { key: "sid:x", rules: [{ max: 1, windowMs: 60_000 }], reason: "session" };
    assert.equal((await lim.take([sid], { now: NOW })).ok, true);
    const ip = { key: "ip:3", rules: [BURST] };
    const r = await lim.take([ip, sid], { now: NOW + 1, global: true });
    assert.equal(r.reason, "session");
    assert.deepEqual(await store.hits("ip:3", NOW + 2, 60_000), [], "IP-Treffer nicht gezählt");
    assert.equal(await store.dayCount(utcDay(NOW)), 0, "Budget nicht verbraucht");
  });

  test(`${label}: globales Tagesbudget, Reset um Mitternacht UTC`, async () => {
    const lim = createLimiter({ store: make(), globalPerDay: 2 });
    let n = 0;
    const one = () => [{ key: `ip:g${n++}`, rules: [BURST] }];
    assert.equal((await lim.take(one(), { global: true, now: NOW })).ok, true);
    assert.equal((await lim.take(one(), { global: true, now: NOW })).ok, true);
    const r = await lim.take(one(), { global: true, now: NOW });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "budget");
    assert.equal(r.retryAfter, 14 * 60 * 60, "bis 00:00 UTC");
    const next = Date.parse("2026-10-27T00:00:01Z");
    assert.equal((await lim.take(one(), { global: true, now: next })).ok, true);
  });
}

test("geteilter Speicher: zwei Instanzen teilen Limits und Budget", async () => {
  const redis = fakeRedis();
  const a = createLimiter({ store: createSharedStore(redis.exec), globalPerDay: 3 });
  const b = createLimiter({ store: createSharedStore(redis.exec), globalPerDay: 3 });
  const checks = [{ key: "ip:shared", rules: [BURST] }];
  assert.equal((await a.take(checks, { now: NOW, global: true })).ok, true);
  assert.equal((await b.take(checks, { now: NOW + 1, global: true })).ok, true);
  assert.equal((await a.take(checks, { now: NOW + 2, global: true })).ok, true);
  const r = await b.take(checks, { now: NOW + 3 });
  assert.equal(r.ok, false, "Instanz B sieht die Treffer von A");
  const g = await b.take([{ key: "ip:other", rules: [BURST] }], { now: NOW + 4, global: true });
  assert.equal(g.reason, "budget", "Budget gilt instanzübergreifend");
  assert.ok(redis.log.includes("ZADD") && redis.log.includes("INCR"));
});

test("Speicherausfall: Limiter rechnet mit Arbeitsspeicher weiter und meldet den Fehler", async () => {
  const errors = [];
  const broken = createSharedStore(async () => {
    throw new Error("ECONNREFUSED");
  });
  const lim = createLimiter({ store: broken, globalPerDay: 100, onStoreError: (e) => errors.push(e.message) });
  const checks = [{ key: "ip:down", rules: [BURST] }];
  for (let i = 0; i < 3; i++) assert.equal((await lim.take(checks, { now: NOW + i })).ok, true);
  assert.equal((await lim.take(checks, { now: NOW + 5 })).ok, false, "Limit greift weiter");
  assert.ok(errors.length >= 1);
  assert.equal(lim.storeName, "shared");
});

test("setStore schaltet zur Laufzeit um; createSharedStore verlangt exec", async () => {
  const lim = createLimiter({ globalPerDay: 10 });
  assert.equal(lim.storeName, "memory");
  lim.setStore(createSharedStore(fakeRedis().exec));
  assert.equal(lim.storeName, "shared");
  lim.setStore(null);
  assert.equal(lim.storeName, "memory");
  assert.throws(() => createSharedStore());
});

test("Arbeitsspeicher begrenzt die Zahl der Schlüssel (LRU)", async () => {
  const store = createMemoryStore({ maxKeys: 10 });
  for (let i = 0; i < 25; i++) await store.addHit(`k${i}`, NOW, 60_000);
  assert.ok(store.size() <= 10);
  assert.deepEqual(await store.hits("k24", NOW, 60_000), [NOW], "jüngster Schlüssel bleibt");
});
