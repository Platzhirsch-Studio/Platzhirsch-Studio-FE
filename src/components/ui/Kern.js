// Optical kerning for Bodoni display lines (QA Runde 1 P2-2; shared building
// block since R4-shell-perf, formerly Home/kern.js). The shipped Bodoni Moda
// has no kerning pairs for We/Wo/Wi (measured in R3-shell, kerning.mjs), and
// its capital "W" carries a wide right side bearing, so "Wohnen" / "Wir" read
// as "W ohnen" / "W ir" at display sizes. A word-initial "W" (followed by a
// lowercase letter) is wrapped in a span that pulls the next letter in.
// The text content stays identical (crawlers, screen readers, H1 for SEO).
// Server-safe (no hooks): usable from Server and Client Components.
const W_START = /(^|[\s(«»"„“‘’'])(W)(?=[a-zà-öø-ÿ])/g;

/** @param {string} text  @returns {string | Array<string | JSX.Element>} */
export function kernDisplay(text) {
  if (typeof text !== "string" || !text.includes("W")) return text;
  const out = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(W_START)) {
    const at = m.index + m[1].length;
    if (at > last) out.push(text.slice(last, at));
    out.push(
      <span key={`w${i++}`} className="-mr-[0.07em]">
        W
      </span>
    );
    last = at + 1;
  }
  if (last === 0) return text;
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * `<Kern>Wohnen am See</Kern>` – the same as `{kernDisplay("Wohnen am See")}`.
 * Non-string children pass through unchanged.
 */
export default function Kern({ children }) {
  return kernDisplay(children);
}
