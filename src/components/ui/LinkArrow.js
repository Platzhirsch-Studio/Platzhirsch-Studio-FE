import { ArrowRight } from "./icons";
import cx from "./cx";
import SmartLink from "./SmartLink";

/**
 * Quiet text link with arrow ("Alle Sofas ansehen →"). 44 px target.
 * @param {string} href
 * @param {"text"|"accent"|"inverse"} [tone="text"] accent = brass-700 (light surfaces only)
 */
export default function LinkArrow({ href, tone = "text", className, children, ...rest }) {
  const color =
    tone === "accent" ? "text-text-accent" : tone === "inverse" ? "text-text-inverse" : "text-text";
  return (
    <SmartLink
      href={href}
      className={cx(
        "group inline-flex min-h-11 items-center gap-2 text-ui underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current",
        color,
        className
      )}
      {...rest}
    >
      <span>{children}</span>
      <ArrowRight aria-hidden="true" className="ph-arrow size-4 shrink-0" strokeWidth={1.5} />
    </SmartLink>
  );
}
