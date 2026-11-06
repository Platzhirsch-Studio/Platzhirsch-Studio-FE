// Sitzungs-Store gegen Redis (RI-16, G-25) – dieselbe Schnittstelle wie MemorySessionStore (store.js).
// Eingeschaltet über BACKOFFICE_REDIS_URL; Verbindung über den paketlosen Client redis.js.
//
// Schlüssel (Präfix Standard „ph-bo:“, BACKOFFICE_REDIS_PREFIX):
//   s:<sid>      Sitzung als JSON, Ablauf SESSION_TTL_SECONDS (absolute Frist = Redis-Ablauf)
//   s:<sid>:t    lastSeen (ms) – eigener Schlüssel, damit touch() nie eine gleichzeitige update() überschreibt
//   g:<hash>     Geräte-Cache, Ablauf 12 h
//   <ns>:<rest>  allgemeine Werte (k: Kurzsitzung, v: Vorlieben, c: Commit-Register)
//
// Voraussetzung: Redis ≥ 6.0 (SET … KEEPTTL); GETDEL ab 6.2, davor nimmt wertNehmen ein kurzes Lua-Skript.
// Ausfall: Befehle werfen BackofficeError("unavailable") – Seiten zeigen den Fehlerzustand, niemand gilt still
// als angemeldet (fail-closed). Werte und Schlüssel werden nie geloggt.
// Reines Modul (node:*, keine "@/"-Importe).

import { SESSION_TTL_SECONDS } from "../config.js";
import { BackofficeError } from "../frappe/errors.js";
import { RedisFehler, RedisVerbindung } from "./redis.js";
import { GERAET_CACHE_TTL_SECONDS, pruefePraefix, pruefeWertSchluessel, ttlNormal } from "./store-schluessel.js";
import { AUTH_TEXTE } from "./texte.js";

const NEHMEN_LUA = "local v = redis.call('GET', KEYS[1]) if v then redis.call('DEL', KEYS[1]) end return v";

