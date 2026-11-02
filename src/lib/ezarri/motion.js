// Motion-Bausteine für Ezarri und Yacht (Motion-Runde 01.11.2026).
// Nur die gemeinsamen Token und Klassen aus globals.css (MOTION-FUNDAMENT):
// .reveal / .reveal-group lesen --reveal-start / --reveal-end als Start und
// Ende ihres scrollgetriebenen Auftritts (view(), nur transform, ohne
// Unterstützung steht alles an Ort und Stelle; still bei
// prefers-reduced-motion und html[data-motion="reduced" | "calm"]).
//
// .reveal-group staffelt über :nth-child – in einem 3-Spalten-Raster bekäme
// nur die erste Reihe Versatz. staggerStyle() versetzt deshalb je SPALTE
// (index % columns) mit denselben Stufen wie globals.css (4 % je Stufe,
// höchstens vier Stufen ≈ --stagger-max). Gibt immer beide Variablen zurück,
// damit die :nth-child(n + 4)-Regel nie für Spalte 1 greift.

const STEP = 4; // % des Eintrittsbereichs je Spalte (wie .reveal-group)
const MAX_STEPS = 3; // Stufen 0..3 = vier Stufen

/**
 * @param {number} index    0-basierte Position in der Liste
 * @param {number} [columns=3] Spalten der breitesten Ansicht
 * @returns {{"--reveal-start": string, "--reveal-end": string}}
 */
export function staggerStyle(index, columns = 3) {
  const cols = Math.max(1, Math.floor(Number(columns) || 1));
  const i = Math.max(0, Math.floor(Number(index) || 0));
  const step = Math.min(i % cols, MAX_STEPS);
  return { "--reveal-start": `${step * STEP}%`, "--reveal-end": `${40 + step * STEP}%` };
}

// Bild-Hover in festem, overflow-hidden Rahmen: 2 % in --duration-morph auf
// der langen, gleichmäßigen Kurve (wie Shop/Wohnen). motion-safe: beachtet
// auch html[data-motion] (eigene Variante in globals.css) – bei ruhiger
// Ansicht kein Zoom und keine Transition.
export const IMAGE_HOVER = "transition-transform duration-(--duration-morph) ease-drift motion-safe:group-hover:scale-[1.02]";

// Unterstrich, der beim Hover der Karte erscheint (Farbwechsel, 160 ms).
export const CARD_LINK = "underline decoration-transparent transition-colors duration-(--duration-micro) group-hover:decoration-current";

// Panel-/Ansichtswechsel (Tabs, Schritte, Bühnenmodi): beim Einblenden aus
// display:none 0,6 → 1 Deckkraft in --duration-swap (Text nie unter 0,6),
// bei ruhiger Ansicht sofort.
export const PANEL_IN = "transition-opacity duration-(--duration-swap) ease-quiet starting:opacity-60 motion-reduce:transition-none";

// Dialog öffnen: Vollbild-Lightbox blendet auf, Bottom-Sheet gleitet hoch,
// Seitenpanel gleitet von rechts (nur transform/opacity, --duration-ui).
export const DIALOG_FADE = "transition-opacity duration-(--duration-swap) ease-quiet starting:open:opacity-0 motion-reduce:transition-none";
export const SHEET_UP = "transition-transform duration-(--duration-ui) ease-quiet starting:open:translate-y-full motion-reduce:transition-none";
export const PANEL_RIGHT = "transition-transform duration-(--duration-ui) ease-quiet starting:open:translate-x-full motion-reduce:transition-none";
// Feste Leiste am unteren Rand (Vergleich): gleitet beim Einsetzen hoch.
export const BAR_UP = "transition-transform duration-(--duration-ui) ease-quiet starting:translate-y-full motion-reduce:transition-none";

/** Stabiler Vergleichsschlüssel für useGeaendert (Zahlen, Strings, null). */
export function wertSchluessel(werte) {
  return JSON.stringify(werte ?? null);
}

/**
 * Klasse für einen Wert, der sich gerade geändert hat: nur nach der ersten
 * Bedienung (bewegt = useGeaendert(...)), damit beim Laden nichts blinkt.
 */
export const wechselKlasse = (bewegt) => (bewegt ? "ph-arrive" : undefined);

/** Werte, die das Attribut html[data-motion] für „ruhig“ annehmen darf. */
export const RUHIG_WERTE = Object.freeze(["reduced", "calm"]);

/**
 * Ruhige Ansicht aktiv? Systemeinstellung ODER html[data-motion="reduced" | "calm"].
 * @param {{matchMedia?: Function, document?: Document}} [env] für Tests
 */
export function istRuhig(env = typeof window === "undefined" ? null : window) {
  if (!env) return false;
  const mq = env.matchMedia?.("(prefers-reduced-motion: reduce)");
  const attr = env.document?.documentElement?.dataset?.motion;
  return Boolean(mq?.matches) || RUHIG_WERTE.includes(attr);
}

/**
 * Ruft `cb` bei jeder Änderung der Systemeinstellung oder von html[data-motion].
 * @returns {() => void} abmelden
 */
export function beobachteRuhig(cb) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  mq?.addEventListener?.("change", cb);
  const mo = typeof MutationObserver === "undefined" ? null : new MutationObserver(cb);
  mo?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    mq?.removeEventListener?.("change", cb);
    mo?.disconnect();
  };
}

/** scrollIntoView-Verhalten passend zur Ansicht. */
export const scrollVerhalten = () => (istRuhig() ? "auto" : "smooth");
