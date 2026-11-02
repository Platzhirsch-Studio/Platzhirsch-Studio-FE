"use client";
// The actual <model-viewer> stage. Only ever loaded through next/dynamic with
// ssr:false from ArViewerApp, and only after the visitor asks for 3D — so the
// ~250 KB (gzip) of model-viewer + three.js never touch the first paint.
import { useEffect, useId, useRef, useState } from "react";
import { ModelViewerElement } from "@google/model-viewer";
import styles from "./ArViewer.module.css";
import { STUDIO_HDR_PATH } from "./studioHdr";

// DSGVO: model-viewer would otherwise fetch the Draco/KTX2 decoders from
// www.gstatic.com. We host them ourselves (copied from three/examples/jsm/libs).
// Must be set before the first <model-viewer> loads a model.
ModelViewerElement.dracoDecoderLocation = "/labs/ar-viewer/decoders/draco/";
ModelViewerElement.ktx2TranscoderLocation = "/labs/ar-viewer/decoders/basis/";

// Dimension overlay after the model-viewer "dimensions" example.
const DOTS = [
  "hotspot-dot+X-Y+Z",
  "hotspot-dot+X-Y-Z",
  "hotspot-dot+X+Y-Z",
  "hotspot-dot-X+Y-Z",
  "hotspot-dot-X-Y-Z",
  "hotspot-dot-X-Y+Z",
];
// [from, to, label] — every line belongs to exactly one label; line and label
// are shown and hidden together (QA round 1: lines without labels stayed behind).
const LINES = [
  ["hotspot-dot+X-Y+Z", "hotspot-dot+X-Y-Z", "hotspot-dim+X-Y"],
  ["hotspot-dot+X-Y-Z", "hotspot-dot+X+Y-Z", "hotspot-dim+X-Z"],
  ["hotspot-dot+X+Y-Z", "hotspot-dot-X+Y-Z", "hotspot-dim+Y-Z"],
  ["hotspot-dot-X+Y-Z", "hotspot-dot-X-Y-Z", "hotspot-dim-X-Z"],
  ["hotspot-dot-X-Y-Z", "hotspot-dot-X-Y+Z", "hotspot-dim-X-Y"],
];

// Fixed 3/4 view from the front right for "Maße anzeigen": shows width (top),
// depth and height (right side). Radius in % of model-viewer's ideal distance,
// more on portrait/square stages so box + labels keep ~10 % margin. Narrow
// phone stages (R2, Auflage 1) step back further so depth and height labels on
// the right side fit as well; the Maßleiste under the stage (ArViewerApp) shows
// all three values regardless.
const dimsOrbit = (mv, nudge = false) => {
  const portrait = mv.clientWidth / Math.max(1, mv.clientHeight) < 1.15;
  const narrow = mv.clientWidth < 500;
  const r = (narrow ? 175 : portrait ? 155 : 138) + (nudge ? 0.01 : 0);
  return `35deg 68deg ${r}%`;
};
const DIMS_THETA = (35 * Math.PI) / 180;
const EDGE = 6; // px safety margin inside the stage

const cm = (m) => `${Math.round(m * 100)} cm`;

