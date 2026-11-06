"use client";
// Kleine Helfer des Bereichs: Zustand an eine Eigenschaft anpassen, ohne Effekt (React-Muster „vorigen Wert merken“,
// https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).

import { useState } from "react";

/** Ruft `fn(wert)` während des Renderns auf, sobald sich `wert` ändert (nicht beim ersten Rendern). */
export function useWechsel(wert, fn) {
  const [vorher, setVorher] = useState(wert);
  if (!Object.is(vorher, wert)) {
    setVorher(wert);
    fn(wert);
  }
}
