"use client";
// Client-Seite des Kürzel-Registers (G-02): EIN Tastatur-Verteiler für die ganze Seite, Bindungen über IDs,
// Folge-Kürzel (G …) mit 1,5-s-Fenster, Schalter „Einzeltasten-Kürzel“ (WCAG 2.1.4, Standard an).
//
//   useKuerzel("liste", { "liste.oeffnen": () => …, "liste.auswaehlen": () => … });
//   const [an, setzeAn] = useEinzeltasten();
//   const folge = useFolge();   // { praefix, bis, ziele } solange „G“ gedrückt wurde, sonst null
//
// Ein Handler, der `false` zurückgibt, lässt das Ereignis weiterlaufen (kein preventDefault).
// Ersetzt in Bereichen die direkte Nutzung von useTastenkuerzel (der Kiosk-Hook bleibt als Unterbau).

import { useEffect, useRef, useSyncExternalStore } from "react";
import { aufloesen, istEinzeltaste } from "./index.js";

const SPEICHER = "ph-bo:einzeltasten";
const SCAN_ABSTAND_MS = 20; // schneller als Menschen tippen → Scanner, löst nie Einzeltasten aus (Q-D8)

const zustand = {
  bindungen: [], // { kontext, ref, nr }
  folge: null,
  nr: 0,
  zuletzt: 0,
  abos: new Set(),
  einzeltastenAbos: new Set(),
  verteiler: null,
};

function melde() {
  for (const fn of zustand.abos) fn();
}

function istMac() {
  if (typeof navigator === "undefined") return false;
  const p = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || "";
  return /mac|iphone|ipad|ipod/i.test(p);
}

/** Einzeltasten an? (localStorage, Standard an; ohne Speicher immer an). */
export function einzeltastenAn() {
  try {
    return window.localStorage.getItem(SPEICHER) !== "aus";
  } catch {
    return true;
  }
}

export function setzeEinzeltasten(an) {
  try {
    if (an) window.localStorage.removeItem(SPEICHER);
    else window.localStorage.setItem(SPEICHER, "aus");
  } catch {
    // Speicher gesperrt – Schalter gilt dann nur bis zum Neuladen nicht; Standard bleibt an.
  }
  for (const fn of zustand.einzeltastenAbos) fn();
}

function aktiveKontexte() {
  const k = new Set(zustand.bindungen.map((b) => b.kontext));
  // Modale Kontexte (Palette, Glocke) überdecken die Seite.
  for (const modal of ["palette", "glocke"]) if (k.has(modal)) return [modal];
  return [...k];
}

function handlerFuer(id) {
  for (let i = zustand.bindungen.length - 1; i >= 0; i--) {
    const fn = zustand.bindungen[i].ref.current?.[id];
    if (typeof fn === "function") return fn;
  }
  return null;
}

function verteile(e) {
  if (e.defaultPrevented || e.isComposing) return;
  const jetzt = Date.now();
  const abstand = jetzt - zustand.zuletzt;
  zustand.zuletzt = jetzt;
  const folge = zustand.folge && jetzt <= zustand.folge.bis ? zustand.folge : null;
  const r = aufloesen(e, aktiveKontexte(), { mac: istMac(), einzeltasten: einzeltastenAn(), folge, jetzt });
  if (zustand.folge && (!r || r.art !== "folge")) {
    zustand.folge = null;
    melde();
  }
  if (!r) return;
  if (r.art === "abbruch") {
    e.preventDefault();
    return;
  }
  if (r.art === "folge") {
    if (abstand < SCAN_ABSTAND_MS || e.repeat) return;
    zustand.folge = { praefix: r.praefix, bis: r.bis, ziele: r.ziele.map((z) => ({ id: z.id, taste: z.taste, titel: z.titel })) };
    e.preventDefault();
    melde();
    return;
  }
  const { eintrag } = r;
  if (istEinzeltaste(eintrag.taste) && abstand < SCAN_ABSTAND_MS && !folge) return;
  const fn = handlerFuer(eintrag.id);
  if (!fn) return;
  if (fn(e, eintrag) === false) return;
  e.preventDefault();
}

function anmelden(bindung) {
  zustand.bindungen.push(bindung);
  if (!zustand.verteiler && typeof window !== "undefined") {
    zustand.verteiler = verteile;
    window.addEventListener("keydown", verteile);
  }
  return () => {
    const i = zustand.bindungen.indexOf(bindung);
    if (i >= 0) zustand.bindungen.splice(i, 1);
    if (!zustand.bindungen.length && zustand.verteiler) {
      window.removeEventListener("keydown", zustand.verteiler);
      zustand.verteiler = null;
      zustand.folge = null;
    }
  };
}

/**
 * Handler für einen Kontext binden. `map`: { "<kürzel-id>": (event, eintrag) => void|false }.
 * Die Tasten stehen im Register (kuerzel/<datei>.js), nicht hier.
 * @param {string} kontext z. B. "global", "liste", "akte@faktura", "kiosk-kassa@kassa"
 * @param {Record<string, Function>} map
 * @param {{aktiv?:boolean}} [opts]
 */
export function useKuerzel(kontext, map, { aktiv = true } = {}) {
  const ref = useRef(map);
  useEffect(() => {
    ref.current = map;
  });
  useEffect(() => {
    if (!aktiv) return undefined;
    return anmelden({ kontext, ref, nr: ++zustand.nr });
  }, [kontext, aktiv]);
}

/** Laufende Folge (nach „G“): { praefix, bis, ziele[] } oder null. */
export function useFolge() {
  return useSyncExternalStore(
    (fn) => {
      zustand.abos.add(fn);
      return () => zustand.abos.delete(fn);
    },
    () => zustand.folge,
    () => null
  );
}

/** Folge abbrechen (Klick daneben, Ablauf). */
export function brichFolgeAb() {
  if (!zustand.folge) return;
  zustand.folge = null;
  melde();
}

/** [an, setzen] des Schalters „Einzeltasten-Kürzel“; beim Server-Rendern immer an (hydrationssicher). */
export function useEinzeltasten() {
  const an = useSyncExternalStore(
    (fn) => {
      zustand.einzeltastenAbos.add(fn);
      const speicher = (e) => e.key === SPEICHER && fn();
      window.addEventListener("storage", speicher);
      return () => {
        zustand.einzeltastenAbos.delete(fn);
        window.removeEventListener("storage", speicher);
      };
    },
    einzeltastenAn,
    () => true
  );
  return [an, setzeEinzeltasten];
}

/** Mac-Anzeige (⌘ statt Strg) – beim Server-Rendern false, danach echt (hydrationssicher). */
export function useMac() {
  return useSyncExternalStore(
    () => () => {},
    istMac,
    () => false
  );
}

/** Ereignis, auf das die Kürzel-Wurzel der Shell hört (Hilfe-Panel, Benutzermenü, Demo). */
export const KUERZEL_DIALOG_EREIGNIS = "ph-bo:kuerzel-dialog";

/** Kürzel-Dialog öffnen, ohne die Shell zu kennen (Knopf „Tastenkürzel“). */
export function oeffneKuerzelDialog() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(KUERZEL_DIALOG_EREIGNIS));
}
