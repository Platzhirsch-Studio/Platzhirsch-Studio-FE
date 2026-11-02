"use client";
// Küchenplaner – verzögerte Hydration (Release-Rat R2, technik P1-1: TBT 833 ms mobil).
//
// Der Server rendert den Planer wie bisher vollständig (React.lazy wird beim
// Server-Render sofort aufgelöst, siehe node_modules/next/dist/docs/01-app/02-guides/
// lazy-loading.md: „React.lazy() … prerendered (SSR) by default“). Im Browser bleibt
// die Suspense-Grenze dehydriert – das Server-HTML steht, aber React hydriert den
// großen Planer erst, wenn
//   - der Planer sichtbar ist (IntersectionObserver) UND der Besucher etwas tut
//     (scrollen, Zeiger bewegen, tippen, Taste), oder
//   - der Besucher direkt im Planer tippt/klickt/fokussiert, oder
//   - spätestens 12 s nach dem Laden im Leerlauf (Besuch ohne jede Eingabe, z. B.
//     automatisierte Tests) – nie während des Seitenaufbaus. R5 technik P1-3: vorher
//     5 s; die Hydration des großen Planers fiel damit noch in das Messfenster
//     (TBT mobil 318 ms, Score 84 → 67). Vorlesesoftware löst über focusin sofort aus.
// So blockiert die Hydration nicht den Seitenaufbau. Den Code-Chunk lädt der Browser
// schon im Leerlauf nach dem Laden (nur Download und Auswertung, keine Hydration),
// damit der erste Klick nicht auf das Netz warten muss.
//
// R3 technik P0-1 (CLS 0,55): Beim Server-Render suspendiert der Planer (Viewer und
// Panels laden nach), die Grenze streamt deshalb nach und wird erst nach dem Parsen
// eingeblendet. Der fallback ist jetzt eine statische Vorschau in Endgröße
// (KuechenplanerPoster, aria-busy), die im ersten Server-HTML steht – nichts darunter
// springt mehr, und der Planer ist mobil sofort im ersten Bildschirm erkennbar.
import { Suspense, lazy, useCallback, useEffect, useRef } from "react";
import KuechenplanerPoster from "./KuechenplanerPoster";

// Meldet, dass die Grenze hydriert ist (Effekte laufen erst danach).
function Hydrated({ onDone }) {
  useEffect(() => onDone(), [onDone]);
  return null;
}

const loadApp = () => import("./KuechenplanerApp");

let open = null;
const gate =
  typeof window === "undefined"
    ? Promise.resolve()
    : new Promise((resolve) => {
        open = resolve;
      });
const LazyApp = lazy(() => gate.then(loadApp));

const ACTIVITY = ["pointerdown", "pointermove", "touchstart", "keydown", "wheel", "scroll"];
const INSIDE = ["pointerdown", "touchstart", "focusin", "keydown", "mouseover"];

export default function KuechenplanerGate(props) {
  const ref = useRef(null);
  const pending = useRef(null); // Klick vor der Hydration: nach der Hydration wiederholen
  const done = useRef(false);
  const onDone = useCallback(() => {
    done.current = true;
    ref.current?.setAttribute("data-kp-hydrated", "");
    const t = pending.current;
    pending.current = null;
    if (t && t.isConnected) t.click();
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // Klicks, die vor der Hydration im Planer landen, gehen nicht verloren
    const onClick = (e) => {
      if (done.current) return;
      e.preventDefault();
      e.stopPropagation();
      pending.current = e.target;
    };
    el.addEventListener("click", onClick, true);
    if (!open) return () => el.removeEventListener("click", onClick, true);
    let visible = false;
    let active = false;
    const release = () => {
      if (!open) return;
      const go = open;
      open = null;
      cleanup();
      go();
    };
    const check = () => visible && active && release();
    const onActivity = () => {
      active = true;
      check();
    };
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            visible = entries.some((e) => e.isIntersecting);
            check();
          })
        : null;
    if (io) io.observe(el);
    else visible = true;
    for (const t of ACTIVITY) window.addEventListener(t, onActivity, { passive: true, capture: true });
    for (const t of INSIDE) el.addEventListener(t, release, { passive: true, capture: true });
    // Chunk im Leerlauf vorladen (ohne Hydration)
    const idle = window.requestIdleCallback ? window.requestIdleCallback(() => loadApp(), { timeout: 8000 }) : window.setTimeout(() => loadApp(), 4000);
    // Rückfall ohne Eingabe: 12 s nach „load“, dann im nächsten Leerlauf
    let late = 0;
    const afterLoad = () => {
      late = window.setTimeout(() => (window.requestIdleCallback ? window.requestIdleCallback(release, { timeout: 2000 }) : release()), 12000);
    };
    if (document.readyState === "complete") afterLoad();
    else window.addEventListener("load", afterLoad, { once: true });
    function cleanup() {
      io?.disconnect();
      for (const t of ACTIVITY) window.removeEventListener(t, onActivity, { capture: true });
      for (const t of INSIDE) el.removeEventListener(t, release, { capture: true });
    }
    return () => {
      el.removeEventListener("click", onClick, true);
      cleanup();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      window.clearTimeout(late);
      window.removeEventListener("load", afterLoad);
    };
  }, []);
  return (
    <div ref={ref} data-kp-gate="">
      <Suspense fallback={<KuechenplanerPoster />}>
        <LazyApp {...props} />
        <Hydrated onDone={onDone} />
      </Suspense>
    </div>
  );
}
