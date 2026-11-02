"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// "Weiterlesen" for the homepage SEO text on phones (R3-startseite: page
// length). The text is always server-rendered in full (crawlers, mobile-first
// indexing); on phones, until the button opens it, the first paragraph is
// clamped to four lines and the others are hidden with CSS. From `sm`
// everything is visible and the button is not shown. No animation (reduced
// motion safe). Children: the <p> elements.
// R5-USP: `everywhere` clamps on every width (SEO block at the page end:
// first paragraph in three lines, the rest behind "Weiterlesen").
export default function MoreText({ id, more, less, everywhere = false, children }) {
  const [open, setOpen] = useState(false);
  const closed = everywhere
    ? " [&>p:first-child]:line-clamp-3 [&>p:not(:first-child)]:hidden"
    : " max-sm:[&>p:first-child]:line-clamp-4 max-sm:[&>p:not(:first-child)]:hidden";
  return (
    <>
      <div
        id={id}
        className={`space-y-5${open ? "" : closed}`}
      >
        {children}
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={`mt-2 inline-flex min-h-11 items-center gap-2 text-ui text-text underline decoration-line-strong underline-offset-4 hover:decoration-current${everywhere ? "" : " sm:hidden"}`}
      >
        {open ? less : more}
        <ChevronDown aria-hidden="true" className={`size-4 ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>
    </>
  );
}
