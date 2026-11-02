import cx from "./cx";

const SIZES = {
  page: "max-w-page", // 1440 px
  text: "max-w-text", // 720 px, long-form text
  full: "max-w-none",
};

/**
 * Horizontal frame: centred, max width, responsive gutter (20 / 48 / 80 px).
 * @param {"page"|"text"|"full"} [size="page"]
 * @param {string} [as="div"]
 */
export default function Container({ as: Tag = "div", size = "page", className, children, ...rest }) {
  return (
    <Tag className={cx("mx-auto w-full px-gutter", SIZES[size] ?? SIZES.page, className)} {...rest}>
      {children}
    </Tag>
  );
}
