// „Ein Tag am See“ – the page's quiet clock (visual-design 31.10.2026).
// A hairline at the right screen edge (from lg) whose colour runs from
// morning haze over lake-green day and brass evening to night; a small sun
// travels down it as the visitor scrolls the page, and turns into the moon at
// the end, where the closing invites to an evening on board. Pure CSS
// (scroll-driven animation on the root scroller), decorative (aria-hidden),
// 0 KB JS, compositor only (transform/opacity) – no layout, no CLS. Hidden
// where scroll-driven animations are unsupported, with reduced motion and
// with "Ruhige Ansicht". Server component.
import styles from "./dayArc.module.css";

export default function DayArc() {
  return (
    <div aria-hidden="true" className={styles.arc} data-yacht-dayarc="">
      <span className={styles.line} />
      <span className={styles.sun} />
    </div>
  );
}
