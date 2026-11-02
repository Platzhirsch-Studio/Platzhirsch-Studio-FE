// src/components/Concierge/flags.js – plain, client-safe (no "use client").
// Switches, hidden routes and the "nicht stören" store of the sitewide
// concierge (concierge-sitewide-architektur.md §3, §6).
//
// NEXT_PUBLIC_* is inlined at build time (node_modules/next/dist/docs/01-app/
// 02-guides/environment-variables.md): "1" on, "0" off, unset → on in
// development, off in production. client-layout.js repeats the expression
// inline so the bundler can drop the launcher import in production.
// Since 28.10.2026 (Inhaber-Entscheidung Nr. 9) default ON everywhere, "0" switches off.
const FLAG = process.env.NEXT_PUBLIC_CONCIERGE_SITEWIDE;
export const SITEWIDE = FLAG !== "0";

// Languages the launcher appears in. Production default: German only, until
// the consent and AI notices are checked in EN/FR/IT (Rechtspaket 02).
const LOC = process.env.NEXT_PUBLIC_CONCIERGE_LOCALES;
export const CONCIERGE_LOCALES = LOC
  ? LOC.split(",").map((l) => l.trim())
  : process.env.NODE_ENV === "production"
    ? ["de"]
    : ["de", "en", "fr", "it"];

// First path segment after the locale (like MobileCtaBar.HIDDEN_ON), and the
// labs pages with their own bottom bars or the inline concierge panel.
// The former labs pages now live at fixed URLs (Inhaber-Entscheidung Nr. 9).
const HIDDEN_FIRST = ["upload", "portal", "preview", "concierge", "kuechenplaner", "sofaplaner", "3d-ansicht"];

export function hiddenOn(pathname) {
  const [, locale, first] = String(pathname || "").split("/");
  if (!CONCIERGE_LOCALES.includes(locale)) return true;
  return HIDDEN_FIRST.includes(first);
}

// "Nicht stören": for this visit (sessionStorage) or 30 days (localStorage
// "ph-concierge:v1" = {"dnd":"<ISO end>"}). Everything in try/catch: without
// storage the choice lasts until the next reload (memory fallback).
const LOCAL_KEY = "ph-concierge:v1";
const SESSION_KEY = "ph-concierge:dnd";
const EVENT = "ph-concierge-dnd";
let memory = false;

function read() {
  if (memory) return true;
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return true;
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) || "null");
    if (v?.dnd && Date.parse(v.dnd) > Date.now()) return true;
  } catch {
    /* storage blocked */
  }
  return false;
}

export const dndStore = {
  subscribe(fn) {
    window.addEventListener(EVENT, fn);
    window.addEventListener("storage", fn);
    return () => {
      window.removeEventListener(EVENT, fn);
      window.removeEventListener("storage", fn);
    };
  },
  get: read,
  server: () => false,
};

/** mode: "visit" | "30d" */
export function setDnd(mode) {
  memory = true;
  try {
    if (mode === "30d") localStorage.setItem(LOCAL_KEY, JSON.stringify({ dnd: new Date(Date.now() + 30 * 864e5).toISOString() }));
    else sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* memory only */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function clearDnd() {
  memory = false;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* nothing stored */
  }
  window.dispatchEvent(new Event(EVENT));
}

// QM shell-home r4: a cookie bar that arrives while the side panel is open.
// The panel shrinks above it (--ph-consent-h, panel.module.css) as long as a
// usable panel (head, a few lines, input, foot ≈ 440 px) still fits between
// header and bar; on short screens it minimises to "Gespräch fortsetzen"
// instead (hidden until the bar is answered) – never input under the bar.
export const MIN_PANEL_H = 440;
export function yieldToConsent({ barH = 0, vh = 0, headerH = 72 } = {}) {
  return barH > 0 && vh - headerH - barH - 40 < MIN_PANEL_H;
}
