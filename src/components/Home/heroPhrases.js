// QM shell-home r3 (laptop/desktop EN/FR/IT): the hero H1 broke inside
// phrases ("Drawn by / hand", "à la / main", "a / mano"). splitPhrases() marks
// the phrases that should stay on one line; Hero.js wraps them in a span that
// is `nowrap` only while its container query (≥ 20rem, in REM) holds – with
// 200 % text the rem doubles, the query fails and the words may wrap again
// instead of running out of the column (WCAG 1.4.4). Pure, no JSX: tested
// with node --test (tests/unit/qm-shell-home-r3.test.mjs).
export const HERO_PHRASES = Object.freeze({
  de: ["Von Hand", "am Bodensee"],
  en: ["by hand", "on Lake"],
  fr: ["à la main", "au lac"],
  it: ["a mano", "sul Lago"],
});

/** @returns {{ text: string, keep: boolean }[]} – joined text === input */
export function splitPhrases(text, locale) {
  const s = String(text ?? "");
  const phrases = HERO_PHRASES[locale] || [];
  const out = [];
  let i = 0;
  while (i < s.length) {
    let hit = null;
    let at = s.length;
    for (const p of phrases) {
      const j = s.indexOf(p, i);
      if (j !== -1 && j < at) {
        at = j;
        hit = p;
      }
    }
    if (!hit) break;
    if (at > i) out.push({ text: s.slice(i, at), keep: false });
    out.push({ text: hit, keep: true });
    i = at + hit.length;
  }
  if (i < s.length) out.push({ text: s.slice(i), keep: false });
  return out;
}
