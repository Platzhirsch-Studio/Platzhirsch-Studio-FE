// Platzhirsch logo system (Design-Bibel §3, concept "Stangen").
//
// Monogram: P and H share their stems; above the letters both stems grow on
// as antler beams, each with exactly two ends (beam tip + brow tine), ends
// rounded. Grid 12 × 15 units (here ×4 = 48 × 60), tines at 30°, beams leave
// the stem at ~60°, ratio 1 : 1.25. The favicon cut drops the brow tine and
// thickens the stroke so it holds at 16 px.
// Wordmark + tagline are outlined paths (brandPaths.js), never <text>.
//
// Everything paints in currentColor. `tone` only picks the colour class:
//   ink   – on paper / bone / stone (default)
//   paper – on walnut / ink-deep (the one dark surface)
//   brass – brass-400, ONLY on dark surfaces (gold never on light, §4.2)
//   current – inherit from the parent
// Server component: no hooks, safe to import from server and client files.

import { WORDMARK, TAGLINE } from "./brandPaths";

const TONE = {
  ink: "text-ink",
  paper: "text-paper",
  brass: "text-brass-400",
  current: "",
};

const LABEL = "Platzhirsch Home Living";

function a11y(decorative, title) {
  return decorative
    ? { "aria-hidden": "true", focusable: "false" }
    : { role: "img", "aria-label": title };
}

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

// Bodoni's hairlines vanish below ~40 px (the H crossbar disappears), so the
// outlines get a thin stroke in the same colour – "Haarstriche verstärkt" (§3).
// Tempo & A11y (Konsolidierung): the wordmark outline is ~5.4 KB of path data.
// Header (twice: phone wordmark + desktop lockup) and footer wrote it three
// times into the HTML AND three times into the RSC payload of every page
// (~32 KB raw). With `sprite`, the lockup draws a <use> of the one copy that
// WordmarkSprite (rendered once by [locale]/layout.js) defines. currentColor
// resolves on the <use>, so the tones stay the same. Outside that layout
// (OG images, print, preview shells) the default inline path stays.
export const WORDMARK_SPRITE_ID = "ph-wordmark";

export function WordmarkSprite() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <WordmarkPath id={WORDMARK_SPRITE_ID} />
      </defs>
    </svg>
  );
}

function WordmarkPath({ transform, id, sprite = false }) {
  if (sprite) return <use href={`#${WORDMARK_SPRITE_ID}`} transform={transform} />;
  return (
    <path
      id={id}
      d={WORDMARK.d}
      transform={transform}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.7"
      strokeLinejoin="round"
    />
  );
}

// The mark itself, in the 48 × 60 unit box. Shared by every lockup.
function MonogramStrokes({ favicon = false }) {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={favicon ? 5 : 3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Shared stems: left = P and H, right = H */}
      <path d="M15 57V26M33 57V26" />
      {/* P bowl */}
      <path d="M15 26h6.5a7 7 0 0 1 0 14H15" />
      {/* H crossbar */}
      <path d="M15 47.5h18" />
      {/* Antler beams growing out of the stems, sweeping outward (~60°) */}
      <path d="M15 26C15 16.5 11 10 6 3.5M33 26C33 16.5 37 10 42 3.5" />
      {/* Brow tines (Augsprossen), 30° inward – omitted in the favicon cut */}
      {!favicon && <path d="M14.4 20.5L21 16.7M33.6 20.5L27 16.7" />}
    </g>
  );
}

/**
 * Monogram only (favicon, embossing, label, small spaces).
 * @param {number|string} [size] rendered height in px (width = height × 0.8)
 * @param {boolean} [favicon] reduced cut for ≤ 24 px (no brow tine, heavier stroke)
 */
export function Monogram({ size, className, tone = "ink", favicon = false, title = LABEL, decorative = false }) {
  return (
    <svg
      viewBox="0 0 48 60"
      height={size}
      width={size ? (typeof size === "number" ? size * 0.8 : undefined) : undefined}
      className={cx(TONE[tone], className)}
      {...a11y(decorative, title)}
    >
      <MonogramStrokes favicon={favicon} />
    </svg>
  );
}

/**
 * Wordmark only (mobile header < 360 px, vehicles). Height via className
 * (e.g. "h-5" = 20 px mobile header, Bibel §3).
 */
export function Wordmark({ className, tone = "ink", title = LABEL, decorative = false, sprite = false }) {
  const w = Math.ceil(WORDMARK.width);
  return (
    <svg viewBox={`0 -1 ${w} 26.5`} className={cx(TONE[tone], className)} {...a11y(decorative, title)}>
      <WordmarkPath sprite={sprite} />
    </svg>
  );
}

/**
 * Full logo.
 * @param {"horizontal"|"stacked"|"wordmark"|"monogram"} [variant]
 * @param {boolean} [tagline] HOME LIVING · LOCHAU AM BODENSEE (drop it below 160 px width)
 */
export default function Logo({
  variant = "horizontal",
  tagline = true,
  tone = "ink",
  className,
  title = LABEL,
  decorative = false,
  sprite = false,
}) {
  if (variant === "monogram") return <Monogram className={className} tone={tone} title={title} decorative={decorative} />;
  if (variant === "wordmark") return <Wordmark className={className} tone={tone} title={title} decorative={decorative} sprite={sprite} />;

  const wmW = WORDMARK.width;

  if (variant === "stacked") {
    const w = Math.ceil(wmW);
    const h = tagline ? 124 : 105;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className={cx(TONE[tone], className)} {...a11y(decorative, title)}>
        <g transform={`translate(${(w - 48) / 2} 0)`}>
          <MonogramStrokes />
        </g>
        <WordmarkPath transform="translate(0 78)" sprite={sprite} />
        {tagline && (
          <path d={TAGLINE.d} fill="currentColor" transform={`translate(${((wmW - TAGLINE.width) / 2).toFixed(2)} 113)`} />
        )}
      </svg>
    );
  }

  // horizontal (header): monogram left, wordmark + tagline right, block centred on the mark
  const x = 64;
  const w = Math.ceil(x + wmW);
  const top = tagline ? 10 : 18;
  return (
    <svg viewBox={`0 0 ${w} 60`} className={cx(TONE[tone], className)} {...a11y(decorative, title)}>
      <MonogramStrokes />
      <WordmarkPath transform={`translate(${x} ${top})`} sprite={sprite} />
      {tagline && <path d={TAGLINE.d} fill="currentColor" transform={`translate(${x + 1} ${top + 33})`} />}
    </svg>
  );
}
