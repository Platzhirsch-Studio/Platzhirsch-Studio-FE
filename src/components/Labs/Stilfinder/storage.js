// Stil-Finder – the only persistence: the last result in the visitor's own
// browser (localStorage), a per-viewer convenience that is strictly opt-in:
// written only by the "Ergebnis auf diesem Gerät merken" button on the result
// page (never automatically – § 165 Abs. 3 TKG 2021 / § 25 TDDDG). Every
// access is guarded (private mode, blocked storage, SSR). Nothing is sent to a
// server.
import { useMemo, useSyncExternalStore } from "react";

const KEY = "platzhirsch:stilfinder:last";
const EVENT = "stilfinder:last";

function readRaw() {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(cb) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

// Server render and hydration see `null`; the stored value appears after.
export function useLastResult() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      const v = JSON.parse(raw);
      if (v && typeof v.slug === "string" && typeof v.code === "string" && typeof v.name === "string") return v;
    } catch {
      /* corrupt */
    }
    return null;
  }, [raw]);
}

function write(fn) {
  try {
    fn(window.localStorage);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const saveLastResult = (value) => write((s) => s.setItem(KEY, JSON.stringify(value)));
export const forgetLastResult = () => write((s) => s.removeItem(KEY));
