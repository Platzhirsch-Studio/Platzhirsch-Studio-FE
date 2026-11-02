"use client";
// Küchenplaner – Hauptkomponente: Zustand mit Rückgängig/Wiederholen, Reiter
// (Raum, Möbel, Material, Prüfen, Ergebnis), Teilen-Link in der URL. Der
// Grundriss-Editor ist sofort da, die 3D-Szene lädt Viewer.js erst auf Klick.
//
// QA Runde 1: mobil kompakte angeheftete Ansicht (28svh) mit Werkzeugleiste in
// der Fläche, Preis + „Anfragen“ als Leiste unten (P1-4). Desktop: Preis über der
// Ansicht, alles über dem Falz (P2-3), nach Reiterwechsel zurück an den
// Planer-Anfang (P2-4). Module mobil als Kacheln mit Bottom-Sheet (P2-6).
// Pro-Ausbau (27.10.2026): freie Raumform, Dachschräge, Öffnungen/Anschlüsse,
// Ergonomie, vollständiger Modulkatalog mit Optionen, eigene Hängeschränke,
// Insel-Module, Material-Details, Prüfungen, Stückliste, Undo/Redo.
// Fix 1 (QA-Feedback 1): mobil größere Planfläche (P1-1), Rückgängig/Wiederholen
// in den Planleisten statt neben den Reitern (P2-3), Maßfelder melden Grenzen und
// leere Eingaben am Feld (P2-2), Hinweise ocker statt rot (P2-1), Hinweis bei
// ungültigem Teilen-Link (P3-1), Preisleiste weicht fokussierten Feldern (P3-4).
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Plus, Redo2, Trash2, Undo2, Wand2, X } from "lucide-react";
import {
  CARCASS_HEIGHTS,
  EDGES,
  FRONT_COLORS,
  FRONT_FINISHES,
  GRIP_COLORS,
  GRIPS,
  LIMITS,
  LINES,
  MODULES,
  MODULE_GROUPS,
  OPENINGS,
  PANELS,
  RASTER,
  SHAPES,
  SHAPE_ORDER,
  SINK_MOUNTS,
  SPLASHES,
  TEXTURE_BASE,
  UPPER_ORDER,
  WORKTOPS,
  defaultWidth,
  fmtCm,
  moduleWidths,
} from "./catalog";
import { DEFAULT_POLY, activeWalls, autoRun, defaultPlan, encodePlan, fillWithBase, presetAppliances, runLength, runUsed, switchRaster, withAutoRuns } from "./planState";
import { buildKitchen, islandModules } from "./geometry";
import { formatEUR, priceRange, wallLabel } from "./pricing";
import { scrollBehavior } from "@/components/Home/calmMotion"; // System-Einstellung ODER Ruhige Ansicht
import ScrollStrip from "./ScrollStrip";
import Viewer from "./Viewer";
// Fotoansicht (02.11.2026): passendstes von 66 vorgerenderten Bildern im Reiter Material.
import Fotoansicht from "./Fotoansicht";
import styles from "./Kuechenplaner.module.css";
import { historyReducer, initHistory } from "../../../lib/kuechenplaner/history";
import { runChecks } from "../../../lib/kuechenplaner/checks";
import { closeGaps } from "../../../lib/kuechenplaner/layout";
import { cleanOpts, opt, withOpt } from "../../../lib/kuechenplaner/options";
import { roomWalls, validateFree } from "../../../lib/kuechenplaner/room";
import { worktopRange } from "../../../lib/kuechenplaner/norms";
import { geraetVorwahl } from "../../../lib/kuechenplaner/geraete";
import { isKeyboardFocusTarget } from "../../../lib/kuechenplaner/focusGuard";
import GeraeteFields, { GeraetePlanContext } from "./GeraeteWahl";
// Sprachen (01.11.2026): Texte bleiben deutsch im Code, useKpT() übersetzt bei der Anzeige (KpCopy.js).
import { useKpT } from "./KpCopy";

/** Lade-Hinweis der nachgeladenen Reiter (in der Sprache der Seite). */
// QM r5: Platzhalter in der Form des Reiters (Überschrift, Zeilen, Knopf) statt leerer Spalte.
function Loading({ text }) {
  const tr = useKpT();
  const bar = "block bg-ink/[0.07] motion-safe:animate-pulse";
  return (
    <div role="status" className="space-y-3" data-kp-skeleton="">
      <span className="sr-only">{tr(text)}</span>
      <span aria-hidden="true" className={`${bar} h-6 w-2/3`} />
      <span aria-hidden="true" className={`${bar} h-4 w-full`} />
      <span aria-hidden="true" className={`${bar} h-4 w-5/6`} />
      <span aria-hidden="true" className={`${bar} h-24 w-full`} />
      <span aria-hidden="true" className={`${bar} h-12 w-1/2`} />
    </div>
  );
}

// QM r5: die nachgeladenen Reiter im Leerlauf vorladen – beim Klick ist der Code schon da
// (zählt nicht zum Erstlade-Budget, startet erst nach dem ersten Bild).
const LAZY_TABS = [() => import("./ResultPanel"), () => import("./CheckPanel"), () => import("./VariantCompare")];
function usePreloadTabs() {
  useEffect(() => {
    const run = () => LAZY_TABS.forEach((load) => load().catch(() => {}));
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(run, 2500);
    return () => clearTimeout(t);
  }, []);
}

// Ergebnis (Formular, Teilen, Speichern) und Prüfen laden erst mit ihrem Reiter (Erstlade-Budget).
const ResultPanel = dynamic(() => import("./ResultPanel"), { loading: () => <Loading text="Ergebnis wird geladen …" /> });
const CheckPanel = dynamic(() => import("./CheckPanel"), { loading: () => <Loading text="Prüfung wird geladen …" /> });
// Feinschliff (P3-9): Varianten A/B nebeneinander, lädt mit dem Reiter Ergebnis.
const VariantCompare = dynamic(() => import("./VariantCompare"), { loading: () => <Loading text="Variantenvergleich wird geladen …" /> });

