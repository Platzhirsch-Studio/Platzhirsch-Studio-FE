"use client";
// Kassa – lokaler Speicher (Team B-KAS, Konzept §3.0 „Lokaler Entwurf“, §3.13 Geparkt). Kleiner Schlüssel-Wert-
// Speicher auf IndexedDB `ph_kassa_entwurf` (Rückfall: Arbeitsspeicher). Jeder Zugriff in try/catch – ohne
// IndexedDB meldet `verfuegbar()` false (Band „Entwurf wird nicht gesichert“), die Kassa arbeitet weiter.

const DB = "ph_kassa_entwurf";
const STORE = "kv";
const speicher = new Map();
let dbPromise = null;
let ok = null;

function oeffne() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  }).then((db) => {
    ok = !!db;
    return db;
  });
  return dbPromise;
}

async function tx(art, fn) {
  const db = await oeffne();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const t = db.transaction(STORE, art);
      const r = fn(t.objectStore(STORE));
      t.oncomplete = () => resolve(r?.result ?? null);
      t.onerror = () => resolve(null);
      t.onabort = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function lese(schluessel) {
  const v = await tx("readonly", (s) => s.get(schluessel));
  if (v !== null && v !== undefined) return v;
  return speicher.get(schluessel) ?? null;
}

export async function schreibe(schluessel, wert) {
  speicher.set(schluessel, wert);
  await tx("readwrite", (s) => s.put(wert, schluessel));
}

export async function loesche(schluessel) {
  speicher.delete(schluessel);
  await tx("readwrite", (s) => s.delete(schluessel));
}

/** null = noch unbekannt, true/false nach dem ersten Zugriff. */
export function verfuegbar() {
  return ok;
}

export const schluessel = {
  entwurf: (kasse, user) => `entwurf:${kasse}:${user}`,
  geparkt: (kasse) => `geparkt:${kasse}`,
  terminal: (kasse) => `terminal:${kasse}`,
  ohneBeleg: (kasse) => `ohne-beleg:${kasse}`,
};