// box (optional): Herstellermaße in Metern {x, y, z}, Grundfläche mittig im Ursprung.
// AR-Foto (QA R1 P2-4): die Bounding Box enthält die Foto-Fläche (z. B. 107 cm hoch
// statt 50 cm laut Datenblatt) – angezeigt werden dürfen nur Datenblatt-Werte.
function placeDimensionHotspots(mv, box = null) {
  const c = box ? { x: 0, y: box.y / 2, z: 0 } : mv.getBoundingBoxCenter();
  const s = box ? { x: box.x, y: box.y, z: box.z } : mv.getDimensions();
  const x = s.x / 2, y = s.y / 2, z = s.z / 2;
  const set = (name, px, py, pz) => mv.updateHotspot({ name, position: `${px} ${py} ${pz}` });
  set("hotspot-dot+X-Y+Z", c.x + x, c.y - y, c.z + z);
  set("hotspot-dim+X-Y", c.x + x * 1.2, c.y - y * 1.1, c.z);
  set("hotspot-dot+X-Y-Z", c.x + x, c.y - y, c.z - z);
  set("hotspot-dim+X-Z", c.x + x * 1.2, c.y, c.z - z * 1.2);
  set("hotspot-dot+X+Y-Z", c.x + x, c.y + y, c.z - z);
  set("hotspot-dim+Y-Z", c.x, c.y + y * 1.1, c.z - z * 1.1);
  set("hotspot-dot-X+Y-Z", c.x - x, c.y + y, c.z - z);
  set("hotspot-dim-X-Z", c.x - x * 1.2, c.y, c.z - z * 1.2);
  set("hotspot-dot-X-Y-Z", c.x - x, c.y - y, c.z - z);
  set("hotspot-dim-X-Y", c.x - x * 1.2, c.y - y * 1.1, c.z);
  set("hotspot-dot-X-Y+Z", c.x - x, c.y - y, c.z + z);
  return s;
}

