"use client";
// Ruhige Ansicht für Kino-Lab 3: an, wenn
//   – das System „Bewegung reduzieren“ meldet,
//   – die seitenweite „Ruhige Ansicht“ (Footer, html[data-motion="reduced"]) an ist,
//   – oder hier auf der Seite „Bewegung anhalten“ gedrückt wurde.
// Auf dem Server unbekannt (null) – dann entscheidet CSS per Media Query.
import { useSyncExternalStore } from "react";

let pause = false;
const subs = new Set();
const REDUCE = "(prefers-reduced-motion: reduce)";

export function setPause(v) {
  pause = v;
  subs.forEach((f) => f());
}

function subscribe(cb) {
  subs.add(cb);
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    subs.delete(cb);
    mq.removeEventListener("change", cb);
    mo.disconnect();
  };
}

const ruhigJetzt = () => pause || window.matchMedia(REDUCE).matches || document.documentElement.dataset.motion === "reduced";

/** true = ruhig (statisch), false = Animation, null = noch unbekannt (Server). */
export function useRuhig() {
  return useSyncExternalStore(subscribe, ruhigJetzt, () => null);
}

/** Nur der Seiten-Schalter (für aria-pressed). */
export function usePause() {
  return useSyncExternalStore(
    subscribe,
    () => pause,
    () => false
  );
}
