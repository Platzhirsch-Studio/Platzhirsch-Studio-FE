// Schlanker Redis-Client (RESP2) über node:net / node:tls – ohne Paket (MASTER § 5.2: neue Pakete nur über
// P0-9 nach Freigabe). Kann genau das, was der Sitzungs-Store braucht: einzelne Befehle mit Pipelining
// (Antworten in Sendereihenfolge), AUTH/SELECT aus der URL, Zeitlimit je Befehl, Neuverbindung beim
// nächsten Befehl nach einem Abbruch. Kein Pub/Sub, kein Cluster, kein Sentinel.
//
//   const r = new RedisVerbindung("redis://:passwort@127.0.0.1:6379/2");
//   await r.befehl("SET", "k", "v", "PX", 60000);   // → "OK"
//   await r.befehl("GET", "k");                        // → "v" | null
//
// URL-Formen: redis://[benutzer:passwort@]host[:port][/db] · rediss://… (TLS). Werte nie loggen.
// Reines Modul (nur node:*-Importe), testbar mit einem RESP-Testserver (tests/unit/backoffice-auth-store.test.mjs).

import net from "node:net";
import tls from "node:tls";

export class RedisFehler extends Error {
  constructor(message, { code = "redis", antwort = false } = {}) {
    super(message);
    this.name = "RedisFehler";
    this.code = code;
    /** true = Redis hat mit „-ERR …“ geantwortet (Verbindung ist in Ordnung). */
    this.antwort = antwort;
  }
}

/** Verbindungsdaten aus der URL; wirft bei falschem Schema. */
export function parseRedisUrl(url) {
  let u;
  try {
    u = new URL(String(url || ""));
  } catch {
    throw new RedisFehler("Redis-Adresse ist keine gültige URL.", { code: "konfiguration" });
  }
  if (u.protocol !== "redis:" && u.protocol !== "rediss:") throw new RedisFehler("Redis-Adresse muss mit redis:// oder rediss:// beginnen.", { code: "konfiguration" });
  const db = u.pathname && u.pathname !== "/" ? Number(u.pathname.slice(1)) : 0;
  if (!Number.isInteger(db) || db < 0) throw new RedisFehler("Redis-Datenbanknummer ungültig.", { code: "konfiguration" });
  return {
    tls: u.protocol === "rediss:",
    host: u.hostname || "127.0.0.1",
    port: Number(u.port) || 6379,
    benutzer: u.username ? decodeURIComponent(u.username) : "",
    passwort: u.password ? decodeURIComponent(u.password) : "",
    db,
  };
}

/** Befehl → RESP-Array aus Bulk-Strings. */
export function kodiere(args) {
  const teile = [`*${args.length}\r\n`];
  for (const a of args) {
    const s = Buffer.isBuffer(a) ? a : Buffer.from(String(a), "utf8");
    teile.push(`$${s.length}\r\n`, s, "\r\n");
  }
  return Buffer.concat(teile.map((t) => (Buffer.isBuffer(t) ? t : Buffer.from(t, "utf8"))));
}

/**
 * Eine vollständige RESP2-Antwort ab `start` lesen.
 * @returns {{wert:any, ende:number}|null} null = Puffer noch unvollständig
 */
export function lies(puffer, start = 0) {
  if (start >= puffer.length) return null;
  const zeilenEnde = puffer.indexOf("\r\n", start);
  if (zeilenEnde < 0) return null;
  const art = String.fromCharCode(puffer[start]);
  const zeile = puffer.toString("utf8", start + 1, zeilenEnde);
  const weiter = zeilenEnde + 2;
  switch (art) {
    case "+":
      return { wert: zeile, ende: weiter };
    case "-":
      return { wert: new RedisFehler(zeile, { antwort: true }), ende: weiter };
    case ":":
      return { wert: Number(zeile), ende: weiter };
    case "$": {
      const n = Number(zeile);
      if (n < 0) return { wert: null, ende: weiter };
      if (puffer.length < weiter + n + 2) return null;
      return { wert: puffer.toString("utf8", weiter, weiter + n), ende: weiter + n + 2 };
    }
    case "*": {
      const n = Number(zeile);
      if (n < 0) return { wert: null, ende: weiter };
      const liste = [];
      let pos = weiter;
      for (let i = 0; i < n; i++) {
        const r = lies(puffer, pos);
        if (!r) return null;
        liste.push(r.wert);
        pos = r.ende;
      }
      return { wert: liste, ende: pos };
    }
    default:
      throw new RedisFehler(`Unbekannte RESP-Antwort (${art}).`, { code: "protokoll" });
  }
}

