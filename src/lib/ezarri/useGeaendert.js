// Nur für Client-Komponenten (React-Hook; bewusst nicht in motion.js, das
// auch Server-Komponenten importieren).
//
// true, sobald sich einer der Werte gegenüber dem ersten Render geändert hat –
// und ab dann für immer. So laufen Wechsel-Übergänge (.ph-arrive auf Zahlen,
// Panel-Einblenden) erst nach der ersten Bedienung, nie beim Seitenaufbau
// (@starting-style greift sonst schon beim ersten Zeichnen).
import { useState } from "react";
import { wertSchluessel } from "./motion";

export function useGeaendert(...werte) {
  const key = wertSchluessel(werte);
  const [start] = useState(key);
  const [geaendert, setGeaendert] = useState(false);
  // abgeleiteter Zustand im Render (React-Muster „storing information from previous renders“)
  if (!geaendert && key !== start) setGeaendert(true);
  return geaendert || key !== start;
}
