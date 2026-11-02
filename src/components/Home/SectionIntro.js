import { Eyebrow, Heading, Lead, cx } from "@/components/ui";
import { kernDisplay } from "./kern";

/**
 * Asymmetric section head of the homepage (Bibel §6: text in columns 1–6,
 * lead offset to 8–12 on desktop; stacked on mobile, 16 px gap on phones –
 * R3 page length).
 * @param {string} id        heading id (Section labelledBy)
 * @param {string} eyebrow
 * @param {string} title     H2
 * @param {string} [lead]
 * @param {ReactNode} [aside] e.g. a LinkArrow under the lead
 * @param {boolean} [inverse] on the walnut surface
 * @param {boolean} [stacked] no desktop columns (inside a narrow column)
 * @param {string} [titleClassName] extra classes for the H2 (e.g. text-wrap)
 * QM shell-home r3 (iPad hoch): WebKit laid out "Von Hand gezeichnet, bevor es
 * digital wird." 8 px wider than its box (Bodoni opsz) – pr-[0.2em] keeps the
 * ink inside the content column.
 */
export default function SectionIntro({ id, eyebrow, title, lead, aside, inverse = false, stacked = false, className, titleClassName }) {
  return (
    <div className={cx("grid grid-cols-1 gap-4 sm:gap-stack-m", !stacked && "lg:grid-cols-12 lg:items-end", className)}>
      <div className={stacked ? undefined : "lg:col-span-6"}>
        <Eyebrow tone={inverse ? "inverse" : "accent"}>{eyebrow}</Eyebrow>
        <Heading id={id} level={2} tone={inverse ? "inverse" : "text"} className={cx("mt-stack-s pr-[0.2em]", titleClassName)}>
          {kernDisplay(title)}
        </Heading>
      </div>
      {(lead || aside) && (
        <div className={stacked ? undefined : "lg:col-span-5 lg:col-start-8"}>
          {lead && <Lead tone={inverse ? "inverse" : "soft"}>{lead}</Lead>}
          {aside && <div className="mt-4">{aside}</div>}
        </div>
      )}
    </div>
  );
}
