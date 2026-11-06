// Sitzungs-Store (P0-8, RI-16): dieselben Vertragstests gegen MemorySessionStore und RedisSessionStore.
// Redis läuft hier als kleiner RESP-Testserver über node:net (keine Pakete, kein echter Redis nötig).
//   node --test tests/unit/backoffice-auth-store.test.mjs
import { test, after } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { MemorySessionStore, STORE_ENV, erzeugeStore, pruefeStoreEintrag, pruefeWertSchluessel, setSessionStore, sessionStore, storeArt } from "../../src/lib/backoffice/auth/store.js";
import { RedisSessionStore } from "../../src/lib/backoffice/auth/store-redis.js";
import { RedisFehler, RedisVerbindung, kodiere, lies, parseRedisUrl } from "../../src/lib/backoffice/auth/redis.js";
import { SESSION_TTL_SECONDS } from "../../src/lib/backoffice/config.js";

// ------------------------------------------------------------ RESP-Testserver --

function resp(w) {
  if (w === null || w === undefined) return "$-1\r\n";
  if (w instanceof Error) return `-${w.message}\r\n`;
  if (typeof w === "number") return `:${w}\r\n`;
  if (Array.isArray(w)) return `*${w.length}\r\n${w.map(resp).join("")}`;
  if (typeof w === "object" && w.status) return `+${w.status}\r\n`;
  const b = Buffer.from(String(w), "utf8");
  return `$${b.length}\r\n${b.toString("utf8")}\r\n`;
}

/** Mini-Redis: SET (EX/PX/NX/XX/KEEPTTL), GET, MGET, DEL, GETDEL (abschaltbar), EVAL (nur Nehmen-Skript), SCAN, PING, AUTH, SELECT, QUIT. */
function starteTestRedis({ passwort = "", ohneGetdel = false, jetzt = () => Date.now() } = {}) {
  const daten = new Map(); // k → { v, bis }
  const log = [];
  const lebt = (k) => {
    const e = daten.get(k);
    if (e && e.bis && e.bis <= jetzt()) daten.delete(k);
    return daten.get(k) || null;
  };
  const OK = { status: "OK" };
  function ausfuehren(args, sitz) {
    const [cmdRoh, ...a] = args;
    const cmd = cmdRoh.toUpperCase();
    log.push(cmd);
    if (cmd === "AUTH") {
      if (a[a.length - 1] === passwort) {
        sitz.auth = true;
        return OK;
      }
      return new Error("WRONGPASS invalid password");
    }
    if (passwort && !sitz.auth) return new Error("NOAUTH Authentication required.");
    switch (cmd) {
      case "PING":
        return { status: "PONG" };
      case "SELECT":
        sitz.db = Number(a[0]);
        return OK;
      case "QUIT":
        return OK;
      case "SET": {
        const [k, v, ...opt] = a;
        const o = opt.map((x) => String(x).toUpperCase());
        const alt = lebt(k);
        if (o.includes("NX") && alt) return null;
        if (o.includes("XX") && !alt) return null;
        let bis = 0;
        const ex = o.indexOf("EX");
        const px = o.indexOf("PX");
        if (ex >= 0) bis = jetzt() + Number(opt[ex + 1]) * 1000;
        else if (px >= 0) bis = jetzt() + Number(opt[px + 1]);
        else if (o.includes("KEEPTTL") && alt) bis = alt.bis;
        daten.set(k, { v, bis });
        return OK;
      }
      case "GET":
        return lebt(a[0])?.v ?? null;
      case "MGET":
        return a.map((k) => lebt(k)?.v ?? null);
      case "DEL": {
        let n = 0;
        for (const k of a) if (lebt(k) && daten.delete(k)) n++;
        return n;
      }
      case "GETDEL": {
        if (ohneGetdel) return new Error("ERR unknown command 'GETDEL'");
        const e = lebt(a[0]);
        daten.delete(a[0]);
        return e?.v ?? null;
      }
      case "EVAL": {
        const e = lebt(a[2]);
        daten.delete(a[2]);
        return e?.v ?? null;
      }
      case "SCAN": {
        const muster = a[a.indexOf("MATCH") + 1] || "*";
        const re = new RegExp(`^${muster.replace(/\\(.)/g, "$1").replace(/[.+^${}()|[\]]/g, "\\$&").replace(/\*$/, ".*")}$`);
        const keys = [...daten.keys()].filter((k) => lebt(k) && re.test(k));
        // zwei Runden, damit die Cursor-Schleife geprüft wird
        const mitte = Math.ceil(keys.length / 2);
        return a[0] === "0" ? [keys.length > 1 ? "7" : "0", keys.slice(0, keys.length > 1 ? mitte : keys.length)] : ["0", keys.slice(mitte)];
      }
      default:
        return new Error(`ERR unknown command '${cmd}'`);
    }
  }
  const server = net.createServer((socket) => {
    const sitz = { auth: false, db: 0 };
    let puffer = Buffer.alloc(0);
    socket.on("data", (d) => {
      puffer = Buffer.concat([puffer, d]);
      let pos = 0;
      for (;;) {
        const r = lies(puffer, pos);
        if (!r) break;
        pos = r.ende;
        socket.write(resp(ausfuehren(r.wert, sitz)));
      }
      puffer = puffer.subarray(pos);
    });
    socket.on("error", () => {});
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port, daten, log })));
}

