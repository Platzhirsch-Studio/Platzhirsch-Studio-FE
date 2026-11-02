"use client";
// Gibt true zurück, wenn der fixe Concierge-Seitentab Inhalte der Ezarri-/Yacht-Werkzeuge
// verdecken würde (QM r1 ezarri-yacht): Handy quer (niedriger Viewport, ab 768 px steht dort
// der 40 px breite Seitentab im schmalen Seitenrand) und vergrößerter Text (WCAG 1.4.4 –
// Root-Schrift ≥ 24 px). Der Aufrufer setzt dann `data-concierge-avoid` auf seinen Bereich;
// der Launcher (src/components/Concierge/Launcher.js, overAvoid) blendet den Tab aus, solange
// der Bereich unten rechts liegt, und zeigt ihn wieder, sobald er weggescrollt ist.
import { useSyncExternalStore } from "react";

export const QUER_KURZ = "(orientation: landscape) and (max-height: 500px)";
export const ZOOM_SCHRIFT_PX = 24;

/** Reine Entscheidung (testbar): niedriger Querformat-Viewport oder vergrößerte Root-Schrift. */
export function sollteAusweichen({ querKurz = false, rootPx = 16 } = {}) {
  return Boolean(querKurz) || Number(rootPx) >= ZOOM_SCHRIFT_PX;
}

function lesen() {
  try {
    const rootPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return sollteAusweichen({ querKurz: matchMedia(QUER_KURZ).matches, rootPx });
  } catch {
    return false;
  }
}

function subscribe(fn) {
  addEventListener("resize", fn, { passive: true });
  addEventListener("orientationchange", fn);
  // Textzoom ändert die Seitenhöhe, aber nicht den Viewport → ResizeObserver auf <body>
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(() => fn()) : null;
  ro?.observe(document.body);
  return () => {
    removeEventListener("resize", fn);
    removeEventListener("orientationchange", fn);
    ro?.disconnect();
  };
}

export default function useConciergeAvoid() {
  return useSyncExternalStore(subscribe, lesen, () => false);
}
