"use client";
// src/components/Einblicke/HeatmapCanvas.js – Heatmap-Overlay der lokalen
// Vorschau /de/preview/einblicke (dieselbe Darstellung, die die Frappe-Seite
// „Heatmap“ zeichnet). Eigenes Canvas, keine Bibliothek, kein CDN.
// Ebenen: klicks (Seitenraster), elemente (Element-Klicks über die Boxen des
// Screenshot-Manifests – exakt auch nach Layoutänderungen), bewegung
// (Desktop-Mausraster), scroll (Anteil der Aufrufe je Tiefe), aufmerksamkeit
// (Median-Sichtzeit je Abschnitt, Boxen aus dem Manifest).
import { useCallback, useEffect, useRef, useState } from "react";

const REF_WIDTH = { Handy: 390, Tablet: 834, Desktop: 1440 };

// Farbskala niedrig → hoch (blau, grün, gelb, rot), 256 Stufen.
function palette() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 1;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0.0, "rgba(0,0,255,0)");
  grad.addColorStop(0.2, "#2b6cff");
  grad.addColorStop(0.45, "#16c172");
  grad.addColorStop(0.7, "#ffd23f");
  grad.addColorStop(1.0, "#e4002b");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 1);
  return g.getImageData(0, 0, 256, 1).data;
}

function drawHeat(ctx, points, w, h, radius) {
  if (!points.length) return;
  const max = Math.max(...points.map((p) => p[2]));
  const shadow = document.createElement("canvas");
  shadow.width = w;
  shadow.height = h;
  const s = shadow.getContext("2d");
  for (const [x, y, n] of points) {
    const g = s.createRadialGradient(x, y, 0, x, y, radius);
    const a = Math.max(0.08, Math.min(1, n / max));
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    s.fillStyle = g;
    s.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const img = s.getImageData(0, 0, w, h);
  const pal = palette();
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (!a) continue;
    d[i] = pal[a * 4];
    d[i + 1] = pal[a * 4 + 1];
    d[i + 2] = pal[a * 4 + 2];
    d[i + 3] = Math.min(220, a * 1.2);
  }
  ctx.putImageData(img, 0, 0);
}

// Hinweis unter dem Bild: reine Ableitung aus Daten, Ebene und Manifest (kein
// Zustand, der im Effect gesetzt wird – react-hooks/set-state-in-effect).
export function heatmapHinweis(ebene, heat, manifest) {
  if (!heat) return "";
  const boxes = manifest?.elemente || {};
  if (ebene === "elemente") {
    if (!manifest) return "Kein Manifest: Element-Klicks brauchen die Boxen aus dem Screenshot-Manifest. Ebene „Klicks“ zeigt das Seitenraster.";
    const list = heat.element_klicks || [];
    const total = list.reduce((n, e) => n + e.n, 0);
    const missing = list.reduce((n, e) => (boxes[e.sel] ? n : n + e.n), 0);
    if (total && missing / total > 0.2) return `Screenshot älter als die Daten / Layout geändert: ${Math.round((missing / total) * 100)} % der Klicks ohne Box im Manifest.`;
    return "";
  }
  if (ebene === "aufmerksamkeit" && !(heat.aufmerksamkeit || []).some((a) => boxes[a.sel])) return "Aufmerksamkeit braucht die Abschnitts-Boxen aus dem Screenshot-Manifest (Liste unten).";
  return "";
}

