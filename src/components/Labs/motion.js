"use client";
// LazyMotion für Labs (R5-portal-labs, Bundle): Statt `motion.*` (≈ 42 KB gzip im
// Initial-JS je Route) rendern die Komponenten `m.*`; die Animations-Features
// kommen als eigener Chunk erst nach der Hydration (motionFeatures/*.js).
//
// Sichtbarkeit vor dem Nachladen: Ohne Features rendert `m.*` seinen
// `initial`-Zustand und animiert nicht weiter. Ein `initial={{ opacity: 0 }}`
// bliebe also unsichtbar, bis der Chunk da ist (oder für immer, wenn er nicht
// lädt). Darum liefert `useMotionReady()` erst `true`, wenn die Features geladen
// sind; Komponenten setzen vorher `initial={false}` (= sofort Endzustand). Was
// im Server-HTML steht und beim ersten Rendern sichtbar ist, bleibt sichtbar;
// erst später erscheinende Elemente (nächste Frage, Rechenweg …) animieren.
// AnimatePresence ohne Features entfernt Kinder sofort (keine Exit-Registrierung),
// es hängt also nichts, falls der Chunk ausfällt. reduced motion wie bisher über
// useReducedMotion in den Komponenten.
// Importwege (Bundle, gemessen im Prod-Build): "motion/react" macht
// `import * as fm from "framer-motion"` und hält damit den GANZEN Namensraum
// samt `motion`-Proxy und allen Features im Initial-JS fest – LazyMotion wäre
// wirkungslos. Darum hier direkt die schmalen Einstiege: `m` aus
// "motion/react-m", der Rest benannt aus "framer-motion" (exakt dieselbe
// Version, die `motion` selbst mitbringt, package-lock: framer-motion 12.43.0;
// gleiche Modulinstanzen, also derselbe LazyContext).
import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { LazyMotion, useReducedMotion } from "framer-motion";
import * as m from "motion/react-m";

export { m };
export { AnimatePresence, useReducedMotion } from "framer-motion";

// „Ruhige Ansicht“ (globals.css MOTION-FUNDAMENT): html[data-motion="reduced"],
// "calm" als zweiter Name. useReducedMotion() kennt nur die Systemeinstellung.
export const CALM_VALUES = ["reduced", "calm"];
export const isCalmValue = (v) => CALM_VALUES.includes(v);
const subscribeCalm = (cb) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => mo.disconnect();
};
const calmSnapshot = () => isCalmValue(document.documentElement.getAttribute("data-motion"));

/** true bei prefers-reduced-motion ODER Ruhiger Ansicht (data-motion) – dann keine Bewegung. */
export function useCalmMotion() {
  const system = useReducedMotion();
  const attr = useSyncExternalStore(subscribeCalm, calmSnapshot, () => false);
  return Boolean(system) || attr;
}

const LOADERS = {
  animation: () => import("./motionFeatures/animation.js"),
  max: () => import("./motionFeatures/max.js"),
};

const ReadyContext = createContext(false);

/** true, sobald die Animations-Features geladen sind (vorher: initial={false} verwenden). */
export function useMotionReady() {
  return useContext(ReadyContext);
}

/**
 * @param {{ features?: "animation" | "max", children: React.ReactNode }} props
 *   "max" nur, wenn drag/layout gebraucht wird (Stil-Finder).
 */
export function LabsMotion({ features = "animation", children }) {
  const [ready, setReady] = useState(false);
  // LazyMotion ruft die Funktion genau einmal im Mount-Effekt auf.
  const [load] = useState(() => () =>
    LOADERS[features]()
      .then((mod) => {
        setReady(true);
        return mod.default;
      })
      // Chunk nicht ladbar (offline, neues Deployment): ohne Animation weiter,
      // Inhalte sind dank useMotionReady() sichtbar. Kein unbehandelter Fehler.
      .catch(() => new Promise(() => {})),
  );
  return (
    <LazyMotion features={load} strict>
      <ReadyContext.Provider value={ready}>{children}</ReadyContext.Provider>
    </LazyMotion>
  );
}
