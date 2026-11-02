"use client";
// QM planer-tools r4: seitlich scrollende Leiste (Reiter bei großer Schrift) mit
// Verlauf + Pfeil an der Seite, an der es weitergeht – vorher wurde „Materi|“
// hart am Rand abgeschnitten, ohne Hinweis aufs Weiterwischen.
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/** Welche Seiten haben verdeckten Inhalt? (1 px Toleranz gegen Rundung) */
export function edgeState(scrollLeft, clientWidth, scrollWidth) {
  const max = scrollWidth - clientWidth;
  if (max <= 1) return { l: false, r: false };
  return { l: scrollLeft > 1, r: scrollLeft < max - 1 };
}

const ScrollStrip = forwardRef(function ScrollStrip({ className = "", fadeFrom = "from-stone", fadeVia = "via-stone/85", children, ...rest }, outerRef) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ l: false, r: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = edgeState(el.scrollLeft, el.clientWidth, el.scrollWidth);
    setEdge((p) => (p.l === next.l && p.r === next.r ? p : next));
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    update();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro?.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [update]);
  const setRef = (el) => {
    ref.current = el;
    if (typeof outerRef === "function") outerRef(el);
    else if (outerRef) outerRef.current = el;
  };
  // QM r5: Pfeil auf deckendem Grund (erste Hälfte voll), erst danach der Verlauf – bei 200 % Text
  // lag der Pfeil sonst direkt auf den Buchstaben („←aum“, „Mate→“).
  const fade = "pointer-events-none absolute inset-y-0 z-[1] flex w-12 items-center from-50% via-75% text-ink-soft transition-opacity duration-200 motion-reduce:transition-none";
  return (
    <div className="relative flex min-w-0 flex-1">
      <div ref={setRef} className={className} {...rest}>
        {children}
      </div>
      <span aria-hidden="true" data-kp-strip-l={edge.l ? "on" : "off"} className={`${fade} left-0 justify-start bg-linear-to-r ${fadeFrom} ${fadeVia} to-transparent pl-0.5 ${edge.l ? "opacity-100" : "opacity-0"}`}>
        <ArrowLeft size={15} />
      </span>
      <span aria-hidden="true" data-kp-strip-r={edge.r ? "on" : "off"} className={`${fade} right-0 justify-end bg-linear-to-l ${fadeFrom} ${fadeVia} to-transparent pr-0.5 ${edge.r ? "opacity-100" : "opacity-0"}`}>
        <ArrowRight size={15} />
      </span>
    </div>
  );
});

export default ScrollStrip;
