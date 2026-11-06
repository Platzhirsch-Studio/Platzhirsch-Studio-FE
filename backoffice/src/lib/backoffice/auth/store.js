// Serverseitiger Sitzungs- und Gerätespeicher (G-25, RI-16). Hier liegen die Frappe-sid (nie im
// Browser-Cookie), die letzte Aktivität (Idle-Timeout), der Geräte-Cache und – über die allgemeinen
// Werte-Methoden – Kurzsitzungen (kurzsitzung.js), Benutzer-Vorlieben (vorlieben.js) und das
// Commit-Register (G-03, lib/backoffice/commit/).
//
// Zwei Umsetzungen mit derselben Schnittstelle (SessionStore, unten als typedef):
//   MemorySessionStore  – Entwicklung/Mock: Map auf globalThis (überlebt Turbopack-Neuladen, nicht den Prozess)
//   RedisSessionStore   – Produktion: store-redis.js, eingeschaltet über BACKOFFICE_REDIS_URL
// sessionStore() wählt beim ersten Aufruf: BACKOFFICE_REDIS_URL gesetzt → Redis, sonst Speicher
// (in Produktion mit einer Warnung im Server-Log – ein Prozessneustart meldet dann alle ab).
//
// Schlüsselräume der Werte-Methoden (Präfix davor setzt der Store selbst):
//   k:<hash>   Kurzsitzung (kurzsitzung.js)      v:<user-hash>  Vorlieben (vorlieben.js)
//   c:<token>  Commit-Register (P0-3)            eigene Präfixe nur nach Absprache mit P0-8
// Reines Modul.

import { SESSION_IDLE_SECONDS, SESSION_TTL_SECONDS } from "../config.js";
import { GERAET_CACHE_TTL_SECONDS, pruefePraefix, pruefeWertSchluessel, ttlNormal } from "./store-schluessel.js";
import { RedisSessionStore } from "./store-redis.js";

export { GERAET_CACHE_TTL_SECONDS, pruefePraefix, pruefeWertSchluessel, ttlNormal };

/** Idle-Timeout an Kiosk-Arbeitsplätzen (Kassa/Packtisch, Entscheidung Nr. 49). */
export const KIOSK_IDLE_SECONDS = 15 * 60;

/** Env-Namen des Stores – nur Namen, nie Werte (auch in Logs und Doku). */
export const STORE_ENV = {
  /** redis://[benutzer:passwort@]host[:port][/db] oder rediss://… (TLS). Ohne Angabe: Speicher im Prozess. */
  REDIS_URL: "BACKOFFICE_REDIS_URL",
  /** Schlüssel-Präfix, Standard „ph-bo:“ – trennt Backoffice von anderen Nutzern derselben Redis-Datenbank. */
  REDIS_PREFIX: "BACKOFFICE_REDIS_PREFIX",
};

/**
 * Schnittstelle, die jede Store-Umsetzung erfüllt (alle Methoden async).
 *
 * Sitzungen (sid = UUID aus dem signierten Cookie):
 *   set(sid, daten)            neu anlegen; setzt createdAt (falls fehlt) und lastSeen; Ablauf SESSION_TTL_SECONDS
 *   get(sid)                   → Eintrag | null
 *   touch(sid, now?)           lastSeen setzen (Idle-Timeout)
 *   update(sid, patch)         Felder ergänzen, Ablauf bleibt
 *   delete(sid)
 * Geräte-Cache (Schlüssel = SHA-256 des Geräte-Tokens, nie der Klartext):
 *   geraetSetzen(hash, g) · geraetLesen(hash) · geraetLoeschen(hash) · geraeteListe()
 * Allgemeine Werte (JSON-fähig; für Kurzsitzung, Vorlieben, Commit-Register):
 *   wertSetzen(k, wert, {ttlSekunden})        überschreibt; ttl 0 = ohne Ablauf
 *   wertSetzenWennFrei(k, wert, {ttlSekunden}) → true nur, wenn k noch nicht existierte (Sperre, „genau einmal“)
 *   wertLesen(k)                               → wert | null
 *   wertNehmen(k)                              → wert | null, löscht dabei atomar (Einmal-Token)
 *   wertLoeschen(k)
 *   schluesselListe(praefix, {max})            → Schlüssel mit diesem Anfang (Nachlauf des Commit-Registers)
 * Betrieb:
 *   art                                        "speicher" | "redis"
 *   gesundheit()                               → {ok, art, ms?, fehler?}
 *
 * @typedef {object} SessionStore
 */

export class MemorySessionStore {
  constructor({ jetzt = () => Date.now() } = {}) {
    this.art = "speicher";
    this.jetzt = jetzt;
    this.sessions = new Map();
    this.geraete = new Map();
    /** @type {Map<string, {wert:any, bis:number}>} bis = 0 → ohne Ablauf */
    this.werte = new Map();
  }

  // ------------------------------------------------------------ Sitzungen --

  async set(sid, daten) {
    const now = this.jetzt();
    this.sessions.set(sid, { ...daten, lastSeen: now, createdAt: daten.createdAt || now });
    this.aufraeumen(now);
  }

  async get(sid) {
    const s = this.sessions.get(sid);
    return s ? { ...s } : null; // Kopie wie bei Redis – touch() ändert keinen bereits gelesenen Eintrag
  }

  async touch(sid, now = this.jetzt()) {
    const s = this.sessions.get(sid);
    if (s) s.lastSeen = now;
  }

  async delete(sid) {
    this.sessions.delete(sid);
  }

  async update(sid, patch) {
    const s = this.sessions.get(sid);
    if (s) Object.assign(s, patch);
  }

