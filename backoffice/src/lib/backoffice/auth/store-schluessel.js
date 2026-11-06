// Gemeinsame Regeln für die Schlüssel und Fristen der allgemeinen Store-Werte (store.js, store-redis.js).
// Eigene Datei, damit beide Umsetzungen sie ohne Importkreis nutzen. Reines Modul.

/** Geräte-Cache: so lange bleibt ein geprüftes Gerät höchstens im Store (= GERAET_STALE_MS in geraet.js). */
export const GERAET_CACHE_TTL_SECONDS = 12 * 60 * 60;

/** Erlaubte Schlüssel der Werte-Methoden: Namensraum, Doppelpunkt, Rest (ohne Leer- und Steuerzeichen). */
const WERT_SCHLUESSEL = /^[a-z]{1,12}:[\w.:@%+=-]{1,200}$/i;
const PRAEFIX = /^[a-z]{1,12}:[\w.:@%+=-]{0,200}$/i;

export function pruefeWertSchluessel(schluessel) {
  if (typeof schluessel !== "string" || !WERT_SCHLUESSEL.test(schluessel)) throw new TypeError(`Ungültiger Store-Schlüssel: ${String(schluessel).slice(0, 40)}`);
  return schluessel;
}

/** Präfix für schluesselListe(): Namensraum + optionaler Anfang. */
export function pruefePraefix(praefix) {
  if (typeof praefix !== "string" || !PRAEFIX.test(praefix)) throw new TypeError(`Ungültiges Store-Präfix: ${String(praefix).slice(0, 40)}`);
  return praefix;
}

/** ttlSekunden → ganze Sekunden ≥ 1, oder 0 (= ohne Ablauf). */
export function ttlNormal(ttlSekunden) {
  const n = Math.floor(Number(ttlSekunden) || 0);
  return n > 0 ? n : 0;
}
