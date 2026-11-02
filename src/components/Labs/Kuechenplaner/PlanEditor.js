"use client";
// Küchenplaner – Grundriss-Editor: Module per Drag & Drop an Wände (und Insel)
// ziehen, mit Magnet an Nachbarkanten, Zeilenenden und 1-cm-Raster. Neue Module
// aus der Palette ins Bild ziehen oder antippen. Die Insel lässt sich am Griff
// verschieben. Alternative ohne Ziehen (WCAG 2.5.7): Auswahl per Tippen, dann
// Knöpfe bzw. Pfeiltasten (5 cm, mit Umschalt 1 cm), Wand wählen, Entfernen.
//
// Fix 1 (QA-Feedback 1):
// - P1-1: Plan auf den Inhalt zugeschnitten (planViewBox), Werkzeuge in schmalen
//   Leisten links/rechts neben dem Plan statt darüber, Mindestschrift 11 px,
//   Zoom (+ / − / Einpassen), im Zoom mit einem Finger verschiebbar.
// - P1-2: touch-action: none nur auf ziehbaren Modulen; die freie Planfläche
//   lässt vertikales Wischen an die Seite durch (pan-y).
// - P2-3: Rückgängig/Wiederholen mobil in den Planleisten statt neben den Reitern.
// - P2-4: Palette mit Piktogramm und Klartext, Legende zum Aufklappen.
//
// Fix 2 (QA-Feedback 2):
// - P1-1: Palette auf Touch wischbar (touch-action: pan-x). Ein Modul-Drag beginnt
//   erst bei klar senkrechter Bewegung (|dy| > |dx| und > 8 px) oder nach Long-Press
//   (300 ms); waagrechtes Wischen scrollt die Leiste, Antippen fügt am Ende an.
//   Ein Verlauf mit Pfeil zeigt, dass es weitergeht.
// - P2-1: Klick-Sperre nach einem Palette-Drop zeitlich begrenzt (400 ms) statt Merker.
// - P2-2: Zoom ohne Auswahl zielt auf den dichtesten Modulbereich (bei L die Ecke),
//   dazu Zwei-Finger-Pinch im Plan.
// - P2-7: Volle Zeile: schon in der Vorschau rot schraffiert „Kein Platz“; über einem
//   Modul gleicher Breite „ersetzen“ (mit Rückgängig), sonst wird nichts eingefügt.
// - P3-1: Startwert „mobil“ (Maßketten) kommt vom Server, kein Sprung nach der Hydration.
// - P3-4/P3-6: Palette 12 px, Legende schließt per Esc auch ohne Fokus im Plan.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, Info, Redo2, Ruler, Scan, Trash2, Triangle, Undo2, X, ZoomIn, ZoomOut } from "lucide-react";
import { MODULES, OPENINGS, defaultWidth, fmtCm } from "./catalog";
import { buildKitchen, islandFrame, islandModules } from "./geometry";
import { PlanSvg, planViewBox } from "./Drawings";
import { ModuleIcon } from "./ModuleIcons";
import { activeWalls } from "./planState";
import { insertModule, moveModule, nudgeModule, removeModule, indexAt, dropTarget, replaceModule } from "../../../lib/kuechenplaner/layout";
import { zoomBox, zoomFocus } from "../../../lib/kuechenplaner/planview";
import { runChecks } from "../../../lib/kuechenplaner/checks";
import { LIMITS } from "./catalog";
// Sprachen (01.11.2026): Anzeige- und Ansagetexte über useKpT (KpCopy.js).
import { useKpT } from "./KpCopy";
import { useTextScale } from "../textScale";

