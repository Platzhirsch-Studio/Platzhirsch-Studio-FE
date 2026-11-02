"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, CalendarDays, Check, ChevronDown, Copy, FlipHorizontal2, Hand, MoreHorizontal, Move, RotateCw, Send, Trash2, Undo2, X } from "lucide-react";
import { analyzeJoins, findDock, snapDock } from "../../../lib/sofaplaner/geometry.js";
import { MEASURE_LABEL } from "../../../lib/sofaplaner/normalize.js";
import {
  DEFAULT_ROOM,
  PRICE_CONFIG,
  WALKWAY_IDEAL,
  WALKWAY_MIN,
  bounds,
  checkPlan,
  clampToRoom,
  fitItemsToRoom,
  fitTemplate,
  fitOpenings,
  footprint,
  makeLookup,
  newId,
  openingZone,
  overlappingPairs,
  oversize,
  planFor,
  planSchema,
  planToText,
  pricesPublic,
  rectsOverlap,
  resolvePlan,
  nofitReason,
  roomForTemplate,
  joinedGroup,
  rotateItems,
  settleGroup,
  separateItems,
  shortName,
  sideLabel,
  snap,
  summarize,
} from "./model";
import PlanSvg from "./PlanSvg";
import ModelPicker from "./ModelPicker";
import Palette from "./Palette";
import LookPanel from "./LookPanel";
import Summary from "./Summary";
import ResultPanel from "./ResultPanel";
import { CompositionThumb } from "./Glyph";
import { activeTemplateKey, thumbOf } from "../../../lib/sofaplaner/templates.js";
import { DRAFT_KEY, parseJson, useStoredRaw, writeRaw } from "./storage";
import { fetchWithTimeout, netErrorText } from "../net.js";
import s from "./sofaplaner.module.css";
import SceneBoundary from "../Kuechenplaner/SceneBoundary";
import { useT } from "./useT";
import { isCalmMotion } from "@/components/Home/calmMotion"; // System-Einstellung ODER Ruhige Ansicht
import { isKeyboardFocusTarget } from "../../../lib/kuechenplaner/focusGuard.js";
import { sourceCopy, terminHref } from "../../../lib/sofaplaner/copy/source.js";
import { TERMIN_HREF as TERMIN_HREF_DE } from "../../../lib/sofaplaner/copy/index.js";
import { localizeFamily } from "../../../lib/sofaplaner/copy/family-en.js";
import { localizeFamilyIntl } from "../../../lib/sofaplaner/copy/family-intl.js";
import { handoffHref, handoffName, storeHandoff } from "../../../lib/sofaplaner/handoff.js";

function Loading3d() {
  const T = useT();
  return (
    // Motion: shared .ph-skeleton shimmer behind the text (static when calm)
    <div className={`${s.loading3d} ph-skeleton`} role="status">
      <span>
        {T("3D-Vorschau wird geladen …")}<span className={s.loadingHint}>{T("Bei langsamer Verbindung kann das etwas dauern. Die 2D-Draufsicht bleibt nutzbar.")}</span>
      </span>
    </div>
  );
}
// 3D-Team 31.10.: start loading the three.js chunk on hover/focus of the 3D
// button, so the scene is (nearly) ready when the click lands. Same module as
// the dynamic import below – webpack serves both from one chunk.
const prefetch3d = () => {
  import("./Preview3D").catch(() => {});
};
const Preview3D = dynamic(() => import("./Preview3D"), {
  ssr: false,
  loading: () => <Loading3d />,
});

export const STEPS = [
  [1, "Modell"],
  [2, "Form"],
  [3, "Anpassen"],
  [4, "Ausführung"],
  [5, "Im Raum prüfen"],
  [6, "Übersicht"],
];
const EXPERT_KEY = "ph.sofaplaner.expert";
// QM planer-tools: Maßangaben nicht umbrechen („560 / × 440 cm“ auf 375 px).
const keepDims = (t) => t.replace(/(\d) × (\d)/g, "$1\u00a0×\u00a0$2").replace(/(\d) cm/g, "$1\u00a0cm");
const WALLS = { top: "Oben", right: "Rechts", bottom: "Unten", left: "Links" };

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

