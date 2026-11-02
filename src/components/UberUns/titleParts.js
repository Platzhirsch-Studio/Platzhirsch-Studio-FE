// src/components/UberUns/titleParts.js – rein, ohne Importe (node:test).
/**
 * QM wm-r4 (iPhone SE): "Platzhirsch Home Living – / Einrichtungs-/studio …"
 * – the dash hung at a line end and the long compound was split. A title with
 * " – " now sets its second part on its own line (the dash stays for screen
 * readers, sr-only); titles with a word of 16+ letters get a phone size cap
 * (9.6 vw, below display-l from 320 to 416 px) so that word keeps one line.
 * Pure (returns strings/elements only).
 */
export function titleParts(title) {
  if (typeof title !== "string" || !title.includes(" – ")) return null;
  const i = title.indexOf(" – ");
  return [title.slice(0, i), title.slice(i + 3)];
}
export function hasLongWord(title, min = 16) {
  return typeof title === "string" && title.split(/\s+/).some((w) => w.length >= min);
}
/**
 * QM content-legal r3 (iPhone 15, 200 % Text): „Impress/um“, „Anfah/rt“,
 * „Datensc/hutz“ – short words were cut too, the 16-letter cap did not apply.
 * Font-size cap in vw so the LONGEST word of the title fits one phone line
 * (Bodoni ≈ 0.6–0.65 em per letter, ~80 % of the viewport usable with 200 % gutters): 120 / letters vw,
 * between 9.6 vw (the long-word cap above, soft hyphens do the rest) and 24 vw. At normal size the cap stays above display-l (no change);
 * it only bites with enlarged text. Pure.
 * @returns {string|null} e.g. "16.67vw", null for non-strings
 */
export function longestWordCap(title) {
  if (typeof title !== "string" || !title.trim()) return null;
  // Pass the title as rendered (hyphenateTitle): a no-break space keeps words
  // together ("und\u00A0Anfahrt" is one unit), a soft hyphen may break (piece + "-").
  const unit = (w) => {
    const parts = w.split("\u00AD");
    return parts.length > 1 ? Math.max(...parts.map((p) => p.length + 1)) : w.length;
  };
  const longest = Math.max(...title.trim().split(/[ \t\r\n]+/).map(unit));
  const vw = Math.min(24, Math.max(9.6, 120 / longest));
  return `${Math.round(vw * 100) / 100}vw`;
}
