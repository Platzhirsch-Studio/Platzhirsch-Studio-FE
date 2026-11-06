"use client";
// Bewegung im Backoffice (MASTER G-31). Besitzer: Team Q2.
// Maßstab: art-direction/lounge.md § 8/9 (Federn, Druck, Hover, Staffel, Panel/Sheet, Zahl
// hochzählen, Häkchen); funktionale Regeln aus 04-motion.md / Q-H1…Q-H8, wo Lounge schweigt.
// Ein Ort für alles, was Bewegung per JavaScript braucht: Reduzierung, Dauern, Web Animations
// (element.animate) mit Abbruch statt Stapeln, FLIP, Kanban-Landung mit Feder, Hochzählen,
// gleitender Indikator, Häkchen, Hervorhebung und die View-Transition-Hüllen für Seitenwechsel,
// Skelett → Inhalt und Crossfade am gleichen Ort. CSS-Seite: src/app/bo-motion.css (gleiche Werte).
//
// Nur aus Client-Komponenten importieren. Server-Seiten nutzen die Komponenten
// (SeitenUebergang, SkelettHuelle, InhaltHuelle, Wechsel, ZahlHoch, Haken) direkt im JSX.

import { ViewTransition, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

/** Dauern in ms (= Token --bo-dur-* in bo-motion.css). */
export const DAUER = Object.freeze({
  // Lounge § 8
  feder: 620,
  federKurz: 420,
  druck: 80,
  erscheinen: 700,
  wachsen: 900,
  haken: 520,
  hakenVerzoegerung: 220,
  zaehlen: 900,
  staffel: 30,
  staffelKiosk: 25,
  // Funktionsdauern (Namen aus Q-H1)
  ack: 50,
  fast: 120,
  base: 160,
  move: 200,
  slow: 240,
  spring: 420,
  draw: 520,
  stagger: 30,
  spinnerVerzoegerung: 300,
  spinnerMindestens: 600,
  markiert: 1200,
  undo: 8000,
  undoKiosk: 6000,
});

/** Kurven (= Token --bo-ease-*). WAAPI versteht kein var(), daher als Text. */
export const KURVE = Object.freeze({
  aus: "cubic-bezier(0.22, 1, 0.36, 1)",
  ein: "cubic-bezier(0.4, 0, 1, 1)",
  inout: "cubic-bezier(0.65, 0, 0.35, 1)",
  linear: "linear",
});

/** Feder ζ 0,72 (Knöpfe, Indikatoren, Panels, Ablage) – identisch mit --bo-feder (Lounge --spring). */
export const FEDER =
  "linear(0, 0.058, 0.193, 0.358, 0.523, 0.67, 0.791, 0.884, 0.951, 0.995, 1.021, 1.034, 1.038, 1.037, 1.032, 1.025, 1.019, 1.013, 1.008, 1.005, 1.002, 1, 0.999, 1)";
/** Feder ζ 0,9 (Einblenden) – identisch mit --bo-feder-sanft (Lounge --spring-soft). */
export const FEDER_SANFT =
  "linear(0, 0.077, 0.237, 0.412, 0.57, 0.699, 0.797, 0.868, 0.918, 0.951, 0.973, 0.986, 0.994, 0.998, 1, 1.001, 1.002, 1.001, 1)";
/** Name aus Q-H1 (= FEDER). */
export const SPRING = FEDER;
/** Ersatz, falls der Browser linear() nicht kennt. */
export const SPRING_ERSATZ = "cubic-bezier(0.34, 1.3, 0.64, 1)";
const FEDER_SANFT_ERSATZ = KURVE.aus;

const LEER_ANIMATION = Object.freeze({ finished: Promise.resolve(), cancel() {}, finish() {} });

/** true, wenn der Benutzer im System „Bewegung reduzieren“ gewählt hat (Server: false). */
export function reduziert() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Dauer für Ortswechsel: bei reduzierter Bewegung 0. Für reine Blenden `blende()` nehmen. */
export function dauer(ms) {
  return reduziert() ? 0 : ms;
}

/** Dauer für Blenden (Opazität): bei reduzierter Bewegung höchstens 120 ms (Q-H6). */
export function blende(ms) {
  return reduziert() ? Math.min(ms, DAUER.fast) : ms;
}

/**
 * Staffel-Verzögerung eines nachträglich erscheinenden Listen-Eintrags (Q-H5): höchstens
 * 3 Stufen à 30 ms, ab 8 Einträgen keine, im Kiosk und bei reduzierter Bewegung keine.
 * (Erstes Erscheinen von Kacheln/Spalten staffelt das CSS: .bo-staffel bzw. staffel(i).)
 * @param {number} index Position in der neu erscheinenden Gruppe (0-basiert)
 * @param {number} anzahl Größe der Gruppe
 * @param {{kiosk?: boolean, reduziert?: boolean}} [opt]
 */
export function stufe(index, anzahl, opt = {}) {
  const red = opt.reduziert ?? reduziert();
  if (red || opt.kiosk || anzahl > 8 || index <= 0) return 0;
  return Math.min(index, 2) * DAUER.stagger;
}

/**
 * Inline-Stil für .bo-erscheinen / .bo-wachsen-y/-x: Index der Staffel (CSS deckelt bei 10/11).
 * `ab`: zusätzlicher Versatz in ms (z. B. Reise-Spalten nach ihrer Kachel: 120).
 */
export function staffel(i, ab) {
  const n = Number.isFinite(i) && i > 0 ? Math.floor(i) : 0;
  return ab ? { "--i": n, "--bo-erscheinen-ab": `${ab}ms` } : { "--i": n };
}

/**
 * Keyframes auf Opazität reduzieren (für „reduce“): Transform, Höhe usw. fallen weg.
 * Liefert null, wenn die Keyframes keine Opazität ändern – dann gar nicht animieren.
 */
export function nurOpazitaet(keyframes) {
  if (!Array.isArray(keyframes) || keyframes.length === 0) return null;
  const werte = keyframes.map((k) => (k.opacity === undefined ? 1 : Number(k.opacity)));
  if (werte.every((w) => w === werte[0])) return null;
  return keyframes.map((k, i) => (k.offset === undefined ? { opacity: werte[i] } : { opacity: werte[i], offset: k.offset }));
}

/** Kennt der Browser linear() als Kurve? (Server: false) */
export function springVerfuegbar() {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timing-function", "linear(0, 1)");
}

/** Kurve auflösen: "aus" | "ein" | "inout" | "feder" | "feder-sanft" | "spring" | "var(--bo-…)" | CSS-Text. */
export function kurve(name) {
  if (!name) return KURVE.aus;
  if (KURVE[name]) return KURVE[name];
  if (name === "feder" || name === "spring" || name === "var(--bo-ease-spring)" || name === "var(--bo-feder)") return springVerfuegbar() ? FEDER : SPRING_ERSATZ;
  if (name === "feder-sanft" || name === "var(--bo-feder-sanft)") return springVerfuegbar() ? FEDER_SANFT : FEDER_SANFT_ERSATZ;
  const m = /^var\((--[\w-]+)\)$/.exec(name);
  if (m) {
    const ersatz = { "--bo-ease-out": KURVE.aus, "--bo-ease-in": KURVE.ein, "--bo-ease-inout": KURVE.inout, "--bo-ease-linear": KURVE.linear }[m[1]];
    if (ersatz) return ersatz;
    if (typeof document !== "undefined") {
      const wert = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
      if (wert) return wert;
    }
    return KURVE.aus;
  }
  return name;
}

const laufend = typeof WeakMap !== "undefined" ? new WeakMap() : null;

/**
 * element.animate mit Reduzierung und Abbruch statt Stapeln (Q-H8): eine neue Animation
 * am selben Element bricht die laufende ab. Bei „reduce“ bleibt nur die Opazität
 * (≤ 120 ms, linear, ohne Verzögerung); ohne Opazitätswechsel entfällt die Animation.
 * @param {Element} el
 * @param {Keyframe[]} keyframes
 * @param {KeyframeAnimationOptions & {easing?: string}} [opts] easing auch "feder" / "feder-sanft"
 * @returns {Animation | {finished: Promise<void>, cancel(): void, finish(): void}}
 */
export function animiere(el, keyframes, opts = {}) {
  if (!el || typeof el.animate !== "function") return LEER_ANIMATION;
  const vorher = laufend?.get(el);
  if (vorher && vorher.playState !== "finished") vorher.cancel();
  let anim;
  if (reduziert()) {
    const nur = nurOpazitaet(keyframes);
    if (!nur) return LEER_ANIMATION;
    anim = el.animate(nur, { ...opts, duration: Math.min(opts.duration ?? DAUER.fast, DAUER.fast), delay: 0, easing: "linear" });
  } else {
    anim = el.animate(keyframes, { ...opts, easing: kurve(opts.easing) });
  }
  laufend?.set(el, anim);
  // finished verwirft bei cancel(); für await-Aufrufer ruhig auflösen.
  const finished = anim.finished.then(
    () => undefined,
    () => undefined
  );
  return { finished, cancel: () => anim.cancel(), finish: () => anim.finish(), animation: anim };
}

/**
 * Verschwinden vor dem Entfernen (3.3): erst Opazität (0–100 ms), dann Höhe (100–200 ms).
 * Bei „reduce“ nur Opazität 120 ms; Nachbarn springen danach (akzeptiert).
 * Verwendung: await abgang(zeile); setListe((l) => l.filter(…)); danach Fokus auf die nächste.
 */
export async function abgang(el, opt = {}) {
  if (!el) return;
  const ms = opt.dauer ?? DAUER.move;
  if (reduziert()) {
    await animiere(el, [{ opacity: 1 }, { opacity: 0 }], { duration: DAUER.fast, fill: "forwards" }).finished;
    return;
  }
  const h = el.getBoundingClientRect().height;
  el.style.overflow = "hidden";
  await animiere(
    el,
    [
      { opacity: 1, height: `${h}px`, offset: 0 },
      { opacity: 0, height: `${h}px`, offset: 0.5 },
      { opacity: 0, height: "0px", paddingTop: "0px", paddingBottom: "0px", marginTop: "0px", marginBottom: "0px", offset: 1 },
    ],
    { duration: ms, easing: "ein", fill: "forwards" }
  ).finished;
}

/**
 * Eintritt eines Elements, das per JS erscheint (Lounge lg-rise): Opazität 0 → 1, 12 px von unten
 * und scale .985 → 1 mit sanfter Feder (700 ms). `versatz: 0` = reine Blende.
 */
export function eintritt(el, opt = {}) {
  const v = opt.versatz ?? 12;
  const kf = v ? [{ opacity: 0, transform: `translateY(${v}px) scale(0.985)` }, { opacity: 1, transform: "none" }] : [{ opacity: 0 }, { opacity: 1 }];
  return animiere(el, kf, { duration: opt.dauer ?? DAUER.erscheinen, delay: opt.verzoegerung ?? 0, easing: v ? "feder-sanft" : "aus", fill: "backwards" });
}

/** Position merken (erster Schritt von FLIP). */
export function merke(el) {
  return el?.getBoundingClientRect?.() ?? null;
}

/**
 * Verschiebung zwischen zwei Rechtecken (reine Rechnung, testbar): Versatz, der das Element
 * optisch an die alte Stelle zurücksetzt.
 */
export function versatz(vorher, nachher) {
  if (!vorher || !nachher) return { dx: 0, dy: 0, sx: 1, sy: 1 };
  return {
    dx: vorher.left - nachher.left,
    dy: vorher.top - nachher.top,
    sx: nachher.width ? vorher.width / nachher.width : 1,
    sy: nachher.height ? vorher.height / nachher.height : 1,
  };
}

/**
 * FLIP: Element steht schon an der neuen Stelle (DOM/State geändert); es startet optisch an
 * `vorher` (aus merke()) und gleitet an seinen Platz. Standard 200 ms ease-out; `feder: true`
 * für Umsortieren/Ablegen (420 ms FEDER, ohne linear() 240 ms Ersatzkurve).
 * @param {Element} el
 * @param {DOMRect} vorher
 * @param {{dauer?: number, easing?: string, feder?: boolean, skalieren?: boolean}} [opt]
 */
export function flip(el, vorher, opt = {}) {
  if (!el || !vorher) return LEER_ANIMATION;
  const v = versatz(vorher, el.getBoundingClientRect());
  if (Math.abs(v.dx) < 0.5 && Math.abs(v.dy) < 0.5) return LEER_ANIMATION;
  const skal = opt.skalieren ? ` scale(${v.sx}, ${v.sy})` : "";
  const feder = !!opt.feder;
  const springOk = springVerfuegbar();
  return animiere(el, [{ transform: `translate(${v.dx}px, ${v.dy}px)${skal}`, transformOrigin: "top left" }, { transform: "none", transformOrigin: "top left" }], {
    duration: opt.dauer ?? (feder ? (springOk ? DAUER.federKurz : DAUER.slow) : DAUER.move),
    easing: opt.easing ?? (feder ? "feder" : "aus"),
  });
}

/**
 * Kanban-Ablage (3.4): Geist fliegt vom Loslasspunkt in den Zielslot und wird danach entfernt.
 * Gültig: Feder 420 ms (Ersatz 240 ms), scale 1.02 → 1, rotate → 0. Ungültig/Abbruch/Fehler:
 * 200 ms ease-out zurück zum Ursprung, ohne Feder. Bei „reduce“ verschwindet der Geist sofort.
 * @param {HTMLElement} geist  position: fixed (Klasse bo-kanban-geist), left/top 0
 * @param {Element} zielEl    Slot (gültig) bzw. Ursprungskarte (ungültig)
 * @param {{gueltig?: boolean}} [opt]
 */
export async function lande(geist, zielEl, opt = {}) {
  if (!geist) return;
  const gueltig = opt.gueltig !== false;
  try {
    if (!zielEl || reduziert()) return;
    const a = geist.getBoundingClientRect();
    const b = zielEl.getBoundingClientRect();
    const springOk = springVerfuegbar();
    const vonTf = `translate(${a.left}px, ${a.top}px) scale(1.02) rotate(${gueltig ? 0.6 : 0}deg)`;
    const nachTf = `translate(${b.left}px, ${b.top}px) scale(1) rotate(0deg)`;
    await animiere(geist, [{ transform: vonTf }, { transform: nachTf }], {
      duration: gueltig ? (springOk ? DAUER.federKurz : DAUER.slow) : DAUER.move,
      easing: gueltig ? "feder" : "aus",
      fill: "forwards",
    }).finished;
  } finally {
    geist.remove();
  }
}

/**
 * Zahl zählen (Lounge § 8, 04 § 3.7): von `von` nach `nach`, ausklingend (quartisch wie im
 * Entwurf). Standard 520 ms; beim Erscheinen nimmt useHochzaehlen 900 ms.
 * Ruft onWert mit gerundeten Zwischenwerten (`dez` Nachkommastellen), am Ende genau mit `nach`.
 * Bei „reduce“, gleichem Wert, Nicht-Zahlen oder Sprung über `direktAb` sofort der Endwert.
 * Rückgabe: Abbruch-Funktion (für useEffect-Cleanup). Die Kassa-Summe zählt nie (Q-H4).
 */
export function zaehle(von, nach, onWert, opt = {}) {
  const ms = opt.dauer ?? DAUER.draw;
  const dez = opt.dez ?? 0;
  const direkt =
    typeof von !== "number" ||
    typeof nach !== "number" ||
    !Number.isFinite(von) ||
    !Number.isFinite(nach) ||
    von === nach ||
    reduziert() ||
    typeof requestAnimationFrame !== "function" ||
    (opt.direktAb != null && Math.abs(nach - von) >= opt.direktAb);
  if (direkt) {
    onWert(nach);
    return () => {};
  }
  const start = performance.now();
  let raf = 0;
  const tick = (jetzt) => {
    const t = Math.min(1, (jetzt - start) / ms);
    onWert(t >= 1 ? nach : zwischenwert(von, nach, t, dez));
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

/** Zwischenwert mit ausklingender Kurve (quartisch), auf `dez` Stellen gerundet – reine Rechnung. */
export function zwischenwert(von, nach, t, dez = 0) {
  const k = Math.max(0, Math.min(1, t));
  const e = 1 - Math.pow(1 - k, 4);
  const f = Math.pow(10, Math.max(0, Math.min(4, dez | 0)));
  return Math.round((von + (nach - von) * e) * f) / f;
}

/**
 * Hervorhebung „das ist deine Zeile“ (3.3, 3.12 Doppel-Scan, Packtisch „Gerade +1“): Fläche in
 * Akzent-, Warn- bzw. Salbeiton, 1200 ms abklingend. Startet bei wiederholtem Aufruf neu.
 * Element braucht Klasse bo-row oder bo-markierbar. `ton`: "akzent" | "warn" | "ok".
 */
export function markiere(el, opt = {}) {
  if (!el) return;
  el.removeAttribute("data-markiert");
  void el.offsetWidth; // Animation neu starten
  el.setAttribute("data-markiert", opt.ton === "warn" ? "warn" : opt.ton === "ok" ? "ok" : "true");
  if (opt.scrollen !== false) el.scrollIntoView?.({ block: "nearest" });
  const ms = 200 + DAUER.markiert + 50;
  clearTimeout(el.__boMarkiert);
  el.__boMarkiert = setTimeout(() => el.removeAttribute("data-markiert"), ms);
}

// ------------------------------------------------------------- Hooks und kleine Bausteine

const keinAbo = () => () => {};
const aboReduziert = (cb) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const nieReduziert = () => false;
const immer = () => true;
const nie = () => false;

/** „Bewegung reduzieren“ als Zustand (folgt Änderungen der Systemeinstellung; Server: false). */
export function useReduziert() {
  return useSyncExternalStore(aboReduziert, reduziert, nieReduziert);
}

/**
 * true, wenn die Komponente auf dem Client frisch erscheint (Navigation, nachgeladen);
 * false beim ersten Render während der Hydration. So zählt eine Zahl nach einer In-App-
 * Navigation sichtbar hoch, ein hart geladener Server-Erstzustand springt aber nie (Q-H4).
 */
function useFrischAufClient() {
  return useSyncExternalStore(keinAbo, immer, nie);
}

/**
 * Angezeigter Wert einer Zahl, die beim Erscheinen von 0 hochzählt (Lounge § 8: 900 ms) und bei
 * jeder späteren Änderung vom alten Wert weiterzählt (520 ms).
 * @param {number} wert Endwert
 * @param {{beimErscheinen?: boolean, kiosk?: boolean, dez?: number, dauer?: number, direktAb?: number}} [opt]
 *   kiosk: nie zählen (Kassa-Summe, Q-H4); beimErscheinen: false = nur bei Änderung zählen.
 */
export function useHochzaehlen(wert, opt = {}) {
  const frisch = useFrischAufClient();
  const { beimErscheinen = true, kiosk = false, dez = 0, dauer: ms, direktAb } = opt;
  const [start] = useState(() => (beimErscheinen && frisch && !kiosk && !reduziert() && Number.isFinite(wert) ? 0 : wert));
  const [anzeige, setAnzeige] = useState(start);
  const vorher = useRef(start);
  const erstes = useRef(true);
  useEffect(() => {
    const von = vorher.current;
    vorher.current = wert;
    const d = ms ?? (erstes.current ? DAUER.zaehlen : DAUER.draw);
    erstes.current = false;
    return zaehle(kiosk ? wert : von, wert, setAnzeige, { dauer: d, dez, direktAb });
  }, [wert, kiosk, dez, ms, direktAb]);
  return anzeige;
}

/**
 * Zahl mit Hochzählen (Lounge-Kennzahl). Tabellenziffern; Screenreader hören nur den Endwert.
 * Aus Server-Komponenten nutzbar (nur serialisierbare Props).
 * @param {{wert:number, dez?:number, prefix?:string, suffix?:string, waehrung?:boolean, beimErscheinen?:boolean, kiosk?:boolean, className?:string}} props
 */
export function ZahlHoch({ wert, dez = 0, prefix = "", suffix = "", waehrung = false, beimErscheinen = true, kiosk = false, className }) {
  const anzeige = useHochzaehlen(wert, { beimErscheinen, kiosk, dez });
  const fmt = (v) =>
    prefix +
    (waehrung
      ? v.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: dez, maximumFractionDigits: dez })
      : v.toLocaleString("de-DE", { minimumFractionDigits: dez, maximumFractionDigits: dez })) +
    suffix;
  const zahl = Number.isFinite(wert);
  return (
    <span className={className} data-bo-zahl-hoch="">
      <span className="tabular-nums" aria-hidden="true">
        {zahl ? fmt(anzeige) : "–"}
      </span>
      <span className="sr-only">{zahl ? fmt(wert) : "–"}</span>
    </span>
  );
}

const AKTIV = '[aria-checked="true"], [aria-selected="true"], [aria-current="page"], [aria-pressed="true"], [data-aktiv="true"]';

/**
 * Gleitender Indikator (Segmented Control, Pillen-Reiter): misst das aktive Kind im Container
 * und liefert Props für das Indikator-Element (Klasse bo-gleiter). Der erste Stand erscheint
 * ohne Gleiten, danach gleitet er mit Feder (transform + Breite). Misst bei Größenänderung neu.
 * Verwendung: const { ref, indikator } = useGleiter(wert);
 *   <div ref={ref} className="relative …">{indikator && <span {...indikator} className={cx(indikator.className, "absolute left-0 top-0 …")} />}…</div>
 * @param {*} schluessel aktiver Wert (Abhängigkeit)
 * @param {{selektor?: string}} [opt]
 */
export function useGleiter(schluessel, opt = {}) {
  const ref = useRef(null);
  const selektor = opt.selektor ?? AKTIV;
  const [mass, setMass] = useState(null);
  const messen = useCallback(() => {
    const el = ref.current?.querySelector(selektor);
    const neu = el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null;
    setMass((m) => (m && neu && m.x === neu.x && m.y === neu.y && m.w === neu.w && m.h === neu.h ? m : neu));
  }, [selektor]);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return undefined;
    const raf = requestAnimationFrame(messen);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => messen());
    ro?.observe(box);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [messen, schluessel]);
  // Nach dem ersten gemessenen Stand das Gleiten freischalten (ein Bild später).
  const [bereit, setBereit] = useState(false);
  useEffect(() => {
    if (!mass || bereit) return undefined;
    const raf = requestAnimationFrame(() => setBereit(true));
    return () => cancelAnimationFrame(raf);
  }, [mass, bereit]);
  const indikator = mass
    ? {
        className: "bo-gleiter",
        "aria-hidden": true,
        "data-bo-bereit": bereit ? "" : undefined,
        style: { transform: `translate(${mass.x}px, ${mass.y}px)`, width: mass.w, height: mass.h },
      }
    : null;
  return { ref, indikator };
}

