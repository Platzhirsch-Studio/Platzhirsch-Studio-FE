import cx from "./cx";
import { kernDisplay } from "./Kern";

// Type roles (Bibel §5). Bodoni only from 32 px up → display-* sizes; the
// smaller roles are Instrument Sans.
const SIZES = {
  "display-xl": "font-display text-display-xl", // hero, 1× per page
  "display-l": "font-display text-display-l", // H1 of sub pages
  "display-m": "font-display text-display-m", // H2
  title: "font-sans text-title", // H3
  subtitle: "font-sans text-lead font-medium", // H4
};

const DEFAULT_SIZE = { 1: "display-l", 2: "display-m", 3: "title", 4: "subtitle" };

/**
 * Semantic heading with the design-system size decoupled from the level.
 * @param {1|2|3|4} [level=2] → h1–h4
 * @param {"display-xl"|"display-l"|"display-m"|"title"|"subtitle"} [size] default by level
 * @param {"text"|"inverse"} [tone="text"]
 */
export default function Heading({ level = 2, size, tone = "text", as, className, children, ...rest }) {
  const Tag = as || `h${Math.min(Math.max(level, 1), 4)}`;
  return (
    <Tag
      className={cx(
        SIZES[size || DEFAULT_SIZE[level]] ?? SIZES["display-m"],
        // Kapitel-Auftakt (globals.css .ph-chapter): Abschnitts-H2 heben sich
        // beim Hereinscrollen um 8 px (Design-Jury P2-8), nur CSS, ruhig bei
        // reduced motion; in .reveal-Abschnitten und als sr-only gar nicht.
        level === 2 && !as && "ph-chapter",
        tone === "inverse" ? "text-text-inverse" : "text-text",
        className
      )}
      {...rest}
    >
      {/* T8: optical kerning W+lowercase for Bodoni sizes (ui/Kern.js) */}
      {String(size || DEFAULT_SIZE[level]).startsWith("display") ? kernDisplay(children) : children}
    </Tag>
  );
}
