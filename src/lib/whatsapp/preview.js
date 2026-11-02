// src/lib/whatsapp/preview.js – Dev-Vorschau der WhatsApp-Einstiege (Browser).
//
// Nur wenn der Server `devPreview` meldet (NODE_ENV=development und keine
// WHATSAPP_NUMBER, src/lib/whatsapp/config.js entryProps): ?whatsapp=test
// schaltet die fiktive Testnummer für diese Sitzung ein, ?whatsapp=off aus.
// sessionStorage nur als Komfort (try/catch), im Produktions-Build nie aktiv.
//
// devPreviewActive() ist rein lesend (Schnappschuss von useSyncExternalStore);
// das Merken in sessionStorage macht persistDevPreview() in einem Effekt.
import { DEV_TEST_NUMBER, parseNumber } from "./config.js";

export const PREVIEW_KEY = "ph-whatsapp-preview";
export const PREVIEW_EVENT = "ph-whatsapp-preview";

const currentSearch = () => (typeof window !== "undefined" ? window.location.search : "");

function queryFlag(search) {
  try {
    return new URLSearchParams(search).get("whatsapp");
  } catch {
    return null;
  }
}

/** Liest ?whatsapp= und den Sitzungsschalter – ohne zu schreiben. */
export function devPreviewActive(search = currentSearch()) {
  const q = queryFlag(search);
  if (q === "test") return true;
  if (q === "off") return false;
  try {
    return window.sessionStorage.getItem(PREVIEW_KEY) === "1";
  } catch {
    return false;
  }
}

/** Merkt ?whatsapp=test bzw. ?whatsapp=off für die Sitzung (nur im Effekt aufrufen). */
export function persistDevPreview(search = currentSearch()) {
  const q = queryFlag(search);
  try {
    if (q === "test") window.sessionStorage.setItem(PREVIEW_KEY, "1");
    if (q === "off") window.sessionStorage.removeItem(PREVIEW_KEY);
  } catch {
    // privates Fenster / blockierter Speicher: Vorschau gilt dann nur mit ?whatsapp=test
  }
}

/** Ziffern der Testnummer. */
export const DEV_TEST_DIGITS = parseNumber(DEV_TEST_NUMBER).digits;
