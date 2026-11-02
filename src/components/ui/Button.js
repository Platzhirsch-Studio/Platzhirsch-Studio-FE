import { ArrowRight } from "./icons";
import cx from "./cx";
import SmartLink from "./SmartLink";

// Actions (Bibel §9). No radius, no shadow. At most ONE primary per view.
// Heights: 48 px mobile, 52 px desktop. Hover/focus feedback 160 ms.
const BASE =
  "ph-press inline-flex max-w-full items-center justify-center gap-2 text-center text-ui transition-colors duration-(--duration-micro) ease-quiet " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

const BOX = "min-h-12 px-6 lg:min-h-13 lg:px-7";

const VARIANTS = {
  light: {
    // ink surface, paper text 11.37:1
    primary: cx(BOX, "bg-action text-paper hover:bg-action-hover"),
    // 1 px ink frame, fills on hover/focus (header "Termin", §2 P2)
    secondary: cx(BOX, "border border-ink text-text hover:bg-action hover:text-paper focus-visible:bg-action focus-visible:text-paper"),
    // quiet: no frame, keeps the 44 px target
    ghost: "min-h-11 px-3 text-text hover:bg-ink/5",
    // inline text link look, still ≥ 44 px tall
    link: "min-h-11 px-0 text-text underline decoration-line-strong underline-offset-4 hover:decoration-current",
  },
  dark: {
    primary: cx(BOX, "bg-paper text-ink hover:bg-stone"),
    secondary: cx(BOX, "border border-paper text-text-inverse hover:bg-paper hover:text-ink focus-visible:bg-paper focus-visible:text-ink"),
    ghost: "min-h-11 px-3 text-text-inverse hover:bg-paper/10",
    link: "min-h-11 px-0 text-text-inverse underline decoration-line-inverse underline-offset-4 hover:decoration-current",
  },
};

/**
 * Button or link styled as button.
 * @param {"primary"|"secondary"|"ghost"|"link"} [variant="primary"]
 * @param {string} [href] renders a link (internal → next-intl Link, external → <a>)
 * @param {boolean} [onDark] colours for the inverse (walnut) surface
 * @param {boolean} [arrow] trailing arrow icon (decorative)
 * @param {boolean} [fullWidth]
 * Other props go to the <button>/<a> (type, onClick, aria-*, target …).
 */
export default function Button({
  variant = "primary",
  href,
  onDark = false,
  arrow = false,
  fullWidth = false,
  className,
  children,
  type,
  ...rest
}) {
  const classes = cx(BASE, VARIANTS[onDark ? "dark" : "light"][variant] ?? VARIANTS.light.primary, fullWidth && "w-full", className);
  const content = (
    <>
      <span>{children}</span>
      {arrow && <ArrowRight aria-hidden="true" className="ph-arrow size-4 shrink-0" strokeWidth={1.5} />}
    </>
  );
  if (href) {
    return (
      <SmartLink href={href} className={classes} {...rest}>
        {content}
      </SmartLink>
    );
  }
  return (
    <button type={type || "button"} className={classes} {...rest}>
      {content}
    </button>
  );
}