const PALETTE = ["unterschrank", "spuele", "geschirrspueler", "kochfeld", "eckschrank", "hochschrank", "backofen", "kuehlschrank", "apotheker", "passstueck"];
const ZOOMS = [1, 1.5, 2, 3, 4];
const Z_MAX = ZOOMS[ZOOMS.length - 1];
const LONG_PRESS_MS = 300;
const CLICK_LOCK_MS = 400;
const fmtZoom = (z, tr) => tr.num(Math.round(z * 10) / 10);
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:shadow-[0_0_0_2px_#fff]";
const tool = `inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border border-ink/20 bg-paper px-2.5 text-[0.8125rem] text-ink ${focusRing} disabled:opacity-40`;
// Schmale Leisten neben dem Plan: 40 × 40 px (WCAG 2.5.8 verlangt 24 px), auf dem Desktop 44 px
// QM r2: reine Symbolknöpfe in px (Symbole sind px) – bei 200 % Text wuchsen die rem-Maße über den Planrahmen hinaus
const railBtn = `inline-flex h-[40px] w-[40px] shrink-0 items-center justify-center border border-ink/15 bg-paper text-ink transition-colors hover:border-ink/50 lg:h-[44px] lg:w-[44px] ${focusRing} disabled:opacity-35 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper`;
// QM r5 (Handy quer, ≤ 500 px hoch): Planleisten zweispaltig statt abgeschnitten (Legende,
// Rückgängig, Wiederholen lagen unter der Kante), Modulleiste einzeilig 44 px statt 56 px hoch.
const railGroup = "flex shrink-0 flex-col gap-1 [@media(max-width:1023px)_and_(max-height:500px)]:grid! [@media(max-width:1023px)_and_(max-height:500px)]:grid-cols-2 [@media(max-width:1023px)_and_(max-height:500px)]:auto-rows-min [@media(max-width:1023px)_and_(max-height:500px)]:content-start";

const MOBILE = "(max-width: 767px)";
function subscribeMobile(cb) {
  const mq = window.matchMedia(MOBILE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function svgPoint(svg, e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const m = svg.getScreenCTM();
  if (!m) return null;
  const p = pt.matrixTransform(m.inverse());
  return [p.x / 100, p.y / 100];
}

/** Nächste Wand (oder Insel) zu einem Punkt (m) → { wall, u (cm) }. */
function targetFor(plan, kitchen, p, kind) {
  let best = null;
  const cand = activeWalls(plan).map((id) => ({ id, f: kitchen.frames[id], len: kitchen.walls.find((w) => w.id === id)?.len || 0 }));
  if (kitchen.island && kind !== "tall") {
    const f = islandFrame(plan);
    cand.push({ id: "i", f, len: plan.island.len / 100 });
  }
  for (const { id, f, len } of cand) {
    if (!f) continue;
    const dx = p[0] - f.origin[0];
    const dz = p[1] - f.origin[1];
    const u = dx * f.u[0] + dz * f.u[1];
    const v = dx * f.v[0] + dz * f.v[1];
    if (u < -0.4 || u > len + 0.4 || v < -0.5 || v > 1.3) continue;
    const dist = Math.abs(v - 0.3);
    if (!best || dist < best.dist) best = { wall: id, u: u * 100, dist };
  }
  return best;
}

/** Legende der Kürzel und Zeichen im Grundriss. */
function Legend({ kitchen, onClose }) {
  // P3-6: Esc schließt, egal wo der Fokus liegt
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const tr = useKpT();
  const used = [...new Set(kitchen.mods.filter((m) => m.kind !== "upper").map((m) => m.t))];
  const ops = [...new Set((kitchen.openings || []).map((o) => o.k))].filter((k) => OPENINGS[k] && !["fenster", "tuer", "heizung"].includes(k));
  return (
    <div className="absolute inset-x-1 bottom-1 z-10 max-h-[calc(100%-0.5rem)] overflow-y-auto bg-paper/97 p-3 text-[0.8125rem] text-ink shadow-[0_12px_32px_-12px_rgb(31_37_43/0.35)] ring-1 ring-ink/15" role="region" aria-label={tr("Legende zum Grundriss")} id="kp-legend">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-gold-text">{tr("Legende")}</p>
        <button type="button" className={`${railBtn} h-9 w-9`} onClick={onClose} aria-label={tr("Legende schließen")}>
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <dl className="grid grid-cols-[2.5rem_1fr] gap-x-2 gap-y-1">
        {used.map((t) => (
          <div key={t} className="contents">
            <dt className="font-semibold">{MODULES[t]?.short}</dt>
            <dd>{tr(MODULES[t]?.label)}</dd>
          </div>
        ))}
        {ops.map((k) => (
          <div key={k} className="contents">
            <dt className="font-semibold">{OPENINGS[k].short}</dt>
            <dd>{tr("{name} (Kreis an der Wand)", { name: tr(OPENINGS[k].label) })}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-2 space-y-1 border-t border-ink/10 pt-2 text-ink-soft">
        <li><span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-6 border border-dashed border-ink-soft align-middle" />{tr("Gestrichelt: Hängeschrank darüber")}</li>
        <li><span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-6 bg-[#cfc6b8] align-middle" />{tr("Grau gefüllt: Hochschrank")}</li>
        <li><span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-6 border-t-2 border-dashed border-brass-700 align-middle" />{tr("Arbeitsdreieck Spüle – Kochfeld – Kühlschrank")}</li>
        <li><span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-6 border-2 border-error bg-[#f3c9c3] align-middle" />{tr("Kollision (im Reiter Prüfen erklärt)")}</li>
      </ul>
    </div>
  );
}

/** Vorschau beim Ablegen in eine volle Zeile: rot schraffiert bzw. Ersetzen-Rahmen (P2-7). */
function DropGhost({ ghost, plan, kitchen, unitPerPx }) {
  const f = ghost.wall === "i" ? islandFrame(plan) : kitchen.frames[ghost.wall];
  if (!f) return null;
  const at = (u, v) => [(f.origin[0] + f.u[0] * u + f.v[0] * v) * 100, (f.origin[1] + f.u[1] * u + f.v[1] * v) * 100];
  const u0 = ghost.x0 / 100;
  const u1 = ghost.x1 / 100;
  const q = [at(u0, 0), at(u1, 0), at(u1, 0.6), at(u0, 0.6)];
  const full = ghost.mode === "full";
  const sw = Math.max(1.5, 2 * (unitPerPx || 1));
  return (
    <g pointerEvents="none" data-kp-ghost={ghost.mode}>
      <defs>
        <pattern id="kp-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#f3c9c3" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#9b2c2c" strokeWidth="3" />
        </pattern>
      </defs>
      <polygon
        points={q.map((p) => p.join(",")).join(" ")}
        fill={full ? "url(#kp-hatch)" : "rgba(122,95,23,0.18)"}
        fillOpacity={full ? 0.85 : 1}
        stroke={full ? "#9b2c2c" : "#7a5f17"}
        strokeWidth={sw}
        strokeDasharray={full ? undefined : `${sw * 3} ${sw * 2}`}
      />
    </g>
  );
}

export default function PlanEditor({ plan, kitchen, checks, onCommit, selected, onSelect, className = "", history = null, leftTop = null, rightTop = null, compact = false, initialMobile = false }) {
  const tr = useKpT();
  const svgRef = useRef(null);
  const boxRef = useRef(null);
  const paletteRef = useRef(null);
  const legendBtnRef = useRef(null);
  const drag = useRef(null);
  const pinch = useRef(null);
  // Nach einem Drop aus der Palette den Klick desselben Gesten-Endes schlucken – zeitlich begrenzt (P2-1)
  const clickLock = useRef(0);
  const [preview, setPreview] = useState(null);
  const [ghost, setGhost] = useState(null); // { wall, x0, x1, mode: "full" | "replace", label }
  const [armed, setArmed] = useState(null); // Palette-Typ, dessen Drag (Touch) scharf ist
  const [fade, setFade] = useState({ l: false, r: false });
  // Mobil startet der Plan ohne Maßketten (größere Zeichnung); Schalter „Maße“ blendet sie ein.
  // Server-Snapshot aus der Geräteerkennung der Seite (P3-1: kein Sprung nach der Hydration).
  const mobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE).matches, () => initialMobile);
  const [dimsPref, setDimsPref] = useState(null);
  const dims = dimsPref ?? !mobile;
  const [tri, setTri] = useState(true);
  const [legend, setLegend] = useState(false);
  const [status, setStatusRaw] = useState("");
  // Mobil-A11y fix-02: gleicher Text zweimal hintereinander (z. B. zweimal „5 cm nach links“)
  // würde von Screenreadern nicht erneut vorgelesen – dann ein geschütztes Leerzeichen anhängen.
  const setStatus = (msg) => setStatusRaw((s) => (s === msg ? `${msg} ` : msg));
  const [zoom, setZoom] = useState({ z: 1, c: null });
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
  const shown = preview || plan;
  const shownKitchen = useMemo(() => (preview ? buildKitchen(preview) : kitchen), [preview, kitchen]);
  const shownChecks = useMemo(() => (preview ? runChecks(preview, shownKitchen) : checks), [preview, shownKitchen, checks]);

  // Ausschnitt aus dem festgeschriebenen Plan (nicht aus der Vorschau): springt beim Ziehen nicht
  const textScale = useTextScale(); // QM r5: Maße/Kürzel wachsen bei 200 % Text mit
  const baseVb = useMemo(() => planViewBox(kitchen, dims, textScale), [kitchen, dims, textScale]);
  const center = zoom.c || [baseVb.minX + baseVb.w / 2, baseVb.minZ + baseVb.h / 2];
  const vb = zoomBox(baseVb, zoom.z, center);
  const unitPerPx = boxSize.w && boxSize.h ? Math.max(vb.w / boxSize.w, vb.h / boxSize.h) : 0;

  // fix-02: Der Plan ist per Skript fokussierbar (nicht per Tab): Nach Auswahl per Zeiger,
  // Entfernen oder Wandwechsel landet der Fokus dort statt auf <body> (WCAG 2.4.3),
  // und die Pfeiltasten wirken sofort (WCAG 2.1.1).
  useEffect(() => {
    svgRef.current?.setAttribute("tabindex", "-1");
  }, []);
  const focusPlan = () => requestAnimationFrame(() => svgRef.current?.focus({ preventScroll: true }));

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const apply = () => setBoxSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();
    return () => ro.disconnect();
  }, []);

  // Touch: Ziehen an Modulen und am Inselgriff darf die Seite nicht scrollen (iOS
  // wertet touch-action an SVG-Elementen nicht überall aus). Im Zoom verschiebt ein
  // Finger den Ausschnitt, sonst scrollt die freie Fläche die Seite. Zwei Finger:
  // eigener Pinch-Zoom im Plan (P2-2); ein laufender Modul-Drag wird abgebrochen.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const spread = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouch = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        if (drag.current && drag.current.kind !== "new") {
          drag.current = null;
          setPreview(null);
        }
        const r = svg.getBoundingClientRect();
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
        // Punkt zwischen den Fingern in Plan-Einheiten (viewBox ist mittig eingepasst)
        const c = [vb.minX + vb.w / 2 + (mx - r.width / 2) * unitPerPx, vb.minZ + vb.h / 2 + (my - r.height / 2) * unitPerPx];
        pinch.current = { d0: spread(e.touches) || 1, z0: zoom.z, c };
        return;
      }
      if (e.touches.length > 2) return;
      const t = e.target;
      if (t?.closest?.("[data-drag],[data-island-handle]") || (zoom.z > 1 && t?.closest?.("[data-plan-bg]"))) e.preventDefault();
    };
    const onMove = (e) => {
      const p = pinch.current;
      if (!p || e.touches.length !== 2) return;
      e.preventDefault();
      const z = Math.max(1, Math.min(Z_MAX, (p.z0 * spread(e.touches)) / p.d0));
      setZoom({ z, c: z <= 1.01 ? null : p.c });
    };
    const onEnd = (e) => {
      if (!pinch.current || e.touches.length >= 2) return;
      pinch.current = null;
      setZoom((zz) => (zz.z <= 1.05 ? { z: 1, c: null } : zz));
    };
    svg.addEventListener("touchstart", onTouch, { passive: false });
    svg.addEventListener("touchmove", onMove, { passive: false });
    svg.addEventListener("touchend", onEnd);
    svg.addEventListener("touchcancel", onEnd);
    return () => {
      svg.removeEventListener("touchstart", onTouch);
      svg.removeEventListener("touchmove", onMove);
      svg.removeEventListener("touchend", onEnd);
      svg.removeEventListener("touchcancel", onEnd);
    };
  }, [zoom.z, unitPerPx, vb.minX, vb.minZ, vb.w, vb.h]);

  // Palette: Ist der Touch-Drag scharf, darf der Finger die Leiste nicht mehr scrollen (P1-1).
  useEffect(() => {
    const el = paletteRef.current;
    if (!el) return;
    const onMove = (e) => {
      if (drag.current?.kind === "new" && drag.current.armed) e.preventDefault();
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, [selected, compact]);

  // Scroll-Hinweis der Palette: Verlauf nur an der Seite, an der es weitergeht
  useEffect(() => {
    const el = paletteRef.current;
    if (!el) return;
    const apply = () => {
      const l = el.scrollLeft > 2;
      const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      setFade((f) => (f.l === l && f.r === r ? f : { l, r }));
    };
    apply();
    el.addEventListener("scroll", apply, { passive: true });
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", apply);
      ro.disconnect();
    };
  }, [selected, compact]);

  const sel = selected ? shownKitchen.mods.find((m) => m.id === selected && m.kind !== "upper") : null;

  // Insel-Module erst beim Bearbeiten festschreiben (vorher automatisch aufgeteilt)
  const materialize = (p, wall) => (wall === "i" && !p.runs.i?.length ? { ...p, runs: { ...p.runs, i: islandModules(p) } } : p);

  const finish = (next, label) => {
    drag.current = null;
    setPreview(null);
    if (next && next !== plan) {
      onCommit(next, "drag");
      setStatus(label);
    }
  };

  const onModuleDown = (e, m) => {
    const svg = svgRef.current;
    const p = svg && svgPoint(svg, e);
    if (!p || pinch.current) return;
    e.preventDefault();
    svg.setPointerCapture?.(e.pointerId);
    const base = materialize(plan, m.wall);
    const f = m.wall === "i" ? islandFrame(plan) : kitchen.frames[m.wall];
    const u = ((p[0] - f.origin[0]) * f.u[0] + (p[1] - f.origin[1]) * f.u[1]) * 100;
    drag.current = { kind: "move", m, base, grab: u - m.x0, start: p, moved: false };
    onSelect?.(m.id);
    svg.focus?.({ preventScroll: true });
  };

  const onIslandDown = (e) => {
    const svg = svgRef.current;
    const p = svg && svgPoint(svg, e);
    if (!p || pinch.current) return;
    e.preventDefault();
    svg.setPointerCapture?.(e.pointerId);
    drag.current = { kind: "island", start: p, x: plan.island.x || 0, aisle: plan.island.aisle, moved: false };
  };

  // Freie Fläche: im Zoom verschieben; sonst ein Tipp hebt die Auswahl auf
  const onBackgroundDown = (e) => {
    if (pinch.current) return;
    drag.current = { kind: "pan", start: [e.clientX, e.clientY], c: center, moved: false, upp: unitPerPx };
  };

  const clearNew = (d) => {
    if (d?.timer) clearTimeout(d.timer);
    setArmed(null);
    setGhost(null);
  };

  const startNew = (e, t) => {
    if (e.button) return;
    const touch = e.pointerType === "touch" || e.pointerType === "pen";
    const d = { kind: "new", t, start: [e.clientX, e.clientY], moved: false, pointerId: e.pointerId, touch, armed: !touch, drop: null };
    if (touch) {
      // Long-Press macht den Drag scharf; bis dahin gehört ein waagrechtes Wischen dem Scrollen
      d.timer = setTimeout(() => {
        if (drag.current !== d || d.moved) return;
        d.armed = true;
        setArmed(t);
        navigator.vibrate?.(8);
      }, LONG_PRESS_MS);
    }
    drag.current = d;
  };

  useEffect(() => {
    const move = (e) => {
      const d = drag.current;
      const svg = svgRef.current;
      if (!d || !svg) return;
      if (d.kind === "pan") {
        if (pinch.current) return;
        const dx = e.clientX - d.start[0];
        const dy = e.clientY - d.start[1];
        if (Math.hypot(dx, dy) > 4) d.moved = true;
        if (d.moved && zoom.z > 1) setZoom((zz) => ({ ...zz, c: [d.c[0] - dx * d.upp, d.c[1] - dy * d.upp] }));
        return;
      }
      const p = svgPoint(svg, e);
      if (!p) return;
      if (d.kind === "new") {
        if (e.pointerId !== d.pointerId) return;
        const dx = e.clientX - d.start[0];
        const dy = e.clientY - d.start[1];
        if (!d.armed) {
          // Touch: erst eine klar senkrechte Bewegung startet den Drag (P1-1)
          if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
            d.armed = true;
            if (d.timer) clearTimeout(d.timer);
            setArmed(d.t);
          } else {
            if (Math.abs(dx) > 8) {
              clearNew(d);
              drag.current = null; // waagrecht → die Leiste scrollt
            }
            return;
          }
        }
        if (Math.hypot(dx, dy) > 6) d.moved = true;
        if (!d.moved) return;
        const kind = MODULES[d.t].kind;
        const tgt = targetFor(plan, kitchen, p, kind);
        if (!tgt) {
          d.drop = null;
          setGhost(null);
          setPreview(null);
          return;
        }
        const w = defaultWidth(d.t, plan.raster);
        const base = materialize(plan, tgt.wall);
        const where = tgt.wall === "i" ? "der Insel" : `Wand ${tgt.wall.toUpperCase()}`;
        const whereTr = tr(where);
        const dt = dropTarget(base, tgt.wall, w, tgt.u - w / 2, tgt.u);
        if (dt.type === "insert") {
          d.drop = { type: "insert" };
          setGhost(null);
          setPreview(insertModule(base, tgt.wall, { t: d.t, w }, tgt.u - w / 2));
        } else if (dt.type === "replace") {
          d.drop = { type: "replace", old: dt.t, where };
          setGhost({ wall: tgt.wall, x0: dt.x0, x1: dt.x1, mode: "replace", label: tr("Loslassen ersetzt {name} {n} cm ({where})", { name: tr(MODULES[dt.t].name), n: dt.x1 - dt.x0, where: whereTr }) });
          setPreview(replaceModule(base, tgt.wall, dt.i, { t: d.t, w }));
        } else {
          d.drop = { type: "full", where };
          setGhost({ wall: tgt.wall, x0: dt.x0, x1: dt.x1, mode: "full", label: tr("Kein Platz an {where} – Modul ersetzen? Auf ein Modul mit {n} cm ziehen.", { where: whereTr, n: w }) });
          setPreview(null);
        }
        return;
      }
      if (Math.hypot(p[0] - d.start[0], p[1] - d.start[1]) > 0.02) d.moved = true;
      if (!d.moved) return;
      if (d.kind === "island") {
        const dx = (p[0] - d.start[0]) * 100;
        const dz = (p[1] - d.start[1]) * 100;
        const clamp = (v, l) => Math.max(l.min, Math.min(l.max, Math.round(v / 5) * 5));
        setPreview({ ...plan, island: { ...plan.island, x: plan.shape === "halbinsel" ? 0 : clamp(d.x + dx, LIMITS.islandShift), aisle: clamp(d.aisle + dz, LIMITS.aisle) } });
        return;
      }
      const tgt = targetFor(plan, kitchen, p, d.m.kind);
      if (!tgt) return;
      const base = materialize(d.base, tgt.wall);
      setPreview(moveModule(base, { wall: d.m.wall, i: d.m.i }, { wall: tgt.wall, x: tgt.u - d.grab }));
      d.target = tgt;
    };
    const up = (e) => {
      const d = drag.current;
      if (!d) return;
      if (d.kind === "pan") {
        drag.current = null;
        if (!d.moved && e.type === "pointerup" && selected && !pinch.current) onSelect?.(null);
        return;
      }
      if (d.kind === "new") {
        if (e.pointerId !== d.pointerId) return;
        clearNew(d);
        if (!d.moved) {
          drag.current = null;
          // Long-Press ohne Ziehen: kein zusätzliches Anfügen per Klick
          if (d.touch && d.armed) clickLock.current = performance.now() + CLICK_LOCK_MS;
          return; // Klick → onClick der Palette
        }
        clickLock.current = performance.now() + CLICK_LOCK_MS;
        const svg = svgRef.current;
        const rect = svg?.getBoundingClientRect();
        const inside = e.type === "pointerup" && rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        const name = MODULES[d.t].name;
        if (!inside || !d.drop) {
          finish(null);
          return;
        }
        if (d.drop.type === "full") {
          finish(null);
          setStatus(tr("Kein Platz an {where} – {name} nicht eingefügt.", { where: tr(d.drop.where), name: tr(name) }));
          return;
        }
        finish(preview, d.drop.type === "replace" ? tr("{old} ({where}) durch {name} ersetzt. Rückgängig mit Strg+Z oder dem Pfeil links.", { old: tr(MODULES[d.drop.old].name), where: tr(d.drop.where), name: tr(name) }) : tr("{name} eingefügt.", { name: tr(name) }));
        return;
      }
      if (!d.moved) {
        drag.current = null;
        setPreview(null);
        return;
      }
      if (d.kind === "island") return finish(preview, tr("Insel verschoben."));
      const next = preview;
      finish(next, `${MODULES[d.m.t].name} verschoben.`);
      if (next && d.target) {
        const idx = indexAt(next, d.target.wall, d.target.u - d.grab + d.m.w / 2);
        if (idx >= 0) onSelect?.(`${d.target.wall}-${idx}`);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  });

  const setZoomLevel = (dir) => {
    // Stufen, auch nach einem stufenlosen Pinch
    const z = dir > 0 ? (ZOOMS.find((v) => v > zoom.z + 0.01) ?? Z_MAX) : ([...ZOOMS].reverse().find((v) => v < zoom.z - 0.01) ?? 1);
    // Beim ersten Vergrößern auf das gewählte Modul zielen, sonst auf den dichtesten Modulbereich
    let c = zoom.c;
    if (dir > 0 && zoom.z <= 1) {
      if (sel) {
        const xs = sel.quad.map((q) => q[0] * 100);
        const zs = sel.quad.map((q) => q[1] * 100);
        c = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2];
      } else {
        c = zoomFocus(kitchen.mods, baseVb, z);
      }
    }
    setZoom({ z, c: z === 1 ? null : c });
    setStatus(z === 1 ? tr("Ganzer Plan sichtbar.") : tr("Zoom {n}-fach.", { n: fmtZoom(z, tr) }));
  };

  const addAtEnd = (t) => {
    const wall = sel?.wall && !(sel.wall === "i" && MODULES[t].kind === "tall") ? sel.wall : activeWalls(plan)[0];
    if (!wall) return;
    const base = materialize(plan, wall);
    onCommit(insertModule(base, wall, { t, w: defaultWidth(t, plan.raster) }), null);
    setStatus(tr("{name} am Ende von {where} angefügt.", { name: tr(MODULES[t].name), where: tr(wall === "i" ? "der Insel" : `Wand ${wall.toUpperCase()}`) }));
  };

  const nudge = (dx, word) => {
    if (!sel) return;
    const next = nudgeModule(materialize(plan, sel.wall), sel.wall, sel.i, dx);
    onCommit(next, "nudge");
    setStatus(tr(word === "links" ? "{name} {n} cm nach links." : "{name} {n} cm nach rechts.", { name: tr(MODULES[sel.t].name), n: Math.abs(dx) }));
    const idx = indexAt(next, sel.wall, sel.x0 + dx + sel.w / 2);
    if (idx >= 0) onSelect?.(`${sel.wall}-${idx}`);
  };

  const remove = () => {
    if (!sel) return;
    onCommit(removeModule(materialize(plan, sel.wall), sel.wall, sel.i, true), null);
    onSelect?.(null);
    setStatus(tr("{name} entfernt. Rückgängig mit Strg+Z.", { name: tr(MODULES[sel.t].name) }));
    focusPlan();
  };

  const onKey = (e) => {
    if (e.key === "Escape" && legend) return; // schließt der Listener der Legende
    if (!sel) return;
    // fix-02: im Auswahlfeld „Wand“ gehören Pfeil- und Löschtasten dem Feld
    if (e.target?.closest?.("select, input, textarea")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      onSelect?.(null);
      setStatus(tr("Auswahl aufgehoben."));
      focusPlan();
      return;
    }
    const step = e.shiftKey ? 1 : 5;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      nudge((e.key === "ArrowLeft" ? -1 : 1) * step * (kitchen.frames[sel.wall]?.rs ?? 1), e.key === "ArrowLeft" ? "links" : "rechts");
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove();
    }
  };

  const closeLegend = () => {
    setLegend(false);
    legendBtnRef.current?.focus();
  };

  const zoomed = zoom.z > 1;

  return (
    <div className={`flex h-full min-h-0 flex-col ${className}`} onKeyDown={onKey}>
      <div className="relative flex min-h-0 flex-1 gap-1 px-1 py-1">
        {/* Linke Leiste: Ansicht laden (mobil), Maße, Dreieck, Legende, Rückgängig */}
        {!compact && (
          <div className={railGroup} role="group" aria-label={tr("Plan anzeigen")}>
            {leftTop}
            <button type="button" className={railBtn} aria-pressed={dims} onClick={() => setDimsPref(!dims)} title={tr("Maßketten ein/aus")} aria-label={tr("Maße")}>
              <Ruler size={17} aria-hidden="true" />
            </button>
            <button type="button" className={railBtn} aria-pressed={tri} onClick={() => setTri((v) => !v)} title={tr("Arbeitsdreieck ein/aus")} aria-label={tr("Dreieck")}>
              <Triangle size={17} aria-hidden="true" />
            </button>
            <button ref={legendBtnRef} type="button" className={railBtn} aria-expanded={legend} aria-controls={legend ? "kp-legend" : undefined} onClick={() => setLegend((v) => !v)} title={tr("Legende der Kürzel")} aria-label={tr("Legende")}>
              <Info size={17} aria-hidden="true" />
            </button>
            {history && (
              <button type="button" className={`${railBtn} mt-auto lg:hidden`} onClick={history.onUndo} disabled={!history.canUndo} aria-label={tr("Rückgängig")} title={tr("Rückgängig")}>
                <Undo2 size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <div ref={boxRef} className="relative min-h-0 min-w-0 flex-1">
          <PlanSvg
            plan={shown}
            kitchen={shownKitchen}
            checks={shownChecks}
            dims={dims}
            triangle={tri}
            selected={selected}
            onModuleDown={onModuleDown}
            onIslandDown={kitchen.island ? onIslandDown : undefined}
            onBackgroundDown={onBackgroundDown}
            svgRef={svgRef}
            viewBox={vb}
            unitPerPx={unitPerPx}
            textScale={textScale}
            labels={!compact} /* Fix 3: minimiert (mobil im Ergebnis) überlappen die 11-px-Kürzel */
            t={tr}
            touchAction={zoomed ? "none" : "pan-y"}
            className={`absolute inset-0 h-full w-full select-none focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${zoomed ? "cursor-move" : ""}`}
          >
            {ghost && <DropGhost ghost={ghost} plan={plan} kitchen={kitchen} unitPerPx={unitPerPx} />}
          </PlanSvg>
          {ghost && (
            <p
              data-kp-drop-note={ghost.mode}
              className={`pointer-events-none absolute inset-x-2 top-1 z-10 mx-auto w-fit max-w-full px-2.5 py-1.5 text-center text-[0.8125rem] font-medium leading-snug shadow-[0_8px_20px_-10px_rgb(31_37_43/0.45)] ${ghost.mode === "full" ? "bg-[#fbeee9] text-[#8a2a1f] ring-1 ring-error/60" : "bg-paper text-ink ring-1 ring-ink/25"}`}
              aria-hidden="true"
            >
              {ghost.label}
            </p>
          )}
          {legend && <Legend kitchen={shownKitchen} onClose={closeLegend} />}
        </div>
        {/* Rechte Leiste: Ansicht verkleinern (mobil), Zoom, Einpassen, Wiederholen */}
        {!compact && (
          <div className={railGroup} role="group" aria-label={tr("Plan zoomen")}>
            {rightTop}
            <button type="button" className={railBtn} onClick={() => setZoomLevel(1)} disabled={zoom.z >= Z_MAX - 0.01} aria-label={tr("Plan vergrößern")} title={tr("Plan vergrößern (oder mit zwei Fingern)")}>
              <ZoomIn size={17} aria-hidden="true" />
            </button>
            <button type="button" className={railBtn} onClick={() => setZoomLevel(-1)} disabled={!zoomed} aria-label={tr("Plan verkleinern")} title={tr("Plan verkleinern")}>
              <ZoomOut size={17} aria-hidden="true" />
            </button>
            <button type="button" className={railBtn} onClick={() => setZoom({ z: 1, c: null })} disabled={!zoomed} aria-label={tr("Plan einpassen")} title={tr("Ganzen Plan zeigen")}>
              <Scan size={17} aria-hidden="true" />
            </button>
            {history && (
              <button type="button" className={`${railBtn} mt-auto lg:hidden`} onClick={history.onRedo} disabled={!history.canRedo} aria-label={tr("Wiederholen")} title={tr("Wiederholen")}>
                <Redo2 size={17} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
      {!compact && (
        <div className="border-t border-ink/10 bg-paper/95 px-1.5 py-1">
          {sel ? (
            <div className="flex min-h-[56px] items-center gap-1" role="group" aria-label={tr("Ausgewähltes Modul")}>
              <p className="min-w-0 flex-1 text-[0.8125rem] leading-tight text-ink">
                <strong className="block truncate font-semibold">{tr(MODULES[sel.t].name)} {tr.num(sel.w)} cm</strong>
                <span className="block truncate text-[0.75rem] text-ink-soft">{tr("{where} ab {n} cm", { where: tr(sel.wall === "i" ? "Insel" : `Wand ${sel.wall.toUpperCase()}`), n: Math.round(sel.x0) })}</span>
              </p>
              <button type="button" className={tool} onClick={() => nudge(-5 * (kitchen.frames[sel.wall]?.rs ?? 1), "links")} aria-label={tr("5 cm nach links")}>
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
              <button type="button" className={tool} onClick={() => nudge(5 * (kitchen.frames[sel.wall]?.rs ?? 1), "rechts")} aria-label={tr("5 cm nach rechts")}>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <label className="sr-only" htmlFor="kp-ed-wall">{tr("Wand")}</label>
              <select
                id="kp-ed-wall"
                className="h-11 w-[5.5rem] shrink-0 border border-ink/20 bg-paper px-1 text-[0.8125rem] text-ink"
                value={sel.wall}
                onChange={(e) => {
                  const to = e.target.value;
                  const base = materialize(materialize(plan, sel.wall), to);
                  const next = moveModule(base, { wall: sel.wall, i: sel.i }, { wall: to, x: 1e6 });
                  onCommit(next, null);
                  onSelect?.(null);
                  setStatus(tr("{name} ans Ende von {where} gesetzt.", { name: tr(MODULES[sel.t].name), where: tr(to === "i" ? "der Insel" : `Wand ${to.toUpperCase()}`) }));
                  focusPlan();
                }}
              >
                {[...activeWalls(plan), ...(kitchen.island && sel.kind !== "tall" ? ["i"] : [])].map((w) => (
                  <option key={w} value={w}>{tr(w === "i" ? "Insel" : `Wand ${w.toUpperCase()}`)}</option>
                ))}
              </select>
              <button
                type="button"
                className={`${tool} text-error`}
                onClick={remove}
                aria-label={tr("Modul entfernen")}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div
                ref={paletteRef}
                data-kp-palette=""
                className="flex items-stretch gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="group"
                aria-label={tr("Modul hinzufügen: antippen, oder gedrückt halten und in den Plan ziehen")}
              >
                {PALETTE.map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-palette={t}
                    className={`flex h-[56px] min-w-[72px] shrink-0 select-none flex-col items-center justify-center gap-0.5 border bg-paper px-1.5 [@media(max-width:1023px)_and_(max-height:500px)]:h-11 [@media(max-width:1023px)_and_(max-height:500px)]:flex-row [@media(max-width:1023px)_and_(max-height:500px)]:gap-1.5 [@media(max-width:1023px)_and_(max-height:500px)]:px-2.5 text-ink transition-colors hover:border-ink/50 [-webkit-touch-callout:none] ${armed === t ? "border-ink ring-2 ring-brass-700" : "border-ink/15"} ${focusRing}`}
                    style={{ touchAction: "pan-x" }}
                    onPointerDown={(e) => startNew(e, t)}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => {
                      if (performance.now() < clickLock.current) return;
                      addAtEnd(t);
                    }}
                    title={tr("{name} – antippen, oder gedrückt halten bzw. nach oben in den Plan ziehen", { name: tr(MODULES[t].label) })}
                    // Fix-Runde 1 (F2, WCAG 2.5.3): der sichtbare Name steht immer am Anfang des Namens
                    aria-label={tr(MODULES[t].label) === tr(MODULES[t].name) || tr(MODULES[t].label).startsWith(`${tr(MODULES[t].name)} `) ? tr("{name} hinzufügen", { name: tr(MODULES[t].label) }) : tr("{short}: {name} hinzufügen", { short: tr(MODULES[t].name), name: tr(MODULES[t].label) })}
                  >
                    <ModuleIcon t={t} size={20} />
                    <span className="whitespace-nowrap text-[0.75rem] leading-tight">{tr(MODULES[t].name)}</span>
                  </button>
                ))}
              </div>
              {/* Scroll-Hinweis: Verlauf in Papierfarbe an der Seite, an der es weitergeht */}
              {/* QM r4: auch links Pfeil + kräftigerer Verlauf (vorher nur blasser Verlauf über „…rrspüler“) */}
              <span
                aria-hidden="true"
                data-kp-fade-l={fade.l ? "on" : "off"}
                className={`pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-start bg-linear-to-r from-paper via-paper/85 to-transparent pl-0.5 text-ink-soft transition-opacity duration-200 motion-reduce:transition-none ${fade.l ? "opacity-100" : "opacity-0"}`}
              >
                <ArrowLeft size={15} />
              </span>
              <span
                aria-hidden="true"
                data-kp-fade-r={fade.r ? "on" : "off"}
                className={`pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-end bg-linear-to-l from-paper via-paper/85 to-transparent pr-0.5 text-ink-soft transition-opacity duration-200 motion-reduce:transition-none ${fade.r ? "opacity-100" : "opacity-0"}`}
              >
                <ArrowRight size={15} />
              </span>
            </div>
          )}
          <p className="sr-only" role="status" aria-live="polite">{status}</p>
        </div>
      )}
    </div>
  );
}