const fmtInt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Number field that never changes the plan silently (QM Sofaplaner R1 P1-4):
// empty or out-of-range input is rejected with an inline message; the plan
// keeps the last valid value until the input is valid.
function Num({ label, value, onChange, min, max, step = 10, suffix = "cm" }) {
  const T = useT();
  const id = useId();
  const [error, setError] = useState("");
  const commitValue = (el) => {
    const raw = el.value.trim().replace(",", ".");
    const v = Number(raw);
    // P3-F (R2): plain digits only – no "1e3", no sign
    if (!/^\d+(?:\.\d+)?$/.test(raw) || !Number.isFinite(v) || v < min || v > max) {
      setError(T("Bitte {min}–{max} {suffix} eingeben. Es gilt weiter {value} {suffix}.", { min: fmtInt(min), max: fmtInt(max), suffix, value: fmtInt(value) }));
      return;
    }
    setError("");
    const r = Math.round(v);
    el.value = String(r);
    if (r !== value) onChange(r);
  };
  return (
    <div className={s.field}>
      <label htmlFor={id}>{label}</label>
      <span className={s.numWrap}>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          className={s.input}
          defaultValue={value}
          min={min}
          max={max}
          step={step}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          onBlur={(e) => commitValue(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitValue(e.currentTarget);
            } else if (e.key === "Escape") {
              e.currentTarget.value = String(value);
              setError("");
            }
          }}
        />
        <span className={s.suffix}>{suffix}</span>
      </span>
      {error && (
        <span id={`${id}-err`} className={s.fieldErr} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function Panel({ title, children, defaultOpen = false }) {
  return (
    <details className={s.panel} open={defaultOpen}>
      <summary className={s.summary}>
        <span>{title}</span>
        <ChevronDown size={18} aria-hidden="true" className={s.chevron} />
      </summary>
      <div className={s.panelBody}>{children}</div>
    </details>
  );
}

// QM R1 P2-4 / R2 P2-A: the actions for the selected element sit in their own
// row next to the plan – above it on desktop, directly below it inside the
// sticky area on phones – so they never cover an element or the room edge.
function SelectionBar({ children }) {
  const T = useT();
  return (
    <div className={s.selBar} role="group" aria-label={T("Gewähltes Element bearbeiten")} data-selbar>
      {children}
    </div>
  );
}

function StepHead({ n, title, children }) {
  const T = useT();
  return (
    <div className={s.stepHead} data-step-head>
      <p className={s.overline}>{T("Schritt {n} von 6", { n })}</p>
      <h2 className={s.stepTitle} tabIndex={-1} data-step-title>
        {title}
      </h2>
      {children && <p className={s.lead}>{children}</p>}
    </div>
  );
}

export default function Planner({ index, initialFamily, initialPlan, initialStep = 1, calendar = false }) {
  // Welle 2 (EN): T() translates the interface, localizeFamily() the catalogue
  // texts (Minotti's own English element names, see copy/family-en.js).
  const T = useT();
  const SC = sourceCopy(T.locale);
  const TERMIN_HREF = T.foreign ? terminHref(T.locale) : TERMIN_HREF_DE;
  // FR/IT (Sprachen-Welle 01.11.2026): Startformen und Modellkarte in der Sprache, Elementnamen wie /en (copy/family-intl.js)
  const loc = (fam) => (fam && T.dict ? localizeFamilyIntl(fam, T.dict) : fam && T.en ? localizeFamily(fam) : fam);
  const famCache = useRef(new Map(initialFamily ? [[initialFamily.slug, loc(initialFamily)]] : []));
  const [family, setFamily] = useState(() => loc(initialFamily));
  const [plan, setPlanRaw] = useState(initialPlan);
  const [past, setPast] = useState([]);
  const [step, setStepRaw] = useState(initialStep);
  const [selectedId, setSelectedId] = useState(null);
  // lead-mobil-i18n fix-03 (WCAG 2.2, 2.5.7 Ziehbewegungen): Verschieben ohne
  // Ziehen – Pfeilknöpfe in der Auswahlleiste, nur für das Element, für das sie
  // geöffnet wurden (andere Auswahl → normale Leiste, ohne Effekt).
  const [movingId, setMovingId] = useState(null);
  const [view, setView] = useState("2d");
  const [noGL, setNoGL] = useState(false);
  const [problem3d, setProblem3d] = useState(null);
  const [touch3d, setTouch3d] = useState({ coarse: false, active: true });
  const [touched, setTouched] = useState(false);
  const [draftDismissed, setDraftDismissed] = useState(initialStep !== 1);
  const [announce, setAnnounce] = useState("");
  const [hint, setHint] = useState(null);
  const [loadingFam, setLoadingFam] = useState(null);
  const [famError, setFamError] = useState("");
  const [toast, setToast] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nofit, setNofit] = useState(null); // QM R3 P3-A: { key, room } of a start shape that does not fit
  const [chosenForm, setChosenForm] = useState(null); // QM r4: zuletzt gewählte Startform (Markierung der Karte)
  const expertRaw = useStoredRaw(EXPERT_KEY);
  const expert = expertRaw === "1";
  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const pendingFocus = useRef(null);
  const stepMoved = useRef(false);

  // QM R1 P2-1: a hint disappears after 6 s (not with reduced motion – then it
  // stays until closed, the next change or the next step).
  useEffect(() => {
    if (!hint) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setHint(null), 6000);
    return () => clearTimeout(t);
  }, [hint]);

  const lookup = useMemo(() => makeLookup(family), [family]);
  // marks the island as interactive (tests and QA wait for it instead of guessing)
  useEffect(() => {
    rootRef.current?.setAttribute("data-hydrated", "true");
  }, []);
  // Phones: everything that sticks on top (header, step bar, plan) is published
  // as --sp-cover, used as scroll-margin so focused or scrolled-to controls
  // never end up hidden under the sticky plan (WCAG 2.4.11).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      // QM r3: echte Header-Höhe (quer niedriger als --header-h) → --sp-top ohne Leerstreifen
      const headEl = document.querySelector("header");
      if (headEl) root.style.setProperty("--sp-header", `${Math.round(headEl.getBoundingClientRect().height)}px`);
      let cover = 0;
      // QM r2: im Querformat steht der Plan in der linken Spalte – nur was über
      // der Inhaltsspalte (rechts, mit „Zurück | Weiter“) klebt, zählt.
      const col = root.querySelector("[data-step-nav]")?.getBoundingClientRect();
      for (const el of root.querySelectorAll("[data-sticky]")) {
        const cs = getComputedStyle(el);
        if (cs.position !== "sticky") continue;
        const r = el.getBoundingClientRect();
        if (col && col.width && (r.right <= col.left || r.left >= col.right)) continue;
        cover = Math.max(cover, (parseFloat(cs.top) || 0) + r.height);
      }
      root.style.setProperty("--sp-cover", `${Math.round(cover) + 8}px`);
      // QM Restliste P3-3: phones show the undo message just above the sticky
      // "Zurück | Weiter" bar instead of on top of the plan.
      const nav = root.querySelector("[data-step-nav]");
      root.style.setProperty("--sp-nav-h", `${Math.round(nav ? nav.getBoundingClientRect().height : 0)}px`);
      // QM r3 (200 % Text, kleine Handys): Bleibt unter Header, Schrittleiste, angeheftetem
      // Plan und „Zurück | Weiter“ weniger als 30 % der Höhe für den Schrittinhalt, scrollt der
      // Plan mit der Seite (data-sp-tall, sofaplaner.module.css). Gemessen über die Höhen,
      // nicht über die Position – kein Hin- und Herschalten.
      const stage = root.querySelector("[data-stage][data-sticky]");
      const bar = root.querySelector("[data-sticky]:not([data-stage])");
      const narrow = window.matchMedia("(max-width: 1023px)").matches;
      let tall = false;
      if (narrow && stage && bar) {
        const head = document.querySelector("header")?.getBoundingClientRect().height || 56;
        const used = head + bar.getBoundingClientRect().height + stage.getBoundingClientRect().height + (nav ? nav.getBoundingClientRect().height : 0);
        // QM r5: Schwelle 34 % (iPhone 15 bei 200 % Text: ≈ 29–33 % blieben, gelesen in 3 Zeilen)
        tall = window.innerHeight - used < window.innerHeight * 0.34;
      }
      if (tall !== root.hasAttribute("data-sp-tall")) {
        root.toggleAttribute("data-sp-tall", tall);
        requestAnimationFrame(measure); // --sp-cover ohne den nun mitscrollenden Plan neu messen
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    for (const el of root.querySelectorAll("[data-sticky], [data-step-nav]")) ro.observe(el);
    const headObs = document.querySelector("header");
    if (headObs) ro.observe(headObs);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [step, view]);
  // QM planer-tools (01.11.2026, WCAG 2.4.11): Tastaturfokus auf ein Ziel hinter
  // der angehefteten Leiste „Zurück | Weiter“ (Handy/Tablet) holt es darüber –
  // WebKit scrollt beim Fokus nicht, solange das Ziel geometrisch im Bild ist.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const onFocus = (e) => {
      const nav = root.querySelector("[data-step-nav]");
      const t = e.target;
      if (!nav || !(t instanceof Element) || nav.contains(t)) return;
      if (!isKeyboardFocusTarget(t)) return; // QM r2: kein Springen beim Antippen (iOS)
      const pos = getComputedStyle(nav).position;
      if (pos !== "sticky" && pos !== "fixed") return;
      const navTop = nav.getBoundingClientRect().top;
      const r = t.getBoundingClientRect();
      if (!(navTop > 0 && navTop < window.innerHeight && r.bottom > navTop - 4 && r.top < window.innerHeight)) return;
      // nie unter die angeheftete Leiste oben schieben (--sp-cover, siehe oben)
      const cover = parseFloat(getComputedStyle(root).getPropertyValue("--sp-cover")) || 0;
      const delta = Math.min(r.bottom - navTop + 16, r.top - cover);
      if (delta > 0) window.scrollBy({ top: delta, behavior: "instant" });
    };
    root.addEventListener("focusin", onFocus);
    return () => root.removeEventListener("focusin", onFocus);
  }, []);
  const draftRaw = useStoredRaw(DRAFT_KEY);
  const draft = useMemo(() => {
    const p = planSchema.safeParse(parseJson(draftRaw, null));
    return p.success ? p.data : null;
  }, [draftRaw]);

  useEffect(() => {
    if (touched) writeRaw(DRAFT_KEY, JSON.stringify(plan));
  }, [plan, touched]);

  const setStep = (n) => {
    stepMoved.current = true;
    setStepRaw(n);
    setSelectedId(null);
    setHint(null);
    setToast(null);
    setMenuOpen(false);
    setNofit(null);
  };
  // QM R1 P1-2: after a step change the step title gets the focus and is
  // scrolled to just below everything that sticks on top (site header,
  // mobile step bar, sticky plan) – never to the top of the page.
  useEffect(() => {
    if (!stepMoved.current) return;
    stepMoved.current = false;
    const root = rootRef.current;
    const title = root?.querySelector("[data-step-title]");
    if (!title) return;
    title.focus({ preventScroll: true });
    const headEl = title.closest("[data-step-head]") || title;
    const hr = headEl.getBoundingClientRect();
    // QM r2 (Schritt 6 / 3D am Handy): steht der nicht angeheftete Plan direkt
    // über der Überschrift, zielt der Sprung auf seine Werkzeugzeile – sonst
    // schnitt die Schrittleiste „2D | 3D | Passt | Rückgängig“ zur Hälfte ab.
    const stageEl = root.querySelector("[data-stage]");
    const sr = stageEl?.getBoundingClientRect();
    const stageFirst =
      sr && !stageEl.hasAttribute("data-sticky") && getComputedStyle(stageEl).position !== "sticky" &&
      sr.top < hr.top && sr.right > hr.left && sr.left < hr.right && hr.top - sr.top < window.innerHeight * 0.55;
    const head = stageFirst ? stageEl : headEl;
    let cover = 0;
    for (const el of root.querySelectorAll("[data-sticky]")) {
      const cs = getComputedStyle(el);
      if (cs.position !== "sticky" && cs.position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.right <= hr.left || r.left >= hr.right) continue; // other column (desktop)
      cover = Math.max(cover, (parseFloat(cs.top) || 0) + r.height);
    }
    if (!cover) cover = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) * 16 || 72;
    // QM R2 P2-B: on phones the site header slides back in while the page
    // scrolls UP (HeaderFrame) and pushes step bar and plan down by its height.
    // Aim for the cover as it will be AFTER that transition.
    const header = document.querySelector("header[data-hidden]");
    const headerBack = header?.getAttribute("data-hidden") === "true" && window.matchMedia?.("(max-width: 767px)").matches;
    const top = head.getBoundingClientRect().top;
    const goesUp = top < cover;
    const aim = cover + (goesUp && headerBack ? header.offsetHeight || 56 : 0);
    const visible = top >= cover && top < window.innerHeight * 0.6;
    if (!visible) {
      const smooth = !isCalmMotion(document, window);
      window.scrollTo({ top: Math.max(0, window.scrollY + top - aim - 12), behavior: smooth ? "smooth" : "auto" });
    }
    // safety net: once scrolling and the header transition have settled, make
    // sure the heading is not under the sticky bottom edge
    const timer = window.setTimeout(() => {
      const h = head.getBoundingClientRect();
      let bottom = 0;
      for (const el of root.querySelectorAll("[data-sticky]")) {
        if (getComputedStyle(el).position !== "sticky") continue;
        const r = el.getBoundingClientRect();
        if (r.right <= h.left || r.left >= h.right) continue;
        bottom = Math.max(bottom, r.bottom);
      }
      if (bottom && h.top < bottom + 4) window.scrollBy({ top: h.top - bottom - 12, behavior: "auto" });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [step]);

  const commit = (updater, { record = true } = {}) => {
    if (record) {
      setPast((p) => [...p.slice(-29), plan]);
      setHint(null);
    }
    setPlanRaw(updater);
    setTouched(true);
  };
  const undo = () => {
    if (!past.length) return;
    setPlanRaw(past[past.length - 1]);
    setPast(past.slice(0, -1));
    setTouched(true);
    setHint(null);
    setToast(null);
    setAnnounce(T("Rückgängig gemacht."));
  };

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target || !rootRef.current) return;
    pendingFocus.current = null;
    const el = target === "palette" ? rootRef.current.querySelector("[data-palette] button") : rootRef.current.querySelector(`[data-id="${CSS.escape(target)}"]`);
    el?.focus();
  }, [plan]);

  const checks = useMemo(() => checkPlan(plan, lookup), [plan, lookup]);
  const flagged = useMemo(() => {
    const map = new Map();
    const rank = { info: 1, warn: 2, error: 3 };
    for (const c of checks) {
      if (c.level === "info") continue;
      for (const id of c.ids) if (!map.has(id) || rank[c.level] > rank[map.get(id)]) map.set(id, c.level);
    }
    return map;
  }, [checks]);
  const summary = useMemo(() => summarize(plan, lookup), [plan, lookup]);
  const selected = plan.items.find((i) => i.id === selectedId) || null;
  const selEl = selected ? lookup(selected.code) : null;

  // --- family -------------------------------------------------------------
  const getFamily = useCallback(async (slug) => {
    if (famCache.current.has(slug)) return famCache.current.get(slug);
    const res = await fetchWithTimeout(`/de/sofaplaner/katalog/${encodeURIComponent(slug)}`, {}, 20000);
    if (!res.ok) throw new Error(T("Modell konnte nicht geladen werden."));
    const fam = loc(await res.json());
    famCache.current.set(slug, fam);
    return fam;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- T and loc change only with the locale (a new page)
  }, []);

  const pickFamily = async (slug) => {
    if (family && slug === family.slug) {
      setStep(2);
      return;
    }
    if (plan.items.length && touched && !window.confirm(T("Beim Modellwechsel wird die aktuelle Zusammenstellung durch einen Startvorschlag des neuen Modells ersetzt. Raum, Fenster und Türen bleiben. Fortfahren?"))) return;
    setLoadingFam(slug);
    setFamError("");
    try {
      const fam = await getFamily(slug);
      const fresh = planFor(fam, null, plan.room, plan.openings);
      setFamily(fam);
      commit((p) => ({ ...fresh, name: p.name, room: p.room, grid: p.grid, openings: p.openings, items: fitItemsToRoom(fresh.items.map((i) => ({ ...i, id: newId() })), p.room) }));
      setAnnounce(T("{model} {name} gewählt.", { model: SC.modelWord, name: fam.name }));
      setStep(2);
    } catch (e) {
      setFamError(netErrorText(e, T("Das Modell konnte nicht geladen werden. Bitte erneut versuchen."), T.net));
    } finally {
      setLoadingFam(null);
    }
  };

  // --- item operations ----------------------------------------------------
  const updateItem = (id, patch, opts) =>
    commit((p) => ({ ...p, items: p.items.map((i) => (i.id === id ? clampToRoom({ ...i, ...patch }, p.room) : i)) }), opts);

  const findFreeSpot = (p, el) => {
    const probe = { id: "_", code: el.code, rot: 0, x: 0, y: 0, w: el.w, d: el.d };
    const doors = p.openings.filter((o) => o.type === "door").map((o) => openingZone(o, p.room));
    const b = bounds(p.items);
    const free = (pos, avoidBox) => {
      const it = clampToRoom({ ...probe, ...pos }, p.room);
      const r = footprint(it);
      if (p.items.some((i) => rectsOverlap(r, footprint(i), 0.5))) return null;
      if (doors.some((z) => rectsOverlap(r, z, 0.5))) return null;
      if (avoidBox && b && rectsOverlap(r, b, 0.5)) return null;
      return { x: it.x, y: it.y };
    };
    if (b) {
      // ottomans and tables in front of the sofa, other pieces beside it
      const front = el.role === "loose" ? [{ x: b.x + b.w / 2, y: b.y + b.h + 40 + el.d / 2 }] : [];
      for (const c of [...front, { x: b.x + b.w + 40 + el.w / 2, y: el.d / 2 }, { x: b.x - 40 - el.w / 2, y: el.d / 2 }, { x: b.x + b.w / 2, y: b.y + b.h + WALKWAY_IDEAL + el.d / 2 }]) {
        const hit = free(c, true);
        if (hit) return hit;
      }
    }
    for (const avoid of [true, false]) {
      for (let y = el.d / 2; y <= p.room.d - el.d / 2; y += 10) {
        for (let x = el.w / 2; x <= p.room.w - el.w / 2; x += 10) {
          const hit = free({ x, y }, avoid);
          if (hit) return hit;
        }
      }
    }
    return { x: p.room.w / 2, y: p.room.d / 2 };
  };

  const addVariants = (variants, at = null) => {
    const v = variants.filter((e) => e.w && e.d);
    if (!v.length) return;
    const el = v[0];
    const id = newId();
    let item = null;
    let note = "";
    if (!at && plan.items.length && (el.role === "end" || el.role === "mid" || el.role === "corner")) {
      const r = findDock(plan.items, lookup, v, { prefer: selectedId, room: plan.room, makeId: () => id });
      if (r.item) {
        item = r.item;
        const t = lookup(r.item.code);
        note = T(r.outside ? "{name} angedockt – ragt über die Wand, bitte Raum oder Position prüfen." : "{name} angedockt.", { name: T.dyn(shortName(t)) });
      } else if (r.reason && r.reason !== "empty") {
        setAnnounce(T.dyn(r.reason));
        setHint(T.dyn(r.reason));
        return;
      }
    }
    if (!item) {
      const pos = at ? { x: snap(at.x, plan.grid), y: snap(at.y, plan.grid) } : findFreeSpot(plan, el);
      item = clampToRoom({ id, code: el.code, rot: 0, w: el.w, d: el.d, ...pos }, plan.room);
      if (at) {
        const dock = snapDock([...plan.items, item], lookup, item, item, 40);
        if (dock && !dock.blocked) item = { ...item, x: dock.x, y: dock.y };
      }
      note = T("{name} hinzugefügt.", { name: T.dyn(shortName(el)) });
    }
    commit((p) => ({ ...p, items: [...p.items, item] }));
    setSelectedId(item.id);
    setHint(null);
    setAnnounce(note);
  };

  const removeItem = (id) => {
    const idx = plan.items.findIndex((i) => i.id === id);
    const next = plan.items[idx + 1] || plan.items[idx - 1];
    pendingFocus.current = next ? next.id : "palette";
    commit((p) => ({ ...p, items: p.items.filter((i) => i.id !== id) }));
    setSelectedId(null);
    setAnnounce(T("Element entfernt."));
  };

  const rotateItem = (id) => {
    const it = plan.items.find((i) => i.id === id);
    if (!it) return;
    // QM R3 P3-B: a docked element turns together with everything joined to it
    const group = joinedGroup(plan.items, lookup, id);
    if (group.size > 1) {
      const turned = rotateItems(plan.items, group, plan.room);
      // keep it free of hard conflicts (wall, door swing, other pieces) if any spot allows
      const settled = settleGroup({ ...plan, items: turned }, group, lookup);
      const items = settled.items;
      commit((p) => ({ ...p, items }));
      const msg = T(settled.moved ? "Sofa als Ganzes gedreht und frei gestellt." : "Sofa als Ganzes gedreht.") + (settled.ok ? "" : ` ${T("So entsteht ein Konflikt – verschieben oder rückgängig machen.")}`);
      setAnnounce(msg);
      setToast({ text: msg, undo: true });
      return;
    }
    const rot = (it.rot + 90) % 360;
    const r = footprint(clampToRoom({ ...it, rot }, plan.room));
    let { x, y } = clampToRoom({ ...it, rot }, plan.room);
    if (r.x > 0 && r.x <= 15) x -= r.x;
    if (r.y > 0 && r.y <= 15) y -= r.y;
    const dr = plan.room.w - (r.x + r.w),
      db = plan.room.d - (r.y + r.h);
    if (dr > 0 && dr <= 15) x += dr;
    if (db > 0 && db <= 15) y += db;
    updateItem(id, { rot, x, y });
    setAnnounce(T("Gedreht auf {rot} Grad.", { rot }));
  };

  const otherSide = (el) => (el?.side ? family.elements.find((e) => e.group === el.group && e.side && e.side !== el.side && e.w === el.w && e.d === el.d) : null);
  const flipItem = (id) => {
    const it = plan.items.find((i) => i.id === id);
    const other = otherSide(lookup(it?.code));
    if (!other) return;
    updateItem(id, { code: other.code });
    setAnnounce(T("{side} gewählt.", { side: T.dyn(sideLabel(other)) }));
  };

  const duplicateItem = (id) => {
    const it = plan.items.find((i) => i.id === id);
    const el = lookup(it?.code);
    if (el) addVariants(family.elements.filter((e) => e.group === el.group));
  };

  // After a drag: a move that creates an overlap or an impossible join is undone.
  const onDragEnd = (id, from) => {
    const hard = (p) => checkPlan(p, lookup).filter((c) => c.level === "error" && c.ids.includes(id) && (c.kind === "overlap" || c.kind === "join"));
    const now = hard(plan);
    const back = { ...plan, items: plan.items.map((i) => (i.id === id ? { ...i, ...from } : i)) };
    if (!now.length || now.length <= hard(back).length) return;
    setPlanRaw(back);
    setAnnounce(T("Nicht möglich: {text} Das Element steht wieder an seinem Platz.", { text: T.dyn(now[0].text) }));
    setHint(T.dyn(now[0].text));
  };

  // Ein Rasterschritt (Pfeiltaste oder Pfeilknopf), mit Andocken wie beim Ziehen.
  // fix-03 (WCAG 4.1.3): die neue Lage wird angesagt, nicht nur das Andocken.
  const nudge = (it, dx, dy) => {
    const moved = { ...it, x: it.x + dx, y: it.y + dy };
    const dock = snapDock(plan.items, lookup, it, moved, 6);
    const patch = dock && !dock.blocked ? { x: dock.x, y: dock.y } : { x: moved.x, y: moved.y };
    updateItem(it.id, patch);
    const at = footprint(clampToRoom({ ...it, ...patch }, plan.room)); // Abstand Wand links / oben
    const where = T("{x} cm von der linken Wand, {y} cm von der oberen Wand.", { x: Math.round(at.x), y: Math.round(at.y) });
    setAnnounce(dock && !dock.blocked ? `${T("Angedockt.")} ${where}` : where);
  };

  const onKey = (e, it) => {
    const step = e.shiftKey ? 1 : plan.grid;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      nudge(it, dx, dy);
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      rotateItem(it.id);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      removeItem(it.id);
    } else if (e.key === "Escape") {
      setSelectedId(null);
    } else if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      undo();
    }
  };

  // --- room / openings -------------------------------------------------------
  const setRoom = (patch) => {
    const room = { ...plan.room, ...patch };
    const fitted = fitOpenings(plan.openings, room);
    // the sofa moves only as one block, never pushed into itself (QM R1 P1-4)
    let items = fitItemsToRoom(plan.items, room);
    // old drafts may still contain overlaps from earlier versions
    const grew = room.w >= plan.room.w && room.d >= plan.room.d;
    if (grew && overlappingPairs(items).length) items = separateItems(items, room);
    commit((p) => ({ ...p, room, openings: fitted.openings, items }));
    const big = oversize(items, room);
    const msgs = [];
    if (items !== plan.items) msgs.push(T("Das Sofa wurde als Ganzes verschoben, damit es im Raum bleibt."));
    if (big.w > 0 || big.d > 0) msgs.push(big.w > 0 ? T("Das Sofa ist {n} cm breiter als der Raum – es bleibt unverändert, bitte Raum oder Form anpassen.", { n: big.w }) : T("Das Sofa ist {n} cm tiefer als der Raum – es bleibt unverändert, bitte Raum oder Form anpassen.", { n: big.d }));
    if (fitted.removed) msgs.push(T("{n} Öffnung(en) passten nicht mehr in die Wand und wurden entfernt.", { n: fitted.removed }));
    else if (fitted.changed) msgs.push(T("{n} Fenster/Tür an die neue Wandlänge angepasst.", { n: fitted.changed }));
    setToast(msgs.length ? { text: msgs.join(" "), undo: true } : null);
  };
  const setOpening = (id, patch) => commit((p) => ({ ...p, openings: fitOpenings(p.openings.map((o) => (o.id === id ? { ...o, ...patch } : o)), p.room).openings }));
  const addOpening = (type) =>
    commit((p) => ({ ...p, openings: [...p.openings, { id: newId("o"), type, wall: "top", offset: 40, width: type === "door" ? 90 : 160, sill: type === "door" ? 0 : 60 }].slice(0, 12) }));
  const removeOpening = (id) => commit((p) => ({ ...p, openings: p.openings.filter((o) => o.id !== id) }));

  // QM R1 P1-3: start shapes are placed without a conflict in the current room
  // (other spot / other wall); shapes that cannot fit are marked on the tile.
  const fits = useMemo(() => {
    const m = new Map();
    if (step !== 2 || !family) return m;
    for (const t of family.templates) m.set(t.key, fitTemplate(t, plan.room, plan.openings, lookup, () => "x").fits);
    return m;
  }, [step, family, plan.room, plan.openings, lookup]);
  // QM r4 (iPad hoch): die Startform, die gerade im Plan steht, ist auf ihrer Karte markiert
  const activeForm = useMemo(() => (step === 2 && family ? activeTemplateKey(plan.items, family.templates, chosenForm) : null), [step, family, plan.items, chosenForm]);
  // QM R3 P3-A: a shape that does not fit is not placed straight away – the
  // tile opens a choice: enlarge the room to the smallest size that works,
  // take the shape anyway (conflict stays visible) or pick another shape.
  // QM Restliste P2-1 (WCAG 2.4.3): closing the choice returns the focus to
  // the shape tile that opened it instead of dropping it on <body>.
  const focusTile = (key) =>
    window.requestAnimationFrame(() => rootRef.current?.querySelector(`[data-form="${CSS.escape(key)}"]`)?.focus({ preventScroll: false }));
  const closeNofit = (key) => {
    setNofit(null);
    focusTile(key);
  };
  const chooseTemplate = (t) => {
    if (fits.get(t.key) === false) {
      const room = roomForTemplate(t, plan.room, plan.openings, lookup);
      setNofit({ key: t.key, room, reason: T.dyn(nofitReason(t, plan.room, plan.openings, lookup)) });
      setHint(null);
      setAnnounce(T(room ? "Form {label} passt nicht in Ihren Raum. Bitte wählen: Raum anpassen, trotzdem übernehmen oder andere Form." : "Form {label} passt nicht in Ihren Raum. Bitte wählen: trotzdem übernehmen oder andere Form.", { label: t.label }));
      window.requestAnimationFrame(() => rootRef.current?.querySelector("[data-nofit-choice] button")?.focus());
      return;
    }
    setNofit(null);
    applyTemplate(t);
  };
  const applyTemplateInRoom = (t, size) => {
    setChosenForm(t.key);
    const room = { ...plan.room, ...size };
    const fitted = fitOpenings(plan.openings, room);
    const r = fitTemplate(t, room, fitted.openings, lookup, () => newId());
    commit((p) => ({ ...p, room, openings: fitted.openings, items: r.items }));
    setSelectedId(null);
    setNofit(null);
    const msg = [T("Raum auf {w} × {d} cm vergrößert, Form {label} übernommen.", { w: room.w, d: room.d, label: t.label }), fitted.removed ? T("{n} Öffnung(en) entfernt.", { n: fitted.removed }) : fitted.changed ? T("{n} Fenster/Tür angepasst.", { n: fitted.changed }) : "", T("Raummaße in Schritt 5 prüfen.")].filter(Boolean).join(" ");
    setToast({ text: msg, undo: true });
    setAnnounce(msg);
  };
  const applyTemplate = (t) => {
    setNofit(null);
    setChosenForm(t.key);
    const r = fitTemplate(t, plan.room, plan.openings, lookup, () => newId());
    commit((p) => ({ ...p, items: r.items }));
    setSelectedId(null);
    if (!r.fits) {
      // marked on the tile beforehand; chosen anyway → explain what to change
      const msg = T("Form {label} ({w} × {d} cm) passt nicht in Ihren Raum ({rw} × {rd} cm) – auch nicht an einer anderen Wand oder mit Abstand zur Tür. Raum in Schritt 5 anpassen oder eine andere Form wählen.", { label: t.label, w: t.w, d: t.d, rw: plan.room.w, rd: plan.room.d });
      setHint(msg);
      setAnnounce(msg);
      return;
    }
    setAnnounce(T("Form {label} gewählt: {w} × {d} cm.", { label: t.label, w: t.w, d: t.d }));
  };

  const loadPlan = async (raw) => {
    const parsed = planSchema.safeParse(raw);
    if (!parsed.success) return;
    try {
      const fam = await getFamily(parsed.data.family);
      const { plan: p, dropped } = resolvePlan(parsed.data, fam);
      setFamily(fam);
      commit(p);
      setSelectedId(null);
      setDraftDismissed(true);
      setStep(3);
      if (dropped) setAnnounce(T("{n} Element(e) gibt es im Katalog nicht mehr und wurden entfernt.", { n: dropped }));
    } catch (e) {
      setFamError(netErrorText(e, T("Der Plan konnte nicht geladen werden."), T.net));
    }
  };

  const open3d = () => {
    if (!hasWebGL()) {
      setNoGL(true);
      return;
    }
    setProblem3d(null);
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    setTouch3d({ coarse, active: !coarse });
    setView("3d");
  };
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const on3dProblem = useCallback((kind) => {
    if (viewRef.current !== "3d") return; // closing the 3D view is not a problem
    setProblem3d(kind);
    setView("2d");
  }, []);
  const onLost3d = useCallback(() => on3dProblem("lost"), [on3dProblem]);
  // Endtest 29.10.2026: a lost WebGL context usually surfaces first as a render
  // error in SceneBoundary, before the (async) "webglcontextlost" event – then
  // the context is already flagged lost, and the note names the real cause.
  const rendererRef = useRef(null);
  const onRenderer = useCallback((gl) => {
    rendererRef.current = gl;
  }, []);
  // Grün 30.10.2026: lost before three.js finished creating the renderer
  // (no onCreated yet), the error comes from the renderer constructor – then
  // the canvas' own context tells whether it was a loss.
  const canvasRef = useRef(null);
  const onCanvas = useCallback((c) => {
    if (c) canvasRef.current = c;
  }, []);
  const onFailed3d = useCallback(() => {
    let lost = false;
    try {
      const r = rendererRef.current;
      const c = canvasRef.current;
      if (r && (!c || r.domElement === c)) lost = Boolean(r.getContext?.()?.isContextLost?.());
      else if (c) lost = Boolean((c.getContext("webgl2") || c.getContext("webgl"))?.isContextLost?.());
    } catch {
      lost = false;
    }
    on3dProblem(lost ? "lost" : "failed");
  }, [on3dProblem]);

  const setLook = (updater) => commit((p) => ({ ...p, look: typeof updater === "function" ? updater(p.look) : updater }));

  const errors = checks.filter((c) => c.level === "error");
  const warns = checks.filter((c) => c.level === "warn");
  const infos = checks.filter((c) => c.level === "info");
  const showDraft = !draftDismissed && !touched && draft && draft.items.length > 0 && JSON.stringify(draft) !== JSON.stringify(plan);
  const statusBadge =
    errors.length > 0 ? (
      <span className={s.badgeErr}>
        {T(errors.length > 1 ? "{n} Konflikte" : "{n} Konflikt", { n: errors.length })}
      </span>
    ) : warns.length > 0 ? (
      <span className={s.badgeWarn}>
        {T(warns.length > 1 ? "{n} Hinweise" : "{n} Hinweis", { n: warns.length })}
      </span>
    ) : (
      <span className={s.badgeOk}>{T("Passt")}</span>
    );
  const sizeText = summary.bounds ? `${Math.round(summary.bounds.w)} × ${Math.round(summary.bounds.h)} cm` : "–";
  const baseText = family?.options.base.find((o) => o.id === plan.look.base);
  const curvedHint = plan.items.some((i) => lookup(i.code)?.shape !== "rect") || /halbrund|gebogen|geschwungen|rund|curved|organisch/i.test(family?.typ || "");
  const freeFaces = useMemo(() => analyzeJoins(plan.items, lookup).free.length, [plan.items, lookup]);
  // Startraum unverändert (planFor → DEFAULT_ROOM): noch nicht der Raum der Kundin/des Kunden.
  const sampleRoom = plan.room.w === DEFAULT_ROOM.w && plan.room.d === DEFAULT_ROOM.d;

  const checkList = (
    <>
      {checks.length === 0 ? (
        <p className={s.okText}>{T("Keine Konflikte – Anschlüsse und Laufwege passen.")}</p>
      ) : (
        <ul className={s.checks}>
          {[...errors, ...warns, ...infos].map((c, i) => (
            <li key={i} className={s[`check_${c.level}`]}>
              <button type="button" className={s.linkBtn} onClick={() => setSelectedId(c.ids[0])}>
                <strong>{T(c.level === "error" ? "Konflikt: " : c.level === "warn" ? "Prüfen: " : "Hinweis: ")}</strong>
                {T.dyn(c.text)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const show2d = () => {
    setHint(null);
    setView("2d");
  };
  const editing = view === "2d" && step >= 2 && step <= 5;
  // QM R2 P1-A: the stage stays sticky on phones in steps 2–5 in BOTH views
  // (2D and 3D, same height), so tapping „3D“ after scrolling shows the scene.
  const sticky = step >= 2 && step <= 5;
  const selBar =
    editing && selected && selEl ? (
      <SelectionBar>
        <span className={s.selName}>
          <strong>{T.dyn(shortName(selEl))}</strong>
          <span className={s.selDim}>
            {T.cm(selEl.w)} × {T.cm(selEl.d)}
            {selEl.h != null ? ` × H ${T.cm(selEl.h)}` : ""} cm{selEl.missing.length > 0 ? ` · ${T("Maß im Showroom bestätigen")}` : ""}
          </span>
        </span>
        {movingId === selected.id ? (
          <span className={s.selActions} role="group" aria-label={T("Element verschieben")} data-sel-move>
            {[
              [ArrowLeft, "Nach links", -plan.grid, 0],
              [ArrowUp, "Nach oben", 0, -plan.grid],
              [ArrowDown, "Nach unten", 0, plan.grid],
              [ArrowRight, "Nach rechts", plan.grid, 0],
            ].map(([Icon, label, dx, dy]) => (
              <button key={label} type="button" className={s.selBtn} onClick={() => nudge(selected, dx, dy)} aria-label={T("{dir} verschieben ({n} cm)", { dir: T(label), n: plan.grid })}>
                <Icon size={18} aria-hidden="true" />
              </button>
            ))}
            <button type="button" className={s.selBtn} onClick={() => setMovingId(null)} data-sel-move-done>
              <Check size={18} aria-hidden="true" />
              <span className={s.selLabel}>{T("Fertig")}</span>
            </button>
          </span>
        ) : (
        <span className={s.selActions}>
          <button type="button" className={s.selBtn} onClick={() => setMovingId(selected.id)} title={T("Verschieben ohne Ziehen (auch Pfeiltasten)")} data-sel-move-open>
            <Move size={18} aria-hidden="true" />
            <span className={s.selLabel}>{T("Verschieben")}</span>
          </button>
          <button type="button" className={s.selBtn} onClick={() => rotateItem(selected.id)} title={T("Drehen (Taste R) – angedockte Elemente drehen sich als Ganzes mit")}>
            <RotateCw size={18} aria-hidden="true" />
            <span className={s.selLabel}>{T("Drehen")}</span>
          </button>
          {otherSide(selEl) && (
            <button type="button" className={s.selBtn} onClick={() => flipItem(selected.id)}>
              <FlipHorizontal2 size={18} aria-hidden="true" />
              <span className={s.selLabel}>{T("Seite wechseln")}</span>
            </button>
          )}
          <button type="button" className={s.selBtn} onClick={() => duplicateItem(selected.id)}>
            <Copy size={18} aria-hidden="true" />
            <span className={s.selLabel}>{T("Noch einmal")}</span>
          </button>
          <button type="button" className={s.selBtn} onClick={() => removeItem(selected.id)} title={T("Entfernen (Taste Entf)")}>
            <Trash2 size={18} aria-hidden="true" />
            <span className={s.selLabel}>{T("Entfernen")}</span>
          </button>
          <button type="button" className={s.selBtn} onClick={() => setSelectedId(null)} aria-label={T("Auswahl aufheben")}>
            <X size={18} aria-hidden="true" />
          </button>
        </span>
        )}
      </SelectionBar>
    ) : null;

  const stage = (
    <section className={`${s.stage} ${sticky ? s.stageSticky : ""} ${editing ? s.stageEdit : ""}`} aria-label={T("Planungsfläche")} data-sticky={sticky ? "" : undefined} data-stage="">
      <div className={s.toolbar}>
        <div className={s.seg} role="group" aria-label={T("Ansicht")}>
          <button type="button" aria-pressed={view === "2d"} onClick={show2d} aria-label={T("2D Draufsicht")}>
            <span>2D<span className={s.longOnly}>{T(" Draufsicht")}</span></span>
          </button>
          <button type="button" aria-pressed={view === "3d"} onClick={open3d} onPointerEnter={prefetch3d} onFocus={prefetch3d} aria-label={T("3D-Vorschau")}>
            <Box size={15} aria-hidden="true" /> <span>3D<span className={s.longOnly}>{T("-Vorschau")}</span></span>
          </button>
        </div>
        <span className={s.toolbarStatus} aria-hidden="true">
          {statusBadge}
        </span>
        <button type="button" className={s.iconBtn} onClick={undo} disabled={!past.length} aria-label={T("Rückgängig")}>
          <Undo2 size={18} aria-hidden="true" />
        </button>
      </div>
      {problem3d && view === "2d" && (
        <p className={s.note} role="status">
          {T(problem3d === "lost" ? "Die 3D-Vorschau wurde vom Browser beendet." : "Die 3D-Vorschau konnte nicht geladen werden.")} <span className={s.noteExtra}>{T("Ihr Plan ist vollständig erhalten.")}</span>{" "}
          <button type="button" className={s.linkBtn} onClick={open3d}>
            {T("3D erneut öffnen")}
          </button>
        </p>
      )}
      {noGL && view === "2d" && (
        <p className={s.note} role="status">
          {T("Ihr Browser unterstützt kein WebGL – die 3D-Vorschau ist nicht verfügbar. Die 2D-Draufsicht zeigt alle Maße.")}
        </p>
      )}
      {editing && (
        <div className={s.selSlot} data-idle={selBar ? undefined : ""}>
          {selBar || <p className={s.selIdle}>{T("Element antippen, um es zu drehen, zu spiegeln oder zu entfernen. Ziehen verschiebt es.")}</p>}
        </div>
      )}
      <div className={s.canvasWrap} ref={wrapRef}>
        {view === "2d" ? (
          <PlanSvg
            plan={plan}
            lookup={lookup}
            selectedId={selectedId}
            flagged={flagged}
            onSelect={setSelectedId}
            onBeginChange={() => setPast((p) => [...p.slice(-29), plan])}
            onChange={(id, patch) => updateItem(id, patch, { record: false })}
            onDragEnd={onDragEnd}
            onDragCancel={(id, from) => {
              updateItem(id, from, { record: false });
              setAnnounce(T("Verschieben abgebrochen. Das Element steht wieder an seinem Platz."));
            }}
            onDropCode={(code, at) => addVariants([lookup(code)].filter(Boolean), at)}
            onKey={onKey}
            onHint={(h) => setHint(h ? T.dyn(h) : h)}
            readOnly={!editing}
          />
        ) : (
          <>
            <div className={s.canvas3d}>
              <SceneBoundary onError={onFailed3d}>
                <Preview3D plan={plan} lookup={lookup} baseText={baseText ? `${baseText.label} ${baseText.detail || ""}` : ""} interactive={touch3d.active} onContextLost={onLost3d} onRenderer={onRenderer} onCanvas={onCanvas} />
              </SceneBoundary>
              {!touch3d.active && (
                <button type="button" className={s.activate3d} onClick={() => setTouch3d((t) => ({ ...t, active: true }))}>
                  <span>
                    <Hand size={16} aria-hidden="true" /> {T("Zum Drehen antippen")}
                  </span>
                </button>
              )}
              {touch3d.coarse && touch3d.active && (
                <button type="button" className={s.done3d} onClick={() => setTouch3d((t) => ({ ...t, active: false }))}>
                  {T("Fertig")}
                </button>
              )}
            </div>
            <p className={s.caption3d}>
              {T("Volumen nach Herstellermaßen, Polster schematisch, neutrale Bezugsfarbe.")}
              {plan.items.some((i) => lookup(i.code)?.h == null || lookup(i.code)?.sh == null) ? ` ${T("Halbtransparent: Höhe oder Sitzhöhe nicht veröffentlicht.")}` : ""}
              {curvedHint ? ` ${T("Gebogene, runde oder geneigte Formen sind als Rechteck vereinfacht.")}` : ""}{" "}
              {T(touch3d.coarse ? "Nach dem Antippen: ziehen zum Drehen, zwei Finger zum Zoomen." : "Ziehen zum Drehen, Scrollen zum Zoomen.")}
            </p>
          </>
        )}
        {hint && (
          <p className={s.hint} role="alert">
            <span>{hint}</span>
            <button type="button" className={s.iconBtnSm} onClick={() => setHint(null)} aria-label={T("Hinweis schließen")}>
              <X size={14} aria-hidden="true" />
            </button>
          </p>
        )}
        {toast && (
          <div className={s.toast} role="status">
            <span>{toast.text}</span>
            <span className={s.toastActions}>
              {toast.undo && past.length > 0 && (
                <button type="button" className={s.toastBtn} onClick={undo}>
                  {T("Rückgängig")}
                </button>
              )}
              <button type="button" className={s.iconBtnSm} onClick={() => setToast(null)} aria-label={T("Meldung schließen")}>
                <X size={14} aria-hidden="true" />
              </button>
            </span>
          </div>
        )}
      </div>
      <p className={s.statusLine} aria-hidden="true">
        <span className={s.statusSize}>Sofa {sizeText}</span>
        <span className={s.statusSeats}>
          {T(plan.items.length === 1 ? "{n} Element" : "{n} Elemente", { n: plan.items.length })}
        </span>
      </p>
      {editing && (
        <div className={s.inspector} aria-live="polite">
          {selected && selEl ? (
            <span className={s.inspTitle}>
              <strong>{T.dyn(shortName(selEl))}</strong>
              <span className={s.muted}>
                {`${T.cm(selEl.w)} × ${T.cm(selEl.d)} cm`}{selEl.h != null ? `, H ${T.cm(selEl.h)}` : ""}
                {selEl.sh != null ? `, ${T("Sitzhöhe")} ${T.cm(selEl.sh)}` : ""}
                {selEl.sd != null ? `, ${T("Sitztiefe")} ${T.cm(selEl.sd)}` : selEl.sdText ? `, ${T("Sitztiefe")} ${T.dyn(selEl.sdText)}` : ""}
              </span>
              {(selEl.shape !== "rect" || curvedHint) && <span className={s.small}>{T("Form im Grundriss als Rechteck vereinfacht (Außenmaße laut Hersteller).")}</span>}
              {selEl.missing.length > 0 && <span className={s.tileMissing}>{T("Maß im Showroom bestätigen: {list}", { list: selEl.missing.map((k) => T(MEASURE_LABEL[k])).join(", ") })}</span>}
              {expert && (
                <span className={s.tileCode}>
                  {selEl.code}
                  {selEl.official ? ` · ${T("Hersteller-Nr.")} ${selEl.official}` : ""}
                  {selEl.line ? ` · ${T("Linie")} ${selEl.line}` : ""}
                  {selEl.module ? ` · ${T("Sitzmodul {n} cm", { n: selEl.module })}` : ""}
                </span>
              )}
              {expert && selEl.joins && <span className={s.small} lang={T.foreign ? "de" : undefined}>{T("Anschluss laut Recherche:")} {selEl.joins}</span>}
            </span>
          ) : (
            <span className={s.muted}>
              {T("Element antippen zum Auswählen, ziehen zum Verschieben – nahe einer freien Anschlussseite rastet es ein. Tastatur: Tab, Pfeile, R, Entf.")}
            </span>
          )}
        </div>
      )}
    </section>
  );

  // UX-Benchmark P0-1: „Termin“ in der festen Leiste (Schritte 2–6) nimmt den
  // Plan mit – gleicher Weg wie „Termin mit diesem Plan“ in ResultPanel
  // (Teilen-Link, ?plan=, sessionStorage). Vorher führte der Knopf ohne Plan
  // auf /termin bzw. /beratung, das Studio sah die Planung nicht.
  // Ohne Elemente oder bei Klick mit Zusatztaste/Mitteltaste: einfacher Link.
  const [navBusy, setNavBusy] = useState(false);
  const goTermin = async (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    if (!plan.items.length) return;
    e.preventDefault();
    if (navBusy) return;
    setNavBusy(true);
    let shareUrl = "";
    try {
      const res = await fetchWithTimeout("/de/sofaplaner/teilen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, locale: T.locale }) }, 15000);
      if (res.ok) shareUrl = (await res.json()).url || "";
    } catch {
      /* ohne Link weiter – der Plantext geht trotzdem mit */
    }
    const raw = planToText(plan, family, shareUrl);
    const text = T.foreign ? raw.split("\n").map((l) => T.dyn(l)).join("\n") : raw;
    let storage = null;
    try {
      storage = window.sessionStorage;
    } catch {
      /* gesperrt */
    }
    storeHandoff(storage, { text, shareUrl, locale: T.locale });
    window.location.assign(handoffHref({ locale: T.locale, name: handoffName(plan.name, family?.name), count: plan.items.length, shareUrl, calendar }));
  };

  const next = STEPS.find(([n]) => n === step + 1);
  const prev = STEPS.find(([n]) => n === step - 1);
  const expertSwitch = (extra = "") => (
    <button
      type="button"
      role="switch"
      aria-checked={expert}
      className={`${s.switch} ${extra}`}
      onClick={() => writeRaw(EXPERT_KEY, expert ? null : "1")}
      title={T("Zeigt alle Elemente einzeln, Codes, Linien und Anschluss-Notizen – für Berater und Architekten")}
    >
      <span className={s.switchTrack} aria-hidden="true">
        <span className={s.switchThumb} />
      </span>
      {T("Expertenmodus")}
    </button>
  );

  return (
    <div className={s.app} ref={rootRef}>
      <p className={s.srOnly} aria-live="polite">
        {announce}
      </p>

      {showDraft && (
        <div className={s.banner} role="region" aria-label={T("Gespeicherter Entwurf")} data-draft-banner>
          <span>{T("Sie haben in diesem Browser einen Entwurf „{name}“ gespeichert.", { name: draft.name })}</span>
          <span className={s.btnRow}>
            <button type="button" className={s.btn} onClick={() => loadPlan(draft)}>
              {T("Entwurf fortsetzen")}
            </button>
            <button type="button" className={s.btnGhost} onClick={() => setDraftDismissed(true)}>
              {T("Neu beginnen")}
            </button>
          </span>
        </div>
      )}

      <div className={s.topbar} data-sticky="">
        <nav aria-label={T("Schritte")} className={s.stepper}>
          <ol>
            {STEPS.map(([n, label]) => (
              <li key={n}>
                <button
                  type="button"
                  aria-current={step === n ? "step" : undefined}
                  disabled={!family && n > 1}
                  title={!family && n > 1 ? T("Bitte zuerst ein Modell wählen") : undefined}
                  onClick={() => setStep(n)}
                  className={s.stepBtn}
                >
                  <span className={s.stepNum} aria-hidden="true">
                    {n}
                  </span>
                  <span className={s.stepLabel}>{T(label)}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        {expertSwitch(s.deskOnly)}
        <button
          type="button"
          className={`${s.iconBtn} ${s.menuBtn}`}
          aria-expanded={menuOpen}
          aria-controls="sp-menu"
          aria-label={family ? T("Modell {name} und Einstellungen", { name: family.name }) : T("Einstellungen")}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {family && <span className={s.menuModel}>{family.name}</span>}
          <MoreHorizontal size={18} aria-hidden="true" />
        </button>
        {menuOpen && (
          <div id="sp-menu" className={s.menu}>
            {family && (
              <p className={s.menuRow}>
                <span>
                  <span className={s.overline}>{SC.modelWord}</span> <strong>{family.name}</strong>
                  {family.designer ? <span className={s.muted}> · Design {family.designer}</span> : null}
                </span>
                {step > 1 && (
                  <button type="button" className={s.btnGhost} onClick={() => setStep(1)}>
                    {T("Modell wechseln")}
                  </button>
                )}
              </p>
            )}
            {expertSwitch()}
          </div>
        )}
      </div>

      {family && step > 1 && (
        <p className={s.modelLine}>
          <span>
            <span className={s.overline}>{SC.modelWord}</span> <strong className={s.modelLineName}>{family.name}</strong>
            {family.designer ? <span className={s.muted}> · Design {family.designer}</span> : null}
          </span>
          <button type="button" className={s.linkBtn} onClick={() => setStep(1)}>
            {T("Modell wechseln")}
          </button>
        </p>
      )}

      {step === 1 ? (
        <ModelPicker index={index} current={family?.slug} loading={loadingFam} error={famError} onPick={pickFamily} />
      ) : (
        <div className={s.layout}>
          {stage}
          <aside className={s.side} aria-label={T("Planungsschritt")}>
            <div className={s.summaryCard} aria-live="polite">
              <div>
                <span className={s.overline}>{T("Gesamtmaß")}</span>
                <strong className={s.big}>{sizeText}</strong>
                <span className={s.muted}>
                  {T(plan.items.length === 1 ? "{n} Element" : "{n} Elemente", { n: plan.items.length })}
                  {summary.maxH != null ? ` · ${T("Höhe bis {h} cm", { h: T.cm(summary.maxH) })}` : ""}
                  {summary.seatHeights.length ? ` · ${T("Sitzhöhe")} ${summary.seatHeights.map(T.cm).join("/")} cm` : ""}
                </span>
              </div>
              <div className={s.status}>{statusBadge}</div>
              <div className={s.price}>
                {pricesPublic() ? (
                  <>
                    <span className={s.overline}>{T(PRICE_CONFIG.label)}</span>
                    <strong>{T("Auf Anfrage")}</strong>
                  </>
                ) : (
                  <>
                    <span className={s.overline}>{T("Richtpreis")}</span>
                    <strong>{T("Im Gespräch")}</strong>
                    <span className={s.small} data-testid="sp-price-hidden">
                      {T(PRICE_CONFIG.label)}. {T("Persönlich nach Beratung, passend zu Elementen und Bezug.")}
                    </span>
                  </>
                )}
              </div>
            </div>

            {step === 2 && (
              <div className={s.stack}>
                <StepHead n={2} title={T("Form wählen")}>
                  {T("Startvorschläge aus echten {name}-Elementen. Danach passen Sie alles an.", { name: family.name })}
                </StepHead>
                {/* UX-Benchmark P1-3: solange der Raum nicht geändert wurde, ist es ein Beispielraum – nicht „Ihr Raum“. */}
                {sampleRoom && (
                  <p className={s.small} data-sofa-beispielraum="">
                    {keepDims(T("Der Grundriss zeigt einen Beispielraum ({w} × {d} cm).", { w: plan.room.w, d: plan.room.d }))}{" "}
                    <button type="button" className={s.linkBtn} onClick={() => setStep(5)}>
                      {T("Eigene Raummaße eintragen")}
                    </button>
                  </p>
                )}
                {family.templates.length ? (
                  <ul className={s.formGrid}>
                    {family.templates.map((t) => {
                      const ok = fits.get(t.key) !== false;
                      const current = activeForm === t.key;
                      return (
                        <li key={t.key}>
                          <button
                            type="button"
                            className={s.formCard}
                            onClick={() => chooseTemplate(t)}
                            aria-current={current ? "true" : undefined}
                            data-current={current ? "" : undefined}
                            aria-expanded={ok ? undefined : nofit?.key === t.key}
                            data-form={t.key}
                            data-nofit={ok ? undefined : ""}
                            aria-describedby={ok ? undefined : `sp-nofit-${t.key}`}
                          >
                            <CompositionThumb items={thumbOf(t.items, lookup)} />
                            <span className={s.formName}>{t.label}</span>
                            {current && <span className={s.formCurrent}>{T("Aktuelle Form")}</span>}
                            <span className={s.tileDim}>
                              {t.w} × {t.d} cm
                            </span>
                            <span className={s.small}>{t.hint}</span>
                            {!ok && (
                              <span className={s.tileReason} id={`sp-nofit-${t.key}`}>
                                {keepDims(T(sampleRoom ? "Passt nicht in den Beispielraum ({w} × {d} cm)" : "Passt nicht in Ihren Raum ({w} × {d} cm)", { w: plan.room.w, d: plan.room.d }))}
                              </span>
                            )}
                          </button>
                          {nofit?.key === t.key && (
                            <div className={s.nofitChoice} role="group" aria-label={T("Form {label} passt nicht", { label: t.label })} data-nofit-choice>
                              <p className={s.small}>
                                {T("{label} passt nicht in Ihren Raum ({w} × {d} cm).", { label: t.label, w: plan.room.w, d: plan.room.d })} {nofit.reason}
                                {nofit.room ? ` ${T("Ab {w} × {d} cm passt die Form ohne Konflikt.", { w: nofit.room.w, d: nofit.room.d })}` : ` ${T("Auch im größten Raum (20 m) passt sie nicht ohne Konflikt.")}`}
                              </p>
                              <div className={s.btnRow}>
                                {nofit.room && (
                                  <button
                                    type="button"
                                    className={s.btn}
                                    onClick={() => {
                                      applyTemplateInRoom(t, nofit.room);
                                      focusTile(t.key);
                                    }}
                                  >
                                    {T("Raum auf {w} × {d} cm anpassen", { w: nofit.room.w, d: nofit.room.d })}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={s.btnGhost}
                                  onClick={() => {
                                    applyTemplate(t);
                                    focusTile(t.key);
                                  }}
                                >
                                  {T("Trotzdem übernehmen")}
                                </button>
                                <button type="button" className={s.linkBtn} onClick={() => closeNofit(t.key)}>
                                  {T("Andere Form wählen")}
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={s.note}>{T("Für dieses Modell gibt es keine Startform – stellen Sie die Elemente im nächsten Schritt selbst zusammen.")}</p>
                )}
                <button type="button" className={s.btnGhost} onClick={() => commit((p) => ({ ...p, items: [] }))}>
                  {T("Leer beginnen")}
                </button>
                {family.compositions.length > 0 && (
                  <details className={s.more}>
                    <summary>{T("Beispiel-Kompositionen des Herstellers ({n})", { n: family.compositions.length })}</summary>
                    <ul className={s.plainList}>
                      {family.compositions.map((c, i) => (
                        <li key={i}>
                          <strong>{c.name}</strong>
                          {c.dims ? ` – ${c.dims}` : ""}
                          {c.elements.length ? <span className={s.optDetail}>{c.elements.join(" · ")}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            {step === 3 && (
              <div className={s.stack}>
                <StepHead n={3} title={T("Anpassen")}>
                  {T("Antippen fügt ein Element hinzu und dockt es an die passende Seite an. Was nicht anschließbar ist, ist ausgegraut – mit Begründung.")}
                </StepHead>
                {(errors.length > 0 || freeFaces > 0) && (
                  <Panel title={T("Anschlüsse prüfen ({n})", { n: errors.length + warns.filter((w) => w.kind === "open" || w.kind === "join").length })} defaultOpen>
                    <ul className={s.checks}>
                      {[...errors, ...warns.filter((w) => w.kind === "open" || w.kind === "join")].map((c, i) => (
                        <li key={i} className={s[`check_${c.level}`]}>
                          <button type="button" className={s.linkBtn} onClick={() => setSelectedId(c.ids[0])}>
                            {T.dyn(c.text)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                )}
                <Palette
                  family={family}
                  plan={plan}
                  lookup={lookup}
                  selectedId={selectedId}
                  expert={expert}
                  onAdd={(v) => addVariants(v)}
                  onReject={(reason) => {
                    setHint(T.dyn(reason));
                    setAnnounce(T.dyn(reason));
                  }}
                />
                <details className={s.more}>
                  <summary>{T("So prüft der Planer die Anschlüsse")}</summary>
                  <ul className={s.plainList}>
                    <li>{T("Endelemente haben eine Armlehne (Abschluss) und eine Anschlussseite; Mittelelemente schließen beidseitig an, Ecken an zwei Seiten.")}</li>
                    <li>{T("Elemente verschiedener Linien oder Sitzmodul-Breiten werden nicht verbunden.")}</li>
                    <li>{T("Rücken laufen bündig; unterschiedliche Tiefen werden als Hinweis gezeigt.")}</li>
                    <li>{SC.rulesNote}</li>
                    {family.rules.slice(0, 6).map((r, i) => (
                      <li key={i} lang={T.foreign ? "de" : undefined}>{T("Laut Recherche:")} {r}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}

            {step === 4 && (
              <div className={s.stack}>
                <StepHead n={4} title={T("Ausführung")}>
                  {T("Rücken, Armlehne, Sockel, Bezug und Kissen – so, wie der Hersteller das Modell anbietet.")}
                </StepHead>
                <LookPanel family={family} look={plan.look} onChange={setLook} expert={expert} planElements={plan.items.map((i) => lookup(i.code))} />
              </div>
            )}

            {step === 5 && (
              <div className={s.stack}>
                <StepHead n={5} title={T("Im Raum prüfen")}>
                  {T("Raummaße, Fenster und Türen eintragen. Der Planer prüft Laufwege ({min}–{max} cm), Türschwenk und Fensterbrüstung.", { min: WALKWAY_MIN, max: WALKWAY_IDEAL })}
                </StepHead>
                <Panel title={T("Abstände & Laufwege ({n})", { n: errors.length + warns.length })} defaultOpen>
                  {checkList}
                </Panel>
                <Panel title={T("Raum, Fenster & Türen")} defaultOpen>
                  <div className={s.grid2}>
                    <Num key={`w${plan.room.w}`} label={T("Raumbreite")} value={plan.room.w} min={150} max={2000} onChange={(w) => setRoom({ w })} />
                    <Num key={`d${plan.room.d}`} label={T("Raumtiefe")} value={plan.room.d} min={150} max={2000} onChange={(d) => setRoom({ d })} />
                  </div>
                  <label className={s.field}>
                    <span>{T("Raster")}</span>
                    <select className={s.input} value={plan.grid} onChange={(e) => commit((p) => ({ ...p, grid: Number(e.target.value) }))}>
                      <option value={5}>5 cm</option>
                      <option value={10}>10 cm</option>
                      <option value={20}>20 cm</option>
                    </select>
                  </label>
                  {plan.openings.map((o, idx) => (
                    <fieldset key={o.id} className={s.opening}>
                      <legend>
                        {T(o.type === "door" ? "Tür" : "Fenster")} {idx + 1}
                      </legend>
                      <div className={s.grid2}>
                        <label className={s.field}>
                          <span>{T("Wand")}</span>
                          <select className={s.input} value={o.wall} onChange={(e) => setOpening(o.id, { wall: e.target.value })}>
                            {Object.entries(WALLS).map(([k, l]) => (
                              <option key={k} value={k}>
                                {T(l)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Num key={`o${o.offset}`} label={T("Abstand von Ecke")} value={o.offset} min={0} max={2000} onChange={(v) => setOpening(o.id, { offset: v })} />
                        <Num key={`b${o.width}`} label={T("Breite")} value={o.width} min={40} max={600} onChange={(v) => setOpening(o.id, { width: v })} />
                        {o.type === "window" && <Num key={`s${o.sill}`} label={T("Brüstungshöhe")} value={o.sill} min={0} max={200} onChange={(v) => setOpening(o.id, { sill: v })} />}
                      </div>
                      <button type="button" className={s.btnGhost} onClick={() => removeOpening(o.id)}>
                        <Trash2 size={15} aria-hidden="true" /> {T("Entfernen")}
                      </button>
                    </fieldset>
                  ))}
                  <div className={s.btnRow}>
                    <button type="button" className={s.btnGhost} onClick={() => addOpening("window")}>
                      + {T("Fenster")}
                    </button>
                    <button type="button" className={s.btnGhost} onClick={() => addOpening("door")}>
                      + {T("Tür")}
                    </button>
                  </div>
                  <p className={s.small}>{T("Abstand gemessen von der linken bzw. oberen Raumecke der Zeichnung.")}</p>
                </Panel>
              </div>
            )}

            {step === 6 && (
              <div className={s.stack}>
                <StepHead n={6} title={T("Übersicht")}>
                  {T("Ihre Planung in Klartext. Darunter der Termin im Showroom mit diesem Plan, der Teilen-Link und die Merkliste.")}
                </StepHead>
                {errors.length + warns.length > 0 && (
                  <Panel title={T("Noch zu prüfen ({n})", { n: errors.length + warns.length })} defaultOpen={errors.length > 0}>
                    {checkList}
                  </Panel>
                )}
                <Summary plan={plan} family={family} lookup={lookup} />
                <Panel title={T("Showroom-Termin, Teilen & Merkliste")} defaultOpen>
                  <label className={s.field}>
                    <span>{T("Name des Plans")}</span>
                    <input className={s.input} value={T.foreign && plan.name === "Mein Sofa" ? T.dyn(plan.name) : plan.name} maxLength={60} aria-describedby="sp-name-hint" onChange={(e) => commit((p) => ({ ...p, name: e.target.value }), { record: false })} />
                    <span id="sp-name-hint" className={s.small}>
                      {T("Bitte keine persönlichen Daten eintragen (z. B. „Wohnzimmer“ statt Ihres Namens) – der Name wird im Teilen-Link mitgespeichert.")}
                    </span>
                  </label>
                  <ResultPanel plan={plan} family={family} onLoad={loadPlan} calendar={calendar} />
                </Panel>
              </div>
            )}

          </aside>
          <div className={s.stepNav} data-step-nav>
            {prev ? (
              <button type="button" className={s.btnGhost} onClick={() => setStep(prev[0])} aria-label={T("Zurück: {step}", { step: T(prev[1]) })}>
                <ArrowLeft size={16} aria-hidden="true" /> <span className={s.navPrevLabel}>{T(prev[1])}</span>
                <span className={s.navPrevShort}>{T("Zurück")}</span>
              </button>
            ) : (
              <span />
            )}
            {/* Fix-Runde 1 (F2): Termin in jedem Schritt erreichbar, auch in der festen Leiste */}
            {/* UX-Benchmark P0-1: in Schritt 6 ist der Termin DIE Hauptaktion (statt eines leeren Platzes rechts). */}
            {next ? (
              <a href={TERMIN_HREF} className={`${s.btnGhost} ${s.navTermin}`} aria-label={T("Termin im Showroom vereinbaren")} onClick={goTermin} aria-busy={navBusy || undefined} data-sofa-nav-termin="">
                <CalendarDays size={16} aria-hidden="true" /> <span className={s.navTerminLabel}>{T(navBusy ? "Plan wird übergeben …" : "Termin")}</span>
              </a>
            ) : (
              <a href={TERMIN_HREF} className={s.btnPrimary} onClick={goTermin} aria-busy={navBusy || undefined} data-sofa-nav-termin="">
                <Send size={16} aria-hidden="true" /> {T(navBusy ? "Plan wird übergeben …" : "Termin mit diesem Plan")}
              </a>
            )}
            {next && (
              <button type="button" className={s.btnPrimary} onClick={() => setStep(next[0])}>
                {T("Weiter: {step}", { step: T(next[1]) })} <ArrowRight size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

