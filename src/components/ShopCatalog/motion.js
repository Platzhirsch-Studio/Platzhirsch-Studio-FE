// Motion helpers for the "Wohnen & Marken" grids (Motion-Runde 01.11.2026).
// Uses only the shared reveal of globals.css (MOTION-FUNDAMENT): `.reveal` /
// `.reveal-group` read --reveal-start / --reveal-end as the start and end of
// their scroll-driven entry (view() timeline, transform only, nothing hidden
// without support, still under prefers-reduced-motion and data-motion).
//
// .reveal-group staggers by :nth-child – in a 3-column grid only the first
// row gets offsets, every later row moves in lockstep. staggerStyle() sets the
// offset per COLUMN instead (index % columns), with the same steps as
// globals.css (4 % per step, at most 4 stages ≈ --stagger-max), so every row
// arrives left → right. Always returns both variables (step 0 = 0 % / 40 %),
// so the :nth-child(n + 4) rule of .reveal-group never wins for column 1.

const STEP = 4; // % of the entry range per column, as .reveal-group in globals.css
const MAX_STEPS = 3; // stages 0..3 = four stages

/**
 * @param {number} index    0-based position in the list
 * @param {number} [columns=3] columns of the widest layout
 * @returns {{"--reveal-start": string, "--reveal-end": string}}
 */
export function staggerStyle(index, columns = 3) {
  const cols = Math.max(1, Math.floor(Number(columns) || 1));
  const i = Math.max(0, Math.floor(Number(index) || 0));
  const step = Math.min(i % cols, MAX_STEPS);
  return { "--reveal-start": `${step * STEP}%`, "--reveal-end": `${40 + step * STEP}%` };
}

// Image hover inside a fixed, overflow-hidden frame: 2 % in --duration-morph
// on the long, even curve (ease-drift); motion-safe: also honours
// html[data-motion] (custom variant in globals.css).
export const IMAGE_HOVER = "transition-transform duration-(--duration-morph) ease-drift motion-safe:group-hover:scale-[1.02]";