export class RedisVerbindung {
  /**
   * @param {string} url
   * @param {{timeoutMs?:number, verbinde?:(cfg:object)=>import("node:net").Socket}} [opts]
   */
  constructor(url, { timeoutMs = 2000, verbinde } = {}) {
    this.cfg = parseRedisUrl(url);
    this.timeoutMs = timeoutMs;
    this.verbindeImpl = verbinde;
    this.socket = null;
    this.bereit = null;
    this.warteschlange = [];
    this.puffer = Buffer.alloc(0);
  }

  verbinde() {
    if (this.bereit) return this.bereit;
    const { host, port } = this.cfg;
    const socket = this.verbindeImpl ? this.verbindeImpl(this.cfg) : this.cfg.tls ? tls.connect({ host, port, servername: host }) : net.connect({ host, port });
    socket.setNoDelay?.(true);
    this.socket = socket;
    this.puffer = Buffer.alloc(0);
    socket.on("data", (d) => {
      if (this.socket === socket) this.empfange(d);
    });
    // Ereignisse einer alten Verbindung dürfen eine neuere nie abbrechen (Neuverbindung nach Fehler).
    let abgelehnt = null;
    const abbruch = (err) => {
      const fehler = err || new RedisFehler("Redis-Verbindung getrennt.", { code: "verbindung" });
      abgelehnt?.(fehler);
      if (this.socket === socket) this.abbrechen(fehler);
    };
    socket.on("error", abbruch);
    socket.on("close", () => abbruch());
    this.bereit = new Promise((resolve, reject) => {
      abgelehnt = reject;
      const ok = async () => {
        try {
          if (this.cfg.passwort) await this.roh(this.cfg.benutzer ? ["AUTH", this.cfg.benutzer, this.cfg.passwort] : ["AUTH", this.cfg.passwort]);
          if (this.cfg.db) await this.roh(["SELECT", this.cfg.db]);
          resolve();
        } catch (err) {
          reject(err);
          this.abbrechen(err);
        }
      };
      socket.once(this.cfg.tls && !this.verbindeImpl ? "secureConnect" : "connect", ok);
    });
    // Unbehandelte Ablehnung vermeiden, wenn niemand mehr wartet.
    this.bereit.catch(() => {});
    return this.bereit;
  }

  empfange(daten) {
    this.puffer = this.puffer.length ? Buffer.concat([this.puffer, daten]) : daten;
    let pos = 0;
    for (;;) {
      let r;
      try {
        r = lies(this.puffer, pos);
      } catch (err) {
        this.abbrechen(err);
        return;
      }
      if (!r) break;
      pos = r.ende;
      const w = this.warteschlange.shift();
      if (w) {
        clearTimeout(w.timer);
        if (r.wert instanceof RedisFehler) w.reject(r.wert);
        else w.resolve(r.wert);
      }
    }
    this.puffer = pos ? this.puffer.subarray(pos) : this.puffer;
  }

  abbrechen(err) {
    const offen = this.warteschlange.splice(0);
    for (const w of offen) {
      clearTimeout(w.timer);
      w.reject(err);
    }
    if (this.socket) {
      this.socket.removeAllListeners("data");
      this.socket.destroy();
    }
    this.socket = null;
    this.bereit = null;
  }

  roh(args) {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new RedisFehler("Redis-Verbindung getrennt.", { code: "verbindung" }));
      const w = { resolve, reject, timer: null };
      w.timer = setTimeout(() => {
        // Antwortreihenfolge wäre ab hier unklar → Verbindung verwerfen.
        this.abbrechen(new RedisFehler("Redis antwortet nicht rechtzeitig.", { code: "zeitlimit" }));
      }, this.timeoutMs);
      w.timer.unref?.();
      this.warteschlange.push(w);
      this.socket.write(kodiere(args));
    });
  }

  /** Einen Befehl senden. Ablehnung mit RedisFehler (code: verbindung | zeitlimit | redis | protokoll). */
  async befehl(...args) {
    await this.verbinde();
    return this.roh(args);
  }

  /** Verbindung schließen (Tests, Herunterfahren). */
  async schliessen() {
    if (!this.socket) return;
    try {
      await this.roh(["QUIT"]);
    } catch {
      // egal – wird ohnehin getrennt
    }
    this.abbrechen(new RedisFehler("Redis-Verbindung geschlossen.", { code: "verbindung" }));
  }
}
