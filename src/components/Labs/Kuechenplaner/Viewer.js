"use client";
// Küchenplaner – Ansicht: Grundriss-Editor (sofort, ohne 3D-Code) und 3D-Szene,
// die erst auf Klick lädt (Pro-Ausbau: Erstladen ohne three.js). Ohne WebGL
// bleibt der Grundriss, der 3D-Knopf entfällt.
//
// QA Runde 1: Werkzeugleiste in der Ansicht (P1-4, P2-3), Fortschritt beim Laden
// (P2-5), Hinweis ohne WebGL (P2-9), mobil minimierbar.
// R2 Fehlerfälle: Kontextverlust und Ladefehler fallen auf den Grundriss zurück,
// mit „3D erneut laden“; nach 12 s Laden erscheint ein Hinweis.
// Pro: Licht „Tag/Abend“, Foto der aktuellen Ansicht.
// Fix 2 (P2-3): 3D-Bedienleisten erst nach dem ersten gerenderten Frame; bis dahin
// bleibt die 2D-Ansicht unverändert, nur die Fortschrittskapsel ist zu sehen.
// P3-7: 3D-Knopf zeigt schon im Server-Render „3D“.
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Box, Camera, ChevronDown, ChevronUp, Eye, Hand, LoaderCircle, Map as MapIcon, Minus, Moon, Plus, RotateCcw, RotateCw, Rotate3d, Scan, Sun } from "lucide-react";
import PlanEditor from "./PlanEditor";
import SceneBoundary from "./SceneBoundary";
import { useKpT } from "./KpCopy";
import { trackEvent } from "@/lib/analytics";
import { isCalmMotion } from "@/components/Home/calmMotion";

const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false, loading: () => null });

