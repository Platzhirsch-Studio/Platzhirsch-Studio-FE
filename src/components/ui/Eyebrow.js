import cx from "./cx";

// Overline (Bibel §5): 12 px, +0.14 em, the ONLY place with capitals.
// accent = brass-700 on light (5.69:1); on dark surfaces use tone="inverse"
// (brass-400) – never brass-400 on light.
const TONES = {
  accent: "text-text-accent",
  soft: "text-text-soft",
  inverse: "text-accent-on-dark",
  "inverse-soft": "text-text-inverse-soft",
};

/**
 * @param {"accent"|"soft"|"inverse"|"inverse-soft"} [tone="accent"]
 * @param {string} [as="p"]
 */
export default function Eyebrow({ as: Tag = "p", tone = "accent", className, children, ...rest }) {
  return (
    <Tag className={cx("text-overline uppercase", TONES[tone] ?? TONES.accent, className)} {...rest}>
      {children}
    </Tag>
  );
}
