"use client";
// Druck-Warteschlange je Gerät (G-17, Zentrale § 3.14): IndexedDB „ph_bo_druck“, Rückfall Arbeitsspeicher
// (privates Fenster, gesperrter Speicher). Lesen auch für /druck?tab=warteschlange (Zentrale).
//
//   const { auftraege, hinzu, setze, entferne } = useDruckWarteschlange();
//   const a = hinzu({ doctype, name, titel, format });          // → Auftrag (Zustand „wartet“)
//   setze(a.id, "druckt"); setze(a.id, "gedruckt");             // erlaubte Übergänge: lib/backoffice/druck auftragWeiter

import { useSyncExternalStore } from "react";
import { auftragWeiter, neuerAuftrag, raeumeAuf } from "@/lib/backoffice/druck";

const DB = "ph_bo_druck";
const STORE = "auftraege";
const LEER = [];

let stand = LEER;
let geladen = false;
const abos = new Set();

function melde() {
  for (const fn of abos) fn();
}

function oeffne() {
  return new Promise((ok, nein) => {
    try {
      if (typeof indexedDB === "undefined") return nein(new Error("ohne IndexedDB"));
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
      r.onsuccess = () => ok(r.result);
      r.onerror = () => nein(r.error);
    } catch (e) {
      nein(e);
    }
  });
}

async function mitStore(modus, fn) {
  try {
    const db = await oeffne();
    await new Promise((ok, nein) => {
      const tx = db.transaction(STORE, modus);
      fn(tx.objectStore(STORE));
      tx.oncomplete = ok;
      tx.onerror = () => nein(tx.error);
    });
    db.close();
  } catch {
    // Speicher nicht verfügbar – die Warteschlange gilt dann nur in diesem Tab.
  }
}

async function lade() {
  if (geladen) return;
  geladen = true;
  let alle = [];
  await mitStore("readonly", (s) => {
    const r = s.getAll();
    r.onsuccess = () => {
      alle = r.result || [];
    };
  });
  const bereinigt = raeumeAuf([...alle, ...stand.filter((a) => !alle.some((b) => b.id === a.id))]);
  stand = bereinigt;
  melde();
  const weg = alle.filter((a) => !bereinigt.some((b) => b.id === a.id));
  if (weg.length) mitStore("readwrite", (s) => weg.forEach((a) => s.delete(a.id)));
}

function schreibe(a) {
  mitStore("readwrite", (s) => s.put(a));
}

export function druckAuftragHinzu(eingabe) {
  const a = neuerAuftrag(eingabe);
  stand = [a, ...stand];
  melde();
  schreibe(a);
  return a;
}

export function druckAuftragSetzen(id, zustand, extra) {
  let neu = null;
  stand = stand.map((a) => {
    if (a.id !== id) return a;
    neu = auftragWeiter(a, zustand, extra);
    return neu;
  });
  melde();
  if (neu) schreibe(neu);
  return neu;
}

export function druckAuftragEntfernen(id) {
  stand = stand.filter((a) => a.id !== id);
  melde();
  mitStore("readwrite", (s) => s.delete(id));
}

function abonniere(fn) {
  abos.add(fn);
  lade();
  return () => abos.delete(fn);
}

/** Reaktive Warteschlange dieses Geräts. */
export function useDruckWarteschlange() {
  const auftraege = useSyncExternalStore(
    abonniere,
    () => stand,
    () => LEER
  );
  return { auftraege, hinzu: druckAuftragHinzu, setze: druckAuftragSetzen, entferne: druckAuftragEntfernen };
}
