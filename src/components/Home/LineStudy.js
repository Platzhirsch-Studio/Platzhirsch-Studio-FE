import { PAUSE_PATHS, VIEWBOX } from "@/lib/wow/pause-paths";
import { f1Copy } from "./copy";
import s from "./home.module.css";

// The line of the Wow hero as a quiet, static graphic in the USP chapter
// (Fix-Runde 1, F1; Release-Rat gesamtwerk P1-1): until Harald Menghin's real
// drawings exist (Inhaber-offen A1), the chapter shows the ABSTRACTED line
// graphic of the showroom (src/lib/wow/pause-paths.js) – even, ruled strokes
// without the ink pressure of the hero, so it does not read as a hand
// drawing – captioned "Linie: abstrahierte Grafik" in all four locales.
// Server component, 0 KB JS. The strokes draw in once while the figure
// scrolls into view (CSS scroll-driven, compositor-friendly
// stroke-dashoffset); without support, with reduced motion or "Ruhige
// Ansicht" the finished graphic stands at once.

const GUIDES = PAUSE_PATHS.filter((p) => p.kind === "guide");
const PENS = PAUSE_PATHS.filter((p) => p.kind !== "guide");

// `caption` (optional, R8): eigene Bildzeile, z. B. auf /de/arbeitsweise.
// `shared` (R8, technik P1-1 RSC payload): the Wow stage on the same page
// already defines every pen path once (<defs>, ids "wow-p-<id>", same
// geometry from pause-paths.js) – then the pens are <use> clones instead of a
// second copy of the path data in HTML and RSC payload.
export default function LineStudy({ locale, className, caption, shared = false }) {
  const c = f1Copy(locale);
  return (
    <figure className={className} data-line-study="">
      <div className={s.study}>
        <svg viewBox={VIEWBOX} preserveAspectRatio="xMidYMid meet" role="img" aria-label={c.lineLabel} focusable="false" className={s.studySvg}>
          <g className={s.studyGuides}>
            {GUIDES.map((p) => (
              <path key={p.id} d={p.d} />
            ))}
          </g>
          <g className={s.studyPens}>
            {PENS.map((p, i) => (
              shared ? <use key={p.id} href={`#wow-p-${p.id}`} style={{ "--i": i }} /> : <path key={p.id} d={p.d} pathLength="1" style={{ "--i": i }} />
            ))}
          </g>
        </svg>
      </div>
      <figcaption className="mt-2 text-small text-text-soft">{caption || c.lineCaption}</figcaption>
    </figure>
  );
}