  aufraeumen(now = this.jetzt()) {
    if (this.sessions.size >= 2000) {
      for (const [k, v] of this.sessions) if (now - v.createdAt > SESSION_TTL_SECONDS * 1000) this.sessions.delete(k);
    }
    if (this.werte.size >= 2000) {
      for (const [k, v] of this.werte) if (v.bis && v.bis <= now) this.werte.delete(k);
    }
  }

  // Geräte-Cache (PH Geraet aus ph_core, siehe auth/geraet.js). Schlüssel ist NUR der SHA-256 des
  // Geräte-Tokens – der Klartext liegt ausschließlich im HttpOnly-Cookie des Geräts.
  async geraetSetzen(hash, geraet) {
    this.geraete.set(hash, { ...geraet, geprueft: geraet.geprueft || this.jetzt() });
  }

  async geraetLesen(hash) {
    return this.geraete.get(hash) || null;
  }

  async geraetLoeschen(hash) {
    this.geraete.delete(hash);
  }

  async geraeteListe() {
    return [...this.geraete.entries()].map(([hash, g]) => ({ ...g, tokenHash: `${hash.slice(0, 8)}…` }));
  }

  // ------------------------------------------------------ Allgemeine Werte --

  lebend(k, now = this.jetzt()) {
    const e = this.werte.get(k);
    if (!e) return null;
    if (e.bis && e.bis <= now) {
      this.werte.delete(k);
      return null;
    }
    return e;
  }

  /** Werte als JSON-Kopie ablegen – wie Redis: kein geteiltes Objekt zwischen Aufrufern. */
  kopie(wert) {
    return wert === undefined ? null : JSON.parse(JSON.stringify(wert));
  }

  async wertSetzen(k, wert, { ttlSekunden = 0 } = {}) {
    pruefeWertSchluessel(k);
    const ttl = ttlNormal(ttlSekunden);
    const now = this.jetzt();
    this.werte.set(k, { wert: this.kopie(wert), bis: ttl ? now + ttl * 1000 : 0 });
    this.aufraeumen(now);
  }

  async wertSetzenWennFrei(k, wert, opts = {}) {
    pruefeWertSchluessel(k);
    if (this.lebend(k)) return false;
    await this.wertSetzen(k, wert, opts);
    return true;
  }

  async wertLesen(k) {
    pruefeWertSchluessel(k);
    const e = this.lebend(k);
    return e ? this.kopie(e.wert) : null;
  }

  async wertNehmen(k) {
    pruefeWertSchluessel(k);
    const e = this.lebend(k);
    if (!e) return null;
    this.werte.delete(k);
    return e.wert;
  }

  async wertLoeschen(k) {
    pruefeWertSchluessel(k);
    this.werte.delete(k);
  }

  async schluesselListe(praefix, { max = 1000 } = {}) {
    pruefePraefix(praefix);
    const now = this.jetzt();
    const aus = [];
    for (const k of [...this.werte.keys()]) {
      if (!k.startsWith(praefix) || !this.lebend(k, now)) continue;
      aus.push(k);
      if (aus.length >= max) break;
    }
    return aus;
  }

  async gesundheit() {
    return { ok: true, art: this.art };
  }
}

const G = globalThis;
let gewarnt = false;

/**
 * Store-Umsetzung für diese Umgebung (ohne globalen Zustand; Tests).
 * @param {{env?:Record<string,string|undefined>, production?:boolean, redisStore?:(url:string, prefix:string)=>SessionStore}} [opts]
 */
export function erzeugeStore({ env = process.env, production = env.NODE_ENV === "production", redisStore = (url, prefix) => new RedisSessionStore(url, { prefix }) } = {}) {
  const url = String(env[STORE_ENV.REDIS_URL] || "").trim();
  if (url) return redisStore(url, String(env[STORE_ENV.REDIS_PREFIX] || "ph-bo:"));
  if (production && !gewarnt) {
    gewarnt = true;
    console.warn(`[backoffice] Sitzungen liegen im Prozessspeicher – ${STORE_ENV.REDIS_URL} fehlt. Ein Neustart meldet alle ab.`);
  }
  return new MemorySessionStore();
}

/**
 * Der Store dieses Prozesses. Mit BACKOFFICE_REDIS_URL → RedisSessionStore (Verbindung erst beim ersten
 * Befehl), sonst MemorySessionStore. Ein über setSessionStore() eingehängter Store hat Vorrang.
 * @returns {SessionStore & MemorySessionStore}
 */
export function sessionStore() {
  if (!G.__phBoSessionStore) G.__phBoSessionStore = erzeugeStore();
  return G.__phBoSessionStore;
}

/** Eigene Umsetzung einhängen (Tests, besondere Betriebsformen). null setzt auf die Automatik zurück. */
export function setSessionStore(store) {
  G.__phBoSessionStore = store || undefined;
}

/** Art des aktiven Stores ("speicher" | "redis") – für die Systemseite (nur Admin). */
export function storeArt() {
  return sessionStore().art || "eigen";
}

/**
 * Gültigkeit anhand des Stores: vorhanden, absolute Frist, Idle-Frist.
 * @returns {"ok"|"fehlt"|"abgelaufen"|"inaktiv"}
 */
export function pruefeStoreEintrag(eintrag, { now = Date.now(), kiosk = false } = {}) {
  if (!eintrag) return "fehlt";
  if (now - eintrag.createdAt > SESSION_TTL_SECONDS * 1000) return "abgelaufen";
  const idle = (eintrag.idleSeconds || (kiosk ? KIOSK_IDLE_SECONDS : SESSION_IDLE_SECONDS)) * 1000;
  if (now - eintrag.lastSeen > idle) return "inaktiv";
  return "ok";
}
