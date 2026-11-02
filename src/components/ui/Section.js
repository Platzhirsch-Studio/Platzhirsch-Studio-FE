import cx from "./cx";
import Container from "./Container";

// Surfaces (Bibel §4.2). "inverse" (walnut) is allowed ONCE per page – it
// carries data-surface="inverse" so the QA test can count it and the focus
// ring switches to brass. It gets the 1 px brass line on top (§4.2, one of
// brass's three decorative places).
const TONES = {
  surface: "bg-surface text-text",
  raised: "bg-surface-raised text-text",
  band: "bg-surface-band text-text",
  inverse: "bg-surface-inverse text-text-inverse border-t border-accent-on-dark",
};

const SPACING = {
  default: "py-section",
  compact: "py-16 md:py-20",
  none: "",
};

/**
 * Page section with vertical rhythm and surface.
 * @param {"surface"|"raised"|"band"|"inverse"} [tone="surface"]
 * @param {"default"|"compact"|"none"} [spacing="default"] default = 96/128/176 px
 * @param {boolean|"page"|"text"} [contained=true] wrap children in <Container>
 * @param {string} [labelledBy] id of the section heading (aria-labelledby)
 */
export default function Section({
  as: Tag = "section",
  tone = "surface",
  spacing = "default",
  contained = true,
  labelledBy,
  className,
  containerClassName,
  children,
  ...rest
}) {
  const inner = contained ? (
    <Container size={typeof contained === "string" ? contained : "page"} className={containerClassName}>
      {children}
    </Container>
  ) : (
    children
  );
  return (
    <Tag
      aria-labelledby={labelledBy}
      data-surface={tone === "inverse" ? "inverse" : undefined}
      className={cx(TONES[tone] ?? TONES.surface, SPACING[spacing] ?? SPACING.default, className)}
      {...rest}
    >
      {inner}
    </Tag>
  );
}
