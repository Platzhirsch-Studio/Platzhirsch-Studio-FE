"use client";
// src/components/Ezarri/CustomMix/MosaikFlaeche.js – <canvas> mit der gemischten
// Mosaikfläche (Team C). Zeichnet mit lib/ezarri/rechner/flaeche2d.js, passt sich
// der Breite an (ResizeObserver), DPR höchstens 2. Die Canvas ist aria-hidden;
// die Beschreibung steht als Text daneben (Mischpult).
import { useEffect, useRef } from "react";
import { drawMosaic, rasterFuer } from "@/lib/ezarri/rechner/flaeche2d";

export default function MosaikFlaeche({ mix, toene, fuge, format, seed, wasser, meter = 1, onCounts, className = "" }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const countsRef = useRef(onCounts);
  useEffect(() => {
    countsRef.current = onCounts;
  }, [onCounts]);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return undefined;
    let frame = 0;
    const draw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const cssW = Math.max(1, Math.round(el.clientWidth));
        const cssH = cssW; // quadratischer Ausschnitt (Format „Material“ 1:1)
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(cssW * dpr);
        cv.height = Math.round(cssH * dpr);
        cv.style.height = `${cssH}px`;
        const ctx = cv.getContext("2d");
        if (!ctx) return;
        if (!mix.length) {
          ctx.clearRect(0, 0, cv.width, cv.height);
          countsRef.current?.([], 0);
          return;
        }
        const { cols, rows } = rasterFuer(format, meter, meter);
        const counts = drawMosaic(ctx, { width: cv.width, height: cv.height, cols, rows, format, mix, toene, fuge, seed, wasser });
        countsRef.current?.(counts, cols * rows);
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [mix, toene, fuge, format, seed, wasser, meter]);

  return (
    <div ref={wrap} className={`relative aspect-square w-full bg-linen ${className}`}>
      <canvas ref={canvas} aria-hidden="true" className="block w-full" data-mosaik-canvas />
    </div>
  );
}
