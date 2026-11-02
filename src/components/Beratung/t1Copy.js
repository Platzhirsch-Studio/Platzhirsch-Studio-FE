// src/components/Beratung/t1Copy.js
// Rat 9,5 · Team T1 (Wege, Termin & Vertrauen): small text helpers. The texts
// themselves were taken over into src/messages/*.json on 30.10.2026
// (forms.attach, forms.trust, forms.draft, forms.moreTopics, termin.write,
// termin.tisch, inhalt.beratung.faq, contact.imageAlt, Footer.*); the former
// four-language fallback table is gone – components read the messages.
// No "@/..." imports: tested with node --test (tests/unit/rat95-t1-wege.test.mjs).

/**
 * "Ihr Ideenboard (3 Karten)" – count null → without number.
 * `t` = next-intl translator for the namespace "forms".
 */
export function boardLabel(t, count) {
  if (!Number.isInteger(count) || count < 1) return t("attach.boardUnknown");
  return t(count === 1 ? "attach.board.one" : "attach.board.other", { count });
}

// Rat 9,5 A1 (UX7): link texts of the former German-only /arbeitsweise ended
// with a language note ("How we work (in German)"); the take-over removed it
// from the messages, this guard keeps an old text from showing it again.
export function withoutLangNote(text) {
  return String(text || "").replace(/\s*\((?:in German|en allemand|in tedesco)\)\s*$/i, "");
}
