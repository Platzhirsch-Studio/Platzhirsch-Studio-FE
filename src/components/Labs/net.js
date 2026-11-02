// Netzwerk-Hilfen für Labs-Clientcode (R4-portal-labs, Fehlerfälle).
// fetchWithTimeout: bricht nach `ms` ab (Zeitüberschreitung) und verbindet ein
// vorhandenes AbortSignal (Nutzer bricht ab). netErrorText: deutsche Meldung
// statt "Failed to fetch" / "Load failed" aus dem Browser.
// R5: Texte über Labs.net.* (netTexts(t)), Fallback die deutschen Texte hier.
import { tx } from "../../lib/portal/i18n.js";

export class LabsTimeoutError extends Error {
  constructor() {
    super(TIMEOUT_TEXT);
    this.name = "LabsTimeoutError";
  }
}

export const OFFLINE_TEXT = "Keine Internetverbindung. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.";
export const TIMEOUT_TEXT = "Die Antwort hat zu lange gedauert. Bitte versuchen Sie es noch einmal.";

/** Meldungen aus Labs.net.* (next-intl `t` ohne Namensraum); fehlt ein Schlüssel, bleibt der DE-Text. */
export function netTexts(t) {
  return {
    timeout: tx(t, "Labs.net.timeout", TIMEOUT_TEXT),
    offline: tx(t, "Labs.net.offline", OFFLINE_TEXT),
  };
}

/** fetch mit Zeitlimit. Wirft LabsTimeoutError bei Zeitüberschreitung, AbortError bei Abbruch durch `signal`. */
export async function fetchWithTimeout(url, { signal, ...opts } = {}, ms = 20000) {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, ms);
  const onAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (e) {
    if (timedOut) throw new LabsTimeoutError();
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.("abort", onAbort);
  }
}

/**
 * Verständliche Meldung für einen Fehler aus fetch/Response-Verarbeitung.
 * @param {{ timeout?: string, offline?: string }} [texts] aus netTexts(t); ohne: DE-Texte
 */
export function netErrorText(e, fallback, texts = {}) {
  const offline = texts.offline || OFFLINE_TEXT;
  if (e instanceof LabsTimeoutError) return texts.timeout || e.message;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return offline;
  // Netzwerkfehler der Browser: TypeError mit englischem Text.
  if (e instanceof TypeError || /failed to fetch|load failed|networkerror/i.test(e?.message || "")) return offline;
  // JSON-Fehler (z. B. HTML-Fehlerseite statt JSON) → allgemeine Meldung.
  if (e instanceof SyntaxError) return fallback;
  return e?.message || fallback;
}
