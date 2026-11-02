// Tempo fix2 (qa-screenshots/tempo/fix2.md): viewport prefetches of <Link>
// wait until the first paint has settled.
//
// Lighthouse/PageSpeed (mobil, simuliert) zählt jede Anfrage, die vor dem
// beobachteten LCP startet, in den LCP-Graphen. Next startet die Viewport-
// Prefetches direkt nach der Hydrierung, also mitten in die erste Darstellung:
// auf /de vier RSC-Antworten der Startseite (Logo-Link, ≈ 53 KB) plus ihr
// Hero-Bild mit hoher Priorität und CSS, dazu Beratung/Arbeitsweise – ≈ 100 KB
// vor dem LCP (messung2/lh-b/_de_*.json). Gleiches Bild auf Produkte,
// Sofaplaner und Ezarri (Logo, Hero-CTAs, Handy-Leiste).
//
// Das Tor öffnet sich (einmal je Dokument, danach bleibt es offen):
// - nach `load` + 1,2 s im nächsten Leerlauf (spätestens 1 s später), oder
// - sofort bei der ersten Absicht: Zeiger (auch Maus-Bewegung), Berührung,
//   Taste, Mausrad.
// Danach prefetcht jeder <Link> genau wie vorher (gleiches prefetch-Prop,
// Viewport und Hover). Nur der Zeitpunkt ist später; Klicks navigieren auch
// vor dem Öffnen clientseitig. Kein Effekt auf dem Server (dort gibt es keine
// Prefetches).
import { useSyncExternalStore } from "react";

export const PREFETCH_DELAY_MS = 1200;
export const PREFETCH_IDLE_TIMEOUT_MS = 1000;
const INTENT = ["pointerdown", "touchstart", "keydown", "wheel"];

let open = false;
let armed = false;
const subs = new Set();
let disarm = () => {};

function openGate() {
  if (open) return;
  open = true;
  disarm();
  for (const fn of [...subs]) fn();
}

function arm() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  let timer = 0;
  let idleId = 0;
  const onPointerMove = (e) => {
    if (e.pointerType === "mouse") openGate();
  };
  const afterLoad = () => {
    timer = window.setTimeout(() => {
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(openGate, { timeout: PREFETCH_IDLE_TIMEOUT_MS });
      else openGate();
    }, PREFETCH_DELAY_MS);
  };
  for (const k of INTENT) window.addEventListener(k, openGate, { capture: true, passive: true });
  window.addEventListener("pointermove", onPointerMove, { capture: true, passive: true });
  if (document.readyState === "complete") afterLoad();
  else window.addEventListener("load", afterLoad, { once: true });
  disarm = () => {
    for (const k of INTENT) window.removeEventListener(k, openGate, { capture: true });
    window.removeEventListener("pointermove", onPointerMove, { capture: true });
    window.removeEventListener("load", afterLoad);
    if (timer) window.clearTimeout(timer);
    if (idleId) window.cancelIdleCallback?.(idleId);
  };
}

function subscribe(fn) {
  arm();
  subs.add(fn);
  return () => subs.delete(fn);
}
const getSnapshot = () => open;
// Server und Hydrierung: geschlossen (gleiches HTML, prefetch-Prop wirkt dort nicht).
const getServerSnapshot = () => false;

// For tests and non-React callers.
export { subscribe as subscribePrefetchGate, getSnapshot as isPrefetchOpen };

/** true once viewport/hover prefetching may start (see above). */
export function usePrefetchOpen() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The prefetch prop to hand to <Link>: the caller's value once open, `false` before. */
export function gatedPrefetch(isOpen, prefetch) {
  return isOpen || prefetch === false ? prefetch : false;
}