const offen = [];
after(async () => {
  for (const x of offen) await x();
});

async function redisStore(opts = {}) {
  const t = await starteTestRedis(opts);
  const url = `redis://${opts.passwort ? `:${encodeURIComponent(opts.passwort)}@` : ""}127.0.0.1:${t.port}/3`;
  const store = new RedisSessionStore(url, { prefix: "ph-bo-test:", timeoutMs: 1000, jetzt: opts.jetzt });
  offen.push(async () => {
    await store.schliessen();
    await new Promise((r) => t.server.close(r));
  });
  return { store, ...t };
}

// --------------------------------------------------------------- Vertrag --

async function vertrag(name, neu) {
  test(`${name}: Sitzung anlegen, lesen, touch, update, löschen`, async () => {
    const store = await neu();
    await store.set("sid-1", { user: "a@demo.local", frappeSid: "frappe-geheim" });
    const e = await store.get("sid-1");
    assert.equal(e.user, "a@demo.local");
    assert.equal(e.frappeSid, "frappe-geheim");
    assert.ok(e.createdAt > 0 && e.lastSeen >= e.createdAt);
    assert.equal(pruefeStoreEintrag(e), "ok");
    await store.touch("sid-1", e.lastSeen + 5000);
    assert.equal((await store.get("sid-1")).lastSeen, e.lastSeen + 5000);
    await store.update("sid-1", { loginArt: "microsoft" });
    const u = await store.get("sid-1");
    assert.equal(u.loginArt, "microsoft");
    assert.equal(u.frappeSid, "frappe-geheim");
    assert.equal(u.lastSeen, e.lastSeen + 5000, "update überschreibt lastSeen nicht");
    await store.delete("sid-1");
    assert.equal(await store.get("sid-1"), null);
    await store.touch("sid-1");
    await store.update("sid-1", { x: 1 });
    assert.equal(await store.get("sid-1"), null, "touch/update beleben keine gelöschte Sitzung");
  });

  test(`${name}: Geräte-Cache nur unter dem Hash, Liste gekürzt`, async () => {
    const store = await neu();
    const hash = "a".repeat(64);
    await store.geraetSetzen(hash, { daten: { geraet: "G-1" }, registriertVon: "admin@demo.local" });
    assert.equal((await store.geraetLesen(hash)).daten.geraet, "G-1");
    const liste = await store.geraeteListe();
    assert.equal(liste.length, 1);
    assert.equal(liste[0].tokenHash, "aaaaaaaa…");
    await store.geraetLoeschen(hash);
    assert.equal(await store.geraetLesen(hash), null);
  });

  test(`${name}: Werte setzen, lesen, einmal nehmen, wenn frei, Liste`, async () => {
    const store = await neu();
    await store.wertSetzen("c:tok1", { action: "x", n: 1 }, { ttlSekunden: 60 });
    await store.wertSetzen("c:tok2", { action: "y" });
    await store.wertSetzen("v:abc", { theme: "dunkel" });
    assert.deepEqual(await store.wertLesen("c:tok1"), { action: "x", n: 1 });
    const kopie = await store.wertLesen("c:tok1");
    kopie.n = 99;
    assert.equal((await store.wertLesen("c:tok1")).n, 1, "gelesene Werte sind Kopien");
    assert.deepEqual((await store.schluesselListe("c:")).sort(), ["c:tok1", "c:tok2"]);
    assert.deepEqual(await store.wertNehmen("c:tok1"), { action: "x", n: 1 });
    assert.equal(await store.wertNehmen("c:tok1"), null, "zweites Nehmen leer");
    assert.equal(await store.wertSetzenWennFrei("c:tok2", { anders: true }), false);
    assert.equal(await store.wertSetzenWennFrei("c:tok3", { neu: true }, { ttlSekunden: 5 }), true);
    await store.wertLoeschen("c:tok2");
    assert.equal(await store.wertLesen("c:tok2"), null);
    await assert.rejects(() => store.wertSetzen("ohne-namensraum", 1), TypeError);
    await assert.rejects(() => store.wertLesen("c:mit leerzeichen"), TypeError);
    assert.equal((await store.gesundheit()).ok, true);
  });
}

await vertrag("Speicher", async () => new MemorySessionStore());
await vertrag("Redis", async () => (await redisStore()).store);

test("Speicher: Werte laufen ab", async () => {
  let t = 1_000_000;
  const store = new MemorySessionStore({ jetzt: () => t });
  await store.wertSetzen("k:x", 1, { ttlSekunden: 60 });
  t += 59_000;
  assert.equal(await store.wertLesen("k:x"), 1);
  t += 2000;
  assert.equal(await store.wertLesen("k:x"), null);
  assert.equal(await store.wertNehmen("k:x"), null);
  assert.deepEqual(await store.schluesselListe("k:"), []);
});

