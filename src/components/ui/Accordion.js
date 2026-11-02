import { Plus } from "lucide-react";
import cx from "./cx";

/**
 * One disclosure – native <details>/<summary> (Bibel §14: accordions are
 * <details>). Content stays in the HTML for crawlers and find-in-page.
 * @param {ReactNode} title
 * @param {boolean} [open]
 * @param {string} [name]  same name on several items = only one open at a time
 * @param {2|3|4} [headingLevel] wrap the title in a heading for the outline
 */
export function AccordionItem({ title, open = false, name, headingLevel, id, className, children }) {
  const H = headingLevel ? `h${headingLevel}` : "span";
  return (
    <details className={cx("ph-accordion border-b border-line", className)} open={open || undefined} name={name} id={id}>
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4 text-left">
        <H className="text-ui text-text">{title}</H>
        <Plus aria-hidden="true" className="ph-accordion__icon size-5 shrink-0 text-text-soft" strokeWidth={1.5} />
      </summary>
      <div className="max-w-measure pb-6 text-body text-text-soft">{children}</div>
    </details>
  );
}

/**
 * List of disclosures with a top hairline.
 * @param {Array<{id?, title, content, open?}>} [items] or pass <AccordionItem> children
 * @param {string} [name] exclusive group (one open at a time)
 * @param {2|3|4} [headingLevel]
 */
export default function Accordion({ items, name, headingLevel, className, children }) {
  return (
    <div className={cx("border-t border-line", className)}>
      {items
        ? items.map((item, i) => (
            <AccordionItem
              key={item.id ?? i}
              id={item.id}
              title={item.title}
              open={item.open}
              name={name}
              headingLevel={headingLevel}
            >
              {item.content}
            </AccordionItem>
          ))
        : children}
    </div>
  );
}
