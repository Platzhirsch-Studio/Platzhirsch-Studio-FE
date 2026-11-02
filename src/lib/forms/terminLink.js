// src/lib/forms/terminLink.js
// Rat 9,5 B1 (UX1): EIN Terminweg mit zwei klaren Wörtern.
//   Primär  „Termin wählen“   → /termin   (nur solange der eigene Online-Kalender
//                                           läuft: ownCalendarActive(), Booking/config.js)
//   Neben   „Lieber schreiben“ → /beratung (das 4-Schritt-Anfrageformular)
// Ohne Kalender gibt es nur einen Weg: „Termin anfragen“ → /beratung.
// Der Seitenkontext (thema, planer, ort, produkt …) läuft auf beiden Wegen mit
// (withContext, pathContext.js); /termin und /beratung lesen ihn.
//
// Regel für alle Seiten (E2E tests/e2e/rat95-t1-terminweg.spec.js): dasselbe
// Linkwort führt nie zu zwei Zielen. Darum hängt das Wort am Ziel, nicht an
// der Stelle: wer terminHref() nutzt, nimmt auch terminLabel().
//
// Für andere Teams (Landing/parts.js, Produktseite, Startseite):
//   import { terminHref, terminLabel } from "@/lib/forms/terminLink";
//   const calendar = ownCalendarActive();            // Server, Booking/config.js
//   <Button href={terminHref(locale, { calendar, context: { thema: "hotel" } })}>
//     {terminLabel(locale, { calendar })}
//   </Button>
//   Nebenweg: <LinkArrow href={schreibenHref(locale, { context })}>{terminLabel(locale, { kind: "write" })}</LinkArrow>
//
// Klein und rein (keine "@/..."-Importe, kein node:*): liegt im Shell-Graph
// (HeaderCta, MobileCtaBar) und wird mit node --test geprüft.
// Texte: Vorschlag Marktresearch/digital/features/rat95-t1-messages.json
// (Shell.terminWords.*); bis zur Übernahme gilt die Tabelle hier.
import { withContext } from "./pathContext.js";

export const BERATUNG_PATHS = Object.freeze({ de: "/beratung", en: "/consultation", fr: "/conseil", it: "/consulenza" });
export const TERMIN_PATH = "/termin";

export const TERMIN_WORDS = Object.freeze({
  de: { choose: "Termin wählen", request: "Termin anfragen", write: "Lieber schreiben", short: "Termin" },
  en: { choose: "Book a visit", request: "Request a visit", write: "Prefer to write", short: "Visit" },
  fr: { choose: "Réserver un rendez-vous", request: "Demander un rendez-vous", write: "Plutôt écrire", short: "Rendez-vous" },
  it: { choose: "Prenotate un appuntamento", request: "Richiedete un appuntamento", write: "Preferite scrivere", short: "Appuntamento" },
});

const words = (locale) => TERMIN_WORDS[locale] || TERMIN_WORDS.de;

/** Beratungsseite der Sprache ("/consultation" …), ohne Locale-Präfix. */
export function beratungPath(locale) {
  return BERATUNG_PATHS[locale] || BERATUNG_PATHS.de;
}

/** Ziel des Termin-Knopfs: /termin mit Kalender, sonst die Beratungsseite; Kontext immer dabei. */
export function terminHref(locale, { calendar = false, context = {} } = {}) {
  return withContext(calendar ? TERMIN_PATH : beratungPath(locale), context);
}

/** Ziel des Nebenwegs „Lieber schreiben“ (immer das Anfrageformular). */
export function schreibenHref(locale, { context = {} } = {}) {
  return withContext(beratungPath(locale), context);
}

/**
 * Wort zum Ziel. kind: "button" (Standard) → „Termin wählen“ mit Kalender,
 * „Termin anfragen“ ohne; "write" → „Lieber schreiben“; "short" → „Termin“
 * (Kopfzeile, Ziel wie "button").
 */
export function terminLabel(locale, { calendar = false, kind = "button" } = {}) {
  const w = words(locale);
  if (kind === "write") return w.write;
  if (kind === "short") return w.short;
  return calendar ? w.choose : w.request;
}

/** true, wenn ein Termin-Link auf den Kalender zeigt ("/termin", "/de/termin?thema=…"). */
export function isCalendarHref(href) {
  return /^(?:\/(?:de|en|fr|it))?\/termin(?:[/?#]|$)/.test(String(href || ""));
}