/**
 * Häkchen, das sich nach 220 ms in 520 ms zeichnet (Lounge Erfolgsmoment / Bezahlt-Sheet).
 * Startet beim Einfügen ins DOM; bei „reduce“ steht es sofort. Neu zeichnen: key ändern.
 */
export function Haken({ groesse = 24, strich = 2.25, className, titel }) {
  return (
    <svg
      className={className ? `bo-tick ${className}` : "bo-tick"}
      viewBox="0 0 24 24"
      width={groesse}
      height={groesse}
      fill="none"
      role={titel ? "img" : undefined}
      aria-label={titel}
      aria-hidden={titel ? undefined : true}
    >
      <path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth={strich} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ------------------------------------------------------------- View Transitions

let zurueckBeobachtet = false;

/** Browser-Zurück/Vor ohne Übergang (04 § 3.1.2): Merker am <html> bis zur nächsten Eingabe. */
function beobachteZurueck() {
  if (zurueckBeobachtet || typeof window === "undefined") return;
  zurueckBeobachtet = true;
  const html = document.documentElement;
  window.addEventListener("popstate", () => html.setAttribute("data-bo-nav", "zurueck"));
  const loesche = () => html.removeAttribute("data-bo-nav");
  window.addEventListener("pointerdown", loesche, { capture: true, passive: true });
  window.addEventListener("keydown", loesche, { capture: true, passive: true });
}

/**
 * Seitenwechsel (3.1): um den Seiteninhalt INNERHALB der Shell legen (nicht ins Layout –
 * Layouts bleiben bei Navigation stehen, dort feuert enter/exit nie). Alt 120 ms Blende,
 * neu 12 px + scale .995 mit sanfter Feder; router.refresh(), Filterwechsel (gleiche Route) und
 * Browser-Zurück animieren nicht. Nicht im Kiosk verwenden (Q-H7).
 */
export function SeitenUebergang({ children }) {
  useEffect(beobachteZurueck, []);
  return (
    <ViewTransition enter="bo-seite" exit="bo-seite" default="none">
      <div className="min-w-0" data-bo-seite="">
        {children}
      </div>
    </ViewTransition>
  );
}

/** Suspense-Fallback, der beim Erscheinen der Daten ausblendet (3.9). */
export function SkelettHuelle({ children }) {
  return (
    <ViewTransition exit="bo-skelett" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

/** Inhalt hinter Suspense, der einblendet (ohne Versatz: Geometrie ist gleich). */
export function InhaltHuelle({ children }) {
  return (
    <ViewTransition enter="bo-inhalt" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

/**
 * Gleicher Ort, anderer Inhalt (Reiter, Zeitraum-Chips): Crossfade. `schluessel` ist der
 * Inhaltsschlüssel (z. B. aktiver Reiter); `name` muss je Seite eindeutig sein. Wirkt nur, wenn
 * der Wechsel in einer Transition passiert (Navigation, startTransition).
 */
export function Wechsel({ schluessel, name, children }) {
  return (
    <ViewTransition key={schluessel} name={name} share="bo-wechsel" enter="bo-wechsel" exit="bo-wechsel" default="none">
      <div className="min-w-0">{children}</div>
    </ViewTransition>
  );
}