const TABS = [
  ["raum", "Raum"],
  ["module", "Möbel"],
  ["material", "Material"],
  ["pruefen", "Prüfen"],
  ["ergebnis", "Ergebnis"],
];
const TAB_IDS = TABS.map(([id]) => id);
// Handy quer: Ansicht und Panel nebeneinander (Kuechenplaner.module.css, QM r3)
const SIDE_BY_SIDE_MQ = "(max-width: 1023px) and (max-height: 500px) and (min-width: 640px)";
// UX-Benchmark P1-1: geführter Ablauf – „Weiter“ am Ende jedes Schritts (wie Häcker/IKEA in benannten Schritten)
const NEXT_LABEL = { module: "Möbel anordnen", material: "Material wählen", pruefen: "Planung prüfen", ergebnis: "Ergebnis und Termin" };
// Zweifarbiger Fokusring: dunkle Kontur + weißer Abstand, auf Beige ≥ 3:1 (P3-5)
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink focus-visible:shadow-[0_0_0_2px_#fff]";
const chip = (on) =>
  `min-h-11 border px-3 py-2 text-left text-sm transition-colors duration-150 ${focusRing} ${on ? "border-ink bg-ink text-paper" : "border-ink/20 bg-paper text-ink hover:border-ink/60"}`;
const iconBtn = `inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center text-ink hover:bg-stone disabled:opacity-30 ${focusRing}`;
const selectCls = "h-11 min-w-0 border border-pebble bg-paper px-2 text-sm text-ink";
const numCls = "h-11 w-20 border border-pebble bg-paper px-2 text-right text-base text-ink";
const lightBtn = `inline-flex min-h-11 items-center gap-1.5 border border-ink/25 bg-paper px-3 text-sm text-ink ${focusRing}`;

function RangeField({ id, label, value, min, max, step, unit = "cm", onChange, hint, children }) {
  const tr = useKpT();
  const [draft, setDraft] = useState(String(value));
  const [prev, setPrev] = useState(value);
  const [msg, setMsg] = useState("");
  if (prev !== value) {
    setPrev(value);
    setDraft(String(value));
  }
  const fmt = (n) => tr.num(n);
  const range = tr("Erlaubt sind {n1} bis {n2} {unit}.", { n1: fmt(min), n2: fmt(max), unit });
  // P2-2: leer oder ungültig → letzter gültiger Wert und Meldung; begrenzt → Meldung am Feld
  const commit = (v) => {
    const raw = String(v).trim();
    const n = Math.round(Number(raw.replace(",", ".")) / step) * step;
    if (!raw || !Number.isFinite(n)) {
      setDraft(String(value));
      setMsg(`${tr("Keine gültige Zahl – der bisherige Wert {n} {unit} bleibt.", { n: fmt(value), unit })} ${range}`);
      return;
    }
    const c = Math.min(max, Math.max(min, Math.round(n * 100) / 100));
    setMsg(c !== Math.round(n * 100) / 100 ? `${tr(c < n ? "Höchstens {n} {unit} – auf {n} {unit} gesetzt." : "Mindestens {n} {unit} – auf {n} {unit} gesetzt.", { n: fmt(c), unit })} ${range}` : "");
    setDraft(String(c));
    onChange(c);
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-n`} className="text-sm text-ink">{label}</label>
        <span className="flex items-center gap-1">
          <input
            id={`${id}-n`}
            type="number"
            // Mobil-A11y fix-04: Die iOS-Zifferntastatur (inputmode numeric) hat kein Minus –
            // „Seitlich verschieben“ (−200 … 200 cm) wäre auf dem iPhone nicht negativ eintippbar.
            inputMode={min < 0 ? undefined : "numeric"}
            enterKeyHint="done"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commit(e.currentTarget.value)}
            aria-describedby={msg ? `${id}-msg` : undefined}
            className={`h-11 w-20 border bg-paper px-2 text-right text-base text-ink ${msg ? "border-notice" : "border-pebble"}`}
          />
          <span className="w-5 text-xs text-ink-soft">{unit}</span>
        </span>
      </div>
      <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => { setMsg(""); onChange(Number(e.target.value), true); }} className="h-11 w-full accent-ink" />
      {msg && (
        <p id={`${id}-msg`} className="border-l-2 border-notice pl-2 text-[0.8125rem] text-notice" role="status">
          {msg}
        </p>
      )}
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      {children}
    </div>
  );
}

/** Kleines Zahlenfeld (Öffnungen, Lücken, Passstücke). */
function NumField({ id, label, value, min = 0, max = 1200, step = 1, onChange, unit = "cm", className = "" }) {
  const [draft, setDraft] = useState(String(value));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(String(value));
  }
  const commit = (v) => {
    const n = Number(String(v).replace(",", "."));
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n / step) * step)));
    else setDraft(String(value));
  };
  return (
    <label htmlFor={id} className={`block text-[0.8125rem] text-ink-soft ${className}`}>
      {label}
      <span className="mt-0.5 flex items-center gap-1">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit(e.currentTarget.value)}
          className={numCls}
        />
        <span className="text-xs">{unit}</span>
      </span>
    </label>
  );
}

function Fieldset({ legend, children, className = "", note }) {
  return (
    <fieldset className={`min-w-0 space-y-2 ${className}`}>
      <legend className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-gold-text">{legend}</legend>
      {children}
      {note && <p className="text-xs text-ink-soft">{note}</p>}
    </fieldset>
  );
}

function Chips({ value, options, onChange, cols = 2, label }) {
  return (
    <div className={`grid gap-2 ${cols === 3 ? "grid-cols-3" : cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`} role="group" aria-label={label}>
      {options.map(([id, text, sub]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={chip(value === id)}>
          <span className="block font-medium">{text}</span>
          {sub && <span className={`block text-xs ${value === id ? "text-paper/85" : "text-ink-soft"}`}>{sub}</span>}
        </button>
      ))}
    </div>
  );
}

/** Typ-Auswahl eines Moduls; passt Breite und Optionen an den neuen Typ an. */
function changeType(m, t, raster) {
  const ws = moduleWidths(t, raster);
  const w = ws.includes(m.w) ? m.w : defaultWidth(t, raster);
  // Gewählte Geräte gehören zum Modultyp – bei Typwechsel fallen sie weg.
  const { d: _d, ...rest } = m;
  void _d;
  return cleanOpts(t === m.t ? { ...m, w } : { ...rest, t, w });
}

function TypeSelect({ value, onChange, upper = false, island = false, ...rest }) {
  const tr = useKpT();
  if (upper) {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${selectCls} flex-1`} {...rest}>
        {UPPER_ORDER.map((t) => <option key={t} value={t}>{tr(MODULES[t].name)}</option>)}
      </select>
    );
  }
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${selectCls} flex-1`} {...rest}>
      {MODULE_GROUPS.map((g) => (
        <optgroup key={g} label={tr(g)}>
          {Object.entries(MODULES)
            .filter(([, m]) => m.group === g && !(island && m.kind === "tall"))
            .map(([t, m]) => <option key={t} value={t}>{tr(m.name)}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

function WidthSelect({ m, raster, onChange, ...rest }) {
  const tr = useKpT();
  const ws = moduleWidths(m.t, raster);
  const list = ws.includes(m.w) ? ws : [...ws, m.w].sort((a, b) => a - b);
  return (
    <select value={m.w} onChange={(e) => onChange(Number(e.target.value))} className={`${selectCls} w-[6.25rem]`} {...rest}>
      {list.map((w) => <option key={w} value={w}>{tr.num(w)} cm</option>)}
    </select>
  );
}

/** Optionen eines Moduls (Front, Anschlag, Geräte, Eckauszug, Abzug …). */
function OptionFields({ m, onChange, idPrefix }) {
  const tr = useKpT();
  const def = MODULES[m.t];
  if (!def?.opts && !def?.appliance) return null;
  return (
    <>
      {def.opts && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(def.opts).map(([k, o]) => (
            <label key={k} className="text-[0.8125rem] text-ink-soft" htmlFor={`${idPrefix}-${k}`}>
              {tr(o.label)}
              <select id={`${idPrefix}-${k}`} className={`${selectCls} mt-0.5 w-full`} value={opt(m, k)} onChange={(e) => onChange(withOpt(m, k, e.target.value))}>
                {Object.entries(o.values).map(([v, l]) => <option key={v} value={v}>{tr(l)}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
      {def.appliance && <GeraeteFields m={m} onChange={onChange} idPrefix={idPrefix} />}
    </>
  );
}

/** Bottom-Sheet (mobil) zum Bearbeiten eines Moduls. Natives <dialog>: Fokusfalle, Escape, oberste Ebene. */
function ModuleSheet({ title, index, run, raster, onChange, onClose, upper, island }) {
  const tr = useKpT();
  const ref = useRef(null);
  const m = run[index];
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  if (!m) return null;
  const set = (next, idx) => onChange(next, idx);
  const put = (nm) => set(run.map((x, k) => (k === index ? nm : x)), index);
  const move = (d) => {
    const next = [...run];
    [next[index], next[index + d]] = [next[index + d], next[index]];
    set(next, index + d);
  };
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby="kp-sheet-title"
      className="mx-0 mb-0 mt-auto w-full max-w-none bg-paper p-0 text-ink shadow-[0_24px_48px_-12px_rgb(31_37_43/0.18)] backdrop:bg-ink/25"
    >
      <div className="space-y-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <h3 id="kp-sheet-title" className="text-base font-semibold">{tr("Modul {n}", { n: index + 1 })} · {title}</h3>
          <button type="button" className={`${iconBtn} bg-ink text-paper hover:bg-ink`} onClick={() => ref.current.close()} aria-label={tr("Fertig")}>
            <Check size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <label className="text-[0.8125rem] text-ink-soft">
            {tr("Art")}
            <TypeSelect upper={upper} island={island} value={m.t} onChange={(t) => put(changeType(m, t, raster))} />
          </label>
          <label className="text-[0.8125rem] text-ink-soft">
            {tr("Breite")}
            <WidthSelect m={m} raster={raster} onChange={(w) => put({ ...m, w })} />
          </label>
        </div>
        <OptionFields m={m} onChange={put} idPrefix="kp-sheet" />
        <NumField id="kp-sheet-gap" label={tr("Abstand zum Vorgänger")} value={m.g || 0} max={600} onChange={(g) => put(g ? { ...m, g } : (({ g: _g, ...r }) => (void _g, r))(m))} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 border border-ink/25 px-3 text-sm ${focusRing} disabled:opacity-30`} disabled={index === 0} onClick={() => move(-1)}>
            <ArrowLeft size={16} aria-hidden="true" /> {tr("Nach vorne")}
          </button>
          <button type="button" className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 border border-ink/25 px-3 text-sm ${focusRing} disabled:opacity-30`} disabled={index === run.length - 1} onClick={() => move(1)}>
            {tr("Nach hinten")} <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`inline-flex min-h-11 w-full items-center justify-center gap-1.5 border border-error/40 px-3 text-sm text-error ${focusRing}`}
            onClick={() => {
              set(run.filter((_, k) => k !== index), null);
              ref.current.close();
            }}
          >
            <Trash2 size={16} aria-hidden="true" /> {tr("Modul entfernen")}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** Liste einer Zeile (unten, oben oder Insel) mit Kacheln (mobil) und Zeilen (Desktop). */
function RunList({ id, title, run, raster, len, onRun, upper = false, island = false, selectedIdx = null, onSelect }) {
  const tr = useKpT();
  const [addType, setAddType] = useState(upper ? "haengeschrank" : "unterschrank");
  const [editing, setEditing] = useState(null);
  const tiles = useRef([]);
  const used = runUsed(run);
  const over = used > len + 0.01;
  const pct = Math.min(100, (used / Math.max(1, len)) * 100);
  const move = (i, d) => {
    const n = [...run];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    onRun(n);
  };
  const put = (i, nm) => onRun(run.map((x, k) => (k === i ? nm : x)));
  const closeSheet = () => {
    const i = editing;
    setEditing(null);
    requestAnimationFrame(() => tiles.current[Math.min(i ?? 0, run.length - 1)]?.focus());
  };
  return (
    <div>
      <p className={`text-[0.8125rem] ${over ? "font-semibold text-error" : "text-ink-soft"}`}>
        {tr.num(Math.round(used * 10) / 10)} / {tr.num(Math.round(len * 10) / 10)} cm{over ? ` – ${tr("zu lang")}` : len - used > 0.5 ? ` · ${tr("frei {n} cm", { n: Math.round((len - used) * 10) / 10 })}` : ""}
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden bg-stone" aria-hidden="true">
        <div className={`h-full ${over ? "bg-error" : "bg-brass-500"}`} style={{ width: `${pct}%` }} />
      </div>
      {/* Mobil: wischbare Kachelleiste wie im Grundriss, Tipp öffnet das Bottom-Sheet */}
      <ol className="-mx-1 mt-3 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden" aria-label={tr("Module {title}", { title })}>
        {run.map((m, i) => (
          <li key={`${i}-${m.t}`} className="snap-start">
            <button
              ref={(el) => (tiles.current[i] = el)}
              type="button"
              aria-haspopup="dialog"
              aria-label={tr("Modul {n}: {name}, {nW} cm – bearbeiten", { n: i + 1, name: tr(MODULES[m.t].name), nW: m.w })}
              onClick={() => setEditing(i)}
              style={{ width: `${Math.max(48, Math.round(m.w * 1.15))}px`, marginLeft: m.g ? Math.min(40, m.g) : undefined }}
              className={`flex h-14 flex-col items-center justify-center border text-ink ${focusRing} ${MODULES[m.t].kind === "tall" ? "border-ink/40 bg-stone-deep/60" : "border-ink/25 bg-bone"}`}
            >
              <span className="text-[0.8125rem] font-semibold leading-none">{MODULES[m.t].short}</span>
              <span className="mt-1 text-xs leading-none text-ink-soft">{fmtCm(m.w)}</span>
            </button>
          </li>
        ))}
      </ol>
      {editing !== null && (
        <ModuleSheet
          title={title}
          index={editing}
          run={run}
          raster={raster}
          upper={upper}
          island={island}
          onChange={(next, idx) => {
            onRun(next);
            if (idx !== null && idx !== undefined) setEditing(idx);
          }}
          onClose={closeSheet}
        />
      )}
      {/* Desktop: eine Zeile je Modul mit Kurzlabels, Optionen darunter */}
      <ol className="mt-3 hidden space-y-1.5 lg:block">
        {run.map((m, i) => (
          <li key={`${i}-${m.t}`} className={`bg-bone p-1 ${selectedIdx === i ? "ring-2 ring-brass-500" : ""}`} onFocusCapture={() => onSelect?.(i)}>
            <div className="flex items-center gap-1">
              <span className="w-5 text-center text-xs text-ink-soft" aria-hidden="true">{i + 1}</span>
              <TypeSelect upper={upper} island={island} aria-label={tr("Modul {n}: Art", { n: i + 1 })} value={m.t} onChange={(t) => put(i, changeType(m, t, raster))} />
              <WidthSelect aria-label={tr("Modul {n}: Breite", { n: i + 1 })} m={m} raster={raster} onChange={(w) => put(i, { ...m, w })} />
              <button type="button" className={`${iconBtn} w-9`} disabled={i === 0} onClick={() => move(i, -1)} aria-label={tr("Modul {n} nach vorne", { n: i + 1 })}>
                <ArrowUp size={16} aria-hidden="true" />
              </button>
              <button type="button" className={`${iconBtn} w-9`} disabled={i === run.length - 1} onClick={() => move(i, 1)} aria-label={tr("Modul {n} nach hinten", { n: i + 1 })}>
                <ArrowDown size={16} aria-hidden="true" />
              </button>
              <button type="button" className={`${iconBtn} w-9`} onClick={() => onRun(run.filter((_, k) => k !== i))} aria-label={tr("Modul {n} entfernen", { n: i + 1 })}>
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
            {(MODULES[m.t].opts || MODULES[m.t].appliance || m.g) && (
              <details className="ml-6 mt-1 text-[0.8125rem] text-ink-soft" open={selectedIdx === i || undefined}>
                <summary className="min-h-8 cursor-pointer py-1">{tr(MODULES[m.t].appliance ? "Optionen & Gerät" : "Optionen")}{m.g ? ` · ${tr("Abstand {n} cm", { n: m.g })}` : ""}</summary>
                <div className="space-y-2 pb-1">
                  <OptionFields m={m} onChange={(nm) => put(i, nm)} idPrefix={`kp-${id}-${i}`} />
                  <NumField id={`kp-${id}-${i}-g`} label={tr("Abstand zum Vorgänger")} value={m.g || 0} max={600} onChange={(g) => put(i, g ? { ...m, g } : (({ g: _g, ...r }) => (void _g, r))(m))} />
                </div>
              </details>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`kp-add-${id}`}>{tr("Neues Modul")}</label>
        <TypeSelect upper={upper} island={island} id={`kp-add-${id}`} value={addType} onChange={setAddType} />
        <button type="button" className={`inline-flex min-h-11 items-center gap-1.5 bg-ink px-4 text-sm text-paper ${focusRing}`} onClick={() => onRun([...run, { t: addType, w: defaultWidth(addType, raster) }])}>
          <Plus size={16} aria-hidden="true" /> {tr("Hinzufügen")}
        </button>
      </div>
    </div>
  );
}

function RunEditor({ wall, plan, kitchen, onRun, onAuto, onUp, selectedId, onSelect }) {
  const run = plan.runs[wall] || [];
  const len = runLength(plan, wall);
  const used = runUsed(run);
  const tr = useKpT();
  const upMode = plan.up?.[wall]?.m || (plan.wallCabinets ? "auto" : "aus");
  const name = tr(wallLabel(plan, wall));
  const shortName = tr(wallLabel(plan, wall).replace(/ \(.*\)/, ""));
  const sel = selectedId?.startsWith(`${wall}-`) ? Number(selectedId.split("-")[1]) : null;
  return (
    <section className="border border-ink/15 bg-paper p-3" aria-labelledby={`kp-run-${wall}`}>
      <h3 id={`kp-run-${wall}`} className="text-sm font-semibold text-ink">{name}</h3>
      <RunList id={wall} title={name} run={run} raster={plan.raster} len={len} onRun={(r) => onRun(wall, r)} selectedIdx={sel} onSelect={(i) => onSelect?.(`${wall}-${i}`)} />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => onAuto(wall)} className={lightBtn}>
          <Wand2 size={16} aria-hidden="true" /> {tr("Vorschlag")}
        </button>
        {used <= len + 0.01 && len - used >= plan.raster / 2 && (
          <button type="button" onClick={() => onRun(wall, [...run, ...fillWithBase(len - used, plan.raster)])} className={lightBtn}>
            {tr("Rest mit Unterschränken füllen")}
          </button>
        )}
        {run.some((m) => m.g) && (
          <button type="button" onClick={() => onRun(wall, closeGaps(plan, wall).runs[wall])} className={lightBtn}>
            {tr("Lücken schließen")}
          </button>
        )}
      </div>
      <div className="mt-4 border-t border-ink/10 pt-3">
        <p className="text-[0.8125rem] font-medium text-ink">{tr("Hängeschränke {wall}", { wall: shortName })}</p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5" role="group" aria-label={tr("Hängeschränke {wall}", { wall: name })}>
          {[["auto", "Automatisch"], ["frei", "Eigene"], ["aus", "Keine"]].map(([m, l]) => (
            <button key={m} type="button" aria-pressed={upMode === m} className={chip(upMode === m)} onClick={() => onUp(wall, m)}>{tr(l)}</button>
          ))}
        </div>
        {upMode === "frei" && (
          <div className="mt-2">
            <RunList id={`${wall}u`} title={tr("Hängeschränke {wall}", { wall: name })} run={plan.up[wall].r} raster={plan.raster} len={len} upper onRun={(r) => onUp(wall, "frei", r)} />
          </div>
        )}
        {upMode === "auto" && kitchen.mods.some((m) => m.wall === wall && m.kind === "upper") && (
          <p className="mt-1.5 text-xs text-ink-soft">{tr("Über allen Unterschränken, über dem Kochfeld mit Flachschirmhaube; vor Fenstern ausgespart.")}</p>
        )}
      </div>
    </section>
  );
}

function PriceLine({ price, onRequest, className = "" }) {
  const tr = useKpT();
  return (
    <div className={`items-center justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        {price.visible ? (
          <>
            {/* Motion: neuer Betrag wird per key eingesetzt (0,6 → 1, styles.tick) */}
            <span key={`${price.min}-${price.max}`} data-kp-line="" className={`${styles.tick} block text-base font-semibold leading-tight text-ink tabular-nums`}>
              {formatEUR(price.min)} – {formatEUR(price.max)}
            </span>
            <span data-kp-line="" className="block text-[0.8125rem] leading-tight text-gold-text">{tr(price.label)}</span>
          </>
        ) : (
          <>
            {/* QM R2 P2-1: ohne freigegebene Preistabelle keine Zahlen */}
            {/* QM planer-tools: umbrechen statt abschneiden (200 % Textgröße: „Richt…“) */}
            {/* QM r2: bei 200 % Text (Leiste < 20em) Silbentrennung statt Abschneiden, Zusatzzeile nur für Vorlesesoftware */}
            {/* QM r3: bei 200 % Text (Leiste < 20em) trennte die schmale Spalte mitten im Wort („Richtpre/is“) –
                dort steht nur noch der volle Knopf, die Preiszeile bleibt für Vorlesesoftware erhalten. */}
            {/* QM r4 (WCAG 1.4.12): Zeilen einer Bedienleiste, keine Absätze – der Absatzabstand (2em) machte die feste Leiste ≈ 15 % hoch */}
            <span lang={tr.locale} data-kp-line="" className="block text-base font-semibold leading-tight text-ink @max-[20em]:sr-only">{tr(price.label)}</span>
            <span data-kp-line="" className="block text-[0.8125rem] leading-tight text-ink-soft @max-[20em]:sr-only">{tr("Persönlich nach Beratung und Aufmaß")}</span>
          </>
        )}
      </div>
      <button type="button" onClick={onRequest} className={`ph-press min-h-[44px] shrink-0 bg-ink px-5 py-1.5 text-sm ${price.visible ? "@max-[20em]:px-3" : "@max-[20em]:flex-1"} font-medium text-paper transition-colors duration-(--duration-micro) hover:bg-ink-deep ${focusRing}`}>
        {tr("Anfragen")}
      </button>
    </div>
  );
}

