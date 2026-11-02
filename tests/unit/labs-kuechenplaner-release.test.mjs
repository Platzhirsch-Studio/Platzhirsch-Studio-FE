// tests/unit/labs-kuechenplaner-release.test.mjs — R2-Fix (QM-Feedback P2-1 bis P2-3):
// Preise nur mit freigegebener Tabelle, Senden nur nach Freigabe, Rate-Limit über Redis.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PRICE_TABLE } from "../../src/components/Labs/Kuechenplaner/catalog.js";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { priceRange } from "../../src/components/Labs/Kuechenplaner/pricing.js";
import { pricesPublic, sendReleased } from "../../src/components/Labs/Kuechenplaner/release.js";
import {
  clientKey,
  createPlanerLimiter,
  hashKey,
  liveBlocker,
  redisConfig,
} from "../../src/components/Labs/Kuechenplaner/server/rateLimit.js";
import { PRICE_CONFIG, pricesPublic as sofaPricesPublic } from "../../src/components/Labs/Sofaplaner/model.js";

const silent = { warn() {} };
const headers = (o) => new Headers(o);

test("P2-1: Beispieltabellen beider Planer sind nicht öffentlich", () => {
  assert.equal(PRICE_TABLE.placeholder, true);
  assert.equal(pricesPublic(PRICE_TABLE), false);
  assert.equal(PRICE_CONFIG.placeholder, true);
  assert.equal(sofaPricesPublic(), false);
});

test("P2-1: nur placeholder === false gibt Zahlen frei", () => {
  assert.equal(pricesPublic(undefined), false);
  assert.equal(pricesPublic({}), false);
  assert.equal(pricesPublic({ placeholder: "false" }), false);
  assert.equal(pricesPublic({ placeholder: false }), true);
  assert.equal(sofaPricesPublic({ placeholder: false }), true);
});

test("P2-1: priceRange liefert visible=false und keinen Klammertext als Label", () => {
  const p = priceRange(defaultPlan("l"), PRICE_TABLE);
  assert.equal(p.visible, false);
  assert.doesNotMatch(p.label, /\[|Beispiel/);
  const released = priceRange(defaultPlan("l"), { ...PRICE_TABLE, placeholder: false });
  assert.equal(released.visible, true);
  assert.equal(released.note, "");
  assert.ok(released.max > released.min && released.min > 0);
});

test("P2-2: Senden nur mit NEXT_PUBLIC_LABS_PLANER_SENDEN=1", () => {
  assert.equal(sendReleased(undefined), false);
  assert.equal(sendReleased("true"), false);
  assert.equal(sendReleased("1"), true);
});

test("P2-2/P2-3: liveBlocker sperrt Produktion ohne Freigabe oder ohne Redis", () => {
  assert.equal(liveBlocker({ NODE_ENV: "development" }), null);
  assert.match(liveBlocker({ NODE_ENV: "production" }), /Testphase/);
  assert.match(liveBlocker({ NODE_ENV: "production", NEXT_PUBLIC_LABS_PLANER_SENDEN: "1" }), /Livebetrieb/);
  assert.equal(
    liveBlocker({
      NODE_ENV: "production",
      NEXT_PUBLIC_LABS_PLANER_SENDEN: "1",
      LABS_REDIS_REST_URL: "https://eu1-example.upstash.io",
      LABS_REDIS_REST_TOKEN: "t",
    }),
    null,
  );
});

test("P2-3: redisConfig verlangt https (außer localhost) und beide Werte", () => {
  assert.equal(redisConfig({}), null);
  assert.equal(redisConfig({ LABS_REDIS_REST_URL: "https://x.example" }), null);
  assert.equal(redisConfig({ LABS_REDIS_REST_URL: "http://x.example", LABS_REDIS_REST_TOKEN: "t" }), null);
  assert.deepEqual(redisConfig({ LABS_REDIS_REST_URL: "http://localhost:8079/", LABS_REDIS_REST_TOKEN: "t" }), {
    url: "http://localhost:8079",
    token: "t",
  });
  assert.equal(redisConfig({ UPSTASH_REDIS_REST_URL: "https://u.example", UPSTASH_REDIS_REST_TOKEN: "u" }).token, "u");
});

test("P2-3: Arbeitsspeicher drosselt nach max Treffern im Fenster", async () => {
  const l = createPlanerLimiter({ name: "t1", max: 2, windowMs: 1000, env: {}, log: silent });
  assert.equal(l.backend(), "memory");
  assert.equal(await l.limited("a", 0), false);
  assert.equal(await l.limited("a", 10), false);
  assert.equal(await l.limited("a", 20), true);
  assert.equal(await l.limited("b", 20), false);
  assert.equal(await l.limited("a", 1500), false); // Fenster abgelaufen
});

test("P2-3: Redis-Pipeline mit gehashtem Schlüssel, SET NX PX + INCR", async () => {
  const calls = [];
  let n = 0;
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    n++;
    return { ok: true, json: async () => [{ result: n === 1 ? "OK" : null }, { result: n }] };
  };
  const env = { LABS_REDIS_REST_URL: "https://r.example", LABS_REDIS_REST_TOKEN: "tok" };
  const l = createPlanerLimiter({ name: "t2", max: 2, windowMs: 600_000, env, fetchImpl, log: silent });
  assert.equal(l.backend(), "redis");
  assert.equal(await l.limited("203.0.113.7"), false);
  assert.equal(await l.limited("203.0.113.7"), false);
  assert.equal(await l.limited("203.0.113.7"), true);
  assert.equal(calls[0].url, "https://r.example/pipeline");
  assert.equal(calls[0].init.headers.Authorization, "Bearer tok");
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body[0].slice(2), ["0", "PX", "600000", "NX"]);
  assert.equal(body[1][0], "INCR");
  assert.equal(body[0][1], `labs:rl:t2:${hashKey("203.0.113.7")}`);
  assert.doesNotMatch(calls[0].init.body, /203\.0\.113\.7/); // keine Klartext-IP in Redis
});

test("P2-3: Redis-Ausfall → Arbeitsspeicher als Ersatz, einmal geloggt", async () => {
  const logs = [];
  const l = createPlanerLimiter({
    name: "t3",
    max: 1,
    windowMs: 1000,
    env: { LABS_REDIS_REST_URL: "https://r.example", LABS_REDIS_REST_TOKEN: "tok" },
    fetchImpl: async () => {
      throw new Error("down");
    },
    log: { warn: (m) => logs.push(m) },
  });
  assert.equal(await l.limited("x", 0), false);
  assert.equal(await l.limited("x", 1), true);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /Redis nicht erreichbar/);
});

test("Client-Adresse: vertrauenswürdiger Header, sonst letzter X-Forwarded-For-Eintrag", () => {
  assert.equal(clientKey(headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.2" }), {}), "10.0.0.2");
  assert.equal(clientKey(headers({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.1.1.1" }), { LABS_IP_HEADER: "x-real-ip" }), "9.9.9.9");
  assert.equal(clientKey(headers({ "x-real-ip": "8.8.8.8" }), { KUECHENPLANER_IP_HEADER: "x-real-ip" }), "8.8.8.8");
  assert.equal(clientKey(headers({}), {}), "local");
});
