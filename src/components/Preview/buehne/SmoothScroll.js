"use client";

import { useEffect } from "react";

// Lenis smooth scrolling for the prototype only. Deliberately conservative:
// - never under prefers-reduced-motion (and it switches off live if the
//   setting changes),
// - only on fine pointers (mouse/trackpad); touch keeps native scrolling,
// - loaded with a dynamic import after the first paint, so it never touches
//   LCP and costs nothing on phones.
// Lenis drives the native window scroll, so CSS scroll-driven animations,
// position: sticky, anchors and the keyboard keep working.
export default function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(pointer: fine)");
    let lenis = null;
    let cancelled = false;

    async function start() {
      if (lenis || reduce.matches || !fine.matches) return;
      const { default: Lenis } = await import("lenis");
      if (cancelled || reduce.matches) return;
      lenis = new Lenis({ autoRaf: true, lerp: 0.11, anchors: true, smoothWheel: true });
    }
    function stop() {
      lenis?.destroy();
      lenis = null;
    }
    function onChange() {
      if (reduce.matches || !fine.matches) stop();
      else start();
    }

    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
    idle(() => start());
    reduce.addEventListener("change", onChange);
    fine.addEventListener("change", onChange);
    return () => {
      cancelled = true;
      reduce.removeEventListener("change", onChange);
      fine.removeEventListener("change", onChange);
      stop();
    };
  }, []);

  return null;
}
