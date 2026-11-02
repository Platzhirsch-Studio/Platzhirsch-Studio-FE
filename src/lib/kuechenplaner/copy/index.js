// src/lib/kuechenplaner/copy/index.js – Wörterbücher des Küchenplaners je Sprache.
//
// Nur auf dem Server laden (Seite, Druckansicht, Tests): Die Tabellen enthalten
// alle Sprachen. An den Client geht ausschließlich kpClientCopy(locale) – das
// kompakte Wörterbuch der Oberfläche in EINER Sprache (siehe ../i18n.js).
// Französisch: geschützte Leerzeichen über frenchTypography() wie bei Hotel & Objekt.
//
// Rein, ohne "@/"-Importe (node --test).
import { frenchTypography } from "../../hotel/content-intl.js";
import { compileCopy, createKpT, kpIdentity } from "../i18n.js";
import { UI_ROWS } from "./ui.js";
import { MELDUNG_ROWS } from "./meldungen.js";
import { DRUCK_ROWS } from "./druck.js";
// Fotoansicht (02.11.2026): Bildunterschrift, Blickwinkel, Abweichungen – Teil der Oberfläche.
import { FOTO_ROWS } from "./fotoansicht.js";

const COL = { en: 1, fr: 2, it: 3 };
export const KP_COPY_LOCALES = Object.freeze(["en", "fr", "it"]);

function dict(rows, locale) {
  const i = COL[locale];
  const out = {};
  for (const r of rows) out[r[0]] = locale === "fr" ? frenchTypography(r[i]) : r[i];
  return out;
}

const cache = new Map();
function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}

/** Wörterbuch der Oberfläche (Client) einer Sprache: { deutsch: übersetzt }; Deutsch → null. */
export function kpUiDict(locale) {
  if (!COL[locale]) return null;
  return cached(`ui-${locale}`, () => dict([...UI_ROWS, ...MELDUNG_ROWS, ...FOTO_ROWS], locale));
}

/** Kompaktes Wörterbuch für den Client (Props der Seite); Deutsch → null. */
export function kpClientCopy(locale) {
  if (!COL[locale]) return null;
  return cached(`client-${locale}`, () => compileCopy(kpUiDict(locale), locale));
}

/** Übersetzer für Server-Komponenten (Seite, Druckansicht): Oberfläche + Druckansicht. */
export function kpServerT(locale) {
  if (!COL[locale]) return kpIdentity;
  return cached(`t-${locale}`, () => createKpT(compileCopy({ ...kpUiDict(locale), ...dict(DRUCK_ROWS, locale) }, locale)));
}

/** Alle Zeilen (Tests: Parität, Typografie). */
export const KP_ROWS = Object.freeze({ ui: UI_ROWS, meldungen: MELDUNG_ROWS, druck: DRUCK_ROWS, fotoansicht: FOTO_ROWS });
