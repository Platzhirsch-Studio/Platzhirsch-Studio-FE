"use client";
// <UploadHandoff> on demand (R5-leads-perf, TBT of the form pages).
// The card is only shown after a successful send, yet a static import put it,
// lib/upload/config.js (Intl formatters, limits), lib/upload/messages.js and
// its icons into the first-load bundle of /kontakt, /beratung and every
// product page. Now:
//   - <UploadHandoff> = next/dynamic (own chunk, rendered only with `handoff`),
//   - loadHandoff() = the same chunk as a promise, for handoffFrom() after the
//     send; prefetchHandoff() warms it on the first focus in a form.
// Interface of the card unchanged (Upload/UploadHandoff.js, R2 contract).
// R6-leads fix (Teamleiter P2-1, WCAG 3.1.2): the card's copy is German only
// (Upload package, no messages yet). It is shown only where the page language
// is in HANDOFF_LOCALES; on en/fr/it the success message stands alone and the
// chunk is never loaded. Add a locale here once the Upload package has its
// texts in src/messages/*.json.
import dynamic from "next/dynamic";

export const HANDOFF_LOCALES = new Set(["de"]);

/** true if the upload card may be shown in this page language. */
export function handoffAllowed(locale) {
  return HANDOFF_LOCALES.has(String(locale || "").toLowerCase());
}

let handoffModule = null;

/** Promise of the UploadHandoff module (one request, retried after a failure). */
export function loadHandoff() {
  if (!handoffModule) {
    handoffModule = import("@/components/Upload/UploadHandoff").catch((error) => {
      handoffModule = null; // offline for a moment: a later attempt may work
      throw error;
    });
  }
  return handoffModule;
}

/** Fire-and-forget prefetch (onFocus of the form); no-op where the card is off. */
export function prefetchHandoff(locale) {
  if (!handoffAllowed(locale)) return;
  loadHandoff().catch(() => {});
}

/**
 * Props for <UploadHandoff> from a send, via the lazily loaded handoffFrom().
 * Resolves to null if the chunk cannot be loaded or the page language has no
 * card texts (`options.locale`, see HANDOFF_LOCALES); the success message stays.
 */
export function handoffAfterSend(kind, options = {}) {
  const { locale, ...rest } = options;
  if (!handoffAllowed(locale)) return Promise.resolve(null);
  return loadHandoff()
    .then(({ handoffFrom }) => handoffFrom(kind, rest))
    .catch(() => null);
}

export const UploadHandoff = dynamic(loadHandoff);