function json(text) {
  if (text === null || text === undefined) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export class RedisSessionStore {
  /**
   * @param {string|RedisVerbindung} verbindung URL oder fertige Verbindung (Tests)
   * @param {{prefix?:string, timeoutMs?:number, jetzt?:()=>number}} [opts]
   */
  constructor(verbindung, { prefix = "ph-bo:", timeoutMs = 2000, jetzt = () => Date.now() } = {}) {
    this.art = "redis";
    this.r = typeof verbindung === "string" ? new RedisVerbindung(verbindung, { timeoutMs }) : verbindung;
    this.prefix = String(prefix || "");
    this.jetzt = jetzt;
  }

  async befehl(...args) {
    try {
      return await this.r.befehl(...args);
    } catch (err) {
      if (err instanceof RedisFehler && err.antwort) throw err; // Redis hat geantwortet – Aufrufer entscheidet
      throw new BackofficeError("unavailable", AUTH_TEXTE.storeNichtErreichbar, { cause: err, detail: { store: "redis", grund: err?.code || "fehler" } });
    }
  }

  sk(sid) {
    return `${this.prefix}s:${String(sid)}`;
  }

  // ------------------------------------------------------------ Sitzungen --

  async set(sid, daten) {
    const now = this.jetzt();
    const eintrag = { ...daten, createdAt: daten.createdAt || now };
    delete eintrag.lastSeen;
    const rest = Math.max(1, Math.ceil(SESSION_TTL_SECONDS - (now - eintrag.createdAt) / 1000));
    await Promise.all([this.befehl("SET", this.sk(sid), JSON.stringify(eintrag), "EX", rest), this.befehl("SET", `${this.sk(sid)}:t`, String(now), "EX", rest)]);
  }

  async get(sid) {
    const [roh, t] = await this.befehl("MGET", this.sk(sid), `${this.sk(sid)}:t`);
    const e = json(roh);
    if (!e) return null;
    e.lastSeen = Number(t) || e.createdAt || 0;
    return e;
  }

  async touch(sid, now = this.jetzt()) {
    // XX: nur, wenn die Sitzung noch einen Zeitstempel hat (gelöschte Sitzungen nicht wiederbeleben).
    await this.befehl("SET", `${this.sk(sid)}:t`, String(now), "XX", "KEEPTTL");
  }

  async delete(sid) {
    await this.befehl("DEL", this.sk(sid), `${this.sk(sid)}:t`);
  }

  async update(sid, patch) {
    const roh = await this.befehl("GET", this.sk(sid));
    const e = json(roh);
    if (!e) return;
    const neu = { ...e, ...patch };
    delete neu.lastSeen;
    await this.befehl("SET", this.sk(sid), JSON.stringify(neu), "XX", "KEEPTTL");
  }

  // ----------------------------------------------------------- Geräte-Cache --

  gk(hash) {
    return `${this.prefix}g:${String(hash)}`;
  }

  async geraetSetzen(hash, geraet) {
    await this.befehl("SET", this.gk(hash), JSON.stringify({ ...geraet, geprueft: geraet.geprueft || this.jetzt() }), "EX", GERAET_CACHE_TTL_SECONDS);
  }

  async geraetLesen(hash) {
    return json(await this.befehl("GET", this.gk(hash)));
  }

  async geraetLoeschen(hash) {
    await this.befehl("DEL", this.gk(hash));
  }

  async geraeteListe() {
    const schluessel = await this.scan(`${this.prefix}g:`, 1000);
    if (!schluessel.length) return [];
    const werte = await this.befehl("MGET", ...schluessel);
    const aus = [];
    schluessel.forEach((k, i) => {
      const g = json(werte[i]);
      const hash = k.slice(`${this.prefix}g:`.length);
      if (g) aus.push({ ...g, tokenHash: `${hash.slice(0, 8)}…` });
    });
    return aus;
  }

  // ------------------------------------------------------ Allgemeine Werte --

  wk(k) {
    return `${this.prefix}${pruefeWertSchluessel(k)}`;
  }

  async wertSetzen(k, wert, { ttlSekunden = 0 } = {}) {
    const ttl = ttlNormal(ttlSekunden);
    const args = ["SET", this.wk(k), JSON.stringify(wert ?? null)];
    if (ttl) args.push("EX", ttl);
    await this.befehl(...args);
  }

  async wertSetzenWennFrei(k, wert, { ttlSekunden = 0 } = {}) {
    const ttl = ttlNormal(ttlSekunden);
    const args = ["SET", this.wk(k), JSON.stringify(wert ?? null), "NX"];
    if (ttl) args.push("EX", ttl);
    return (await this.befehl(...args)) === "OK";
  }

  async wertLesen(k) {
    return json(await this.befehl("GET", this.wk(k)));
  }

  async wertNehmen(k) {
    const key = this.wk(k);
    try {
      return json(await this.befehl("GETDEL", key));
    } catch (err) {
      if (!(err instanceof RedisFehler && /unknown command/i.test(err.message))) throw err;
      // Redis < 6.2: GET + DEL atomar als Lua-Skript (eine Antwort, kein Zwischenzustand auf der Verbindung)
      return json(await this.befehl("EVAL", NEHMEN_LUA, 1, key));
    }
  }

  async wertLoeschen(k) {
    await this.befehl("DEL", this.wk(k));
  }

  async schluesselListe(praefix, { max = 1000 } = {}) {
    pruefePraefix(praefix);
    const voll = await this.scan(`${this.prefix}${praefix}`, max);
    return voll.map((k) => k.slice(this.prefix.length));
  }

  /** SCAN über einen Schlüsselanfang (ohne Glob-Sonderzeichen, die pruefePraefix ohnehin ausschließt). */
  async scan(anfang, max) {
    const muster = `${anfang.replace(/[*?[\]\\]/g, (z) => `\\${z}`)}*`;
    const aus = new Set();
    let cursor = "0";
    let runden = 0;
    do {
      const [weiter, liste] = await this.befehl("SCAN", cursor, "MATCH", muster, "COUNT", 200);
      for (const k of liste || []) {
        aus.add(k);
        if (aus.size >= max) return [...aus];
      }
      cursor = String(weiter);
      runden += 1;
    } while (cursor !== "0" && runden < 10_000);
    return [...aus];
  }

  // ---------------------------------------------------------------- Betrieb --

  async gesundheit() {
    const start = this.jetzt();
    try {
      const antwort = await this.befehl("PING");
      return { ok: antwort === "PONG", art: this.art, ms: this.jetzt() - start };
    } catch (err) {
      return { ok: false, art: this.art, fehler: err?.detail?.grund || err?.code || "fehler" };
    }
  }

  async schliessen() {
    await this.r.schliessen?.();
  }
}
