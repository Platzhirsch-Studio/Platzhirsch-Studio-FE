// Sofa-Modulplaner – Aufbewahrung geteilter Pläne (R2, Restpunkt 2).
// Reine Regeln ohne Dateisystem, damit `node --test` sie prüfen kann; store.js
// wendet sie auf .data/sofaplaner/plans an.
//
// - Ein Teilen-Link gilt TTL_DAYS Tage (Standard 180, per SOFAPLANER_TTL_DAYS
//   zwischen 1 und 730 einstellbar). Danach wird er nicht mehr aufgelöst und die
//   Datei beim nächsten Aufräumen gelöscht.
// - Obergrenze MAX_PLANS Dateien: Darüber werden die ältesten zuerst gelöscht.

export const DEFAULT_TTL_DAYS = 180;
export const MAX_PLANS = 5000;
export const PRUNE_EVERY_MS = 6 * 60 * 60 * 1000; // höchstens alle 6 Stunden aufräumen
const DAY = 24 * 60 * 60 * 1000;

export function ttlMs(env = process.env) {
  const n = Number(env.SOFAPLANER_TTL_DAYS);
  const days = Number.isFinite(n) && n >= 1 && n <= 730 ? Math.round(n) : DEFAULT_TTL_DAYS;
  return days * DAY;
}

/** Ist ein Plan mit diesem Erstellzeitpunkt (ISO-String oder ms) abgelaufen? */
export function isExpired(createdAt, now = Date.now(), ttl = ttlMs()) {
  const t = typeof createdAt === "number" ? createdAt : Date.parse(createdAt);
  if (!Number.isFinite(t)) return true; // ohne gültiges Datum: nicht mehr ausliefern
  return now - t > ttl;
}

/**
 * Welche Dateien sollen weg? entries: [{ name, time }] (time = ms, z. B. mtime).
 * Gibt die Namen zurück: alle abgelaufenen, dann die ältesten über `max`.
 */
export function plansToPrune(entries, { now = Date.now(), ttl = ttlMs(), max = MAX_PLANS } = {}) {
  const expired = [];
  const alive = [];
  for (const e of entries) (now - e.time > ttl ? expired : alive).push(e);
  alive.sort((a, b) => a.time - b.time);
  const overflow = alive.length > max ? alive.slice(0, alive.length - max) : [];
  return [...expired, ...overflow].map((e) => e.name);
}
