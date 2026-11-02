// src/lib/concierge/limitStore.js
// Speicher-Schnittstelle für Rate-Limit und Tagesbudget des Concierge (A4).
// Rein, ohne "server-only" und ohne Pakete – dadurch mit node --test prüfbar.
//
// Vertrag (alle Methoden async):
//   hits(key, now, windowMs)      → Zeitstempel (ms, aufsteigend) der Treffer im Fenster;
//                                   ältere Einträge dürfen dabei entfernt werden
//   addHit(key, now, windowMs)    → Treffer speichern; windowMs = längstes Fenster
//                                   dieses Schlüssels (für Ablauf/TTL)
//   dayCount(day)                 → Zähler des globalen Tagesbudgets (day = "YYYY-MM-DD", UTC)
//   incrDay(day, ttlMs)           → Zähler +1, gibt neuen Stand zurück
//   name                          → "memory" | "shared" (für Logs)
//
// Standard: createMemoryStore() – Arbeitsspeicher dieser Server-Instanz (pm2,
// eine Instanz). Für mehrere Instanzen/Serverless: createSharedStore(exec) mit
// einer Redis-kompatiblen Befehlsfunktion (siehe unten). Es wird hier KEIN
// Client installiert und kein Dienst angesprochen; der Anschluss passiert erst,
// wenn der Betrieb einen geteilten Speicher bereitstellt (feature doc).

const DAY_MS = 24 * 60 * 60 * 1000;

export function createMemoryStore({ maxKeys = 5000 } = {}) {
  const hits = new Map(); // key -> number[] (neueste zuletzt), Map-Reihenfolge = LRU
  const days = new Map(); // day -> count

  const prune = (key, now, windowMs) => {
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length) hits.set(key, list);
    else hits.delete(key);
    return list;
  };

  return {
    name: "memory",
    async hits(key, now, windowMs) {
      return [...prune(key, now, windowMs)];
    },
    async addHit(key, now, windowMs) {
      const list = prune(key, now, windowMs);
      list.push(now);
      hits.delete(key); // neu einfügen → zuletzt benutzt
      hits.set(key, list);
      if (hits.size > maxKeys) {
        for (const k of hits.keys()) {
          hits.delete(k);
          if (hits.size <= maxKeys * 0.9) break;
        }
      }
    },
    async dayCount(day) {
      return days.get(day) || 0;
    },
    async incrDay(day) {
      // Nur heute behalten.
      for (const d of days.keys()) if (d !== day) days.delete(d);
      const n = (days.get(day) || 0) + 1;
      days.set(day, n);
      return n;
    },
    // Nur für Tests/Diagnose.
    size: () => hits.size,
  };
}

// Adapter für einen geteilten, Redis-kompatiblen Speicher.
// exec(args: string[]) → Promise<Antwort> führt EINEN Befehl aus, z. B.
//   node-redis:  (args) => client.sendCommand(args)
//   ioredis:     (args) => client.call(...args)
//   Upstash REST:(args) => fetch(URL, { method: "POST", headers: { Authorization: `Bearer ${TOKEN}` },
//                                       body: JSON.stringify(args) }).then((r) => r.json()).then((j) => j.result)
// Datenmodell: Sorted Set je Schlüssel (Score = Zeitstempel), Zähler je Tag.
// Die Prüfung "zählen, dann eintragen" ist nicht atomar; bei Bedarf als
// Lua-Skript (EVAL) bündeln. Für ein Kostenlimit genügt die Genauigkeit.
export function createSharedStore(exec, { prefix = "concierge:rl:" } = {}) {
  if (typeof exec !== "function") throw new TypeError("createSharedStore: exec(args) fehlt");
  let seq = 0;
  const k = (key) => `${prefix}${key}`;
  return {
    name: "shared",
    async hits(key, now, windowMs) {
      await exec(["ZREMRANGEBYSCORE", k(key), "-inf", String(now - windowMs)]);
      const raw = await exec(["ZRANGEBYSCORE", k(key), String(now - windowMs + 1), "+inf", "WITHSCORES"]);
      const out = [];
      for (let i = 1; i < (raw?.length || 0); i += 2) out.push(Number(raw[i]));
      return out.sort((a, b) => a - b);
    },
    async addHit(key, now, windowMs) {
      // Mitglied eindeutig machen, Score = Zeit.
      seq = (seq + 1) % 1e6;
      await exec(["ZADD", k(key), String(now), `${now}-${seq}-${Math.random().toString(36).slice(2, 8)}`]);
      await exec(["PEXPIRE", k(key), String(windowMs)]);
    },
    async dayCount(day) {
      return Number((await exec(["GET", k(`day:${day}`)])) || 0);
    },
    async incrDay(day, ttlMs = 2 * DAY_MS) {
      const n = Number(await exec(["INCR", k(`day:${day}`)]));
      if (n === 1) await exec(["PEXPIRE", k(`day:${day}`), String(ttlMs)]);
      return n;
    },
  };
}