test("Redis: Ablauf über EX, Sitzung mit Restlaufzeit der absoluten Frist", async () => {
  let t = 5_000_000;
  const { store, daten } = await redisStore({ jetzt: () => t });
  await store.wertSetzen("k:x", 1, { ttlSekunden: 60 });
  t += 61_000;
  assert.equal(await store.wertLesen("k:x"), null);
  await store.set("sid-2", { user: "a", createdAt: t - 3600_000 });
  const bis = daten.get("ph-bo-test:s:sid-2").bis;
  assert.equal(Math.round((bis - t) / 1000), SESSION_TTL_SECONDS - 3600, "Ablauf = Rest der 10 h");
  assert.ok(daten.has("ph-bo-test:s:sid-2:t"), "lastSeen getrennt gespeichert");
});

test("Redis: AUTH und SELECT aus der URL, Präfix trennt Schlüssel", async () => {
  const { store, daten, log } = await redisStore({ passwort: "geheim:mit/zeichen" });
  await store.wertSetzen("v:abc", { theme: "hell" });
  assert.deepEqual([...daten.keys()], ["ph-bo-test:v:abc"]);
  assert.deepEqual(log.slice(0, 2), ["AUTH", "SELECT"]);
});

test("Redis: falsches Passwort → Fehler, kein stilles Weiterlaufen", async () => {
  const t = await starteTestRedis({ passwort: "richtig" });
  const store = new RedisSessionStore(`redis://:falsch@127.0.0.1:${t.port}`, { timeoutMs: 500 });
  await assert.rejects(() => store.get("x"), (err) => err instanceof RedisFehler || err.code === "unavailable");
  await new Promise((r) => t.server.close(r));
});

test("Redis: wertNehmen ohne GETDEL (Redis < 6.2) über Lua", async () => {
  const { store, log } = await redisStore({ ohneGetdel: true });
  await store.wertSetzen("k:einmal", { a: 1 });
  assert.deepEqual(await store.wertNehmen("k:einmal"), { a: 1 });
  assert.equal(await store.wertNehmen("k:einmal"), null);
  assert.ok(log.includes("EVAL"));
});

test("Redis: nicht erreichbar → BackofficeError unavailable (fail-closed), Gesundheit meldet es", async () => {
  const frei = net.createServer();
  const port = await new Promise((r) => frei.listen(0, "127.0.0.1", () => r(frei.address().port)));
  await new Promise((r) => frei.close(r));
  const store = new RedisSessionStore(`redis://127.0.0.1:${port}`, { timeoutMs: 300 });
  await assert.rejects(() => store.get("sid"), (err) => err.code === "unavailable" && /Sitzungsspeicher/.test(err.message));
  const g = await store.gesundheit();
  assert.equal(g.ok, false);
  assert.equal(g.art, "redis");
});

test("Redis-Client: URL, RESP kodieren/lesen, Teilpuffer", () => {
  assert.deepEqual(parseRedisUrl("rediss://nutzer:p%40ss@host.example:6380/2"), { tls: true, host: "host.example", port: 6380, benutzer: "nutzer", passwort: "p@ss", db: 2 });
  assert.throws(() => parseRedisUrl("http://x"), /redis:\/\//);
  assert.equal(kodiere(["SET", "k", "ü"]).toString("utf8"), "*3\r\n$3\r\nSET\r\n$1\r\nk\r\n$2\r\nü\r\n");
  const voll = Buffer.from("*2\r\n$1\r\na\r\n$-1\r\n");
  assert.deepEqual(lies(voll).wert, ["a", null]);
  assert.equal(lies(voll.subarray(0, 8)), null, "unvollständig → null");
  assert.ok(lies(Buffer.from("-ERR x\r\n")).wert instanceof RedisFehler);
  assert.ok(new RedisVerbindung("redis://127.0.0.1"));
});

test("Auswahl: ohne BACKOFFICE_REDIS_URL Speicher, mit URL Redis; setSessionStore hat Vorrang", () => {
  assert.equal(erzeugeStore({ env: {}, production: false }).art, "speicher");
  const r = erzeugeStore({ env: { [STORE_ENV.REDIS_URL]: "redis://127.0.0.1:6399/1", [STORE_ENV.REDIS_PREFIX]: "x:" }, production: true });
  assert.equal(r.art, "redis");
  assert.equal(r.prefix, "x:");
  assert.throws(() => erzeugeStore({ env: { [STORE_ENV.REDIS_URL]: "kein-url" } }), /gültige URL/);
  const eigen = new MemorySessionStore();
  setSessionStore(eigen);
  assert.equal(sessionStore(), eigen);
  setSessionStore(null);
  assert.notEqual(sessionStore(), eigen);
  assert.equal(storeArt(), "speicher");
  assert.equal(pruefeWertSchluessel("k:abc"), "k:abc");
});
