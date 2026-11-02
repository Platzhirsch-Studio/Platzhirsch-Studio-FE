"use client";
// Gewählte Größe einer modularen Familie (QA R2 P2-1.2), geteilt zwischen dem
// Umschalter über „In meinem Raum ansehen“ (ArLaunch) und der Bühne/Maßleiste
// (ProductViewer). Index 0 = die Ausführung aus dims.json, 1… = raumbedarf.groessen.
import { useSyncExternalStore } from "react";

const state = new Map(); // productId → index
const subs = new Set();
const emit = () => subs.forEach((f) => f());

export function setGroesse(productId, index) {
  state.set(productId, index);
  emit();
}

export function useGroesse(productId) {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state.get(productId) || 0,
    () => 0
  );
}

/** Alle Größen eines Raumbedarfs: [Hauptausführung, …weitere]. */
export function groessenListe(raumbedarf, modell = null) {
  if (!raumbedarf) return [];
  const main = { modell: modell || raumbedarf.modell || null, w: raumbedarf.w, d: raumbedarf.d, h: raumbedarf.h, glb: raumbedarf.glb, usdz: raumbedarf.usdz };
  return [main, ...(raumbedarf.groessen || [])];
}

/** Kurze Knopf-Beschriftung: Breite; bei gleicher Breite zusätzlich Tiefe bzw. Modell. */
export function groesseLabel(list, i) {
  const g = list[i];
  const sameW = list.filter((x) => x.w === g.w);
  if (sameW.length === 1) return `${g.w} cm`;
  const sameWD = sameW.filter((x) => x.d === g.d);
  if (sameWD.length === 1) return `${g.w} × ${g.d} cm`;
  return g.modell || `${g.w} × ${g.d} × ${g.h} cm`;
}