// UX-Benchmark P1-3: Schnellauswahl „Stimmung“ (Stilwelten-Prinzip wie bei SieMatic, Startentwürfe wie im
// neuen IKEA-Planer). Nur Werte aus catalog.js, rein gestalterische Namen – keine Hersteller- oder Preisangabe.
const MOODS = [
  { id: "hell", label: "Hell und ruhig", sub: "Kreideweiß matt, Quarzkomposit", set: { finish: "matt", color: "kreide", top: "quarz", topT: 20, grip: "grifflos" } },
  { id: "holz", label: "Warmes Holz", sub: "Eiche natur, Keramik", set: { finish: "holz", color: "eiche", top: "keramik", topT: 12, grip: "push" } },
  { id: "salbei", label: "Natur und Stein", sub: "Salbei matt, Granit", set: { finish: "matt", color: "salbei", top: "granit", topT: 30, grip: "grifflos" } },
  { id: "dunkel", label: "Dunkel und markant", sub: "Graphit matt, Marmor, Messing", set: { finish: "matt", color: "graphit", top: "marmor", topT: 20, grip: "leiste", gripColor: "messing" } },
];
const moodActive = (plan, m) => Object.entries(m.set).every(([k, v]) => plan[k] === v);

const FREE_PRESETS = {
  rechteck: { label: "Rechteck", poly: DEFAULT_POLY },
  lraum: { label: "L-Raum", poly: [{ l: 500, a: 90 }, { l: 250, a: 90 }, { l: 200, a: 270 }, { l: 200, a: 90 }, { l: 300, a: 90 }] },
  schraeg: { label: "Schräge Ecke", poly: [{ l: 400, a: 135 }, { l: 141, a: 135 }, { l: 250, a: 90 }, { l: 500, a: 90 }] },
};

