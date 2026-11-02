"use client";
// Zählt sanft zum neuen Wert, sofort bei prefers-reduced-motion.
// Screenreader lesen nur den Endwert (aria-live sitzt am Ergebnis-Container).
// R5: eigener rAF-Tween statt motion `animate` – `animate` zog die ganze
// Animations-Engine ins Initial-JS und hätte LazyMotion wirkungslos gemacht.
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../motion";

const DURATION_MS = 700;

// cubic-bezier(0.22, 1, 0.36, 1) wie EASE in den übrigen Labs-Animationen.
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}
const ease = bezier(0.22, 1, 0.36, 1);

export default function AnimatedNumber({ value, format, className }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduce || typeof requestAnimationFrame !== "function") {
      from.current = value;
      return undefined;
    }
    const start = from.current;
    if (start === value) return undefined;
    let raf = 0;
    let t0 = 0;
    const step = (now) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / DURATION_MS);
      const v = start + (value - start) * ease(p);
      from.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);

  return <span className={className}>{format(reduce ? value : shown)}</span>;
}
