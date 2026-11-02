// Sofaplaner – Wörterbücher FR/IT nachladen (Sprachen-Welle FR/IT, 01.11.2026).
// Je Sprache ein eigener Chunk (dynamischer Import): DE/EN-Seiten laden ihn nie,
// /fr/sofaplaner nur ui-fr.js, /it/sofaplaner nur ui-it.js. Kein Text in
// src/messages/*.json (Client-Budget ≤ 35 KB je Sprache).
// Server (page.js) und Browser (PlannerGate.js) warten auf loadDict(locale),
// bevor makeT(locale) / sourceCopy(locale) gelesen werden.
import { dictFor, registerDict } from "./t.js";

export const INTL_LOCALES = Object.freeze(["fr", "it"]);

const LOADERS = {
  fr: () => import("./ui-fr.js"),
  it: () => import("./ui-it.js"),
};

const pending = {};

/** true, wenn die Sprache ein nachgeladenes Wörterbuch braucht und es noch fehlt. */
export function needsDict(locale) {
  return !!LOADERS[locale] && !dictFor(locale);
}

/** Lädt das Wörterbuch einer Sprache einmal (Promise, stabil je Sprache); DE/EN → null. */
export function loadDict(locale) {
  if (!LOADERS[locale]) return Promise.resolve(null);
  const have = dictFor(locale);
  if (have) return Promise.resolve(have);
  pending[locale] ||= LOADERS[locale]().then((m) => {
    registerDict(locale, m.default);
    return m.default;
  });
  return pending[locale];
}
