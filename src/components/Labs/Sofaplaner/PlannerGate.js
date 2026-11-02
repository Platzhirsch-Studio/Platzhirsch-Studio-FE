"use client";
// Tempo-Runde (30.10.2026, Team Sofaplaner): der Code des Planers (Planner.js
// mit ModelPicker, PlanSvg, Palette, LookPanel, Summary, ResultPanel, Geometrie
// und zod) liegt nicht mehr im ersten Bundle der Seite.
//
// So bleibt alles gleich, es kommt nur später:
// - Server: der Planer wird wie bisher vollständig ins HTML gerendert (gleiches
//   Aussehen, lesbar ohne JavaScript, gleiche Inhalte für Suchmaschinen). Ohne
//   eigene Suspense-Grenze, denn React würde den großen Block sonst ans Ende
//   des Dokuments auslagern (progressiveChunkSize) und per Skript einsetzen.
// - Browser, erste Hydrierung: dieser Knoten bleibt unberührt
//   (leeres dangerouslySetInnerHTML + suppressHydrationWarning, React hydriert
//   die Kinder nicht und lässt das Server-HTML stehen).
// - Der Code lädt nach dem `load`-Ereignis im Leerlauf (spätestens 2 s danach)
//   oder sofort bei der ersten Berührung, Taste oder Fokussierung im Planer.
//   Dadurch läuft er erst nach dem ersten Malen (LCP = H1 im Kopf). Danach
//   rendert React den Planer in einem Transition-Update (in Scheiben, ohne
//   lange Aufgabe beim Rendern) und tauscht das gleich aussehende Server-HTML
//   in einem Schritt aus.
// - Fokus und ein Klick auf einen Knopf vor dem Tausch gehen nicht verloren:
//   beide werden über ihre Position im Baum auf den neuen Knoten übertragen.
// - Seitenwechsel im Browser: kein Server-HTML, der Planer wird sofort geladen
//   (die Navigation wartet als Transition darauf, wie bisher beim Client-Chunk).
import { startTransition, use, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
// Sprachen-Welle FR/IT (01.11.2026): das Wörterbuch der Sprache (fr/it) als
// eigener Chunk, geladen zusammen mit dem Planer (copy/dicts.js).
import { loadDict, needsDict } from "../../../lib/sofaplaner/copy/dicts.js";

// Tempo fix2 (qa-screenshots/tempo/fix2.md): im Leerlauf in drei Schritten
// statt in einem. Vorher lief das Auswerten von zod, model.js (Schemas,
// Geometrie, Vorlagen) und der Planer-Oberfläche in EINER langen Aufgabe
// (Lighthouse: 340 ms, die ganze TBT des Sofaplaners). Jetzt: zod/mini, dann
// model.js, dann der Planer, mit je einer freien Runde des Hauptthreads
// dazwischen. Gleiche Module, gleiches Ergebnis. Bei Berührung/Taste/Fokus
// wird der Planer wie bisher direkt geladen (kein Warten auf Zwischenschritte).
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));
const load = (direct) =>
  direct || typeof window === "undefined"
    ? import("./Planner")
    : import("./zod-mini.js")
        .then(nextTask)
        .then(() => import("./model"))
        .then(nextTask)
        .then(() => import("./Planner"));

let loaded = null; // { default: Planner } nach dem ersten Laden
let loading = null;
function loadPlanner(direct = false) {
  if (!loading) {
    loading = load(direct).then((m) => {
      loaded = m;
      return m;
    });
  }
  return loading;
}

// Server: früh anstoßen; falls beim ersten Aufruf noch nicht fertig, wartet
// das Rendern (use) wie bei jeder Client-Komponente auf ihr Modul.
if (typeof window === "undefined") loadPlanner(true);

const pathOf = (root, el) => {
  const path = [];
  for (let n = el; n && n !== root; n = n.parentElement) {
    if (!n.parentElement) return null;
    path.unshift(Array.prototype.indexOf.call(n.parentElement.children, n));
  }
  return path;
};
const nodeAt = (root, path) => path.reduce((n, i) => n?.children[i] || null, root);

function Loaded({ props }) {
  const locale = useLocale();
  if (needsDict(locale)) use(loadDict(locale));
  const mod = loaded || use(loadPlanner());
  const Planner = mod.default;
  return <Planner {...props} />;
}

export default function PlannerGate(props) {
  const locale = useLocale();
  const ref = useRef(null);
  // true nur bei der ersten Hydrierung mit Server-HTML (nicht auf dem Server,
  // nicht beim Seitenwechsel im Browser)
  const [deferred] = useState(() => typeof window !== "undefined" && !loaded && !!document.querySelector("[data-sofa-gate]"));
  const [ready, setReady] = useState(!deferred);
  const carry = useRef(null); // { focus: path, click: path }

  useEffect(() => {
    if (ready) return undefined;
    const root = ref.current;
    let done = false;
    const start = (direct) => {
      if (done) return;
      done = true;
      Promise.all([loadPlanner(direct), loadDict(locale)]).then(() => {
        const active = document.activeElement;
        carry.current = {
          focus: active && root.contains(active) ? pathOf(root, active) : null,
          click: carry.current?.click || null,
        };
        startTransition(() => setReady(true));
      });
    };
    const go = () => start(false); // Leerlauf: in Schritten
    const goNow = () => start(true); // Absicht: sofort
    // window + Capture: vor allen anderen Zuhörern
    const onIntent = (e) => {
      if (root.contains(e.target)) goNow();
    };
    const onClick = (e) => {
      if (!root.contains(e.target)) return;
      const btn = e.target.closest?.("button");
      if (btn && root.contains(btn)) carry.current = { ...carry.current, click: pathOf(root, btn) };
      goNow();
    };
    const kinds = ["pointerdown", "touchstart", "keydown", "focusin"];
    for (const k of kinds) window.addEventListener(k, onIntent, { capture: true, passive: true });
    window.addEventListener("click", onClick, true);
    let idleId = 0;
    let timer = 0;
    const idle = () => {
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(go, { timeout: 2000 });
      else timer = window.setTimeout(go, 300);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
    return () => {
      for (const k of kinds) window.removeEventListener(k, onIntent, { capture: true });
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("load", idle);
      if (idleId) window.cancelIdleCallback?.(idleId);
      if (timer) window.clearTimeout(timer);
    };
  }, [ready, locale]);

  // nach dem Tausch: Fokus und gemerkten Klick auf die neuen Knoten übertragen
  useEffect(() => {
    if (!ready || !carry.current) return;
    const root = ref.current;
    const { focus, click } = carry.current;
    carry.current = null;
    const f = focus && nodeAt(root, focus);
    if (f && typeof f.focus === "function") f.focus({ preventScroll: true });
    const c = click && nodeAt(root, click);
    if (c && c.tagName === "BUTTON" && !c.disabled) c.click();
  }, [ready]);

  if (!ready) {
    return <div ref={ref} data-sofa-gate="" style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: "" }} suppressHydrationWarning />;
  }
  return (
    <div ref={ref} data-sofa-gate="" style={{ display: "contents" }}>
      <Loaded props={props} />
    </div>
  );
}
