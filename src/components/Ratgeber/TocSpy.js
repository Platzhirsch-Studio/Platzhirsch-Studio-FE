"use client";
// QM content-legal r2: the sticky table of contents shows where the reader is
// (scrollspy). Marks the link of the section heading last scrolled past the
// upper third with aria-current="location"; the style comes from the
// [aria-current] classes in RatgeberArticle (no colour as the only cue: weight
// and the left rule change). No layout shift, no motion.
import { useEffect, useRef } from "react";
import { activeTocId } from "@/lib/ratgeber/tocSpy";

export default function TocSpy({ ids, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !ids?.length) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const tops = ids.map((id) => {
        const el = document.getElementById(id);
        return { id, top: el ? el.getBoundingClientRect().top : Infinity };
      });
      // QM r3 (iPad quer): reading line at 45 % – a heading in the upper third was
      // not yet marked; at the bottom of the page the last heading in view wins.
      const vh = window.innerHeight;
      const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 4;
      const current = activeTocId(tops, vh * 0.45, { atEnd, viewport: vh });
      root.querySelectorAll("a[href^='#']").forEach((a) => {
        if (a.getAttribute("href") === `#${current}`) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ids]);
  return <div ref={ref}>{children}</div>;
}
