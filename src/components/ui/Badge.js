import cx from "./cx";

// Only facts from backoffice data: "Im Showroom Lochau", "Ausstellungsstück",
// "Neu" (Bibel §9). Never scarcity or popularity ("Nur noch 1", "Beliebt").
const TONES = {
  neutral: "bg-paper text-text border border-line",
  band: "bg-stone text-text",
  inverse: "bg-ink-deep text-paper",
};

/**
 * @param {"neutral"|"band"|"inverse"} [tone="neutral"]
 */
export default function Badge({ as: Tag = "span", tone = "neutral", className, children, ...rest }) {
  return (
    <Tag className={cx("inline-flex items-center px-2 py-1 text-small font-medium", TONES[tone] ?? TONES.neutral, className)} {...rest}>
      {children}
    </Tag>
  );
}
