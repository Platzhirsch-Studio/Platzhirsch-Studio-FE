"use client";
import { useSyncExternalStore } from "react";

// Per-browser conveniences only (draft, Merkliste). Never contact data.
export const DRAFT_KEY = "ph.sofaplaner.draft";
export const LIST_KEY = "ph.sofaplaner.merkliste";
const EVENT = "ph-sofaplaner-storage";

export function readRaw(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeRaw(key, value) {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* private mode / blocked storage: planner keeps working without it */
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

export function useStoredRaw(key) {
  return useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null
  );
}

export function parseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Merkliste from localStorage: only entries with id, date and a plan with an
 * element list. Old or broken entries (other tab, older version, manual edit)
 * are skipped instead of crashing the list (`e.plan.items.length`).
 * The plan itself is validated with planSchema when it is opened.
 */
export function parseList(raw) {
  const v = parseJson(raw, []);
  if (!Array.isArray(v)) return [];
  return v.filter(
    (e) =>
      e &&
      typeof e === "object" &&
      typeof e.id === "string" &&
      typeof e.savedAt === "string" &&
      Number.isFinite(Date.parse(e.savedAt)) &&
      e.plan &&
      typeof e.plan === "object" &&
      Array.isArray(e.plan.items)
  );
}

// Phones and tablets (< 1024 px): shorter lists, accordion with one open group
// (QM Sofaplaner R2 P2-D). Server render and desktop: false.
const NARROW = "(max-width: 1023px)";
function subscribeNarrow(cb) {
  const mq = window.matchMedia?.(NARROW);
  mq?.addEventListener?.("change", cb);
  return () => mq?.removeEventListener?.("change", cb);
}
export function useNarrow() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia?.(NARROW).matches ?? false,
    () => false
  );
}
