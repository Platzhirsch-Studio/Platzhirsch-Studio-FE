"use client";
// Prototyp „Die Linie wird Raum“ – die einzige Scroll-Logik der Seite.
//
// Schreibt den Fortschritt der Bühne als CSS-Variablen (--p gesamt, --l Linie,
// --s Skizze, --m Modell, --r Raum, --e Ende) und die aktive Stufe als
// data-step. ALLES Sichtbare (Strichanimation über stroke-dashoffset,
// Faltung des Modells, Ausschnitt des Fotos) rechnet das CSS aus diesen
// Werten – keine React-Renders beim Scrollen, ein rAF pro Frame, nur
// transform/opacity/clip-path/stroke-dashoffset.
//
// Aus bei prefers-reduced-motion und in der „Ruhigen Ansicht“
// (html[data-motion="reduced"], FooterIslands.js): dann setzt das CSS alle
// Stufen untereinander und vollständig gezeichnet (unikat.module.css, „static“).
//
// Bleistift: nur bei feinem Zeiger (Maus/Stift) und mit Bewegung – eine kurze
// Graphitspur auf <canvas data-pencil>, die nach ~0,9 s verblasst.
import { useEffect, useRef } from "react";

const clamp = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (p, a, b) => clamp((p - a) / (b - a));
// Stufen-Grenzen (Anteil des Scrollwegs der Bühne)
const STEPS = [0.05, 0.2, 0.44, 0.66, 0.86];
const TRAIL_MS = 900;

function calmNow() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced";
}

export default function ScrollStage({ className, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const viewport = el.querySelector("[data-viewport]");
    const canvas = el.querySelector("canvas[data-pencil]");
    let raf = 0;
    let step = -1;
    let stickyTop = 0;
    let active = false;
    const vars = ["--p", "--l", "--s", "--m", "--r", "--e"];

    const measure = () => {
      stickyTop = viewport ? parseFloat(getComputedStyle(viewport).top) || 0 : 0;
    };

    const frame = () => {
      raf = 0;
      if (!active) return;
      const r = el.getBoundingClientRect();
      const h = viewport ? viewport.offsetHeight : window.innerHeight;
      const total = Math.max(1, r.height - h);
      const p = clamp((stickyTop - r.top) / total);
      const values = [p, 0.06 + 0.94 * seg(p, 0, 0.2), seg(p, 0.16, 0.44), seg(p, 0.42, 0.68), seg(p, 0.66, 0.88), seg(p, 0.86, 0.98)];
      for (let i = 0; i < vars.length; i++) el.style.setProperty(vars[i], values[i].toFixed(4));
      let s = 0;
      while (s < STEPS.length && p >= STEPS[s]) s++;
      if (s !== step) {
        step = s;
        el.dataset.step = String(s);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    // --- Bleistift-Spur -------------------------------------------------
    let points = [];
    let trailRaf = 0;
    let ctx = null;
    let dpr = 1;
    const sizeCanvas = () => {
      if (!canvas) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx = canvas.getContext("2d");
    };
    const drawTrail = () => {
      trailRaf = 0;
      if (!ctx) return;
      const now = performance.now();
      points = points.filter((q) => now - q.t < TRAIL_MS);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        if (b.t - a.t > 80) continue; // Zeiger abgesetzt
        const age = (now - b.t) / TRAIL_MS;
        ctx.strokeStyle = `rgba(48,55,62,${(0.42 * (1 - age)).toFixed(3)})`;
        ctx.lineWidth = 1.1 + 0.5 * (1 - age);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      if (points.length) trailRaf = requestAnimationFrame(drawTrail);
    };
    const onPointer = (e) => {
      if (e.pointerType === "touch" || !canvas) return;
      const box = canvas.getBoundingClientRect();
      points.push({ x: e.clientX - box.left, y: e.clientY - box.top, t: performance.now() });
      if (points.length > 64) points.shift();
      if (!trailRaf) trailRaf = requestAnimationFrame(drawTrail);
    };
    const finePointer = window.matchMedia("(pointer: fine)");

    const start = () => {
      if (active) return;
      active = true;
      el.dataset.live = "";
      measure();
      frame();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      if (finePointer.matches && viewport && canvas) {
        sizeCanvas();
        viewport.addEventListener("pointermove", onPointer, { passive: true });
      }
    };
    const stop = () => {
      if (!active) return;
      active = false;
      delete el.dataset.live;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      viewport?.removeEventListener("pointermove", onPointer);
      for (const v of vars) el.style.removeProperty(v);
      delete el.dataset.step;
      step = -1;
      points = [];
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    const sync = () => (calmNow() ? stop() : start());

    sync();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener?.("change", sync);
    // „Ruhige Ansicht“ wird zur Laufzeit am <html> umgeschaltet
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    const ro = canvas ? new ResizeObserver(() => active && finePointer.matches && sizeCanvas()) : null;
    ro?.observe(canvas);

    return () => {
      stop();
      mq.removeEventListener?.("change", sync);
      mo.disconnect();
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      if (trailRaf) cancelAnimationFrame(trailRaf);
    };
  }, []);

  return (
    <div ref={ref} className={className} data-unikat-track="">
      {children}
    </div>
  );
}
