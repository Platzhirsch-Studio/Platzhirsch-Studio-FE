// Line pictograms of the homepage (Fix-Runde 1, F1: USP chapter "Von Hand
// gezeichnet" and "Mehr als Möbel"). Own drawings in the line style of the
// Design-Bibel and the planner floor plans: 48 × 48 grid, one stroke width
// (non-scaling, 1.25 px), round caps, no fill, currentColor. They are icons,
// not sketches – nothing here imitates a hand stroke or stands in for
// Harald Menghin's drawings (those come only as real material, media.js).
// Server component, decorative (aria-hidden): every step / service carries
// its name as text. Paths: ./pictoPaths.js, drawn from the static sprite
// (R5-fix P2, HTML size).

import { PATHS, PICTO_SPRITE } from "./pictoPaths.js";

/** Decorative line pictogram (48 × 48). @param {keyof typeof PATHS} name */
export default function Picto({ name, className }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-picto={name}
    >
      <use href={`${PICTO_SPRITE}#${name}`} />
    </svg>
  );
}

export { PICTO_NAMES } from "./pictoPaths.js";
