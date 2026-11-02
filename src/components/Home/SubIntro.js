import { cx } from "@/components/ui";

/**
 * Head of a block INSIDE a homepage chapter (B12, 31.10.2026: the homepage
 * has at most 9 chapters, so former chapters such as "Mehr als Möbel",
 * "Vorab ausprobieren" or the brands now sit as blocks in a neighbouring
 * chapter). H3 in the title role – no eyebrow, no Bodoni display, no
 * .ph-chapter lift (Design-Jury P1-2: one main movement per viewport; the
 * chapter H2 above already moves). A strong rule on top separates the block.
 * Lead: from 640 px on; on phones it stays for screen readers (page length,
 * same pattern as the USP chapter lead in Process.js).
 * @param {string} id      heading id (aria-labelledby of the block)
 * @param {string} title
 * @param {string} [lead]
 * @param {ReactNode} [aside] e.g. a LinkArrow to the full overview
 */
export default function SubIntro({ id, title, lead, aside, className }) {
  return (
    <div className={cx("grid grid-cols-1 gap-2 lg:grid-cols-12 lg:items-baseline lg:gap-x-grid", className)}>
      <h3 id={id} className="text-title text-balance text-text lg:col-span-6">
        {title}
      </h3>
      {(lead || aside) && (
        <div className="lg:col-span-5 lg:col-start-8">
          {lead && <p className="max-w-measure text-body text-text-soft max-sm:sr-only">{lead}</p>}
          {aside && <div className={lead ? "sm:mt-3" : undefined}>{aside}</div>}
        </div>
      )}
    </div>
  );
}

/** Wrapper classes of such a block: rule on top, space above (B12). */
export const SUB_BLOCK = "mt-8 border-t border-line-strong pt-5 sm:mt-16 sm:pt-8";
