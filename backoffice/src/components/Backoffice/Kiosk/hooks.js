"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SCAN_ABSTAND_MS, SCAN_MIN_LAENGE, erstelleScanErkenner } from "../Eingabe/scan";
import { idlePhase, istPhysischeTaste } from "./logik";

// Hooks der Kiosk-Arbeitsplätze (Kassa, Packtisch, Montage, Technik).
// Inhalt der Arbeitsplätze bauen die Fachbereichs-Agenten; diese Hooks sind das
// gemeinsame Fundament (Entscheidung Nr. 49).

/**
 * Tastenkürzel-Registry. kuerzel: { "F2": fn, "ctrl+p": fn, "escape": fn }.
 * Wird in Eingabefeldern ignoriert, außer die Kombination beginnt mit "F" (Funktionstasten).
 */
export function useTastenkuerzel(kuerzel, aktiv = true) {
  const ref = useRef(kuerzel);
  useEffect(() => {
    ref.current = kuerzel;
  });
  useEffect(() => {
    if (!aktiv) return;
    const h = (e) => {
      const teile = [];
      if (e.ctrlKey || e.metaKey) teile.push("ctrl");
      if (e.altKey) teile.push("alt");
      if (e.shiftKey) teile.push("shift");
      teile.push(e.key.toLowerCase());
      const key = teile.join("+");
      const fn = ref.current[key] || ref.current[e.key] || ref.current[e.key.toLowerCase()];
      if (!fn) return;
      const inEingabe = /^(input|textarea|select)$/i.test(e.target?.tagName || "") || e.target?.isContentEditable;
      if (inEingabe && !/^f\d+$/i.test(e.key)) return;
      e.preventDefault();
      fn(e);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [aktiv]);
}

/**
 * Scanner-Eingabe (Tastatur-Wedge): schnelle Zeichenfolge (≥ 4 Zeichen, Abstand < 30 ms, G-22)
 * gefolgt von Enter → onScan(code). Normale Tipp-Eingaben werden nicht als Scan gewertet.
 * Unterbau für einfache Fälle – Seiten nutzen `ScanTor` (Eingabe/ScanTor.js), das Felder mit
 * `data-scan` beachtet und Kürzel unterdrückt. KioskShell bindet ScanTor selbst ein.
 */
export function useScanner(onScan, { minLaenge = SCAN_MIN_LAENGE, maxAbstandMs = SCAN_ABSTAND_MS, aktiv = true } = {}) {
  const cb = useRef(onScan);
  useEffect(() => {
    cb.current = onScan;
  });
  useEffect(() => {
    if (!aktiv) return;
    const erkenner = erstelleScanErkenner({ maxAbstand: maxAbstandMs, minLaenge });
    const h = (e) => {
      const r = erkenner.taste(e.key, performance.now());
      if (r.art === "scan") {
        e.preventDefault();
        cb.current?.(r.code);
      }
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [aktiv, minLaenge, maxAbstandMs]);
}

/**
 * Ghost-Tap-Schutz (Q-J5): nach jedem Wechsel von `schluessel` ist der Primärknopf `ms` gesperrt.
 * @returns {boolean} gesperrt
 */
export function useEingabesperre(schluessel, ms = 300) {
  const [stand, setStand] = useState({ schluessel, gesperrt: false });
  // Muster „Wert aus dem vorigen Rendern“: Wechsel sperrt sofort im selben Rendern (kein Flackern).
  if (stand.schluessel !== schluessel) setStand({ schluessel, gesperrt: true });
  useEffect(() => {
    if (!stand.gesperrt) return;
    const t = setTimeout(() => setStand((s) => (s.schluessel === stand.schluessel ? { ...s, gesperrt: false } : s)), ms);
    return () => clearTimeout(t);
  }, [stand, ms]);
  return stand.gesperrt;
}

/**
 * Physische Tastatur erkannt? Setzt `data-tastatur="ja"` am Element (Standard <html>), sobald eine echte
 * Taste (F-Tasten, Pfeile, Tab, Esc, Strg/Alt) gedrückt wurde; bei Berührung wieder „nein“.
 * `<kbd>`-Hinweise zeigen sich nur mit „ja“ (Q-F7).
 */
export function useTastatur(ziel) {
  const [an, setAn] = useState(false);
  useEffect(() => {
    const el = ziel?.current || document.documentElement;
    const setze = (wert) => {
      setAn(wert);
      el.setAttribute("data-tastatur", wert ? "ja" : "nein");
    };
    const taste = (e) => istPhysischeTaste(e) && setze(true);
    const beruehrung = (e) => e.pointerType === "touch" && setze(false);
    window.addEventListener("keydown", taste, true);
    window.addEventListener("pointerdown", beruehrung, true);
    return () => {
      window.removeEventListener("keydown", taste, true);
      window.removeEventListener("pointerdown", beruehrung, true);
    };
  }, [ziel]);
  return an;
}

/**
 * Idle-Erkennung (Q-E5, Q-J2): Zeiger, Tasten, Berührung und Scroll zählen als Bedienung.
 * @returns {{phase:"aktiv"|"warnung"|"gesperrt", rest:number, weiter:()=>void}}
 */
export function useIdle({ idleMs = 15 * 60_000, warnMs = 30_000, aktiv = true } = {}) {
  const letzte = useRef(0);
  const [stand, setStand] = useState({ phase: "aktiv", rest: Math.ceil(idleMs / 1000) });
  const weiter = useCallback(() => {
    letzte.current = Date.now();
    setStand((s) => (s.phase === "aktiv" ? s : { phase: "aktiv", rest: Math.ceil(idleMs / 1000) }));
  }, [idleMs]);
  useEffect(() => {
    if (!aktiv) return;
    letzte.current = Date.now();
    const bedient = () => {
      letzte.current = Date.now();
    };
    const arten = ["pointerdown", "keydown", "wheel", "touchstart"];
    for (const a of arten) window.addEventListener(a, bedient, { capture: true, passive: true });
    const t = setInterval(() => {
      const p = idlePhase(Date.now() - letzte.current, { idleMs, warnMs });
      setStand((s) => (s.phase === p.phase && (p.phase !== "warnung" || s.rest === p.rest) ? s : p));
    }, 1000);
    return () => {
      clearInterval(t);
      for (const a of arten) window.removeEventListener(a, bedient, { capture: true });
    };
  }, [aktiv, idleMs, warnMs]);
  return { ...stand, weiter };
}

const ohneAbo = () => () => {};

/**
 * Vollbild-API (Fullscreen), mit Zustand. `verfuegbar` ist auf dem Server und beim
 * Hydrieren false (gleiches HTML) und wird erst danach aus dem Browser gelesen –
 * vorher führte `typeof document` hier zum Hydration-Fehler der Kiosk-Seiten.
 */
export function useVollbild() {
  const [an, setAn] = useState(false);
  const verfuegbar = useSyncExternalStore(ohneAbo, () => !!document.documentElement?.requestFullscreen, () => false);
  useEffect(() => {
    const h = () => setAn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    h();
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const umschalten = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // iPad Safari ohne Fullscreen-API: still bleiben
    }
  }, []);
  return { an, umschalten, verfuegbar };
}

/** Verbindungsstatus (navigator.onLine + periodischer Ping auf /api/ping). */
export function useVerbindung({ intervallMs = 30000 } = {}) {
  const [online, setOnline] = useState(true);
  const [serverOk, setServerOk] = useState(true);
  useEffect(() => {
    const setze = () => setOnline(navigator.onLine);
    setze();
    window.addEventListener("online", setze);
    window.addEventListener("offline", setze);
    let aktiv = true;
    const ping = async () => {
      try {
        const r = await fetch("/api/ping", { cache: "no-store", signal: AbortSignal.timeout(4000) });
        if (aktiv) setServerOk(r.ok);
      } catch {
        if (aktiv) setServerOk(false);
      }
    };
    ping();
    const t = setInterval(ping, intervallMs);
    return () => {
      aktiv = false;
      clearInterval(t);
      window.removeEventListener("online", setze);
      window.removeEventListener("offline", setze);
    };
  }, [intervallMs]);
  return { online: online && serverOk, browserOnline: online, serverOk };
}

/**
 * Druck-Hook: heute window.print() (CSS @media print), später Druckdienst
 * (Bon-/Etikettendrucker). drucke(ziel?) – ziel bleibt reserviert für den Dienst.
 */
export function useDruck() {
  return useCallback((ziel) => {
    void ziel;
    window.print();
  }, []);
}

/**
 * Uhr (HH:MM, de-AT). Erst nach dem Einhängen gesetzt: Server und erste Client-Darstellung
 * liefern "" (kein Hydration-Unterschied), danach jede Sekunde neu.
 * @returns {{text:string, iso:string}}
 */
export function useUhr() {
  const [zeit, setZeit] = useState({ text: "", iso: "" });
  useEffect(() => {
    const f = () => {
      const d = new Date();
      const text = d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
      setZeit((alt) => (alt.text === text ? alt : { text, iso: d.toISOString() }));
    };
    f();
    const t = setInterval(f, 1000);
    return () => clearInterval(t);
  }, []);
  return zeit;
}

/**
 * Lebenszeichen des registrierten Geräts (POST /api/geraet/ping → ph_core touch_device),
 * sofort und dann alle `intervallMs` (Standard 5 min). Nur aktiv, wenn ein Gerät registriert ist.
 * @returns {{gesperrt:boolean}}
 */
export function useLebenszeichen(aktiv, { intervallMs = 5 * 60_000 } = {}) {
  const [gesperrt, setGesperrt] = useState(false);
  useEffect(() => {
    if (!aktiv) return;
    let lebt = true;
    const ping = async () => {
      try {
        const r = await fetch("/api/geraet/ping", { method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000) });
        const d = await r.json().catch(() => ({}));
        if (lebt) setGesperrt(!!d.gesperrt);
      } catch {
        // Netzfehler: useVerbindung zeigt den Zustand an.
      }
    };
    ping();
    const t = setInterval(ping, intervallMs);
    return () => {
      lebt = false;
      clearInterval(t);
    };
  }, [aktiv, intervallMs]);
  return { gesperrt };
}
