"use client";
// Upload-Warteschlange (G-24, Q-J6) für Fotos, Unterschriften und Statusmeldungen der Kiosk-Arbeitsplätze.
// Einträge liegen in IndexedDB (Datenbank „ph-bo-warteschlange“), damit nichts verloren geht, wenn das
// Netz fehlt oder das Gerät neu lädt. Ohne IndexedDB (privater Modus, Vorschau) im Arbeitsspeicher –
// der Zähler bleibt trotzdem sichtbar. Gesendet wird über registrierte Sender je Art (Server Actions der
// Bereiche bzw. `dateiHochladenAction` aus Eingabe/aktionen.js); Fehler bleiben mit „erneut“ stehen.
//
//   const { eintraege, text, einreihen, erneut, entfernen } = useWarteschlange();
//   registriereSender("foto", async (eintrag) => dateiHochladenAction(alsFormData(eintrag)));
//   await einreihen({ art: "foto", daten: blob, meta: { doctype, name, dateiname } });

import { useEffect, useSyncExternalStore } from "react";
import { warteschlangenText } from "./logik";

const DB_NAME = "ph-bo-warteschlange";
const STORE = "eintraege";
const NACHLAUF_MS = [2000, 5000, 15000, 30000, 60000];

const zustand = { liste: [], abos: new Set(), sender: new Map(), laeuft: false, db: null, geladen: false, online: true, timer: null };

function melde() {
  zustand.liste = [...zustand.liste];
  for (const f of zustand.abos) f();
}

function oeffneDb() {
  if (zustand.db) return zustand.db;
  zustand.db = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return zustand.db;
}

async function dbAktion(modus, fn) {
  const db = await oeffneDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, modus);
      const r = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(r?.result ?? true);
      tx.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function laden() {
  if (zustand.geladen) return;
  zustand.geladen = true;
  const alle = await dbAktion("readonly", (s) => s.getAll());
  if (Array.isArray(alle) && alle.length) {
    const da = new Set(zustand.liste.map((e) => e.id));
    // Nach dem Neuladen: „sendet“ war unterbrochen → wieder „wartet“.
    zustand.liste.push(...alle.filter((e) => !da.has(e.id)).map((e) => ({ ...e, zustand: e.zustand === "sendet" ? "wartet" : e.zustand })));
    melde();
    abarbeiten();
  }
}

function speichere(e) {
  return dbAktion("readwrite", (s) => s.put(e));
}

function loesche(id) {
  return dbAktion("readwrite", (s) => s.delete(id));
}

/** Sender je Art registrieren: async (eintrag) → { ok: true } | { ok: false, fehler } (oder wirft). */
export function registriereSender(art, fn) {
  zustand.sender.set(art, fn);
  abarbeiten();
  return () => {
    if (zustand.sender.get(art) === fn) zustand.sender.delete(art);
  };
}

/**
 * Eintrag einreihen. daten: Blob/File/String/Objekt (strukturiert klonbar), meta: frei (Ziel, Dateiname …).
 * @returns {Promise<string>} id
 */
export async function einreihen({ art, daten, meta = {} }) {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const e = { id, art, daten, meta, zustand: "wartet", versuche: 0, fehler: "", zeit: new Date().toISOString() };
  zustand.liste.push(e);
  melde();
  await speichere(e);
  abarbeiten();
  return id;
}

function setze(id, teil) {
  const i = zustand.liste.findIndex((e) => e.id === id);
  if (i < 0) return null;
  zustand.liste[i] = { ...zustand.liste[i], ...teil };
  melde();
  return zustand.liste[i];
}

/** Abarbeiten der wartenden Einträge, einer nach dem anderen. */
export async function abarbeiten() {
  if (zustand.laeuft || !zustand.online) return;
  zustand.laeuft = true;
  clearTimeout(zustand.timer);
  try {
    for (;;) {
      const e = zustand.liste.find((x) => x.zustand === "wartet" && zustand.sender.has(x.art));
      if (!e) break;
      setze(e.id, { zustand: "sendet" });
      let ergebnis;
      try {
        ergebnis = await zustand.sender.get(e.art)(e);
      } catch (err) {
        ergebnis = { ok: false, fehler: err?.message || "" , netz: true };
      }
      if (ergebnis?.ok !== false) {
        zustand.liste = zustand.liste.filter((x) => x.id !== e.id);
        melde();
        await loesche(e.id);
        continue;
      }
      const versuche = e.versuche + 1;
      // Netzfehler: später automatisch erneut; fachlicher Fehler: bleibt stehen („erneut“).
      const neu = setze(e.id, { zustand: ergebnis.netz && versuche < NACHLAUF_MS.length ? "wartet" : "fehler", versuche, fehler: ergebnis.fehler || "" });
      if (neu) await speichere(neu);
      if (neu?.zustand === "wartet") {
        zustand.timer = setTimeout(abarbeiten, NACHLAUF_MS[versuche - 1]);
        break;
      }
    }
  } finally {
    zustand.laeuft = false;
  }
}

/** Fehlgeschlagenen Eintrag erneut senden. */
export async function erneut(id) {
  const e = setze(id, { zustand: "wartet", fehler: "" });
  if (e) await speichere(e);
  abarbeiten();
}

/** Eintrag verwerfen (nur nach Rückfrage in der Oberfläche). */
export async function entfernen(id) {
  zustand.liste = zustand.liste.filter((x) => x.id !== id);
  melde();
  await loesche(id);
}

/** Online-Zustand setzen (KioskShell meldet ihn aus useVerbindung). */
export function setzeOnline(online) {
  if (zustand.online === online) return;
  zustand.online = online;
  melde();
  if (online) abarbeiten();
}

const LEER = [];

/** Hook: { eintraege, text, anzahl, einreihen, erneut, entfernen } – Server/Hydration: leer. */
export function useWarteschlange() {
  const eintraege = useSyncExternalStore(
    (f) => {
      zustand.abos.add(f);
      return () => zustand.abos.delete(f);
    },
    () => zustand.liste,
    () => LEER
  );
  useEffect(() => {
    laden();
  }, []);
  return {
    eintraege,
    anzahl: eintraege.length,
    text: warteschlangenText(eintraege, { online: zustand.online }),
    einreihen,
    erneut,
    entfernen,
  };
}

/** Nur für Tests/Demo: Zustand leeren. */
export function _zuruecksetzen() {
  zustand.liste = [];
  zustand.sender.clear();
  melde();
}
