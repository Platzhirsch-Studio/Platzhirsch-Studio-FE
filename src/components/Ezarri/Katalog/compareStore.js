"use client";
// Vergleichsliste der Ezarri-Mosaike (bis 4 IDs). Nur im Browser
// (localStorage "ezarri-vergleich", try/catch), über useSyncExternalStore wie
// die Merkliste in CartContext – Server und Hydration sehen die leere Liste.
// Nichts wird gesendet. Die Vergleichsseite liest die IDs aus der URL (?ids=),
// damit der Vergleich als Link teilbar ist.
import { useSyncExternalStore } from "react";

export const MAX_COMPARE = 4;
const KEY = "ezarri-vergleich";
const EMPTY = [];
const listeners = new Set();
let ids = EMPTY;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (Array.isArray(parsed)) ids = parsed.filter((x) => typeof x === "string" && /^[a-z0-9_-]{1,60}$/.test(x)).slice(0, MAX_COMPARE);
  } catch {
    /* Speicher blockiert oder kaputt: leer starten */
  }
}

function save(next) {
  ids = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* gilt dann nur für diesen Besuch */
  }
  listeners.forEach((l) => l());
}

const store = {
  subscribe(l) {
    listeners.add(l);
    const onStorage = (e) => {
      if (e.key === KEY) {
        loaded = false;
        load();
        l();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  },
  get() {
    load();
    return ids;
  },
  server() {
    return EMPTY;
  },
};

export function useCompare() {
  const list = useSyncExternalStore(store.subscribe, store.get, store.server);
  return {
    ids: list,
    has: (id) => list.includes(id),
    full: list.length >= MAX_COMPARE,
    toggle(id) {
      load();
      if (ids.includes(id)) save(ids.filter((x) => x !== id));
      else if (ids.length < MAX_COMPARE) save([...ids, id]);
    },
    remove(id) {
      load();
      save(ids.filter((x) => x !== id));
    },
    clear() {
      save([]);
    },
  };
}
