// Sofaplaner – Typografie für FR/IT (Sprachen-Welle FR/IT, 01.11.2026).
// Gleiche Regeln wie src/lib/hotel/content-intl.js frenchSpacing(), hier als
// eigenes kleines Modul, damit der Planer-Chunk nicht die Hotel-Inhalte lädt.
// Im Quelltext stehen normale Leerzeichen; die Wörterbücher setzen beim Laden
// schmale geschützte Leerzeichen vor ; ! ? und geschützte vor : und in « ».
// Reines Modul, node --test.

const NNBSP = " ";
const NBSP = " ";

/** Französische Leerzeichen-Regeln auf einen String. */
export function frenchSpacing(text) {
  return String(text)
    .replace(/ ([;!?])/g, `${NNBSP}$1`)
    .replace(/ :(?=\s|$)/g, `${NBSP}:`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/ »/g, `${NBSP}»`);
}

/** frenchSpacing() auf alle Strings eines Objekts/Arrays (Kopie; Funktionen und RegExp bleiben). */
export function frenchTypography(value) {
  if (typeof value === "string") return frenchSpacing(value);
  if (Array.isArray(value)) return value.map(frenchTypography);
  if (value && typeof value === "object" && !(value instanceof RegExp)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, frenchTypography(v)]));
  return value;
}

/** Funktion, deren Ergebnis französisch gesetzt wird. */
export const frenchFn = (fn) => (...a) => frenchSpacing(fn(...a));