function FreeRoomEditor({ plan, setPlan }) {
  const tr = useKpT();
  const poly = plan.room.poly;
  const v = validateFree(poly);
  const ids = roomWalls(plan).map((w) => w.id);
  const set = (next, group) => setPlan((p) => ({ ...p, room: { ...p.room, poly: next } }), group);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label={tr("Vorlage für den Raum")}>
        {Object.entries(FREE_PRESETS).map(([k, p]) => (
          <button key={k} type="button" className={lightBtn} onClick={() => setPlan((pl) => withAutoRuns({ ...pl, room: { ...pl.room, poly: p.poly.map((w) => ({ ...w })), op: [] }, runs: { ...pl.runs } }), null)}>
            {tr(p.label)}
          </button>
        ))}
      </div>
      <ol className="space-y-2">
        {poly.map((w, i) => (
          <li key={i} className="flex flex-wrap items-end gap-2 bg-bone p-2">
            <span className="mb-3 w-14 text-sm font-semibold text-ink">{tr("Wand {w}", { w: ids[i]?.toUpperCase() })}</span>
            <NumField id={`kp-fw-${i}-l`} label={tr("Länge")} value={w.l} min={LIMITS.freeWall.min} max={LIMITS.freeWall.max} step={1} onChange={(l) => set(poly.map((x, k) => (k === i ? { ...x, l } : x)), `fw${i}l`)} />
            <NumField id={`kp-fw-${i}-a`} label={tr("Innenwinkel zur nächsten")} value={w.a} min={LIMITS.angle.min} max={LIMITS.angle.max} step={1} unit="°" onChange={(a) => set(poly.map((x, k) => (k === i ? { ...x, a } : x)), `fw${i}a`)} />
            <button type="button" className={`${iconBtn} ml-auto`} disabled={poly.length <= 2} onClick={() => set(poly.filter((_, k) => k !== i))} aria-label={tr("Wand {w} entfernen", { w: ids[i]?.toUpperCase() })}>
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <p className="text-sm text-ink">
        {tr("Wand {w} schließt den Raum:", { w: ids[ids.length - 1]?.toUpperCase() })} <strong className="tabular-nums">{tr.num(v.closing)} cm</strong>
      </p>
      {!v.ok && (
        <div role="alert">
          <ul className="space-y-1 bg-[#fbeee9] p-2 text-sm text-error">
            {v.errors.map((e) => <li key={e}>{tr(e)}</li>)}
          </ul>
        </div>
      )}
      <button type="button" className={lightBtn} disabled={poly.length >= 7} onClick={() => set([...poly, { l: 100, a: 90 }])}>
        <Plus size={16} aria-hidden="true" /> {tr("Wand einfügen")}
      </button>
      <p className="text-xs text-ink-soft">{tr("Innenwinkel 90° = rechte Ecke, 135° = schräge Wand, 270° = Vorsprung (Pfeiler, Nische). Gemessen wird im Raum, im Uhrzeigersinn.")}</p>
    </div>
  );
}

function OpeningsEditor({ plan, setPlan }) {
  const tr = useKpT();
  const ops = plan.room.op;
  const walls = roomWalls(plan).filter((w) => w.rendered);
  const [addK, setAddK] = useState("fenster");
  const set = (next, group) => setPlan((p) => ({ ...p, room: { ...p.room, op: next } }), group);
  const put = (i, patch, group) => set(ops.map((o, k) => (k === i ? { ...o, ...patch } : o)), group);
  return (
    <div className="space-y-2">
      {ops.length === 0 && <p className="text-sm text-ink-soft">{tr("Noch keine Fenster, Türen oder Anschlüsse eingetragen. Sie zeigen sich im Plan, in 3D und in der Prüfung.")}</p>}
      <ol className="space-y-2">
        {ops.map((o, i) => (
          <li key={i} className="space-y-2 bg-bone p-2">
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor={`kp-op-${i}-k`}>{tr("Art")}</label>
              <select id={`kp-op-${i}-k`} className={`${selectCls} flex-1`} value={o.k} onChange={(e) => put(i, { k: e.target.value, b: OPENINGS[e.target.value].b, y: OPENINGS[e.target.value].y, h: OPENINGS[e.target.value].h })}>
                {Object.entries(OPENINGS).map(([k, d]) => <option key={k} value={k}>{tr(d.label)}</option>)}
              </select>
              <label className="sr-only" htmlFor={`kp-op-${i}-w`}>{tr("Wand")}</label>
              <select id={`kp-op-${i}-w`} className={`${selectCls} w-28`} value={o.w} onChange={(e) => put(i, { w: e.target.value })}>
                {walls.map((w) => <option key={w.id} value={w.id}>{tr("Wand {w}", { w: w.id.toUpperCase() })}</option>)}
              </select>
              <button type="button" className={iconBtn} onClick={() => set(ops.filter((_, k) => k !== i))} aria-label={tr("{name} entfernen", { name: tr(OPENINGS[o.k].label) })}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <NumField id={`kp-op-${i}-x`} label={tr("ab Wandanfang")} value={o.x} onChange={(x) => put(i, { x }, `op${i}x`)} />
              <NumField id={`kp-op-${i}-b`} label={tr("Breite")} value={o.b} min={1} max={400} onChange={(b) => put(i, { b }, `op${i}b`)} />
              <NumField id={`kp-op-${i}-y`} label={tr(o.k === "fenster" ? "Brüstung" : "Höhe ü. Boden")} value={o.y} max={320} onChange={(y) => put(i, { y }, `op${i}y`)} />
              {(o.k === "fenster" || o.k === "tuer" || o.k === "heizung") && <NumField id={`kp-op-${i}-h`} label={tr("Höhe")} value={o.h} min={1} max={320} onChange={(h) => put(i, { h }, `op${i}h`)} />}
              {o.k === "tuer" && (
                <label className="block text-[0.8125rem] text-ink-soft" htmlFor={`kp-op-${i}-s`}>
                  {tr("Anschlag")}
                  <select id={`kp-op-${i}-s`} className={`${selectCls} mt-0.5 block`} value={o.s || "r"} onChange={(e) => put(i, { s: e.target.value })}>
                    <option value="r">{tr("Band rechts")}</option>
                    <option value="l">{tr("Band links")}</option>
                  </select>
                </label>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="kp-op-add">{tr("Öffnung oder Anschluss")}</label>
        <select id="kp-op-add" className={`${selectCls} flex-1`} value={addK} onChange={(e) => setAddK(e.target.value)}>
          {Object.entries(OPENINGS).map(([k, d]) => <option key={k} value={k}>{tr(d.label)}</option>)}
        </select>
        <button
          type="button"
          className={`inline-flex min-h-11 items-center gap-1.5 bg-ink px-4 text-sm text-paper ${focusRing}`}
          disabled={ops.length >= 24 || !walls.length}
          onClick={() => {
            const d = OPENINGS[addK];
            const w = walls[0];
            set([...ops, { k: addK, w: w.id, x: Math.max(0, Math.round(w.len * 50 - d.b / 2)), b: d.b, y: d.y, h: d.h, ...(addK === "tuer" ? { s: "r" } : {}) }]);
          }}
        >
          <Plus size={16} aria-hidden="true" /> {tr("Eintragen")}
        </button>
      </div>
    </div>
  );
}

// initialGeraet (Server, aus ?geraet=): { typ: "produkt", g } setzt das Gerät in die erste passende Nische,
// { typ: "marke", m, mn } stellt die Marke in den Gerätelisten nach vorne.
export default function KuechenplanerApp({ initialPlan, initialTab, catalog, linkInvalid = false, initialMobile = false, calendar = false, initialGeraet = null }) {
  const tr = useKpT();
  usePreloadTabs();
  const [vorwahl] = useState(() => (initialGeraet?.typ === "produkt" ? geraetVorwahl(initialPlan || defaultPlan("l"), initialGeraet.g) : null));
  const [hist, dispatch] = useReducer(historyReducer, null, () => initHistory(vorwahl?.plan || initialPlan || defaultPlan("l")));
  const plan = hist.present;
  const setPlan = useCallback((update, group = null) => dispatch({ type: "set", update, group }), []);
  const [edited, setEdited] = useState(() => new Set(initialPlan ? ["a", "b", "c", "d", "e", "f", "g", "h"] : []));
  const [tab, setTab] = useState(() => (TAB_IDS.includes(initialTab) ? initialTab : "raum"));
  const [shareUrl, setShareUrl] = useState("");
  const [status, setStatus] = useState({ webgl: null, ready: false });
  // UX-Benchmark P1-4: Zähler – „In 3D ansehen“ im Reiter Material öffnet die 3D-Ansicht im Viewer
  const [show3D, setShow3D] = useState(0);
  // Fix 3 (P2-1): Mobil im Reiter „Ergebnis“ ist die Ansicht minimiert, damit Vergleich und
  // Formular Platz haben; beim Verlassen kommt der vorige Zustand zurück (autoMin = vorher).
  const startMin = Boolean(initialMobile && initialTab === "ergebnis");
  const [minimized, setMinimized] = useState(startMin);
  const autoMin = useRef(startMin ? false : null);
  // QM r4: Server-Vorgabe „mobil + Ergebnis“ gilt nicht für Handy quer (zwei Spalten)
  useEffect(() => {
    if (!startMin) return undefined;
    const id = requestAnimationFrame(() => {
      if (window.matchMedia(SIDE_BY_SIDE_MQ).matches) setMinimized(false);
    });
    return () => cancelAnimationFrame(id);
  }, [startMin]);
  const [selected, setSelected] = useState(null);
  // UX-Benchmark P0-1: „Anfragen“ führt direkt zum Abschnitt „Planung anfragen“ (Zähler je Klick)
  const [reqTick, setReqTick] = useState(0);
  const reqDone = useRef(0);
  const apiRef = useRef(null);
  const tabRefs = useRef({});
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const stickyRef = useRef(null);
  const barRef = useRef(null);

  // QM planer-tools (01.11.2026, WCAG 2.4.11): Fokus per Tastatur auf ein Ziel
  // unter der festen Preisleiste (mobil/Tablet) – z. B. die Reiter beim ersten
  // Bildschirm – holt es über die Leiste. scroll-padding allein reicht nicht:
  // WebKit scrollt beim Fokus nicht, solange das Ziel geometrisch im Bild ist.
  useEffect(() => {
    const onFocus = (e) => {
      const bar = barRef.current;
      const t = e.target;
      if (!bar || !(t instanceof Element) || bar.contains(t)) return;
      // QM r2: Safari fokussiert beim Antippen keinen Knopf, der Fokus fällt auf
      // <main tabIndex=-1> → nur Tastaturfokus, nie main/body/Container (tabIndex -1).
      // QM r3: auch Fokus per Skript/Hilfstechnik (kein :focus-visible in WebKit), nur nicht direkt nach Antippen/Klick
      const fromPointer = Date.now() - lastPointer < 600;
      if (fromPointer || (!isKeyboardFocusTarget(t) && (t.getAttribute("tabindex") === "-1" || /^(BODY|HTML|MAIN)$/.test(t.tagName)))) return;
      const barTop = bar.getBoundingClientRect().top;
      if (!barTop || getComputedStyle(bar).display === "none" || getComputedStyle(bar).visibility === "hidden") return;
      const r = t.getBoundingClientRect();
      if (r.height > barTop * 0.6) return;
      if (r.bottom > barTop - 4 && r.top < window.innerHeight) window.scrollBy({ top: r.bottom - barTop + 16, behavior: "instant" });
    };
    let lastPointer = 0;
    const onPointer = () => {
      lastPointer = Date.now();
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("focusin", onFocus);
    // Höhe der Leiste (wächst mit Textgröße/-abständen) → Platz unter der Seite (module.css)
    const bar = barRef.current;
    const html = document.documentElement;
    const ro = bar && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => html.style.setProperty("--kp-bar-h", `${Math.ceil(bar.getBoundingClientRect().height)}px`)) : null;
    if (ro) ro.observe(bar);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("pointerdown", onPointer, true);
      ro?.disconnect();
      html.style.removeProperty("--kp-bar-h");
    };
  }, []);

  const kitchen = useMemo(() => buildKitchen(plan), [plan]);
  const checks = useMemo(() => runChecks(plan, kitchen), [plan, kitchen]);
  const price = useMemo(() => priceRange(plan, catalog.priceTable, kitchen), [plan, catalog.priceTable, kitchen]);
  const problems = checks.items.filter((i) => i.level === "error" || i.level === "warn");
  const [linkNote, setLinkNote] = useState(linkInvalid);
  const [geraetNote, setGeraetNote] = useState(() => (vorwahl?.text ? tr(vorwahl.text) : initialGeraet?.typ === "marke" ? tr("Geräte von {v}: Wählen Sie im Reiter „Möbel“ beim Gerätemodul unter „Optionen & Gerät“ ein Modell.", { v: initialGeraet.mn }) : ""));
  const geraeteCtx = useMemo(() => ({ plan, marke: initialGeraet?.typ === "marke" ? initialGeraet.m : null }), [plan, initialGeraet]);

  // Mobil-A11y fix-03 (WCAG 4.1.3 Status Messages): Ergebnis der Prüfung ansagen, wenn sich
  // die Zahl der Kollisionen/Hinweise ändert – gebündelt (700 ms, Schieberegler) und nur bei
  // einer Änderung. Der Kasten unter dem Panel ist kein Live-Bereich mehr: Er wurde bei jedem
  // Reglerschritt komplett vorgelesen, sein erstes Erscheinen dagegen gar nicht.
  const countKey = `${checks.counts.error}|${checks.counts.warn}`;
  const lastCounts = useRef(countKey);
  const [checkNote, setCheckNote] = useState("");
  useEffect(() => {
    if (lastCounts.current === countKey) return undefined;
    const t = setTimeout(() => {
      lastCounts.current = countKey;
      const [e, w] = countKey.split("|").map(Number);
      setCheckNote(
        !e && !w
          ? tr("Prüfung: keine Kollisionen und keine Hinweise.")
          : tr("Prüfung: {errors}, {warns}. Details im Reiter Prüfen.", { errors: e ? tr(e > 1 ? "{n} Kollisionen" : "{n} Kollision", { n: e }) : tr("keine Kollision"), warns: tr(w === 1 ? "{n} Hinweis" : "{n} Hinweise", { n: w }) }),
      );
    }, 700);
    return () => clearTimeout(t);
  }, [countKey, tr]);

  // Teilen-Link (k) und Reiter (t) in der Adresszeile aktuell halten (ohne neuen Verlaufseintrag).
  useEffect(() => {
    const t = setTimeout(() => {
      const code = encodePlan(plan);
      setShareUrl(`${window.location.origin}${window.location.pathname}?k=${code}`);
      const keep = new URLSearchParams(window.location.search);
      keep.set("k", code);
      if (tab === "raum") keep.delete("t");
      else keep.set("t", tab);
      // QM r4: den bestehenden Verlaufszustand (mit Nexts __NA-Marke) weitergeben. Mit `null`
      // griff Nexts gepatchtes replaceState ein, startete eine Restore-Navigation und holte für
      // jede Planänderung das RSC-Payload von /kuechenplaner?k=… – schlug das fehl, lud der Router
      // die ganze Seite neu (Reiter zurück auf „Raum“, Sprung nach oben).
      window.history.replaceState(window.history.state, "", `${window.location.pathname}?${keep.toString()}`);
    }, 350);
    return () => clearTimeout(t);
  }, [plan, tab]);

  // Rückgängig/Wiederholen per Tastatur (nicht in Eingabefeldern)
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "undo" });
      } else if (k === "y" || (k === "z" && e.shiftKey)) {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // --kp-top = sichtbare Höhe des Seiten-Headers (sticky; mobil blendet er sich beim
  // Runterscrollen aus). Gemessen statt fest verdrahtet.
  useEffect(() => {
    const page = rootRef.current?.closest("[data-kp-page]");
    const header = document.querySelector("header");
    if (!page || !header) return;
    const apply = () => {
      const hidden = header.getAttribute("data-hidden") === "true" && window.matchMedia("(max-width: 767px)").matches;
      const v = `${hidden ? 0 : Math.round(header.getBoundingClientRect().height)}px`;
      page.style.setProperty("--kp-top", v);
      document.documentElement.style.setProperty("--kp-top-px", v); // für scroll-padding (P2-1)
    };
    const ro = new ResizeObserver(apply);
    ro.observe(header);
    const mo = new MutationObserver(apply);
    mo.observe(header, { attributes: true, attributeFilter: ["data-hidden"] });
    apply();
    return () => {
      ro.disconnect();
      mo.disconnect();
      document.documentElement.style.removeProperty("--kp-top-px");
    };
  }, []);

  // Höhe des angehefteten Bereichs (nur mobil) als CSS-Variable → scroll-margin der Felder.
  useEffect(() => {
    const el = stickyRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    // fix-01: Handy quer – die Ansicht ist dort nicht angeheftet (Kuechenplaner.module.css)
    const short = window.matchMedia("(max-height: 500px)");
    const html = document.documentElement;
    const prevPad = html.style.scrollPaddingTop;
    const apply = () => {
      // QM planer-tools (01.11.2026): bei großer Textgröße (200 %) wird die angeheftete
      // Ansicht höher als ~62 % des Bildschirms und verdeckte jedes Feld darunter
      // (WCAG 2.4.11) – dann scrollt sie wie im Querformat mit (Kuechenplaner.module.css).
      // QM r3: gemessen am Platz zwischen Header und Preisleiste (nicht am ganzen Bildschirm) – über 60 %
      // davon bliebe für das Panel zu wenig (200 % Text: nur 17 %).
      const headH = document.querySelector("header")?.getBoundingClientRect().height || 64;
      const barH = barRef.current?.getBoundingClientRect().height || 76;
      const room = window.innerHeight - headH - barH;
      const tall = !mq.matches && !short.matches && el.getBoundingClientRect().height > room * 0.6;
      root.toggleAttribute("data-kp-tall", tall);
      // QM r3: Handy quer – Ansicht links, Panel rechts (zwei Spalten): sie verdeckt das Panel nicht
      const side = getComputedStyle(root).gridTemplateColumns.trim().split(" ").length > 1;
      const stuck = !side && getComputedStyle(el).position === "sticky";
      const h = stuck ? Math.round(el.getBoundingClientRect().height) : 0;
      root.style.setProperty("--kp-stick", mq.matches ? "0px" : `${h}px`);
      // Fix 3 (P2-1, WCAG 2.4.11): Fokus per Tab landet mobil nie unter Header + angehefteter
      // Ansicht – scroll-padding der Seite folgt deren Höhe (global sind nur 5,5rem für den Header).
      if (mq.matches) html.style.scrollPaddingTop = prevPad;
      else html.style.scrollPaddingTop = `calc(var(--kp-top-px, 64px) + ${h + 8}px)`;
    };
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    mq.addEventListener("change", apply);
    short.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    apply();
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", apply);
      short.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
      root.removeAttribute("data-kp-tall");
      html.style.scrollPaddingTop = prevPad;
    };
  }, []);

  const update = (patch, group = null) => setPlan((p) => ({ ...p, ...patch }), group);
  const updIsland = (patch, group = null) => setPlan((p) => ({ ...p, island: { ...p.island, ...patch } }), group);
  const updErgo = (patch, group = null) => setPlan((p) => ({ ...p, ergo: { ...p.ergo, ...patch } }), group);

  const setWall = (wall, value) =>
    setPlan((p) => {
      const next = { ...p, walls: { ...p.walls, [wall]: value } };
      const auto = activeWalls(next).filter((w) => !edited.has(w));
      return withAutoRuns(next, auto);
    }, `wall-${wall}`);

  const setShape = (shape) => {
    setEdited(new Set());
    setSelected(null);
    setPlan((p) => {
      const d = defaultPlan(shape);
      // Material, Ergonomie und Raumhöhe bleiben; Form, Zeilen und Insel kommen aus der Vorlage
      return withAutoRuns({ ...p, shape, walls: d.walls, island: d.island, pend: d.pend, up: {}, runs: d.runs, room: { ...p.room, op: p.room.op.filter((o) => roomWalls({ ...d, room: p.room }).some((w) => w.rendered && w.id === o.w)), slope: { ...p.room.slope, w: roomWalls({ ...d, room: p.room }).some((w) => w.rendered && w.id === p.room.slope.w) ? p.room.slope.w : "" } } });
    });
  };

  const onRun = useCallback((wall, run) => {
    setEdited((s) => new Set(s).add(wall));
    setPlan((p) => ({ ...p, runs: { ...p.runs, [wall]: run } }));
  }, [setPlan]);

  const onAuto = useCallback((wall) => {
    setEdited((s) => {
      const n = new Set(s);
      n.delete(wall);
      return n;
    });
    setPlan((p) => ({ ...p, runs: { ...p.runs, [wall]: autoRun(p.shape, wall, runLength(p, wall), p.raster) } }));
  }, [setPlan]);

  const onUp = useCallback((wall, mode, run) => {
    setPlan((p) => {
      const up = { ...(p.up || {}) };
      const def = p.wallCabinets ? "auto" : "aus";
      if (mode === def && !run) delete up[wall];
      else if (mode === "frei") {
        // Eigene Ebene: mit den automatischen Hängeschränken als Startpunkt
        const start = run || up[wall]?.r || (p.runs[wall] || []).filter((m) => MODULES[m.t].kind === "base" && m.t !== "passstueck").map((m) => ({ t: m.t === "kochfeld" ? "luefterhs" : "haengeschrank", w: moduleWidths(m.t === "kochfeld" ? "luefterhs" : "haengeschrank", p.raster).includes(m.w) ? m.w : defaultWidth("haengeschrank", p.raster), ...(m.g ? { g: m.g } : {}) }));
        up[wall] = { m: "frei", r: start };
      } else up[wall] = { m: mode, r: [] };
      return { ...p, up };
    });
  }, [setPlan]);

  const onCommit = useCallback((next, group) => {
    setPlan(next, group);
    setEdited(new Set(["a", "b", "c", "d", "e", "f", "g", "h"]));
  }, [setPlan]);

  // code-tests Fix 04: Geladene Planung (Browser-Speicher, Variante A/B) gilt als selbst geplant –
  // sonst füllt die nächste Wandmaß-Änderung ihre Zeilen mit der Vorlage neu (Module weg).
  const onLoadPlan = useCallback((p) => {
    setSelected(null);
    setPlan(p);
    setEdited(new Set(["a", "b", "c", "d", "e", "f", "g", "h"]));
  }, [setPlan]);

  const goTab = (id, variant) => {
    setTab(id);
    const desktop = window.matchMedia("(min-width: 1024px)").matches;
    // QM r4: Handy quer (zwei Spalten) nicht einklappen – die Ansicht füllt dort ohnehin die linke Spalte
    const sideBySide = window.matchMedia(SIDE_BY_SIDE_MQ).matches;
    if (!desktop && !sideBySide && id === "ergebnis" && tab !== "ergebnis") {
      autoMin.current = minimized;
      setMinimized(true);
    } else if (id !== "ergebnis" && autoMin.current !== null) {
      setMinimized(autoMin.current);
      autoMin.current = null;
    }
    const v = variant || (desktop ? "d" : "m");
    tabRefs.current[`${v}-${id}`]?.focus({ preventScroll: true });
    // QM r3: seitlich scrollende Reiterleiste (200 % Text) – aktiven Reiter einblenden, ohne die Seite zu scrollen
    const tabEl = tabRefs.current[`${v}-${id}`];
    const strip = tabEl?.parentElement;
    if (tabEl && strip && strip.scrollWidth > strip.clientWidth) {
      strip.scrollLeft = Math.max(0, tabEl.offsetLeft - strip.offsetLeft - (strip.clientWidth - tabEl.offsetWidth) / 2);
    }
    const smooth = scrollBehavior(document, window);
    requestAnimationFrame(() => {
      if (desktop) {
        // Desktop: Liegt der Planer-Anfang über dem Header, dorthin zurück (P2-4).
        const root = rootRef.current;
        if (!root) return;
        const kpTop = parseFloat(getComputedStyle(root).getPropertyValue("--kp-top")) || 166;
        const top = root.getBoundingClientRect().top;
        if (top < kpTop + 8) window.scrollTo({ top: window.scrollY + top - kpTop - 16, behavior: smooth });
        return;
      }
      // Mobil: Panel-Anfang direkt unter die angeheftete Ansicht holen.
      const panel = panelRef.current;
      const sticky = stickyRef.current;
      if (!panel || !sticky) return;
      // QM r3: zwei Spalten (Handy quer) – Panelanfang unter den Header holen
      const rootEl = rootRef.current;
      if (rootEl && getComputedStyle(rootEl).gridTemplateColumns.trim().split(" ").length > 1) {
        const headH = document.querySelector("header")?.getBoundingClientRect().height || 64;
        const pt = panel.getBoundingClientRect().top;
        if (pt < headH || pt > window.innerHeight * 0.5) window.scrollBy({ top: pt - headH - 8, behavior: smooth });
        return;
      }
      // QM r3 (200 % Text): Ansicht scrollt mit statt angeheftet → Reiterleiste
      // unter den Header holen, damit der Panelanfang sichtbar wird.
      if (getComputedStyle(sticky).position !== "sticky") {
        const mStrip = tabRefs.current[`m-${id}`]?.parentElement;
        const headH = document.querySelector("header")?.getBoundingClientRect().height || 64;
        const st = mStrip?.getBoundingClientRect().top;
        if (st != null && Math.abs(st - headH - 4) > 8) window.scrollBy({ top: st - headH - 4, behavior: smooth });
        return;
      }
      const bottom = sticky.getBoundingClientRect().bottom;
      const top = panel.getBoundingClientRect().top;
      if (top < bottom) {
        window.scrollBy({ top: top - bottom - 4 });
        return;
      }
      // QM r2 (iphone-se): Liegt der Panel-Anfang unter/kurz über der Preisleiste,
      // sah man nach dem Antippen keine Änderung → so weit scrollen, dass das Panel
      // direkt unter der (dann angehefteten) Ansicht beginnt.
      const barTop = barRef.current?.getBoundingClientRect().top || window.innerHeight;
      if (top > barTop - 140) {
        const kpTop = parseFloat(getComputedStyle(sticky).top) || 64;
        const aim = kpTop + sticky.getBoundingClientRect().height + 4;
        if (top > aim) window.scrollBy({ top: top - aim, behavior: smooth });
      }
    });
  };

  // Nach „Anfragen“: warten, bis der (dynamisch geladene) Abschnitt da ist, dann hinscrollen
  // und die Überschrift fokussieren (kein Eingabefeld – mobil ginge sonst die Tastatur auf).
  useEffect(() => {
    if (tab !== "ergebnis" || reqTick === reqDone.current) return undefined;
    reqDone.current = reqTick;
    const until = Date.now() + 4000;
    let raf = 0;
    const tick = () => {
      const el = document.getElementById("kp-req");
      if (!el) {
        if (Date.now() < until) raf = requestAnimationFrame(tick);
        return;
      }
      const smooth = scrollBehavior(document, window);
      el.scrollIntoView({ block: "start", behavior: smooth });
      el.focus({ preventScroll: true });
    };
    // erst nach dem Scroll aus goTab (requestAnimationFrame) starten
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [tab, reqTick]);

  const onTabKey = (variant) => (e) => {
    const i = TAB_IDS.indexOf(tab);
    let n = null;
    if (e.key === "ArrowRight") n = TAB_IDS[(i + 1) % TAB_IDS.length];
    if (e.key === "ArrowLeft") n = TAB_IDS[(i - 1 + TAB_IDS.length) % TAB_IDS.length];
    if (e.key === "Home") n = TAB_IDS[0];
    if (e.key === "End") n = TAB_IDS[TAB_IDS.length - 1];
    if (n) {
      e.preventDefault();
      goTab(n, variant);
    }
  };

  const renderTabs = (variant) => (
    <div className="flex items-stretch gap-1">
      {/* QM planer-tools r2: Reiter mindestens so breit wie ihr Text; bei 200 % Textgröße brechen sie
          in eine zweite Zeile um statt seitlich abgeschnitten zu scrollen (normal: eine Zeile). */}
      {/* QM r3: Schrift in rem (wächst mit der Textgröße), Höhe in px (44-px-Ziel) – vorher wuchsen bei 200 % nur
          die Polster. Eine Zeile; passt sie nicht, scrollt sie seitlich (aktiver Reiter wird eingeblendet). */}
      <ScrollStrip role="tablist" aria-label={tr("Planungsschritte")} className={`${styles.tabs} flex min-w-0 flex-1 gap-0.5 overflow-x-auto bg-stone p-0.5 lg:p-1`} onKeyDown={onTabKey(variant)}>
        {TABS.map(([id, label]) => (
          <button
            key={id}
            ref={(el) => (tabRefs.current[`${variant}-${id}`] = el)}
            role="tab"
            type="button"
            aria-selected={tab === id}
            aria-controls={`kp-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => goTab(id, variant)}
            className={`relative min-h-[44px] min-w-max flex-auto whitespace-nowrap px-2.5 text-[0.8125rem] leading-tight transition-colors sm:text-sm ${focusRing} ${tab === id ? "bg-paper font-semibold text-ink" : "text-ink/80 hover:text-ink"}`}
          >
            {tr(label)}
            {id === "pruefen" && checks.counts.error > 0 && (
              <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center bg-error px-0.5 text-[10px] font-semibold leading-none text-paper" aria-label={tr(checks.counts.error > 1 ? "{n} Kollisionen" : "{n} Kollision", { n: checks.counts.error })}>
                {checks.counts.error}
              </span>
            )}
          </button>
        ))}
      </ScrollStrip>
      <div className={`gap-0.5 ${variant === "m" ? "hidden" : "flex"}`} role="group" aria-label={tr("Verlauf")}>
        <button type="button" className={`${iconBtn} border border-ink/15 bg-paper`} onClick={() => dispatch({ type: "undo" })} disabled={!hist.past.length} aria-label={tr("Rückgängig (Strg+Z)")} title={tr("Rückgängig (Strg+Z)")}>
          <Undo2 size={16} aria-hidden="true" />
        </button>
        <button type="button" className={`${iconBtn} border border-ink/15 bg-paper`} onClick={() => dispatch({ type: "redo" })} disabled={!hist.future.length} aria-label={tr("Wiederholen (Strg+Y)")} title={tr("Wiederholen (Strg+Y)")}>
          <Redo2 size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  const colors = FRONT_COLORS[plan.finish];
  const isIsland = SHAPES[plan.shape].island;
  const isFree = plan.shape === "frei";
  const wallBLabel = ["l", "u", "zweizeilig", "halbinsel"].includes(plan.shape) ? (plan.shape === "zweizeilig" ? "Wand B (links)" : "Wand B (links)") : "Raumtiefe";
  const request = () => {
    goTab("ergebnis");
    setReqTick((n) => n + 1);
  };
  const wr = worktopRange(plan.ergo.body);
  const workH = Math.round((plan.ergo.plinth + plan.ergo.carcass) * 10 + plan.topT) / 10;
  const fitHeight = () => {
    const target = Math.round((wr.min + wr.max) / 2);
    const carcass = target - plan.topT / 10 - 78 >= LIMITS.plinth.min ? 78 : 72;
    const plinth = Math.max(LIMITS.plinth.min, Math.min(LIMITS.plinth.max, Math.round(target - carcass - plan.topT / 10)));
    updErgo({ plinth, carcass });
  };
  const rendered = roomWalls(plan).filter((w) => w.rendered);

  return (
    <GeraetePlanContext.Provider value={geraeteCtx}>
    <div ref={rootRef} data-kp-root="" className={`${styles.root} grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-8`}>
      {/* Ansicht: mobil oben angeheftet, damit jede Änderung sichtbar bleibt */}
      <div ref={stickyRef} className={`${styles.stick} sticky top-[var(--kp-top,64px)] z-20 -mx-4 self-start bg-paper pb-1.5 pt-1.5 sm:mx-0 lg:top-[calc(var(--kp-top)+16px)] lg:max-h-[calc(100dvh-var(--kp-top)-16px)] lg:pb-0 lg:pt-0`}>
        <PriceLine price={price} onRequest={request} className="mb-2 hidden bg-bone px-4 py-2 ring-1 ring-ink/10 lg:flex" />
        {linkNote && (
          <p className="mx-4 mb-1.5 flex items-start justify-between gap-2 border-l-4 border-notice bg-[#f6efe2] py-1.5 pl-3 pr-1 text-[0.8125rem] text-ink sm:mx-0" role="status">
            <span>{tr("Der Link enthielt keine gültige Planung – gezeigt wird die Beispielplanung.")}</span>
            <button type="button" className={`${iconBtn} h-8 w-8`} onClick={() => setLinkNote(false)} aria-label={tr("Hinweis schließen")}>
              <X size={14} aria-hidden="true" />
            </button>
          </p>
        )}
        {geraetNote && (
          <p className="mx-4 mb-1.5 flex items-start justify-between gap-2 border-l-4 border-ink/40 bg-bone py-1.5 pl-3 pr-1 text-[0.8125rem] text-ink sm:mx-0" role="status" data-kp-geraet-note="">
            <span>{geraetNote}</span>
            <button type="button" className={`${iconBtn} h-8 w-8`} onClick={() => setGeraetNote("")} aria-label={tr("Hinweis schließen")}>
              <X size={14} aria-hidden="true" />
            </button>
          </p>
        )}
        <div className={`${styles.view} ${minimized ? "h-24 sm:h-32" : "h-[calc(clamp(220px,38svh,340px)+68px)] sm:h-[calc(clamp(300px,42svh,460px)+68px)]"} lg:h-[calc(100svh-var(--kp-top)-136px)] lg:min-h-[460px] lg:max-h-[760px]`}>
          <Viewer
            plan={plan}
            kitchen={kitchen}
            checks={checks}
            apiRef={apiRef}
            onStatus={setStatus}
            minimized={minimized}
            onToggleMinimized={() => setMinimized((m) => !m)}
            onCommit={onCommit}
            selected={selected}
            onSelect={setSelected}
            initialMobile={initialMobile}
            show3DTick={show3D}
            history={{ onUndo: () => dispatch({ type: "undo" }), onRedo: () => dispatch({ type: "redo" }), canUndo: hist.past.length > 0, canRedo: hist.future.length > 0 }}
          />
        </div>
        <div className="mt-1.5 px-4 sm:px-0 lg:hidden">{renderTabs("m")}</div>
      </div>

      <div className="min-w-0 lg:min-h-[calc(100svh-var(--kp-top))]">
        <div className="hidden lg:block">{renderTabs("d")}</div>

        <div ref={panelRef} className={`${styles.panel} pb-12 pt-4 lg:pb-16 lg:pt-5`} role="tabpanel" id={`kp-panel-${tab}`} aria-label={tr(TABS.find(([id]) => id === tab)[1])} tabIndex={-1}>
          {tab === "raum" && (
            <div className="space-y-7">
              <Fieldset legend={tr("Grundform")}>
                <div className="grid grid-cols-2 gap-2">
                  {SHAPE_ORDER.map((id) => {
                    const s = SHAPES[id];
                    return (
                      <button key={id} type="button" aria-pressed={plan.shape === id} onClick={() => setShape(id)} className={chip(plan.shape === id)}>
                        <span className="block font-medium">{tr(s.label)}</span>
                        <span className={`block text-xs ${plan.shape === id ? "text-paper/85" : "text-ink-soft"}`}>{tr(s.hint)}</span>
                      </button>
                    );
                  })}
                </div>
              </Fieldset>
              <Fieldset legend={tr(isFree ? "Wände" : "Maße")}>
                {isFree ? (
                  <FreeRoomEditor plan={plan} setPlan={setPlan} />
                ) : (
                  <div className="space-y-4">
                    <RangeField id="kp-wa" label={tr(plan.shape === "zweizeilig" ? "Wand A (Raumbreite)" : "Wand A (Rückwand)")} value={plan.walls.a} {...LIMITS.wall} onChange={(v) => setWall("a", v)} />
                    <RangeField id="kp-wb" label={tr(wallBLabel)} value={plan.walls.b} {...LIMITS.wall} onChange={(v) => setWall("b", v)} />
                    {(plan.shape === "u" || plan.shape === "zweizeilig") && <RangeField id="kp-wc" label={tr("Wand C (rechts)")} value={plan.walls.c} {...LIMITS.wall} onChange={(v) => setWall("c", v)} />}
                    {/* Fix 2 (P2-6): Automatische Belegung lässt Geräte weg → am Feld sagen, was fehlt */}
                    {activeWalls(plan).filter((w) => w !== "i" && !edited.has(w)).map((w) => {
                      const have = new Set((plan.runs[w] || []).map((m) => m.t));
                      const lost = [...new Set(presetAppliances(plan.shape, w))].filter((t) => !have.has(t));
                      if (!lost.length) return null;
                      const names = lost.map((t) => tr(MODULES[t].name));
                      const list = names.length > 1 ? tr("{a} und {b}", { a: names.slice(0, -1).join(", "), b: names[names.length - 1] }) : names[0];
                      return (
                        <p key={`lost-${w}`} data-kp-lost={w} className="border-l-4 border-notice bg-[#f6efe2] p-3 text-[0.8125rem] text-ink" role="status">
                          {tr(lost.length > 1 ? "Bei {n} cm nutzbarer Länge passen {list} nicht mehr an Wand {w}. Wand verlängern oder das Gerät im Reiter Möbel an einer anderen Wand einplanen." : "Bei {n} cm nutzbarer Länge passt {list} nicht mehr an Wand {w}. Wand verlängern oder das Gerät im Reiter Möbel an einer anderen Wand einplanen.", { n: Math.round(runLength(plan, w)), list, w: w.toUpperCase() })}
                        </p>
                      );
                    })}
                    {/* P2-2: Module länger als die Wand → direkt kürzen oder neu auffüllen */}
                    {activeWalls(plan).filter((w) => w !== "i" && runUsed(plan.runs[w] || []) > runLength(plan, w) + 0.01).map((w) => (
                      <div key={w} className="flex flex-wrap items-center gap-2 border-l-4 border-error bg-[#fbeee9] p-3 text-[0.8125rem] text-[#8a2a1f]" role="status">
                        <p className="w-full">{tr("Die Module an Wand {w} sind {n} cm länger als die Wand.", { w: w.toUpperCase(), n: Math.round((runUsed(plan.runs[w]) - runLength(plan, w)) * 10) / 10 })}</p>
                        <button type="button" className={lightBtn} onClick={() => onRun(w, (plan.runs[w] || []).slice(0, -1))}>{tr("Letztes Modul entfernen")}</button>
                        <button type="button" className={lightBtn} onClick={() => onAuto(w)}><Wand2 size={16} aria-hidden="true" /> {tr("Neu auffüllen")}</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-3">
                  <RangeField id="kp-h" label={tr("Raumhöhe")} value={plan.h} {...LIMITS.height} onChange={(v) => update({ h: v }, "h")} />
                </div>
              </Fieldset>
              <Fieldset legend={tr("Dachschräge")} note={tr("Die Schräge steigt von der gewählten Wand in den Raum. Hoch- und Hängeschränke darunter meldet die Prüfung.")}>
                <label className="block text-sm text-ink" htmlFor="kp-slope-w">
                  {tr("Schräge an")}
                  <select id="kp-slope-w" className={`${selectCls} mt-1 w-full`} value={plan.room.slope.w} onChange={(e) => setPlan((p) => ({ ...p, room: { ...p.room, slope: { ...p.room.slope, w: e.target.value } } }))}>
                    <option value="">{tr("Keine Dachschräge")}</option>
                    {rendered.map((w) => <option key={w.id} value={w.id}>{tr("Wand {w}", { w: w.id.toUpperCase() })}</option>)}
                  </select>
                </label>
                {plan.room.slope.w && (
                  <div className="space-y-4 pt-2">
                    <RangeField id="kp-sk" label={tr("Kniestock (Wandhöhe)")} value={plan.room.slope.k} {...LIMITS.knee} onChange={(k) => setPlan((p) => ({ ...p, room: { ...p.room, slope: { ...p.room.slope, k: Math.min(k, p.h) } } }), "sk")} />
                    <RangeField id="kp-sd" label={tr("Neigung")} unit="°" value={plan.room.slope.d} {...LIMITS.slopeDeg} onChange={(d) => setPlan((p) => ({ ...p, room: { ...p.room, slope: { ...p.room.slope, d } } }), "sd")} />
                  </div>
                )}
              </Fieldset>
              <Fieldset legend={tr("Öffnungen & Anschlüsse")}>
                <OpeningsEditor plan={plan} setPlan={setPlan} />
              </Fieldset>
              {isIsland && (
                <Fieldset legend={tr(plan.shape === "halbinsel" ? "Halbinsel" : "Insel")}>
                  <div className="space-y-4">
                    <RangeField id="kp-il" label={tr("Länge")} value={plan.island.len} {...LIMITS.islandLen} onChange={(v) => updIsland({ len: v }, "il")} />
                    <RangeField id="kp-id" label={tr("Tiefe (gesamt)")} value={plan.island.depth} {...LIMITS.islandDepth} onChange={(v) => updIsland({ depth: v }, "id")} />
                    <RangeField id="kp-io" label={tr("Überstand Sitzseite")} value={plan.island.over} {...LIMITS.overhang} onChange={(v) => updIsland({ over: v }, "io")} />
                    <RangeField id="kp-ia" label={tr("Gang zur Zeile")} value={plan.island.aisle} {...LIMITS.aisle} onChange={(v) => updIsland({ aisle: v }, "ia")} hint={tr("Empfohlen 120 cm für zwei Personen. Im Plan auch am Griff verschiebbar.")} />
                    {plan.shape === "insel" && <RangeField id="kp-ix" label={tr("Seitlich verschieben")} value={plan.island.x} {...LIMITS.islandShift} onChange={(v) => updIsland({ x: v }, "ix")} />}
                    <div className="grid grid-cols-3 gap-2" role="group" aria-label={tr("Gerät in der Insel")}>
                      {[["keine", "Ohne"], ["kochfeld", "Kochfeld"], ["spuele", "Spüle"]].map(([id, l]) => (
                        <button key={id} type="button" aria-pressed={!plan.runs.i?.length && plan.island.fn === id} className={chip(!plan.runs.i?.length && plan.island.fn === id)} onClick={() => setPlan((p) => ({ ...p, island: { ...p.island, fn: id }, runs: { ...p.runs, i: [] } }))}>
                          {tr(l)}
                        </button>
                      ))}
                    </div>
                    <label className="flex min-h-11 items-center justify-between gap-3 border border-ink/15 bg-paper px-3 text-sm text-ink">
                      {tr("Barplatte auf der Sitzseite (ca. 108 cm)")}
                      <input type="checkbox" className="h-5 w-5 accent-ink" checked={plan.island.bar} onChange={(e) => updIsland({ bar: e.target.checked })} />
                    </label>
                  </div>
                </Fieldset>
              )}
              <Fieldset legend={tr("Raster")}>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(RASTER).map(([g, r]) => (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={plan.raster === Number(g)}
                      className={chip(plan.raster === Number(g))}
                      onClick={() => {
                        setEdited(new Set());
                        setPlan((p) => switchRaster(p, Number(g)));
                      }}
                    >
                      {tr(r.label)}
                    </button>
                  ))}
                </div>
              </Fieldset>
              <Fieldset legend={tr("Ergonomie")} note={tr("Empfehlung: 10–15 cm unter dem Ellenbogen (ca. {n} cm) – Quelle: Neff-Planungsratgeber.", { n: wr.elbow })}>
                <div className="space-y-4">
                  <RangeField id="kp-body" label={tr("Körpergröße (wer am meisten kocht)")} value={plan.ergo.body} {...LIMITS.body} onChange={(v) => updErgo({ body: v }, "body")} />
                  <RangeField id="kp-plinth" label={tr("Sockelhöhe")} value={plan.ergo.plinth} {...LIMITS.plinth} onChange={(v) => updErgo({ plinth: v }, "plinth")} />
                  <Chips label={tr("Korpushöhe")} value={plan.ergo.carcass} onChange={(v) => updErgo({ carcass: v })} options={CARCASS_HEIGHTS.map((h) => [h, tr("Korpus {n} cm", { n: h })])} />
                  <RangeField id="kp-upgap" label={tr("Hängeschränke über der Platte")} value={plan.ergo.upGap} {...LIMITS.upGap} onChange={(v) => updErgo({ upGap: v }, "upgap")} />
                  <div className={`flex flex-wrap items-center justify-between gap-2 p-3 text-sm ${workH < wr.min - 1 || workH > wr.max + 1 ? "bg-[#fbeee9] text-error" : "bg-[#eef3ea] text-success"}`} role="status">
                    <span>
                      {tr("Arbeitshöhe")} <strong className="tabular-nums">{tr.num(workH)} cm</strong> · {tr("empfohlen {n1}–{n2} cm", { n1: wr.min, n2: wr.max })}
                    </span>
                    {(workH < wr.min - 1 || workH > wr.max + 1) && (
                      <button type="button" className={lightBtn} onClick={fitHeight}>{tr("Anpassen")}</button>
                    )}
                  </div>
                </div>
              </Fieldset>
              <label className="flex min-h-11 items-center justify-between gap-3 border border-ink/15 bg-paper px-3 text-sm text-ink">
                {tr("Hängeschränke über der Arbeitsfläche")}
                <input type="checkbox" className="h-5 w-5 accent-ink" checked={plan.wallCabinets} onChange={(e) => update({ wallCabinets: e.target.checked })} />
              </label>
            </div>
          )}

          {tab === "module" && (
            <div className="space-y-4">
              <p className="text-sm text-ink-soft">
                {tr("Module im {n}-cm-Raster, von der Ecke bzw. von links. Im Plan oben ziehen Sie Module an jede Wand – sie rasten an Nachbarn und Zeilenenden ein.", { n: plan.raster })}
                <span className="lg:hidden"> {tr("Antippen zum Ändern, seitlich wischen für mehr.")}</span>
              </p>
              {activeWalls(plan).map((w) => (
                <RunEditor key={w} wall={w} plan={plan} kitchen={kitchen} onRun={onRun} onAuto={onAuto} onUp={onUp} selectedId={selected} onSelect={setSelected} />
              ))}
              {isIsland && (
                <section className="border border-ink/15 bg-paper p-3" aria-labelledby="kp-run-i">
                  <h3 id="kp-run-i" className="text-sm font-semibold text-ink">{tr(plan.shape === "halbinsel" ? "Halbinsel" : "Insel")}</h3>
                  {plan.runs.i?.length ? (
                    <>
                      <RunList id="i" title={tr("Insel")} island run={plan.runs.i} raster={plan.raster} len={plan.island.len} onRun={(r) => onRun("i", r)} />
                      <button type="button" className={`${lightBtn} mt-2`} onClick={() => onRun("i", [])}>
                        <Wand2 size={16} aria-hidden="true" /> {tr("Wieder automatisch aufteilen")}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-ink-soft">{tr("Automatisch aus Länge und Gerät aufgeteilt (Reiter Raum).")}</p>
                      <button type="button" className={lightBtn} onClick={() => onRun("i", islandModules(plan))}>{tr("Module der Insel selbst festlegen")}</button>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {tab === "material" && (
            <div className="space-y-7">
              {status.webgl && !status.ready && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-l-4 border-brass-500 bg-bone p-3 text-[0.8125rem] text-ink" data-kp-material-3d="">
                  <p className="min-w-0 flex-1">{tr("Fronten, Griffe und Arbeitsplatte sehen Sie in der 3D-Ansicht – der Grundriss zeigt nur die Aufteilung.")}</p>
                  <button type="button" className={lightBtn} onClick={() => setShow3D((n) => n + 1)}>
                    {tr("In 3D ansehen")}
                  </button>
                </div>
              )}
              {/* Fotoansicht: Rendering zur gewählten Grundform/Front/Platte – mobil unter der
                  angehefteten Plan-/3D-Ansicht, Desktop als Karte im Panel neben der Ansicht. */}
              <Fieldset legend={tr("Fotoansicht")}>
                <Fotoansicht plan={plan} />
              </Fieldset>
              <Fieldset legend={tr("Linie")} note={tr(LINES[plan.line].note)}>
                <div className="grid gap-2">
                  {Object.entries(LINES).map(([id, l]) => (
                    <button key={id} type="button" aria-pressed={plan.line === id} className={chip(plan.line === id)} onClick={() => update({ line: id })}>
                      <span className="block font-medium">{tr(l.label)}</span>
                      <span className={`block text-xs ${plan.line === id ? "text-paper/85" : "text-ink-soft"}`}>{tr(l.tagline)}</span>
                    </button>
                  ))}
                </div>
              </Fieldset>
              <Fieldset legend={tr("Stimmung")} note={tr("Setzt Fronten, Griff und Arbeitsplatte in einem Schritt – danach bleibt alles einzeln änderbar.")}>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={tr("Stimmung")}>
                  {MOODS.map((m) => (
                    <button key={m.id} type="button" aria-pressed={moodActive(plan, m)} className={chip(moodActive(plan, m))} onClick={() => update(m.set)}>
                      <span className="block font-medium">{tr(m.label)}</span>
                      <span className={`block text-xs ${moodActive(plan, m) ? "text-paper/85" : "text-ink-soft"}`}>{tr(m.sub)}</span>
                    </button>
                  ))}
                </div>
              </Fieldset>
              <Fieldset legend={tr("Fronten")}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(FRONT_FINISHES).map(([id, f]) => (
                    <button key={id} type="button" aria-pressed={plan.finish === id} className={chip(plan.finish === id)} onClick={() => update({ finish: id, color: Object.keys(FRONT_COLORS[id])[0] })}>
                      {tr(f.label)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-2" role="radiogroup" aria-label={tr("Frontfarbe")}>
                  {Object.entries(colors).map(([id, c]) => (
                    <button key={id} type="button" role="radio" aria-checked={plan.color === id} onClick={() => update({ color: id })} className={`flex w-[4.5rem] flex-col items-center gap-1 p-1 text-center text-xs text-ink ${focusRing}`}>
                      <span
                        className={`block h-11 w-11 border ${plan.color === id ? "outline-2 outline-offset-2 outline-ink" : "border-ink/20"}`}
                        style={c.texture ? { backgroundImage: `url(${TEXTURE_BASE}/${c.texture}/color.jpg)`, backgroundSize: "300%", backgroundColor: c.hex, backgroundBlendMode: "multiply" } : { background: c.hex }}
                        aria-hidden="true"
                      />
                      {tr(c.label)}
                    </button>
                  ))}
                </div>
              </Fieldset>
              <Fieldset legend={tr("Griff")}>
                <Chips label={tr("Griff")} value={plan.grip} onChange={(v) => update({ grip: v })} options={Object.entries(GRIPS).map(([id, g]) => [id, tr(g.label)])} />
                {plan.grip !== "push" && (
                  <Chips label={tr("Griff-Farbe")} cols={3} value={plan.gripColor} onChange={(v) => update({ gripColor: v })} options={Object.entries(GRIP_COLORS).map(([id, g]) => [id, tr(g.label)])} />
                )}
              </Fieldset>
              <Fieldset legend={tr("Arbeitsplatte")} note={tr("Materialbilder: CC0-Texturen (ambientCG) bzw. im Browser erzeugt – Muster sehen Sie im Showroom.")}>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(WORKTOPS).map(([id, w]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={plan.top === id}
                      className={`${chip(plan.top === id)} flex items-center gap-2`}
                      onClick={() => update({ top: id, topT: w.mm.includes(plan.topT) ? plan.topT : w.mm[Math.min(1, w.mm.length - 1)] })}
                    >
                      <span
                        className="block h-9 w-9 shrink-0 border border-black/10"
                        style={w.texture.startsWith("proc:") ? { background: id === "granit" ? "radial-gradient(circle at 30% 30%, #6f7072 1px, transparent 2px) 0 0/6px 6px, #3d3e40" : "repeating-linear-gradient(0deg, #c9cccf 0 1px, #b6b9bc 1px 3px)" } : { backgroundImage: `url(${TEXTURE_BASE}/${w.texture}/color.jpg)`, backgroundSize: "260%" }}
                        aria-hidden="true"
                      />
                      <span>
                        <span className="block font-medium">{tr(w.label)}</span>
                        <span className={`block text-xs ${plan.top === id ? "text-paper/85" : "text-ink-soft"}`}>{w.mm.join(" / ")} mm</span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="pt-2 text-[0.8125rem] font-medium text-ink">{tr("Stärke")}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={tr("Plattenstärke")}>
                  {WORKTOPS[plan.top].mm.map((mm) => (
                    <button key={mm} type="button" aria-pressed={plan.topT === mm} className={chip(plan.topT === mm)} onClick={() => update({ topT: mm })}>{mm} mm</button>
                  ))}
                </div>
                <p className="pt-2 text-[0.8125rem] font-medium text-ink">{tr("Kante")}</p>
                <Chips label={tr("Kante")} value={plan.edge} onChange={(v) => update({ edge: v })} options={Object.entries(EDGES).map(([id, e]) => [id, tr(e.label)])} />
                <p className="pt-2 text-[0.8125rem] font-medium text-ink">{tr("Spüle und Kochfeld einbauen")}</p>
                <Chips label={tr("Einbau")} cols={3} value={plan.sink} onChange={(v) => update({ sink: v })} options={Object.entries(SINK_MOUNTS).map(([id, e]) => [id, tr(e.label)])} />
              </Fieldset>
              <Fieldset legend={tr("Nischenrückwand")}>
                <Chips label={tr("Nischenrückwand")} value={plan.splash} onChange={(v) => update({ splash: v })} options={Object.entries(SPLASHES).map(([id, e]) => [id, tr(e.label)])} />
              </Fieldset>
              <Fieldset legend={tr("Wangen und Abschlüsse")}>
                <Chips label={tr("Wangen")} cols={3} value={plan.panels} onChange={(v) => update({ panels: v })} options={Object.entries(PANELS).map(([id, e]) => [id, tr(e.label)])} />
              </Fieldset>
              <Fieldset legend={tr("Licht")} note={tr("Lichtstimmung „Abend“ in der 3D-Ansicht (Mond-Symbol) zeigt LED und Pendel eingeschaltet.")}>
                <label className="flex min-h-11 items-center justify-between gap-3 border border-ink/15 bg-paper px-3 text-sm text-ink">
                  {tr("Unterbau-LED unter den Hängeschränken")}
                  <input type="checkbox" className="h-5 w-5 accent-ink" checked={plan.led} onChange={(e) => update({ led: e.target.checked })} />
                </label>
                <p className="pt-2 text-[0.8125rem] font-medium text-ink">{tr(isIsland ? "Pendelleuchten über der Insel" : "Pendelleuchten über der Zeile")}</p>
                <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={tr("Anzahl Pendelleuchten")}>
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button key={n} type="button" aria-pressed={plan.pend === n} className={chip(plan.pend === n)} onClick={() => update({ pend: n })}>{n}</button>
                  ))}
                </div>
              </Fieldset>
            </div>
          )}

          {tab === "pruefen" && <CheckPanel plan={plan} kitchen={kitchen} checks={checks} onSelect={setSelected} />}

          {tab === "ergebnis" && (
            <ResultPanel plan={plan} kitchen={kitchen} price={price} warnings={problems.map((p) => p.text)} hasErrors={checks.counts.error > 0} shareUrl={shareUrl} calendar={calendar} apiRef={apiRef} view3dReady={status.ready} onLoad={onLoadPlan}
              compare={<VariantCompare plan={plan} priceTable={catalog.priceTable} onLoad={onLoadPlan} />}
            />
          )}

          {tab !== "ergebnis" && tab !== "pruefen" && problems.length > 0 && (
            <div className={`mt-5 border-l-4 p-3 text-sm ${checks.counts.error ? "border-error bg-[#fbeee9] text-[#8a2a1f]" : "border-notice bg-[#f6efe2] text-ink"}`} data-kp-problems="">
              <p className="font-medium">{checks.counts.error ? tr(checks.counts.error > 1 ? "{n} Kollisionen" : "{n} Kollision", { n: checks.counts.error }) : ""}{checks.counts.error && checks.counts.warn ? " · " : ""}{checks.counts.warn ? tr(checks.counts.warn > 1 ? "{n} Hinweise" : "{n} Hinweis", { n: checks.counts.warn }) : ""}</p>
              <ul className="mt-1 space-y-1">
                {problems.slice(0, 4).map((w) => (
                  <li key={w.text} className={w.level === "error" ? "text-[#8a2a1f]" : "text-ink"}>
                    <span className={`mr-1 font-medium ${w.level === "error" ? "" : "text-notice"}`}>{tr(w.level === "error" ? "Kollision:" : "Hinweis:")}</span>
                    {tr(w.text)}
                  </li>
                ))}
              </ul>
              {problems.length > 4 && (
                <button type="button" className="mt-1 min-h-11 underline underline-offset-2" onClick={() => goTab("pruefen")}>{tr("Alle {n} im Reiter Prüfen", { n: problems.length })}</button>
              )}
            </div>
          )}
          {(() => {
            const i = TAB_IDS.indexOf(tab);
            const prev = TABS[i - 1];
            const next = TABS[i + 1];
            return (
              <nav className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4" aria-label={tr("Schritt wechseln")} data-kp-stepnav="">
                <p className="text-[0.8125rem] text-ink-soft">
                  {tr("Schritt {n1} von {n2}", { n1: i + 1, n2: TABS.length })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {prev && (
                    <button type="button" className={lightBtn} onClick={() => goTab(prev[0])}>
                      <ArrowLeft size={16} aria-hidden="true" /> {tr(prev[1])}
                    </button>
                  )}
                  {next && (
                    <button type="button" className={`inline-flex min-h-11 items-center gap-1.5 bg-ink px-4 text-sm font-medium text-paper hover:bg-ink-deep ${focusRing}`} onClick={() => goTab(next[0])}>
                      {tr("Weiter: {step}", { step: tr(NEXT_LABEL[next[0]]) })} <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </nav>
            );
          })()}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite" data-kp-check-note="">{checkNote}</p>

      {/* Mobil: Preis + Anfragen unten (ersetzt auf dieser Seite die Leiste „Anrufen / Termin“) */} {/* QM r5: Seitenabstand wie das Raster (px-gutter) */}
      <div ref={barRef} className={`${styles.priceBar} @container fixed bottom-0 left-0 right-0 z-30 border-t border-ink/10 bg-paper px-gutter pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(31,37,43,0.08)] lg:hidden`}>
        <PriceLine price={price} onRequest={request} className="flex" />
      </div>
    </div>
    </GeraetePlanContext.Provider>
  );
}