export default function HeatmapCanvas({ src, manifest, heat, ebene, geraet }) {
  const canvas = useRef(null);
  const [imgSize, setImgSize] = useState(null);
  const info = heatmapHinweis(ebene, heat, manifest);
  const refWidth = manifest?.breite || REF_WIDTH[geraet] || 1440;
  const docH = heat?.dokumenthoehe_median || 2000;
  const vw = heat?.viewport_breite_median || refWidth;

  // Ohne Screenshot: neutrale Fläche in Referenzbreite, Höhe aus den Daten.
  // Mit Screenshot: Größe des Bildes (auch wenn es vor der Hydration geladen war).
  const size = src ? imgSize : { w: refWidth, h: Math.round((docH * refWidth) / vw) };
  const sizeKey = size ? `${size.w}x${size.h}` : "";
  // Bildgröße über eine Ref-Callback (React 19 mit Aufräumfunktion) statt eines
  // Effects: greift auch, wenn das Bild schon vor der Hydration geladen war, und
  // bei jedem neuen src (load-Ereignis). Gleiche Größe → kein neuer Zustand.
  const imgRef = useCallback((el) => {
    if (!el) return undefined;
    const fromImage = () => {
      if (!el.naturalWidth) return;
      const next = { w: el.naturalWidth, h: el.naturalHeight };
      setImgSize((p) => (p && p.w === next.w && p.h === next.h ? p : next));
    };
    if (el.complete) fromImage();
    el.addEventListener("load", fromImage);
    return () => el.removeEventListener("load", fromImage);
  }, []);

  useEffect(() => {
    if (!sizeKey || !canvas.current || !heat) return;
    const [w, h] = sizeKey.split("x").map(Number);
    const ctx = canvas.current.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    const ys = h / docH; // Besucher-Dokument → Screenshot
    const boxes = manifest?.elemente || {};
    const grid = (cells) => (cells || []).map(([c, b, n]) => [((c + 0.5) / 40) * w, (b + 0.5) * 40 * ys, n]);
    if (ebene === "klicks") drawHeat(ctx, grid(heat.klick_raster?.zellen), w, h, Math.max(18, w / 40));
    else if (ebene === "bewegung") drawHeat(ctx, grid(heat.bewegung_raster?.zellen), w, h, Math.max(22, w / 32));
    else if (ebene === "elemente") {
      const pts = [];
      for (const e of heat.element_klicks || []) {
        const box = boxes[e.sel];
        if (!box) continue; // fehlende Boxen meldet heatmapHinweis()
        const [bx, by, bw, bh] = box;
        for (const [c, r, n] of e.pkt) pts.push([bx + ((c + 0.5) / 20) * bw, by + ((r + 0.5) / 20) * bh, n]);
      }
      drawHeat(ctx, pts, w, h, Math.max(14, w / 60));
    } else if (ebene === "scroll") {
      const hist = heat.scroll_histogramm || [];
      for (let k = 0; k < 20; k++) {
        const share = k === 0 ? 1 : hist[k - 1] ?? 0;
        ctx.fillStyle = `rgba(31,37,43,${(1 - share) * 0.65})`;
        ctx.fillRect(0, (k / 20) * h, w, h / 20 + 1);
      }
      ctx.font = `${Math.max(12, w / 80)}px sans-serif`;
      for (const mark of [0.75, 0.5, 0.25]) {
        const i = hist.findIndex((x) => x < mark);
        if (i < 0) continue;
        const y = ((i + 1) / 20) * h;
        ctx.strokeStyle = "#e4002b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        ctx.fillStyle = "#e4002b";
        ctx.fillText(`${Math.round(mark * 100)} % erreichen diese Tiefe nicht mehr`, 8, y - 6);
      }
    } else if (ebene === "aufmerksamkeit") {
      const list = (heat.aufmerksamkeit || []).filter((a) => boxes[a.sel]);
      const max = Math.max(1, ...list.map((a) => a.median_ms));
      ctx.font = `${Math.max(12, w / 80)}px sans-serif`;
      for (const a of list) {
        const [bx, by, bw, bh] = boxes[a.sel];
        ctx.fillStyle = `rgba(228,0,43,${0.08 + (a.median_ms / max) * 0.4})`;
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = "#1f252b";
        ctx.fillText(`${a.sel}: ${(a.median_ms / 1000).toFixed(1)} s · ${Math.round(a.sichtanteil * 100)} % sehen ihn`, bx + 8, by + 20);
      }
    }
  }, [sizeKey, heat, ebene, manifest, docH]);

  return (
    <figure className="m-0">
      <div className="relative overflow-hidden border border-line bg-surface-band" style={src ? undefined : { aspectRatio: size ? `${size.w} / ${size.h}` : undefined }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- lokaler Screenshot, keine Optimierung gewünscht
          <img ref={imgRef} src={src} alt="Screenshot der Seite (Referenzbreite)" className="block h-auto w-full" />
        ) : null}
        {size ? <canvas ref={canvas} width={size.w} height={size.h} className="absolute inset-0 h-full w-full" aria-hidden="true" /> : null}
      </div>
      <figcaption className="mt-2 text-small text-text-soft">
        {src ? `Screenshot ${refWidth} px` : `Kein Screenshot – neutrale Fläche ${refWidth} px (Screenshots: .data/einblicke/screenshots/)`} · Ebene „{ebene}“
        {info ? <span className="mt-1 block text-notice">{info}</span> : null}
      </figcaption>
    </figure>
  );
}
