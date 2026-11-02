import cx from "./cx";

// Mobile first: 1 column, then up. Galleries max. 3 columns (§6).
const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  12: "grid-cols-4 md:grid-cols-8 xl:grid-cols-12", // layout grid 4/8/12 (§6)
};

/**
 * Responsive grid with the system gap (16 / 24 / 32 px).
 * @param {1|2|3|4|12} [cols=3]
 * @param {string} [as="div"] e.g. "ul" for lists of cards
 */
export default function Grid({ as: Tag = "div", cols = 3, className, children, ...rest }) {
  return (
    <Tag className={cx("grid gap-grid", COLS[cols] ?? COLS[3], className)} {...rest}>
      {children}
    </Tag>
  );
}