let webglCache = null;
function hasWebGL() {
  if (webglCache !== null) return webglCache;
  try {
    const c = document.createElement("canvas");
    webglCache = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}
const noSubscribe = () => () => {};
const RM = "(prefers-reduced-motion: reduce)";
const COARSE = "(pointer: coarse)";
function subscribeCoarse(cb) {
  const mq = window.matchMedia(COARSE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const SLOW_MS = 12000;
// Motion planer-tools: Kamerafahrten auch bei „Ruhiger Ansicht“ (html[data-motion]) aus.
function subscribeRM(cb) {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    mq.removeEventListener("change", cb);
    mo.disconnect();
  };
}

// Sprachen (01.11.2026): Beschriftungen über useKpT (KpCopy.js).
const MODES = [
  { id: "orbit", label: "Rundum", Icon: Rotate3d },
  { id: "top", label: "Draufsicht", Icon: MapIcon },
  { id: "stand", label: "Ich stehe in der Küche", Icon: Eye },
];

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink focus-visible:shadow-[0_0_0_4px_#fff]";
// QM r3: nie umbrechen („2D-/Plan“, „Ich stehe / drin“), Schrift in rem, Ziel 44 px fest
const btn = `inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 whitespace-nowrap px-2 text-[0.8125rem] font-medium transition-colors duration-150 @min-[52rem]:px-3 ${focusRing}`;
// Knöpfe in den Planleisten (mobil): 40 × 40 px wie die Leisten im PlanEditor
const railCls = `inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center lg:hidden ${focusRing}`;
const bar = "flex bg-paper/90 p-0.5 ring-1 ring-ink/12 backdrop-blur-sm";
// QM r4: Handy quer (Ansicht und Panel nebeneinander, Kuechenplaner.module.css) – Einklappen
// spart dort keinen Platz, die Ansicht füllt die linke Spalte; der Knopf entfällt.
const SIDE_HIDDEN = "[@media(max-width:1023px)_and_(max-height:500px)_and_(min-width:640px)]:hidden";

export default function Viewer({ plan, kitchen, checks, apiRef, onStatus, minimized = false, onToggleMinimized, onCommit, selected, onSelect, history = null, initialMobile = false, show3DTick = 0 }) {
  // null = noch unbekannt (Server-Render)
  const webgl = useSyncExternalStore(noSubscribe, hasWebGL, () => null);
  const reduced = useSyncExternalStore(subscribeRM, () => isCalmMotion(document, window), () => false);
  const [want3D, setWant3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [view, setView] = useState("2d");
  const [mode, setMode] = useState("orbit");
  const [mood, setMood] = useState("tag");
  // null | "lost" (WebGL-Kontext verloren) | "failed" (Laden/Rendern fehlgeschlagen)
  const [problem, setProblem] = useState(null);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Touch (Fix 1, P1-2): 3D erst nach Antippen drehbar, vorher scrollt ein Finger die Seite
  const coarse = useSyncExternalStore(subscribeCoarse, () => window.matchMedia(COARSE).matches, () => false);
  const [touch3D, setTouch3D] = useState(false);
  const locked = coarse && !touch3D;
  // UX-Benchmark P1-4: Anforderung von außen (Reiter Material) – Prop-Wechsel im Render übernehmen
  const [seen3DTick, setSeen3DTick] = useState(show3DTick);
  if (show3DTick !== seen3DTick) {
    setSeen3DTick(show3DTick);
    if (webgl) {
      setWant3D(true);
      setView("3d");
    }
  }
  const editorRef = useRef(null);
  const btn3dRef = useRef(null);
  const rail3dRef = useRef(null);

  useEffect(() => {
    onStatus?.({ webgl, ready: ready && view === "3d" && !problem });
  }, [webgl, ready, view, problem, onStatus]);

  // Erst nach zwei Frames als fertig melden: dann hat das Canvas sicher gezeichnet (P2-3)
  const markReady = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);
  const onLost = useCallback(() => {
    setReady(false);
    setProblem("lost");
  }, []);
  const onFailed = useCallback(() => {
    setReady(false);
    setProblem("failed");
  }, []);
  const retry = () => {
    setProblem(null);
    setSlow(false);
    setAttempt((n) => n + 1);
  };
  const load3D = () => {
    setWant3D(true);
    setView("3d");
    trackEvent("kuechenplaner_3d");
  };
  const mount3D = webgl && want3D && !problem;
  const show3D = mount3D && view === "3d";
  const loading = show3D && !ready;
  // 3D-Werkzeuge nur, wenn die Szene wirklich sichtbar ist
  const live = show3D && ready;

  // Mobil-A11y fix-05 (WCAG 2.4.3): Sobald die 3D-Szene den Grundriss ersetzt, wird der
  // Editor inert – lag der Fokus dort (Knopf „3D“ in der Planleiste), fiele er auf <body>.
  // Dann auf „3D“ in der Darstellungs-Gruppe; zurück im Grundriss (mobil verschwindet die
  // Gruppe) auf den 3D-Knopf der Planleiste.
  useEffect(() => {
    const a = document.activeElement;
    const lost = !a || a === document.body;
    if (live && (lost || editorRef.current?.contains(a))) btn3dRef.current?.focus({ preventScroll: true });
    if (!live && view === "2d" && want3D && lost && rail3dRef.current?.offsetParent) rail3dRef.current.focus({ preventScroll: true });
  }, [live, view, want3D]);

  // Langsames Netz: nach SLOW_MS ohne fertige Szene einen ruhigen Hinweis zeigen.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [loading, attempt]);

  const photo = () => {
    const url = apiRef.current?.photo?.();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "kuechenplanung-ansicht.jpg";
    a.click();
    trackEvent("kuechenplaner_foto");
  };

  const fit = () => apiRef.current?.fit?.();
  const tr = useKpT();
  const minimizeBtn = onToggleMinimized ? (
    <button type="button" className={`${railCls} ${SIDE_HIDDEN} border border-ink/15 bg-paper text-ink`} onClick={onToggleMinimized} aria-expanded="true" aria-label={tr("Ansicht minimieren")}>
      <ChevronUp size={16} aria-hidden="true" />
    </button>
  ) : null;
  // Mobil: Knopf für 3D in der linken Planleiste (die obere Leiste läge sonst über dem Plan)
  const railLeft =
    webgl === null ? (
      <button type="button" disabled className={`${railCls} flex-col bg-ink/60 text-[0.6875rem] leading-none text-paper`} aria-label={tr("3D-Ansicht lädt …")}>
        <Box size={16} aria-hidden="true" />
        <span aria-hidden="true">3D</span>
      </button>
    ) : webgl ? (
      <button
        ref={rail3dRef}
        type="button"
        onClick={want3D ? () => setView("3d") : load3D}
        className={`${railCls} flex-col bg-ink text-[0.6875rem] leading-none text-paper hover:bg-ink-deep`}
        aria-label={tr(want3D ? "3D-Ansicht zeigen" : "3D-Ansicht laden")}
        title={tr(want3D ? "3D-Ansicht zeigen" : "Lädt die 3D-Ansicht (ca. 0,7 MB)")}
      >
        <Box size={16} aria-hidden="true" />
        <span aria-hidden="true">3D</span>
      </button>
    ) : null;

  return (
    <div className="flex h-full w-full flex-col gap-1.5">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#ebe6de]">
        {/* Grundriss-Editor: sofort nutzbar; Platzhalter beim Laden, Fallback ohne WebGL */}
        <div
          ref={editorRef}
          className={`absolute flex flex-col ${minimized ? "inset-y-1 left-1 right-28 sm:left-48 sm:right-52" : "inset-0 lg:pt-[56px]"}`}
          aria-hidden={(show3D && ready) || undefined}
          inert={(show3D && ready) || undefined}
          style={show3D && ready ? { visibility: "hidden" } : undefined}
        >
          <PlanEditor
            plan={plan}
            kitchen={kitchen}
            checks={checks}
            onCommit={onCommit}
            selected={selected}
            onSelect={onSelect}
            className="flex-1"
            history={history}
            initialMobile={initialMobile}
            compact={minimized}
            leftTop={railLeft}
            rightTop={minimizeBtn}
          />
        </div>
        {mount3D && (
          <div
            className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${show3D && ready ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={!show3D ? { visibility: "hidden" } : undefined}
            role="img"
            aria-label={tr("3D-Ansicht Ihrer Küche. Mit einem Finger drehen (auf dem Handy nach dem Antippen), mit zwei Fingern zoomen und verschieben. Textfassung im Reiter Ergebnis.")}
          >
            <SceneBoundary key={attempt} onError={onFailed}>
              <Scene3D
                plan={plan}
                kitchen={kitchen}
                mode={mode}
                mood={mood}
                apiRef={apiRef}
                reducedMotion={reduced}
                onReady={markReady}
                onProgress={setProgress}
                onContextLost={onLost}
                locked={locked}
              />
            </SceneBoundary>
          </div>
        )}
        {/* Touch: Scroll-Schutz wie bei Karten – erst nach Antippen dreht ein Finger die Szene */}
        {show3D && ready && !minimized && locked && (
          <button type="button" onClick={() => setTouch3D(true)} className="group absolute inset-x-0 bottom-0 top-14 flex items-center justify-center bg-transparent focus-visible:outline-none" aria-label={tr("3D-Ansicht bedienen: zum Drehen antippen")}>
            <span className="inline-flex items-center gap-2 bg-ink/80 px-3.5 py-2 text-[0.8125rem] font-medium text-paper shadow-[0_8px_24px_-8px_rgb(31_37_43/0.5)] backdrop-blur-sm group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-paper">
              <Hand size={16} aria-hidden="true" /> {tr("Zum Drehen antippen")}
            </span>
          </button>
        )}
        {show3D && ready && !minimized && coarse && touch3D && (
          <button type="button" onClick={() => setTouch3D(false)} className={`${btn} absolute bottom-1.5 left-1.5 bg-paper/90 px-3 text-ink ring-1 ring-ink/12`} aria-label={tr("Fertig gedreht, Seite wieder scrollen")}>
            <Hand size={16} aria-hidden="true" /> {tr("Fertig")}
          </button>
        )}
        {loading && !minimized && (
          <p className="absolute left-1/2 top-14 z-[2] inline-flex w-max flex-wrap items-center justify-center gap-x-2 max-w-[calc(100%-1rem)] -translate-x-1/2 bg-paper/95 px-3 py-1.5 text-center text-[0.8125rem] text-ink ring-1 ring-ink/10" role="status">
            {/* QM r3: bei 100 % kein „Langsame Verbindung“ mehr – geladen, die Szene wird nur noch aufgebaut */}
            <LoaderCircle size={15} className="shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {progress >= 100 ? tr("3D-Ansicht wird aufgebaut …") : <>{tr("3D-Ansicht wird geladen")}{progress > 0 ? ` · ${progress} %` : " …"}</>}
            {slow && progress < 100 && <span className="block text-center text-xs text-ink-soft sm:inline sm:before:content-['_·_']">{tr("Langsame Verbindung – der Grundriss ist schon nutzbar")}</span>}
          </p>
        )}
        {problem && !minimized && (
          <div className="absolute inset-x-2 top-14 z-[2] flex flex-wrap items-center justify-center gap-2 bg-paper/95 px-3 py-2 text-[0.8125rem] text-ink ring-1 ring-ink/10" role="status">
            <span>{tr(problem === "lost" ? "Die 3D-Ansicht wurde vom Browser beendet." : "Die 3D-Ansicht konnte nicht geladen werden.")} {tr("Der Grundriss zeigt Ihre Planung.")}</span>
            <button type="button" onClick={retry} className={`${btn} bg-ink px-4 text-paper`}>
              <Box size={16} aria-hidden="true" /> {tr("3D erneut laden")}
            </button>
          </div>
        )}

        {live && !minimized && (
          // Mobil: Einpassen, Licht und Foto unten rechts, damit die obere Leiste in 375 px passt
          // QM r5: auch Handy quer (≤ 500 px hoch) – oben nur Darstellung + Kamera, sonst verdeckten zwei Leistenreihen die Küche
          <div className={`${bar} absolute bottom-1.5 right-1.5 sm:hidden [@media(max-width:1023px)_and_(max-height:500px)]:flex!`} role="group" aria-label={tr("Ansicht, Licht und Foto")}>
            {/* fix-05 (WCAG 2.5.7 Dragging Movements): Drehen auch ohne Wischgeste */}
            {mode !== "top" && (
              <>
                <button type="button" className={`${btn} text-ink`} onClick={() => apiRef.current?.rotate(-1)} aria-label={tr("Nach links drehen")}>
                  <RotateCcw size={16} aria-hidden="true" />
                </button>
                <button type="button" className={`${btn} text-ink`} onClick={() => apiRef.current?.rotate(1)} aria-label={tr("Nach rechts drehen")}>
                  <RotateCw size={16} aria-hidden="true" />
                </button>
              </>
            )}
            <button type="button" className={`${btn} text-ink`} onClick={fit} disabled={!ready} aria-label={tr("Einpassen")}>
              <Scan size={16} aria-hidden="true" />
            </button>
            <button type="button" className={`${btn} text-ink`} aria-pressed={mood === "abend"} onClick={() => setMood((m) => (m === "abend" ? "tag" : "abend"))} aria-label={tr("Abendlicht")}>
              {mood === "abend" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            </button>
            <button type="button" className={`${btn} text-ink`} onClick={photo} disabled={!ready} aria-label={tr("Foto dieser Ansicht speichern")}>
              <Camera size={16} aria-hidden="true" />
            </button>
          </div>
        )}
        {/* Werkzeugleiste in der Ansicht: Darstellung, Kamera, Licht, Foto, Drehen/Zoomen.
            Mobil im Grundriss ausgeblendet: dort liegen 3D und Verkleinern in den Planleisten. */}
        {minimized ? (
          <>
          {/* QM r2 (Tablet): eingeklappt mit Beschriftung statt winzigem Plan im leeren Band */}
          {/* QM r4: Text, Vorschau und Knopf in drei getrennten Zonen (der Plan ist eingerückt,
              siehe editorRef) – nichts liegt mehr über der Zeichnung. */}
          <p className="pointer-events-none absolute left-4 top-1/2 hidden w-40 -translate-y-1/2 text-[0.8125rem] leading-snug text-ink-soft sm:block" aria-hidden="true">
            <span className="block font-medium text-ink">{tr("Grundriss")}</span>{tr("eingeklappt – Plan bleibt erhalten")}
          </p>
          <button type="button" onClick={onToggleMinimized} className={`${btn} absolute right-2 top-1/2 -translate-y-1/2 bg-paper px-3 text-ink ring-1 ring-ink/12`} aria-expanded="false" aria-label={tr("Ansicht vergrößern")}>
            <ChevronDown size={16} aria-hidden="true" />
            <span>
              {tr("Ansicht")}
              <span className="hidden sm:inline"> {tr("vergrößern")}</span>
            </span>
          </button>
          </>
        ) : (
          <div className={`@container absolute inset-x-1.5 top-1.5 flex-wrap items-start gap-1 ${live ? "flex" : "hidden lg:flex"}`} role="toolbar" aria-label={tr("Ansicht steuern")}>
            {webgl === null && (
              <button type="button" disabled className={`${btn} bg-ink/60 px-3 text-paper`}>
                <Box size={16} aria-hidden="true" /> {tr("3D-Ansicht lädt …")}
              </button>
            )}
            {webgl && !want3D && (
              <button type="button" onClick={load3D} className={`${btn} bg-ink px-3 text-paper`} title={tr("Lädt die 3D-Ansicht (ca. 0,7 MB)")}>
                <Box size={16} aria-hidden="true" /> {tr("3D-Ansicht laden")}
              </button>
            )}
            {webgl && want3D && (
              <div className={bar} role="group" aria-label={tr("Darstellung")}>
                {/* fix-05 (WCAG 2.5.3 Label in Name): sichtbar „2D“, Name früher nur „Plan“ */}
                {[
                  ["2d", "2D-Plan", "2D"],
                  ["3d", "3D", "3D"],
                ].map(([id, label, short]) => (
                  <button key={id} ref={id === "3d" ? btn3dRef : undefined} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={`${btn} ${view === id ? "bg-ink text-paper" : "text-ink"}`}>
                    {/* QM r3: Beschriftung nach Breite der Ansicht (Container), nicht des Fensters */}
                    <span aria-hidden="true" className="@min-[44rem]:hidden">{short}</span>
                    <span className="sr-only @min-[44rem]:not-sr-only">{tr(label)}</span>
                  </button>
                ))}
              </div>
            )}
            {live && (
              <div className={bar} role="group" aria-label={tr("Kamera")}>
                {MODES.map(({ id, label, Icon }) => (
                  <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} title={tr(label)} className={`${btn} ${mode === id ? "bg-ink text-paper" : "text-ink"}`}>
                    <Icon size={16} aria-hidden="true" />
                    <span className="sr-only @min-[72rem]:not-sr-only">{tr(id === "stand" ? "Ich stehe drin" : label)}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="ml-auto flex gap-1">
              {live && (
                <div className={`${bar} hidden sm:flex [@media(max-width:1023px)_and_(max-height:500px)]:hidden!`} role="group" aria-label={tr("Licht und Foto")}>
                  <button type="button" className={`${btn} text-ink`} aria-pressed={mood === "abend"} onClick={() => setMood((m) => (m === "abend" ? "tag" : "abend"))} title={tr(mood === "abend" ? "Tageslicht" : "Abendlicht")} aria-label={tr("Abendlicht")}>
                    {mood === "abend" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
                  </button>
                  <button type="button" className={`${btn} text-ink`} onClick={photo} disabled={!ready} title={tr("Foto dieser Ansicht speichern")} aria-label={tr("Foto dieser Ansicht speichern")}>
                    <Camera size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
              {live && (
                <div className={`${bar} hidden sm:flex [@media(max-width:1023px)_and_(max-height:500px)]:hidden!`} role="group" aria-label={tr("Drehen und Zoomen")}>
                  <button type="button" className={`${btn} text-ink`} onClick={fit} disabled={!ready} title={tr("Ganze Küche zeigen")} aria-label={tr("Einpassen")}>
                    <Scan size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className={`${btn} text-ink`} onClick={() => apiRef.current?.rotate(-1)} aria-label={tr("Nach links drehen")}>
                    <RotateCcw size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className={`${btn} text-ink`} onClick={() => apiRef.current?.rotate(1)} aria-label={tr("Nach rechts drehen")}>
                    <RotateCw size={16} aria-hidden="true" />
                  </button>
                  {mode !== "stand" && (
                    <>
                      <button type="button" className={`${btn} text-ink`} onClick={() => apiRef.current?.zoom(1)} aria-label={tr("Vergrößern")}>
                        <Plus size={16} aria-hidden="true" />
                      </button>
                      <button type="button" className={`${btn} text-ink`} onClick={() => apiRef.current?.zoom(-1)} aria-label={tr("Verkleinern")}>
                        <Minus size={16} aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              )}
              {onToggleMinimized && (
                <div className={`${bar} lg:hidden ${SIDE_HIDDEN}`}>
                  <button type="button" className={`${btn} text-ink`} onClick={onToggleMinimized} aria-expanded="true" aria-label={tr("Ansicht minimieren")}>
                    <ChevronUp size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {webgl === false && (
        <p className="bg-paper px-3 py-1.5 text-[0.8125rem] leading-snug text-ink ring-1 ring-ink/10" role="note">
          {tr("Ihr Browser unterstützt kein WebGL – Sie sehen den Grundriss. Alle Einstellungen funktionieren trotzdem.")}
        </p>
      )}
    </div>
  );
}
