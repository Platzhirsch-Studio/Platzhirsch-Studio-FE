"use client";

import { useEffect, useRef } from "react";

/**
 * Wrapper for a list that becomes a horizontal scroll-snap row on phones
 * (Inhaber-Entscheidung Nr. 11: Yacht-Seite mobil ≤ 12 600 px). The row classes
 * come from the caller (max-sm:/max-md: variants, desktop unchanged). Only
 * while the row really scrolls (below `query`) is it a named, focusable region,
 * so keyboard users can scroll it (axe scrollable-region-focusable) – on
 * desktop it stays a plain <div> without an extra tab stop.
 * @param {string} label accessible name of the row
 * @param {string} [query] media query in which the row scrolls
 */
export default function MobileSnapRow({ label, query = "(max-width: 639.98px)", className, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const mq = window.matchMedia(query);
    const apply = () => {
      if (mq.matches) {
        el.setAttribute("tabindex", "0");
        el.setAttribute("role", "region");
        el.setAttribute("aria-label", label);
      } else {
        el.removeAttribute("tabindex");
        el.removeAttribute("role");
        el.removeAttribute("aria-label");
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [label, query]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
