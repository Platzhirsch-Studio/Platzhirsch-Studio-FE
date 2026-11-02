import cx from "./cx";

/**
 * Horizontlinie – the signature line (Bibel §6/§8.3): 1 px ink at 24 % over
 * the full container width, max. ONE per page, placed by the parent at ~38 %
 * of the section height. Draws left → right while scrolling where supported;
 * otherwise (and with reduced motion) it simply stands. Decorative.
 * @param {"light"|"dark"} [tone="light"]
 */
export function Horizon({ tone = "light", className }) {
  return (
    <div aria-hidden="true" className={cx("w-full", className)}>
      <div className={cx("ph-horizon__line h-px w-full", tone === "dark" ? "bg-line-inverse" : "bg-line-strong")} />
    </div>
  );
}

/** Hairline divider (12 % ink) – the normal separator. Renders <hr>. */
export function Hairline({ tone = "light", className }) {
  return <hr className={cx("h-px w-full border-0", tone === "dark" ? "bg-line-inverse" : "bg-line", className)} />;
}

export default Horizon;
