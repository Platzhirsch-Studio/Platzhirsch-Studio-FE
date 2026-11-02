import cx from "./cx";

/**
 * Intro paragraph: 20–22 px, max. 68 characters per line.
 * @param {"text"|"soft"|"inverse"} [tone="text"]
 */
export default function Lead({ as: Tag = "p", tone = "text", className, children, ...rest }) {
  const color = tone === "soft" ? "text-text-soft" : tone === "inverse" ? "text-text-inverse-soft" : "text-text";
  return (
    <Tag className={cx("max-w-measure text-lead", color, className)} {...rest}>
      {children}
    </Tag>
  );
}
