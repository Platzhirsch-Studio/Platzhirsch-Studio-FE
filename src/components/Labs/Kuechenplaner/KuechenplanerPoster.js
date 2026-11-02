// Küchenplaner – statische Vorschau („Poster“) in Endgröße (R3 technik P0-1, neuland P1-1).
//
// Der Planer streamt im Server-HTML als eigene Suspense-Grenze nach (Viewer und Panels
// suspendieren beim Server-Render) und wird erst nach dem Parsen eingeblendet. Bis dahin
// stand an seiner Stelle nichts, und HandBridge, Hinweise und Footer sprangen um
// 1 700–2 200 px (CLS 0,55). Diese Vorschau belegt dieselbe Fläche:
//   - linke Spalte mit denselben Klassen wie die Ansicht in KuechenplanerApp.js
//     (Preiszeile ab lg, Ansichtsfläche mit clamp()/svh-Höhe, Reiter mobil),
//   - rechte Spalte mit Reitern ab lg und einer Panel-Fläche, deren Höhe je Breakpoint
//     am fertigen Reiter „Raum“ gemessen ist (Playwright, 360–1920 px, 28.10.2026).
// Ändert sich der Reiter „Raum“ deutlich, die Höhen hier nachmessen
// (tests/e2e/kuechenplaner-cls.spec.js vergleicht Vorschau und Planer).
// Kein Hook, kein Client-Code: rendert im Server-HTML und als Suspense-fallback.
//
// R5 technik P1-3 (Lighthouse mobil 84 → 67, LCP 5,6 s): LCP war der Text des
// Cookie-Hinweises, der erst nach dem JavaScript erscheint (Render Delay 5,2 s).
// Jetzt steht in der Ansichtsfläche ein echtes Bild – die 3D-Ansicht des Planers
// mit der Startküche (Screenshot aus dem Planer selbst, kein KI-Bild), AVIF/WebP,
// 7–29 KB, fetchPriority high. Es ist das größte Element im ersten Bildschirm und
// damit das LCP-Element, sobald es geladen ist – unabhängig von Hydration und Banner.
import { useKpT } from "./KpCopy";

const POSTER = "/labs/kuechenplaner/poster/kueche-3d";
const POSTER_SIZES = "(min-width: 1024px) 60vw, 100vw";
const srcSet = (ext) => [480, 800, 1200].map((w) => `${POSTER}-${w}.${ext} ${w}w`).join(", ");

function PosterBild() {
  return (
    <picture className="absolute inset-0 block">
      <source type="image/avif" srcSet={srcSet("avif")} sizes={POSTER_SIZES} />
      <img
        src={`${POSTER}-800.webp`}
        srcSet={srcSet("webp")}
        sizes={POSTER_SIZES}
        width={1182}
        height={1005}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="size-full object-cover"
        data-kp-poster-bild=""
      />
    </picture>
  );
}

// Sprachen (01.11.2026): nur über KuechenplanerGate (Client) eingebunden – useKpT übersetzt.
const TABS = ["Raum", "Möbel", "Material", "Prüfen", "Ergebnis"];
const SHAPES = ["Zeile", "L-Form", "U-Form", "Zweizeilig", "Zeile + Insel", "Zeile + Halbinsel", "Freie Raumform"];

function Tabs() {
  const tr = useKpT();
  return (
    <div className="flex items-stretch gap-1" aria-hidden="true">
      <div className="grid flex-1 grid-cols-5 gap-0.5 bg-stone p-0.5 lg:p-1">
        {TABS.map((t, i) => (
          <span key={t} className={`flex min-h-11 items-center justify-center px-0.5 text-[13px] sm:text-sm ${i === 0 ? "bg-paper font-semibold text-ink" : "text-ink/80"}`}>
            {tr(t)}
          </span>
        ))}
      </div>
    </div>
  );
}


export default function KuechenplanerPoster() {
  const tr = useKpT();
  return (
    <div data-kp-poster="" aria-busy="true" className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-8">
      <p className="sr-only" role="status">{tr("Küchenplaner wird geladen …")}</p>
      <div className="relative -mx-4 self-start bg-paper pb-1.5 pt-1.5 sm:mx-0 lg:pb-0 lg:pt-0">
        <div className="mb-2 hidden h-[60px] items-center justify-between gap-3 bg-bone px-4 py-2 ring-1 ring-ink/10 lg:flex" aria-hidden="true">
          <span className="text-base font-semibold leading-tight text-ink">{tr("Preis auf Anfrage")}</span>
          <span className="flex min-h-11 items-center bg-ink px-5 text-sm font-medium text-paper">{tr("Anfragen")}</span>
        </div>
        <div className="h-[calc(clamp(220px,38svh,340px)+68px)] sm:h-[calc(clamp(300px,42svh,460px)+68px)] lg:h-[calc(100svh-var(--kp-top)-136px)] lg:min-h-[460px] lg:max-h-[760px]">
          <div className="flex h-full w-full flex-col gap-1.5">
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#ebe6de]">
              <PosterBild />
              <p className="absolute bottom-2 left-3 bg-paper/85 px-1.5 text-[13px] text-ink" aria-hidden="true">{tr("3D-Ansicht der Startküche · Planer startet …")}</p>
            </div>
            {/* Werkzeugleiste wie im Viewer: 2D/3D, Rundum, Draufsicht, Stehen */}
            <div className="flex h-11 shrink-0 items-center gap-1 px-4 text-[13px] text-ink/80 sm:px-0" aria-hidden="true">
              <span className="flex h-11 items-center bg-ink px-3 font-medium text-paper">{tr("2D-Plan")}</span>
              <span className="flex h-11 items-center px-3 ring-1 ring-ink/15">3D</span>
              <span className="ml-auto hidden h-11 items-center px-3 sm:flex">{tr("Module per Drag & Drop")}</span>
            </div>
          </div>
        </div>
        <div className="mt-1.5 px-4 sm:px-0 lg:hidden"><Tabs /></div>
      </div>
      <div className="min-w-0 lg:min-h-[calc(100svh-var(--kp-top))]">
        <div className="hidden lg:block"><Tabs /></div>
        {/* Panel-Fläche: gemessene Höhe des Reiters „Raum“ je Breite */}
        {/* UX-Benchmark P1-1: +92 px für die Schritt-Leiste („Weiter“) am Ende des Reiters – mit kuechenplaner-cls.spec.js nachmessen */}
        <div className="h-[1830px] min-[375px]:h-[1814px] min-[400px]:h-[1794px] sm:h-[1764px] md:h-[1748px] lg:h-[1736px] pt-4 lg:pt-5" aria-hidden="true">
          <p className="text-[13px] font-medium text-ink">{tr("Grundform")}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SHAPES.map((s, i) => (
              <span key={s} className={`flex min-h-14 items-center border px-3 text-sm ${i === 1 ? "border-ink bg-ink text-paper" : "border-ink/15 bg-paper text-ink"}`}>{tr(s)}</span>
            ))}
          </div>
          <p className="mt-7 text-[13px] font-medium text-ink">{tr("Maße")}</p>
          <div className="mt-2 space-y-4">
            {[0, 1, 2].map((i) => (
              <span key={i} className="block h-14 border border-ink/10 bg-paper/70" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
