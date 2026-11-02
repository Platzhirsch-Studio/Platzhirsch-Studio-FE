// src/components/NewsItem/leadImage.js – pure helpers of the news article opening
// (QM content-legal r3). Relative imports only (node --test).

/** Widest the lead photo is ever shown (CSS px) – QM r3 desktop: 235 px beside
 *  the text looked cheap; now in the header's photo column, never past the file. */
export const LEAD_MAX = 560;
/** Files up to this width are sent as they are (no srcset): next/image asked for
 *  w=1080 on a 3× phone and got the 684 px file back, so the browser took it for a
 *  228 px picture stretched 1.55× (QM r3 handys, upscaledImages=1). */
export const LEAD_DIRECT_MAX = 1200;

/**
 * Layout of the lead photo from its real pixel size: never wider than the file
 * (the backoffice photos are 170–460 px – at 480 × 320 they were upscaled 3–8×
 * in device pixels), its own aspect ratio (no 3:2 crop of a portrait file).
 * Unknown size → the former 3:2 box at LEAD_MAX.
 * @param {{width: number, height: number} | null} size
 * @returns {{width: number, aspect: string, known: boolean, direct: boolean}}
 */
export function leadLayout(size) {
  if (!size || !(size.width > 0) || !(size.height > 0)) return { width: LEAD_MAX, aspect: "3 / 2", known: false, direct: false };
  return {
    width: Math.min(size.width, LEAD_MAX),
    aspect: `${size.width} / ${size.height}`,
    known: true,
    direct: size.width <= LEAD_DIRECT_MAX,
  };
}

/**
 * "Flos – Ausdrucksstarke Leuchten-Designs" → ["Flos", "Ausdrucksstarke Leuchten-Designs"]:
 * a short brand part (≤ 3 words, ≤ 24 characters) before " – " becomes the small
 * first line of the H1 (screen readers still hear the dash). Otherwise null.
 * @param {string} title
 * @returns {[string, string] | null}
 */
export function splitKicker(title) {
  if (typeof title !== "string") return null;
  const i = title.indexOf(" – ");
  if (i <= 0) return null;
  const head = title.slice(0, i).trim();
  const rest = title.slice(i + 3).trim();
  if (!rest || head.length > 24 || head.split(/\s+/).length > 3) return null;
  return [head, rest];
}

/**
 * Visible article date, only for a real publication date (newsDates(): the
 * migration date is null) – "4. September 2025".
 * @param {string|null} iso
 * @param {string} locale
 * @returns {string|null}
 */
export function articleDate(iso, locale) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Vienna" }).format(d);
}