export default function ModelStage({
  model,
  variant,
  showDims,
  showHotspots,
  activeHotspot,
  onHotspot,
  reducedMotion,
  onLoaded,
  onError,
  onArStatus,
  onVariantApplied,
  resetSignal,
  dimsBox = null,
}) {
  const mvRef = useRef(null);
  const svgRef = useRef(null);
  // useId contains ":" / "«»", not valid inside url(#…) everywhere.
  const maskId = `dim-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const drawRef = useRef(null);
  // QA R2 P3: React setzt bei Custom Elements nur die Property „alt“ (model-viewer
  // spiegelt sie nicht ins Attribut) – das Attribut für Screenreader/Prüfwerkzeuge setzen.
  const altText = `3D-Ansicht: ${model.name} (${model.posterAlt})`;
  useEffect(() => {
    mvRef.current?.setAttribute("alt", altText);
  }, [altText]);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [size, setSize] = useState(null);
  // Studio-HDR (R4): erst vorladen, dann setzen. Bis dahin und bei Fehler,
  // Zeitüberschreitung (6 s) oder offline bleibt das eingebaute "neutral" –
  // ein fehlendes HDR darf nie als Modell-Fehler (error-Event) enden.
  const [envImage, setEnvImage] = useState(null);
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    fetch(STUDIO_HDR_PATH, { signal: ctrl.signal, cache: "force-cache" })
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((buf) => {
        if (buf.byteLength > 1000) setEnvImage(STUDIO_HDR_PATH);
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  // Keep callbacks fresh without re-binding listeners.
  const cb = useRef({});
  useEffect(() => {
    cb.current = { onLoaded, onError, onArStatus, onVariantApplied, variant, showDims, dimsBox };
  });

  // R4 Fehlerfall: WebKit meldet einen abgebrochenen .glb-Abruf nur als
  // "TypeError: Load failed" in der Konsole, model-viewer feuert dann kein
  // "error" – die Bühne bliebe ohne Hinweis auf dem Poster stehen. Wächter:
  // offline vor dem Laden oder 30 s ohne Fortschritt (langsame Netze laden
  // weiter, solange "progress" kommt) → derselbe Fehlerpfad.
  useEffect(() => {
    const mv = mvRef.current;
    if (!mv) return undefined;
    const fail = (type) => {
      if (!mv.loaded) cb.current.onError?.(type);
    };
    let timer;
    // QA R1 P2-3: WebKit meldet abgebrochene Abrufe nie – dort schon nach 15 s ohne
    // Fortschritt abbrechen (Chromium meldet Fehler selbst, 30 s bleiben als Netz).
    const webkit = typeof navigator !== "undefined" && /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Android/.test(navigator.userAgent);
    const limit = webkit ? 15000 : 30000;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => fail("timeout"), limit);
    };
    arm();
    const onOffline = () => fail("offline");
    if (typeof navigator !== "undefined" && navigator.onLine === false) onOffline();
    window.addEventListener("offline", onOffline);
    const done = () => clearTimeout(timer);
    mv.addEventListener("progress", arm);
    mv.addEventListener("load", done);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("offline", onOffline);
      mv.removeEventListener("progress", arm);
      mv.removeEventListener("load", done);
    };
  }, [model.src]);

  useEffect(() => {
    const mv = mvRef.current;
    if (!mv) return undefined;

    const drawLines = () => {
      const svg = svgRef.current;
      if (!svg || !cb.current.showDims) return;
      const lines = svg.querySelectorAll("line");
      const holes = svg.querySelectorAll("rect[data-dim-hole]");
      const W = mv.clientWidth;
      const H = mv.clientHeight;
      const inside = (p, hw = 0, hh = 0) =>
        p.x - hw >= EDGE && p.x + hw <= W - EDGE && p.y - hh >= EDGE && p.y + hh <= H - EDGE;
      LINES.forEach(([a, b, dim], i) => {
        const p1 = mv.queryHotspot(a);
        const p2 = mv.queryHotspot(b);
        const d = mv.queryHotspot(dim);
        const line = lines[i];
        const label = mv.querySelector(`[slot="${dim}"]`);
        if (!p1 || !p2 || !d || !line) return;
        line.setAttribute("x1", p1.canvasPosition.x);
        line.setAttribute("y1", p1.canvasPosition.y);
        line.setAttribute("x2", p2.canvasPosition.x);
        line.setAttribute("y2", p2.canvasPosition.y);
        // Label fully inside the stage, facing the camera, and both line ends visible.
        const hw = (label?.offsetWidth || 64) / 2;
        const hh = (label?.offsetHeight || 22) / 2;
        const show =
          d.facingCamera &&
          inside(d.canvasPosition, hw, hh) &&
          inside(p1.canvasPosition) &&
          inside(p2.canvasPosition);
        line.classList.toggle(styles.hide, !show);
        label?.classList.toggle(styles.dimOff, !show);
        const hole = holes[i];
        if (hole) {
          const pad = 4;
          hole.setAttribute("x", d.canvasPosition.x - hw - pad);
          hole.setAttribute("y", d.canvasPosition.y - hh - pad);
          hole.setAttribute("width", show ? 2 * (hw + pad) : 0);
          hole.setAttribute("height", show ? 2 * (hh + pad) : 0);
        }
      });
    };

    const onProgress = (e) => setProgress(e.detail?.totalProgress ?? 0);
    const onLoad = () => {
      const s = placeDimensionHotspots(mv, cb.current.dimsBox);
      setSize(s);
      setLoaded(true);
      const v = cb.current.variant;
      if (v && mv.availableVariants?.includes(v)) mv.variantName = v;
      requestAnimationFrame(drawLines);
      cb.current.onLoaded?.({
        dimensions: { w: s.x, h: s.y, d: s.z },
        canActivateAR: Boolean(mv.canActivateAR),
        variants: mv.availableVariants || [],
      });
    };
    const onErr = (e) => cb.current.onError?.(e.detail?.type || "load");
    const onAr = (e) => cb.current.onArStatus?.(e.detail?.status);

    mv.addEventListener("progress", onProgress);
    mv.addEventListener("load", onLoad);
    mv.addEventListener("error", onErr);
    mv.addEventListener("ar-status", onAr);
    mv.addEventListener("camera-change", drawLines);
    const onVariant = () => cb.current.onVariantApplied?.();
    mv.addEventListener("variant-applied", onVariant);
    const ro = new ResizeObserver(() => requestAnimationFrame(drawLines));
    ro.observe(mv);
    drawRef.current = drawLines;
    return () => {
      ro.disconnect();
      mv.removeEventListener("variant-applied", onVariant);
      mv.removeEventListener("progress", onProgress);
      mv.removeEventListener("load", onLoad);
      mv.removeEventListener("error", onErr);
      mv.removeEventListener("ar-status", onAr);
      mv.removeEventListener("camera-change", drawLines);
    };
  }, []);

  // Variant switch (KHR_materials_variants).
  useEffect(() => {
    const mv = mvRef.current;
    if (!mv || !loaded) return;
    const list = mv.availableVariants || [];
    mv.variantName = variant && list.includes(variant) ? variant : null;
  }, [variant, loaded]);

  // "Maße anzeigen": fly to a fixed, readable 3/4 view with margin and stop
  // the turntable, so labels and lines stay put while reading.
  useEffect(() => {
    const mv = mvRef.current;
    if (!mv || !loaded || !showDims) return undefined;
    // model-viewer swallows orbit changes in two situations: right after a load it
    // re-frames and keeps the current theta/phi for the next sync, and while the
    // stage is scrolled out of view (e.g. a gallery tap below the stage on a phone)
    // it does not animate at all. So: apply now, re-apply while the stage is visible
    // until the camera is on its way (nominally different string → real property
    // change), and stop for good as soon as the visitor touches the model.
    let nudge = false;
    let tries = 0;
    let visible = true;
    let done = false; // retry loop finished
    let userMoved = false; // visitor took over the camera: never fight them
    const apply = () => {
      mv.resetTurntableRotation?.();
      mv.cameraTarget = "auto auto auto";
      mv.fieldOfView = "auto";
      mv.cameraOrbit = dimsOrbit(mv, nudge);
      nudge = !nudge;
      if (reducedMotion) mv.jumpCameraToGoal?.();
      drawRef.current?.();
    };
    const reached = () => Math.abs((mv.getCameraOrbit?.().theta ?? DIMS_THETA) - DIMS_THETA) < 0.03;
    const onUser = (e) => {
      if (e.detail?.source === "user-interaction") userMoved = done = true;
    };
    mv.addEventListener("camera-change", onUser);
    // Several thresholds: a stage that is only partly in view (phone, gallery
    // tap below it) may not animate yet; re-check as more of it scrolls in, even
    // after the retry loop gave up (R2: wrong side after a model switch).
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !userMoved && !reached()) {
          apply();
          mv.jumpCameraToGoal?.(); // came into view: nobody watched, no need to animate
        }
        // Off-screen, model-viewer does not render, so hotspot positions (and the
        // label/line visibility derived from them) are stale: redraw once the
        // stage has rendered again.
        if (visible) requestAnimationFrame(() => requestAnimationFrame(() => drawRef.current?.()));
      },
      { threshold: [0, 0.5, 0.9] }
    );
    io.observe(mv);
    apply();
    const timer = setInterval(() => {
      if (done || !visible) return;
      if (reached() || ++tries > 12) {
        done = true;
        return;
      }
      if (tries % 2 === 0) apply(); // give each assignment ~0.5 s to start moving
    }, 250);
    return () => {
      clearInterval(timer);
      io.disconnect();
      mv.removeEventListener("camera-change", onUser);
    };
  }, [showDims, loaded, reducedMotion]);

  // "Ansicht zurücksetzen"
  useEffect(() => {
    const mv = mvRef.current;
    if (!mv || !resetSignal) return;
    mv.cameraOrbit = model.cameraOrbit;
    mv.cameraTarget = "auto auto auto";
    mv.fieldOfView = "auto";
    mv.resetTurntableRotation?.();
    mv.jumpCameraToGoal?.();
  }, [resetSignal, model.cameraOrbit]);

  const loading = !loaded;

  return (
    <div className="relative h-full w-full">
      <model-viewer
        ref={mvRef}
        className={styles.viewer}
        src={model.src}
        ios-src={model.iosSrc || undefined}
        poster={model.poster}
        alt={`3D-Ansicht: ${model.name} (${model.posterAlt})`}
        tabIndex={0}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        ar-placement={model.arPlacement}
        camera-controls
        camera-orbit={model.cameraOrbit}
        min-camera-orbit={model.minCameraOrbit || "auto auto 40%"}
        max-camera-orbit={showDims ? "auto auto 200%" : model.maxCameraOrbit || "auto auto 160%"}
        touch-action="pan-y"
        interaction-prompt={reducedMotion || showDims ? "none" : "auto"}
        auto-rotate={reducedMotion || showDims || model.noAutoRotate ? undefined : true}
        auto-rotate-delay="4000"
        rotation-per-second="12deg"
        shadow-intensity={String(model.shadowIntensity ?? 1)}
        shadow-softness="0.9"
        environment-image={envImage || "neutral"}
        data-env={envImage ? "studio" : "neutral"}
        exposure={envImage ? "1" : "0.9"}
        tone-mapping="neutral"
        loading="eager"
        reveal="auto"
      >
        {/* AR button: model-viewer shows it only where AR is available */}
        <button
          slot="ar-button"
          type="button"
          className="absolute bottom-5 left-1/2 -translate-x-1/2 inline-flex min-h-11 items-center gap-2 whitespace-nowrap bg-[#30373e] px-4 py-3 sm:px-5 text-sm font-semibold tracking-wide text-[#f7f5f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a5f17]"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
            <path d="m3 7 9 5 9-5M12 12v10" />
          </svg>
          In meinem Raum ansehen
        </button>

        {/* Material hotspots */}
        {model.hotspots.map((h, i) => (
          <button
            key={`${model.id}-${h.id}`}
            type="button"
            slot={`hotspot-${h.id}`}
            data-position={h.position}
            data-normal={h.normal}
            data-visibility-attribute="visible"
            className={`${styles.hotspot} ${showHotspots && !showDims ? "" : styles.hidden}`}
            aria-expanded={activeHotspot === h.id}
            aria-controls="arv-hotspot-info"
            aria-label={`Material-Info ${i + 1}: ${h.title}`}
            onClick={() => onHotspot(activeHotspot === h.id ? null : h.id)}
          >
            {i + 1}
          </button>
        ))}

        {/* Dimension markers (positions set after load) */}
        {DOTS.map((name) => (
          <div key={name} slot={name} className={styles.dot} data-position="0 0 0" aria-hidden="true" />
        ))}
        {[
          ["hotspot-dim+X-Y", size?.z, "1 0 0"],
          ["hotspot-dim+X-Z", size?.y, "1 0 0"],
          ["hotspot-dim+Y-Z", size?.x, "0 1 0"],
          ["hotspot-dim-X-Z", size?.y, "-1 0 0"],
          ["hotspot-dim-X-Y", size?.z, "-1 0 0"],
        ].map(([name, value, normal]) => (
          <div
            key={name}
            slot={name}
            className={`${styles.dim} ${showDims && size ? "" : styles.hidden}`}
            data-position="0 0 0"
            data-normal={normal}
            data-visibility-attribute="visible"
            aria-hidden="true"
          >
            {value ? cm(value) : ""}
          </div>
        ))}
        <svg
          ref={svgRef}
          className={`${styles.dimLines} ${showDims && size ? "" : styles.hidden}`}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* R2 P2: lines must not run through a label ("181 cm"). The mask
              punches a padded hole at every visible label. */}
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
              <rect x="0" y="0" width="100%" height="100%" fill="#fff" />
              {LINES.map((_, i) => (
                <rect key={i} data-dim-hole={i} x="0" y="0" width="0" height="0" rx="3" fill="#000" />
              ))}
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            {LINES.map((_, i) => (
              <line key={i} className={styles.dimLine} />
            ))}
          </g>
        </svg>
      </model-viewer>

      {loading && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0" role="status" aria-live="polite">
          <div className="h-[2px] w-full bg-[#30373e]/10">
            <div
              className="h-full bg-[#30373e] transition-[width] duration-200 motion-reduce:transition-none"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="sr-only">3D-Modell wird geladen: {Math.round(progress * 100)} Prozent</p>
        </div>
      )}
    </div>
  );
}
