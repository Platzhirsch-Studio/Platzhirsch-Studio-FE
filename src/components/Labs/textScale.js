"use client";

import { useSyncExternalStore } from "react";

// QM r5 (WCAG 1.4.4): Beschriftungen in SVG-Plänen (Maße, Modulkürzel) sind in
// SVG-Einheiten bzw. px gesetzt und wuchsen bei 200 % Text nicht mit. Faktor =
// Schriftgröße der Wurzel / 16 px (Browser-Textgröße, Nutzer-CSS, iOS-Textgröße).

/** Faktor aus einer berechneten Schriftgröße („32px“ → 2); 1 bei Unsinn, gedeckelt auf 1–3. */
export function scaleFromFontSize(fontSize) {
  const px = Number.parseFloat(fontSize);
  if (!Number.isFinite(px) || px <= 0) return 1;
  return Math.min(3, Math.max(1, Math.round((px / 16) * 100) / 100));
}

function read() {
  try {
    return scaleFromFontSize(getComputedStyle(document.documentElement).fontSize);
  } catch {
    return 1;
  }
}

function subscribe(cb) {
  // Textgröße ändert sich ohne eigenes Ereignis: bei resize (Zoom) und Rückkehr in den Tab neu lesen
  window.addEventListener("resize", cb);
  document.addEventListener("visibilitychange", cb);
  // … und wenn sich die Wurzelschrift ändert: ein unsichtbares 1rem-Kästchen beobachten (nicht
  // <body> – dessen Größe ändert sich ständig und löste „ResizeObserver loop“-Meldungen aus).
  let probe = null;
  let ro = null;
  if (typeof ResizeObserver === "function") {
    probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;top:0;left:0;width:1rem;height:1rem;visibility:hidden;pointer-events:none;contain:strict";
    document.body.appendChild(probe);
    ro = new ResizeObserver(() => cb());
    ro.observe(probe);
  }
  return () => {
    ro?.disconnect();
    probe?.remove();
    window.removeEventListener("resize", cb);
    document.removeEventListener("visibilitychange", cb);
  };
}

export function useTextScale() {
  return useSyncExternalStore(subscribe, read, () => 1);
}
