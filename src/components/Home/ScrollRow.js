"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { scrollBehavior } from "./calmMotion";

// Horizontal scroll-snap row for phones (R3-startseite: page length) with a
// VISIBLE control: back/forward buttons (44 × 44 px) and a "2 of 6" counter,
// like the Bibel's Gallery (§9, "1 / 6"). Swiping, the scrollbar and focus
// (each card is a link; focusing it scrolls it into view) keep working
// without JS – the buttons only add a way for people who do not swipe.
// From `sm` the row turns into the usual grid via the caller's classes and
// the controls are hidden (`sm:hidden`).
// Reduced motion and the "Ruhige Ansicht" (html[data-motion]): the buttons
// jump instead of scrolling smoothly (calmMotion.js).
//
// Server-rendered children stay server components (the <li> are passed
// through), so the cards stay in the HTML for crawlers.
//
// @param {string} id         id of the list (aria-controls)
// @param {string} label      accessible name of the row (e.g. section title)
// @param {{prev, next, position}} labels   position: "{current} von {total}"
// @param {string} className  classes of the <ul> (mobile row + sm grid)
export default function ScrollRow({ id, label, labels, className, tone = "default", children }) {
  const ref = useRef(null);
  const [state, setState] = useState({ index: 0, total: 0, start: true, end: false });
  const [announcement, setAnnouncement] = useState("");
  const format = (index, total) =>
    String(labels.position).replace("{current}", String(index + 1)).replace("{total}", String(total));

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const items = [...el.children];
      const total = items.length;
      const max = el.scrollWidth - el.clientWidth;
      const left = el.scrollLeft;
      // Current = first card whose left edge is at or after the scroll position.
      const origin = el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).scrollPaddingLeft || "0");
      let index = items.findIndex((li) => li.getBoundingClientRect().left >= origin - 8);
      if (index < 0 || left >= max - 2) index = total - 1;
      setState({ index: Math.max(0, index), total, start: left <= 2, end: left >= max - 2 });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    // ResizeObserver fires once right after observe() → initial state.
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    el.addEventListener("scroll", schedule, { passive: true });
    // QA P3-3: the cards' images are lazy, and browsers only fetch lazy
    // images that are horizontally off-screen late → an empty linen box for
    // up to 1 s while paging. Once the row comes within one viewport of the
    // screen, the remaining images of THIS row switch to eager. Rows are far
    // below the hero, so the LCP image is never competing with them.
    let io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          el.querySelectorAll('img[loading="lazy"]').forEach((img) => {
            img.loading = "eager";
          });
          io.disconnect();
        },
        { rootMargin: "100% 0px" }
      );
      io.observe(el);
    }
    return () => {
      ro.disconnect();
      io?.disconnect();
      el.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const go = (dir) => {
    const el = ref.current;
    if (!el || (dir < 0 && state.start) || (dir > 0 && state.end)) return;
    const items = [...el.children];
    const target = items[Math.min(Math.max(state.index + dir, 0), items.length - 1)];
    if (!target) return;
    const padding = parseFloat(getComputedStyle(el).scrollPaddingLeft || "0");
    const delta = target.getBoundingClientRect().left - (el.getBoundingClientRect().left + padding);
    el.scrollBy({ left: delta, behavior: scrollBehavior() });
    // QA P3-2: tell screen readers where the row now stands ("2 von 4").
    // Only button presses are announced (not swipes), with the target known
    // up front, so the smooth scroll does not produce intermediate messages.
    const next = items.indexOf(target);
    setAnnouncement(format(next, items.length));
  };

  const onDark = tone === "inverse";
  // At an end the button is aria-disabled (not disabled), so keyboard focus
  // never drops to <body>.
  const button = `ph-press inline-flex size-11 items-center justify-center border transition-colors duration-(--duration-micro) aria-disabled:cursor-default aria-disabled:opacity-40 ${
    onDark
      ? "border-line-inverse text-text-inverse hover:border-text-inverse aria-disabled:hover:border-line-inverse"
      : "border-line-strong text-text hover:border-text aria-disabled:hover:border-line-strong"
  }`;
  const position = state.total ? format(state.index, state.total) : "";

  return (
    <div role="group" aria-label={label}>
      <ul ref={ref} id={id} className={className}>
        {children}
      </ul>
      <div className="mt-2 flex items-center justify-end gap-2 sm:hidden">
        <span className={`tabular mr-auto text-small ${onDark ? "text-text-inverse-soft" : "text-text-soft"}`} aria-hidden="true">
          {position}
        </span>
        {/* Polite live region, filled only by the buttons (QA P3-2). */}
        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </span>
        <button type="button" className={button} aria-controls={id} aria-label={labels.prev} aria-disabled={state.start || undefined} onClick={() => go(-1)}>
          <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
        <button type="button" className={button} aria-controls={id} aria-label={labels.next} aria-disabled={state.end || undefined} onClick={() => go(1)}>
          <ChevronRight aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
