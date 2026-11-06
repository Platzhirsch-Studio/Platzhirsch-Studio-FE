"use client";
import { useCallback, useSyncExternalStore } from "react";

// Per-Benutzer-Komfort (Spaltenwahl, eingeklappte Navigation) im localStorage –
// über useSyncExternalStore, damit Server-HTML und erste Client-Darstellung gleich
// sind (Server-Snapshot = Standardwert) und kein setState im Effekt nötig ist.

const hoerer = new Set();
function melde() {
  for (const h of hoerer) h();
}
function subscribe(h) {
  hoerer.add(h);
  window.addEventListener("storage", h);
  return () => {
    hoerer.delete(h);
    window.removeEventListener("storage", h);
  };
}

/**
 * @template T
 * @param {string} key
 * @param {T} standard  wird auch auf dem Server geliefert
 * @returns {[T, (wert:T)=>void]}
 */
export function useLocalStorage(key, standard) {
  const standardJson = JSON.stringify(standard);
  const lesen = () => {
    try {
      return localStorage.getItem(key) ?? standardJson;
    } catch {
      return standardJson;
    }
  };
  const roh = useSyncExternalStore(subscribe, lesen, () => standardJson);
  let wert;
  try {
    wert = JSON.parse(roh);
  } catch {
    wert = standard;
  }
  const setzen = useCallback(
    (neu) => {
      try {
        localStorage.setItem(key, JSON.stringify(neu));
      } catch {
        // kein Speicher
      }
      melde();
    },
    [key]
  );
  return [wert, setzen];
}
