"use client";

import { useId, useRef, useState } from "react";

/**
 * Mobile-only shortening of a long FAQ (Yacht, Inhaber-Entscheidung Nr. 11:
 * page ≤ 12 600 px on a phone). Below md only the first four questions show;
 * a button reveals the rest. Every question and answer stays in the HTML
 * (crawlers, FAQPage JSON-LD); from md up nothing is hidden and the button is
 * not rendered visibly. The hiding rule must stay a literal class (Tailwind).
 * @param {number} hiddenCount questions hidden on mobile (for the label)
 * @param {string} [moreLabel] button text (server components cannot pass functions)
 */
export default function FaqMobileMore({ hiddenCount, moreLabel, className, children }) {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const id = useId();
  const reveal = () => {
    setOpen(true);
    // Focus the first question that was hidden, so keyboard and screen-reader
    // users continue where the list grew.
    requestAnimationFrame(() => listRef.current?.querySelector("details:nth-of-type(5) > summary")?.focus());
  };
  return (
    <div className={className}>
      <div
        id={id}
        ref={listRef}
        data-expanded={open ? "" : undefined}
        className="max-md:[&:not([data-expanded])>div>details:nth-of-type(n+5)]:hidden"
      >
        {children}
      </div>
      {hiddenCount > 0 && !open ? (
        <button
          type="button"
          aria-controls={id}
          aria-expanded="false"
          onClick={reveal}
          className="mt-4 inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current md:hidden"
        >
          {moreLabel || `${hiddenCount} weitere Fragen zeigen`}
        </button>
      ) : null}
    </div>
  );
}
